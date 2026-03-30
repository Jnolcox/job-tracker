/**
 * @file AppTable.jsx
 * @description Main applications table component with sorting, filtering, and search.
 */

import { useState, useMemo, useEffect } from "react";
import { Badge } from "../common";
import TableHeader from "./TableHeader";
import { FUNNEL_GROUPS, FUNNEL_COLORS, FILTER_OPTIONS } from "../../constants/dashboard";
import { timeInStage, totalDaysActive } from "../../utils/dateHelpers";
import { isStatusInGroup, RTO_LABELS, LEVEL_LABELS } from "../../utils/dataAdapter";

/**
 * @component AppTable
 * @description Table displaying job applications with sorting, filtering, and search.
 * Supports keyboard navigation with visual row selection.
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects
 * @param {Function} props.onEdit - Callback when edit is triggered
 * @param {Function} props.onDelete - Callback when delete is triggered
 * @param {React.RefObject} props.searchInputRef - Ref for the search input (for focus shortcut)
 * @param {number} [props.selectedIndex=-1] - Currently selected row index
 * @param {Function} props.onSelectionChange - Callback when selection changes
 * @param {Function} props.getSortedItems - Callback to get sorted items for parent
 *
 * @example
 * <AppTable
 *   apps={applications}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   searchInputRef={searchRef}
 *   selectedIndex={selectedIdx}
 *   onSelectionChange={setSelectedIdx}
 *   getSortedItems={setSortedItems}
 * />
 *
 * @returns {JSX.Element} Table component
 */
export default function AppTable({
  apps,
  onEdit,
  onDelete,
  searchInputRef,
  selectedIndex = -1,
  onSelectionChange,
  getSortedItems
}) {
  // Default sort by lastUpdate (descending - newest first)
  const [sortKey, setSortKey] = useState("lastUpdate");
  // Default filter to "Active" to show non-rejected applications
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    let rows = [...apps];
    if (filter !== "All") {
      if (filter === "Active") {
        // Active filter: exclude all statuses in the REJECTED group
        // This includes: REJECTED, OFFER_DECLINED, OFFER_RESCINDED, GHOSTED
        rows = rows.filter(a => !isStatusInGroup(a.status, 'REJECTED'));
      } else {
        const group = FUNNEL_GROUPS.find(g => g.key === filter);
        if (group) rows = rows.filter(a => group.statuses.includes(a.status));
      }
    }
    if (search) rows = rows.filter(a =>
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a, b) => {
      if (sortKey === "appliedAt" || sortKey === "lastUpdate") {
        return new Date(b[sortKey]) - new Date(a[sortKey]);
      }
      if (sortKey === "days") return totalDaysActive(b) - totalDaysActive(a);
      if (sortKey === "statusTime") return timeInStage(b) - timeInStage(a);
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
    return rows;
  }, [apps, sortKey, filter, search]);

  // Expose sorted items to parent for keyboard navigation
  useEffect(() => {
    if (getSortedItems) {
      getSortedItems(sorted);
    }
  }, [sorted, getSortedItems]);

  // Handle row click to update selection
  const handleRowClick = (index) => {
    if (onSelectionChange) {
      onSelectionChange(index);
    }
  };

  return (
    <div style={{
      background: "#0E1117",
      border: "1px solid #1F2937",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* toolbar */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        borderBottom: "1px solid #1F2937",
        flexWrap: "wrap",
      }}>
        <input
          ref={searchInputRef}
          placeholder="Search company / role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: 8,
            padding: "6px 12px",
            color: "#F9FAFB",
            fontFamily: "'DM Mono',monospace",
            fontSize: 12,
            outline: "none",
            width: 220,
          }}
        />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {FILTER_OPTIONS.map(s => {
            // Determine the background color for active filter state
            const getActiveColor = () => {
              if (s === "Active") return "#10B981"; // Green for active filter
              return FUNNEL_COLORS[s] || "#374151";
            };
            // Determine the display label
            const getLabel = () => {
              if (s === "All" || s === "Active") return s;
              return FUNNEL_GROUPS.find(g => g.key === s)?.label || s;
            };
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  fontWeight: 600,
                  background: filter === s ? getActiveColor() : "#1F2937",
                  color: filter === s ? "#fff" : "#9CA3AF",
                  transition: "background 0.2s",
                }}
              >
                {getLabel()}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onEdit({
            id: null,
            company: "",
            role: "",
            status: "APPLIED",
            appliedAt: new Date().toISOString(),
            notes: "",
            jobDescription: "",
            jobUrl: "",
            salaryMin: null,
            salaryMax: null,
            location: "",
            rtoType: null,
            contactName: "",
            contactEmail: "",
            contactPhone: "",
          })}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            background: "#4E9AF1",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'DM Mono',monospace",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          + Add
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TableHeader onClick={() => setSortKey("company")} sorted={sortKey === "company"}>Company</TableHeader>
              <TableHeader onClick={() => setSortKey("role")} sorted={sortKey === "role"}>Role</TableHeader>
              <TableHeader onClick={() => setSortKey("level")} sorted={sortKey === "level"}>Level</TableHeader>
              <TableHeader onClick={() => setSortKey("status")} sorted={sortKey === "status"}>Status</TableHeader>
              <TableHeader onClick={() => setSortKey("location")} sorted={sortKey === "location"}>Location</TableHeader>
              <TableHeader onClick={() => setSortKey("rtoType")} sorted={sortKey === "rtoType"}>RTO</TableHeader>
              <TableHeader onClick={() => setSortKey("salaryMin")} sorted={sortKey === "salaryMin"}>Salary</TableHeader>
              <TableHeader onClick={() => setSortKey("appliedAt")} sorted={sortKey === "appliedAt"}>Applied</TableHeader>
              <TableHeader onClick={() => setSortKey("statusTime")} sorted={sortKey === "statusTime"}>Status Age</TableHeader>
              <TableHeader onClick={() => setSortKey("days")} sorted={sortKey === "days"}>Total Days</TableHeader>
              <TableHeader onClick={() => setSortKey("lastUpdate")} sorted={sortKey === "lastUpdate"}>Last Update</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => {
              const isSelected = selectedIndex === i;
              const baseBackground = i % 2 === 0 ? "#080C12" : "#0A0F16";
              const selectedBackground = "#1E3A5F"; // Blue tint for selection
              const hoverBackground = isSelected ? "#254B77" : "#111827";

              return (
                <tr
                  key={a.id}
                  onClick={() => handleRowClick(i)}
                  style={{
                    background: isSelected ? selectedBackground : baseBackground,
                    transition: "background 0.15s",
                    cursor: "pointer",
                    outline: isSelected ? "1px solid #4E9AF1" : "none",
                    outlineOffset: "-1px",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBackground}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? selectedBackground : baseBackground}
                >
                  <td style={{ padding: "10px 14px", color: "#F9FAFB", fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600 }}>{a.company}</td>
                  <td style={{ padding: "10px 14px", color: "#9CA3AF", fontFamily: "'DM Mono',monospace", fontSize: 10, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.role}</td>
                  <td style={{ padding: "10px 14px", color: "#9CA3AF", fontFamily: "'DM Mono',monospace", fontSize: 10 }}>{a.level ? LEVEL_LABELS[a.level] : "\u2014"}</td>
                  <td style={{ padding: "10px 14px" }}><Badge status={a.status}/></td>
                  <td style={{ padding: "10px 14px", color: "#9CA3AF", fontFamily: "'DM Mono',monospace", fontSize: 10, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.location || "\u2014"}</td>
                  <td style={{ padding: "10px 14px", color: "#9CA3AF", fontFamily: "'DM Mono',monospace", fontSize: 10 }}>{a.rtoType ? RTO_LABELS[a.rtoType]?.replace(" days", "d")?.replace("Hybrid ", "H")?.replace("Remote", "Remote") : "\u2014"}</td>
                  <td style={{ padding: "10px 14px", color: "#D1D5DB", fontFamily: "'DM Mono',monospace", fontSize: 10, whiteSpace: "nowrap" }}>{a.salaryMin || a.salaryMax ? `$${Math.round((a.salaryMin || 0) / 1000)}k-${Math.round((a.salaryMax || 0) / 1000)}k` : "\u2014"}</td>
                  <td style={{ padding: "10px 14px", color: "#6B7280", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{new Date(a.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'DM Mono',monospace", fontSize: 12, textAlign: "center", color: timeInStage(a) > 7 ? "#F87171" : timeInStage(a) > 3 ? "#F59E0B" : "#34D399" }}>{timeInStage(a)}d</td>
                  <td style={{ padding: "10px 14px", color: "#D1D5DB", fontFamily: "'DM Mono',monospace", fontSize: 12, textAlign: "center" }}>{totalDaysActive(a)}d</td>
                  <td style={{ padding: "10px 14px", color: "#6B7280", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{new Date(a.lastUpdate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                        style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #374151", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                        style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #991B1B", background: "transparent", color: "#F87171", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: 40, textAlign: "center", color: "#374151", fontFamily: "'DM Mono',monospace", fontSize: 13 }}>
                  No applications match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{
        padding: "10px 20px",
        color: "#4B5563",
        fontSize: 10,
        fontFamily: "'DM Mono',monospace",
        borderTop: "1px solid #1F2937",
      }}>
        {sorted.length} of {apps.length} applications
      </div>
    </div>
  );
}
