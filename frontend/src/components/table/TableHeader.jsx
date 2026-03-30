/**
 * @file TableHeader.jsx
 * @description Styled table header cell component with sort indicator.
 */

/**
 * @component TableHeader
 * @description A styled table header cell (th) with optional click handler and sort indicator.
 * Used for sortable column headers in the applications table.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header text content
 * @param {Function} [props.onClick] - Click handler for sorting
 * @param {boolean} [props.sorted] - Whether this column is currently sorted
 *
 * @example
 * <TableHeader onClick={() => setSortKey('company')} sorted={sortKey === 'company'}>
 *   Company
 * </TableHeader>
 *
 * @returns {JSX.Element} Styled th element
 */
export default function TableHeader({ children, onClick, sorted }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "10px 14px",
        textAlign: "left",
        color: "#6B7280",
        fontSize: 10,
        letterSpacing: "0.12em",
        fontFamily: "'DM Mono',monospace",
        borderBottom: "1px solid #1F2937",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
        background: "#070B10",
      }}
    >
      {children}{sorted ? " \u2193" : ""}
    </th>
  );
}
