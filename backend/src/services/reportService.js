const PDFDocument = require('pdfkit');

/**
 * Streams a simple tabular PDF report directly to the HTTP response.
 * columns: [{ key, label, width }]
 * rows: array of plain objects
 */
const streamPdfTable = (res, { title, subtitle, columns, rows, filename }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(18).fillColor('#1e293b').text(title, { align: 'left' });
  if (subtitle) {
    doc.moveDown(0.2).fontSize(10).fillColor('#64748b').text(subtitle);
  }
  doc.moveDown(1);

  const startX = doc.x;
  let y = doc.y;
  const rowHeight = 22;
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

  const drawHeader = () => {
    doc.rect(startX, y, tableWidth, rowHeight).fill('#1e293b');
    let x = startX;
    doc.fillColor('#ffffff').fontSize(9);
    columns.forEach((col) => {
      doc.text(col.label, x + 6, y + 6, { width: col.width - 8, ellipsis: true });
      x += col.width;
    });
    y += rowHeight;
  };

  drawHeader();

  doc.fontSize(9);
  rows.forEach((row, idx) => {
    if (y + rowHeight > doc.page.height - 40) {
      doc.addPage();
      y = 40;
      drawHeader();
    }
    if (idx % 2 === 0) {
      doc.rect(startX, y, tableWidth, rowHeight).fill('#f1f5f9');
    }
    let x = startX;
    doc.fillColor('#1e293b');
    columns.forEach((col) => {
      const value = row[col.key] === undefined || row[col.key] === null ? '-' : String(row[col.key]);
      doc.text(value, x + 6, y + 6, { width: col.width - 8, ellipsis: true });
      x += col.width;
    });
    y += rowHeight;
  });

  doc.end();
};

/**
 * Converts an array of plain objects into a CSV string and writes it to res.
 */
const streamCsv = (res, { columns, rows, filename }) => {
  const escapeCell = (value) => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(','));
  const csv = [header, ...lines].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

module.exports = { streamPdfTable, streamCsv };
