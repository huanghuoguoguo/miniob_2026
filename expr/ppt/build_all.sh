#!/usr/bin/env bash
#
# Build PPT decks from JS generators.
# Usage:
#   bash expr/ppt/build_all.sh              # build all decks
#   bash expr/ppt/build_all.sh day1_morning # build one deck
#   bash expr/ppt/build_all.sh --list       # list available decks
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
mapfile -t ALL_GENERATORS < <(find "$SCRIPT_DIR" -maxdepth 1 -name 'generate_*_ppt.js' | sort)

if [[ ${#ALL_GENERATORS[@]} -eq 0 ]]; then
  echo "ERROR: no generate_*_ppt.js scripts found in $SCRIPT_DIR" >&2
  exit 1
fi

if [[ "${1:-}" == "--list" ]]; then
  echo "Available decks:"
  for gen in "${ALL_GENERATORS[@]}"; do
    base="$(basename "$gen" '.js')"
    deck="${base#generate_}"
    deck="${deck%_ppt}"
    echo "  $deck"
  done
  exit 0
fi

GENERATORS=()
if [[ $# -eq 0 ]]; then
  GENERATORS=("${ALL_GENERATORS[@]}")
else
  for gen in "${ALL_GENERATORS[@]}"; do
    base="$(basename "$gen" '.js')"
    deck="${base#generate_}"
    deck="${deck%_ppt}"
    for selector in "$@"; do
      if [[ "$deck" == "$selector" || "$deck" == *"$selector"* || "$base" == *"$selector"* ]]; then
        GENERATORS+=("$gen")
        break
      fi
    done
  done
fi

if [[ ${#GENERATORS[@]} -eq 0 ]]; then
  echo "ERROR: no generators matched selectors: $*" >&2
  exit 1
fi

echo "=== Selected ${#GENERATORS[@]} generator(s) ==="

# ── run each generator ───────────────────────────────────────────────
echo "=== Generating PPTX files ==="
PPTX_FILES=()

for gen in "${GENERATORS[@]}"; do
  name="$(basename "$gen")"
  echo "--- Running $name ..."
  node "$gen"
  deck="${name#generate_}"
  deck="${deck%_ppt.js}"
  PPTX_FILES+=("$OUTPUT_DIR/${deck}_generated.pptx")
done

if [[ ${#PPTX_FILES[@]} -eq 0 ]]; then
  echo "WARNING: no *_generated.pptx files found in $OUTPUT_DIR" >&2
  exit 0
fi

echo "=== Converting ${#PPTX_FILES[@]} PPTX file(s) to PDF ==="

for pptx in "${PPTX_FILES[@]}"; do
  if [[ ! -f "$pptx" ]]; then
    echo "WARNING: generated PPTX not found: $pptx" >&2
    continue
  fi
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
