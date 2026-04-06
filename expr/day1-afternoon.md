# 第一天下午：B+树与多列索引实现

## 一、引言

上午我们讨论了数据库的基本问题：持久化、查询效率、为什么需要索引。现在我们深入学习数据库最常用的索引结构——**B+树**。

> **回顾上午内容**：
> - 数据库解决的问题：持久化、查询效率、并发控制、事务、一致性
> - 为什么 txt 文件查询慢：磁盘以页面为单位读写，随机 I/O 开销大
> - 索引的本质：空间换时间，建立"字段值 → 记录位置"的映射
>
> 详细内容请参考上午文档的"从最小存储结构开始理解"章节。

### 1.1 为什么是 B+树而不是其他数据结构？

既然索引要"快速查找"，为什么不用 HashMap？

| 数据结构 | 查找效率 | 问题 |
|----------|----------|------|
| HashMap | O(1) | 不支持范围查询（查 20<age<30） |
| 二叉搜索树 | O(log n) | 可能退化成链表，树太高 |
| 红黑树 | O(log n) | 树高度大，磁盘 I/O 次数多 |
| **B+树** | O(log n) | **矮胖树，适合磁盘存储** |

**B+树的优势**：

1. **矮胖树**：每个节点存多个键，树高度低（通常 3-4 层）
2. **节点对齐磁盘页**：一个节点 = 一个磁盘页，一次 I/O 读一个节点
3. **支持范围查询**：叶子节点链式连接，方便遍历

> **思考**：为什么树高度低很重要？
> - 每访问一个节点 = 可能一次磁盘 I/O
> - 3 层树 = 最多 3 次 I/O
> - 红黑树 1000 万数据约 24 层 = 24 次 I/O
> 
> **磁盘 I/O 是瓶颈，B+树通过"矮胖"减少了 I/O 次数！**

### 1.2 学习目标

- 理解 B+树的结构和操作原理
- 了解 MiniOB 中 B+树索引的实现
- 实现多列索引功能

---

## 二、B+树的结构与操作

### 2.1 B+树的结构

```
                    [30 | 60]                  ← 内部节点（第2层）
                   /    |    \
          [10|20]   [40|50]   [70|80|90]       ← 内部节点（第1层）
            ↙↘       ↙↘        ↙↘↘
    [1,10][11,20] [31,40][41,50] [61,70][71,80][81,90]  ← 叶子节点

    叶子节点链式连接：[1,10] → [11,20] → [31,40] → ...
```

**关键特点**：

1. **内部节点**：只存储键和子节点指针，不存储实际数据
2. **叶子节点**：存储键和实际数据（或数据指针），有序排列
3. **所有叶子节点**：在同一层，树高度一致
4. **叶子节点链式连接**：方便范围查询

### 2.2 B+树的操作

#### 查找

从根节点开始，逐层向下：

```
查找 key=40:

1. 根节点 [30|60]: 40 在 [30,60] 之间，走中间子节点
2. 内部节点 [40|50]: 40 >= 40，走左边子节点
3. 叶子节点 [31,40]: 找到 40，返回数据
```

查找次数 = 树高度 = O(log n)

#### 插入

插入可能导致节点分裂：

```
插入 key=25 到叶子节点 [11,20]:

1. 节点已满，分裂为 [11,20] 和 [21,25]
2. 将 21 提升到父节点
3. 如果父节点也满，继续向上分裂
4. 根节点分裂时，树高度增加
```

#### 删除

删除可能导致节点合并或借用：

```
删除 key=40:

1. 从叶子节点删除
2. 如果节点太空，尝试与相邻节点合并
3. 合并后更新父节点
```

> **思考**：为什么 B+树的插入/删除比红黑树磁盘友好？
> - B+树节点分裂/合并时，只需修改少量节点
> - 红黑树的旋转涉及多个节点，I/O 开销大

---

## 三、MiniOB 中的 B+树实现

### 3.1 代码结构

**核心目录**：`src/observer/storage/index/`

| 文件 | 说明 |
|------|------|
| `index.h/cpp` | 索引基类 `Index`，定义通用接口 |
| `bplus_tree.h/cpp` | B+树核心实现：节点结构、操作类 |
| `bplus_tree_index.h/cpp` | B+树索引实现类，继承 `Index` |
| `index_meta.h/cpp` | 索引元数据：索引名、字段名 |
| `bplus_tree_log.h/cpp` | B+树日志（用于恢复） |

### 3.2 核心类结构

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

### 3.3 索引创建流程

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

### 3.4 关键断点位置

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

## 四、多列索引实现

### 4.1 当前状态

MiniOB 目前**只支持单列索引**。

关键代码注释（`bplus_tree.h:167`）：
> "only one field can be supported, can you extend it to multi-fields?"

### 4.2 什么是多列索引？

多列索引（复合索引）是在多个字段上创建的索引：

```sql
-- 单列索引
CREATE INDEX idx_name ON users(name);

-- 多列索引
CREATE INDEX idx_name_age ON users(name, age);
```

多列索引的键是**字段组合**，如 `(name, age)`。

**适用场景**：
- 查询条件涉及多个字段：`WHERE name='Alice' AND age=25`
- 排序涉及多个字段：`ORDER BY name, age`

### 4.3 需要修改的关键位置

#### 1. 语法解析（yacc_sql.y）

当前语法：
```yacc
create_index_stmt:
    CREATE INDEX ID ON ID LBRACE ID RBRACE
```

需要改为支持多字段列表：
```yacc
create_index_stmt:
    CREATE INDEX ID ON ID LBRACE index_attr_list RBRACE

index_attr_list:
    ID
    | index_attr_list COMMA ID
```

**文件**：`src/observer/sql/parser/yacc_sql.y`（第305行附近）

#### 2. SQL节点结构（parse_defs.h）

当前：
```cpp
struct CreateIndexSqlNode {
  string index_name;
  string relation_name;
  string attribute_name;  // 单字段
};
```

需要改为：
```cpp
struct CreateIndexSqlNode {
  string index_name;
  string relation_name;
  vector<string> attribute_names;  // 多字段
};
```

**文件**：`src/observer/sql/parser/parse_defs.h`（第190行）

#### 3. 索引元数据（index_meta.h）

当前：
```cpp
class IndexMeta {
private:
  string field_;  // 单字段
};
```

需要改为：
```cpp
class IndexMeta {
private:
  vector<string> fields_;  // 多字段
};
```

**文件**：`src/observer/storage/index/index_meta.h`

#### 4. B+树比较器（bplus_tree.h）

当前的 `AttrComparator` 和 `KeyComparator` 只支持单字段比较。

需要扩展为支持多字段组合比较：

```cpp
// 比较逻辑示例
int compare(const vector<Value> &left, const vector<Value> &right) {
  for (size_t i = 0; i < left.size(); i++) {
    int cmp = compare_value(left[i], right[i]);
    if (cmp != 0) return cmp;
  }
  return 0;  // 所有字段都相等
}
```

**文件**：`src/observer/storage/index/bplus_tree.h`

#### 5. 文件头元数据（IndexFileHeader）

需要支持多字段的类型和长度信息：

```cpp
struct IndexFileHeader {
  // 当前
  AttrType attr_type;
  int      attr_length;
  
  // 需要改为
  vector<AttrType> attr_types;
  vector<int>      attr_lengths;
  int              total_key_length;  // 总键长度
};
```

**文件**：`src/observer/storage/index/bplus_tree.h`

### 4.4 实现思路

实现多列索引需要修改以下层次：

| 层次 | 修改内容 |
|------|----------|
| **语法解析** | yacc 规则支持多字段列表 |
| **SQL节点** | CreateIndexSqlNode 改为 vector |
| **Statement** | CreateIndexStmt 支持多字段验证 |
| **索引元数据** | IndexMeta 存储多字段信息 |
| **B+树文件头** | 存储多字段类型和长度 |
| **比较器** | 支持多字段组合比较 |

### 4.5 调试建议

1. 先修改语法解析，确保能解析多字段语法
2. 使用 `EXPLAIN` 命令观察生成的语句结构
3. 在 `CreateIndexStmt::create()` 打断点，验证字段列表
4. 在 `BplusTreeHandler::create()` 打断点，观察索引文件创建

---

## 五、总结与思考

### 5.1 核心要点

- 索引是**空间换时间**的策略，加速查询
- B+树适合磁盘数据库：矮胖、节点对齐磁盘页、支持范围查询
- MiniOB 使用 B+树实现索引，当前只支持单列索引
- 多列索引需要修改：语法解析、元数据、比较器

### 5.2 延伸思考

1. **为什么 B+树把数据放在叶子节点，内部节点只存键？**
   - 内部节点可以存更多键，树更矮
   - 减少磁盘 I/O 次数

2. **多列索引的字段顺序重要吗？**
   - 重要！索引 `(name, age)` 和 `(age, name)` 不同
   - 最左前缀原则：`(name, age)` 可用于 `WHERE name=?`，但不能用于 `WHERE age=?`

3. **什么时候应该创建索引？**
   - 频繁查询的字段
   - 区分度高的字段（如 ID，而非性别）
   - 权衡：索引维护开销 vs 查询加速收益

---

## 六、参考资料

- [MiniOB 框架介绍](https://oceanbase.github.io/miniob/)
- [如何新增 SQL 语句](https://oceanbase.github.io/miniob/miniob-how-to-add-new-sql.html)
- B+树测试用例：`test/case/test/primary-multi-index.test`
- `src/observer/storage/index/bplus_tree.h` 注释：第167行