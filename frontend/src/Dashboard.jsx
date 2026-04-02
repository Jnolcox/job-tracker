/**
 * @file Dashboard.jsx
 * @description Main dashboard component for job application tracking.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { useKeyboardShortcutContext } from "./context/KeyboardShortcutContext";
import { useKeyboardShortcuts, useApplicationMetrics } from "./hooks";
import { jobApplicationsAPI } from "./services/api";
import {
  toUIFormat,
  toBackendFormat,
  toBackendFormatForUpdate,
  isStatusInGroup,
} from "./utils/dataAdapter";
import ActivityHeatmap from "./components/ActivityHeatmap";
import { StatCard } from "./components/common";
import {
  StageFunnel,
  MaxTimePerStageChart,
  SalaryRangeChart,
  DayOfWeekBar,
  HourBar,
  StageDurationChart,
} from "./components/charts";
import { AppTable } from "./components/table";
import { ApplicationModal, ApplicationViewModal } from "./components/modal";

/**
 * @component JobTracker
 * @description Main dashboard component for job application tracking.
 * Provides keyboard shortcuts for efficient navigation and actions.
 *
 * Keyboard shortcuts:
 * - n: Open new application modal
 * - /: Focus search input
 * - ?: Show keyboard shortcuts help
 * - Escape: Close modal / clear selection
 * - j/ArrowDown: Select next row
 * - k/ArrowUp: Select previous row
 * - Enter: View selected application (opens read-only modal)
 * - e: Edit selected application (opens edit modal)
 * - Delete/Backspace: Delete selected (with confirm)
 *
 * @returns {JSX.Element} JobTracker dashboard
 */
export default function JobTracker() {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleHelp } = useKeyboardShortcutContext();
  const [apps, setApps] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Refs for keyboard shortcut targets
  const searchInputRef = useRef(null);

  // State for table row selection and sorted items
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sortedItems, setSortedItems] = useState([]);

  // Callback to receive sorted items from AppTable
  const handleGetSortedItems = useCallback((items) => {
    setSortedItems(items);
  }, []);

  // Fetch and compute metrics from audit trail events
  const { metrics, events, loading: metricsLoading } = useApplicationMetrics(apps);

  // Sync selectedIndex when items change (clamp to valid range)
  useEffect(() => {
    if (sortedItems.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= sortedItems.length) {
      setSelectedIndex(sortedItems.length - 1);
    }
  }, [sortedItems.length, selectedIndex]);

  // Create new application template
  const createNewApplication = useCallback(() => {
    setEditing({
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
    });
  }, []);

  // Focus search input
  const focusSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (editing) {
      setEditing(null);
    } else if (viewing) {
      setViewing(null);
    } else if (selectedIndex !== -1) {
      setSelectedIndex(-1);
    }
  }, [editing, viewing, selectedIndex]);

  // Handle navigation down (j or ArrowDown)
  const handleNavigateDown = useCallback(() => {
    if (sortedItems.length === 0) return;
    setSelectedIndex(prev => {
      if (prev === -1) return 0;
      if (prev >= sortedItems.length - 1) return 0; // Wrap around
      return prev + 1;
    });
  }, [sortedItems.length]);

  // Handle navigation up (k or ArrowUp)
  const handleNavigateUp = useCallback(() => {
    if (sortedItems.length === 0) return;
    setSelectedIndex(prev => {
      if (prev === -1) return sortedItems.length - 1;
      if (prev <= 0) return sortedItems.length - 1; // Wrap around
      return prev - 1;
    });
  }, [sortedItems.length]);

  // Handle Enter to view selected application
  const handleViewSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < sortedItems.length) {
      setViewing(sortedItems[selectedIndex]);
    }
  }, [selectedIndex, sortedItems]);

  // Handle 'e' to edit selected application
  const handleEditSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < sortedItems.length) {
      setEditing(sortedItems[selectedIndex]);
    }
  }, [selectedIndex, sortedItems]);

  // Handle Delete to delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < sortedItems.length) {
      handleDelete(sortedItems[selectedIndex].id);
    }
  }, [selectedIndex, sortedItems]);

  // Global keyboard shortcuts (only active when modal is closed)
  useKeyboardShortcuts([
    { key: 'n', handler: createNewApplication, preventDefault: true },
    { key: '/', handler: focusSearch, preventDefault: true },
    { key: '?', handler: toggleHelp },
    { key: 'Escape', handler: handleEscape },
    { key: 'j', handler: handleNavigateDown },
    { key: 'ArrowDown', handler: handleNavigateDown },
    { key: 'k', handler: handleNavigateUp },
    { key: 'ArrowUp', handler: handleNavigateUp },
    { key: 'Enter', handler: handleViewSelected },
    { key: 'e', handler: handleEditSelected },
    { key: 'Delete', handler: handleDeleteSelected },
    { key: 'Backspace', handler: handleDeleteSelected },
  ], { enabled: !editing && !viewing && !loading });

  // Fetch applications on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobApplicationsAPI.getAll(0, 100);
      const data = response.data.content || response.data || [];
      setApps(data.map(toUIFormat));
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle saving an application (create or update).
   *
   * For creates: Only form is provided, uses toBackendFormat which omits statusChangedAt.
   * For updates: Original data and status change flag are provided, uses
   *              toBackendFormatForUpdate to intelligently handle date fields.
   *
   * @param {Object} form - Current form data
   * @param {Object} [originalData] - Original application data (for updates only)
   * @param {boolean} [statusChanged] - Whether status was changed (for updates only)
   */
  const handleSave = async (form, originalData, statusChanged) => {
    try {
      setSaving(true);
      setError(null);

      if (form.id) {
        // Update existing - use toBackendFormatForUpdate for intelligent date handling
        const backendData = toBackendFormatForUpdate(form, originalData, statusChanged);
        const response = await jobApplicationsAPI.update(form.id, backendData);
        const updated = toUIFormat(response.data);
        setApps(prev => prev.map(a => a.id === form.id ? updated : a));
      } else {
        // Create new - use toBackendFormat which omits statusChangedAt (backend defaults it)
        const backendData = toBackendFormat(form);
        const response = await jobApplicationsAPI.create(backendData);
        const created = toUIFormat(response.data);
        setApps(prev => [...prev, created]);
      }
      setEditing(null);
    } catch (err) {
      console.error("Failed to save application:", err);
      setError("Failed to save application. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }
    try {
      setError(null);
      await jobApplicationsAPI.delete(id);
      setApps(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete application:", err);
      setError("Failed to delete application. Please try again.");
    }
  };

  // Derived metrics
  const activeApps = apps.filter(a => !isStatusInGroup(a.status, 'REJECTED') && !isStatusInGroup(a.status, 'WITHDRAWN'));
  const offers = apps.filter(a => isStatusInGroup(a.status, 'OFFER')).length;
  const inInterview = apps.filter(a => isStatusInGroup(a.status, 'INTERVIEWING')).length;
  const weeklyPace = (() => {
    if (apps.length === 0) return "0.0";
    const dates = apps.map(a => new Date(a.appliedAt));
    const minD = new Date(Math.min(...dates)), maxD = new Date(Math.max(...dates));
    const weeks = Math.max((maxD - minD) / (7 * 86400000), 1);
    return (apps.length / weeks).toFixed(1);
  })();

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#070B10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Mono',monospace",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid #1F2937",
            borderTopColor: "#4E9AF1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}/>
          <p style={{ color: "#6B7280", fontSize: 12 }}>Loading applications...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:#070B10; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0E1117; }
        ::-webkit-scrollbar-thumb { background:#374151; border-radius:3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#070B10",
        backgroundImage: "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(78,154,241,0.08) 0%, transparent 60%)",
        fontFamily: "'DM Mono',monospace",
        padding: "32px 28px",
        maxWidth: 1400,
        margin: "0 auto",
      }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "baseline", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <h1 style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 42,
              letterSpacing: "0.06em",
              background: "linear-gradient(135deg,#4E9AF1,#A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}>Job Tracker</h1>
            <p style={{ color: "#4B5563", fontSize: 11, letterSpacing: "0.1em", marginTop: 4 }}>
              {user?.firstName ? `${user.firstName}'s ` : ""}JOB SEARCH {"\u00B7"} {apps.length} APPLICATIONS
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user && (
              <span style={{ color: "#6B7280", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
                {user.email}
              </span>
            )}
            <button
              onClick={logout}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #374151",
                background: "transparent",
                color: "#9CA3AF",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              Logout
            </button>
            <span style={{ color: "#374151", fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>
              AS OF {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: "#7F1D1D",
            border: "1px solid #991B1B",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#FCA5A5",
                cursor: "pointer",
                fontSize: 14,
              }}
            >x</button>
          </div>
        )}

        {/* Stat Cards -- 5 x 2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {/* Row 1 - Overview metrics */}
          <StatCard label="Total Applied" value={apps.length} sub={`${activeApps.length} still active`} accent="#4E9AF1" />
          <StatCard
            label="True Response Rate"
            value={metricsLoading ? "—" : `${Math.round(metrics?.trueResponseRate || 0)}%`}
            sub="got any response"
            accent="#A78BFA"
            loading={metricsLoading}
          />
          <StatCard
            label="True Interview Rate"
            value={metricsLoading ? "—" : `${Math.round(metrics?.trueInterviewRate || 0)}%`}
            sub="reached interviews"
            accent="#38BDF8"
            loading={metricsLoading}
          />
          <StatCard
            label="True Offer Rate"
            value={metricsLoading ? "—" : `${Math.round(metrics?.trueOfferRate || 0)}%`}
            sub="received offers"
            accent="#10B981"
            loading={metricsLoading}
          />
          <StatCard
            label="Avg Response Time"
            value={metricsLoading ? "—" : (metrics?.avgDaysToResponse !== null ? `${Math.round(metrics.avgDaysToResponse)}d` : "—")}
            sub="days to hear back"
            accent="#F59E0B"
            loading={metricsLoading}
          />

          {/* Row 2 - Funnel and current state */}
          <StatCard label="In Interviews" value={inInterview} sub={`${apps.filter(a => a.status === "REFERENCE_CHECK").length} at reference`} accent="#34D399" />
          <StatCard
            label="Applied → Screen"
            value={metricsLoading ? "—" : `${Math.round(metrics?.stageConversions?.appliedToScreen || 0)}%`}
            sub="recruiter conversion"
            accent="#A78BFA"
            loading={metricsLoading}
          />
          <StatCard
            label="Screen → Tech"
            value={metricsLoading ? "—" : `${Math.round(metrics?.stageConversions?.screenToTech || 0)}%`}
            sub="technical conversion"
            accent="#38BDF8"
            loading={metricsLoading}
          />
          <StatCard label="Weekly Pace" value={weeklyPace} sub="apps / week" accent="#FB923C" />
          <StatCard label="Current Offers" value={offers} sub={offers ? "negotiate hard" : "keep pushing"} accent="#10B981" />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <StageFunnel apps={apps} />
          <SalaryRangeChart apps={apps} />
          <MaxTimePerStageChart apps={apps} />
        </div>

        {/* Charts row 2 - Stage insights */}
       {/* <div style={{ marginBottom: 12 }}>
          <StageDurationChart events={events || []} loading={metricsLoading} />
        </div>*/}

        {/* Charts row 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <DayOfWeekBar apps={apps} />
          <HourBar apps={apps} />
        </div>

        {/* Charts row 2 */}
        <div style={{ marginBottom: 12 }}>
          <ActivityHeatmap apps={apps} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1F2937", marginBottom: 20, position: "relative" }}>
          <span style={{
            position: "absolute",
            top: -9,
            left: 20,
            background: "#070B10",
            padding: "0 10px",
            color: "#374151",
            fontSize: 10,
            letterSpacing: "0.12em",
          }}>APPLICATIONS TABLE</span>
        </div>

        {/* Table */}
        <AppTable
          apps={apps}
          onEdit={setEditing}
          onDelete={handleDelete}
          onView={setViewing}
          searchInputRef={searchInputRef}
          selectedIndex={selectedIndex}
          onSelectionChange={setSelectedIndex}
          getSortedItems={handleGetSortedItems}
        />

        {/* Keyboard shortcut hint */}
        <div style={{
          marginTop: 12,
          textAlign: "center",
          color: "#4B5563",
          fontSize: 10,
          fontFamily: "'DM Mono', monospace",
        }}>
          Press <span style={{ color: "#6B7280", background: "#1F2937", padding: "2px 6px", borderRadius: 3 }}>?</span> for keyboard shortcuts
        </div>
      </div>

      {editing && (
        <ApplicationModal
          key={editing.id || 'new'}
          app={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {viewing && (
        <ApplicationViewModal
          key={viewing.id}
          app={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
