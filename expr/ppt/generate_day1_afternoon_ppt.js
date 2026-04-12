/**
 * B+树与多列索引实现 PPT 生成器
 * B+树与多列索引实现
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
const KICKER = "B+树与多列索引实现";
const PAGE_LABEL = "天津理工大学";
const pptx = createPptx({
  subject: "MiniOB BPlusTree And MultiColumn Index",
  title: "B+树与多列索引实现",
});

// ============================================================
// 幻灯片生成函数
// ============================================================

function coverSlide() {
  addTeachingCoverSlide(pptx, {
    palette: C,
    leadTitle: "B+树与",
    mainTitle: "多列索引实现",
    summary: "下午主线是把“为什么需要索引、为什么是 B+树、为什么多列索引不能乱拼”这三件事讲透。",
    chips: [
      { text: "理解索引", x: 1.05, w: 1.32 },
      { text: "看懂 B+树", x: 2.53, w: 1.52 },
      { text: "实现多列索引", x: 4.22, w: 1.86 },
    ],
    agenda: ["前序回顾", "B+树结构", "代码结构", "索引实战"],
    notes: "封面口播：\n- 下午主线是理解索引、看懂 B+树、完成多列索引。\n- 这一场会比上午更偏数据结构与实现细节，但仍然先立地图再写代码。\n- 目标放在知道为什么数据库索引最后会选 B+树。",
  });
}

function reviewSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "前序回顾", KICKER, C);
  const items = [
    ["①", "SQL 处理全流程", "Parse → Resolve → Optimize → Execute"],
    ["②", "调试技巧", "断点设置、火山模型"],
    ["③", "DROP TABLE 实现", "CREATE 的对称操作"],
  ];
  items.forEach((it, idx) => {
    const y = 1.78 + idx * 0.92;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.82, y, w: 0.42, h: 0.42,
      line: { color: C.accent, width: 1.2 },
      fill: { color: idx === 2 ? C.blue : "FFFFFF" },
    });
    slide.addText(it[0], { x: 0.82, y: y + 0.1, w: 0.42, h: 0.14, fontSize: 12, bold: true, color: C.navy, align: "center", margin: 0 });
    slide.addText(it[1], { x: 1.42, y: y + 0.01, w: 2.3, h: 0.18, fontSize: 15, bold: true, color: C.ink, margin: 0 });
    slide.addText(it[2], { x: 4.95, y: y + 0.03, w: 3.75, h: 0.18, fontSize: 12, color: C.steel, margin: 0 });
    if (idx < items.length - 1) {
      slide.addShape(pptx.ShapeType.line, { x: 1.42, y: y + 0.55, w: 7.15, h: 0, line: { color: C.line, width: 0.8 } });
    }
  });
  footer(slide, PAGE_LABEL, 2, C);
}

function needIndexSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "问题引入 - 为什么需要索引？", KICKER, C);
  slide.addText("场景对比：1000万条记录，查询 age=25。", {
    x: 0.48, y: 1.42, w: 6.4, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  addImageFrame(slide, img("day1_pm_p03_index_vs_scan.png"), 0.72, 1.78, 5.0, 2.65, C);
  slide.addShape(pptx.ShapeType.line, { x: 5.88, y: 1.9, w: 0, h: 2.5, line: { color: C.line, width: 0.9 } });
  stepBox(slide, 6.0, 1.9, 2.95, 1.05, "无索引", "全表扫描\n复杂度 O(n)\n需要访问很多数据页", "FFFFFF", C);
  stepBox(slide, 6.0, 3.1, 2.95, 1.05, "有索引", "B+树查找\n复杂度 O(log n)\n通常只走 3-4 次 I/O", C.blue, C);
  footer(slide, PAGE_LABEL, 3, C);
}

function dsCompareSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "索引应该用什么数据结构？", KICKER, C);
  slide.addText("候选人对比表。", {
    x: 0.48, y: 1.42, w: 5.8, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const x0 = 0.8, y0 = 1.88, colW = [2.2, 1.8, 1.8, 2.0];
  const headers = ["数据结构", "查找复杂度", "范围查询", "磁盘友好"];
  let x = x0;
  headers.forEach((h, idx) => {
    tableCell(slide, x, y0, colW[idx], 0.42, h, { fill: C.soft, bold: true, color: C.navy }, C);
    x += colW[idx];
  });
  const rows = [
    ["HashMap", "O(1)", "不支持", "一般"],
    ["二叉搜索树", "O(log n)", "支持", "不支持"],
    ["红黑树", "O(log n)", "支持", "不支持"],
    ["B+树", "O(log n)", "支持", "支持"],
  ];
  rows.forEach((row, ridx) => {
    let cx = x0;
    row.forEach((cell, cidx) => {
      const hi = ridx === rows.length - 1;
      tableCell(slide, cx, y0 + 0.42 + ridx * 0.5, colW[cidx], 0.5, cell, {
        fill: hi ? C.blue : "FFFFFF",
        bold: hi && (cidx === 0 || cidx === 3),
        color: hi && cidx === 3 ? C.good : C.ink,
      }, C);
      cx += colW[cidx];
    });
  });
  footer(slide, PAGE_LABEL, 4, C);
}

function diskSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "磁盘的物理单位（OS 知识）", KICKER, C);
  addImageFrame(slide, img("day1_pm_p05_disk_units_read_patterns.png"), 0.72, 1.66, 4.65, 3.05, C);
  bullets(slide, [
    "扇区、块/页、磁盘页是存储世界的基本单位",
    "数据库读写按页进行，不会按一个字节一个字节来",
    "顺序读更快，随机读更慢，所以树高会直接映射到 I/O 次数",
  ], 5.75, 1.9, 3.1, 1.45, { fontSize: 14 }, C);
  footer(slide, PAGE_LABEL, 5, C);
}

function heightSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "为什么是 B+树？", KICKER, C);
  addImageFrame(slide, img("day1_pm_p06_bplustree_vs_redblack.png"), 0.72, 1.72, 5.15, 2.75, C);
  stepBox(slide, 6.12, 1.86, 2.78, 0.9, "B+树", "多路分支\n通常只需 3-4 层\n每层读取一个页", C.blue, C);
  stepBox(slide, 6.12, 2.96, 2.78, 0.9, "红黑树", "二叉分支\n节点层数更高\n更多随机 I/O", "FFFFFF", C);
  footer(slide, PAGE_LABEL, 6, C);
}

function structureSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "B+树的结构详解", KICKER, C);
  addImageFrame(slide, img("day1_pm_p07_bplustree_structure.png"), 0.7, 1.62, 5.2, 3.18, C);
  const items = [
    ["内部节点", "只存键和子指针，负责缩小查找范围"],
    ["叶子节点", "存键和值或记录位置，所有数据入口都在叶子层"],
    ["叶子链表", "把有序叶子连起来，范围查询可以顺着扫下去"],
  ];
  items.forEach((it, idx) => {
    card(slide, 6.15, 1.78 + idx * 0.96, 2.7, 0.72, it[0], it[1], idx === 1 ? C.blue : "FFFFFF", C);
  });
  footer(slide, PAGE_LABEL, 7, C);
}

function lookupSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "B+树的操作 - 查找", KICKER, C);
  slide.addText("查找 key=40 的过程", { x: 0.48, y: 1.42, w: 2.4, h: 0.2, fontSize: 13, color: C.steel, margin: 0 });
  stepBox(slide, 0.82, 1.92, 2.45, 2.2, "查找步骤", "1. 根节点判断区间\n2. 沿一条子指针向下\n3. 在叶子节点命中 key=40", C.panel, C);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.65, y: 1.9, w: 5.2, h: 2.7, rectRadius: 0.05,
    line: { color: C.line, width: 1 }, fill: { color: "FFFFFF" },
  });
  const nodes = [
    [5.58, 2.1, 1.2, 0.36, "[30 | 60]", C.blue],
    [4.0, 2.92, 1.1, 0.34, "[10|20]", "FFFFFF"],
    [5.65, 2.92, 1.1, 0.34, "[40|50]", C.blue],
    [7.3, 2.92, 1.3, 0.34, "[70|80|90]", "FFFFFF"],
    [3.82, 3.78, 0.95, 0.34, "[1,10]", "FFFFFF"],
    [4.88, 3.78, 1.05, 0.34, "[11,20]", "FFFFFF"],
    [6.0, 3.78, 1.05, 0.34, "[31,40]", C.blue],
    [7.15, 3.78, 1.05, 0.34, "[41,50]", "FFFFFF"],
  ];
  nodes.forEach((n) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: n[0], y: n[1], w: n[2], h: n[3], rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: n[5] },
    });
    slide.addText(n[4], { x: n[0], y: n[1] + 0.1, w: n[2], h: 0.12, fontSize: 10.5, color: C.ink, align: "center", margin: 0 });
  });
  footer(slide, PAGE_LABEL, 8, C);
}

function splitSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "B+树的操作 - 插入与删除", KICKER, C);
  stepBox(slide, 0.78, 1.92, 4.05, 2.45, "插入分裂直觉", "插入 key=25 时，如果叶子页已满：\n1. 原节点拆成左右两个页\n2. 把分隔键推到父节点\n3. 父节点满了就继续向上分裂\n4. 根分裂时，树高 +1", C.panel, C);
  stepBox(slide, 5.12, 1.92, 3.78, 2.45, "删除合并直觉", "删除后如果页太空：\n1. 先看兄弟页能否借位\n2. 不够再合并相邻页\n3. 需要回写父节点中的分隔信息", C.blue, C);
  footer(slide, PAGE_LABEL, 9, C);
}

function codeStructureSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "MiniOB 索引代码结构", KICKER, C);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9, y: 1.95, w: 2.0, h: 0.88, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("Index", { x: 0.9, y: 2.13, w: 2.0, h: 0.18, fontSize: 19, bold: true, color: C.ink, align: "center", margin: 0 });
  slide.addText("统一索引接口", { x: 0.9, y: 2.42, w: 2.0, h: 0.16, fontSize: 11.5, color: C.steel, align: "center", margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.85, y: 1.95, w: 2.1, h: 0.88, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: C.blue },
  });
  slide.addText("BplusTreeIndex", { x: 3.85, y: 2.13, w: 2.1, h: 0.18, fontSize: 18, bold: true, color: C.ink, align: "center", margin: 0 });
  slide.addText("面向表与索引元数据", { x: 3.85, y: 2.42, w: 2.1, h: 0.16, fontSize: 11.2, color: C.steel, align: "center", margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.88, y: 1.95, w: 2.15, h: 0.88, rectRadius: 0.04,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("BplusTreeHandler", { x: 6.88, y: 2.13, w: 2.15, h: 0.18, fontSize: 17, bold: true, color: C.ink, align: "center", margin: 0 });
  slide.addText("真正操作页与节点", { x: 6.88, y: 2.42, w: 2.15, h: 0.16, fontSize: 11.2, color: C.steel, align: "center", margin: 0 });
  flowArrow(slide, 2.98, 2.22, 0.36, C);
  flowArrow(slide, 6.02, 2.22, 0.36, C);
  footer(slide, PAGE_LABEL, 10, C);
}

function createFlowSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "索引创建流程", KICKER, C);
  addImageFrame(slide, img("day1_pm_p11_create_index_flow.png"), 0.7, 1.68, 4.8, 3.18, C);
  const steps = [
    "1. yacc_sql.y 解析 CREATE INDEX",
    "2. CreateIndexStmt::create() 校验字段",
    "3. CreateIndexExecutor::execute() 分发执行",
    "4. Table::create_index() 组织元数据",
    "5. BplusTreeIndex::create() 计算键长度",
    "6. BplusTreeHandler::create() 创建索引文件",
  ];
  steps.forEach((s, idx) => {
    slide.addText(s, {
      x: 5.75, y: 1.88 + idx * 0.42, w: 3.1, h: 0.14,
      fontSize: 11.5, color: idx === 4 || idx === 5 ? C.navy : C.ink, bold: idx >= 4, margin: 0,
    });
  });
  footer(slide, PAGE_LABEL, 11, C);
}

function multiFieldSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "从单列索引到多列索引", KICKER, C);
  const rows = [
    ["① Parser支持多字段", "attribute_name → vector<string>", "yacc_sql.y"],
    ["② Stmt验证多字段", "检查字段存在性、类型", "create_index_stmt.cpp"],
    ["③ IndexMeta存储多字段", "field_ → vector<string>", "index_meta.h"],
    ["④ B+树键计算", "键长度=字段长度之和", "bplus_tree_index.cpp"],
  ];
  rows.forEach((r, idx) => {
    const y = 1.78 + idx * 0.78;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.76, y, w: 8.22, h: 0.56, rectRadius: 0.04,
      line: { color: C.line, width: 1 }, fill: { color: idx === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(r[0], { x: 0.96, y: y + 0.16, w: 2.05, h: 0.14, fontSize: 12, bold: true, color: C.navy, margin: 0 });
    slide.addText(r[1], { x: 3.05, y: y + 0.16, w: 2.38, h: 0.14, fontSize: 11.5, color: C.ink, margin: 0 });
    slide.addText(r[2], { x: 5.74, y: y + 0.16, w: 2.95, h: 0.14, fontFace: "Consolas", fontSize: 10.5, color: C.steel, margin: 0 });
  });
  footer(slide, PAGE_LABEL, 12, C);
}

function lexicographicSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "多列索引的键比较", KICKER, C);
  const examples = [
    ["('Alice', 20) < ('Bob', 25)", "先比 name，Alice < Bob，所以不用再比较 age"],
    ["('Alice', 20) < ('Alice', 25)", "name相同，比较age"],
    ["('Bob', 30) > ('Alice', 25)", "Bob > Alice"],
  ];
  examples.forEach((ex, idx) => {
    card(slide, 0.82, 1.82 + idx * 0.9, 8.15, 0.68, ex[0], ex[1], idx === 1 ? C.blue : "FFFFFF", C);
  });
  footer(slide, PAGE_LABEL, 13, C);
}

function prefixSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "最左前缀原则", KICKER, C);
  slide.addText("示例索引：`(name, age)`，索引中的有序排列先由 `name` 决定，再由 `age` 决定。", {
    x: 0.48, y: 1.42, w: 6.9, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  const rows = [["Alice", "20"], ["Alice", "25"], ["Alice", "30"], ["Bob", "20"], ["Bob", "25"]];
  tableCell(slide, 0.88, 1.9, 1.45, 0.4, "name", { fill: C.soft, bold: true, color: C.navy }, C);
  tableCell(slide, 2.33, 1.9, 1.15, 0.4, "age", { fill: C.soft, bold: true, color: C.navy }, C);
  rows.forEach((r, idx) => {
    const fill = idx < 3 ? C.blue : "FFFFFF";
    tableCell(slide, 0.88, 2.3 + idx * 0.42, 1.45, 0.42, r[0], { fill }, C);
    tableCell(slide, 2.33, 2.3 + idx * 0.42, 1.15, 0.42, r[1], { fill: idx === 1 ? C.warn : fill }, C);
  });
  stepBox(slide, 4.1, 1.96, 4.45, 0.84, "WHERE name='Alice'   ✓", "因为 name='Alice' 的记录在索引里是连续的一段。", C.blue, C);
  stepBox(slide, 4.1, 2.98, 4.45, 0.84, "WHERE name='Alice' AND age=25   ✓", "先锁定 Alice 这一段，再在段内比较 age。", "FFFFFF", C);
  stepBox(slide, 4.1, 4.0, 4.45, 0.84, "WHERE age=25   ✗", "age=25 分散在多个 name 段里，不满足最左前缀，无法直接定位连续范围。", C.panel, C);
  footer(slide, PAGE_LABEL, 14, C);
}

function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与总结", KICKER, C);
  slide.addText("索引题最怕的是概念懂一点、代码改一点、测试却不知道从哪里下手，所以这里把顺序写死。", {
    x: 0.48, y: 1.42, w: 6.6, h: 0.2, fontSize: 13, color: C.steel, margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 1.82, w: 4.2, h: 2.72, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.panel },
  });
  slide.addText("上机顺序", { x: 0.95, y: 2.04, w: 1.2, h: 0.18, fontSize: 17, bold: true, color: C.navy, margin: 0 });
  const tasks = [
    ["01", "先看对照实现", "先从单列索引和已有比较逻辑读起"],
    ["02", "补多列比较", "保证比较规则是字典序而不是逐字段乱拼"],
    ["03", "补创建与查询验证", "至少准备 CREATE INDEX 和命中索引的 SQL"],
    ["04", "回到最左前缀检查", "确认哪些查询能用，哪些不能用"],
  ];
  tasks.forEach((task, idx) => {
    const y = 2.38 + idx * 0.5;
    slide.addText(task[0], { x: 0.98, y, w: 0.34, h: 0.14, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    slide.addText(task[1], { x: 1.42, y: y - 0.01, w: 1.68, h: 0.2, fontSize: 12.2, bold: true, color: C.ink, margin: 0 });
    slide.addText(task[2], { x: 3.1, y, w: 1.46, h: 0.2, fontSize: 9.8, color: C.steel, margin: 0 });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 1.82, w: 3.7, h: 1.18, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: C.blue },
  });
  slide.addText("验收标准", { x: 5.38, y: 2.05, w: 1.2, h: 0.18, fontSize: 16.5, bold: true, color: C.navy, margin: 0 });
  slide.addText("✓ 能解释多列比较为什么是字典序\n✓ 能用 SQL 验证索引已生效\n✓ 知道最左前缀失效发生在哪里", {
    x: 5.38, y: 2.38, w: 2.95, h: 0.42, fontSize: 11.2, color: C.ink, margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15, y: 3.18, w: 3.7, h: 1.36, rectRadius: 0.05,
    line: { color: C.line, width: 1.1 }, fill: { color: "FFFFFF" },
  });
  slide.addText("本节要点", { x: 5.38, y: 3.4, w: 1.85, h: 0.18, fontSize: 16, bold: true, color: C.navy, margin: 0 });
  slide.addText("1. B+树适合磁盘数据库，因为它矮胖、页对齐、支持范围查询。\n2. 多列索引比较本质是字典序比较。\n3. 最左前缀原则决定索引能不能用。", {
    x: 5.38, y: 3.72, w: 3.0, h: 0.62, fontSize: 11.1, color: C.ink, margin: 0,
  });
  slide.addNotes("第15页口播：\n- 这页直接作为上机操作说明来讲。\n- 验收标准必须让学生能自己检查。\n- 收束到三件事：B+树原因、字典序、多列索引最左前缀。");
  footer(slide, PAGE_LABEL, 15, C);
}

function extensionSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "延伸思考题", KICKER, C);
  const questions = [
    "① 为什么B+树把数据放在叶子节点，而不是内部节点？",
    "② 多列索引的字段顺序重要吗？(name, age) 和 (age, name) 有什么区别？",
    "③ 什么时候应该创建索引？什么时候不应该？",
  ];
  questions.forEach((q, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.84, y: 1.82 + idx * 0.94, w: 8.1, h: 0.58, rectRadius: 0.04,
      line: { color: C.line, width: 1 }, fill: { color: idx === 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(q, { x: 1.04, y: 1.99 + idx * 0.94, w: 7.7, h: 0.16, fontSize: 13, color: C.ink, margin: 0 });
  });
  footer(slide, PAGE_LABEL, 16, C);
}

function qaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Q&A / 结束", KICKER, C);
  slide.addText("接下来进入索引实现与答疑。", { x: 0.78, y: 1.46, w: 3.8, h: 0.2, fontSize: 14, color: C.steel, margin: 0 });
  const blocks = [
    [0.82, "现在先做", "先看 B+树 结构，再顺着索引代码补多列比较逻辑", C.panel],
    [3.48, "遇到问题先问", "比较规则是不是字典序？最左前缀为什么会失效？", "FFFFFF"],
    [6.14, "还做不出来再问", "把测试 SQL、断点停点和你改过的比较逻辑说清楚", C.blue],
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
  slide.addText("这半天至少要搞清两件事：为什么数据库索引是 B+树，以及多列索引为什么一定受字段顺序约束。", {
    x: 1.28, y: 4.44, w: 7.38, h: 0.14, fontSize: 11, color: C.steel, align: "center", margin: 0,
  });
  slide.addNotes("结束页口播：\n- 让学生先做题，不要把最后一页讲成散会页。\n- 提问时优先说测试 SQL、断点停点和比较逻辑。\n- 收束到两件事：B+树原因，多列索引顺序约束。");
  footer(slide, PAGE_LABEL, 17, C);
}

// ============================================================
// 执行生成
// ============================================================

async function main() {
  coverSlide();
  reviewSlide();
  needIndexSlide();
  dsCompareSlide();
  diskSlide();
  heightSlide();
  structureSlide();
  lookupSlide();
  splitSlide();
  codeStructureSlide();
  createFlowSlide();
  multiFieldSlide();
  lexicographicSlide();
  prefixSlide();
  practiceSlide();
  extensionSlide();
  qaSlide();

  await pptx.writeFile({ fileName: path.join(__dirname, "output", "day1_afternoon_generated.pptx") });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
