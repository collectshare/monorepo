function escapeCsvCell(raw: string): string {
  // Spreadsheet apps run cells starting with these as formulas (CSV injection);
  // a leading ' makes them plain text. Plain numbers ("-5", "+3,5") stay numeric.
  const isNumber = /^[+-]?\d+([.,]\d+)*$/.test(raw);
  const value = !isNumber && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map(row => row.map(escapeCsvCell).join(','));

  return lines.join('\r\n');
}
