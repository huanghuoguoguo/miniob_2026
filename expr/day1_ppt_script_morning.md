# Day1 上午 PPT 脚本：环境配置与 Drop Table 实现

## PPT 整体信息
- **标题**：第一天上午：环境配置与 Drop Table 实现
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 C++ 和数据结构基础

> **图片风格规范**：参考 `/home/glwuy/miniob_2026/expr/CLAUDE.md` 中的 "Nanobanana Pro 图片生成规范"

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 1 上午
- 副标题：环境配置与 Drop Table 实现
- 底部：你的名字/日期

**图片：** 无需图片，使用简洁文字排版

---

## 第 2 页：课程安排预览

**内容：**
- 今天我们要做什么？
  1. 环境配置：WSL + MiniOB 编译运行
  2. 项目结构：理解 MiniOB 架构
  3. 调试技巧：掌握调试方法
  4. 实战任务：实现 DROP TABLE

**图片：** 四阶段水平流程图

**画法说明**：使用 PPT SmartArt 的水平流程图，或手动绘制 4 个等宽矩形，添加连接箭头。
- 矩形 1：环境配置
- 矩形 2：项目结构  
- 矩形 3：调试技巧
- 矩形 4：DROP TABLE实现

---

## 第 3 页：从最简单的存储开始

**内容：**
- 问题引入：最简单的数据存储是什么？
- 答案：`map<string, string>`
- 代码示例（简化版）
- 这是一个最基础的 NoSQL 数据库！

**图片：** Map 内存结构示意图

**提示词（如果需要 AI 生成概念图底版加后期 PPT 积木叠字，请用此核心结构版）：**
```text
【主题】Simple key-value storage flow in memory system diagram
【构图】Symmetrical diagram: Input nodes on the left, central memory storage blocks, output nodes on the right. Linked by strict orthogonal directed arrows.
【元素】
- Left side: Two blank rectangular blocks for input actions.
- Center main area: A large rectangular container holding stacked internal horizontal boxes.
- Right side: One rectangular block for system return value.
- Clear structural connections using straight arrow lines.
- No text generation inside boxes needed, focus entirely on generating clean, high-quality layout structures.
【风格】Strict academic paper diagram, monochrome scheme, ONLY 1-2px thin black solid lines, precise white background. Use subtle light gray fill ONLY to distinguish container hierarchy. Sharp corners (no rounded corners), zero shadows, maximum minimalist and technical look.
```

---

## 第 4 页：三个核心问题

**内容：**
- 但是...这个简单 map 有什么问题？

| 问题 | 现象 | 解决方案 |
|------|------|----------|
| 1. 数据持久化 | 程序关闭数据消失 | 序列化 + 转储到磁盘 |
| 2. 条件查询 | 只能查 key，value 查询要遍历 | 建立索引 |
| 3. 磁盘交互 | 如何高效读写磁盘 | 缓冲池 (Buffer Pool) |

**图片：** 三行问题-解决方案对照图

**画法说明**：使用 PPT 表格或列表。
- 三行，每行：序号圆圈 → 问题描述 → 箭头 → 解决方案
- 第 1 行：① 数据持久化 → 序列化与转储
- 第 2 行：② 条件查询 → 建立索引
- 第 3 行：③ 磁盘交互 → 缓冲池

---

## 第 5 页：存储层次结构（OS 知识穿插）

**内容：**
- 为什么需要持久化？先看存储层次：
  - CPU 高速缓存：ns 级，MB 级，**易失性**
  - 内存 (RAM)：较快，GB 级，**易失性**
  - 磁盘：慢，TB 级，**非易失性（持久）**
- Trade-off：速度 vs 持久性

**图片：** 存储层次金字塔图

**画法说明**：使用 PPT 梯形或三角形表示金字塔。
- 顶层（小）：CPU高速缓存 (ns级, MB级, 易失性)
- 中层（中）：内存(RAM) (较快, GB级, 易失性)
- 底层（大）：磁盘 (慢, TB级, 非易失性)
- 右侧：垂直箭头标注"速度↓"

---

## 第 6 页：MiniOB 项目全景图

**内容：**
- MiniOB 是如何解决这三个问题的？
- 展示整体架构：Client → Network → SQL Parser → Optimizer → Executor → Storage Engine

**图片：** MiniOB 整体架构图

**画法说明**：使用 PPT 形状绘制分层架构图。
- 上层横向流程（从左到右）：
  - 客户端 → 网络层 → SQL解析器 → 语句处理 → 优化器 → 执行器
  - 用箭头连接各组件
- 下层大矩形：存储引擎
  - 内部包含：表管理、索引B+树、缓冲池、磁盘
- 用双向箭头连接上层"执行器"与下层"存储引擎"
- 整体用浅色区分层次：上层用浅蓝，下层用米色

---

## 第 7 页：SQL 处理流程

**内容：**
- 一条 SQL 的一生：
  1. ParseStage：词法 + 语法解析 → ParsedSqlNode
  2. ResolveStage：语义分析 → Statement
  3. Optimizer：生成执行计划（DML）
  4. ExecuteStage：执行器 → 调用存储层

**图片：** SQL 处理流程图（使用已提取的 06_sql_architecture.png）

**提示词（nanobanana备用）：**
```text
【主题】SQL processing pipeline conceptual flowchart
【构图】Horizontal sequence of five node containers connected by robust directed arrows, conveying an industrial pipeline feel.
【元素】
- Five prominent rectangular boxes aligned horizontally.
- Below each main box, a smaller connected box or line for annotation placeholders.
- Do not generate text inside boxes. Leave perfect white space for PPT text overlay.
- Arrows: Clean rightward arrows connecting the main stages.
【风格】Strict academic paper diagram, monochrome scheme, ONLY 1-2px thin black solid lines, precise white background. Use subtle light gray fill ONLY to distinguish hierarchy. Sharp corners, zero shadows, purely structural and technical blueprint style.
```

---

## 第 8 页：SEDA 框架详解

**内容：**
- MiniOB 使用 SEDA（Staged Event-Driven Architecture）
- 每个 Stage 有独立的事件队列和线程池
- 好处：解耦、可扩展、线程复用

**图片：** SEDA 架构图（使用已提取的 server_module/rId7.png）

**提示词（nanobanana备用）：**
```text
【主题】SEDA (Staged Event-Driven Architecture) computation pipeline conceptual diagram
【构图】Horizontal sequence of large container boxes connected by robust arrows, to show event passing from one stage to another.
【元素】
- Three large rectangular containers aligned horizontally.
- Inside each container: The top section is slightly shaded gray (representing a Thread Pool), the bottom section contains smaller stacked boxes (representing local event queues).
- Use thick straight arrows horizontally linking the containers to represent Event Flow.
- No text generation inside boxes needed, leave space for PPT text overlays.
【风格】Strict academic paper diagram, monochrome scheme, ONLY 1-2px thin black solid lines, precise white background. Use subtle light gray fill ONLY to distinguish the thread-pool sections. Sharp corners (no rounded corners), zero shadows. Focus on pure structural aesthetics.
```

---

## 第 9 页：调试方法论

**内容：**
- 调试是理解代码最好的方式
- 关键断点位置速查表

**图片：** 调试断点层级图

**画法说明**：使用 PPT 树形结构或层级列表。
- 根节点：调试入口
- 四个分支：
  - 网络层 session_stage.cpp:35
  - 解析层 parse_stage.cpp:49
  - 语句层 stmt.cpp:48
  - 执行层 command_executor.cpp:30

---

## 第 10 页：火山模型（Volcano Model）

**内容：**
- 查询执行使用火山模型（拉取驱动）
- 每个算子调用 `next()` 向子算子要数据

**图片：** 火山模型示意图（使用已提取的 structure_overview/rId9.png）

**提示词（nanobanana备用）：**
```text
【主题】Volcano execution model in database, pull-based hierarchical data operator stack
【构图】Vertical stacked diagram, bottom-up data flow.
【元素】
- A vertical stack of four modular rectangular boxes. The largest at the bottom, decreasing slightly in prominence or keeping identical width as they go up.
- Connecting lines: Vertical upward-pointing arrows traversing through the exact center of each box to the one above it.
- Geometric precision is essential. Focus on a clear layered architecture. No text generation required. 
【风格】Strict academic paper diagram, monochrome scheme, ONLY 1-2px thin black solid lines, precise white background. Use alternating white and very light gray fill for the stacked boxes to highlight separation. Sharp corners, zero shadows, purely technical blueprint style.
```

---

## 第 11 页：实战任务 - Drop Table 实现

**内容：**
- 目标：实现 DROP TABLE 语句
- CREATE vs DROP 是一对相反操作

**图片：** CREATE vs DROP 对比图

**画法说明**：使用 PPT 左右两列布局。
- 左侧（CREATE TABLE）：
  - opened_tables_加入
  - new Table()
  - 创建文件 .table/.data/.lob
- 右侧（DROP TABLE）：
  - opened_tables_移除
  - delete Table
  - 删除文件 .table/.data/.lob
- 中间：双向箭头，标注"相反操作"

---

## 第 12 页：Drop Table 完整调用链

**内容：**
- 代码路径流程图

**图片：** 调用链流程图

**画法说明**：使用 PPT 垂直流程图。
- 七个步骤，从上到下：
  1. SQL: DROP TABLE
  2. ParseStage解析
  3. ResolveStage语义分析
  4. DropTableStmt创建
  5. CommandExecutor分发
  6. DropTableExecutor执行
  7. Db::drop_table存储层
- 最后一步展开：检查存在性 → 从map移除 → delete对象 → 删除文件

---

## 第 13 页：关键代码解析 - Db::drop_table

**内容：**
- 核心逻辑（伪代码展示）

**图片：** 四步骤代码流程图

**画法说明**：使用 PPT 垂直列表，每个步骤包含代码。
- 步骤 1：检查表是否存在 | opened_tables_.find()
- 步骤 2：从内存映射移除 | opened_tables_.erase()
- 步骤 3：删除Table对象 | delete table
- 步骤 4：删除磁盘文件 | filesystem::remove()

---

## 第 14 页：实践任务与总结

**内容：**
- 任务清单和今日要点

**图片：** 任务清单图

**画法说明**：使用 PPT 列表，分两部分。
- 实践任务（带复选框 □）：
  - 查看feature/drop-table分支
  - 在新分支独立实现
  - 添加断点调试观察
- 今日要点（带圆点 •）：
  - SQL处理全流程
  - 调试方法
  - CREATE/DROP对称性

---

## 第 15 页：Q&A / 休息

**内容：**
- 问题时间
- 10 分钟休息

**图片：** 无需图片

---

## 图片使用汇总

| PPT 页 | 图片名称 | 建议来源制作方式 | 备注 |
|--------|----------|------|------|
| 2 | 四阶段流程图 | **PPT 原生** | 直接使用 PPT SmartArt 水平流程图 |
| 3 | Map内存结构图 | **nanobanana** | AI 仅生成黑白带结构的空底图，使用 PPT 叠加文字 |
| 4 | 三问题对照图 | **PPT 原生** | 直接使用 PPT 表格或列表排版 |
| 5 | 存储金字塔图 | **PPT 原生** | 直接使用 PPT SmartArt 梯形图/金字塔图 |
| 6 | MiniOB架构图 | 已提取图片或 nanobanana | 优先使用 `05_observer_architecture.png` |
| 7 | SQL处理流程图 | 已提取图片或 nanobanana | 优先使用 `06_sql_architecture.png` |
| 8 | SEDA架构图 | 已提取图片或 nanobanana | 优先使用 `server_module/rId7.png` |
| 9 | 调试断点图 | **PPT 原生** | 含代码路径必须用原生文本框或 PPT 树状图以防错字 |
| 10 | 火山模型图 | 已提取图片或 nanobanana | AI仅生成物理栈与向上的层级流，文字靠 PPT 叠加 |
| 11 | CREATE/DROP对比图 | **PPT 原生** | PPT 左右列排版或对比表格 |
| 12 | 调用链流程图 | **PPT 原生** | 代码流建议直接使用垂直流程文本排版 |
| 13 | 四步骤代码图 | **PPT 原生** | 大段伪代码用 PPT 文本和列表渲染最为清晰 |
| 14 | 任务总结图 | **PPT 原生** | 检查项列表，纯排版 |

---

## 提示词使用说明

1. **制图策略分离**：涉及大量文字对齐、具体代码引用和检查表（Checklist）的页面，不要使用 AI 图像模型，坚定使用 PPT 原生 SmartArt 和表格以保证修改灵活性和精确性。
2. **AI出结构 + PPT贴字**：使用 nanobanana 时，利用它在框架构建上的审美感，只让它输出不含字词的纯底图（结构感极强的容器块、管道、关系箭头）。最终在 PPT 中向预留的空位叠放文本框，确保大纲文字不出错。
3. **优先使用已提取图片**：第6、7、8、10页如果已存在能直接用的技术文档图片，请优先复用，以免二次理解引入信息误差。
4. **统一风格准则**：
   - 所有 AI 图片必须严格遵守《CLAUDE.md》提出的学术论文风格：尽量取消填充，多使用 1-2px 黑线建立轮廓结构。
   - 绝不要用多余颜色（绝对禁止使用浅蓝、米色等），有且仅有白和浅灰填充，用灰度的对比反映组件层叠。
   - 图形形状要求规整矩形（无圆角）、无阴影，展现严肃的工程感。