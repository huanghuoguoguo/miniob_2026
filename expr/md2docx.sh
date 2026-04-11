#!/bin/sh
# 将 expr 目录下的 Markdown 文档转换为 Word 文档

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/docx"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 转换指定的 md 文件（排除 ppt_script_ 开头的和 image_mapping.md）
count=0
for md_file in "$SCRIPT_DIR"/*.md; do
    if [ -f "$md_file" ]; then
        filename=$(basename "$md_file" .md)

        # 跳过包含 _ppt_script_ 的文件和 image_mapping.md
        case "$filename" in
            *_ppt_script_*|image_mapping) continue ;;
        esac

        output_file="$OUTPUT_DIR/${filename}.docx"

        echo "转换: $filename.md -> $filename.docx"

        # 使用 pandoc 转换
        PANDOC_CMD="pandoc \"$md_file\" -o \"$output_file\" --no-highlight"
        if [ -f "$SCRIPT_DIR/reference.docx" ]; then
            PANDOC_CMD="$PANDOC_CMD --reference-doc=\"$SCRIPT_DIR/reference.docx\""
        fi
        if [ -f "$SCRIPT_DIR/codeblock.lua" ]; then
            PANDOC_CMD="$PANDOC_CMD --lua-filter=\"$SCRIPT_DIR/codeblock.lua\""
        fi
        eval $PANDOC_CMD

        if [ $? -eq 0 ]; then
            count=$((count + 1))
        else
            echo "  警告: $filename.md 转换失败"
        fi
    fi
done

echo ""
echo "完成！共转换 $count 个文件"
echo "输出目录: $OUTPUT_DIR"