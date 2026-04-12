/**
 * PPT 生成器共享配置与组件
 */

const path = require("path");
const pptxgen = require(path.join(__dirname, ".pptxgen-deps", "node_modules", "pptxgenjs"));

const SHAPES = new pptxgen().ShapeType;
const FONT_FACE = "Noto Sans CJK SC";

// TJUT 红色系配色（天津理工大学主题色）- 默认配色
const TJUT_RED_PALETTE = {
  ink: "2C2C2C",
  tjutRed: "B83333",
  tjutRedDark: "8B2323",
  tjutRedLight: "F5E6E6",
  navy: "8B2323",
  steel: "5B6B7A",
  line: "D3DDE8",
  panel: "F7FAFC",
  soft: "EEF4F8",
  blue: "F8E8E4",
  blue2: "F4D8D4",
  accent: "B83333",
  good: "3D6B4B",
  warn: "E8D7C0",
  gold: "D4A84B",
  codeBg: "F3F6F9",
  tjutDark: "8B0000",
};

const DEFAULT_PALETTE = TJUT_RED_PALETTE;

const W = 10;
const H = 5.625;
const img = (name) => path.join(__dirname, "img", name);

function createPptx(meta) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = meta.author || "OpenAI Codex";
  pptx.company = meta.company || "MiniOB Teaching";
  pptx.subject = meta.subject;
  pptx.title = meta.title;
  pptx.lang = "zh-CN";
  pptx.theme = { headFontFace: FONT_FACE, bodyFontFace: FONT_FACE, lang: "zh-CN" };
  return pptx;
}

function baseSlide(slide, title, kicker, palette, headerColor) {
  palette = palette || DEFAULT_PALETTE;
  headerColor = headerColor || palette.navy;
  slide.background = { color: "FFFFFF" };
  slide.addShape(SHAPES.rect, { x: 0, y: 0, w: W, h: 0.55, line: { color: headerColor, transparency: 100 }, fill: { color: headerColor } });
  slide.addText(kicker, { x: 0.45, y: 0.13, w: 4.6, h: 0.2, fontFace: FONT_FACE, fontSize: 11, color: "FFFFFF", bold: true, margin: 0 });
  slide.addText(title, { x: 0.48, y: 0.76, w: 7.8, h: 0.44, fontFace: FONT_FACE, fontSize: 25, bold: true, color: palette.ink, margin: 0 });
  slide.addShape(SHAPES.rect, { x: 0.48, y: 1.22, w: 9.02, h: 0.02, line: { color: palette.line, transparency: 100 }, fill: { color: palette.line } });
}

function footer(slide, label, pageNo, palette) {
  palette = palette || DEFAULT_PALETTE;
  slide.addText(label + "  |  " + pageNo, { x: 8.2, y: 5.28, w: 1.25, h: 0.14, fontFace: FONT_FACE, fontSize: 8, color: palette.steel, align: "right", margin: 0 });
}

function bullets(slide, items, x, y, w, h, opts, palette) {
  palette = palette || DEFAULT_PALETTE;
  opts = opts || {};
  const runs = items.map(function(text, idx) { return { text: text, options: { bullet: true, breakLine: idx !== items.length - 1 } }; });
  slide.addText(runs, { x: x, y: y, w: w, h: h, fontFace: FONT_FACE, fontSize: opts.fontSize || 16, color: palette.ink, breakLine: true, paraSpaceAfterPt: opts.spaceAfter || 8, valign: "top", margin: opts.margin === undefined ? 0.05 : opts.margin });
}

function card(slide, x, y, w, h, title, body, fill, palette) {
  palette = palette || DEFAULT_PALETTE;
  fill = fill || "FFFFFF";
  slide.addShape(SHAPES.roundRect, { x: x, y: y, w: w, h: h, rectRadius: 0.06, line: { color: palette.line, width: 1 }, fill: { color: fill } });
  slide.addText(title, { x: x + 0.16, y: y + 0.11, w: w - 0.32, h: 0.18, fontFace: FONT_FACE, fontSize: 14, bold: true, color: palette.navy, margin: 0 });
  slide.addText(body, { x: x + 0.16, y: y + 0.36, w: w - 0.32, h: h - 0.46, fontFace: FONT_FACE, fontSize: 11, color: palette.ink, margin: 0, valign: "top" });
}

function stepBox(slide, x, y, w, h, title, body, fill, palette) {
  palette = palette || DEFAULT_PALETTE;
  fill = fill || "FFFFFF";
  slide.addShape(SHAPES.rect, { x: x, y: y, w: w, h: h, line: { color: palette.line, width: 1.1 }, fill: { color: fill } });
  slide.addText(title, { x: x + 0.14, y: y + 0.12, w: w - 0.28, h: 0.18, fontFace: FONT_FACE, fontSize: 13, bold: true, color: palette.navy, margin: 0 });
  slide.addText(body, { x: x + 0.14, y: y + 0.38, w: w - 0.28, h: h - 0.48, fontFace: FONT_FACE, fontSize: 10.5, color: palette.ink, margin: 0, valign: "top" });
}

function addImageFrame(slide, imagePath, x, y, w, h, palette) {
  palette = palette || DEFAULT_PALETTE;
  slide.addShape(SHAPES.roundRect, { x: x, y: y, w: w, h: h, rectRadius: 0.05, line: { color: palette.line, width: 1 }, fill: { color: "FFFFFF" } });
  slide.addImage({ path: imagePath, x: x + 0.06, y: y + 0.06, w: w - 0.12, h: h - 0.12 });
}

function flowArrow(slide, x, y, w) {
  slide.addText("→", { x: x, y: y, w: w, h: 0.2, fontFace: FONT_FACE, fontSize: 18, color: DEFAULT_PALETTE.accent, align: "center", margin: 0 });
}

function tableCell(slide, x, y, w, h, text, opts, palette) {
  palette = palette || DEFAULT_PALETTE;
  opts = opts || {};
  slide.addShape(SHAPES.rect, { x: x, y: y, w: w, h: h, line: { color: palette.line, width: opts.lineWidth || 0.9 }, fill: { color: opts.fill || "FFFFFF" } });
  slide.addText(text, { x: x + 0.08, y: y + 0.12, w: w - 0.16, h: h - 0.18, fontFace: opts.fontFace || FONT_FACE, fontSize: opts.fontSize || 11, bold: Boolean(opts.bold), color: opts.color || palette.ink, align: opts.align || "center", valign: "mid", margin: 0 });
}

function addTeachingCoverSlide(pptx, options) {
  const palette = options.palette || DEFAULT_PALETTE;
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addShape(SHAPES.rect, { x: 0, y: 0, w: W, h: 0.72, line: { color: palette.navy, transparency: 100 }, fill: { color: palette.navy } });
  slide.addText(options.brandTitle || "MiniOB 数据库内核实战", {
    x: 0.56, y: 0.19, w: 4.8, h: 0.28, fontFace: FONT_FACE, fontSize: 19, bold: true, color: "FFFFFF", margin: 0,
  });
  slide.addText(options.sessionLabel || "", {
    x: 8.1, y: 0.22, w: 1.3, h: 0.2, fontFace: FONT_FACE, fontSize: 10.5, color: "FFFFFF", align: "right", margin: 0,
  });

  slide.addShape(SHAPES.rect, { x: 0.72, y: 1.4, w: 0.08, h: 2.48, line: { color: palette.accent, transparency: 100 }, fill: { color: palette.accent } });
  slide.addText(options.leadTitle || "", {
    x: 1.05, y: 1.52, w: 4.3, h: 0.42, fontFace: FONT_FACE, fontSize: options.leadFontSize || 23, bold: true, color: palette.steel, margin: 0,
  });
  slide.addText(options.mainTitle || "", {
    x: 1.05, y: 2.0, w: 5.9, h: 0.54, fontFace: FONT_FACE, fontSize: options.mainFontSize || 28, bold: true, color: palette.navy, margin: 0,
  });
  slide.addText(options.summary || "", {
    x: 1.05, y: 2.72, w: 6.2, h: 0.38, fontFace: FONT_FACE, fontSize: 13.2, color: palette.steel, margin: 0,
  });
  slide.addShape(SHAPES.line, { x: 1.05, y: 3.18, w: 5.55, h: 0, line: { color: palette.line, width: 1.4 } });

  (options.chips || []).forEach(function(chip, idx) {
    slide.addShape(SHAPES.roundRect, {
      x: chip.x, y: chip.y || 3.5, w: chip.w, h: chip.h || 0.42, rectRadius: 0.06,
      line: { color: palette.accent, width: 1 },
      fill: { color: chip.fill || (idx === 1 ? palette.blue : "FFFFFF") },
    });
    slide.addText(chip.text, {
      x: chip.x, y: (chip.y || 3.5) + 0.12, w: chip.w, h: 0.14,
      fontFace: FONT_FACE, fontSize: chip.fontSize || 11.2, bold: true, color: palette.navy, align: "center", margin: 0,
    });
  });

  slide.addShape(SHAPES.roundRect, {
    x: 7.15, y: 1.45, w: 2.05, h: 2.65, rectRadius: 0.05,
    line: { color: palette.line, width: 1 }, fill: { color: palette.panel },
  });
  slide.addText("课堂节奏", { x: 7.42, y: 1.68, w: 1.3, h: 0.18, fontFace: FONT_FACE, fontSize: 15, bold: true, color: palette.navy, margin: 0 });
  (options.agenda || []).forEach(function(item, idx) {
    const y = 2.05 + idx * 0.37;
    slide.addText(String(idx + 1).padStart(2, "0"), {
      x: 7.42, y, w: 0.35, h: 0.14, fontFace: FONT_FACE, fontSize: 10.5, bold: true, color: palette.accent, margin: 0,
    });
    slide.addText(item, {
      x: 7.82, y: y - 0.02, w: 1.12, h: 0.16, fontFace: FONT_FACE, fontSize: 12.2, bold: true, color: palette.ink, margin: 0,
    });
  });

  if (options.bottomLeft) {
    slide.addText(options.bottomLeft, {
      x: 1.05, y: 4.78, w: 4.6, h: 0.18, fontFace: FONT_FACE, fontSize: 12.5, color: palette.steel, margin: 0,
    });
  }
  slide.addText(options.bottomRight || "天津理工大学", {
    x: 8.0, y: 4.8, w: 1.35, h: 0.16, fontFace: FONT_FACE, fontSize: 10.5, color: palette.steel, align: "right", margin: 0,
  });

  if (options.notes) {
    slide.addNotes(options.notes);
  }
  return slide;
}

module.exports = {
  TJUT_RED_PALETTE: TJUT_RED_PALETTE,
  FONT_FACE: FONT_FACE,
  W: W,
  H: H,
  img: img,
  createPptx: createPptx,
  baseSlide: baseSlide,
  footer: footer,
  bullets: bullets,
  card: card,
  stepBox: stepBox,
  addImageFrame: addImageFrame,
  flowArrow: flowArrow,
  tableCell: tableCell,
  addTeachingCoverSlide: addTeachingCoverSlide,
};
