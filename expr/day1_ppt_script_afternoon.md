# Day1 下午 PPT 脚本：B+树与多列索引实现

## PPT 整体信息
- **标题**：第一天下午：B+树与多列索引实现
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 C++ 和数据结构基础

> **图片风格规范**：参考 `/root/workspace/miniob_2026/expr/CLAUDE.md` 中的图片生成规范

## 教学目标与讲授主线

- 目标 1：让学生理解为什么数据库索引需要面向磁盘设计，而不是直接套用内存数据结构
- 目标 2：让学生建立对 B+树结构、查找路径、分裂机制的基本直觉
- 目标 3：让学生把“索引原理”连接到 MiniOB 的代码结构和创建流程上
- 目标 4：让学生能定位多列索引实现需要改动的关键位置，并理解字典序比较与最左前缀原则

**讲授取舍建议**：
- 下午的重点不是把 B+树所有细节讲完，而是帮助学生形成“为什么这样设计 + 代码里怎么落地”的认识
- PPT 主要承担概念建立和实现导航，不承担完整推导和大段代码展示
- 关于插入分裂、叶子链表、键比较等内容，PPT 只保留结构和例子，细节由你口头解释

## 材料分工建议

- `day1_ppt_script_afternoon.md`：用于准备 PPT，少字、强结构、便于口头讲解
- 讲义或代码阅读材料：负责承载字段定义、接口细节、实现说明、边界条件
- 现场演示：用于补足“索引创建流程”“改代码位置”“测试验证”这些实践性内容

## 建议时间安排（3 小时）

- 0-10 分钟：上午回顾，建立下午主线
- 10-35 分钟：为什么需要索引，为什么 Hash/红黑树不适合磁盘数据库
- 35-65 分钟：B+树结构、查找路径、分裂直觉
- 65-90 分钟：MiniOB 索引代码结构与 CREATE INDEX 调用链
- 90-100 分钟：休息或现场答疑
- 100-130 分钟：从单列索引到多列索引，定位四个关键修改点
- 130-145 分钟：字典序比较与最左前缀原则
- 145-175 分钟：学生实践与操作，你巡回答疑
- 175-180 分钟：总结与延伸问题

## 使用原则

- 一页只讲一个核心结论，不要把定义、例子、代码路径全塞在同一页
- 表格、对比、修改点、规则类页面优先使用 PPT 原生绘制，方便临场修改
- 树结构图如果已有清晰素材可复用；如果现成图不匹配你的讲法，优先在 PPT 中重绘
- 下午必须留足实践时间，否则学生会记住“B+树很厉害”，但不会落到实现上

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 1 下午
- 副标题：B+树与多列索引实现

**图片：** 无需图片

**讲授建议（约 2 分钟）**：
- 开场直接点题：下午的任务是把“为什么需要索引”连到“怎么在 MiniOB 里实现”
- 不展开背景，尽快进入问题场景

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

**讲授建议（约 5 分钟）**：
- 回顾只讲“与下午相关的部分”，不要完整复述上午内容
- 要把学生注意力拉回到“今天已经知道 SQL 如何走，现在要解决查询效率问题”

---

## 第 3 页：问题引入 - 为什么需要索引？

**内容：**
- 场景对比：1000万条记录，查询 age=25
- 无索引：全表扫描 O(n)
- 有索引：B+树查找 O(log n)

**图片：** 有/无索引查询对比图

**画法说明**：优先使用 PPT 左右对比布局。
- 左侧：一排数据页 + 曲折扫描路径
- 右侧：简化 B+树 + 一条查找路径
- 中间：竖向分隔线
- 底部：只保留 `O(n)` vs `O(log n)`、`全表扫描` vs `3-4次I/O`

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style comparison diagram between non-indexed scan and indexed lookup for a database lecture slide.

Layout:
Left-right comparison with a clear center separator. Left side shows sequential scanning across many data pages. Right side shows a compact B+Tree lookup path. The diagram should already contain concise labels and be presentation-ready.

Semantic Elements:
- Left side: a row of small page blocks with a winding scan path
- Right side: a compact three-level B+Tree with one highlighted root-to-leaf path
- Center separator line

Text Labels:
- 无索引
- 有索引
- 全表扫描
- B+树查找
- O(n)
- O(log n)
- 需要扫描很多页
- 只走一条查找路径

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray fills with optional very light desaturated blue emphasis
- minimal decoration
- professional and understated
- use Chinese labels for explanations
- keep English only for O(n), O(log n), B+Tree if needed
- finished presentation-ready diagram

Negative Constraints:
- no blank placeholder blocks
- no generic comparison wireframe
- no saturated red-green contrast
- no 3D effect
- no heavy shadows
```

**讲授建议（约 8 分钟）**：
- 这页的任务是建立索引的必要性，不是讲复杂度定义
- 你要反复强调：数据库关心的不只是比较次数，而是磁盘 I/O 次数

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

**讲授建议（约 8 分钟）**：
- 这页核心不是背表格，而是说明“查找复杂度一样，不代表适合数据库”
- 重点口头解释“范围查询”和“磁盘友好”这两列

---

## 第 5 页：磁盘的物理单位（OS 知识）

**内容：**
- 扇区、页/块、磁盘页的概念
- 顺序读 vs 随机读

**图片：** 磁盘结构示意图（使用已提取的 02_db_file_structure.png）

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style disk storage hierarchy and read-pattern comparison diagram.

Layout:
Left side shows nested storage units. Right side shows sequential read versus random read using two contrasting path shapes. Keep the composition simple and balanced.

Semantic Elements:
- Nested rectangles for disk, page/block, and sector
- One straight path for sequential read
- One zigzag path for random read

Text Labels:
- 磁盘
- 页/块
- 扇区
- 顺序读
- 随机读
- 连续读取，较快
- 跳跃读取，较慢

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray fills with optional very light blue emphasis
- minimal decoration
- use Chinese labels for process descriptions
- finished presentation-ready diagram

Negative Constraints:
- no blank nested boxes
- no saturated colors
- no heavy shadows
- no 3D rendering
```

**讲授建议（约 6 分钟）**：
- 这页是承上启下，目的只是解释“为什么树高会变成 I/O 次数”
- 不要把磁盘结构展开成独立知识模块

---

## 第 6 页：为什么是 B+树？

**内容：**
- B+树 vs 红黑树高度对比（1000万数据）

**图片：** 树高度对比图

**画法说明**：优先使用 PPT 左右对比图。
- 左侧：矮胖的 B+树
- 右侧：高瘦的红黑树
- 右边统一高度标尺
- 页面只保留 `3-4次磁盘I/O` 与 `24次磁盘I/O` 这类量级对比

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style height comparison diagram between a B+Tree and a red-black tree for database indexing.

Layout:
Left-right comparison with a shared vertical height reference. The B+Tree should appear short and wide; the red-black tree should appear tall and narrow.

Semantic Elements:
- Left: a compact multi-way B+Tree
- Right: a tall binary-tree-like structure
- Shared height reference line

Text Labels:
- B+树
- 红黑树
- 3层
- 24层
- 3-4次磁盘I/O
- 24次磁盘I/O
- 更矮更胖
- 更高更瘦

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray fills with optional very light blue emphasis
- minimal decoration
- use Chinese labels for explanatory text
- finished presentation-ready diagram

Negative Constraints:
- no blank trees without semantics
- no saturated colors
- no heavy shadows
- no cartoon style
```

**讲授建议（约 8 分钟）**：
- 这页是全场最关键的原理论证页之一
- 学生只要记住一句话：数据库偏爱矮胖树，因为一次 I/O 要尽量带更多分支信息

---

## 第 7 页：B+树的结构详解

**内容：**
- 内部节点 vs 叶子节点
- 叶子节点链式连接

**图片：** B+树结构示意图（使用已提取的 04_bplus_tree_structure.png）

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style B+Tree structure diagram for teaching.

Layout:
Three-level tree layout with root at top, internal nodes in the middle, leaf nodes at the bottom, and horizontal links across the leaves.

Semantic Elements:
- Root node
- Internal nodes
- Leaf nodes
- Horizontal linked-list arrows between leaves

Text Labels:
- 内部节点
- 叶子节点
- 叶子链表
- 只存索引键
- 有序数据入口
- 支持范围查询

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light blue fills
- minimal decoration
- use Chinese labels for explanations
- finished presentation-ready diagram

Negative Constraints:
- no blank unlabeled tree
- no saturated colors
- no heavy shadows
- no 3D effect
```

**讲授建议（约 8 分钟）**：
- 这一页重点讲三件事：内部节点只导航、叶子节点才是有序数据入口、叶子链表支持范围查询
- 不要在这页讲完整插入删除细节

---

## 第 8 页：B+树的操作 - 查找

**内容：**
- 查找 key=40 的过程

**图片：** 查找路径高亮图

**画法说明**：优先在 PPT 中基于上一页结构图局部高亮。
- 使用同一棵树，避免学生重新识图
- 只高亮一条路径
- 旁边放 3 个简短步骤，不写长句

**讲授建议（约 6 分钟）**：
- 这一页的目标是让学生形成“查找就是一路向下缩小范围”的直觉
- 强调它和二叉搜索树相似，但每层扇出更大、层数更少

---

## 第 9 页：B+树的操作 - 插入与删除

**内容：**
- 插入分裂过程
- 删除合并过程

**图片：** 插入分裂前后对比图

**画法说明**：使用 PPT 上下对照图，必要时配一个简化箭头。
- 上：插入前，节点已满
- 下：分裂后，父节点新增分隔键
- 如果页面空间紧张，只讲插入分裂，不展开删除合并

**讲授建议（约 8 分钟）**：
- 这一页只要求学生知道“满了会分裂，并把分隔信息往上推”
- 删除合并如果时间不足，可以口头一句带过，不必在 PPT 上并列展开

---

## 第 10 页：MiniOB 索引代码结构

**内容：**
- 类层次：Index → BplusTreeIndex → BplusTreeHandler

**图片：** 类继承图

**画法说明**：使用 PPT 原生 UML 风格方框图。
- 只保留类名和一两个关键职责
- 不要把成员变量和方法全堆进去
- 页面重点是“谁包装谁、谁真正操作 B+树”

**讲授建议（约 8 分钟）**：
- 这一页要把概念切回代码世界
- 不是做完整 UML 课，而是帮学生建立改代码时的文件定位感

---

## 第 11 页：索引创建流程

**内容：**
- 从 SQL 到 B+树的完整路径

**图片：** 索引创建调用链（使用已提取的 07_query_execution_plan.png）

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style vertical flowchart for CREATE INDEX execution in a database kernel.

Layout:
Top-to-bottom flow with evenly spaced stages and one concise annotation area on the right. The flowchart should already contain labels directly in the diagram.

Semantic Elements:
- One SQL input box at the top
- Six vertically stacked step boxes
- Thin downward arrows
- One side annotation box

Text Labels:
- CREATE INDEX idx ON t(col)
- 语法解析
- 语义检查
- 执行阶段
- Table::create_index()
- BplusTreeIndex::create
- 创建 .index 文件
- 遍历记录回填索引

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light blue fills
- minimal decoration
- use Chinese labels for process descriptions
- keep English only for code identifiers
- finished presentation-ready diagram

Negative Constraints:
- no blank stage placeholders
- no saturated colors
- no heavy shadows
- no poster style
```

**讲授建议（约 10 分钟）**：
- 这页要和现场代码演示强绑定，单独放在 PPT 上讲会偏空
- 重点告诉学生：多列索引不是从零做一套，而是在现有创建流程上扩展字段处理方式

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

**讲授建议（约 10 分钟）**：
- 这一页是下午实践前最重要的“落地点”页面
- 学生必须在这里知道自己改哪几类文件，否则后面容易乱翻代码

---

## 第 13 页：多列索引的键比较

**内容：**
- 字典序比较 (name, age) 示例

**图片：** 字典序比较示意图

**画法说明**：使用 PPT 三行示例。
- 行 1：('Alice', 20) < ('Bob', 25)，标注：Alice < Bob，无需比较age
- 行 2：('Alice', 20) < ('Alice', 25)，标注：name相同，比较age
- 行 3：('Bob', 30) > ('Alice', 25)，标注：Bob > Alice

**讲授建议（约 8 分钟）**：
- 这页一定要讲慢一点，因为它直接决定多列索引键如何比较
- 只要学生理解“前一列先比，相同再比后一列”，后面的实现就能跟上

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

**讲授建议（约 8 分钟）**：
- 不要只给规则，要结合这页排序后的样例解释“为什么 age 单独查不连续”
- 这页是帮助学生把数据排列方式和查询规则真正对应起来

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

**讲授建议（约 3 分钟）**：
- 讲到这里就应切换到学生实践，不要继续扩展原理
- 任务描述尽量按顺序给，让学生先跑通再优化

---

## 第 16 页：延伸思考题

**内容：**
- 三个思考问题

**图片：** 三个问题列表

**画法说明**：使用 PPT 垂直列表。
- ① 为什么B+树把数据放在叶子节点，而不是内部节点？
- ② 多列索引的字段顺序重要吗？(name, age) 和 (age, name) 有什么区别？
- ③ 什么时候应该创建索引？什么时候不应该？

**讲授建议（约 3 分钟）**：
- 这页更适合做总结和课后思考，不建议在主线里展开太久
- 如果实践时间紧，这页可以压缩成口头提问

---

## 第 17 页：Q&A / 结束

**内容：**
- 问题时间
- 明天预告：事务与并发控制

**图片：** 无需图片

**讲授建议**：
- 如果实践阶段问题较多，可以把这页作为机动答疑，而不必严格保留
- 结束时把“明天会继续从正确性和并发角度补系统能力”点一下即可

---

## 图片使用汇总

| PPT 页 | 图片名称 | 建议来源制作方式 | 备注 |
|--------|----------|------|------|
| 2 | 三要点回顾图 | **PPT 原生** | 简单列表即可，不需要生成图片 |
| 3 | 有无索引对比图 | **PPT 原生优先，AI 备用** | 左右对比图规则明确，PPT 更容易控字和控重点 |
| 4 | 数据结构对比表 | **PPT 原生** | 表格类页面不建议用 AI |
| 5 | 磁盘存储结构图 | 已提取图片或 **PPT 重绘** | 优先使用 `02_db_file_structure.png`，否则重绘简化版 |
| 6 | 树高度对比图 | **PPT 原生优先，AI 备用** | 高度对比图本质是规则示意图 |
| 7 | B+树结构图 | 已提取图片或 **PPT 重绘** | 优先使用 `04_bplus_tree_structure.png` |
| 8 | 查找路径图 | **PPT 原生** | 建议直接基于第 7 页结构图高亮一条路径 |
| 9 | 插入分裂图 | **PPT 原生** | 上下对照图很适合用 PPT 控制 |
| 10 | 类继承图 | **PPT 原生** | UML/类关系图应由 PPT 原生绘制 |
| 11 | 索引创建流程图 | 已提取图片或 **PPT 重绘** | 优先使用已有图，不合适则重绘竖向流程 |
| 12 | 修改点清单图 | **PPT 原生** | 改动点和文件路径必须可精确修改 |
| 13 | 字典序比较图 | **PPT 原生** | 示例类页面不需要 AI |
| 14 | 最左前缀示意图 | **PPT 原生** | 排序表格和高亮最适合原生绘制 |
| 15 | 任务总结图 | **PPT 原生** | 清单页无需 AI |
| 16 | 思考题图 | **PPT 原生** | 问题页直接列表即可 |

---

## 提示词使用说明

1. **制图策略分离**：表格、修改点、示例比较、规则说明这类页面，优先使用 PPT 原生绘制，避免 AI 造成文字错误和结构漂移。
2. **优先使用已提取图片**：第5、7、11页如已有内容清晰、风格不冲突的图片，可直接复用；否则建议按讲法重绘。
3. **AI优先直接出成品图**：适合 AI 的概念图、结构图、流程图，优先让它直接生成可上屏的成品图；只有效果不稳定时才退回到“底图 + PPT 补字”模式。
4. **统一风格准则**：
   - 所有 AI 图片必须遵循《CLAUDE.md》的学术论文风格：低饱和、克制、清晰。
   - 主体保持白底、深灰线条、浅灰填充，允许少量浅灰蓝作为强调色。
   - 禁止使用饱和大色块、重阴影、3D 效果、营销海报风格。
   - 能用中文的地方尽量用中文，尤其是流程说明、模块说明、结论性标签；只有代码名、类型名、类名保留英文。
5. **下午课堂控制原则**：不要把时间耗在 B+树复杂细节推导上，必须把足够时间留给多列索引实现和学生实践。
