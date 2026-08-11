import * as XLSX from 'xlsx';

export type ColumnType = 'text' | 'currency' | 'percent' | 'number';

export interface ExportColumn {
  header: string;
  key: string;
  type?: ColumnType;
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

const FMT: Record<ColumnType, string | undefined> = {
  text: undefined,
  currency: 'R$ #,##0.00',
  percent: '0.0%',
  number: '#,##0.00',
};

const sanitizeSheetName = (name: string) =>
  (name || 'Dados').replace(/[\\/?*[\]:]/g, '-').slice(0, 31);

export function exportToExcel({
  fileName,
  sheets,
}: {
  fileName: string;
  sheets: ExportSheet[];
}) {
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();

  sheets.forEach((sheet, si) => {
    const aoa: unknown[][] = [sheet.columns.map(c => c.header)];
    sheet.rows.forEach(row => {
      aoa.push(sheet.columns.map(c => {
        const v = row[c.key];
        if (v === null || v === undefined) return '';
        return v;
      }));
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Header styling
    sheet.columns.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[ref]) ws[ref].s = { font: { bold: true } };
    });

    // Number formats
    sheet.columns.forEach((col, ci) => {
      const fmt = FMT[col.type ?? 'text'];
      if (!fmt) return;
      for (let r = 1; r <= sheet.rows.length; r++) {
        const ref = XLSX.utils.encode_cell({ r, c: ci });
        const cell = ws[ref];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = fmt;
        }
      }
    });

    // Column widths
    ws['!cols'] = sheet.columns.map((col, ci) => {
      const lengths = [col.header.length, ...sheet.rows.map(r => {
        const v = r[col.key];
        return v === null || v === undefined ? 0 : String(v).length;
      })];
      return { wch: Math.min(40, Math.max(10, Math.max(...lengths, 0) + 2)) };
    });

    let name = sanitizeSheetName(sheet.name);
    let suffix = 1;
    while (used.has(name.toLowerCase())) {
      name = sanitizeSheetName(`${sheet.name} ${++suffix}`);
    }
    used.add(name.toLowerCase());
    XLSX.utils.book_append_sheet(wb, ws, name || `Planilha${si + 1}`);
  });

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}_${date}.xlsx`);
}
