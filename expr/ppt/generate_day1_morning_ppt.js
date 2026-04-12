/**
 * 环境配置与 Drop Table 实现 PPT 生成器
 */

const path = require("path");
const {
  TJUT_RED_PALETTE,
  img,
  createPptx,
  baseSlide,
  footer,
  bullets,
  card,
  stepBox,
  addImageFrame,
  flowArrow,
  tableCell,
  addTeachingCoverSlide,
} = require("./ppt_common");

const C = TJUT_RED_PALETTE;
const KICKER = "环境配置与 Drop Table 实现";
const PAGE_LABEL = "天津理工大学";

const pptx = createPptx({
  subject: "MiniOB Environment And Drop Table",
  title: "环境配置与 Drop Table 实现",
});

// ============================================================
// Slide 1: 封面
// ============================================================
function coverSlide() {
  addTeachingCoverSlide(pptx, {
    palette: C,
    leadTitle: "环境配置与",
    mainTitle: "Drop Table 实现",
    summary: "上午目标先放在打通链路、找到入口、完成第一个可验证的功能。",
    chips: [
      { text: "看懂链路", x: 1.05, w: 1.38, fontSize: 11.5 },
      { text: "找到入口", x: 2.6, w: 1.38, fontSize: 11.5 },
      { text: "完成功能", x: 4.15, w: 1.5, fontSize: 11.5 },
    ],
    agenda: ["环境检查", "链路调试", "实现 Drop Table", "上机验证"],
    notes: "封面口播：\n- 上午只做三件事：看懂链路、找到入口、完成 Drop Table。\n- 不要求大家一上来吃透所有源码，先把一条 SQL 走通。\n- 听课标准放在知道接下来该从哪里点进去，不要求先记住一堆类名。",
  });
}

// ============================================================
// Slide 2: 两天任务总览
// ============================================================
function twoDayOverviewSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "数据库内核实战", "两天任务总览", C);
  slide.addText("这两天的目标是从看懂 MiniOB 链路出发，沿着模块逐步完成几个核心功能。", { x: 0.48, y: 1.42, w: 7.4, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const items = [
    ["模块一", "环境配置\nSQL 链路\nDrop Table", 0.72, 1.95, C.panel],
    ["模块二", "B+树结构\n多列索引实现", 5.15, 1.95, C.blue],
    ["模块三", "Record Manager\nText / Update", 0.72, 3.25, C.blue],
    ["模块四", "Buffer Pool\n缓冲池机制", 5.15, 3.25, C.panel],
  ];
  items.forEach(([title, body, x, y, fill]) => {
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.65, h: 0.95, rectRadius: 0.05, line: { color: C.line, width: 1.1 }, fill: { color: fill } });
    slide.addText(title, { x: x + 0.16, y: y + 0.14, w: 1.25, h: 0.18, fontSize: 15, bold: true, color: C.navy, margin: 0 });
    slide.addText(body, { x: x + 1.42, y: y + 0.12, w: 1.95, h: 0.58, fontSize: 11.5, color: C.ink, margin: 0, valign: "mid" });
  });
  slide.addText("今天上午先打通链路，下午再深入索引细节。", { x: 0.72, y: 4.63, w: 7.8, h: 0.16, fontSize: 11.5, color: C.steel, margin: 0 });
  footer(slide, PAGE_LABEL, 2, C);
}

// ============================================================
// Slide 3: 课程安排预览
// ============================================================
function agendaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "课程安排预览", KICKER, C);
  slide.addText("今天我们做四件事，前半段建立地图，后半段进入实现。", { x: 0.48, y: 1.42, w: 5.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const xs = [0.65, 2.62, 4.59, 6.56];
  const items = [["01", "环境检查", "确认开发环境可用"], ["02", "项目结构", "理解 MiniOB 架构"], ["03", "调试技巧", "掌握调试方法"], ["04", "实战任务", "实现 DROP TABLE"]];
  items.forEach((it, i) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: xs[i], y: 2.0, w: 1.65, h: 1.6, rectRadius: 0.05, line: { color: C.line, width: 1.1 }, fill: { color: i === 3 ? C.blue : "FFFFFF" } });
    slide.addText(it[0], { x: xs[i] + 0.14, y: 2.18, w: 0.45, h: 0.22, fontSize: 12, bold: true, color: C.accent, margin: 0 });
    slide.addText(it[1], { x: xs[i] + 0.14, y: 2.52, w: 1.3, h: 0.22, fontSize: 17, bold: true, color: C.ink, margin: 0 });
    slide.addText(it[2], { x: xs[i] + 0.14, y: 2.92, w: 1.25, h: 0.38, fontSize: 10.5, color: C.steel, margin: 0 });
  });
  flowArrow(slide, 2.34, 2.67, 0.18);
  flowArrow(slide, 4.31, 2.67, 0.18);
  flowArrow(slide, 6.28, 2.67, 0.18);
  footer(slide, PAGE_LABEL, 3, C);
}

// ============================================================
// Slide 4: 开发环境检查表
// ============================================================
function checklistSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "开发环境检查表", KICKER, C);
  slide.addText("这一页只看今天上机要用到的最小运行条件。", { x: 0.48, y: 1.42, w: 5.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const items = [["WSL / Linux 环境可正常进入", "能打开终端并执行基础命令"], ["VSCode 已能连接到 WSL 工程目录", "工程目录在远程窗口中可见"], ["MiniOB 已成功编译", "build 目录可生成 observer / obclient"], ["observer 与 obclient 可以正常启动", "能进入基本交互"]];
  items.forEach((it, idx) => {
    const y = 1.92 + idx * 0.72;
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y, w: 0.32, h: 0.32, rectRadius: 0.03, line: { color: C.accent, width: 1.2 }, fill: { color: "FFFFFF" } });
    slide.addText(it[0], { x: 1.12, y: y - 0.01, w: 2.7, h: 0.2, fontSize: 15, bold: true, color: C.ink, margin: 0 });
    slide.addText(it[1], { x: 5.6, y: y - 0.01, w: 3.1, h: 0.2, fontSize: 12, color: C.steel, margin: 0 });
    slide.addShape(pptx.ShapeType.line, { x: 1.1, y: y + 0.42, w: 7.75, h: 0, line: { color: idx === items.length - 1 ? "FFFFFF" : C.line, width: 0.8 } });
  });
  slide.addText("安装细节见讲义与现场演示", { x: 0.72, y: 4.8, w: 3.4, h: 0.16, fontSize: 10.5, color: C.steel, margin: 0 });
  footer(slide, PAGE_LABEL, 4, C);
}

// ============================================================
// Slide 5: 从最简单的存储开始
// ============================================================
function mapSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "从最简单的存储开始", KICKER, C);
  slide.addText("问题引入：最简单的数据存储是什么？", { x: 0.62, y: 1.48, w: 3.2, h: 0.2, fontSize: 16, bold: true, color: C.ink, margin: 0 });
  slide.addText("答案：map<string, string>", { x: 0.62, y: 1.82, w: 3.2, h: 0.2, fontSize: 15, color: C.navy, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.62, y: 2.16, w: 3.18, h: 1.42, rectRadius: 0.04, line: { color: C.line, width: 1 }, fill: { color: C.panel } });
  slide.addText("map<string, string> db;\ndb[\"name\"] = \"Alice\";\nstd::cout << db[\"name\"] << std::endl;", {
    x: 0.84, y: 2.42, w: 2.8, h: 0.84,
    fontFace: "Consolas", fontSize: 12.5, color: C.ink, breakLine: false, margin: 0,
  });
  slide.addText("这是一个最基础的 NoSQL 数据库！", { x: 0.62, y: 3.82, w: 3.35, h: 0.22, fontSize: 15.5, bold: true, color: C.accent, margin: 0 });
  slide.addText("用一张图先看写入、查询和返回结果。", { x: 4.18, y: 1.5, w: 3.9, h: 0.18, fontSize: 12, color: C.steel, margin: 0 });

  slide.addText("写入操作", { x: 4.18, y: 1.92, w: 0.92, h: 0.16, fontSize: 11.5, bold: true, color: C.ink, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 4.12, y: 2.14, w: 1.52, h: 0.44, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: C.soft } });
  slide.addText('set("name", "Alice")', { x: 4.23, y: 2.27, w: 1.3, h: 0.14, fontFace: "Consolas", fontSize: 9.3, color: C.ink, margin: 0, align: "center" });

  slide.addText("查询操作", { x: 4.18, y: 3.06, w: 0.92, h: 0.16, fontSize: 11.5, bold: true, color: C.ink, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 4.12, y: 3.28, w: 1.52, h: 0.44, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: C.soft } });
  slide.addText('get("name")', { x: 4.23, y: 3.41, w: 1.3, h: 0.14, fontFace: "Consolas", fontSize: 9.7, color: C.ink, margin: 0, align: "center" });

  slide.addShape(pptx.ShapeType.roundRect, { x: 5.95, y: 1.88, w: 2.25, h: 2.45, rectRadius: 0.04, line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" } });
  slide.addText("map<string, string>", { x: 6.14, y: 2.06, w: 1.9, h: 0.16, fontSize: 11.3, bold: true, color: C.navy, margin: 0, align: "center" });

  const tableX = 6.18, tableY = 2.42, cellW = 0.86, cellH = 0.35;
  const rows = [
    ["键", "值", C.soft, true],
    ["name", "Alice", "FFFFFF", false],
    ["age", "20", "FFFFFF", false],
    ["city", "Beijing", "FFFFFF", false],
    ["id", "1001", "FFFFFF", false],
  ];
  rows.forEach((row, idx) => {
    tableCell(slide, tableX, tableY + idx * cellH, cellW, cellH, row[0], { fill: row[2], bold: row[3], fontSize: 10.5 }, C);
    tableCell(slide, tableX + cellW, tableY + idx * cellH, cellW, cellH, row[1], { fill: row[2], bold: row[3], fontSize: 10.5 }, C);
  });

  slide.addText("返回结果", { x: 8.45, y: 2.6, w: 0.82, h: 0.16, fontSize: 11.5, bold: true, color: C.ink, margin: 0, align: "center" });
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.38, y: 2.86, w: 0.98, h: 0.46, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: C.soft } });
  slide.addText('"Alice"', { x: 8.48, y: 3.01, w: 0.78, h: 0.14, fontFace: "Consolas", fontSize: 10.5, color: C.ink, margin: 0, align: "center" });

  slide.addShape(pptx.ShapeType.line, { x: 5.64, y: 2.36, w: 0.28, h: 0, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });
  slide.addShape(pptx.ShapeType.line, { x: 5.64, y: 3.5, w: 0.28, h: 0, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });
  slide.addShape(pptx.ShapeType.line, { x: 8.2, y: 3.09, w: 0.14, h: 0, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });

  slide.addNotes("发散角度：\n- 问学生：你们做项目时想过数据会丢吗？\n- 写文件时如果程序崩溃，文件是完整的还是半截？\n- JSON/YAML 配置文件能存，但程序运行时的变量为什么不能直接存？\n- 如果让学生自己设计一个能存数据的系统，他们会怎么设计？\n- 这些问题主要是让学生意识到：自己早就遇到过这些问题，只是当时可能没系统想过。");

  footer(slide, PAGE_LABEL, 5, C);
}

// ============================================================
// Slide 6: 三个核心问题
// ============================================================
function problemsSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "三个核心问题", KICKER, C);
  slide.addText("但是……这个简单 map 有什么问题？", { x: 0.48, y: 1.42, w: 4.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const rows = [["① 数据持久化", "程序关闭，数据消失", "序列化 + 转储到磁盘"], ["② 条件查询", "只能按 key 查，value 查询要遍历", "建立索引"], ["③ 磁盘交互", "如何高效读写磁盘页", "缓冲池 Buffer Pool"]];
  rows.forEach((r, i) => {
    const y = 1.95 + i * 0.95;
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y, w: 8.4, h: 0.66, rectRadius: 0.04, line: { color: C.line, width: 1 }, fill: { color: i === 2 ? C.blue : "FFFFFF" } });
    slide.addText(r[0], { x: 0.92, y: y + 0.15, w: 1.35, h: 0.18, fontSize: 13, bold: true, color: C.navy, margin: 0 });
    slide.addText(r[1], { x: 2.12, y: y + 0.15, w: 3.1, h: 0.18, fontSize: 12, color: C.ink, margin: 0 });
    slide.addText("→", { x: 5.45, y: y + 0.12, w: 0.28, h: 0.18, fontSize: 16, color: C.accent, align: "center", margin: 0 });
    slide.addText(r[2], { x: 5.88, y: y + 0.15, w: 2.25, h: 0.18, fontSize: 12.5, bold: true, color: C.ink, margin: 0 });
  });
  slide.addNotes("发散角度 - 和 ACID 结合：\n- 持久化对应 ACID 的 D（Durability）：数据写入后不能丢\n- 索引/查询效率和 C（Consistency）有关：索引结构必须和实际数据保持一致\n- 磁盘交互和 A（Atomicity）有关：写磁盘中途崩溃会不会出现半截数据？\n- 问学生：听说过 ACID 吗？想想四个字母分别对应什么问题\n- 如果还没接触过 ACID，先种印象：后面两天会反复提到这四个字母，今天先知道它们是从真实问题提炼出来的。");
  footer(slide, PAGE_LABEL, 6, C);
}

// ============================================================
// Slide 7: 存储层次结构
// ============================================================
function storageSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "存储层次结构（OS 知识穿插）", KICKER, C);
  slide.addText("为什么需要持久化？先看存储层次：速度和持久性始终在做 trade-off。", { x: 0.48, y: 1.42, w: 6.0, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const layers = [[2.05, 1.95, 2.5, 0.55, "CPU 高速缓存", "ns 级 · MB 级 · 易失性"], [1.55, 2.7, 3.5, 0.65, "内存 RAM", "较快 · GB 级 · 易失性"], [0.95, 3.6, 4.7, 0.78, "磁盘", "较慢 · TB 级 · 非易失性"]];
  layers.forEach((l, idx) => {
    slide.addShape(pptx.ShapeType.chevron, { x: l[0], y: l[1], w: l[2], h: l[3], line: { color: C.line, width: 1 }, fill: { color: idx === 1 ? C.blue : idx === 2 ? C.soft : "FFFFFF" } });
    slide.addText(l[4], { x: l[0] + 0.2, y: l[1] + 0.13, w: l[2] - 0.4, h: 0.18, fontSize: 17, bold: true, color: C.ink, align: "center", margin: 0 });
    slide.addText(l[5], { x: l[0] + 0.2, y: l[1] + 0.34, w: l[2] - 0.4, h: 0.18, fontSize: 10.5, color: C.steel, align: "center", margin: 0 });
  });
  slide.addText("速度", { x: 6.18, y: 2.05, w: 0.55, h: 0.18, fontSize: 14.5, bold: true, color: C.accent, margin: 0, align: "center" });
  slide.addText("快", { x: 6.26, y: 2.38, w: 0.22, h: 0.14, fontSize: 12, bold: true, color: C.accent, margin: 0, align: "center" });
  slide.addShape(pptx.ShapeType.line, { x: 6.38, y: 2.58, w: 0, h: 1.24, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });
  slide.addText("慢", { x: 6.26, y: 4.0, w: 0.22, h: 0.14, fontSize: 12, bold: true, color: C.accent, margin: 0, align: "center" });
  footer(slide, PAGE_LABEL, 7, C);
}

// ============================================================
// Slide 8: MiniOB 项目全景图
// ============================================================
function panoramaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "MiniOB 项目全景图", KICKER, C);
  slide.addText("MiniOB 是如何解决这三个问题的？先看整体架构。", { x: 0.48, y: 1.42, w: 4.8, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const top = [["Client", 0.68], ["Network", 2.05], ["SQL Parser", 3.42], ["语句处理", 4.79], ["Optimizer", 6.16], ["Executor", 7.53]];
  top.forEach((t, i) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: t[1], y: 1.92, w: 1.1, h: 0.52, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: i >= 2 && i <= 4 ? C.soft : "FFFFFF" } });
    slide.addText(t[0], { x: t[1], y: 2.08, w: 1.1, h: 0.14, fontSize: 12, bold: true, color: C.ink, align: "center", margin: 0 });
    if (i < top.length - 1) flowArrow(slide, t[1] + 1.14, 2.06, 0.18);
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 3.0, w: 8.0, h: 1.45, rectRadius: 0.05, line: { color: C.line, width: 1.2 }, fill: { color: C.panel } });
  slide.addText("存储引擎", { x: 1.2, y: 3.18, w: 1.1, h: 0.18, fontSize: 18, bold: true, color: C.navy, margin: 0 });
  const subs = ["表管理", "索引 B+树", "缓冲池", "磁盘文件"];
  subs.forEach((s, idx) => {
    slide.addShape(pptx.ShapeType.rect, { x: 2.2 + idx * 1.55, y: 3.55, w: 1.25, h: 0.48, line: { color: C.line, width: 1 }, fill: { color: idx === 2 ? C.blue : "FFFFFF" } });
    slide.addText(s, { x: 2.2 + idx * 1.55, y: 3.7, w: 1.25, h: 0.14, fontSize: 11.5, color: C.ink, align: "center", margin: 0 });
  });
  slide.addShape(pptx.ShapeType.line, { x: 8.06, y: 2.48, w: 0, h: 0.48, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });
  slide.addShape(pptx.ShapeType.line, { x: 8.22, y: 2.98, w: 0, h: -0.46, line: { color: C.accent, width: 1.2, endArrowType: "triangle" } });
  footer(slide, PAGE_LABEL, 8, C);
}

// ============================================================
// Slide 9: SQL 处理流程
// ============================================================
function sqlFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "SQL 处理流程", KICKER, C);
  slide.addText("一条 SQL 的一生：", { x: 0.48, y: 1.42, w: 1.6, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  bullets(slide, ["ParseStage：词法 + 语法解析 → ParsedSqlNode", "ResolveStage：语义分析 → Statement", "Optimizer：生成执行计划（DML）", "ExecuteStage：执行器 → 调用存储层"], 0.68, 1.8, 4.35, 1.65, { fontSize: 13.5 });
  addImageFrame(slide, img("day1_am_p08_sql_pipeline.png"), 5.18, 1.82, 4.0, 2.55);
  slide.addNotes("DDL 和 DML 会在这里分流，DROP TABLE 不一定走完整优化器路径。");
  footer(slide, PAGE_LABEL, 9, C);
}

// ============================================================
// Slide 10: SEDA 框架详解
// ============================================================
function sedaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "SEDA 框架详解", KICKER, C);
  addImageFrame(slide, img("day1_am_p09_seda_architecture.png"), 0.62, 1.64, 5.55, 3.35);
  bullets(slide, ["MiniOB 使用 SEDA（Staged Event-Driven Architecture）", "每个 Stage 有独立的事件队列和线程池", "好处：解耦、可扩展、线程复用"], 6.45, 1.95, 2.9, 1.55, { fontSize: 14 });
  footer(slide, PAGE_LABEL, 10, C);
}

// ============================================================
// Slide 11: 调试方法论
// ============================================================
function debugSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "调试方法论", KICKER, C);
  slide.addText("调试是理解代码最好的方式，下面是关键断点位置速查表。", { x: 0.48, y: 1.42, w: 5.6, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const nodes = [["调试入口", "先让请求真正跑起来", 4.0, 1.9, 1.8], ["网络层", "session_stage.cpp:35", 0.75, 3.0, 1.9], ["解析层", "parse_stage.cpp:49", 2.95, 3.0, 1.9], ["语句层", "stmt.cpp:48", 5.15, 3.0, 1.9], ["执行层", "command_executor.cpp:30", 7.35, 3.0, 1.9]];
  nodes.forEach((n, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: n[2], y: n[3], w: n[4], h: idx === 0 ? 0.7 : 0.82, rectRadius: 0.04, line: { color: C.line, width: 1.1 }, fill: { color: idx === 0 ? C.blue : "FFFFFF" } });
    slide.addText(n[0], { x: n[2] + 0.12, y: n[3] + 0.12, w: n[4] - 0.24, h: 0.17, fontSize: 13, bold: true, color: C.ink, align: "center", margin: 0 });
    slide.addText(n[1], { x: n[2] + 0.12, y: n[3] + 0.39, w: n[4] - 0.24, h: 0.16, fontSize: 10.5, color: C.steel, align: "center", margin: 0 });
  });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: -3.1, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: -0.95, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: 1.0, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: 3.15, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1, y: 4.45, w: 7.7, h: 0.42, rectRadius: 0.03,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("记忆抓手：入口先跑起来，再按“网络层 → 解析层 → 语句层 → 执行层”往下跟。", {
    x: 1.28, y: 4.59, w: 7.3, h: 0.14, fontSize: 10.8, color: C.steel, align: "center", margin: 0,
  });
  slide.addNotes("第11页口播：\n- 不要求学生背行号，先记住往下跟的顺序。\n- 讲完这页最好立刻切到 IDE 做一次真实断点演示。\n- 这页的任务是让学生知道“看不懂源码时该怎么下手”。");
  footer(slide, PAGE_LABEL, 11, C);
}

// ============================================================
// Slide 12: 火山模型
// ============================================================
function volcanoSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "火山模型（Volcano Model）", KICKER, C);
  bullets(slide, ["查询执行使用火山模型（拉取驱动）", "每个算子调用 next() 向子算子要数据"], 0.7, 1.86, 3.85, 0.95, { fontSize: 14 });
  addImageFrame(slide, img("day1_am_p11_volcano_model.png"), 4.9, 1.62, 4.25, 3.35);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.82, y: 4.48, w: 8.28, h: 0.4, rectRadius: 0.03,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("一句话就够：结果会一层层往上拉，上一层要一点，下一层 next() 给一点。", {
    x: 1.02, y: 4.61, w: 7.88, h: 0.14, fontSize: 10.8, color: C.steel, align: "center", margin: 0,
  });
  slide.addNotes("第12页口播：\n- 火山模型不是上午主角，只讲“上一层要，下一层给”这个动作。\n- 不要展开讲算子优化。\n- 讲完后把学生注意力带回 DROP TABLE 主线。");
  footer(slide, PAGE_LABEL, 12, C);
}

// ============================================================
// Slide 13: CREATE/DROP 对比
// ============================================================
function createDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实战任务 - Drop Table 实现", KICKER, C);
  slide.addText("做功能不要从零猜，先找系统里最像的旧功能，再沿着它的反方向推。", {
    x: 0.48, y: 1.42, w: 6.1, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 1.82, w: 3.58, h: 2.38, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.panel },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.02, y: 1.82, w: 3.58, h: 2.38, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.blue },
  });
  slide.addText("CREATE TABLE", { x: 0.92, y: 2.05, w: 1.8, h: 0.18, fontSize: 17, bold: true, color: C.navy, margin: 0 });
  slide.addText("DROP TABLE", { x: 5.22, y: 2.05, w: 1.8, h: 0.18, fontSize: 17, bold: true, color: C.navy, margin: 0 });

  const createItems = [
    ["01", "注册表对象", "把表加入映射表，让系统先能找到它"],
    ["02", "创建内存对象", "new Table()，把运行时对象真正建起来"],
    ["03", "创建磁盘文件", "生成 .table / .data / .lob 等外部资源"],
  ];
  const dropItems = [
    ["01", "移出表映射", "先从映射表移除，断开系统内部引用"],
    ["02", "释放内存对象", "delete Table，清掉运行时对象"],
    ["03", "删除磁盘文件", "清理 .table / .data / .lob 等外部资源"],
  ];
  createItems.forEach((item, idx) => {
    const y = 2.45 + idx * 0.5;
    slide.addText(item[0], { x: 0.98, y, w: 0.3, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(item[1], { x: 1.38, y: y - 0.01, w: 1.68, h: 0.16, fontSize: 12.2, bold: true, color: C.ink, margin: 0 });
    slide.addText(item[2], { x: 1.38, y: y + 0.18, w: 2.52, h: 0.18, fontSize: 9.8, color: C.steel, margin: 0 });
  });
  dropItems.forEach((item, idx) => {
    const y = 2.45 + idx * 0.5;
    slide.addText(item[0], { x: 5.28, y, w: 0.3, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(item[1], { x: 5.68, y: y - 0.01, w: 1.74, h: 0.16, fontSize: 12.2, bold: true, color: C.ink, margin: 0 });
    slide.addText(item[2], { x: 5.68, y: y + 0.18, w: 2.48, h: 0.18, fontSize: 9.8, color: C.steel, margin: 0 });
  });
  slide.addText("⇄", { x: 4.3, y: 2.47, w: 0.45, h: 0.22, fontSize: 28, bold: true, color: C.accent, align: "center", margin: 0 });
  slide.addText("逆向思考", { x: 4.1, y: 2.92, w: 0.86, h: 0.16, fontSize: 11.5, bold: true, color: C.navy, align: "center", margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.92, y: 4.42, w: 7.68, h: 0.45, rectRadius: 0.04,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("开发抓手：先看 CREATE 做了哪些状态变化，再按相反顺序清理。", {
    x: 1.12, y: 4.57, w: 7.3, h: 0.14, fontSize: 11.2, color: C.steel, margin: 0,
  });
  slide.addNotes("第13页口播：\n- 这页只讲方法，不急着讲代码。\n- 先让学生接受一个工程习惯：新增功能先找最像的旧功能。\n- CREATE 在做资源建立，DROP 在做资源释放，本质是一组对称状态变化。");
  footer(slide, PAGE_LABEL, 13, C);
}

// ============================================================
// Slide 14: Drop Table 调用链
// ============================================================
function dropFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Drop Table 完整调用链", KICKER, C);
  slide.addText("真正写代码前，先把“从哪里进、在哪形成语句对象、最后改哪一层”三件事看清楚。", {
    x: 0.48, y: 1.42, w: 6.5, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const steps = [
    ["1", "SQL: DROP TABLE", "请求从客户端进入系统"],
    ["2", "ParseStage", "先把 SQL 解析成结构化结果"],
    ["3", "ResolveStage", "做语义分析，确认对象类型"],
    ["4", "DropTableStmt", "形成语句对象，后面按它分发"],
    ["5", "CommandExecutor", "根据语句类型派发执行器"],
    ["6", "DropTableExecutor", "真正准备调到存储层"],
    ["7", "Db::drop_table", "最终落到表管理与文件清理"],
  ];
  steps.forEach((step, idx) => {
    const y = 1.82 + idx * 0.45;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.82, y: y + 0.03, w: 0.28, h: 0.28,
      line: { color: C.accent, width: 1.1 },
      fill: { color: idx === steps.length - 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(step[0], { x: 0.82, y: y + 0.11, w: 0.28, h: 0.1, fontSize: 9.5, bold: true, color: C.navy, align: "center", margin: 0 });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.22, y, w: 4.95, h: 0.34, rectRadius: 0.03,
      line: { color: C.line, width: 1 },
      fill: { color: idx === steps.length - 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(step[1], { x: 1.42, y: y + 0.09, w: 1.9, h: 0.12, fontSize: 11.8, bold: true, color: C.ink, margin: 0 });
    slide.addText(step[2], { x: 3.15, y: y + 0.09, w: 2.75, h: 0.12, fontSize: 10.5, color: C.steel, margin: 0 });
    if (idx < steps.length - 1) {
      slide.addShape(pptx.ShapeType.line, { x: 0.96, y: y + 0.34, w: 0, h: 0.11, line: { color: C.line, width: 1.2 } });
    }
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.52, y: 1.86, w: 2.6, h: 2.54, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.panel },
  });
  slide.addText("真正要改的地方", { x: 6.78, y: 2.08, w: 1.9, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
  slide.addText("入口", { x: 6.78, y: 2.47, w: 0.5, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
  slide.addText("SQL 从 Parse/Resolve 进来", { x: 7.35, y: 2.46, w: 1.35, h: 0.14, fontSize: 10.5, color: C.ink, margin: 0 });
  slide.addText("对象", { x: 6.78, y: 2.8, w: 0.5, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
  slide.addText("DropTableStmt 是链路分界点", { x: 7.35, y: 2.79, w: 1.52, h: 0.14, fontSize: 10.5, color: C.ink, margin: 0 });
  slide.addText("落点", { x: 6.78, y: 3.13, w: 0.5, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
  slide.addText("最后真正改表的是 Db::drop_table", { x: 7.35, y: 3.12, w: 1.48, h: 0.14, fontSize: 10.5, color: C.ink, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.78, y: 3.52, w: 2.08, h: 0.52, rectRadius: 0.04,
    line: { color: C.line, width: 1 }, fill: { color: C.blue },
  });
  slide.addText("记忆抓手：入口 → 语句对象 → 执行器 → Db", {
    x: 6.96, y: 3.7, w: 1.72, h: 0.14, fontSize: 10.8, bold: true, color: C.navy, align: "center", margin: 0,
  });
  slide.addNotes("第14页口播：\n- 学生不用背全链路，但一定要记住四个关键节点：入口、语句对象、执行器、Db。\n- 这页要跟代码演示联动，告诉他们等会儿点文件就按这个顺序找。\n- 让学生明白：真正需要改的文件不多，难点是别在工程里迷路。");
  footer(slide, PAGE_LABEL, 14, C);
}

// ============================================================
// Slide 15: Db::drop_table 关键代码
// ============================================================
function dbDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "关键代码解析 - Db::drop_table", KICKER, C);
  slide.addText("先检查 → 再移除 → 再释放 → 最后清理外部资源。顺序意识比背代码更重要。", {
    x: 0.48, y: 1.42, w: 6.4, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const data = [
    ["步骤 1", "检查表是否存在", "find(...)", "避免对不存在的对象做后续操作", C.panel],
    ["步骤 2", "从内存映射移除", "opened_tables_.erase", "先断开系统内部引用关系", "FFFFFF"],
    ["步骤 3", "删除 Table 对象", "delete table", "释放内存中的表对象", C.panel],
    ["步骤 4", "删除磁盘文件", "filesystem::remove", "最后再清理外部资源", C.blue],
  ];
  data.forEach((d, idx) => {
    const y = 1.96 + idx * 0.66;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.78, y, w: 8.2, h: 0.48, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: d[4] },
    });
    slide.addText(d[0], { x: 0.98, y: y + 0.15, w: 0.62, h: 0.12, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(d[1], { x: 1.75, y: y + 0.13, w: 1.72, h: 0.14, fontSize: 12.8, bold: true, color: C.ink, margin: 0 });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 4.42, y: y + 0.08, w: 2.08, h: 0.3, rectRadius: 0.03,
      line: { color: C.line, width: 0.9 }, fill: { color: "FFFFFF" },
    });
    slide.addText(d[2], {
      x: 4.56, y: y + 0.18, w: 1.8, h: 0.1,
      fontFace: "Consolas", fontSize: 9.8, color: C.navy, align: "center", margin: 0,
    });
    slide.addText(d[3], { x: 6.72, y: y + 0.13, w: 1.95, h: 0.16, fontSize: 10.2, color: C.steel, margin: 0 });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9, y: 4.74, w: 7.95, h: 0.42, rectRadius: 0.03,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("如果顺序写反，常见问题就是：对象还在被引用，资源已经被删；或者磁盘还没清理，系统状态已经不一致。", {
    x: 1.12, y: 4.88, w: 7.55, h: 0.14, fontSize: 10.8, color: C.steel, margin: 0,
  });
  slide.addNotes("第15页口播：\n- 这一页不要逐行念伪代码，要讲每一步在改变什么状态。\n- 重点抓住顺序意识：检查、移除、释放、清理。\n- 很多 bug 都出在状态切换顺序写错了。");
  footer(slide, PAGE_LABEL, 15, C);
}

// ============================================================
// Slide 16: 实践任务与总结
// ============================================================
function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与总结", KICKER, C);
  slide.addText("实践阶段最怕的是不知道第一步做什么，所以这里把顺序和验收标准都写死。", {
    x: 0.48, y: 1.42, w: 6.3, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 1.82, w: 4.2, h: 2.72, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.panel },
  });
  slide.addText("上机顺序", { x: 0.95, y: 2.04, w: 1.2, h: 0.18, fontSize: 17, bold: true, color: C.navy, margin: 0 });
  const tasks = [
    ["01", "确认代码版本", "先看 feature/drop-table 或老师指定基线"],
    ["02", "顺着调用链定位文件", "先找到 DropTableStmt 和执行器"],
    ["03", "补 drop_table 逻辑", "按“检查→移除→释放→清理”实现"],
    ["04", "跑通并打断点验证", "看它是不是真的走到了你改的地方"],
  ];
  tasks.forEach((task, idx) => {
    const y = 2.38 + idx * 0.5;
    slide.addText(task[0], { x: 0.98, y, w: 0.34, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(task[1], { x: 1.42, y: y - 0.01, w: 1.62, h: 0.2, fontSize: 12.2, bold: true, color: C.ink, margin: 0 });
    slide.addText(task[2], { x: 3.08, y, w: 1.42, h: 0.2, fontSize: 9.8, color: C.steel, margin: 0 });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 1.82, w: 3.7, h: 1.18, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.blue },
  });
  slide.addText("验收标准", { x: 5.38, y: 2.05, w: 1.2, h: 0.18, fontSize: 16.5, bold: true, color: C.navy, margin: 0 });
  slide.addText("✓ 能下断点看到链路\n✓ 成功删除表对象和磁盘文件\n✓ 出错时知道先看入口、分发和 Db", {
    x: 5.38, y: 2.38, w: 2.95, h: 0.4, fontSize: 11.5, color: C.ink, breakLine: true, margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 3.18, w: 3.7, h: 1.36, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("本节要点", { x: 5.38, y: 3.4, w: 1.85, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
  slide.addText("1. SQL 会先经过一层层处理，然后才碰磁盘。\n2. 看不懂源码时，先断点，再顺链路往下跟。\n3. 新功能先找对照物，再做对称修改。", {
    x: 5.38, y: 3.72, w: 3.0, h: 0.58, fontSize: 11.2, color: C.ink, margin: 0,
  });
  slide.addNotes("第16页口播：\n- 进入上机前，把顺序说死，降低学生的空转。\n- 验收标准不要写成口号，要写成他们能自己检查的动作。\n- 右下角三句话就是今天上午的最低掌握标准。");
  footer(slide, PAGE_LABEL, 16, C);
}

// ============================================================
// Slide 17: Q&A / 结束
// ============================================================
function qaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Q&A / 结束", KICKER, C);
  slide.addText("接下来进入实操与答疑。", { x: 0.78, y: 1.46, w: 3.4, h: 0.2, fontSize: 14, color: C.steel, margin: 0 });
  const blocks = [
    [0.82, "现在先做", "跟着任务页先定位链路，再补实现", C.panel],
    [3.48, "遇到问题先问", "断点下到哪一层？当前状态有没有变化？", "FFFFFF"],
    [6.14, "还做不出来再问", "把报错、断点位置、你已经试过的路径说清楚", C.blue],
  ];
  blocks.forEach((block, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: block[0], y: 2.0, w: 2.28, h: 1.9, rectRadius: 0.05,
      line: { color: C.line, width: 1.1 }, fill: { color: block[3] },
    });
    slide.addText(block[1], { x: block[0] + 0.2, y: 2.24, w: 1.88, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
    slide.addText(block[2], { x: block[0] + 0.2, y: 2.62, w: 1.84, h: 0.62, fontSize: 11.2, color: C.ink, margin: 0 });
    if (idx < blocks.length - 1) {
      slide.addText("→", { x: block[0] + 2.34, y: 2.8, w: 0.22, h: 0.16, fontSize: 18, color: C.accent, align: "center", margin: 0 });
    }
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.12, y: 4.3, w: 7.7, h: 0.42, rectRadius: 0.03,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("目标放在今天亲手把一条链路走到自己改过的代码上。", {
    x: 1.3, y: 4.44, w: 7.3, h: 0.14, fontSize: 11.2, color: C.steel, align: "center", margin: 0,
  });
  slide.addNotes("结束页口播：\n- 这页不要只是说 Q&A，要把学生直接推入实践。\n- 让他们知道怎么提问：报错、断点、已尝试路径。\n- 最后再重复一次今天的目标：把链路走到自己改的代码上。");
  footer(slide, PAGE_LABEL, 17, C);
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  coverSlide();
  twoDayOverviewSlide();
  agendaSlide();
  checklistSlide();
  mapSlide();
  problemsSlide();
  storageSlide();
  panoramaSlide();
  sqlFlowSlide();
  sedaSlide();
  debugSlide();
  volcanoSlide();
  createDropSlide();
  dropFlowSlide();
  dbDropSlide();
  practiceSlide();
  qaSlide();

  await pptx.writeFile({ fileName: path.join(__dirname, "output", "day1_morning_generated.pptx") });
  console.log("生成完成: output/day1_morning_generated.pptx");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
