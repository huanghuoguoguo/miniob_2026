const pptxgen = require("/tmp/pptxgenjs-install/node_modules/pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "OpenAI Codex";
pptx.company = "MiniOB Teaching";
pptx.subject = "MiniOB Day1 Morning";
pptx.title = "第一天上午：环境配置与 Drop Table 实现";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};

const C = {
  ink: "28323C",
  navy: "1F3A5F",
  steel: "5B6B7A",
  line: "D3DDE8",
  panel: "F7FAFC",
  soft: "EEF4F8",
  blue: "DCEAF4",
  blue2: "C9DCEB",
  accent: "6D8AA8",
  good: "3D6B4B",
  warm: "E8EEF4",
  codeBg: "F3F6F9",
};

const W = 10;
const H = 5.625;
const img = (name) => path.join(__dirname, "img", name);

function baseSlide(slide, title, kicker = "MiniOB 数据库内核实战") {
  slide.background = { color: "FFFFFF" };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: 0.55,
    line: { color: C.navy, transparency: 100 },
    fill: { color: C.navy },
  });
  slide.addText(kicker, {
    x: 0.45, y: 0.13, w: 3.2, h: 0.2,
    fontFace: "Microsoft YaHei",
    fontSize: 11,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });
  slide.addText(title, {
    x: 0.48, y: 0.76, w: 7.8, h: 0.44,
    fontFace: "Microsoft YaHei",
    fontSize: 25,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.48, y: 1.22, w: 9.02, h: 0.02,
    line: { color: C.line, transparency: 100 },
    fill: { color: C.line },
  });
}

function footer(slide, pageNo) {
  slide.addText(`Day 1 上午  |  ${pageNo}`, {
    x: 8.65, y: 5.28, w: 0.8, h: 0.14,
    fontFace: "Microsoft YaHei",
    fontSize: 8,
    color: C.steel,
    align: "right",
    margin: 0,
  });
}

function bullets(slide, items, x, y, w, h, opts = {}) {
  const runs = [];
  items.forEach((text, idx) => {
    runs.push({
      text,
      options: { bullet: true, breakLine: idx !== items.length - 1 },
    });
  });
  slide.addText(runs, {
    x, y, w, h,
    fontFace: "Microsoft YaHei",
    fontSize: opts.fontSize || 16,
    color: C.ink,
    breakLine: true,
    paraSpaceAfterPt: opts.spaceAfter || 8,
    valign: "top",
    margin: opts.margin === undefined ? 0.05 : opts.margin,
  });
}

function card(slide, x, y, w, h, title, body, fill = C.panel) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.06,
    line: { color: C.line, width: 1 },
    fill: { color: fill },
  });
  slide.addText(title, {
    x: x + 0.16, y: y + 0.11, w: w - 0.32, h: 0.18,
    fontFace: "Microsoft YaHei",
    fontSize: 14,
    bold: true,
    color: C.navy,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.16, y: y + 0.36, w: w - 0.32, h: h - 0.46,
    fontFace: "Microsoft YaHei",
    fontSize: 11,
    color: C.ink,
    margin: 0,
    valign: "top",
  });
}

function stepBox(slide, x, y, w, h, title, body, fill = "FFFFFF") {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    line: { color: C.line, width: 1.1 },
    fill: { color: fill },
  });
  slide.addText(title, {
    x: x + 0.14, y: y + 0.12, w: w - 0.28, h: 0.18,
    fontFace: "Microsoft YaHei",
    fontSize: 13,
    bold: true,
    color: C.navy,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.14, y: y + 0.38, w: w - 0.28, h: h - 0.48,
    fontFace: "Microsoft YaHei",
    fontSize: 10.5,
    color: C.ink,
    margin: 0,
    valign: "top",
  });
}

function addImageFrame(slide, imagePath, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.05,
    line: { color: C.line, width: 1 },
    fill: { color: "FFFFFF" },
  });
  slide.addImage({ path: imagePath, x: x + 0.06, y: y + 0.06, w: w - 0.12, h: h - 0.12 });
}

function flowArrow(slide, x, y, w) {
  slide.addText("→", {
    x, y, w, h: 0.2,
    fontFace: "Microsoft YaHei",
    fontSize: 18,
    color: C.accent,
    align: "center",
    margin: 0,
  });
}

function coverSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.625,
    line: { color: C.panel, transparency: 100 },
    fill: { color: C.panel },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 1.18,
    line: { color: C.navy, transparency: 100 },
    fill: { color: C.navy },
  });
  slide.addText("MiniOB 数据库内核实战", {
    x: 0.7, y: 1.32, w: 5.8, h: 0.48,
    fontFace: "Microsoft YaHei",
    fontSize: 28,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  slide.addText("Day 1 上午", {
    x: 0.72, y: 1.95, w: 2.1, h: 0.25,
    fontFace: "Microsoft YaHei",
    fontSize: 16,
    bold: true,
    color: C.navy,
    margin: 0,
  });
  slide.addText("环境配置与 Drop Table 实现", {
    x: 0.7, y: 2.32, w: 5.8, h: 0.36,
    fontFace: "Microsoft YaHei",
    fontSize: 24,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  slide.addText("目标：打通最小可运行链路，理解 SQL 到存储层的路径，并以 DROP TABLE 建立 DDL 对称实现直觉。", {
    x: 0.72, y: 2.9, w: 5.8, h: 0.56,
    fontFace: "Microsoft YaHei",
    fontSize: 14,
    color: C.steel,
    margin: 0,
  });
  addImageFrame(slide, img("day1_am_p08_sql_pipeline.png"), 6.35, 1.18, 3.0, 1.65);
  addImageFrame(slide, img("day1_am_p09_seda_architecture.png"), 6.35, 3.0, 3.0, 1.75);
  slide.addText("课程主线", {
    x: 0.72, y: 3.72, w: 1.2, h: 0.2, fontSize: 13, bold: true, color: C.navy, margin: 0,
  });
  bullets(slide, [
    "环境检查：确认编译、运行、连接链路可用",
    "整体链路：建立 Parse / Resolve / Execute 的地图",
    "实战任务：沿 CREATE 的反方向实现 DROP TABLE",
  ], 0.78, 3.98, 4.9, 0.98, { fontSize: 13 });
}

function agendaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "课程安排预览");
  slide.addText("今天我们做四件事，前半段建立地图，后半段进入实现。", {
    x: 0.48, y: 1.42, w: 5.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const xs = [0.65, 2.62, 4.59, 6.56];
  const items = [
    ["01", "环境检查", "确认最小可运行条件"],
    ["02", "项目结构", "建立 MiniOB 全景认知"],
    ["03", "调试技巧", "知道从哪里下断点"],
    ["04", "DROP TABLE", "沿调用链落到存储层"],
  ];
  items.forEach((it, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xs[i], y: 2.0, w: 1.65, h: 1.6, rectRadius: 0.05,
      line: { color: C.line, width: 1.1 },
      fill: { color: i === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(it[0], {
      x: xs[i] + 0.14, y: 2.18, w: 0.45, h: 0.22,
      fontSize: 12, bold: true, color: C.accent, margin: 0,
    });
    slide.addText(it[1], {
      x: xs[i] + 0.14, y: 2.52, w: 1.3, h: 0.22,
      fontSize: 17, bold: true, color: C.ink, margin: 0,
    });
    slide.addText(it[2], {
      x: xs[i] + 0.14, y: 2.92, w: 1.25, h: 0.38,
      fontSize: 10.5, color: C.steel, margin: 0,
    });
  });
  flowArrow(slide, 2.34, 2.67, 0.18);
  flowArrow(slide, 4.31, 2.67, 0.18);
  flowArrow(slide, 6.28, 2.67, 0.18);
  card(slide, 0.65, 4.12, 8.7, 0.72, "讲授取舍", "环境安装细节放在讲义和现场实操；PPT 重点放在整体链路、调试入口和 DROP TABLE 实现逻辑。", C.soft);
  footer(slide, 2);
}

function checklistSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "开发环境检查表");
  slide.addText("这一页只做开场确认，不在 PPT 中展开安装命令。", {
    x: 0.48, y: 1.42, w: 4.4, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const items = [
    ["WSL / Linux 可进入", "能打开终端并执行基础命令"],
    ["VSCode 已连接 WSL", "工程目录在远程窗口中可见"],
    ["MiniOB 已成功编译", "build 目录可生成 `observer` / `obclient`"],
    ["服务端与客户端可启动", "`observer`、`obclient` 能进入基本交互"],
  ];
  items.forEach((it, idx) => {
    const y = 1.92 + idx * 0.72;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7, y, w: 0.32, h: 0.32, rectRadius: 0.03,
      line: { color: C.accent, width: 1.2 }, fill: { color: "FFFFFF" },
    });
    slide.addText("✓", {
      x: 0.76, y: y + 0.01, w: 0.14, h: 0.14,
      fontSize: 12, bold: true, color: C.accent, margin: 0,
    });
    slide.addText(it[0], {
      x: 1.12, y: y - 0.01, w: 2.7, h: 0.2, fontSize: 15, bold: true, color: C.ink, margin: 0,
    });
    slide.addText(it[1], {
      x: 5.6, y: y - 0.01, w: 3.1, h: 0.2, fontSize: 12, color: C.steel, margin: 0,
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 1.1, y: y + 0.42, w: 7.75, h: 0,
      line: { color: idx === items.length - 1 ? "FFFFFF" : C.line, width: 0.8 },
    });
  });
  card(slide, 0.7, 4.75, 8.15, 0.42, "讲课策略", "未完成环境的同学直接分流排障，不让全班在安装细节里停太久。", C.blue);
  footer(slide, 3);
}

function mapSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "从最简单的存储开始");
  slide.addText("先从一个 `map<string, string>` 出发，再问它为什么还不算数据库。", {
    x: 0.48, y: 1.42, w: 5.0, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  bullets(slide, [
    "最小模型：set / get 就能完成最基础的键值存取",
    "优点：概念直观、便于把数据库问题拆到最小",
    "关键转折：当需求从“能存”升级到“能持久、能查询、能扩展”",
  ], 0.7, 1.86, 4.15, 1.18, { fontSize: 14 });
  addImageFrame(slide, img("day1_am_p04_map_structure.png"), 5.12, 1.66, 4.15, 2.85);
  card(slide, 0.7, 3.4, 4.15, 1.1, "讲授重点", "这页不是讲 map 的实现，而是把学生拉进“数据库为什么会自然长出来”这个问题里。", C.soft);
  footer(slide, 4);
}

function problemsSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "三个核心问题");
  slide.addText("简单系统为什么会自然演化成数据库？核心就是下面三个问题。", {
    x: 0.48, y: 1.42, w: 5.6, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const rows = [
    ["① 数据持久化", "程序关闭，数据消失", "序列化 + 转储到磁盘"],
    ["② 条件查询", "只能按 key 查，value 查询要遍历", "建立索引"],
    ["③ 磁盘交互", "如何高效读写磁盘页", "缓冲池 Buffer Pool"],
  ];
  rows.forEach((r, i) => {
    const y = 1.95 + i * 0.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7, y, w: 8.4, h: 0.66, rectRadius: 0.04,
      line: { color: C.line, width: 1 }, fill: { color: i === 2 ? C.blue : "FFFFFF" },
    });
    slide.addText(r[0], { x: 0.92, y: y + 0.15, w: 1.35, h: 0.18, fontSize: 13, bold: true, color: C.navy, margin: 0 });
    slide.addText(r[1], { x: 2.12, y: y + 0.15, w: 3.1, h: 0.18, fontSize: 12, color: C.ink, margin: 0 });
    slide.addText("→", { x: 5.45, y: y + 0.12, w: 0.28, h: 0.18, fontSize: 16, color: C.accent, align: "center", margin: 0 });
    slide.addText(r[2], { x: 5.88, y: y + 0.15, w: 2.25, h: 0.18, fontSize: 12.5, bold: true, color: C.ink, margin: 0 });
  });
  footer(slide, 5);
}

function storageSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "存储层次结构：快与久的权衡");
  slide.addText("数据库设计一直在做速度与持久性的 trade-off。", {
    x: 0.48, y: 1.42, w: 4.8, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const layers = [
    [2.05, 1.95, 2.5, 0.55, "CPU 高速缓存", "ns 级 · MB 级 · 易失性"],
    [1.55, 2.7, 3.5, 0.65, "内存 RAM", "较快 · GB 级 · 易失性"],
    [0.95, 3.6, 4.7, 0.78, "磁盘", "较慢 · TB 级 · 非易失性"],
  ];
  layers.forEach((l, idx) => {
    slide.addShape(pptx.ShapeType.chevron, {
      x: l[0], y: l[1], w: l[2], h: l[3],
      line: { color: C.line, width: 1 },
      fill: { color: idx === 1 ? C.blue : idx === 2 ? C.soft : "FFFFFF" },
    });
    slide.addText(l[4], { x: l[0] + 0.2, y: l[1] + 0.13, w: l[2] - 0.4, h: 0.18, fontSize: 17, bold: true, color: C.ink, align: "center", margin: 0 });
    slide.addText(l[5], { x: l[0] + 0.2, y: l[1] + 0.34, w: l[2] - 0.4, h: 0.18, fontSize: 10.5, color: C.steel, align: "center", margin: 0 });
  });
  slide.addText("速度 ↓", { x: 6.1, y: 2.22, w: 0.6, h: 1.6, fontSize: 16, bold: true, color: C.accent, rotate: 90, margin: 0 });
  card(slide, 6.65, 2.02, 2.15, 1.75, "一句话结论", "数据库既不能只追求内存速度，也不能只依赖磁盘持久。真正要解决的是“如何在快和久之间取得平衡”。", C.panel);
  footer(slide, 6);
}

function panoramaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "MiniOB 项目全景图");
  slide.addText("学生先知道 SQL 不是直接落盘，而是经过若干层处理。", {
    x: 0.48, y: 1.42, w: 5.0, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const top = [
    ["客户端", 0.68],
    ["网络层", 2.05],
    ["SQL 解析", 3.42],
    ["语句处理", 4.79],
    ["优化器", 6.16],
    ["执行器", 7.53],
  ];
  top.forEach((t, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: t[1], y: 1.92, w: 1.1, h: 0.52, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: i >= 2 && i <= 4 ? C.soft : "FFFFFF" },
    });
    slide.addText(t[0], { x: t[1], y: 2.08, w: 1.1, h: 0.14, fontSize: 12, bold: true, color: C.ink, align: "center", margin: 0 });
    if (i < top.length - 1) flowArrow(slide, t[1] + 1.14, 2.06, 0.18);
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 3.0, w: 8.0, h: 1.45, rectRadius: 0.05,
    line: { color: C.line, width: 1.2 }, fill: { color: C.panel },
  });
  slide.addText("存储引擎", { x: 1.2, y: 3.18, w: 1.1, h: 0.18, fontSize: 18, bold: true, color: C.navy, margin: 0 });
  const subs = ["表管理", "索引 B+树", "缓冲池", "磁盘文件"];
  subs.forEach((s, idx) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 2.2 + idx * 1.55, y: 3.55, w: 1.25, h: 0.48,
      line: { color: C.line, width: 1 }, fill: { color: idx === 2 ? C.blue : "FFFFFF" },
    });
    slide.addText(s, { x: 2.2 + idx * 1.55, y: 3.7, w: 1.25, h: 0.14, fontSize: 11.5, color: C.ink, align: "center", margin: 0 });
  });
  slide.addText("执行结果最终要落到存储层完成读写。", { x: 0.95, y: 4.72, w: 3.4, h: 0.16, fontSize: 12, color: C.steel, margin: 0 });
  footer(slide, 7);
}

function sqlFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "SQL 处理流程");
  slide.addText("这是整节课最关键的链路页之一。", {
    x: 0.48, y: 1.42, w: 3.2, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  addImageFrame(slide, img("day1_am_p08_sql_pipeline.png"), 0.62, 1.78, 8.76, 1.85);
  card(slide, 0.7, 3.95, 4.1, 0.82, "DML 路径", "典型查询会经过 Parse → Resolve → Optimizer → Execute，再落到存储层。", C.panel);
  card(slide, 5.0, 3.95, 4.1, 0.82, "DDL 提示", "像 DROP TABLE 这样的 DDL 不一定走完整优化器路径，这正是后面要特别说明的分流点。", C.blue);
  footer(slide, 8);
}

function sedaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "SEDA：分阶段处理的运行框架");
  addImageFrame(slide, img("day1_am_p09_seda_architecture.png"), 0.62, 1.64, 5.55, 3.35);
  bullets(slide, [
    "每个 Stage 有自己的事件队列和线程池",
    "好处：解耦、可扩展、线程复用",
    "上午只建立认知，不在这里深入线程模型实现",
  ], 6.45, 1.95, 2.9, 1.3, { fontSize: 14 });
  card(slide, 6.45, 3.55, 2.9, 1.05, "你要强调的点", "学生先接受“请求不是一口气做完，而是在多个阶段逐步推进”就够了。", C.soft);
  footer(slide, 9);
}

function debugSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "调试方法论：顺着链路看数据怎么流动");
  slide.addText("调试不是补救手段，而是理解系统的主方法。", {
    x: 0.48, y: 1.42, w: 4.8, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const nodes = [
    ["调试入口", "先让请求真正跑起来", 4.0, 1.9, 1.8],
    ["网络层", "session_stage.cpp:35", 0.75, 3.0, 1.9],
    ["解析层", "parse_stage.cpp:49", 2.95, 3.0, 1.9],
    ["语句层", "stmt.cpp:48", 5.15, 3.0, 1.9],
    ["执行层", "command_executor.cpp:30", 7.35, 3.0, 1.9],
  ];
  nodes.forEach((n, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: n[2], y: n[3], w: n[4], h: idx === 0 ? 0.7 : 0.82, rectRadius: 0.04,
      line: { color: C.line, width: 1.1 },
      fill: { color: idx === 0 ? C.blue : "FFFFFF" },
    });
    slide.addText(n[0], { x: n[2] + 0.12, y: n[3] + 0.12, w: n[4] - 0.24, h: 0.17, fontSize: 13, bold: true, color: C.ink, align: "center", margin: 0 });
    slide.addText(n[1], { x: n[2] + 0.12, y: n[3] + 0.39, w: n[4] - 0.24, h: 0.16, fontSize: 10.5, color: C.steel, align: "center", margin: 0 });
  });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: -3.1, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: -0.95, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: 1.0, h: 0.38, line: { color: C.accent, width: 1.2 } });
  slide.addShape(pptx.ShapeType.line, { x: 4.9, y: 2.6, w: 3.15, h: 0.38, line: { color: C.accent, width: 1.2 } });
  card(slide, 0.8, 4.35, 8.2, 0.55, "课堂节奏", "讲完这页就切到真实调试演示：让学生看到断点、调用栈和对象状态，而不是只看静态结构图。", C.panel);
  footer(slide, 10);
}

function volcanoSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "火山模型：查询执行是拉取驱动的");
  bullets(slide, [
    "每个算子通过 `next()` 向下游要一批或一条数据",
    "上层算子不直接拥有底层数据，而是逐层向下拉取",
    "上午只把它当成 SELECT 调试时的理解工具",
  ], 0.7, 1.86, 3.85, 1.2, { fontSize: 14 });
  addImageFrame(slide, img("day1_am_p11_volcano_model.png"), 4.9, 1.62, 4.25, 3.35);
  footer(slide, 11);
}

function createDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实战任务：沿 CREATE 的反方向实现 DROP");
  stepBox(slide, 0.75, 1.85, 3.55, 2.45, "CREATE TABLE", "1. 在 opened_tables_ 中注册\n2. new Table()\n3. 创建 .table / .data / .lob 文件\n4. 建立元数据和内存对象", C.panel);
  stepBox(slide, 5.05, 1.85, 3.55, 2.45, "DROP TABLE", "1. 从 opened_tables_ 中移除\n2. delete Table 对象\n3. 删除 .table / .data / .lob 文件\n4. 保持内存与磁盘状态一致", C.blue);
  slide.addText("⇄", {
    x: 4.32, y: 2.7, w: 0.45, h: 0.22,
    fontSize: 28, bold: true, color: C.accent, align: "center", margin: 0,
  });
  slide.addText("相反操作", {
    x: 4.18, y: 3.13, w: 0.75, h: 0.16,
    fontSize: 11, color: C.steel, align: "center", margin: 0,
  });
  footer(slide, 12);
}

function dropFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Drop Table 完整调用链");
  const steps = [
    "1. SQL: DROP TABLE users",
    "2. ParseStage：解析为 ParsedSqlNode",
    "3. ResolveStage：进入 Stmt::create_stmt()",
    "4. DropTableStmt::create()：构造语句对象",
    "5. CommandExecutor：按语句类型分发",
    "6. DropTableExecutor::execute()：发起实际删除",
    "7. Db::drop_table()：从内存到文件完成清理",
  ];
  steps.forEach((s, idx) => {
    const y = 1.74 + idx * 0.47;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.25, y, w: 6.2, h: 0.32, rectRadius: 0.03,
      line: { color: C.line, width: 1 },
      fill: { color: idx === steps.length - 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(s, { x: 1.42, y: y + 0.08, w: 5.8, h: 0.14, fontSize: 11.5, color: C.ink, margin: 0 });
    if (idx < steps.length - 1) {
      slide.addText("↓", { x: 4.2, y: y + 0.31, w: 0.2, h: 0.18, fontSize: 14, color: C.accent, align: "center", margin: 0 });
    }
  });
  card(slide, 7.75, 1.92, 1.35, 2.25, "最后一步展开", "检查表是否存在\n从 map 中移除\ndelete 对象\n删除磁盘文件", C.panel);
  footer(slide, 13);
}

function dbDropSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "关键代码解析：`Db::drop_table`");
  slide.addText("讲“做了什么”和“为什么这样做”，不要逐行念代码。", {
    x: 0.48, y: 1.42, w: 5.5, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const data = [
    ["Step 1", "检查存在性", "`opened_tables_.find(table_name)`", C.panel],
    ["Step 2", "移除内存映射", "`opened_tables_.erase(table_name)`", "FFFFFF"],
    ["Step 3", "释放 Table 对象", "`delete table`", C.panel],
    ["Step 4", "删除磁盘文件", "`filesystem::remove(...)`", C.blue],
  ];
  data.forEach((d, idx) => {
    const y = 1.95 + idx * 0.74;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.78, y, w: 8.35, h: 0.52, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: d[3] },
    });
    slide.addText(d[0], { x: 0.98, y: y + 0.14, w: 0.62, h: 0.14, fontSize: 11, bold: true, color: C.accent, margin: 0 });
    slide.addText(d[1], { x: 1.72, y: y + 0.13, w: 1.7, h: 0.16, fontSize: 13, bold: true, color: C.ink, margin: 0 });
    slide.addText(d[2], { x: 5.9, y: y + 0.13, w: 2.7, h: 0.16, fontFace: "Consolas", fontSize: 11, color: C.navy, align: "right", margin: 0 });
  });
  card(slide, 0.78, 4.96, 8.35, 0.26, "顺序意识", "先释放对象，再删文件；目标是同时维护内存状态与磁盘状态的一致性。", C.soft);
  footer(slide, 14);
}

function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与今日总结");
  stepBox(slide, 0.75, 1.82, 4.0, 2.35, "实践任务", "□ 查看 `feature/drop-table` 分支\n□ 在自己的分支独立实现\n□ 加断点观察完整调用链\n□ 验证成功路径和异常路径", C.panel);
  stepBox(slide, 5.15, 1.82, 3.7, 2.35, "今日要点", "• SQL 处理全流程\n• 调试是理解代码的主方法\n• CREATE / DROP 是一组对称操作", C.blue);
  card(slide, 0.75, 4.42, 8.1, 0.45, "收束", "讲完这一页就切到学生动手时间：先做哪一步、在哪里观察、改完怎么验证，都要给得足够具体。", C.soft);
  footer(slide, 15);
}

function qaSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.625,
    line: { color: C.panel, transparency: 100 },
    fill: { color: C.panel },
  });
  slide.addText("Q&A / 休息", {
    x: 0.75, y: 1.4, w: 3.2, h: 0.5,
    fontFace: "Microsoft YaHei",
    fontSize: 29,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  slide.addText("问题时间，或 10 分钟机动休息。", {
    x: 0.78, y: 2.1, w: 3.4, h: 0.22,
    fontSize: 15, color: C.steel, margin: 0,
  });
  card(slide, 0.82, 3.0, 3.2, 1.05, "建议用法", "如果前面节奏紧，就把这页变成答疑页；如果学生已经开始动手，也可以不单独停留。", "FFFFFF");
  footer(slide, 16);
}

coverSlide();
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

pptx.writeFile({ fileName: path.join(__dirname, "output", "day1_morning_generated.pptx") });
