# Day1 上午 PPT 脚本：环境配置与 Drop Table 实现

## PPT 整体信息
- **标题**：第一天上午：环境配置与 Drop Table 实现
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 C++ 和数据结构基础

> **图片风格规范**：参考 `/root/workspace/miniob_2026/expr/CLAUDE.md` 中的图片生成规范

## 教学目标与讲授主线

- 目标 1：让学生知道环境配置的完成标准，不在安装细节里迷失
- 目标 2：让学生先建立 MiniOB 的整体处理链路，再进入局部实现
- 目标 3：让学生学会通过断点调试理解 SQL 是如何一步步落到存储层的
- 目标 4：让学生通过 `DROP TABLE` 这个小型 DDL 任务，理解 `CREATE`/`DROP` 的对称关系

**讲授取舍建议**：
- 环境安装的详细命令和报错排查，主要放在讲义和现场实操里，PPT 只保留检查项和主路径
- PPT 的重点应放在“整体链路、调试入口、Drop Table 实现逻辑”，不要把大量终端命令塞进主线页面
- 含有精确代码路径、行号、执行顺序的页面，优先使用 PPT 原生图形，保证后续可改、可对齐、可核对

## 材料分工建议

- `day1_ppt_script_morning.md`：用于准备 PPT，大纲化、少字、强节奏，服务于你口头讲解
- `day1-morning.md`：用于讲义、备课和课后回看，保留命令、代码、背景解释和扩展说明
- 现场演示：用于补足 PPT 不适合承载的内容，例如编译、运行、打断点、观察调用栈

## 建议时间安排（3 小时）

- 0-10 分钟：开场、课程安排、环境检查
- 10-35 分钟：从 `map` 出发，讲三个核心问题和存储层次
- 35-60 分钟：MiniOB 全景图、SQL 处理流程、SEDA 总体认识
- 60-85 分钟：现场调试演示，带学生看 CREATE TABLE / SELECT 的关键断点
- 85-95 分钟：休息或现场答疑
- 95-120 分钟：引入 DROP TABLE，讲 CREATE / DROP 对称关系与完整调用链
- 120-140 分钟：讲 `Db::drop_table` 核心逻辑和实现切入点
- 140-175 分钟：学生实践与操作，你巡回答疑
- 175-180 分钟：总结、布置课后继续完善的方向

## 使用原则

- PPT 每页只保留“你希望学生看见的一层结构”，详细解释由你口头补充
- 终端命令、文件路径、伪代码、断点位置这类内容，优先在演示或讲义中展开，不要全部堆进 PPT
- 一页只承担一个主要任务：引入问题、建立结构、给出对照、说明调用链，避免一页同时做三件事
- 上午这节课必须给学生留出实际动手机会，否则他们会把内容理解成“看懂了”，但不会操作

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 1 上午
- 副标题：环境配置与 Drop Table 实现
- 底部：你的名字/日期

**图片：** 无需图片，使用简洁文字排版

**讲授建议（约 2 分钟）**：
- 只说今天的目标和产出，不展开背景介绍
- 明确告诉学生：上午不是讲完所有 MiniOB，而是先打通“看懂链路 + 能开始做题”

---

## 第 2 页：课程安排预览

**内容：**
- 今天我们要做什么？
  1. 环境检查：确认开发环境可用
  2. 项目结构：理解 MiniOB 架构
  3. 调试技巧：掌握调试方法
  4. 实战任务：实现 DROP TABLE

**图片：** 四阶段水平流程图

**画法说明**：使用 PPT SmartArt 的水平流程图，或手动绘制 4 个等宽矩形，添加连接箭头。
 - 矩形 1：环境检查
- 建议口播：环境安装本身作为课前准备或现场演示，这里只检查是否已经具备最小可运行条件
- 矩形 2：项目结构  
- 矩形 3：调试技巧
- 矩形 4：DROP TABLE实现

**讲授建议（约 3 分钟）**：
- 这一页只讲路线，不讲细节
- 要让学生提前知道：前半段是理解系统，后半段是动手实现

---

## 第 3 页：开发环境检查表

**内容：**
- 本节默认环境安装已基本完成，这里只做最小运行条件检查
- 四个检查项：
  1. WSL / Linux 环境可正常进入
  2. VSCode 已能连接到 WSL 工程目录
  3. MiniOB 已成功编译
  4. `observer` 与 `obclient` 可以正常启动
- 讲授建议：
  - 不在 PPT 中逐条讲安装命令
  - 这一页只用于开场确认和排障分流
  - 如果有人环境未完成，建议课后补齐或由助教单独协助

**图片：** 环境检查清单

**画法说明**：使用 PPT 原生 checklist 布局。
- 左侧：4 个复选框检查项
- 右侧：一列“完成标准”
- 页面底部可加一行灰色小字：安装细节见讲义与现场演示

**讲授建议（约 5 分钟）**：
- 逐项快速确认，控制在 5 分钟内
- 不现场展开安装教学，只确认是否能进入今天的主线
- 对未完成环境的同学做分流，不让全班在这一页停太久

---

## 第 4 页：从最简单的存储开始

**内容：**
- 问题引入：最简单的数据存储是什么？
- 答案：`map<string, string>`
- 代码示例（简化版）
- 这是一个最基础的 NoSQL 数据库！

**图片：** Map 内存结构示意图

**提示词（如果需要 AI 直接生成成品图，使用这一版）：**
```text
Task:
Create a finished academic-style teaching diagram showing how an in-memory map<string, string> works.

Layout:
Left-to-right teaching composition. Two operations on the left, one central in-memory map container in the middle, one returned result block on the right. The layout should be clean, balanced, and presentation-ready.

Semantic Elements:
- Upper left operation block for 写入
- Lower left operation block for 查询
- Center container labeled map<string, string>
- Inside the center container, visible key-value rows with two columns: key and value
- Example rows such as:
  - name | Alice
  - age | 20
  - city | Beijing
  - id | 1001
- Right side result block showing 返回结果
- Straight arrows: 写入 -> map, 查询 -> map, map -> 返回结果

Text Labels:
- 写入操作
- 查询操作
- map<string, string>
- 键
- 值
- 返回结果
- set("name", "Alice")
- get("name")
- "Alice"

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray fills with very light desaturated blue emphasis
- minimal decoration
- calm, rational, understated
- use Chinese labels for process descriptions and explanations
- keep English only for code identifiers like map<string, string>
- finished presentation-ready diagram, not a draft layout

Negative Constraints:
- no blank placeholder boxes
- no generic wireframe flowchart
- no meaningless empty containers
- no 3D effect
- no heavy shadows
- no saturated colors
```

**讲授建议（约 8 分钟）**：
- 这页是上午主线的起点，要把“数据库不是突然复杂起来的”讲出来
- 代码只放最小片段，重点靠你口头引导学生思考它缺了什么

---

## 第 5 页：三个核心问题

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

**讲授建议（约 8 分钟）**：
- 这一页不要念表格，要用“一个简单系统为什么会自然长成数据库”来串联
- 三个问题里，重点放在“磁盘交互”这一行，为后续 Buffer Pool 和存储层埋钩子

---

## 第 6 页：存储层次结构（OS 知识穿插）

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

**讲授建议（约 6 分钟）**：
- 这页是操作系统知识穿插，点到为止，不要展开成一节 OS 课
- 核心只讲一句：数据库设计就是在快和久之间做权衡

---

## 第 7 页：MiniOB 项目全景图

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
- 整体用低饱和度浅色区分层次：上层可用浅灰蓝，下层可用浅灰

**讲授建议（约 8 分钟）**：
- 这页的目标不是讲细每个模块，而是先把地图立起来
- 学生只要先知道“SQL 不是直接落到磁盘，而是经过若干层”就够了

---

## 第 8 页：SQL 处理流程

**内容：**
- 一条 SQL 的一生：
  1. ParseStage：词法 + 语法解析 → ParsedSqlNode
  2. ResolveStage：语义分析 → Statement
  3. Optimizer：生成执行计划（DML）
  4. ExecuteStage：执行器 → 调用存储层

**图片：** SQL 处理流程图（使用已提取的 06_sql_architecture.png）

**提示词（nanobanana备用）：**
```text
Task:
Create a finished academic-style SQL processing pipeline diagram for a database kernel lecture slide.

Layout:
Five horizontally aligned stage containers with clear left-to-right reading order. The diagram should already contain concise labels and be usable directly in a presentation.

Semantic Elements:
- Five rectangular stage boxes
- Thin rightward arrows between stages
- A slightly larger final storage box or area
- Optional short subtitle text under key stages

Text Labels:
- SQL 输入
- 词法/语法解析
- 语义分析
- 优化器
- 执行器
- 存储引擎
- ParseStage
- ResolveStage
- ExecuteStage

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light desaturated blue fills
- balanced whitespace
- professional and understated
- use Chinese labels for process descriptions
- keep English only for code or stage identifiers when needed
- finished presentation-ready diagram

Negative Constraints:
- no blank stage placeholders
- no generic empty boxes
- no saturated colors
- no heavy shadows
- no 3D rendering
```

**讲授建议（约 8 分钟）**：
- 这是全场最关键的链路页之一，建议你停下来慢讲
- 要把 DDL 和 DML 的分流口头说出来，帮助学生理解为什么 DROP TABLE 不走完整优化器路径

---

## 第 9 页：SEDA 框架详解

**内容：**
- MiniOB 使用 SEDA（Staged Event-Driven Architecture）
- 每个 Stage 有独立的事件队列和线程池
- 好处：解耦、可扩展、线程复用

**图片：** SEDA 架构图（使用已提取的 server_module/rId7.png）

**提示词（nanobanana备用）：**
```text
Task:
Create a finished academic-style SEDA architecture diagram for a systems lecture slide.

Layout:
Three horizontally arranged stage containers. Each stage should clearly show an upper thread-pool region and a lower event-queue region. Use left-to-right event flow arrows and include concise labels directly in the diagram.

Semantic Elements:
- Three large rectangular stage containers
- A top sub-area in each container for thread pool
- A bottom sub-area with stacked queue slots
- Thin arrows showing event flow across stages

Text Labels:
- 阶段 1
- 阶段 2
- 阶段 3
- 线程池
- 事件队列
- Event Flow
- SEDA

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray fills with optional very light blue emphasis
- minimal decoration
- clear modular hierarchy
- use Chinese labels for process descriptions
- finished presentation-ready diagram

Negative Constraints:
- no blank container placeholders
- no industrial poster look
- no saturated colors
- no heavy shadows
- no 3D effect
```

**讲授建议（约 6 分钟）**：
- 这一页只建立“分阶段处理”的认识，不追求学生完全理解线程模型
- 如果时间紧，可以压缩讲解，把细节放到讲义里

---

## 第 10 页：调试方法论

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

**讲授建议（约 5 分钟）**：
- 这页不要停留太久，它的任务是为后面的现场调试演示做导航
- 讲完这页应立刻切到 IDE 或终端做一次真实断点演示

---

## 第 11 页：火山模型（Volcano Model）

**内容：**
- 查询执行使用火山模型（拉取驱动）
- 每个算子调用 `next()` 向子算子要数据

**图片：** 火山模型示意图（使用已提取的 structure_overview/rId9.png）

**提示词（nanobanana备用）：**
```text
Task:
Create a finished academic-style volcano model operator stack diagram for a database lecture slide.

Layout:
Vertical stack with bottom-to-top pull flow. Four aligned operator layers with a centered upward arrow path. The diagram should already contain concise labels and be suitable for direct presentation.

Semantic Elements:
- Four stacked rectangular operator boxes
- One centered upward arrow connecting all layers

Text Labels:
- 表扫描
- 过滤
- 投影
- 输出
- next() 拉取
- Volcano Model

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- alternating white, light gray, and optional very light blue fills
- minimal decoration
- quiet, technical, understated
- use Chinese labels for process descriptions
- keep English only for method name next()
- finished presentation-ready diagram

Negative Constraints:
- no blank placeholder boxes
- no glossy effect
- no saturated colors
- no dramatic lighting
- no 3D rendering
```

**讲授建议（约 5 分钟）**：
- 火山模型是辅助理解 SELECT 流程，不是上午的主角
- 讲清“上层 next() 向下游要数据”即可，不要展开算子优化

---

## 第 12 页：实战任务 - Drop Table 实现

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

**讲授建议（约 8 分钟）**：
- 这一页是从“理解系统”切换到“开始实现”的桥
- 不用急着讲代码，先让学生接受一个核心方法：沿着 CREATE 的反方向推 DROP

---

## 第 13 页：Drop Table 完整调用链

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

**讲授建议（约 10 分钟）**：
- 这页适合配合代码演示一起讲，而不是脱离工程空讲
- 要让学生知道自己真正要改的文件并不多，但链路必须清楚

---

## 第 14 页：关键代码解析 - Db::drop_table

**内容：**
- 核心逻辑（伪代码展示）

**图片：** 四步骤代码流程图

**画法说明**：使用 PPT 垂直列表，每个步骤包含代码。
- 步骤 1：检查表是否存在 | opened_tables_.find()
- 步骤 2：从内存映射移除 | opened_tables_.erase()
- 步骤 3：删除Table对象 | delete table
- 步骤 4：删除磁盘文件 | filesystem::remove()

**讲授建议（约 10 分钟）**：
- 这一页讲“做了什么”和“为什么这样做”，不要逐行念伪代码
- 尤其要强调先释放对象、再删文件这类顺序意识

---

## 第 15 页：实践任务与总结

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

**讲授建议（约 3 分钟）**：
- 这一页之后应切换到学生实践时间
- 任务描述要足够具体，让学生知道先做哪一步，再做哪一步

---

## 第 16 页：Q&A / 休息

**内容：**
- 问题时间
- 10 分钟休息

**图片：** 无需图片

**讲授建议**：
- 如果前面节奏较紧，可以把这一页挪到调试演示之后再用
- 如果学生实践阶段问题较多，也可以把这页变成机动答疑，而不必真的保留完整休息

---

## 图片使用汇总

| PPT 页 | 图片名称 | 建议来源制作方式 | 备注 |
|--------|----------|------|------|
| 2 | 四阶段流程图 | **PPT 原生** | 直接使用 PPT SmartArt 水平流程图 |
| 3 | 环境检查清单 | **PPT 原生** | 只保留检查项和完成标准，不讲安装细节 |
| 4 | Map内存结构图 | **PPT 原生优先，AI 备用** | 这页结构简单，PPT 直接画最稳；若想要更干净的底版，可让 AI 只出空结构 |
| 5 | 三问题对照图 | **PPT 原生** | 直接使用 PPT 表格或列表排版 |
| 6 | 存储金字塔图 | **PPT 原生** | 直接使用 PPT SmartArt 梯形图/金字塔图 |
| 7 | MiniOB架构图 | **PPT 重绘优先** | 结构和术语都较明确，建议按讲义内容在 PPT 重绘，必要时参考已有图 |
| 8 | SQL处理流程图 | **PPT 重绘优先，AI 仅备用** | 这页概念路径很标准，PPT 画更准确，也更方便改名和加注释 |
| 9 | SEDA架构图 | 已提取图片或 **PPT 重绘** | 若已有图清晰可复用；若风格不统一，建议重绘，不建议直接依赖 AI 理解结构 |
| 10 | 调试断点图 | **PPT 原生** | 含代码路径必须用原生文本框或 PPT 树状图以防错字 |
| 11 | 火山模型图 | **PPT 重绘优先，AI 备用** | 火山模型本质是层级栈图，PPT 更容易精确控制箭头方向和算子名称 |
| 12 | CREATE/DROP对比图 | **PPT 原生** | PPT 左右列排版或对比表格 |
| 13 | 调用链流程图 | **PPT 原生** | 代码流建议直接使用垂直流程文本排版 |
| 14 | 四步骤代码图 | **PPT 原生** | 大段伪代码用 PPT 文本和列表渲染最为清晰 |
| 15 | 任务总结图 | **PPT 原生** | 检查项列表，纯排版 |

---

## 提示词使用说明

1. **制图策略分离**：涉及大量文字对齐、具体代码引用和检查表（Checklist）的页面，不要使用 AI 图像模型，坚定使用 PPT 原生 SmartArt 和表格以保证修改灵活性和精确性。
2. **AI优先出成品图**：适合 AI 的概念图、结构图、流程图，优先让它直接生成可上屏的成品图，不再默认只出空底图。
3. **优先重绘简单结构图**：像 SQL 流程、火山模型、CREATE/DROP 对照、调用链这类规则框图，优先用 PPT 重绘。它们不是艺术插图，而是教学结构图，准确性和可修改性比“生成感”重要。
4. **谨慎复用已提取图片**：第6、8、10页若已有图片非常清晰且信息准确，可以复用；如果风格与整套 PPT 差异太大，建议按现有内容重绘。
5. **统一风格准则**：
   - 所有 AI 图片必须严格遵守《CLAUDE.md》提出的学术论文风格：低饱和、克制、清晰。
   - 主体保持白底、深灰线条、浅灰填充，允许少量浅灰蓝作为强调色，但只能点到为止。
   - 图形以规整几何块为主，可少量圆角，但不要阴影、不要发光、不要营销海报感。
   - 流程说明、模块名称、解释性标签优先使用中文；只有代码标识符、类型名、类名等才保留英文。
6. **环境配置页面控制原则**：环境安装属于课前准备或现场演示内容，PPT 中只保留一页“环境检查表”，用于确认是否进入主线教学，不展开安装命令和报错细节。
