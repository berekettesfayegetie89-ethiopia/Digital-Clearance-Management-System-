import EmptyState from "./EmptyState";

/**
 * Generic, reusable data table.
 * columns: [{ key, header, render?(row) }]
 * rows: array of row objects
 * onRowClick?: (row) => void
 */
export default function DataTable({ columns, rows, onRowClick, emptyTitle = "No records found", emptyDescription }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border last:border-0 ${
                onRowClick ? "cursor-pointer hover:bg-canvas/70" : ""
              } transition`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-5 py-3.5 text-text-primary">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
