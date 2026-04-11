-- Pandoc Lua filter: wrap code blocks in a shaded single-cell table
-- This gives a cohesive background + border for the entire block,
-- instead of pandoc's default per-line paragraph styling.

local CELL_BG    = "F0F0F0"   -- light gray background
local BORDER_CLR = "D4D4D4"   -- border color
local BORDER_SZ  = 4          -- border thickness (eighths of a point)
local FONT_NAME  = "Consolas"
local FONT_SIZE  = 19         -- half-points (9.5pt)
local TEXT_COLOR  = "2D3748"

function CodeBlock(elem)
  -- Build the raw OOXML for a single-cell table with shading

  local code = elem.text
  -- Escape XML special characters
  code = code:gsub("&", "&amp;")
  code = code:gsub("<", "&lt;")
  code = code:gsub(">", "&gt;")
  code = code:gsub('"', "&quot;")

  -- Split into lines and build paragraph XML for each line
  local lines = {}
  for line in (code .. "\n"):gmatch("(.-)\n") do
    table.insert(lines, line)
  end
  -- Remove trailing empty line if present
  if #lines > 0 and lines[#lines] == "" then
    table.remove(lines)
  end

  local para_xml = ""
  for _, line in ipairs(lines) do
    -- Use a zero-spacing paragraph for each line inside the cell
    para_xml = para_xml .. string.format([[
      <w:p>
        <w:pPr>
          <w:spacing w:before="0" w:after="0" w:line="260" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="%s" w:hAnsi="%s" w:eastAsia="Microsoft YaHei"/>
            <w:sz w:val="%d"/>
            <w:szCs w:val="%d"/>
            <w:color w:val="%s"/>
          </w:rPr>
          <w:t xml:space="preserve">%s</w:t>
        </w:r>
      </w:p>
    ]], FONT_NAME, FONT_NAME, FONT_SIZE, FONT_SIZE, TEXT_COLOR, line)
  end

  local border_attr = string.format(
    'w:val="single" w:sz="%d" w:space="0" w:color="%s"',
    BORDER_SZ, BORDER_CLR
  )

  -- Build the complete table XML
  local table_xml = string.format([[
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top %s/>
          <w:left %s/>
          <w:bottom %s/>
          <w:right %s/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="80" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="80" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
        <w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:shd w:val="clear" w:color="auto" w:fill="%s"/>
          </w:tcPr>
          %s
        </w:tc>
      </w:tr>
    </w:tbl>
  ]], border_attr, border_attr, border_attr, border_attr, CELL_BG, para_xml)

  return pandoc.RawBlock("openxml", table_xml)
end
