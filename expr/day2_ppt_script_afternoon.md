# Day2 下午 PPT 脚本：Buffer Pool 缓冲池

## PPT 整体信息
- **标题**：第二天下午：Buffer Pool 缓冲池
- **时长**：约 3 小时
- **目标受众**：大二学生，具备 MiniOB 前两节课基础

> **图片风格规范**：参考 `/root/workspace/miniob_2026/expr/CLAUDE.md` 中的图片生成规范

## 教学目标与讲授主线

- 目标 1：让学生理解操作系统 Page Cache 和数据库 Buffer Pool 的区别，不再把两者混为一谈
- 目标 2：让学生掌握 Buffer Pool 的几个核心概念：Page、Frame、dirty、pin_count、LRU
- 目标 3：让学生建立“读页、改页、刷盘、淘汰”这一整套页面生命周期认知
- 目标 4：让学生知道 MiniOB 中 Buffer Pool 的主要代码入口，并能通过调试观察缓存行为

**讲授取舍建议**：
- 下午的重点是“页面缓存机制”而不是“操作系统缓存课”或“数据库恢复课”
- PPT 主要承担概念边界、生命周期流程、核心结构图和实现导航，不承担完整 WAL/恢复细节
- `Double Write Buffer` 和 `WAL` 只需要讲到“为什么需要”，不要在这节课里展开成事务恢复专题

## 材料分工建议

- `day2_ppt_script_afternoon.md`：用于准备 PPT，少字、强结构，服务于口头讲解
- `day2-afternoon.md`：用于讲义和备课，保留完整解释、代码片段、调试建议和扩展思考
- 现场演示：用于展示缓存命中、脏页刷盘、页面淘汰等动态行为

## 建议时间安排（3 小时）

- 0-10 分钟：回顾上午内容，说明下午主线
- 10-35 分钟：Page Cache 与 Buffer Pool 的边界，为什么数据库要自管缓存
- 35-65 分钟：Page、Frame、dirty、pin_count、PageNum、LRU 等核心概念
- 65-90 分钟：读页、写页、淘汰的生命周期流程
- 90-100 分钟：休息或现场答疑
- 100-130 分钟：MiniOB Buffer Pool 代码结构与关键函数
- 130-150 分钟：Double Write Buffer 与刷盘顺序
- 150-175 分钟：调试观察缓存命中、脏页和淘汰
- 175-180 分钟：总结与延伸问题

## 使用原则

- 一页只讲一个核心结论，不要同时讲概念定义、代码实现和异常场景
- 生命周期流程图、结构图、对照图优先使用 PPT 原生绘制，便于术语精确控制
- 如果要用 AI，只让它生成不带文字的结构底图，最终由 PPT 叠字
- 这节课的关键不是记住所有类名，而是看懂页面在缓存和磁盘之间如何流动

---

## 第 1 页：封面

**内容：**
- 主标题：MiniOB 数据库内核实战 - Day 2 下午
- 副标题：Buffer Pool 缓冲池

**图片：** 无需图片

**讲授建议（约 2 分钟）**：
- 开场直接说明：索引和记录都离不开页面管理，下午要把“页面在内存与磁盘之间如何流动”讲清楚
- 告诉学生：这一节是理解数据库性能和持久性的关键基础层

---

## 第 2 页：上午回顾与下午主线

**内容：**
- 上午我们学了什么？
  - 记录按页存储
  - RID 定位记录
  - `TEXT` / `UPDATE` 都会落到页面操作
- 下午问题：
  - 页面到底是谁缓存的？
  - 什么时候读盘？
  - 什么时候刷盘？

**图片：** 回顾 + 问题引入图

**画法说明**：使用 PPT 上下布局。
- 上半：上午三个要点
- 下半：下午三个问题

**讲授建议（约 5 分钟）**：
- 回顾只服务于引入 Buffer Pool，不要复述上午细节
- 要把学生带到“昨天讲功能，今天讲这些功能底下的页面基础设施”

---

## 第 3 页：Page Cache 是什么？

**内容：**
- 用户程序的 `read()` / `write()` 并不总是直接碰磁盘
- 操作系统会先经过 Page Cache
- 命中则直接从内存返回，未命中才读盘

**图片：** 用户程序 - Page Cache - 磁盘 三层图

**画法说明**：使用 PPT 竖向三层结构图。
- 顶层：用户程序
- 中层：Page Cache
- 底层：磁盘
- 用双向箭头表示数据流

**讲授建议（约 8 分钟）**：
- 这页只讲 Page Cache 的基本作用，不讲内核细节
- 重点是帮学生承认一个事实：操作系统本身已经会缓存页面

---

## 第 4 页：既然有 Page Cache，为什么还要 Buffer Pool？

**内容：**
- 数据库需要的不是“有缓存就行”，而是“可控的缓存”
- 三个关键词：
  - 持久性
  - 淘汰策略
  - 预读与页面优先级

**图片：** Page Cache vs Buffer Pool 对照图

**画法说明**：使用 PPT 左右对照布局。
- 左侧：Page Cache，强调“通用、OS 控制”
- 右侧：Buffer Pool，强调“数据库控制、可感知事务和页面角色”
- 底部加一句结论：`简单 ≠ 可控`

**讲授建议（约 10 分钟）**：
- 这是整场最重要的概念边界页之一，建议慢讲
- 不要把它讲成“Page Cache 没用”，而是讲“它不够数据库使用”

---

## 第 5 页：WAL、刷盘控制与双重缓存

**内容：**
- 持久性要求数据库控制刷盘顺序
- WAL：先日志，后数据页
- 教学项目 MiniOB 实际仍可能与 Page Cache 共存

**图片：** WAL 与数据页顺序示意图

**画法说明**：使用 PPT 左右流程或上下顺序图。
- 日志写入路径
- 数据页写入路径
- 用数字标出“先日志，后页面”

**讲授建议（约 8 分钟）**：
- 这一页只讲顺序约束，不展开恢复算法
- 结论要清楚：数据库需要自己决定“何时刷什么”，这正是自管 Buffer Pool 的理由之一

---

## 第 6 页：Page、Frame、PageNum 分别是什么？

**内容：**
- `Page`：磁盘与缓存管理的基本单位
- `Frame`：内存中包住一个页面的管理壳
- `PageNum`：页面在文件中的编号

**图片：** Page / Frame / PageNum 概念关系图

**画法说明**：使用 PPT 三块关系图。
- 左侧：磁盘页 Page
- 中间：内存 Frame 包住 Page
- 右侧：PageNum -> 文件偏移
- 箭头标出“编号定位”“内存承载”

**讲授建议（约 8 分钟）**：
- 这页不能讲乱，学生很容易把 Page 和 Frame 混掉
- 要反复强调：页面是数据对象，页帧是内存管理对象

---

## 第 7 页：Frame 里最重要的三个字段

**内容：**
- `dirty`
- `pin_count`
- `acc_time` / LRU 信息

**图片：** Frame 字段作用图

**画法说明**：使用 PPT 三列卡片式布局。
- 每列一个字段
- 每列只放一句作用说明
- 可加一个小例子：
  - `dirty = 改过还没刷盘`
  - `pin_count > 0 = 不能淘汰`

**讲授建议（约 8 分钟）**：
- 这页是读后面流程图的前置知识
- 不需要把类定义原样贴出来，只要让学生明白字段背后的语义

---

## 第 8 页：Buffer Pool 的整体结构

**内容：**
- Buffer Pool 里有什么？
  - Frame 数组
  - 页号到 Frame 的定位关系
  - LRU 淘汰结构

**图片：** Buffer Pool 结构图
文件：`expr/img/day2_pm_p08_buffer_pool_structure.png`

**画法说明**：使用 PPT 分层图。
- 上半：Frame 数组
- 下半：LRU 链表
- 右侧或底部：磁盘页
- 用箭头表示“命中查找”“未命中加载”“淘汰回写”

**提示词（AI仅备用）：**
```text
Task:
Create a finished academic-style structure diagram of a database buffer pool with frames, an LRU structure, and disk pages.

Layout:
Upper area for an array of frames, lower area for an LRU chain, and a bottom or side area for disk pages. Use arrows to imply lookup and page movement.

Semantic Elements:
- Several frame boxes in an array
- One LRU list or chain structure
- A row of disk page blocks
- Thin directional arrows

Text Labels:
- Buffer Pool
- 页帧 Frame
- LRU 链表
- 磁盘页面
- 命中查找
- 未命中加载
- 淘汰回写

Style Constraints:
- clean academic paper illustration
- white background
- thin dark gray lines
- light gray and very light desaturated blue fills
- minimal decoration
- use Chinese labels for process descriptions
- keep English only for Buffer Pool, Frame, LRU if needed
- finished presentation-ready diagram

Negative Constraints:
- no blank frame placeholders
- no saturated colors
- no heavy shadows
- no 3D effect
```

**讲授建议（约 8 分钟）**：
- 这一页只立整体结构，不讲完整读写细节
- 让学生知道：Buffer Pool 不只是“几块缓存”，还包含定位、淘汰和状态管理

---

## 第 9 页：读一个页面时会发生什么？

**内容：**
- 读页流程：
  1. 先查缓存
  2. 命中则 pin 并返回
  3. 未命中则分配 Frame、读盘、加入缓存

**图片：** 页面读取流程图

**画法说明**：使用 PPT 流程图，带命中 / 未命中分支。
- 顶部：请求 Page N
- 中间：缓存查找
- 左侧分支：命中
- 右侧分支：未命中 -> 读盘 -> pin -> 返回

**讲授建议（约 8 分钟）**：
- 这是下午第一个生命周期页，要结合前面几个概念慢讲
- 重点是“命中路径”和“未命中路径”必须在学生脑中形成分叉

---

## 第 10 页：改一个页面时会发生什么？

**内容：**
- 修改页面不一定立刻刷盘
- 标记 `dirty = true`
- 先 `unpin()`，后续再在合适时机刷盘

**图片：** 页面写入流程图

**画法说明**：使用 PPT 竖向流程图。
- 修改数据
- 标脏
- unpin
- 后续 flush

**讲授建议（约 6 分钟）**：
- 要把“延迟写”讲清楚，这是数据库性能优化的核心直觉之一
- 同时提醒：延迟写带来了持久性和恢复方面的要求

---

## 第 11 页：Buffer Pool 满了怎么办？

**内容：**
- 需要淘汰页面
- 只能淘汰 `pin_count == 0` 的页
- 如果是脏页，要先刷盘

**图片：** 页面淘汰流程图

**画法说明**：使用 PPT 决策流程图。
- 起点：需要新 Frame
- 中间：从 LRU 尾部找可淘汰页
- 分支：
  - 找到并且 dirty
  - 找到且不 dirty
  - 没找到

**讲授建议（约 8 分钟）**：
- 这一页要把 `pin_count` 的价值讲出来，不然前面会显得抽象
- 强调“不能淘汰正在被用的页”，让学生理解 pin/unpin 的工程意义

---

## 第 12 页：为什么是 LRU？

**内容：**
- LRU：淘汰最久未使用的页
- 基于局部性原理
- 但顺序扫描会污染缓存

**图片：** LRU 访问与淘汰示意图

**画法说明**：使用 PPT 链表或队列示意图。
- 显示几次访问后队列如何移动
- 最后标出“淘汰队尾”

**讲授建议（约 6 分钟）**：
- 这页只讲“为什么一般可用”和“为什么并不完美”
- 不展开 LRU-K 细节，只作为延伸思考埋钩子

---

## 第 13 页：MiniOB 中的 Buffer Pool 代码地图

**内容：**
- 核心对象：
  - `BufferPoolManager`
  - `DiskBufferPool`
  - `Frame`
  - `FrameLruCache`

**图片：** Buffer Pool 类职责图

**画法说明**：使用 PPT 原生职责图。
- 顶层：`BufferPoolManager`
- 中层：`DiskBufferPool`
- 底层：`Frame` 与 `FrameLruCache`
- 每个类只保留 1 句职责

**讲授建议（约 8 分钟）**：
- 这页只做代码导航，不要贴完整类定义
- 学生后面调试时，只要知道全局管理、单文件缓冲、页帧状态、LRU 管理这四层即可

---

## 第 14 页：关键函数与调用链

**内容：**
- 重点函数：
  - `get_this_page()`
  - `allocate_page()`
  - `flush_page()`
  - `pin() / unpin()`

**图片：** Buffer Pool 调用链流程图

**画法说明**：使用 PPT 竖向流程图。
- 读取路径：`get_this_page()`
- 分配路径：`allocate_page()`
- 刷盘路径：`flush_page()`
- 旁边单独标出：`pin/unpin` 是状态管理，不是磁盘 I/O

**讲授建议（约 10 分钟）**：
- 这页适合配合代码跳转和断点讲
- 要让学生知道：真实调试时先看入口函数，再看状态字段变化

---

## 第 15 页：Double Write Buffer 为什么存在？

**内容：**
- 页面写入可能被中断，导致“半页写坏”
- Double Write Buffer 的核心思想：
  1. 先写副本
  2. 再写正式页
  3. 恢复时可用副本修复

**图片：** Double Write Buffer 前后顺序图

**画法说明**：使用 PPT 三步顺序图。
- Step 1：写副本
- Step 2：写原页
- Step 3：恢复时检查

**讲授建议（约 8 分钟）**：
- 这页只讲“为什么有它”和“它解决什么问题”
- 不要在这节课里展开校验和和恢复细节

---

## 第 16 页：现场调试看什么？

**内容：**
- 三个观察场景：
  1. 缓存命中
  2. 脏页刷盘
  3. 页面淘汰
- 对应断点：
  - `get_this_page()`
  - `flush_page()`
  - `pin() / unpin()`

**图片：** 调试导航图

**画法说明**：使用 PPT 三行列表或树状导航图。
- 场景
- 断点
- 观察点

**讲授建议（约 8 分钟）**：
- 这页之后最好直接切到现场演示
- 别停留太久，关键是让学生知道“看哪些变量变化”

---

## 第 17 页：实践任务与总结

**内容：**
- 实践任务：
  - 跟一次 `get_this_page()` 的命中与未命中
  - 跟一次脏页变 `dirty`
  - 跟一次 `pin/unpin` 与淘汰判断
- 今日要点：
  - Buffer Pool 管理页面缓存
  - `dirty` / `pin_count` 决定页的生命周期
  - LRU 决定淘汰候选，但不负责正确性

**图片：** 任务清单图

**画法说明**：使用 PPT 列表，两栏排版。

**讲授建议（约 5 分钟）**：
- 这一页之后切到学生实践
- 不要让学生“看完就结束”，最好让他们至少跟一次真实命中和一次未命中

---

## 第 18 页：Q&A / 机动答疑

**内容：**
- 问题时间
- 机动答疑
- 预告：下一步继续向事务、恢复和更复杂执行机制推进

**图片：** 无需图片

**讲授建议**：
- 如果现场调试花时较多，这页可以完全作为缓冲区
- 如果节奏正常，可用它收束本节和引出后续主题

---

## 图片使用汇总

| PPT 页 | 图片名称 | 建议来源制作方式 | 备注 |
|--------|----------|------|------|
| 2 | 回顾与问题引入图 | **PPT 原生** | 上下结构足够 |
| 3 | Page Cache 三层图 | **PPT 原生** | 规则结构图，不需要 AI |
| 4 | Page Cache vs Buffer Pool 对照图 | **PPT 原生** | 关键概念边界页，术语必须可控 |
| 5 | WAL 顺序示意图 | **PPT 原生** | 流程顺序必须准确 |
| 6 | Page / Frame / PageNum 图 | **PPT 原生** | 关系图规则明确 |
| 7 | Frame 字段作用图 | **PPT 原生** | 三列卡片即可 |
| 8 | Buffer Pool 结构图 | **PPT 重绘优先，AI 备用** | 若想更规整，可让 AI 直接出带简短标签的成品图 |
| 9 | 读页流程图 | **PPT 原生** | 分支流程图必须准确 |
| 10 | 写页流程图 | **PPT 原生** | 规则流程图 |
| 11 | 淘汰流程图 | **PPT 原生** | 需要精确表达 dirty/pin 判断 |
| 12 | LRU 示意图 | **PPT 原生** | 队列移动图很适合手画 |
| 13 | Buffer Pool 类职责图 | **PPT 原生** | 类职责页不建议 AI |
| 14 | 关键函数调用链 | **PPT 原生** | 函数名与路径必须准确 |
| 15 | Double Write Buffer 顺序图 | **PPT 原生** | 三步顺序图即可 |
| 16 | 调试导航图 | **PPT 原生** | 场景与断点需可修改 |
| 17 | 任务总结图 | **PPT 原生** | 清单页无需 AI |

---

## 提示词使用说明

1. **制图策略分离**：含函数名、类名、变量名、刷盘顺序、调试断点的页面，优先使用 PPT 原生绘制。
2. **AI优先直接出成品图**：只有 Buffer Pool 总体结构这类概念页才考虑交给 AI，并优先让它生成带简短标签的成品图，而不是空底图。
3. **统一风格准则**：
   - 所有 AI 图片必须遵循《CLAUDE.md》的学术论文风格：低饱和、克制、清晰。
   - 主体保持白底、深灰线条、浅灰填充，允许少量浅灰蓝作为强调色。
   - 禁止使用饱和色块、重阴影、3D 效果、营销海报风格。
   - 过程说明、模块说明、读写路径说明优先使用中文；只有类名、函数名、缩写保留英文。
4. **课堂控制原则**：不要在 PPT 里讲完整事务恢复理论，WAL 和 Double Write Buffer 只讲到支撑 Buffer Pool 理解所需的深度。
5. **实践优先原则**：这节课要让学生至少跟一次真实缓存命中与一次真实刷盘，否则 Buffer Pool 容易停留在静态概念层面。
