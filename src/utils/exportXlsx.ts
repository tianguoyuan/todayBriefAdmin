const CRC_TABLE = Array.from({ length: 256 })
  .fill(0)
  .map((_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })

function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function buildZip(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const data = entry.data
    const crc = crc32(data)
    const size = data.length

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034B50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true)
    local.setUint16(8, 0, true)
    local.setUint16(10, 0, true)
    local.setUint16(12, 0x21, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, size, true)
    local.setUint32(22, size, true)
    local.setUint16(26, name.length, true)
    local.setUint16(28, 0, true)
    chunks.push(new Uint8Array(local.buffer), name, data)

    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014B50, true)
    cd.setUint16(4, 20, true)
    cd.setUint16(6, 20, true)
    cd.setUint16(8, 0x0800, true)
    cd.setUint16(10, 0, true)
    cd.setUint16(12, 0, true)
    cd.setUint16(14, 0x21, true)
    cd.setUint32(16, crc, true)
    cd.setUint32(20, size, true)
    cd.setUint32(24, size, true)
    cd.setUint16(28, name.length, true)
    cd.setUint16(30, 0, true)
    cd.setUint16(32, 0, true)
    cd.setUint16(34, 0, true)
    cd.setUint16(36, 0, true)
    cd.setUint32(38, 0, true)
    cd.setUint32(42, offset, true)
    central.push(new Uint8Array(cd.buffer), name)

    offset += 30 + name.length + size
  }

  const centralStart = offset
  const centralBytes = concatBytes(central)
  const centralSize = centralBytes.length
  offset += centralSize

  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054B50, true)
  eocd.setUint16(4, 0, true)
  eocd.setUint16(6, 0, true)
  eocd.setUint16(8, entries.length, true)
  eocd.setUint16(10, entries.length, true)
  eocd.setUint32(12, centralSize, true)
  eocd.setUint32(16, centralStart, true)
  eocd.setUint16(20, 0, true)

  chunks.push(centralBytes, new Uint8Array(eocd.buffer))
  return concatBytes(chunks)
}

function xmlEscape(value: string | number): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function columnName(index: number): string {
  let name = ''
  let current = index
  while (current >= 0) {
    name = String.fromCharCode((current % 26) + 65) + name
    current = Math.floor(current / 26) - 1
  }
  return name
}

function buildSheetXml(filename: string, headers: string[], rows: Array<Array<string | number>>): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
  lines.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
  lines.push('<sheetViews><sheetView workbookViewId="0"/></sheetViews>')
  lines.push('<sheetFormatPr defaultRowHeight="15"/>')
  lines.push('<cols>')
  headers.forEach((_, index) => {
    lines.push(`<col min="${index + 1}" max="${index + 1}" width="22" customWidth="1"/>`)
  })
  lines.push('</cols>')
  lines.push('<sheetData>')

  const pushRow = (rowIndex: number, cells: Array<string | number>) => {
    const refs = cells
      .map((cell, index) => {
        const ref = `${columnName(index)}${rowIndex + 1}`
        if (typeof cell === 'number') {
          return `<c r="${ref}" s="1"><v>${cell}</v></c>`
        }
        return `<c r="${ref}" s="1" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`
      })
      .join('')
    lines.push(`<row r="${rowIndex + 1}">${refs}</row>`)
  }

  pushRow(0, headers)
  rows.forEach((row, index) => pushRow(index + 1, row))
  lines.push('</sheetData>')
  lines.push('</worksheet>')
  return lines.join('')
}

export function exportXlsx(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  sheetName = '数据',
) {
  const encoder = new TextEncoder()
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

  const sheet = buildSheetXml(filename, headers, rows)
  const zip = buildZip([
    { data: encoder.encode(contentTypes), name: '[Content_Types].xml' },
    { data: encoder.encode(rootRels), name: '_rels/.rels' },
    { data: encoder.encode(workbook), name: 'xl/workbook.xml' },
    { data: encoder.encode(workbookRels), name: 'xl/_rels/workbook.xml.rels' },
    { data: encoder.encode(styles), name: 'xl/styles.xml' },
    { data: encoder.encode(sheet), name: 'xl/worksheets/sheet1.xml' },
  ])

  const blob = new Blob([zip.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
