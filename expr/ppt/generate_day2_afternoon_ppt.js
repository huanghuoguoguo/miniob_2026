/**
 * Buffer Pool 缓冲池 PPT 生成器
 * Buffer Pool 缓冲池
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
const KICKER = "Buffer Pool 缓冲池";
const PAGE_LABEL = "天津理工大学";
const pptx = createPptx({
  subject: "MiniOB Buffer Pool",
  title: "Buffer Pool 缓冲池",
});

// ============================================================
// 幻灯片生成函数
// ============================================================

function coverSlide() {
  addCoverSlide(pptx, {
    palette: C,
    headingTexts: [
      { text: "MiniOB 数据库内核实战", x: 0.72, y: 1.72, w: 8.2, h: 0.52, fontSize: 28, bold: true, color: C.ink },
      { text: "Buffer Pool 缓冲池", x: 0.72, y: 2.55, w: 8.2, h: 0.42, fontSize: 22, bold: true, color: C.navy },
    ],
    images: [],
  });
}

function reviewSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "前序回顾与本讲主线", KICKER, C, C.tjutDark);
  stepBox(slide, 1.05, 1.8, 7.0, 1.15, "前面我们学了什么", "记录按页存储\nRID 定位记录\nTEXT / UPDATE 都会落到页面操作", C.panel, C);
  stepBox(slide, 1.05, 3.18, 7.0, 1.15, "本讲问题", "页面到底是谁缓存的？\n什么时候读盘？\n什么时候刷盘？", C.blue, C);
  footer(slide, "天津理工大学", 2, C);
}

function pageCacheSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Page Cache 是什么？", KICKER, C, C.tjutDark);
  stepBox(slide, 1.45, 1.95, 2.25, 0.9, "用户程序", "read() / write()", "FFFFFF", C);
  stepBox(slide, 1.45, 3.02, 2.25, 1.05, "Page Cache", "OS 管理的通用页缓存\n命中直接走内存", C.blue, C);
  stepBox(slide, 1.45, 4.25, 2.25, 0.9, "磁盘", "真正的持久存储介质", "FFFFFF", C);
  slide.addText("↕", { x: 2.35, y: 2.76, w: 0.35, h: 0.16, fontSize: 20, color: C.accent, align: "center", margin: 0 });
  slide.addText("↕", { x: 2.35, y: 3.98, w: 0.35, h: 0.16, fontSize: 20, color: C.accent, align: "center", margin: 0 });
  bullets(slide, [
    "用户程序的 read/write 并不总是直接碰磁盘",
    "先查 Page Cache，命中则直接从内存返回",
    "未命中时，操作系统再把对应页读进缓存",
  ], 4.55, 2.05, 3.7, 1.5, { fontSize: 14 }, C);
  footer(slide, "天津理工大学", 3, C);
}

function compareSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "既然有 Page Cache，为什么还要 Buffer Pool？", KICKER, C, C.tjutDark);
  const headers = ["维度", "Page Cache", "Buffer Pool"];
  const widths = [1.5, 3.15, 3.15];
  let x = 0.85;
  headers.forEach((h, i) => {
    tableCell(slide, x, 1.88, widths[i], 0.42, h, { fill: C.soft, bold: true, color: C.tjutRed }, C);
    x += widths[i];
  });
  const rows = [
    ["控制权", "OS 通用控制", "数据库自己控制"],
    ["淘汰策略", "通用策略", "可感知页角色与访问模式"],
    ["刷盘顺序", "不理解事务语义", "可配合 WAL 控制"],
    ["预读/优先级", "通用预读", "可针对查询模式优化"],
  ];
  rows.forEach((r, ridx) => {
    let cx = 0.85;
    r.forEach((cell, cidx) => {
      tableCell(slide, cx, 2.3 + ridx * 0.48, widths[cidx], 0.48, cell, {
        fill: cidx === 2 ? (ridx % 2 === 0 ? C.blue : C.panel) : "FFFFFF",
        bold: cidx === 2,
        align: cidx === 0 ? "center" : "left",
      }, C);
      cx += widths[cidx];
    });
  });
  card(slide, 0.85, 4.56, 8.0, 0.44, "结论", "简单 ≠ 可控。Page Cache 有用，但数据库真正需要的是自己可控的缓存。", C.soft, C);
  footer(slide, "天津理工大学", 4, C);
}

function walSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "WAL、刷盘控制与双重缓存", KICKER, C, C.tjutDark);
  stepBox(slide, 0.82, 1.95, 2.45, 2.1, "日志路径", "1. 先写日志\n2. 事务提交时先保证日志落盘\n3. 崩溃后可以按日志恢复", C.panel, C);
  stepBox(slide, 3.82, 1.95, 2.45, 2.1, "数据页路径", "修改页先留在 Buffer Pool\n标记 dirty\n稍后再择机刷盘", C.blue, C);
  stepBox(slide, 6.82, 1.95, 2.0, 2.1, "实际情况", "教学项目 MiniOB\n实际仍可能与\nPage Cache 共存", "FFFFFF", C);
  slide.addText("先日志，后页面", {
    x: 3.2, y: 4.35, w: 3.6, h: 0.18, fontSize: 15, bold: true, color: C.tjutRed, align: "center", margin: 0,
  });
  footer(slide, "天津理工大学", 5, C);
}

function conceptsSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Page、Frame、PageNum 分别是什么？", KICKER, C, C.tjutDark);
  card(slide, 0.78, 1.9, 2.35, 1.55, "Page", "磁盘与缓存管理的基本数据单位。真正被读进来、改出去的，始终是“页”。", C.panel, C);
  card(slide, 3.33, 1.9, 2.35, 1.55, "Frame", "内存中包住一个 Page 的管理壳。除了页面数据，还带 dirty、pin_count、访问时间等状态。", C.blue, C);
  card(slide, 5.88, 1.9, 2.35, 1.55, "PageNum", "页面在文件中的编号。PageNum × PageSize 才能映射到磁盘偏移。", "FFFFFF", C);
  flowArrow(slide, 3.02, 2.56, 0.18, C);
  flowArrow(slide, 5.57, 2.56, 0.18, C);
  footer(slide, "天津理工大学", 6, C);
}

function frameSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Frame 里最重要的三个字段", KICKER, C, C.tjutDark);
  const items = [
    ["dirty", "改过但还没刷盘。淘汰前如果它为 true，就必须先写回。", C.panel],
    ["pin_count", "被使用中的页不能淘汰。pin_count > 0 的意义是“先别动我”。", C.blue],
    ["acc_time / LRU", "记录最近访问，用于决定谁更像淘汰候选。它服务于效率，不负责正确性。", "FFFFFF"],
  ];
  items.forEach((it, i) => {
    card(slide, 0.82 + i * 2.72, 1.95, 2.38, 2.45, it[0], it[1], it[2], C);
  });
  footer(slide, "天津理工大学", 7, C);
}

function structureSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Buffer Pool 的整体结构", KICKER, C, C.tjutDark);
  addImageFrame(slide, img("day2_pm_p08_buffer_pool_structure.png"), 0.72, 1.68, 5.2, 3.1, C);
  bullets(slide, [
    "上半部分是 Frame 数组：真正缓存页数据的地方",
    "还需要页号到 Frame 的定位关系，否则找页就会退化成遍历",
    "还需要 LRU 或类似结构，否则无法决定淘汰候选",
  ], 6.2, 1.9, 2.9, 1.7, { fontSize: 13.5 }, C);
  card(slide, 6.2, 3.95, 2.9, 0.82, "一句话结论", "Buffer Pool 不是“几块缓存”，而是缓存数据、状态管理、定位结构和淘汰机制的组合。", C.blue, C);
  footer(slide, "天津理工大学", 8, C);
}

function readPageSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "读一个页面时会发生什么？", KICKER, C, C.tjutDark);
  stepBox(slide, 0.7, 1.92, 1.5, 0.82, "请求 Page N", "有读页需求", "FFFFFF", C);
  stepBox(slide, 2.5, 1.92, 1.7, 0.82, "查缓存", "先看是否命中", C.panel, C);
  stepBox(slide, 4.6, 1.55, 1.8, 1.18, "命中", "pin++\n更新最近访问\n直接返回", C.blue, C);
  stepBox(slide, 4.6, 3.0, 1.8, 1.32, "未命中", "分配 Frame\n从磁盘读页\n加入缓存\npin 并返回", "FFFFFF", C);
  flowArrow(slide, 2.22, 2.23, 0.18, C);
  flowArrow(slide, 4.2, 1.96, 0.18, C);
  flowArrow(slide, 4.2, 3.44, 0.18, C);
  slide.addText("命中路径", { x: 4.95, y: 1.33, w: 1.1, h: 0.14, fontSize: 11.5, bold: true, color: C.tjutRed, align: "center", margin: 0 });
  slide.addText("未命中路径", { x: 4.9, y: 2.76, w: 1.2, h: 0.14, fontSize: 11.5, bold: true, color: C.steel, align: "center", margin: 0 });
  footer(slide, "天津理工大学", 9, C);
}

function writePageSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "改一个页面时会发生什么？", KICKER, C, C.tjutDark);
  const steps = [
    "1. 修改 Frame 中的数据",
    "2. 标记 dirty = true",
    "3. unpin()，表示当前线程用完了",
    "4. 后续再由 flush 或淘汰时机写回磁盘",
  ];
  steps.forEach((s, idx) => {
    const y = 1.84 + idx * 0.64;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.18, y, w: 5.9, h: 0.4, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: idx === 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(s, { x: 1.34, y: y + 0.12, w: 5.55, h: 0.14, fontSize: 11.7, color: C.ink, margin: 0 });
    if (idx < steps.length - 1) slide.addText("↓", { x: 3.98, y: y + 0.39, w: 0.16, h: 0.15, fontSize: 15, color: C.accent, align: "center", margin: 0 });
  });
  card(slide, 7.35, 2.02, 1.55, 1.95, "核心直觉", "修改页不等于立刻刷盘。\n延迟写提升性能，\n但同时带来持久性和恢复要求。", C.panel, C);
  footer(slide, "天津理工大学", 10, C);
}

function evictSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Buffer Pool 满了怎么办？", KICKER, C, C.tjutDark);
  stepBox(slide, 0.82, 1.98, 2.0, 1.9, "起点", "需要新 Frame\n但 Buffer Pool 已满", "FFFFFF", C);
  stepBox(slide, 3.22, 1.98, 2.05, 1.9, "找候选", "从 LRU 尾部找\npin_count == 0 的页", C.panel, C);
  stepBox(slide, 5.68, 1.55, 1.45, 1.2, "可淘汰且 dirty", "先刷盘\n再复用", C.blue, C);
  stepBox(slide, 5.68, 2.96, 1.45, 1.2, "可淘汰且不脏", "直接复用", "FFFFFF", C);
  stepBox(slide, 7.45, 2.2, 1.4, 1.2, "找不到", "所有页都在使用\n只能报错或等待", C.warn, C);
  flowArrow(slide, 2.88, 2.28, 0.18, C);
  flowArrow(slide, 5.34, 1.98, 0.18, C);
  flowArrow(slide, 5.34, 3.32, 0.18, C);
  slide.addText("pin_count 的价值就在这里", {
    x: 2.3, y: 4.42, w: 4.6, h: 0.18, fontSize: 14, bold: true, color: C.tjutRed, align: "center", margin: 0,
  });
  footer(slide, "天津理工大学", 11, C);
}

function lruSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "为什么是 LRU？", KICKER, C, C.tjutDark);
  const xs = [1.05, 2.15, 3.25, 4.35];
  ["A", "B", "C", "D"].forEach((t, i) => {
    tableCell(slide, xs[i], 2.2, 0.82, 0.44, t, { fill: i === 3 ? C.blue : "FFFFFF", bold: true }, C);
    if (i < 3) flowArrow(slide, xs[i] + 0.82, 2.29, 0.18, C);
  });
  slide.addText("最近使用", { x: 0.92, y: 1.92, w: 1.0, h: 0.14, fontSize: 11.5, color: C.tjutRed, margin: 0 });
  slide.addText("最久未使用", { x: 4.95, y: 1.92, w: 1.15, h: 0.14, fontSize: 11.5, color: C.steel, margin: 0 });
  bullets(slide, [
    "LRU 基于局部性原理：最近用过的页，更可能很快再被访问",
    "实现简单：双向链表或近似结构就能维护候选顺序",
    "但顺序扫描会污染缓存，所以 LRU 可用，不代表完美",
  ], 1.02, 3.15, 5.4, 1.4, { fontSize: 13.5 }, C);
  footer(slide, "天津理工大学", 12, C);
}

function codeMapSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "MiniOB 中的 Buffer Pool 代码地图", KICKER, C, C.tjutDark);
  const cols = [
    ["BufferPoolManager", "全局管理多个缓冲池", C.panel],
    ["DiskBufferPool", "单文件维度的页缓存管理", C.blue],
    ["Frame", "页帧状态：dirty / pin_count / acc_time", "FFFFFF"],
    ["FrameLruCache", "维护淘汰候选顺序", C.panel],
  ];
  cols.forEach((c, i) => {
    card(slide, 0.66 + i * 2.25, 1.96, 1.95, 2.2, c[0], c[1], c[2], C);
  });
  footer(slide, "天津理工大学", 13, C);
}

function funcsSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "关键函数与调用链", KICKER, C, C.tjutDark);
  const rows = [
    ["get_this_page()", "读页入口：命中返回，未命中加载"],
    ["allocate_page()", "分配新页面，通常伴随新 Frame 管理"],
    ["flush_page()", "把指定页写回磁盘"],
    ["pin() / unpin()", "状态管理，不直接等于磁盘 I/O"],
  ];
  rows.forEach((r, idx) => {
    const y = 1.84 + idx * 0.7;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.96, y, w: 8.0, h: 0.46, rectRadius: 0.03,
      line: { color: C.line, width: 1 }, fill: { color: idx === 3 ? C.blue : "FFFFFF" },
    });
    slide.addText(r[0], { x: 1.18, y: y + 0.15, w: 1.9, h: 0.14, fontFace: "Consolas", fontSize: 11.5, color: C.tjutRed, margin: 0 });
    slide.addText(r[1], { x: 3.1, y: y + 0.15, w: 5.45, h: 0.14, fontSize: 11.4, color: C.ink, margin: 0 });
  });
  footer(slide, "天津理工大学", 14, C);
}

function doubleWriteSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Double Write Buffer 为什么存在？", KICKER, C, C.tjutDark);
  const items = [
    ["Step 1", "先写副本", "把页的安全副本写到 Double Write 区域"],
    ["Step 2", "再写正式页", "真正把目标页写回原始位置"],
    ["Step 3", "恢复时检查", "如果原页半写损坏，可以用副本修复"],
  ];
  items.forEach((it, idx) => {
    card(slide, 0.82 + idx * 2.72, 2.0, 2.32, 1.95, `${it[0]} · ${it[1]}`, it[2], idx === 1 ? C.blue : "FFFFFF", C);
  });
  footer(slide, "天津理工大学", 15, C);
}

function debugSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "现场调试看什么？", KICKER, C, C.tjutDark);
  const rows = [
    ["缓存命中", "`get_this_page()`", "看是否直接返回已有 Frame"],
    ["脏页刷盘", "`flush_page()`", "看 dirty 如何从 true 回到 false"],
    ["页面淘汰", "`pin()/unpin()`", "看什么时候能成为淘汰候选"],
  ];
  rows.forEach((r, idx) => {
    const y = 1.92 + idx * 0.88;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9, y, w: 8.0, h: 0.62, rectRadius: 0.04,
      line: { color: C.line, width: 1 }, fill: { color: idx === 1 ? C.blue : "FFFFFF" },
    });
    slide.addText(r[0], { x: 1.1, y: y + 0.18, w: 1.2, h: 0.14, fontSize: 12.5, bold: true, color: C.tjutRed, margin: 0 });
    slide.addText(r[1], { x: 3.0, y: y + 0.18, w: 1.75, h: 0.14, fontFace: "Consolas", fontSize: 10.8, color: C.ink, margin: 0 });
    slide.addText(r[2], { x: 5.05, y: y + 0.18, w: 3.4, h: 0.14, fontSize: 11.2, color: C.steel, margin: 0 });
  });
  footer(slide, "天津理工大学", 16, C);
}

function practiceSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "实践任务与总结", KICKER, C, C.tjutDark);
  stepBox(slide, 0.78, 1.82, 4.0, 2.45, "实践任务", "□ 跟一次 `get_this_page()` 的命中与未命中\n□ 跟一次脏页变 `dirty`\n□ 跟一次 `pin/unpin` 与淘汰判断", C.panel, C);
  stepBox(slide, 5.06, 1.82, 3.78, 2.45, "今日要点", "• Buffer Pool 管页面缓存\n• dirty / pin_count 决定页的生命周期\n• LRU 负责候选顺序，不负责正确性", C.blue, C);
  footer(slide, "天津理工大学", 17, C);
}

function qaSlide() {
  const slide = pptx.addSlide();
  baseSlide(slide, "Q&A / 机动答疑", KICKER, C, C.tjutDark);
  slide.addText("问题时间", { x: 0.9, y: 1.95, w: 2.0, h: 0.3, fontSize: 24, bold: true, color: C.ink, margin: 0 });
  slide.addText("机动答疑", { x: 0.9, y: 2.68, w: 2.0, h: 0.3, fontSize: 24, bold: true, color: C.navy, margin: 0 });
  slide.addText("预告：下一步继续向事务、恢复和更复杂执行机制推进", { x: 0.9, y: 3.5, w: 6.4, h: 0.2, fontSize: 15, color: C.steel, margin: 0 });
  footer(slide, PAGE_LABEL, 18, C);
}

// ============================================================
// 执行生成
// ============================================================

async function main() {
  coverSlide();
  reviewSlide();
  pageCacheSlide();
  compareSlide();
  walSlide();
  conceptsSlide();
  frameSlide();
  structureSlide();
  readPageSlide();
  writePageSlide();
  evictSlide();
  lruSlide();
  codeMapSlide();
  funcsSlide();
  doubleWriteSlide();
  debugSlide();
  practiceSlide();
  qaSlide();

  await pptx.writeFile({ fileName: path.join(__dirname, "output", "day2_afternoon_generated.pptx") });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
