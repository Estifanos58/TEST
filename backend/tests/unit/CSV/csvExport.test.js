const { buildCsv } = require('../../../utils/csv');

describe('csvExport (unit)', () => {
  test('correct headers and row count', () => {
    const cols = [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' }
    ];

    const rows = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    const csv = buildCsv({ columns: cols, rows, includeBom: false });
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('A,B');
    expect(lines.length).toBe(1 + rows.length);
  });

  test('field mapping and null handling', () => {
    const cols = [
      { key: 'id', header: 'id' },
      { key: 'name', header: 'name' },
      { key: 'amount', header: 'amount' }
    ];

    const rows = [
      { id: 'e1', name: 'One', amount: 100 },
      { id: 'e2', name: null, amount: null }
    ];

    const csv = buildCsv({ columns: cols, rows, includeBom: false });
    const lines = csv.split('\r\n');
    // header + 2 rows
    expect(lines[0]).toBe('id,name,amount');
    expect(lines[1]).toContain('e1');
    // nulls become empty fields
    const second = lines[2].split(',');
    expect(second[1]).toBe('');
    expect(second[2]).toBe('');
  });

  test('empty dataset returns only header', () => {
    const cols = [{ key: 'x', header: 'X' }];
    const csv = buildCsv({ columns: cols, rows: [], includeBom: false });
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('X');
  });
});
