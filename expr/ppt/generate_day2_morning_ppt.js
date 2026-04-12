/**
 * Record Manager 与 Text 实现 PPT 生成器
 * Record Manager 与 Text 实现
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
const KICKER = "Record Manager 与 Text 实现";
const PAGE_LABEL = "天津理工大学";
const pptx = createPptx({
  subject: "MiniOB Record Manager Text",
  title: "Record Manager 与 Text 实现",
});

// ============================================================
// 幻灯片生成函数
// ============================================================

function coverSlide() {
  addTeachingCoverSlide(pptx, {
    palette: C,
    leadTitle: "Record Manager 与",
    leadFontSize: 22,
    mainTitle: "Text 实现",
    summary: "上午会把「记录如何落页、TEXT 为什么单独处理」这条线连起来。",
    chips: [
      { text: "看懂记录页", x: 1.05, w: 1.46 },
      { text: "理解 TEXT", x: 2.68, w: 1.46 },
      { text: "动手实现", x: 4.31, w: 1.62 },
    ],
    agenda: ["存储模型", "Record 页", "TEXT 类型", "调试验证"],
    notes: "封面口播：\n- 这一场开始真正往存储层深处走，重点是记录页和 TEXT。\n- 重点放在让学生知道记录是怎么被组织起来的。\n- 到最后要让学生能顺着 TEXT 找到类型定义和记录写入的位置。",
  });
}

function agendaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "课程安排预览", KICKER, C, C.tjutRedDark);
  slide.addText("前半段建立存储模型，后半段用 TEXT 把模型落到代码。", {
    x: 0.48, y: 1.42, w: 5.9, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const items = [
    ["01", "Record Manager", "记录如何落页"],
    ["02", "TEXT 类型", "为什么不能继续靠 CHAR"],
    ["03", "实践调试", "跟断点看真实路径"],
  ];
  const xs = [1.2, 3.6, 6.0];
  items.forEach((it, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xs[i], y: 2.02, w: 2.0, h: 1.55, rectRadius: 0.05,
      line: { color: C.line, width: 1.1 }, fill: { color: i === 2 ? C.blue : "FFFFFF" },
    });
    slide.addText(it[0], { x: xs[i] + 0.14, y: 2.18, w: 0.45, h: 0.22, fontSize: 12, bold: true, color: C.accent, margin: 0 });
    slide.addText(it[1], { x: xs[i] + 0.14, y: 2.52, w: 1.7, h: 0.22, fontSize: 16.5, bold: true, color: C.ink, margin: 0 });
    slide.addText(it[2], { x: xs[i] + 0.14, y: 2.94, w: 1.7, h: 0.34, fontSize: 10.5, color: C.steel, margin: 0 });
  });
  flowArrow(slide, 3.25, 2.65, 0.18, C);
  flowArrow(slide, 5.65, 2.65, 0.18, C);
  footer(slide, PAGE_LABEL, 2, C);
}

function moduleSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "从 Table 到磁盘文件", KICKER, C, C.tjutRedDark);
  addImageFrame(slide, img("day2_am_p03_storage_module_relations.png"), 0.7, 1.7, 5.3, 3.0, C);
  bullets(slide, [
    "`Db -> Table`：数据库实例管理多张表",
    "`Table -> RecordFileHandler / Index`：表同时持有记录与索引能力",
    "`Index` 不直接存整条记录，而是通过 `RID` 回到 Record Manager 找数据",
    "`Record Manager` 和 `Index` 都会继续向下依赖 Buffer Pool",
  ], 6.22, 1.9, 2.95, 1.9, { fontSize: 13.5 }, C);
  footer(slide, PAGE_LABEL, 3, C);
}

function pageSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "页面长什么样？", KICKER, C, C.tjutRedDark);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1, y: 1.82, w: 3.55, h: 2.9, rectRadius: 0.04,
    line: { color: C.line, width: 1.2 }, fill: { color: "FFFFFF" },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.25, y: 1.98, w: 3.25, h: 0.52,
    line: { color: C.line, width: 1 }, fill: { color: C.soft },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.25, y: 2.58, w: 3.25, h: 0.48,
    line: { color: C.line, width: 1 }, fill: { color: C.blue },
  });
  for (let i = 0; i < 5; i++) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 1.25, y: 3.14 + i * 0.3, w: 3.25, h: 0.24,
      line: { color: C.line, width: 0.8 }, fill: { color: i % 2 === 0 ? "FFFFFF" : C.panel },
    });
  }
  slide.addText("Page Header", { x: 2.0, y: 2.14, w: 1.7, h: 0.14, fontSize: 16, bold: true, color: C.tjutRed, align: "center", margin: 0 });
  slide.addText("Bitmap", { x: 2.25, y: 2.72, w: 1.2, h: 0.14, fontSize: 16, bold: true, color: C.tjutRed, align: "center", margin: 0 });
  slide.addText("Record Data", { x: 2.0, y: 3.86, w: 1.7, h: 0.16, fontSize: 17, bold: true, color: C.tjutRed, align: "center", margin: 0 });
  card(slide, 5.25, 1.88, 3.7, 0.72, "Page Header", "记录当前页的记录数、记录大小、最大容量。没有它，你连「这页还能不能继续塞」都不知道。", C.panel, C);
  card(slide, 5.25, 2.78, 3.7, 0.72, "Bitmap", "用最便宜的位图管理槽位占用。删除记录时，不必立刻移动整页数据。", C.blue, C);
  card(slide, 5.25, 3.68, 3.7, 0.72, "Record Data", "真正的记录内容按槽位放在这里。页内管理的目标，是让定位、删除、复用都足够便宜。", "FFFFFF", C);
  footer(slide, PAGE_LABEL, 4, C);
}

function ridSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "RID 与 Bitmap 解决什么问题？", KICKER, C, C.tjutRedDark);
  stepBox(slide, 0.82, 1.95, 2.55, 1.9, "RID = page_num + slot_num", "页号决定记录在哪个页面\n槽号决定记录在页内哪个位置\n索引叶子节点最终靠它回到真正记录", C.panel, C);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.1, y: 1.92, w: 4.72, h: 2.45, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("Bitmap", { x: 4.32, y: 2.1, w: 0.8, h: 0.14, fontSize: 14, bold: true, color: C.tjutRed, margin: 0 });
  const bits = ["1", "1", "0", "1", "0", "0"];
  bits.forEach((b, i) => {
    tableCell(slide, 4.28 + i * 0.46, 2.34, 0.38, 0.32, b, { fill: b === "1" ? C.blue : "FFFFFF", bold: true }, C);
  });
  for (let i = 0; i < 6; i++) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 4.35, y: 2.92 + i * 0.21, w: 3.8, h: 0.16,
      line: { color: C.line, width: 0.7 }, fill: { color: i === 3 ? C.blue : i % 2 === 0 ? "FFFFFF" : C.panel },
    });
  }
  slide.addText("RID(7,3)", { x: 5.95, y: 1.72, w: 0.8, h: 0.14, fontSize: 13, bold: true, color: C.accent, margin: 0 });
  slide.addShape(pptx.ShapeType.line, {
    x: 6.28, y: 1.86, w: -0.15, h: 1.05, line: { color: C.accent, width: 1.5, endArrowType: "triangle" },
  });
  footer(slide, PAGE_LABEL, 5, C);
}

function fixedVarSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "定长记录 vs 变长记录", KICKER, C, C.tjutRedDark);
  stepBox(slide, 0.82, 1.92, 3.9, 2.1, "定长记录", "| id(4B) | age(4B) | score(4B) |\n\n位置好算，页内管理简单\n但短值也要占满固定空间", C.panel, C);
  stepBox(slide, 5.08, 1.92, 3.9, 2.1, "变长记录", "| id | len | name(N字节) |\n\n更节省空间\n但长度管理、定位、更新都更复杂", C.blue, C);
  slide.addText("简单但可能浪费", { x: 1.9, y: 4.26, w: 1.7, h: 0.16, fontSize: 13, bold: true, color: C.steel, align: "center", margin: 0 });
  slide.addText("灵活但管理更难", { x: 6.15, y: 4.26, w: 1.8, h: 0.16, fontSize: 13, bold: true, color: C.steel, align: "center", margin: 0 });
  card(slide, 0.82, 4.62, 8.16, 0.34, "过渡", "MiniOB 当前主路线仍以定长记录为主，而 TEXT 就是迫使系统面对变长存储问题的典型入口。", "FFFFFF", C);
  footer(slide, PAGE_LABEL, 6, C);
}

function rmCodeSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Record Manager 代码结构", KICKER, C, C.tjutRedDark);
  const cols = [
    ["RecordFileHandler", "文件级管理\ninsert_record()\ndelete_record()\nget_record()", C.panel],
    ["RecordPageHandler", "页面级管理\n找槽位\n维护 Bitmap\n维护 PageHeader", C.blue],
    ["RecordScanner", "扫描遍历\nscan_begin()\nhas_next()\nnext()", "FFFFFF"],
  ];
  cols.forEach((c, i) => {
    card(slide, 0.78 + i * 2.9, 1.98, 2.48, 2.25, c[0], c[1], c[2], C);
  });
  footer(slide, PAGE_LABEL, 7, C);
}

function insertSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "插入一条记录会发生什么？", KICKER, C, C.tjutRedDark);
  const steps = [
    "1. 找到有空间的页面",
    "2. 在 Bitmap 中找到空闲槽位",
    "3. 写入记录数据并更新页头",
    "4. 返回 RID，供索引与后续更新使用",
  ];
  steps.forEach((s, idx) => {
    const y = 1.86 + idx * 0.68;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.25, y, w: 6.0, h: 0.42, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: idx === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(s, { x: 1.42, y: y + 0.12, w: 5.6, h: 0.14, fontSize: 12, color: C.ink, margin: 0 });
    if (idx < steps.length - 1) {
      slide.addText("↓", { x: 4.1, y: y + 0.41, w: 0.2, h: 0.16, fontSize: 15, color: C.accent, align: "center", margin: 0 });
    }
  });
  footer(slide, PAGE_LABEL, 8, C);
}

function charProblemSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "为什么 CHAR 不够用了？", KICKER, C, C.tjutRedDark);
  const rows = [
    ["短字符串", "\"Alice\" 只用 5B，却占掉 char(20) 的整块空间"],
    ["长字符串", "评论、文章内容会直接装不下，定长列没有弹性"],
    ["真实业务", "TEXT 场景对应的是文本体量级别变化，不只是名字字段变长一点"],
  ];
  rows.forEach((r, idx) => {
    card(slide, 0.9, 1.88 + idx * 0.9, 8.0, 0.68, r[0], r[1], idx === 1 ? C.blue : "FFFFFF", C);
  });
  footer(slide, PAGE_LABEL, 9, C);
}

function textStoreSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "TEXT 应该怎么存？", KICKER, C, C.tjutRedDark);
  slide.addText("同样是 TEXT，短文本和长文本适合的落盘方式并不一样。", {
    x: 0.62, y: 1.42, w: 6.5, h: 0.18, fontSize: 13, color: C.steel, margin: 0,
  });

  slide.addText("短文本", { x: 0.72, y: 1.86, w: 0.7, h: 0.16, fontSize: 15, bold: true, color: C.ink, margin: 0 });
  slide.addText("直接内联", { x: 0.72, y: 2.08, w: 0.9, h: 0.16, fontSize: 12, color: C.steel, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.72, y: 1.76, w: 3.02, h: 1.34, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.72, y: 1.76, w: 3.02, h: 0.34,
    line: { color: C.line, width: 1.0 }, fill: { color: C.panel },
  });
  slide.addText("record", { x: 2.56, y: 1.86, w: 1.34, h: 0.14, fontSize: 12.5, bold: true, color: C.ink, margin: 0, align: "center", fit: "shrink" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.02, y: 2.26, w: 2.42, h: 0.34, rectRadius: 0.02,
    line: { color: C.line, width: 1.0 }, fill: { color: C.soft },
  });
  slide.addText("TEXT (Inline)", { x: 2.02, y: 2.36, w: 2.42, h: 0.12, fontSize: 11.5, color: C.ink, margin: 0, align: "center" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.02, y: 2.66, w: 2.42, h: 0.24, rectRadius: 0.02,
    line: { color: C.line, width: 0.9 }, fill: { color: "FFFFFF" },
  });
  slide.addText("短文本内容直接放在记录中", { x: 2.16, y: 2.73, w: 2.14, h: 0.1, fontSize: 9.8, color: C.steel, margin: 0, align: "center" });
  card(slide, 1.72, 3.22, 3.02, 0.54, "Trade-off", "访问快，但会挤占记录空间", C.panel, C);

  slide.addText("长文本", { x: 0.72, y: 4.04, w: 0.7, h: 0.16, fontSize: 15, bold: true, color: C.ink, margin: 0 });
  slide.addText("外部 LOB", { x: 0.72, y: 4.26, w: 0.9, h: 0.16, fontSize: 12, color: C.steel, margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.72, y: 3.94, w: 2.96, h: 1.16, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.72, y: 3.94, w: 2.96, h: 0.32,
    line: { color: C.line, width: 1.0 }, fill: { color: C.panel },
  });
  slide.addText("record", { x: 2.54, y: 4.03, w: 1.32, h: 0.12, fontSize: 12.5, bold: true, color: C.ink, margin: 0, align: "center", fit: "shrink" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.02, y: 4.4, w: 2.28, h: 0.32, rectRadius: 0.02,
    line: { color: C.line, width: 1.0 }, fill: { color: C.soft },
  });
  slide.addText("TEXT + LOB Pointer", { x: 2.02, y: 4.49, w: 2.28, h: 0.12, fontSize: 11.2, color: C.ink, margin: 0, align: "center" });

  slide.addText("指针", { x: 4.86, y: 4.42, w: 0.44, h: 0.12, fontSize: 11.5, bold: true, color: C.accent, margin: 0, align: "center" });
  slide.addShape(pptx.ShapeType.line, {
    x: 4.32, y: 4.56, w: 1.08, h: 0,
    line: { color: C.accent, width: 1.3, endArrowType: "triangle" },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.56, y: 3.84, w: 3.48, h: 1.52, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.56, y: 3.84, w: 3.48, h: 0.34,
    line: { color: C.line, width: 1.0 }, fill: { color: C.blue },
  });
  slide.addText("LOB 文件", { x: 6.9, y: 3.95, w: 0.82, h: 0.12, fontSize: 13, bold: true, color: C.tjutRed, margin: 0, align: "center" });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.86, y: 4.34, w: 2.88, h: 0.72, rectRadius: 0.02,
    line: { color: C.line, width: 0.9 }, fill: { color: C.soft },
  });
  slide.addText("长文本内容存放在外部页或 LOB 文件中", {
    x: 6.06, y: 4.56, w: 2.48, h: 0.16, fontSize: 10.5, color: C.ink, margin: 0, align: "center",
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.72, y: 5.03, w: 7.32, h: 0.24, rectRadius: 0.03,
    line: { color: C.line, width: 1.0 }, fill: { color: C.blue },
  });
  slide.addText("结论：内联更快，LOB 更省记录空间，但读取时通常多一次定位或 I/O。", {
    x: 1.96, y: 5.1, w: 6.84, h: 0.1, fontSize: 10.5, color: C.ink, margin: 0, align: "center",
  });
  footer(slide, PAGE_LABEL, 10, C);
}

function textEntrySlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "TEXT 类型实现入口", KICKER, C, C.tjutRedDark);
  const rows = [
    ["① 类型枚举", "AttrType 中加入 TEXTS", "parse_defs / attr_type"],
    ["② 词法语法", "parser 支持 `TEXT` 关键字", "lex_sql.l / yacc_sql.y"],
    ["③ 类型系统", "新增 `TextType` 或对应分支", "type system"],
    ["④ 记录写入", "决定是内联还是写入 LOB", "table / record / lob"],
  ];
  rows.forEach((r, idx) => {
    const y = 1.8 + idx * 0.78;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.76, y, w: 8.25, h: 0.56, rectRadius: 0.04,
      line: { color: C.line, width: 1 }, fill: { color: idx === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(r[0], { x: 0.96, y: y + 0.16, w: 1.65, h: 0.14, fontSize: 12, bold: true, color: C.tjutRed, margin: 0 });
    slide.addText(r[1], { x: 2.72, y: y + 0.16, w: 2.6, h: 0.14, fontSize: 11.5, color: C.ink, margin: 0 });
    slide.addText(r[2], { x: 5.72, y: y + 0.16, w: 2.8, h: 0.14, fontFace: "Consolas", fontSize: 10.3, color: C.steel, margin: 0 });
  });
  footer(slide, PAGE_LABEL, 11, C);
}

function textFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "TEXT 从 SQL 到记录的调用链", KICKER, C, C.tjutRedDark);
  const steps = [
    "1. parser 识别 `TEXT` 类型",
    "2. TableMeta 记录字段元数据",
    "3. INSERT 进入 `make_record()` 构造值",
    "4. 决定短文本内联，还是把长文本写到 `.lob`",
  ];
  steps.forEach((s, idx) => {
    const y = 1.82 + idx * 0.64;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.3, y, w: 6.0, h: 0.4, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: idx === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(s, { x: 1.46, y: y + 0.12, w: 5.65, h: 0.14, fontSize: 11.8, color: C.ink, margin: 0 });
    if (idx < steps.length - 1) {
      slide.addText("↓", { x: 4.18, y: y + 0.39, w: 0.2, h: 0.16, fontSize: 15, color: C.accent, align: "center", margin: 0 });
    }
  });
  footer(slide, PAGE_LABEL, 12, C);
}

function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与总结", KICKER, C, C.tjutRedDark);
  slide.addText("这一场最容易卡在「知道名词但不知道先跟哪条路径」，所以上机步骤一定要按顺序做。", {
    x: 0.48, y: 1.42, w: 6.5, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 1.82, w: 4.2, h: 2.1, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.panel },
  });
  slide.addText("上机顺序", { x: 0.95, y: 2.04, w: 1.2, h: 0.18, fontSize: 17, bold: true, color: C.navy, margin: 0 });
  const tasks = [
    ["01", "先跟 INSERT", "把 RID 和页面分配过程跑明白"],
    ["02", "再看 TEXT", "确认它为什么不能沿用定长处理"],
    ["03", "动手实现", "创建含 TEXT 字段的表并插入查询"],
  ];
  tasks.forEach((task, idx) => {
    const y = 2.38 + idx * 0.5;
    slide.addText(task[0], { x: 0.98, y, w: 0.34, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(task[1], { x: 1.42, y: y - 0.01, w: 1.62, h: 0.2, fontSize: 12.2, bold: true, color: C.ink, margin: 0 });
    slide.addText(task[2], { x: 3.08, y, w: 1.44, h: 0.2, fontSize: 9.8, color: C.steel, margin: 0 });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 1.82, w: 3.7, h: 1.0, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.blue },
  });
  slide.addText("验收标准", { x: 5.38, y: 2.05, w: 1.2, h: 0.18, fontSize: 16.5, bold: true, color: C.navy, margin: 0 });
  slide.addText("✓ 能说清记录是怎么落页的\n✓ 能解释 TEXT 为什么是变长问题", {
    x: 5.38, y: 2.38, w: 2.95, h: 0.32, fontSize: 11.2, color: C.ink, margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 3.0, w: 3.7, h: 0.92, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("本节要点", { x: 5.38, y: 3.2, w: 1.85, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
  slide.addText("1. 记录是按页组织和定位的。\n2. TEXT 的核心在变长存储。", {
    x: 5.38, y: 3.52, w: 3.0, h: 0.32, fontSize: 11.1, color: C.ink, margin: 0,
  });

  // 提测提醒
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 4.1, w: 8.16, h: 0.65, rectRadius: 0.04,
    line: { color: C.accent, width: 1.5 }, fill: { color: C.soft },
  });
  slide.addText("提测提醒", { x: 0.95, y: 4.22, w: 1.2, h: 0.18, fontSize: 14, bold: true, color: C.accent, margin: 0 });
  slide.addText("赛题提测依赖 UPDATE 语句，需课后自行实现。思路：查找旧记录 → 构造新值 → 删除旧记录 → 插入新记录。可参照 DELETE 做对称扩展。", {
    x: 2.2, y: 4.32, w: 6.4, h: 0.32, fontSize: 11, color: C.ink, margin: 0,
  });
  slide.addNotes("第13页口播：\n- 这页要把上机顺序讲死，不要让学生自己猜先看什么。\n- 验收标准强调现象和路径，不强调「看懂全部实现」。");
  footer(slide, PAGE_LABEL, 13, C);
}

function qaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Q&A / 机动答疑", KICKER, C, C.tjutRedDark);
  slide.addText("接下来进入记录页 / TEXT 的机动答疑。", { x: 0.78, y: 1.46, w: 4.5, h: 0.2, fontSize: 14, color: C.steel, margin: 0 });
  const blocks = [
    [0.82, "现在先做", "先确认 Record 页结构，再跟一次 INSERT 的路径", C.panel],
    [3.48, "遇到问题先问", "TEXT 为什么单独存？改记录时 RID 会不会受影响？", "FFFFFF"],
    [6.14, "还做不出来再问", "把页布局、断点位置和你看到的状态变化说清楚", C.blue],
  ];
  blocks.forEach((block, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: block[0], y: 2.0, w: 2.28, h: 1.9, rectRadius: 0.05,
      line: { color: C.line, width: 1.1 }, fill: { color: block[3] },
    });
    slide.addText(block[1], { x: block[0] + 0.2, y: 2.24, w: 1.88, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
    slide.addText(block[2], { x: block[0] + 0.2, y: 2.62, w: 1.84, h: 0.68, fontSize: 11.1, color: C.ink, margin: 0 });
    if (idx < blocks.length - 1) {
      slide.addText("→", { x: block[0] + 2.34, y: 2.8, w: 0.22, h: 0.16, fontSize: 18, color: C.accent, align: "center", margin: 0 });
    }
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.12, y: 4.3, w: 7.7, h: 0.42, rectRadius: 0.03,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("这半天至少要搞清两件事：记录按页组织、TEXT 是变长问题。UPDATE 留作课后对称扩展。", {
    x: 1.22, y: 4.44, w: 7.48, h: 0.14, fontSize: 11, color: C.steel, align: "center", margin: 0,
  });
  slide.addNotes("结束页口播：\n- 让学生把注意力放回页结构、TEXT两条主线。\n- 提问时优先说明页布局、断点位置和状态变化。\n- UPDATE 不在课上展开，只口头提一句课后自己做。");
  footer(slide, PAGE_LABEL, 14, C);
}

// ============================================================
// 执行生成
// ============================================================

async function main() {
  coverSlide();
  agendaSlide();
  moduleSlide();
  pageSlide();
  ridSlide();
  fixedVarSlide();
  rmCodeSlide();
  insertSlide();
  charProblemSlide();
  textStoreSlide();
  textEntrySlide();
  textFlowSlide();
  practiceSlide();
  qaSlide();

  await pptx.writeFile({ fileName: path.join(__dirname, "output", "day2_morning_generated.pptx") });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
