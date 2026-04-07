#!/bin/bash
# 将 expr 目录下的 Markdown 文档转换为 Word 文档

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/docx"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 转换所有 md 文件
count=0
for md_file in "$SCRIPT_DIR"/*.md; do
    if [[ -f "$md_file" ]]; then
        filename=$(basename "$md_file" .md)
        output_file="$OUTPUT_DIR/${filename}.docx"

        echo "转换: $filename.md -> $filename.docx"

        # 使用 pandoc 转换
        # --reference-doc 可以使用自定义模板（如果存在）
        if [[ -f "$SCRIPT_DIR/reference.docx" ]]; then
            pandoc "$md_file" -o "$output_file" --reference-doc="$SCRIPT_DIR/reference.docx"
        else
            pandoc "$md_file" -o "$output_file"
        fi

        if [[ $? -eq 0 ]]; then
            ((count++))
        else
            echo "  警告: $filename.md 转换失败"
        fi
    fi
done

echo ""
echo "完成！共转换 $count 个文件"
echo "输出目录: $OUTPUT_DIR"