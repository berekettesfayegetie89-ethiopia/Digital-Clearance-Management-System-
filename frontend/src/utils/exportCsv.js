/**
 * Converts an array of flat objects to a real downloadable CSV file —
 * no backend round-trip needed since the data is already in the browser
 * from a real API response. Used by every "Export" button across HR/Super
 * Admin dashboards.
 */
export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    throw new Error("No data to export.");
  }
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
