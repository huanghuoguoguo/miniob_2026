# 第一天下午：B+树与多列索引实现

> 阅读说明：本文面向同学课前预习。重点不是把 B+ 树所有细节一次记完，而是先搞清楚“为什么数据库偏爱 B+ 树，以及多列索引大概要改哪些位置”。

## 学习目标

- 理解为什么数据库索引必须考虑磁盘 I/O，而不是只看理论时间复杂度
- 建立对 B+树结构、查找路径、分裂机制和叶子链表作用的基本直觉
- 看懂 MiniOB 中 `CREATE INDEX` 的主要调用链，知道索引创建落在哪些模块
- 明确多列索引实现的关键改动点：解析层、Stmt 层、元数据层、键组织与比较逻辑

## 本文主线

这份预习材料不追求把 B+树所有细节一次讲完，而是围绕一条主线推进：

1. 为什么数据库更偏爱 B+树，而不是 HashMap、红黑树
2. B+树在结构上如何减少磁盘 I/O，并支持范围查询
3. MiniOB 里单列索引是怎么创建出来的
4. 如果把单列索引扩展成多列索引，需要改哪些代码位置、为什么要这样改

## 一、引言

上午我们讨论了数据库的基本问题：持久化、查询效率、为什么需要索引。现在我们深入学习数据库最常用的索引结构——B+树。

> 回顾上午内容：
> - 数据库解决的问题：持久化、查询效率、并发控制、事务、一致性
> - 为什么 txt 文件查询慢：磁盘以页面为单位读写，随机 I/O 开销大
> - 索引的本质：空间换时间，建立"字段值 → 记录位置"的映射
>
> 详细内容请参考上午文档的"从最小存储结构开始理解"章节。

---

上午我们得出结论：索引能加速查询。但一个自然的问题来了——

索引应该用什么数据结构实现？

你可能会想：
- 用数组？二分查找 O(log n)，挺快的
- 用链表？插入删除方便
- 用哈希表？O(1) 查找，更快
- 用二叉搜索树？平衡的话也是 O(log n)

反正数据存在硬盘上都是字节，用什么结构存不都一样吗？

还真不一样。要回答这个问题，我们需要先了解一个关键事实：磁盘和内存的工作方式完全不同。这一差异，决定了数据库索引的选择。

## 二、磁盘存储与数据结构选择

### 2.1 磁盘的物理单位

磁盘存储有几个关键单位：

| 单位 | 大小 | 说明 |
|------|------|------|
| 扇区 | 通常 512B | 磁盘的最小物理单位 |
| 块/页 | 通常 4KB | 文件系统的逻辑单位 |
| 磁盘页 | 通常 4KB | 数据库的基本 I/O 单位 |

一次 I/O 操作读写一个页，不是单个字节。

#### 文件在磁盘上的存储

文件在磁盘上不一定是连续的：

```
文件 data.txt 的内容被分成多个块：
┌──────┐     ┌──────┐     ┌──────┐
│ 块 1 │     │ 块 2 │     │ 块 3 │
└──────┘     └──────┘     └──────┘
   ↓            ↓            ↓
磁盘块 100    磁盘块 205    磁盘块 38
（位置分散！）
```

文件系统通过 inode（Linux）或 FAT表（Windows）记录每个文件块的位置。读取文件时，需要先查 inode 获取块地址，再逐块读取。

#### 顺序读 vs 随机读

| 类型 | 特点 | 速度 |
|------|------|------|
| 顺序读 | 连续读取相邻块 | 快（磁头移动少，预读有效） |
| 随机读 | 跳跃读取分散块 | 慢（每次都要寻道） |

机械硬盘：随机读需要磁头寻道，约 10ms/次
SSD：虽无机械寻道，但随机读仍有开销

> 记住这一点：一次 I/O 很贵！数据库设计的核心目标之一就是减少磁盘 I/O 次数。

### 2.2 为什么是 B+树而不是其他数据结构？

既然索引要"快速查找"，为什么不用 HashMap？

| 数据结构 | 查找效率 | 问题 |
|----------|----------|------|
| HashMap | O(1) | 不支持范围查询（查 20<age<30） |
| 二叉搜索树 | O(log n) | 可能退化成链表，树太高 |
| 红黑树 | O(log n) | 树高度大，磁盘 I/O 次数多 |
| B+树 | O(log n) | 矮胖树，适合磁盘存储 |

B+树好在哪？

1. 矮胖树：每个节点存多个键，树高度低（通常 3-4 层）
2. 节点对齐磁盘页：一个节点 = 一个磁盘页，一次 I/O 读一个节点
3. 支持范围查询：叶子节点链式连接，方便遍历

> 为什么树高度低很重要？
> - 每访问一个节点 = 可能一次磁盘 I/O
> - 3 层树 = 最多 3 次 I/O
> - 红黑树 1000 万数据约 24 层 = 24 次 I/O
>
> 磁盘 I/O 是瓶颈，B+树通过矮胖减少了 I/O 次数！

### 2.3 本节先记住什么

- 数据库索引首先是一个“减少磁盘 I/O”的设计问题
- B+树比红黑树更适合磁盘，不是因为名字更高级，而是因为更矮、更胖、页利用率更高
- 叶子节点有序且链式连接，所以 B+树天然支持范围查询
- 学习 MiniOB 索引实现时，要把“原理结构图”和“代码调用链”对应起来

---

## 三、B+树的结构与操作

### 3.1 B+树的结构

```
                    [30 | 60]                  ← 内部节点（第2层）
                   /    |    \
          [10|20]   [40|50]   [70|80|90]       ← 内部节点（第1层）
            ↙↘       ↙↘        ↙↘↘
    [1,10][11,20] [31,40][41,50] [61,70][71,80][81,90]  ← 叶子节点

    叶子节点链式连接：[1,10] → [11,20] → [31,40] → ...
```

B+树有几个值得注意的特点：

1. 内部节点只存储键和子节点指针，不存储实际数据
2. 叶子节点存储键和实际数据（或数据指针），有序排列
3. 所有叶子节点在同一层，树高度一致
4. 叶子节点链式连接，方便范围查询

### 3.2 B+树的操作

#### 查找

从根节点开始，逐层向下找：

```
查找 key=40:

1. 根节点 [30|60]: 40 在 [30,60] 之间，走中间子节点
2. 内部节点 [40|50]: 40 >= 40，走左边子节点
3. 叶子节点 [31,40]: 找到 40，返回数据
```

查找次数 = 树高度 = O(log n)

#### 插入

插入数据时，如果节点满了，需要分裂：

```
插入 key=25 到叶子节点 [11,20]:

1. 节点已满，分裂为 [11,20] 和 [21,25]
2. 将 21 提升到父节点
3. 如果父节点也满，继续向上分裂
4. 根节点分裂时，树高度增加
```

#### 删除

删除数据时，如果节点太空，可能需要合并：

```
删除 key=40:

1. 从叶子节点删除
2. 如果节点太空，尝试与相邻节点合并
3. 合并后更新父节点
```

> 为什么 B+树的插入/删除比红黑树磁盘友好？
> - B+树节点分裂/合并时，只需修改少量节点
> - 红黑树的旋转涉及多个节点，I/O 开销大

---

## 四、MiniOB 中的 B+树实现

### 4.1 代码结构

核心目录：`src/observer/storage/index/`

| 文件 | 说明 |
|------|------|
| `index.h/cpp` | 索引基类 `Index`，定义通用接口 |
| `bplus_tree.h/cpp` | B+树核心实现：节点结构、操作类 |
| `bplus_tree_index.h/cpp` | B+树索引实现类，继承 `Index` |
| `index_meta.h/cpp` | 索引元数据：索引名、字段名 |
| `bplus_tree_log.h/cpp` | B+树日志（用于恢复） |

### 4.2 核心类结构

```
Index (基类)
  ├── insert_entry(key, rid)      插入索引项
  ├── delete_entry(key, rid)      删除索引项
  └── create_scanner()            创建范围扫描器

BplusTreeIndex (继承 Index)
  └── 内部使用 BplusTreeHandler

BplusTreeHandler (B+树核心操作)
  ├── IndexFileHeader             文件头元数据
  │     ├── root_page             根节点页号
  │     ├── key_type              键类型
  │     └── key_length            键长度
  ├── IndexNode                   节点基类
  ├── LeafIndexNode               叶子节点
  ├── InternalIndexNode           内部节点
  ├── AttrComparator             属性比较器
  ├── KeyComparator               键比较器（属性+RID）
  └── BplusTreeScanner            范围扫描器
```

### 4.3 索引创建流程

从 SQL 到 B+树创建：

```
CREATE INDEX idx_name ON table_name(col)
          ↓
┌─────────────────────────────────────────────┐
│  yacc_sql.y:305 语法解析                     │
│  生成 CreateIndexSqlNode                     │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  create_index_stmt.cpp                       │
│  CreateIndexStmt::create() 验证表、字段       │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  create_index_executor.cpp                   │
│  调用 Table::create_index()                  │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  heap_table_engine.cpp:125                   │
│  创建 IndexMeta，创建 BplusTreeIndex          │
│  遍历表中记录插入索引                          │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│  bplus_tree.cpp                              │
│  BplusTreeHandler::create() 创建索引文件      │
└─────────────────────────────────────────────┘
```

> 注意：`CREATE INDEX` 属于 DDL。这里的重点不是优化器如何做算子选择，而是索引元数据如何创建、索引文件如何建立、表中已有数据如何回填进索引。

### 4.4 关键断点位置

调试索引创建流程的断点：

| 文件 | 行号 | 函数 | 说明 |
|------|------|------|------|
| `parser/yacc_sql.y` | 308 | `SCF_CREATE_INDEX` | 索引语法规则 |
| `stmt/create_index_stmt.cpp` | 24 | `create()` | 创建索引语句 |
| `executor/create_index_executor.cpp` | 23 | `execute()` | 执行创建索引 |
| `storage/table/heap_table_engine.cpp` | 125 | `create_index()` | 表创建索引入口 |
| `storage/index/bplus_tree_index.cpp` | - | `create()` | B+树索引创建 |
| `storage/index/bplus_tree.cpp` | - | `create()` | B+树文件创建 |

---

## 五、多列索引实现

### 5.1 从调试单列索引开始

先看一下单列索引是怎么创建的，搞清楚了再改多列。

这样做的原因很简单：多列索引不是从零重新设计一套索引系统，而是在现有单列索引实现上扩展“字段列表、键组织方式、比较逻辑”。

#### 调试任务

1. 创建一个表和索引：
```sql
CREATE TABLE users(id int, name char(20), age int);
CREATE INDEX idx_name ON users(name);
```

2. 在以下位置打断点：
   - `stmt/create_index_stmt.cpp:24` — 创建语句
   - `executor/create_index_executor.cpp:23` — 执行入口
   - `storage/index/bplus_tree_index.cpp:30` — B+树创建

3. 观察以下问题：
   - `CreateIndexSqlNode` 中的 `attribute_name` 是什么？
   - `IndexMeta` 中存储了什么信息？
   - B+树的 `key_length` 是怎么确定的？

#### 你会看到什么

```cpp
// create_index_stmt.cpp 中
const char *field_name = create_index.attribute_name.c_str();
// 单列索引：只有一个字段名 "name"
```

```cpp
// index_meta.h 中
class IndexMeta {
  string name_;    // "idx_name"
  string field_;   // "name" ← 只有这一个字段
};
```

```cpp
// bplus_tree_index.cpp 中
RC BplusTreeIndex::create(..., const FieldMeta &field_meta) {
  // field_meta.len() = 20 (char(20) 的长度)
  // 这个长度决定了 B+树键的大小
}
```

### 5.2 提出问题：如果要支持多列呢？

搞清楚单列索引怎么工作的，现在思考：如果要支持 `CREATE INDEX idx_name_age ON users(name, age);`，要改哪些地方？

#### 问题 1：解析层

SQL 中有多个字段名，但 `CreateIndexSqlNode` 只有一个 `attribute_name`：

```cpp
// 当前
struct CreateIndexSqlNode {
  string attribute_name;  // 只能存一个
};
```

所以这里需要改成 `vector<string> attribute_names;`，让它能存多个字段名。

#### 问题 2：元数据层

`IndexMeta` 只存一个字段名：

```cpp
// 当前
class IndexMeta {
  string field_;  // 只能存一个
};
```

同理，这里改成 `vector<string> fields_;`。

#### 问题 3：B+树键的长度

单列索引的键长度 = 字段长度。多列索引呢？

```
name(char(20)) + age(int) = 20 + 4 = 24 字节
```

所以键长度应该是所有字段长度之和。

#### 问题 4：键的比较逻辑

单列索引比较很简单：`name1 < name2`。

多列索引怎么比较 `(name1, age1)` 和 `(name2, age2)`？

```
先比较 name：
  - name1 < name2 → (name1, age1) < (name2, age2)
  - name1 > name2 → (name1, age1) > (name2, age2)
  - name1 == name2 → 再比较 age
```

这叫字典序比较，类似查字典：先看第一个字母，相同再看第二个。

这一点非常关键。多列索引难点不只是“把多个字段拼起来”，而是“拼起来以后怎么保持稳定、有序、可比较”。

### 5.3 实现步骤

知道要改什么了，开始动手。

#### 步骤 1：修改语法解析

文件：`src/observer/sql/parser/yacc_sql.y`

原来只支持单个字段：
```yacc
create_index_stmt:
    CREATE INDEX ID ON ID LBRACE ID RBRACE
    {
      $$ = new ParsedSqlNode(SCF_CREATE_INDEX);
      $$->create_index.attribute_name = $7;  // 单个字段
    }
```

改为支持字段列表：
```yacc
create_index_stmt:
    CREATE INDEX ID ON ID LBRACE rel_attr_list RBRACE
    {
      $$ = new ParsedSqlNode(SCF_CREATE_INDEX);
      $$->create_index.index_name = $3;
      $$->create_index.relation_name = $5;
      // rel_attr_list 已经是一个 vector
      for (auto &attr : *$7) {
        $$->create_index.attribute_names.push_back(attr.attribute_name);
      }
      delete $7;
    }
```

#### 步骤 2：修改 SQL 节点结构

文件：`src/observer/sql/parser/parse_defs.h`

```cpp
struct CreateIndexSqlNode
{
  string index_name;
  string relation_name;
  vector<string> attribute_names;  // 改为多个字段
};
```

#### 步骤 3：修改 Statement

文件：`src/observer/sql/stmt/create_index_stmt.h`

```cpp
class CreateIndexStmt : public Stmt
{
public:
  // 单列：const FieldMeta *field_meta() const;
  // 多列：
  const vector<const FieldMeta *> &field_metas() const { return field_metas_; }

private:
  vector<const FieldMeta *> field_metas_;  // 多个字段的元数据
};
```

create_index_stmt.cpp 中需要验证所有字段都存在：

```cpp
RC CreateIndexStmt::create(Db *db, const CreateIndexSqlNode &create_index, Stmt *&stmt)
{
  Table *table = db->find_table(create_index.relation_name.c_str());
  
  vector<const FieldMeta *> field_metas;
  for (const string &attr_name : create_index.attribute_names) {
    const FieldMeta *field_meta = table->table_meta().field(attr_name.c_str());
    if (nullptr == field_meta) {
      LOG_WARN("Field not exists: %s", attr_name.c_str());
      return RC::SCHEMA_FIELD_MISSING;
    }
    field_metas.push_back(field_meta);
  }
  
  stmt = new CreateIndexStmt(table, field_metas, create_index.index_name);
  return RC::SUCCESS;
}
```

#### 步骤 4：修改索引元数据

文件：`src/observer/storage/index/index_meta.h`

```cpp
class IndexMeta
{
public:
  const vector<string> &fields() const { return fields_; }
  int field_num() const { return fields_.size(); }
  
  // 初始化多列索引
  RC init(const char *name, const vector<const FieldMeta *> &fields);

private:
  string name_;
  vector<string> fields_;  // 多个字段名
};
```

#### 步骤 5：修改 B+树创建

文件：`src/observer/storage/index/bplus_tree_index.cpp`

```cpp
RC BplusTreeIndex::create(
    Table *table,
    const char *file_name,
    const IndexMeta &index_meta,
    const vector<const FieldMeta *> &field_metas)
{
  // 计算组合键的总长度
  int total_key_length = 0;
  for (const FieldMeta *field : field_metas) {
    total_key_length += field->len();
  }

  // 创建 B+树，键长度 = 所有字段长度之和
  RC rc = index_handler_.create(
      table->db()->log_handler(),
      bpm,
      file_name,
      field_metas[0]->type(),  // 当前实现入口仍沿用首字段类型信息
      total_key_length);       // 总键长度
  ...
}
```

这里要区分两件事：

- `key_length` 现在已经是组合键总长度，决定 B+树节点里一条键记录占多少字节
- 但真正的多列索引比较，不能只靠“第一个字段的类型”来完成，而要在组合键比较逻辑里按字段顺序逐段比较

### 5.4 完整调用链

```
CREATE INDEX idx_name_age ON users(name, age)
              ↓
yacc_sql.y: 解析为 attribute_names = ["name", "age"]
              ↓
CreateIndexStmt::create():
  验证 name 和 age 字段存在
  获取 FieldMeta 列表
              ↓
CreateIndexExecutor::execute():
  调用 table->create_index()
              ↓
HeapTableEngine::create_index():
  创建 IndexMeta(fields = ["name", "age"])
  创建 BplusTreeIndex
  计算键长度 = 20 + 4 = 24
              ↓
BplusTreeHandler::create():
  创建索引文件，键长度 24 字节
```

### 5.5 关键概念：最左前缀原则

多列索引有一个重要特性：最左前缀原则。

```sql
-- 索引 (name, age)
CREATE INDEX idx_name_age ON users(name, age);

-- 能使用索引的查询：
WHERE name = 'Alice'                    ✓
WHERE name = 'Alice' AND age = 25       ✓
WHERE age = 25                          ✗ （不包含最左字段）
```

原因：多列索引按键的字典序组织。索引先按 name 排序，name 相同时再按 age 排序。

```
(name, age) 索引中数据顺序：
('Alice', 20)
('Alice', 25)
('Bob', 20)
('Bob', 30)
('Carol', 25)
```

如果你查 `WHERE age = 25`，数据库无法定位——因为 age=25 的记录分散在各处。

这里最容易产生的误解是：“既然 age 也在索引里，为什么不能直接用？”  
关键原因不是字段存在不存在，而是索引的整体排序顺序先由 `name` 决定。没有先固定最左字段，就无法在 B+树中定位一个连续范围。

> 多列索引 `(name, age)` 和两个单列索引 `idx_name` + `idx_age` 怎么选？
> - 多列索引：一个索引文件，查询效率高
> - 多个单列索引：可以灵活组合，但可能需要"索引合并"

### 5.6 实践任务

1. 在 `feature/multi-column-index` 分支查看完整实现
2. 自己在新分支重新实现一遍
3. 测试：
   - `CREATE INDEX idx_name_age ON users(name, age);`
   - `INSERT INTO users VALUES(1, 'Alice', 25);`
   - `SELECT * FROM users WHERE name='Alice';` — 应该命中索引
4. 思考：如何验证查询是否使用了索引？

推荐实践顺序：

1. 先调通单列索引创建流程，确认断点位置和调用链
2. 再改语法结构与 SQL 节点定义，让多字段列表能传下来
3. 然后改 `Stmt`、`IndexMeta` 和键长度计算
4. 最后检查比较逻辑和测试用例，不要一上来就直接改 B+树内部细节

---

## 六、今日小结

今天我们从"索引用什么数据结构"这个问题出发，理解了 B+树为什么适合磁盘数据库：矮胖树减少磁盘 I/O、节点对齐磁盘页、支持范围查询。

然后我们看了 MiniOB 中 B+树的实现，通过调试单列索引理解了索引创建流程，并动手实现了多列索引。多列索引的核心是：解析层支持多个字段、元数据层存储字段列表、键长度是所有字段长度之和、比较逻辑用字典序。

索引是数据库加速查询的核心手段，理解 B+树是理解数据库性能优化的基础。

---

## 七、核心要点

- 索引是空间换时间的策略，加速查询
- B+树适合磁盘数据库：矮胖、节点对齐磁盘页、支持范围查询
- MiniOB 使用 B+树实现索引，当前只支持单列索引
- 多列索引需要修改：语法解析、Stmt/校验逻辑、元数据、组合键比较

## 八、延伸思考

1. 为什么 B+树把数据放在叶子节点，内部节点只存键？
   - 内部节点可以存更多键，树更矮
   - 减少磁盘 I/O 次数

2. 多列索引的字段顺序重要吗？
   - 重要！索引 (name, age) 和 (age, name) 不同
   - 最左前缀原则：(name, age) 可用于 WHERE name=?，但不能用于 WHERE age=?

3. 什么时候应该创建索引？
   - 频繁查询的字段
   - 区分度高的字段（如 ID，而非性别）
   - 权衡：索引维护开销 vs 查询加速收益

---

## 九、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- [如何新增 SQL 语句](https://oceanbase.github.io/miniob/miniob-how-to-add-new-sql.html)
- B+树测试用例：`test/case/test/primary-multi-index.test`
- `src/observer/storage/index/bplus_tree.h` 注释：第167行
