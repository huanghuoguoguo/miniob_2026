# Day2 上午 PPT 脚本：Record Manager 与 Text / Update 实现

## PPT 整体信息
- **标题**：第二天上午：Record Manager 与 Text / Update 实现
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 C++、数据结构与 MiniOB Day1 基础

> **图片风格规范**：参考 `/root/workspace/miniob_2026/expr/CLAUDE.md` 中的图片生成规范

## 教学目标与讲授主线

- 目标 1：让学生理解“记录”在页面中如何落盘，以及 RID、Bitmap、Page Header 各自解决什么问题
- 目标 2：让学生知道 Record Manager 在 MiniOB 体系中的位置，以及它和 Buffer Pool、Index、Table 的关系
- 目标 3：让学生理解为什么 `TEXT` 不能继续沿用定长 `CHAR` 的处理方式，以及常见的变长存储策略
- 目标 4：让学生通过 `UPDATE` 语句把“记录存储 + 类型系统 + 执行流程”三件事串起来

**讲授取舍建议**：
- 上午重点不是把页面格式和所有代码细节讲尽，而是建立“记录如何存、如何找、如何改”的整体认知
- PPT 主要承担结构图、对比图、调用链和修改点导航，不承担大段代码和完整实现说明
- `TEXT` 和 `UPDATE` 都适合作为“从概念落到实现”的案例，但不宜把所有边界条件都塞进 PPT

## 材料分工建议

- `day2_ppt_script_morning.md`：用于准备 PPT，少字、强结构，服务于你口头讲解
- `day2-morning.md`：用于讲义、备课和课后回看，保留实现步骤、代码片段、调试点和扩展问题
- 现场演示：用于补足 `INSERT` / `UPDATE` 调试、`TEXT` 表测试、断点观察和实践说明

## 建议时间安排（3 小时）

- 0-10 分钟：开场、回顾 Day1、说明今天主线
- 10-35 分钟：模块关系、页面结构、RID、定长/变长记录
- 35-60 分钟：Record Manager 代码结构、插入流程、关键断点
- 60-85 分钟：从 `CHAR` 到 `TEXT`，讲清存储问题与混合策略
- 85-95 分钟：休息或现场答疑
- 95-120 分钟：`TEXT` 实现入口与调用链
- 120-145 分钟：`UPDATE` 从 DELETE 类比切入，讲执行流程
- 145-175 分钟：学生实践与操作，你巡回答疑
- 175-180 分钟：总结与机动答疑

## 使用原则

- 一页只讲一个主要结论，不要把页面结构、代码名、调用链和思考题全塞在同一页
- 页面结构图、流程图、对比图、修改点页优先使用 PPT 原生绘制，保证临场可改、术语准确
- 如果需要 AI，只让它出不带文字的结构底图，最终由 PPT 叠字
- 这节课必须留出动手机会，否则学生容易“理解概念”，但不会顺着代码改功能

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 2 上午
- 副标题：Record Manager 与 Text / Update 实现

**图片：** 无需图片

**讲授建议（约 2 分钟）**：
- 开场直接点题：今天从“索引怎么定位记录”继续往下走，回答“记录本身怎么存、怎么改”
- 告诉学生：上午不是独立知识点堆砌，而是把存储、类型和执行串起来

---

## 第 2 页：课程安排预览

**内容：**
- 今天我们要做什么？
  1. Record Manager：记录怎么落到页面
  2. Text 类型：为什么不能继续用定长 char
  3. UPDATE 语句：如何在执行阶段修改记录
  4. 实践与调试：看代码、打断点、动手验证

**图片：** 四阶段水平流程图

**画法说明**：使用 PPT SmartArt 或手动绘制四个等宽矩形。
- 矩形 1：Record Manager
- 矩形 2：Text 类型
- 矩形 3：UPDATE 语句
- 矩形 4：实践调试

**讲授建议（约 3 分钟）**：
- 这一页只讲路线和预期产出，不展开概念
- 要让学生知道：前半段建立存储模型，后半段用功能实现把模型落到代码

---

## 第 3 页：从 Table 到磁盘文件

**内容：**
- 先回答一个问题：一张表和 Record Manager、Index、Buffer Pool 到底是什么关系？
- 关键词：
  - `Db -> Table`
  - `Table -> RecordFileHandler / Index`
  - `Record Manager -> Buffer Pool`
  - `Index 通过 RID 指向 Record`

**图片：** MiniOB 存储模块关系图

**画法说明**：使用 PPT 原生分层关系图。
- 最上层：`Db`
- 中间：`Table`
- 左下：`Record Manager`
- 右下：`Index`
- 底层：`Buffer Pool` 与磁盘文件
- 用箭头标出“持有”“通过 RID 定位”“通过页面读写”

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style layered architecture diagram showing how Db, Table, Record Manager, Index, Buffer Pool, and disk files relate in a database kernel.

Layout:
Top-to-bottom layered composition. Db at the top, Table in the middle, Record Manager and Index beneath it, Buffer Pool below them, and disk files at the bottom.

Semantic Elements:
- One top container for Db
- One middle container for Table
- Two side-by-side containers for Record Manager and Index
- One wide container for Buffer Pool
- One bottom strip for disk files
- Thin directional arrows showing ownership and access flow

Text Labels:
- 数据库实例 Db
- 表 Table
- 记录管理器
- 索引
- 缓冲池
- 磁盘文件
- 持有
- 通过 RID 定位
- 通过页面读写

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light desaturated blue fills
- minimal decoration
- use Chinese labels for structural explanations
- keep English only for code identifiers such as Db, Table, RID
- finished presentation-ready diagram

Negative Constraints:
- no blank unlabeled containers
- no saturated colors
- no heavy shadows
- no 3D rendering
```

**讲授建议（约 8 分钟）**：
- 这页的目标是把地图立起来，不是讲清每个类的全部职责
- 要重点讲一句：索引不直接存整条记录，而是通过 RID 回到 Record Manager 找记录

---

## 第 4 页：页面长什么样？

**内容：**
- 一条记录不是直接扔到文件里，而是放在页面中
- 页面三部分：
  - Page Header
  - Bitmap
  - Record Data

**图片：** 数据页面结构图

**画法说明**：使用 PPT 竖向分层矩形图。
- 顶层：Page Header
- 中层：Bitmap
- 底层：多个槽位组成的 Record Data
- 右侧可加 3 个短标签：
  - 记录数量
  - 槽位占用
  - 真实记录内容

**讲授建议（约 8 分钟）**：
- 这是上午最关键的基础页之一，建议慢讲
- 不要讲得太像数据结构课，重点放在“为什么页内还需要再做一层管理”

---

## 第 5 页：RID 与 Bitmap 解决什么问题？

**内容：**
- RID = `page_num + slot_num`
- Bitmap 负责标记槽位是否被占用
- 删除记录并不一定立刻挪动整页数据

**图片：** 页面内定位示意图

**画法说明**：使用 PPT 左右布局。
- 左侧：`RID(page, slot)` 两段式结构
- 右侧：一个简化页面，多个槽位，上方一条 bitmap
- 用一根箭头从 RID 指到某个槽位

**讲授建议（约 8 分钟）**：
- 要把 RID 讲成“磁盘世界里的稳定地址”
- 再把 Bitmap 讲成“页内最便宜的占用管理方案”

---

## 第 6 页：定长记录 vs 变长记录

**内容：**
- 定长记录：位置好算，管理简单
- 变长记录：节省空间，但管理复杂
- MiniOB 当前主路线：定长为主，长文本特殊处理

**图片：** 定长/变长记录对比图

**画法说明**：使用 PPT 左右对比图。
- 左侧：固定宽度字段块
- 右侧：长度不同的字段块
- 底部只保留两行结论：
  - “简单但浪费”
  - “灵活但复杂”

**讲授建议（约 6 分钟）**：
- 这页不要掉进细节，把矛盾抛出来就够了
- 结尾自然过渡：`TEXT` 就是这个矛盾的典型例子

---

## 第 7 页：Record Manager 代码结构

**内容：**
- 核心对象分工：
  - `RecordFileHandler`
  - `RecordPageHandler`
  - `RecordScanner`
- 一句话职责：
  - 文件级管理
  - 页面级管理
  - 扫描遍历

**图片：** Record Manager 类职责图

**画法说明**：使用 PPT 三栏关系图。
- 三个竖向模块并列
- 每个模块只放类名和 2-3 个关键方法
- 不要放完整 UML

**讲授建议（约 8 分钟）**：
- 这页是为了让学生后面打断点时不至于迷路
- 不要求他们记全方法，只要知道“文件级 / 页面级 / 扫描级”三层分工

---

## 第 8 页：插入一条记录会发生什么？

**内容：**
- `INSERT` 的四步：
  1. 找页
  2. 找空槽
  3. 写数据
  4. 返回 RID

**图片：** 插入记录流程图

**画法说明**：使用 PPT 竖向流程图。
- 四个步骤自上而下
- 最后一个框单独强调：返回 `RID`

**讲授建议（约 8 分钟）**：
- 这一页适合配合现场调试一起讲
- 强调“插入记录”不仅是写字节，更是给后续索引和更新建立定位能力

---

## 第 9 页：为什么 CHAR 不够用了？

**内容：**
- `char(20)` 的问题：
  - 短字符串浪费空间
  - 长字符串装不下
  - 文章内容根本不适合定长列

**图片：** CHARS 局限性对比图

**画法说明**：使用 PPT 三行问题列表。
- 每一行：场景 -> 问题
- 右侧可放一个小例子：
  - `"Alice"` 只用 5B，却占 20B

**讲授建议（约 6 分钟）**：
- 这页是 `TEXT` 的引入页，不要讲类型实现细节
- 只让学生接受一个事实：变长文本不能继续靠定长列硬撑

---

## 第 10 页：TEXT 应该怎么存？

**内容：**
- 两种策略：
  - 短文本：内联
  - 长文本：外部 LOB 存储
- 核心 trade-off：
  - 内联快，但占记录空间
  - 指针省空间，但需要额外 I/O

**图片：** TEXT 混合存储策略图

**画法说明**：使用 PPT 上下对照图。
- 上半部分：短文本直接放在记录中
- 下半部分：记录中存长度 + 指针，箭头指向 `.lob`
- 只保留“inline”和“LOB”两个关键词

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style diagram showing hybrid TEXT storage: inline short text versus external LOB storage for long text.

Layout:
Top-bottom comparison. Upper part shows text stored directly in a record. Lower part shows a record holding a pointer to an external LOB block.

Semantic Elements:
- One record container for inline storage
- One record container plus one external LOB container for out-of-line storage
- Thin pointer arrow from record to LOB

Text Labels:
- 短文本
- 直接内联
- 长文本
- 指针
- LOB 文件
- 访问快但占空间
- 节省空间但多一次读取

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light desaturated blue fills
- minimal decoration
- use Chinese labels for process descriptions and trade-offs
- keep English only for TEXT and LOB if needed
- finished presentation-ready diagram

Negative Constraints:
- no blank storage boxes
- no saturated colors
- no heavy shadows
- no 3D effect
```

**讲授建议（约 8 分钟）**：
- 这页是理解 `TEXT` 的核心页，建议多讲一点 trade-off
- 不要承诺实现细节一定完全等同于图，图的目的是先建立思维模型

---

## 第 11 页：TEXT 类型实现入口

**内容：**
- 支持 `TEXT` 至少要打通这些位置：
  1. 类型枚举
  2. 词法 / 语法
  3. `TextType`
  4. 记录写入路径

**图片：** TEXT 实现改动点图

**画法说明**：使用 PPT 四行列表。
- 每行：模块 | 要改什么 | 文件
- 例如：
  - `AttrType` | 加 `TEXTS`
  - parser | 支持 `TEXT`
  - type system | `TextType`
  - table/record | 写入记录与存储策略

**讲授建议（约 10 分钟）**：
- 这页不是让学生背文件名，而是给他们实践时的修改地图
- 口头强调：先打通“类型被识别”，再处理“值怎么存”

---

## 第 12 页：TEXT 从 SQL 到记录的调用链

**内容：**
- 一条 `TEXT` 数据插入的路径：
  - parser 识别 `TEXT`
  - `TableMeta` 记录字段类型
  - `make_record()` 构造值
  - 记录中内联或写 LOB

**图片：** TEXT 调用链流程图

**画法说明**：使用 PPT 竖向流程图。
- 顶部：`CREATE TABLE ... content text`
- 中间：类型注册与字段元数据
- 底部：`INSERT` -> `make_record()` -> Record/LOB

**讲授建议（约 8 分钟）**：
- 这页要把“DDL 定义类型”和“DML 写入值”这两条链连起来
- 让学生知道 `TEXT` 不是只改 parser，也不是只改类型类

---

## 第 13 页：从 DELETE 到 UPDATE

**内容：**
- UPDATE 可以先理解成：
  - 找到旧记录
  - 构造新记录
  - 删除旧记录
  - 插入新记录

**图片：** DELETE vs UPDATE 对照图

**画法说明**：使用 PPT 左右对照布局。
- 左侧：DELETE：查找 -> 删除
- 右侧：UPDATE：查找 -> 改值 -> 删除旧记录 -> 插入新记录
- 中间可加一条强调语：`UPDATE = 查找 + 重写`

**讲授建议（约 8 分钟）**：
- 这页是上午第二个关键桥页
- 要把 `UPDATE` 和前面讲过的“记录存储、TEXT 变长”自然串起来

---

## 第 14 页：UPDATE 的处理流程

**内容：**
- 从 SQL 到执行：
  1. Parser
  2. `UpdateStmt`
  3. Logical / Physical Operator
  4. `UpdatePhysicalOperator::open()`

**图片：** UPDATE 完整流程图

**画法说明**：使用 PPT 竖向流程图。
- 每一层只保留对象名和一句职责
- 最后一个框展开三步：
  - 复制旧数据
  - 改目标字段
  - delete + insert

**讲授建议（约 10 分钟）**：
- 这页适合配合代码演示讲，不建议只看 PPT 空讲
- 要讲明白为什么 `UPDATE` 在执行层会和 Record Manager 紧密耦合

---

## 第 15 页：实现时要特别注意什么？

**内容：**
- 三个关键注意点：
  1. 内存分配与释放要配对
  2. 变长字段更新比定长字段更敏感
  3. 删除旧记录 + 插入新记录会影响 RID / 索引 / 日志

**图片：** 风险提示列表

**画法说明**：使用 PPT 三行警示列表。
- 每行一个关键词 + 一句短说明
- 不用图形夸张渲染，保持克制

**讲授建议（约 8 分钟）**：
- 这页主要讲工程意识，不讲大段实现细节
- 特别提醒 `malloc/free` 配对这类低级但高频的问题

---

## 第 16 页：实践任务与总结

**内容：**
- 实践任务：
  - 调试 `INSERT`，看 RID 和页面分配
  - 实现或阅读 `TEXT` 支持
  - 调试 `UPDATE`，观察 delete + insert
- 今日要点：
  - 记录按页管理
  - `TEXT` 需要变长存储策略
  - `UPDATE` 本质是查找后的记录重写

**图片：** 任务清单图

**画法说明**：使用 PPT 列表，分为“实践任务”和“今日要点”两栏。

**讲授建议（约 5 分钟）**：
- 这一页之后应切到学生实践时间
- 任务顺序要给得明确，不要让学生同时改三块内容

---

## 第 17 页：Q&A / 机动答疑

**内容：**
- 问题时间
- 机动答疑
- 预告：下午继续围绕执行与存储能力完善系统

**图片：** 无需图片

**讲授建议**：
- 如果实践问题多，这页可以完全当机动缓冲
- 如果节奏快，也可以用来收尾和布置课后复盘

---

## 图片使用汇总

| PPT 页 | 图片名称 | 建议来源制作方式 | 备注 |
|--------|----------|------|------|
| 2 | 四阶段流程图 | **PPT 原生** | SmartArt 或手动画四段流程 |
| 3 | 模块关系图 | **PPT 重绘优先，AI 备用** | 层次清晰，建议按讲法重绘 |
| 4 | 页面结构图 | **PPT 原生** | 规则结构图，PPT 最稳 |
| 5 | RID 与 Bitmap 图 | **PPT 原生** | 需要精确指向槽位 |
| 6 | 定长/变长对比图 | **PPT 原生** | 左右对比足够清晰 |
| 7 | Record Manager 职责图 | **PPT 原生** | 类职责图不建议交给 AI |
| 8 | 插入流程图 | **PPT 原生** | 流程清晰，便于加术语 |
| 9 | CHARS 局限图 | **PPT 原生** | 纯问题列表，直接排版 |
| 10 | TEXT 存储策略图 | **PPT 原生优先，AI 备用** | 若想更规整，可让 AI 只出结构底图 |
| 11 | TEXT 改动点图 | **PPT 原生** | 文件名和模块名必须可精确修改 |
| 12 | TEXT 调用链图 | **PPT 原生** | 调用链和术语不宜交给 AI |
| 13 | DELETE / UPDATE 对照图 | **PPT 原生** | 对照关系明确，适合手画 |
| 14 | UPDATE 流程图 | **PPT 原生** | 执行链必须准确 |
| 15 | 风险提示列表 | **PPT 原生** | 纯文本结构页 |
| 16 | 任务总结图 | **PPT 原生** | 清单页无需 AI |

---

## 提示词使用说明

1. **制图策略分离**：含代码路径、类型名、类名、调用链、修改点的页面，一律优先使用 PPT 原生绘制。
2. **AI优先直接出成品图**：模块关系图、TEXT 存储策略这类概念结构页，优先让 AI 直接生成带简短标签的成品图；必要时再退回到底图模式。
3. **统一风格准则**：
   - 所有 AI 图片必须遵循《CLAUDE.md》的学术论文风格：低饱和、克制、清晰。
   - 主体保持白底、深灰线条、浅灰填充，允许少量浅灰蓝作为强调色。
   - 禁止使用饱和色块、重阴影、3D 效果、营销海报风格。
   - 解释性标签、流程说明、存储策略优先使用中文；只有代码标识符和类型名保留英文。
4. **课堂控制原则**：不要在 PPT 中展开页面头字段、类型接口、`malloc/free` 等代码细节，它们适合口头讲解或现场演示。
5. **实践优先原则**：这节课至少要留出 30 分钟以上给学生动手，否则他们很难真正理解 `TEXT` 和 `UPDATE` 的实现路径。
