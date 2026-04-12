const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  const shouldQuote = /[",\n\r]/.test(stringValue);

  if (!shouldQuote) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const buildCsv = ({ columns, rows, includeBom = true }) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('CSV columns are required');
  }

  const normalizedRows = Array.isArray(rows) ? rows : [];

  const headerLine = columns
    .map((column) => escapeCsvValue(column.header || column.key))
    .join(',');

  const dataLines = normalizedRows.map((row) => (
    columns
      .map((column) => escapeCsvValue(row?.[column.key]))
      .join(',')
  ));

  const csvBody = [headerLine, ...dataLines].join('\r\n');
  return includeBom ? `\uFEFF${csvBody}` : csvBody;
};

module.exports = {
  buildCsv
};
