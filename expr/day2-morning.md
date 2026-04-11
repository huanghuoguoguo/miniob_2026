# 第二天上午：Record Manager 与 Text / Update 实现

> 阅读说明：本文面向同学课前预习。阅读时建议先抓住三条线：记录怎么落到页里、`TEXT` 为什么不能继续按定长列处理、`UPDATE` 为什么会和记录重写连在一起。

## 一、引言

昨天我们了解了数据库的基本架构和 B+树索引。今天深入一个更基础的问题：记录是怎么存储在磁盘上的？

在开始之前，先整体看一下 MiniOB 中各个模块之间的关系：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Db                                          │
│                         （数据库实例）                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  opened_tables_: map<string, Table*>                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│         │                              │                                 │
│         ▼                              ▼                                 │
│  ┌─────────────┐                ┌─────────────┐                         │
│  │   Table     │                │   Table     │        ...              │
│  │  (users)    │                │  (orders)   │                         │
│  └─────────────┘                └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │  持有
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Table                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  TableMeta   │  │ RecordFileHandler│  │ vector<Index*> indexes_  │  │
│  │  (字段定义)   │  │  (记录管理器)     │  │  (表的索引列表)           │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                       │
         │                    │                       ▼
         │                    │         ┌─────────────────────────────────┐
         │                    │         │          Index                  │
         │                    │         │    (BplusTreeIndex)             │
         │                    │         │  ┌────────────────────────────┐ │
         │                    │         │  │ BplusTreeHandler           │ │
         │                    │         │  │  (B+树操作)                 │ │
         │                    │         │  └────────────────────────────┘ │
         │                    │         └─────────────────────────────────┘
         │                    │                       │
         │                    │                       │ 索引通过 RID 指向记录
         │                    │                       ▼
         │                    ▼
         │    ┌───────────────────────────────────────────────────────────┐
         │    │                    Record Manager                         │
         │    │  ┌─────────────────────────────────────────────────────┐ │
         │    │  │ RecordFileHandler                                   │ │
         │    │  │  ├── insert_record()  → 返回 RID                    │ │
         │    │  │  ├── delete_record(RID)                            │ │
         │    │  │  ├── get_record(RID)   → 返回 Record               │ │
         │    │  │  └── scan()            → 遍历所有记录               │ │
         │    │  └─────────────────────────────────────────────────────┘ │
         │    │                            │                              │
         │    │                            │ 通过 Buffer Pool 读写页面     │
         │    └────────────────────────────┼──────────────────────────────┘
         │                                 │
         ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Buffer Pool                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Frame 数组（内存中的页面缓存）                                       ││
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                           ││
│  │  │Frame 0│ │Frame 1│ │Frame 2│ │Frame 3│ ...                       ││
│  │  │Page A │ │Page B │ │Page C │ │Page D │                           ││
│  │  └───────┘ └───────┘ └───────┘ └───────┘                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    ↕                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            磁盘文件                                      │
│  users.table    users.data    users.lob    idx_users_name.index        │
│  (表元数据)      (记录数据)    (大对象)      (索引文件)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

几个关键关系：

1. **Db 持有 Table**：一个数据库实例管理多张表，通过 `opened_tables_` 映射表名到 Table 对象

2. **Table 持有三样东西**：
   - TableMeta：字段定义、表名等元数据
   - RecordFileHandler：管理记录的增删改查
   - Index 列表：表上的所有索引

3. **Index 通过 RID 指向 Record**：索引的叶子节点存储 RID（页号+槽号），通过 RID 可以在 Record Manager 中找到对应记录

4. **Record Manager 通过 Buffer Pool 读写页面**：所有页面操作都经过 Buffer Pool，Buffer Pool 负责缓存管理

5. **Buffer Pool 是底层共享的**：Record Manager 和 Index 都通过 Buffer Pool 访问各自的页面

---

现在深入具体的问题：记录是怎么存储在磁盘上的？

你可能已经知道磁盘以页面为单位读写，但具体到一条条记录，它们是怎么塞进页面的？删除一条记录后，空间怎么回收？变长字段（比如博客文章）怎么存？

这些问题就是 Record Manager 要解决的。

学习目标：
- 理解记录的存储格式（定长 vs 变长）
- 掌握页面结构与 RID（Record ID）的概念
- 了解 MiniOB 中 Record Manager 的实现
- 理解并实现 text 类型支持

---

## 二、页面与记录

### 2.1 页面结构

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

页面结构为什么用 Bitmap？
- 快速找到空闲槽位：扫描位图的 0 位
- 删除记录只需将对应位设为 0
- 空间高效：1 个字节管理 8 个槽位

### 2.2 RID（Record ID）：记录的唯一标识

要在页面中定位一条记录，需要两个信息：

1. 页号（PageNum）：记录在哪个页面
2. 槽号（SlotNum）：记录在页面的哪个位置

```cpp
struct RID {
  PageNum page_num;  // 页号
  SlotNum slot_num;  // 槽号
};
```

RID 的作用：
- 索引通过 RID 指向记录
- 删除、修改操作通过 RID 定位记录
- 类似于内存地址，但是针对磁盘数据

> 为什么不用文件偏移量而是用 RID？
> - 页面内部可能重组（删除后空间整理）
> - RID 更稳定，页面重组时只需更新页内映射

### 2.3 定长记录 vs 变长记录

定长记录：每条记录大小固定

```
| id(4B) | age(4B) | score(4B) |  ← 每条记录 12 字节
```

优点：计算简单，第 n 条记录位置 = n × 12
缺点：空间浪费（age 永远是整数，4 字节够用）

变长记录：记录大小不固定

```
| id(4B) | name_len(4B) | name(N字节) |  ← 长度不固定
```

优点：节省空间
缺点：需要额外信息记录长度，访问复杂

MiniOB 的选择：当前主要支持定长记录，变长字段（如 text）有特殊处理。

---

## 三、MiniOB 中的 Record Manager

### 3.1 代码结构

核心目录：`src/observer/storage/record/`

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

### 4.1 从调试 CHARS 类型开始

在实现 TEXT 类型之前，先观察一下现有的 CHARS 类型是如何工作的。

#### 调试任务

1. 创建一个带 CHARS 字段的表：
```sql
CREATE TABLE users(id int, name char(20));
INSERT INTO users VALUES(1, 'Alice');
SELECT * FROM users;
```

2. 在以下位置打断点：
   - `common/type/char_type.cpp` — CHARS 类型操作
   - `storage/table/table.cpp` 的 `make_record()` — 记录构造

3. 观察问题：
   - `name char(20)` 分配了多少字节？
   - 插入 "Alice"（5字符）后，剩余 15 字节存储了什么？
   - 如果插入 "A very very long name that exceeds 20 chars" 会怎样？

#### 你会看到什么

```cpp
// char_type.cpp 中
// char(20) 固定分配 20 字节
// "Alice" 只有 5 字节，剩余 15 字节填充空格或 '\0'
```

CHARS 的问题：

| 场景 | 问题 |
|------|------|
| 存储短字符串 | 空间浪费（20字节只用了5字节） |
| 存储长字符串 | 存不下（超过长度限制会报错或截断） |
| 存储文章内容 | char 最大只能定义有限长度 |

### 4.2 如何支持变长文本？

思考：如果要存储一篇博客文章（可能几千字），该怎么办？

#### 方案一：加大 char 长度？

```sql
CREATE TABLE articles(
  id int,
  content char(10000)  -- 问题：每条记录都占 10KB，即使内容很短
);
```

问题：空间浪费严重。

#### 方案二：变长存储

```sql
CREATE TABLE articles(
  id int,
  content text  -- 按实际长度存储
);
```

实现思路：
- 短文本：直接存在记录中（内联）
- 长文本：存到单独的 LOB 文件，记录中只存指针

### 4.3 TEXT 类型的存储策略

MiniOB 使用混合策略优化 TEXT 存储：

```
┌─────────────────────────────────────────────────────┐
│                  TEXT 存储策略                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  短文本（≤ 内联阈值）：                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ 记录数据区                                   │   │
│  │ ┌──────┬────────────────────────────────┐   │   │
│  │ │ len  │ "Hello World" (直接内联存储)    │   │   │
│  │ │ 4字节│ 11字节                          │   │   │
│  │ └──────┴────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  长文本（> 内联阈值）：                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ 记录数据区                LOB 文件           │   │
│  │ ┌──────┬──────────┐      ┌───────────────┐ │   │
│  │ │ len  │ 指针     │ ───→ │ "很长的..."    │ │   │
│  │ │ 4字节│ 8字节    │      │ (独立存储)     │ │   │
│  │ └──────┴──────────┘      └───────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

> 内联存储访问快但占固定空间，指针存储节省空间但需要额外 I/O 读取 LOB。阈值选择要根据实际数据分布调整。

### 4.4 实现步骤

#### 步骤 1：添加类型枚举

文件：`src/observer/common/type/attr_type.h`

```cpp
enum class AttrType {
  UNDEFINED,
  CHARS,
  INTS,
  FLOATS,
  TEXTS,      // 新增
  // ...
};
```

同时添加类型名称映射：

```cpp
// attr_type.cpp
const char *attr_type_to_string(AttrType type) {
  switch (type) {
    case AttrType::TEXTS: return "text";
    // ...
  }
}
```

#### 步骤 2：实现 TextType 类

文件：`src/observer/common/type/text_type.h`

```cpp
class TextType : public DataType
{
public:
  TextType() : DataType(AttrType::TEXTS) {}

  int compare(const Value &left, const Value &right) const override;
  RC cast_to(const Value &val, AttrType type, Value &result) const override;
  RC set_value_from_str(Value &val, const string &data) const override;
  int cast_cost(AttrType type) override;
  RC to_string(const Value &val, string &result) const override;
};
```

text_type.cpp 核心实现：

```cpp
int TextType::compare(const Value &left, const Value &right) const
{
  // 比较两个 text 值
  const string &left_str = left.get_string();
  const string &right_str = right.get_string();
  return left_str.compare(right_str);
}

RC TextType::set_value_from_str(Value &val, const string &data) const
{
  // 从字符串设置 text 值
  val.set_string(data.c_str(), data.length());
  val.set_type(AttrType::TEXTS);
  return RC::SUCCESS;
}
```

#### 步骤 3：添加词法关键字

文件：`src/observer/sql/parser/lex_sql.l`

```
TEXT      RETURN_TOKEN(TEXT);
```

#### 步骤 4：添加语法规则

文件：`src/observer/sql/parser/yacc_sql.y`

```yacc
// 类型定义规则
type:
    INT       { $$ = AttrType::INTS; }
  | FLOAT     { $$ = AttrType::FLOATS; }
  | CHAR      { $$ = AttrType::CHARS; }
  | TEXT      { $$ = AttrType::TEXTS; }  // 新增
  ;

// TEXT 类型默认长度
attr_def:
    type ID {
      // ...
      if ($1 == AttrType::TEXTS) {
        $$->type = AttrType::TEXTS;
        $$->len = 4096;  // TEXT 默认最大长度
      }
    }
```

#### 步骤 5：类型转换支持

TEXT 应该能接受 CHARS 类型的值：

文件：`src/observer/common/type/char_type.cpp`

```cpp
RC CharType::cast_to(const Value &val, AttrType type, Value &result) const
{
  switch (type) {
    case AttrType::TEXTS:
      // CHARS 可以隐式转换为 TEXT
      result.set_string(val.value_.string_value_, val.length_);
      result.set_type(AttrType::TEXTS);
      return RC::SUCCESS;
    // ...
  }
}
```

### 4.5 完整调用链

```
CREATE TABLE articles(id int, content text);
              ↓
yacc_sql.y: 解析 TEXT 类型 → AttrType::TEXTS
              ↓
TableMeta::add_field(): 记录字段类型和长度(默认4096)
              ↓
INSERT INTO articles VALUES(1, 'Hello World');
              ↓
Table::make_record():
  检查 content 字段类型是 TEXTS
  调用 TextType::set_value_from_str()
              ↓
Record::set_data(): 存储到记录中
  短文本：内联存储
  长文本：写入 LOB 文件，存储指针
```

### 4.6 调试验证

1. 创建 TEXT 类型表并插入数据：
```sql
CREATE TABLE test_text(id int, content text);
INSERT INTO test_text VALUES(1, 'short text');
INSERT INTO test_text VALUES(2, 'a very very long text...');
SELECT * FROM test_text;
```

2. 在以下位置打断点验证：
   - `text_type.cpp:compare()` — 比较操作
   - `char_type.cpp:cast_to()` — 类型转换

3. 检查生成的表元数据文件（`.table`）

### 4.7 实践任务

1. 在 `feature/text-type` 分支查看完整实现
2. 自己实现一遍 TEXT 类型支持
3. 测试边界情况：
   - 空字符串
   - 超长字符串
   - CHARS 到 TEXT 的类型转换
4. 思考：如何支持 TEXT 类型的索引？

---

## 五、UPDATE 语句实现

实现了 TEXT 类型后，我们可以用 UPDATE 语句来测试它。

### 5.1 从 DELETE 到 UPDATE

回顾一下 DELETE 的实现：
1. 找到符合条件的记录
2. 删除这些记录

UPDATE 的逻辑类似，但不是删除，而是修改后重新插入：

```
DELETE: 查找 → 删除记录
UPDATE: 查找 → 构造新记录 → 删除旧记录 → 插入新记录
```

> 为什么不直接修改记录，而是删除后重新插入？
>
> 提示：考虑变长字段（如 TEXT）、索引维护、事务日志...

### 5.2 UPDATE 的处理流程

```
UPDATE users SET name='Bob' WHERE id=1
              ↓
┌──────────────────────────────────────────────────┐
│  Parser (yacc_sql.y)                             │
│  解析为 UpdateSqlNode:                           │
│    table = "users"                               │
│    attribute_name = "name"                       │
│    value = "Bob"                                 │
│    conditions = [id=1]                           │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  UpdateStmt::create()                            │
│  验证表存在、字段存在、类型匹配                    │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  Logical Plan Generator                          │
│  生成 UpdateLogicalOperator                      │
│  子节点：Scan + Filter（找符合条件的记录）         │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  Physical Plan Generator                         │
│  生成 UpdatePhysicalOperator                     │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  UpdatePhysicalOperator::open()                  │
│  1. 从子算子获取所有符合条件的记录                 │
│  2. 对每条记录：                                  │
│     - 复制数据，修改目标字段                       │
│     - delete_record(旧记录)                       │
│     - insert_record(新记录)                       │
└──────────────────────────────────────────────────┘
```

### 5.3 关键代码

#### UpdateStmt（语句对象）

```cpp
class UpdateStmt : public Stmt
{
private:
  Table      *table_;       // 目标表
  FieldMeta  *field_meta_;  // 要修改的字段
  Value      *value_;       // 新值
  FilterStmt *filter_stmt_; // WHERE 条件
};
```

#### UpdatePhysicalOperator（物理算子）

```cpp
RC UpdatePhysicalOperator::open(Trx *trx)
{
  // 1. 从子算子收集所有符合条件的记录
  while (child->next()) {
    records_.push_back(record);
  }

  // 2. 对每条记录执行更新
  for (Record &old_record : records_) {
    // 复制旧数据
    char *new_data = malloc(record_size);
    memcpy(new_data, old_record.data(), record_size);

    // 修改目标字段
    memcpy(new_data + field_meta_->offset(), value_->data(), value_->length());

    // 创建新记录
    Record new_record;
    new_record.set_data_owner(new_data, record_size);

    // 删除旧记录，插入新记录
    trx->delete_record(table_, old_record);
    trx->insert_record(table_, new_record);
  }
}
```

> 注意：这里使用 malloc() 而不是 new[]，因为 Record::~Record() 使用 free() 释放内存。内存分配和释放必须配对使用。

### 5.4 调试与测试

1. 测试 UPDATE 基本功能：
```sql
CREATE TABLE users(id int, name char(20));
INSERT INTO users VALUES(1, 'Alice');
UPDATE users SET name='Bob' WHERE id=1;
SELECT * FROM users;
```

2. 测试 TEXT 类型更新：
```sql
CREATE TABLE articles(id int, content text);
INSERT INTO articles VALUES(1, 'old content');
UPDATE articles SET content='new content here' WHERE id=1;
SELECT * FROM articles;
```

3. 关键断点：
   - `stmt/update_stmt.cpp:create()` — 语句创建
   - `operator/update_physical_operator.cpp:open()` — 执行更新

### 5.5 实践任务

1. 在 `feature/text-type` 分支查看 UPDATE 实现
2. 理解"删除+插入"模式的优缺点
3. 思考：如果要支持 `UPDATE t SET a=a+1`，需要修改什么？

---

## 六、总结与思考

### 6.1 核心要点

- 页面是磁盘 I/O 的基本单位，记录存储在页面中
- RID（页号 + 槽号）唯一标识一条记录
- Bitmap 管理页面中的空闲槽位
- Text 类型支持变长长文本，短文本内联优化，长文本使用 LOB 存储

### 6.2 延伸思考

1. 为什么记录不直接存储在 B+树中？
   - B+树索引用于快速查找，记录存储是另一套机制
   - 分离关注点：索引负责定位，Record Manager 负责存储

2. 删除记录后，空间如何回收？
   - Bitmap 标记槽位空闲
   - 新记录可以复用空闲槽位
   - 页面级压缩？还是表级压缩？

3. Text 类型如何支持索引？
   - 可以对 text 字段建立前缀索引
   - 或者对全文建立倒排索引（搜索引擎）

---

## 七、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- `src/observer/storage/record/record_manager.h` - Record Manager 核心定义
- `src/observer/storage/record/lob_handler.h` - LOB 处理器
- `src/observer/common/type/string_t.h` - 字符串内存表示
- `docs/design/miniob-realtime-analytic.md` - 设计文档中关于 text 类型的说明
