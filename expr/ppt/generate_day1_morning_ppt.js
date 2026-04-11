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
  addCoverSlide,
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
  addCoverSlide(pptx, {
    palette: C,
    headingTexts: [
      { text: "环境配置与 Drop Table 实现", x: 0.72, y: 1.92, w: 8.2, h: 0.42, fontSize: 22, bold: true, color: C.navy },
      { text: "你的名字/日期", x: 0.72, y: 4.38, w: 8.2, h: 0.3, fontSize: 13, color: C.steel },
    ],
    images: [],
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
  slide.addText("本节默认环境安装已基本完成，这里只做最小运行条件检查。", { x: 0.48, y: 1.42, w: 5.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
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
  slide.addText("速度 ↓", { x: 6.1, y: 2.22, w: 0.6, h: 1.6, fontSize: 16, bold: true, color: C.accent, rotate: 90, margin: 0 });
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
  footer(slide, PAGE_LABEL, 12, C);
}

// ============================================================
// Slide 13: CREATE/DROP 对比
// ============================================================
function createDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实战任务 - Drop Table 实现", KICKER, C);
  stepBox(slide, 0.75, 1.85, 3.55, 2.15, "CREATE TABLE", "1. opened_tables_ 加入\n2. new Table()\n3. 创建文件 .table / .data / .lob", C.panel);
  stepBox(slide, 5.05, 1.85, 3.55, 2.15, "DROP TABLE", "1. opened_tables_ 移除\n2. delete Table\n3. 删除文件 .table / .data / .lob", C.blue);
  slide.addText("⇄", { x: 4.32, y: 2.55, w: 0.45, h: 0.22, fontSize: 28, bold: true, color: C.accent, align: "center", margin: 0 });
  slide.addText("相反操作", { x: 4.18, y: 2.98, w: 0.75, h: 0.16, fontSize: 11, color: C.steel, align: "center", margin: 0 });
  footer(slide, PAGE_LABEL, 13, C);
}

// ============================================================
// Slide 14: Drop Table 调用链
// ============================================================
function dropFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Drop Table 完整调用链", KICKER, C);
  const steps = ["1. SQL: DROP TABLE", "2. ParseStage：解析", "3. ResolveStage：语义分析", "4. DropTableStmt：创建语句对象", "5. CommandExecutor：分发", "6. DropTableExecutor：执行", "7. Db::drop_table：落到存储层"];
  steps.forEach((s, idx) => {
    const y = 1.74 + idx * 0.47;
    slide.addShape(pptx.ShapeType.roundRect, { x: 1.25, y, w: 6.2, h: 0.32, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: idx === steps.length - 1 ? C.blue : "FFFFFF" } });
    slide.addText(s, { x: 1.42, y: y + 0.08, w: 5.8, h: 0.14, fontSize: 11.5, color: C.ink, margin: 0 });
    if (idx < steps.length - 1) slide.addText("↓", { x: 4.2, y: y + 0.31, w: 0.2, h: 0.18, fontSize: 14, color: C.accent, align: "center", margin: 0 });
  });
  card(slide, 7.75, 1.92, 1.35, 2.25, "最后一步展开", "检查表是否存在\n从 map 中移除\ndelete 对象\n删除磁盘文件", C.panel);
  footer(slide, PAGE_LABEL, 14, C);
}

// ============================================================
// Slide 15: Db::drop_table 关键代码
// ============================================================
function dbDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "关键代码解析 - Db::drop_table", KICKER, C);
  slide.addText("核心逻辑（伪代码展示）", { x: 0.48, y: 1.42, w: 2.3, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  const data = [["步骤 1", "检查表是否存在", "opened_tables_.find()", C.panel], ["步骤 2", "从内存映射移除", "opened_tables_.erase()", "FFFFFF"], ["步骤 3", "删除 Table 对象", "delete table", C.panel], ["步骤 4", "删除磁盘文件", "filesystem::remove()", C.blue]];
  data.forEach((d, idx) => {
    const y = 1.95 + idx * 0.74;
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.78, y, w: 8.35, h: 0.52, rectRadius: 0.03, line: { color: C.line, width: 1 }, fill: { color: d[3] } });
    slide.addText(d[0], { x: 0.98, y: y + 0.14, w: 0.62, h: 0.14, fontSize: 11, bold: true, color: C.accent, margin: 0 });
    slide.addText(d[1], { x: 1.72, y: y + 0.13, w: 1.7, h: 0.16, fontSize: 13, bold: true, color: C.ink, margin: 0 });
    slide.addText(d[2], { x: 5.9, y: y + 0.13, w: 2.7, h: 0.16, fontFace: "Consolas", fontSize: 11, color: C.navy, align: "right", margin: 0 });
  });
  footer(slide, PAGE_LABEL, 15, C);
}

// ============================================================
// Slide 16: 实践任务与总结
// ============================================================
function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与总结", KICKER, C);
  stepBox(slide, 0.75, 1.82, 4.0, 2.35, "实践任务", "□ 查看 feature/drop-table 分支\n□ 在新分支独立实现\n□ 添加断点调试观察", C.panel);
  stepBox(slide, 5.15, 1.82, 3.7, 2.35, "今日要点", "• SQL处理全流程\n• 调试方法\n• CREATE/DROP对称性", C.blue);
  footer(slide, PAGE_LABEL, 16, C);
}

// ============================================================
// Slide 17: Q&A / 结束
// ============================================================
function qaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Q&A / 结束", KICKER, C);
  slide.addText("问题时间", { x: 0.9, y: 2.1, w: 2.2, h: 0.32, fontSize: 24, bold: true, color: C.ink, margin: 0 });
  slide.addText("实践时间", { x: 0.9, y: 2.78, w: 2.4, h: 0.32, fontSize: 24, bold: true, color: C.navy, margin: 0 });
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
