# Day1 下午 PPT 脚本：B+树与多列索引实现

## PPT 整体信息
- **标题**：第一天下午：B+树与多列索引实现
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 C++ 和数据结构基础

> **图片风格规范**：参考 `/home/glwuy/miniob_2026/expr/CLAUDE.md` 中的 "Nanobanana Pro 图片生成规范"

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 1 下午
- 副标题：B+树与多列索引实现

**图片：** 无需图片

---

## 第 2 页：上午回顾

**内容：**
- 上午我们学了什么？
  - SQL 处理全流程
  - 调试技巧
  - Drop Table 实现

**图片：** 三要点回顾图

**画法说明**：使用 PPT 垂直列表。
- 三个要点，每项带序号圆圈 ①②③
- ① SQL处理全流程 (Parse→Resolve→Optimize→Execute)
- ② 调试技巧 (断点设置、火山模型)
- ③ DROP TABLE实现 (CREATE的对称操作)

---

## 第 3 页：问题引入 - 为什么需要索引？

**内容：**
- 场景对比：1000万条记录，查询 age=25
- 无索引：全表扫描 O(n)
- 有索引：B+树查找 O(log n)

**图片：** 有/无索引查询对比图

**提示词（需要 AI 生成）：**
```
【主题】Indexed vs non-indexed query performance comparison
【构图】Left-right comparison with dashed center separator
【元素】
Left side "无索引":
- Title rectangle
- Horizontal bar with ~20 small squares representing data pages
- Red zigzag line through all squares showing scan path
- Bottom annotation

Right side "有索引":
- Title rectangle
- Three-level B+Tree structure (1 root - 2 internal - 4 leaves)
- Green straight line from root to leaf showing search path
- Bottom annotation

Center: dashed vertical separator
【文字】
Left: 无索引, O(n), 全表扫描, 10,000次I/O
Right: 有索引, O(log n), B+树查找, 3-4次I/O
【风格】Academic paper style, thin black lines, red/green only for path emphasis, white background, no decorative elements, Chinese text
```

---

## 第 4 页：索引应该用什么数据结构？

**内容：**
- 候选人对比表

**图片：** 四数据结构对比图

**画法说明**：使用 PPT 表格。
- 表头：数据结构 | 查找复杂度 | 范围查询 | 磁盘友好
- 行 1：HashMap | O(1) | 不支持 | 一般
- 行 2：二叉搜索树 | O(log n) | 支持 | 不支持
- 行 3：红黑树 | O(log n) | 支持 | 不支持
- 行 4：B+树 | O(log n) | 支持 | 支持（高亮）

---

## 第 5 页：磁盘的物理单位（OS 知识）

**内容：**
- 扇区、页/块、磁盘页的概念
- 顺序读 vs 随机读

**图片：** 磁盘结构示意图（使用已提取的 02_db_file_structure.png）

**提示词（nanobanana备用）：**
```
【主题】Disk storage unit hierarchy and read pattern comparison
【构图】Left side nested rectangles for hierarchy, right side two arrows for read patterns
【元素】
Left side:
- Outermost large rectangle labeled "磁盘"
- Middle rectangle inside labeled "页/块 4KB"
- Innermost small rectangle labeled "扇区 512B"
- Nested containment relationship

Right side:
- Upper straight arrow labeled "顺序读" with annotation "快"
- Lower zigzag arrow labeled "随机读" with annotation "慢(10ms/次)"
【文字】磁盘, 页/块 4KB, 扇区 512B, 顺序读, 快, 随机读, 慢(10ms/次)
【风格】Academic paper style, thin black lines, white fill, no shadows, pure white background, Chinese text
```

---

## 第 6 页：为什么是 B+树？

**内容：**
- B+树 vs 红黑树高度对比（1000万数据）

**图片：** 树高度对比图

**提示词（需要 AI 生成）：**
```
【主题】B+Tree vs Red-Black Tree height comparison for 10 million records
【构图】Left-right comparison with shared height scale on right
【元素】
Left side "B+树":
- Short wide tree: 1 root node, 3 internal nodes, multiple leaf nodes
- Nodes as circles (internal) and squares (leaves)
- Height scale on right showing "3层"
- Bottom annotation "3-4次磁盘I/O"

Right side "红黑树":
- Tall thin tree: elongated chain structure
- Nodes as circles
- Height scale showing "24层"
- Bottom annotation "24次磁盘I/O"

Shared: vertical scale labeled "树高度", bottom label "1000万数据"
【文字】B+树, 红黑树, 3层, 24层, 3-4次磁盘I/O, 24次磁盘I/O, 树高度, 1000万数据
【风格】Academic paper style, thin black lines, circles for internal nodes, squares for leaves, no shadows, white background, Chinese text
```

---

## 第 7 页：B+树的结构详解

**内容：**
- 内部节点 vs 叶子节点
- 叶子节点链式连接

**图片：** B+树结构示意图（使用已提取的 04_bplus_tree_structure.png）

**提示词（nanobanana备用）：**
```
【主题】Complete B+Tree structure diagram
【构图】Three-level tree structure, root at top, internal nodes middle, leaves at bottom
【元素】
- Root node (circle): contains keys like [30, 60]
- Internal nodes (circles): branching to leaves
- Leaf nodes (squares): contain actual keys like [11,20], [21,30]
- Horizontal arrows connecting leaf nodes (linked list)
- Annotation labels for node types
【文字】内部节点(存索引键), 叶子节点(存数据指针), 叶子链表(范围查询), key examples
【风格】Academic paper style, thin black lines, circles for internal, squares for leaves, no shadows, white background, Chinese text
```

---

## 第 8 页：B+树的操作 - 查找

**内容：**
- 查找 key=40 的过程

**图片：** 查找路径高亮图

**提示词（需要 AI 生成）：**
```
【主题】B+Tree lookup operation path demonstration for key=40
【构图】Three-level B+Tree with highlighted search path, numbered steps on left
【元素】
- Complete B+Tree structure (same as page 7)
- Highlighted path using bold lines or gray fill:
  ① Root [30,60]: annotation "40在[30,60]之间，走中间"
  ② Internal [40,50]: annotation "40≥40，走左子树"
  ③ Leaf: found 40, annotation "命中"
- Step numbers ①②③ vertically on left side
【文字】key=40, 步骤标注: 40在[30,60]之间走中间, 40≥40走左子树, 命中
【风格】Academic paper style, search path in bold/gray highlight, other elements in thin black lines, white background, Chinese text
```

---

## 第 9 页：B+树的操作 - 插入与删除

**内容：**
- 插入分裂过程
- 删除合并过程

**图片：** 插入分裂前后对比图

**提示词（需要 AI 生成）：**
```
【主题】B+Tree node split process before and after insertion
【构图】Top-bottom split, "before" above, "after" below with separator
【元素】
Top "插入前":
- Single full leaf node rectangle containing multiple keys
- Annotation "已满，无法插入"

Bottom "分裂后":
- Left: two new leaf node rectangles
- Right: parent node update with new separator key
- Arrows showing data flow

Separator: horizontal dashed line
【文字】插入前, 已满无法插入, 分裂后, 父节点更新, 分隔键
【风格】Academic paper style, thin black lines, rectangles for nodes, arrows for changes, white background, Chinese text
```

---

## 第 10 页：MiniOB 索引代码结构

**内容：**
- 类层次：Index → BplusTreeIndex → BplusTreeHandler

**图片：** 类继承图

**提示词（需要 AI 生成）：**
```
【主题】MiniOB index class inheritance hierarchy diagram
【构图】UML-style class diagram, inheritance from top to bottom
【元素】
Top layer:
- Rectangle "Index(基类)" with methods: create(), drop(), sync()

Middle layer:
- Rectangle "BplusTreeIndex" with solid arrow pointing to Index (inheritance)
- Contains: table_, file_handler_

Bottom right:
- Rectangle "BplusTreeHandler" with dashed arrow from BplusTreeIndex (composition)
- Contains: IndexNode, LeafIndexNode, InternalIndexNode

UML notation: hollow triangle for inheritance, filled diamond for composition
【文字】Index(基类), BplusTreeIndex, BplusTreeHandler, method names, member names
【风格】UML class diagram style, thin black lines, rectangles for classes, white background, no shadows, Chinese text
```

---

## 第 11 页：索引创建流程

**内容：**
- 从 SQL 到 B+树的完整路径

**图片：** 索引创建调用链（使用已提取的 07_query_execution_plan.png）

**提示词（nanobanana备用）：**
```
【主题】CREATE INDEX complete execution flow from SQL to B+Tree
【构图】Vertical flowchart from top to bottom with 6 numbered steps
【元素】
- Top: SQL statement box "CREATE INDEX idx ON t(col)"
- Downward arrow
- 6 step rectangles connected by arrows
- Right side annotation box
【文字】
Step 1: Parser解析 → CreateIndexSqlNode
Step 2: Resolve → CreateIndexStmt
Step 3: Optimize → CreateIndexPhysicalOperator
Step 4: Execute → Table::create_index()
Step 5: BplusTreeIndex::create → 创建索引文件
Step 6: 遍历数据插入索引
Right annotation: 生成.index文件
【风格】Vertical flowchart, thin black line rectangles, arrows connecting, white background, no shadows, Chinese text
```

---

## 第 12 页：从单列索引到多列索引

**内容：**
- 需要修改的四个地方

**图片：** 修改点列表图

**画法说明**：使用 PPT 四行列表。
- 每行：序号圆圈 | 描述 | 代码改动 | 文件路径
- ① Parser支持多字段 | attribute_name → vector<string> | yacc_sql.y
- ② Stmt验证多字段 | 检查字段存在性、类型 | create_index_stmt.cpp
- ③ IndexMeta存储多字段 | field_ → vector<string> | index_meta.h
- ④ B+树键计算 | 键长度=字段长度之和 | bplus_tree_index.cpp

---

## 第 13 页：多列索引的键比较

**内容：**
- 字典序比较 (name, age) 示例

**图片：** 字典序比较示意图

**画法说明**：使用 PPT 三行示例。
- 行 1：('Alice', 20) < ('Bob', 25)，标注：Alice < Bob，无需比较age
- 行 2：('Alice', 20) < ('Alice', 25)，标注：name相同，比较age
- 行 3：('Bob', 30) > ('Alice', 25)，标注：Bob > Alice

---

## 第 14 页：最左前缀原则

**内容：**
- 多列索引 (name, age) 的查询规则

**图片：** 最左前缀示意图

**画法说明**：使用 PPT 表格 + 标注。
- 上部：数据表，按 name 排序：(Alice,20), (Alice,25), (Alice,30), (Bob,20), (Bob,25)
- 下部三个查询示例：
  - WHERE name='Alice' ✓（连续行高亮）
  - WHERE name='Alice' AND age=25 ✓（单格高亮）
  - WHERE age=25 ✗（分散行）

---

## 第 15 页：实践任务与总结

**内容：**
- 任务清单和今日要点

**图片：** 任务清单图

**画法说明**：使用 PPT 列表，分两部分。
- 实践任务（带复选框 □）：
  - 查看feature/multi-column-index分支代码
  - 独立实现多列索引功能
  - 编写测试用例验证CREATE INDEX
- 今日要点（带圆点 •）：
  - B+树适合磁盘数据库: 矮胖、页对齐、范围查询
  - 多列索引使用字典序比较
  - 最左前缀原则决定索引使用

---

## 第 16 页：延伸思考题

**内容：**
- 三个思考问题

**图片：** 三个问题列表

**画法说明**：使用 PPT 垂直列表。
- ① 为什么B+树把数据放在叶子节点，而不是内部节点？
- ② 多列索引的字段顺序重要吗？(name, age) 和 (age, name) 有什么区别？
- ③ 什么时候应该创建索引？什么时候不应该？

---

## 第 17 页：Q&A / 结束

**内容：**
- 问题时间
- 明天预告：事务与并发控制

**图片：** 无需图片

---

## 图片使用汇总

| PPT 页 | 图片名称 | 来源 | 备注 |
|--------|----------|------|------|
| 2 | 三要点回顾图 | nanobanana | 按提示词生成 |
| 3 | 有无索引对比图 | nanobanana | 按提示词生成 |
| 4 | 数据结构对比表 | nanobanana | 按提示词生成 |
| 5 | 磁盘存储结构图 | 已提取图片或nanobanana | 优先使用02_db_file_structure.png |
| 6 | 树高度对比图 | nanobanana | 按提示词生成 |
| 7 | B+树结构图 | 已提取图片或nanobanana | 优先使用04_bplus_tree_structure.png |
| 8 | 查找路径图 | nanobanana | 按提示词生成 |
| 9 | 插入分裂图 | nanobanana | 按提示词生成 |
| 10 | 类继承图 | nanobanana | 按提示词生成 |
| 11 | 索引创建流程图 | 已提取图片或nanobanana | 优先使用07_query_execution_plan.png |
| 12 | 修改点清单图 | nanobanana | 按提示词生成 |
| 13 | 字典序比较图 | nanobanana | 按提示词生成 |
| 14 | 最左前缀示意图 | nanobanana | 按提示词生成 |
| 15 | 任务总结图 | nanobanana | 按提示词生成 |
| 16 | 思考题图 | nanobanana | 按提示词生成 |

---

## 提示词使用说明

1. **提示词语言**：主体使用英文（AI理解更准确），文字标注部分明确列出中文内容
2. **优先使用已提取图片**：第5、7、11页有现成图片，直接使用
3. **nanobanana生成图片**：其他页面按提示词生成
4. **风格一致性检查**：
   - 所有图片必须遵循"学术论文风格，细黑线，白底，无阴影"
   - 中文文字统一使用宋体或黑体
   - 强调元素仅使用灰色填充或粗线条
   - 禁止使用多种颜色
5. **提示词微调**：根据实际效果可适当调整元素位置和文字，但保持整体风格不变