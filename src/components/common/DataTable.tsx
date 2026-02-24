// ============================================================
// DataTable — Accessible tabular alternative to SVG charts.
// Rendered visually hidden; exposed to screen readers only.
//
// WCAG 2.1 AA: all charts must have a data table alternative.
// ============================================================

interface DataTableProps {
    /** Table caption (required for accessibility) */
    caption: string;
    /** Column headers */
    headers: string[];
    /** Row data — each row is an array of strings (same length as headers) */
    rows: string[][];
    /** Optional: make the table visible for debugging */
    visible?: boolean;
}

/**
 * DataTable — a screen-reader-accessible alternative to SVG/Canvas charts.
 *
 * By default the table is visually hidden via `.sr-only` but fully accessible
 * to assistive technologies.  Set `visible={true}` for debugging.
 */
export default function DataTable({
    caption,
    headers,
    rows,
    visible = false,
}: DataTableProps) {
    return (
        <div className={visible ? 'overflow-x-auto mt-4' : 'sr-only'}>
            <table className="w-full text-sm border-collapse">
                <caption className="text-left font-medium mb-2 text-white/70">
                    {caption}
                </caption>
                <thead>
                    <tr>
                        {headers.map(h => (
                            <th
                                key={h}
                                scope="col"
                                className="border border-white/10 px-3 py-1.5 text-left font-semibold text-white/80 bg-white/5"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className="even:bg-white/[0.02] hover:bg-white/5 transition-colors"
                        >
                            {row.map((cell, j) => (
                                <td
                                    key={j}
                                    className="border border-white/10 px-3 py-1.5 text-white/60"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
