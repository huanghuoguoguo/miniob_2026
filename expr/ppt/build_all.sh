#!/usr/bin/env bash
#
# Build all PPT decks from JS generators.
# Usage: bash expr/ppt/build_all.sh   (from project root)
#
set -euo pipefail

# Resolve the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

# ── dependency checks ────────────────────────────────────────────────
for cmd in node soffice pdftoppm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is not installed or not in PATH." >&2
    echo "       node: apt install nodejs npm" >&2
    echo "       soffice: apt install libreoffice" >&2
    echo "       pdftoppm: apt install poppler-utils" >&2
    exit 1
  fi
done

# ── ensure output directory exists ───────────────────────────────────
mkdir -p "$OUTPUT_DIR"

# ── discover generator scripts ──────────────────────────────────────
mapfile -t GENERATORS < <(find "$SCRIPT_DIR" -maxdepth 1 -name 'generate_*_ppt.js' | sort)

if [[ ${#GENERATORS[@]} -eq 0 ]]; then
  echo "ERROR: no generate_*_ppt.js scripts found in $SCRIPT_DIR" >&2
  exit 1
fi

echo "=== Found ${#GENERATORS[@]} generator(s) ==="

# ── run each generator ───────────────────────────────────────────────
echo "=== Generating PPTX files ==="

for gen in "${GENERATORS[@]}"; do
  name="$(basename "$gen")"
  echo "--- Running $name ..."
  node "$gen"
done

# ── collect generated PPTX files and convert to PDF ─────────────────
mapfile -t PPTX_FILES < <(find "$OUTPUT_DIR" -maxdepth 1 -name '*_generated.pptx' | sort)

if [[ ${#PPTX_FILES[@]} -eq 0 ]]; then
  echo "WARNING: no *_generated.pptx files found in $OUTPUT_DIR" >&2
  exit 0
fi

echo "=== Converting ${#PPTX_FILES[@]} PPTX file(s) to PDF ==="

for pptx in "${PPTX_FILES[@]}"; do
  name="$(basename "$pptx")"
  echo "--- Converting $name ..."
  soffice --headless --convert-to pdf --outdir "$OUTPUT_DIR" "$pptx"
done

# ── convert PDFs to slide images ─────────────────────────────────────
echo "=== Converting PDFs to slide images ==="

for pptx in "${PPTX_FILES[@]}"; do
  base="$(basename "$pptx" '_generated.pptx')"
  pdf="$OUTPUT_DIR/${base}_generated.pdf"
  slides_dir="$OUTPUT_DIR/$base"

  if [[ ! -f "$pdf" ]]; then
    echo "WARNING: PDF not found for $base" >&2
    continue
  fi

  echo "--- Creating slides for $base ..."
  mkdir -p "$slides_dir"
  pdftoppm -jpeg -r 150 "$pdf" "$slides_dir/slide"

  slide_count=$(find "$slides_dir" -name 'slide-*.jpg' | wc -l)
  echo "    Generated $slide_count slides"
done

# ── summary ──────────────────────────────────────────────────────────
echo ""
echo "=== All done. Output in $OUTPUT_DIR ==="
echo ""
echo "Structure:"
for pptx in "${PPTX_FILES[@]}"; do
  base="$(basename "$pptx" '_generated.pptx')"
  slides_dir="$OUTPUT_DIR/$base"
  if [[ -d "$slides_dir" ]]; then
    slide_count=$(find "$slides_dir" -name 'slide-*.jpg' | wc -l)
    echo "  $base/ ($slide_count slides)"
  fi
done