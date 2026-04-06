# 第二天上午：Record Manager 与 Text 类型实现

## 一、引言

### 1.1 回顾：数据是如何存储的？

在之前的学习中，我们了解了：

- **最小存储结构**：`map<string, value>` 可以实现简单的键值存储
- **持久化**：将内存中的数据序列化到磁盘文件
- **索引**：B+树加速查询

但是，有一个问题我们还没有深入讨论：**数据在磁盘上到底是怎么组织的？**

### 1.2 思考：如何存储一条记录？

假设我们要存储一条用户记录：

```
id=1, name="Alice", age=25
```

**最简单的方式**：直接写成文本

```
id=1,name=Alice,age=25\n
id=2,name=Bob,age=30\n
```

**问题来了**：

1. **如何修改**？要改 age=26，需要重写整行？
2. **如何删除**？删除中间一行，后面的行都要移动？
3. **变长字段怎么办**？name 从 "Bob" 改成 "Elizabeth"，长度变了怎么办？
4. **如何快速定位**？找到第 100 万条记录，需要从头扫描？

这些问题就是 **Record Manager** 要解决的。

### 1.3 学习目标

- 理解记录的存储格式（定长 vs 变长）
- 掌握页面结构与 RID（Record ID）的概念
- 了解 MiniOB 中 Record Manager 的实现
- 实现 text 类型支持

---

## 二、页面与记录

### 2.1 为什么以"页"为单位？

回顾一下磁盘的工作方式：

```
┌──────────────────────────────────────────────────────┐
│                    磁盘结构                           │
├──────────────────────────────────────────────────────┤
│  页面0   │  页面1   │  页面2   │  页面3   │   ...    │
│  4KB     │  4KB     │  4KB     │  4KB     │          │
└──────────────────────────────────────────────────────┘
```

**操作系统以页面（Page）为单位管理内存和磁盘**：

- 内存页面：4KB（通常）
- 磁盘页面：与内存页面大小对齐
- 一次 I/O 读取一个或多个页面

> **Trade-off 思考**：
> - 页面太小：I/O 次数多，效率低
> - 页面太大：浪费内存，并发冲突多
> - 4KB 是经验值，平衡了各种因素

### 2.2 页面结构

MiniOB 中，一个数据页面的结构如下：

```
┌─────────────────────────────────────────────────────────┐
│                     Page Header                          │
│  ├─ record_num: 当前页记录数                              │
│  ├─ record_size: 每条记录大小                             │
│  └─ record_capacity: 最大记录数                          │
├─────────────────────────────────────────────────────────┤
│                     Bitmap                                │
│  ├─ 位图，标记每个槽位是否有数据                           │
│  └─ 第 n 位为 1 表示第 n 个槽位有数据                      │
├─────────────────────────────────────────────────────────┤
│                     Record Data                           │
│  ├─ record_0                                              │
│  ├─ record_1                                              │
│  ├─ ...                                                   │
│  └─ record_N                                              │
└─────────────────────────────────────────────────────────┘
```

**为什么用 Bitmap？**

- 快速找到空闲槽位：扫描位图的 0 位
- 删除记录只需将对应位设为 0
- 空间高效：1 个字节管理 8 个槽位

### 2.3 RID（Record ID）：记录的唯一标识

要在页面中定位一条记录，需要两个信息：

1. **页号（PageNum）**：记录在哪个页面
2. **槽号（SlotNum）**：记录在页面的哪个位置

```cpp
struct RID {
  PageNum page_num;  // 页号
  SlotNum slot_num;  // 槽号
};
```

**RID 的作用**：

- 索引通过 RID 指向记录
- 删除、修改操作通过 RID 定位记录
- 类似于"内存地址"，但是针对磁盘数据

> **思考**：为什么不用"文件偏移量"而是用 RID？
> - 页面内部可能重组（删除后空间整理）
> - RID 更稳定，页面重组时只需更新页内映射

### 2.4 定长记录 vs 变长记录

**定长记录**：每条记录大小固定

```
| id(4B) | age(4B) | score(4B) |  ← 每条记录 12 字节
```

- **优点**：计算简单，第 n 条记录位置 = n × 12
- **缺点**：空间浪费（age 永远是整数，4 字节够用）

**变长记录**：记录大小不固定

```
| id(4B) | name_len(4B) | name(N字节) |  ← 长度不固定
```

- **优点**：节省空间
- **缺点**：需要额外信息记录长度，访问复杂

**MiniOB 的选择**：当前主要支持定长记录，变长字段（如 text）有特殊处理。

---

## 三、MiniOB 中的 Record Manager

### 3.1 代码结构

**核心目录**：`src/observer/storage/record/`

| 文件 | 说明 |
|------|------|
| `record.h` | RID 和 Record 结构定义 |
| `record_manager.h/cpp` | 记录管理核心实现 |
| `record_scanner.h/cpp` | 记录扫描器 |
| `heap_record_scanner.h/cpp` | 堆表扫描器 |
| `lob_handler.h/cpp` | 大对象处理器（用于 text） |

### 3.2 核心类结构

```
RecordManager
  ├── create_file()              创建记录文件
  ├── open_file()                打开记录文件
  └── close_file()               关闭记录文件

RecordFileHandler
  ├── insert_record()            插入记录
  ├── delete_record()            删除记录
  ├── update_record()            更新记录
  └── get_record()               获取记录

RecordPageHandler
  ├── 页面级别的记录操作
  └── 管理 Bitmap 和记录槽位

RecordScanner
  ├── scan_begin()               开始扫描
  ├── has_next()                 是否有下一条
  └── next()                     获取下一条记录
```

### 3.3 插入记录流程

```
INSERT INTO users VALUES(1, 'Alice', 25)
          ↓
┌─────────────────────────────────────────────┐
│  找到有空间的页面                             │
│  （或创建新页面）                             │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  在 Bitmap 中找到空闲槽位                     │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  写入记录数据到槽位                           │
│  更新 Bitmap 和 PageHeader                   │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  返回 RID（页号 + 槽号）                      │
└─────────────────────────────────────────────┘
```

### 3.4 关键断点位置

| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `record/record_manager.cpp` | - | `insert_record()` | 插入记录入口 |
| `record/record_manager.cpp` | - | `delete_record()` | 删除记录入口 |
| `record/record_manager.h` | 67-78 | `PageHeader` | 页面头结构 |
| `record/record.h` | 34-83 | `RID` | 记录标识符 |
| `storage/table/heap_table_engine.cpp` | - | `insert_record()` | 表插入调用 |

---

## 四、Text 类型实现

### 4.1 为什么需要 Text 类型？

现有的 `CHARS` 类型是**定长字符串**：

```sql
CREATE TABLE users(
  id int,
  name char(20),    -- 固定 20 字节，不足补空格
  intro char(100)   -- 固定 100 字节
);
```

**问题**：

1. **空间浪费**：简介可能只有 10 字节，却分配了 100 字节
2. **长度限制**：想要存储文章内容（可能几 KB），char 不够用
3. **灵活性差**：长度需要在建表时确定

**TEXT 类型**解决这些问题：

```sql
CREATE TABLE articles(
  id int,
  title char(100),
  content text    -- 变长，最大 65535 字节
);
```

### 4.2 Text 与 Char 的区别

| 特性 | CHARS | TEXT |
|------|-------|------|
| 存储方式 | 定长，页面内存储 | 变长，可能溢出到 LOB 文件 |
| 最大长度 | 建表时指定 | 65535 字节 |
| 空间效率 | 可能浪费 | 按需分配 |
| 适用场景 | 短文本（姓名、电话） | 长文本（文章、日志） |

### 4.3 实现思路

#### 短文本优化

对于短文本（如 ≤12 字节），直接内联存储，避免额外内存分配：

```
┌─────────────────────────────────┐
│  string_t 结构                   │
├─────────────────────────────────┤
│  长度 ≤ 12 字节：                 │
│  ┌─────────────────────────┐    │
│  │ data[12] (内联存储)      │    │
│  └─────────────────────────┘    │
│                                 │
│  长度 > 12 字节：                 │
│  ┌─────────────────────────┐    │
│  │ pointer (指向堆内存)     │    │
│  │ length                  │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### 长文本存储

对于超长文本，使用 **LOB（Large Object）** 存储：

```
┌──────────────────────────────────────────────────┐
│                   数据页面                         │
│  ┌──────────────────────────────────────────┐    │
│  │ id | title | content_lob_ptr             │    │
│  │ 1  | "..." | → LOB 文件偏移量             │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│                   LOB 文件                        │
│  ┌──────────────────────────────────────────┐    │
│  │ 长文本内容...（可能跨多个页面）             │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### 4.4 需要修改的关键位置

#### 1. 类型枚举（attr_type.h）

添加 TEXT 类型：

```cpp
enum class AttrType {
  UNDEFINED,
  CHARS,
  INTS,
  FLOATS,
  TEXTS,      // 新增 TEXT 类型
  // ...
};
```

**文件**：`src/observer/common/type/attr_type.h`

#### 2. 类型实现（text_type.h/cpp）

创建 TextType 类，参考 CharType 实现：

```cpp
class TextType : public DataType {
public:
  int compare(const Value &left, const Value &right) const override;
  RC add(const Value &left, const Value &right, Value &result) const override;
  // ...
};
```

#### 3. 词法解析（lex_sql.l）

添加 TEXT 关键字：

```
TEXT      RETURN_TOKEN(TEXT);
```

**文件**：`src/observer/sql/parser/lex_sql.l`

#### 4. 语法解析（yacc_sql.y）

支持 TEXT 类型定义：

```yacc
type:
    INT       { $$ = AttrType::INTS; }
  | FLOAT     { $$ = AttrType::FLOATS; }
  | CHAR      { $$ = AttrType::CHARS; }
  | TEXT      { $$ = AttrType::TEXTS; }  // 新增
  ;
```

**文件**：`src/observer/sql/parser/yacc_sql.y`

#### 5. LOB 处理器（lob_handler.h/cpp）

实现大对象的存储和读取：

```cpp
class LobHandler {
public:
  RC write_lob(const char *data, int length, LobPointer &ptr);
  RC read_lob(const LobPointer &ptr, char *data, int &length);
  RC delete_lob(const LobPointer &ptr);
};
```

**文件**：`src/observer/storage/record/lob_handler.h`

#### 6. Value 类（value.h）

支持 TEXT 类型的值存储：

```cpp
class Value {
private:
  AttrType type_;
  union {
    int int_value_;
    float float_value_;
    char *char_value_;
    string_t text_value_;  // 新增
  };
};
```

**文件**：`src/observer/common/value.h`

### 4.5 实现步骤

1. **定义类型**：在 `attr_type.h` 添加 TEXTS 枚举
2. **实现 TextType**：创建 `text_type.h/cpp`，实现比较、转换等方法
3. **修改解析器**：添加 TEXT 关键字和语法规则
4. **修改 Value 类**：支持存储 text 类型值
5. **实现 LOB 存储**：完成 `lob_handler.cpp` 的读写功能
6. **修改记录存储**：处理 text 字段的存储和读取

---

## 五、调试建议

### 5.1 调试 Record Manager

1. 在 `RecordFileHandler::insert_record()` 打断点
2. 执行 `INSERT INTO test VALUES(...)`
3. 观察：
   - 页面分配过程
   - Bitmap 的变化
   - RID 的生成

### 5.2 调试 Text 类型

1. 先测试短文本（≤12 字节）
2. 再测试长文本，观察是否使用 LOB
3. 使用 `EXPLAIN` 查看执行计划
4. 检查序列化/反序列化是否正确

---

## 六、总结与思考

### 6.1 核心要点

- **页面**是磁盘 I/O 的基本单位，记录存储在页面中
- **RID**（页号 + 槽号）唯一标识一条记录
- **Bitmap** 管理页面中的空闲槽位
- **Text 类型**支持变长长文本，短文本内联优化，长文本使用 LOB 存储

### 6.2 延伸思考

1. **为什么记录不直接存储在 B+树中？**
   - B+树索引用于快速查找，记录存储是另一套机制
   - 分离关注点：索引负责定位，Record Manager 负责存储

2. **删除记录后，空间如何回收？**
   - Bitmap 标记槽位空闲
   - 新记录可以复用空闲槽位
   - 页面级压缩？还是表级压缩？

3. **Text 类型如何支持索引？**
   - 可以对 text 字段建立前缀索引
   - 或者对全文建立倒排索引（搜索引擎）

---

## 七、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- `src/observer/storage/record/record_manager.h` - Record Manager 核心定义
- `src/observer/storage/record/lob_handler.h` - LOB 处理器
- `src/observer/common/type/string_t.h` - 字符串内存表示
- `docs/design/miniob-realtime-analytic.md` - 设计文档中关于 text 类型的说明