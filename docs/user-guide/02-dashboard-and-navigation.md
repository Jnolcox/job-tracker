# Dashboard and navigation

> **Audience:** People using Job Tracker day to day.  ·  **Scope:** Everything on the dashboard, in the order you meet it: the header, the stat cards, the charts, the hidden advanced views, the applications table, and how to move around without the mouse.

Once you sign in, the dashboard is the whole application. There are no other screens: the landing, login and registration pages exist only to get you here. This page walks down the dashboard from top to bottom and explains what each number is counting.

## Contents

- [1. The header](#1-the-header)
- [2. The stat cards](#2-the-stat-cards)
- [3. The charts](#3-the-charts)
- [4. Views that are switched off by default](#4-views-that-are-switched-off-by-default)
- [5. Turning views on and off](#5-turning-views-on-and-off)
- [6. The applications table](#6-the-applications-table)
- [7. Moving around](#7-moving-around)
- [See also](#see-also)

---

## 1. The header

The top of the page carries the product name, a line reading `{your first name}'S JOB SEARCH · {n} APPLICATIONS`, and your email address. The count is the number of applications currently loaded, which is not necessarily the number you have recorded (see [section 6](#6-the-applications-table)).

On the right are two buttons and a date:

- **Settings** opens the dialog that controls which sections of the dashboard are visible.
- **Logout** clears your session. You return to the login page.
- **AS OF {date}** is simply today's date. It is not the date the data was last refreshed.

Below the header, a red banner appears when something fails: loading the applications, saving one, or deleting one. It has an `x` to dismiss it. The banner does not report problems with the charts. If an analytics request fails, the affected chart just shows nothing.

---

## 2. The stat cards

Ten cards sit in two rows of five. Five of them are computed by the server from all of your applications; the other five are counted in your browser from the applications currently loaded.

Every rate is a percentage of your total application count, calculated from each application's **current status only**. History is not consulted. An application that went through three interview rounds and was then rejected counts toward the response rate and toward nothing else, because its current status is Rejected. This is worth remembering before you read too much into any single number.

**Table 1.** *The ten stat cards and what each number counts.*

| Card | What the number is |
| --- | --- |
| Total Applied | How many applications are loaded. The line underneath counts those that are still active, meaning not rejected, declined, rescinded, ghosted or withdrawn. |
| True Response Rate | The share of your applications whose current status is anything other than Applied, Withdrawn or Ghosted. In other words, somebody got back to you. |
| True Interview Rate | The share whose current status is Recruiter Screen or any later interview or offer status. |
| Avg Response Time | The average number of whole days between the applied date and the last status change, across applications counted as having responded. Shows `0d` when there is nothing to average. |
| True Offer Rate | The share whose current status is one of the five offer statuses: Offer Received, Negotiating, Offer Accepted, Offer Declined or Offer Rescinded. |
| In Interviews | How many loaded applications are currently in an interview status. The line underneath counts those at Reference Check. |
| Applied → Screen | The share of all your applications that reached a recruiter screen or any later stage. |
| Screen → Tech | Of the applications that reached a screen, the share that reached a technical stage or any later stage. Note that this one is a share of the screened applications, not of the total. |
| Weekly Pace | Your applications per week, to one decimal place. With fewer than two applications recorded, this reports the raw count rather than a rate. |
| Current Offers | How many loaded applications are at Offer Received, Negotiating or Offer Accepted. |

Two of these deliberately count different things and will disagree with each other. "Total Applied" counts what is loaded in the browser; the rate cards are computed on the server from everything you have recorded. If you have more than 100 applications the two sets diverge.

> [!NOTE]
> The stat cards and every chart are loaded once, when the dashboard opens. Adding, editing or deleting an application updates the table immediately but leaves every number and chart untouched until you reload the page. Reload after a batch of edits if you want the analytics to match the table.

---

## 3. The charts

Below the stat cards are the charts, in fixed rows. Nine of them are visible by default.

**Table 2.** *The charts shown by default, the name each one has in the Settings dialog, and what it shows.*

| Heading on the chart | Name in Settings | What it shows |
| --- | --- | --- |
| Pipeline Funnel | Stage Funnel | A horizontal bar per pipeline stage, sized by how many applications are sitting in that stage right now. |
| Salary Range Distribution | Salary Range Chart | One dot per application that has salary figures, with the minimum on the horizontal axis and the maximum on the vertical. Dashed crosshairs mark the averages. Hovering a dot names the company. |
| Max Days in Stage | Max Time Per Stage | For each pipeline stage, the longest any single application has sat in its current status, labeled with the company that holds the record. Rejected applications are excluded. |
| Company Insights | Company Insights | Your five most-applied-to companies, with response rate, ghost rate, interview rate and average days to a response. |
| Location & RTO Insights | Location Insights | Your five most common locations with average salary bands and success rate, plus a breakdown by work arrangement. |
| Position Level Insights | Position Insights | A breakdown by seniority level, with success and interview rates and salary bands for each. |
| Applications by Day of Week | Day of Week Chart | How many applications you sent on each weekday, Monday first. |
| Applications by Hour | Hour Distribution Chart | How many applications you sent in each hour of the day. |
| Application Activity | Activity Heatmap | A full-year grid, one cell per day, shaded by how many applications you sent that day. Hovering a cell shows the date and count. |

Four of these charts (Pipeline Funnel, Salary Range Distribution, Applications by Day of Week and Applications by Hour) show no loading indicator. While the data is on its way, they render as empty or as zeros, then fill in. That is expected behavior, not a stuck page.

If a chart is empty and stays empty, the most likely reason is that you have no applications carrying the data it needs. The salary chart needs salary figures, and the location and level charts need those fields filled in.

---

## 4. Views that are switched off by default

Three analytics views exist but are hidden until you turn them on in Settings.

**Table 3.** *The three views that are off by default.*

| Heading on the chart | Name in Settings | What it shows |
| --- | --- | --- |
| Status Transitions | Status Transition Heatmap | A grid of how often your applications moved from one status to another, shaded by frequency. Built from recorded history, so it reflects moves you have actually made. |
| Funnel Analytics | Funnel Analytics | Overall success rate, stage-by-stage conversion bars, the points where applications most often drop out, and success rate broken down by position type. |
| Application Health | Application Health Dashboard | Applications that have gone quiet (nothing recorded for 14 days), applications with a lot of recent activity, and outcomes that arrived quickly. |

Status Transitions is the only view on the dashboard that reads your recorded history rather than current statuses. Because of that, it can appear to contradict the rate cards: it will show interview rounds that an application passed through even when that application's rate contribution was later erased by a rejection. Both are behaving as designed. [Analytics and insights](./04-analytics-and-insights.md) explains this in more detail.

---

## 5. Turning views on and off

Click **Settings** in the header. The dialog lists every section in two groups:

- **Statistics**, containing a single switch, Stat Cards, which controls the whole block of ten cards at once.
- **Charts & Analytics**, containing one switch per chart.

Toggling a switch takes effect immediately. When every chart in a row is switched off, the row disappears rather than leaving a gap. **Reset to Default** at the bottom of the dialog restores the original selection, which means the nine charts in Table 2 on and the three in Table 3 off.

Two things to expect from this dialog:

- The order of the list does not match the order the charts appear in on the page. The list groups the time-pattern charts before the insights charts; the page renders them the other way round.
- Several switches are named differently from the heading on the chart they control. "Stage Funnel" controls the chart headed "Pipeline Funnel", "Max Time Per Stage" controls "Max Days in Stage", and "Location Insights" controls "Location & RTO Insights". Table 2 and Table 3 give the pairings.

Your choices are saved in your browser only. Another browser, another machine, or a cleared browser store gives you the defaults again. There is no switch for the applications table; it is always visible.

---

## 6. The applications table

Below a divider marked `APPLICATIONS TABLE` is the list of your applications: search box, filter chips, an **+ Add** button, and twelve columns. Adding, editing, filtering and sorting are covered in [Tracking applications](./03-tracking-applications.md).

Two behaviors are worth knowing here, because they affect the numbers above:

- **Only the first 100 applications are loaded.** There is no paging, no "load more", and no warning when you cross the line. Past 100 applications, the table and the header count show a truncated set while the server-computed rate cards still reflect everything you have recorded.
- **The default filter is "Active", not "All".** When you first arrive, rejected, declined, rescinded and ghosted applications are hidden. The footer under the table reads `{shown} of {loaded} applications`, which is how you notice.

---

## 7. Moving around

The dashboard is driven from the keyboard. The footer under the table reminds you: press `?` for the full list.

**Table 4.** *The keys you need to get around the dashboard.*

| Key | What it does |
| --- | --- |
| `?` | Open or close the keyboard shortcut help |
| `n` | Open the new application form |
| `/` | Put the cursor in the table's search box |
| `j` or Down arrow | Select the next row in the table |
| `k` or Up arrow | Select the previous row |
| Enter | Open the selected row's detail view |
| `e` | Open the selected row for editing |
| Delete or Backspace | Delete the selected row, after a confirmation prompt |
| Escape | Close whichever dialog is open; with nothing open, clear the row selection |

Row selection wraps at both ends, so `j` from the last row takes you back to the first. Selection follows the table as it is filtered and sorted, so the row that `j` moves to is the row you can see.

Shortcuts are ignored while you are typing in a text box, with the exception of Escape. Inside the application form, Cmd+S or Ctrl+S and Cmd+Enter or Ctrl+Enter both save and close.

One quirk to be aware of: holding Cmd or Ctrl does not suppress the plain-letter shortcuts. Pressing Cmd+N or Ctrl+N opens the new application form instead of opening a browser window, and Cmd+E or Ctrl+E opens the edit form. [Settings and shortcuts](./05-settings-and-shortcuts.md) has the complete reference.

---

## See also

- [Tracking applications](./03-tracking-applications.md), for the application form, the status list, and searching and filtering.
- [Analytics and insights](./04-analytics-and-insights.md), for how each rate is calculated and where two views can disagree.
- [Settings and shortcuts](./05-settings-and-shortcuts.md), for the complete keyboard reference and the dashboard settings.
- [Known gaps](../development/11-known-gaps.md), for the current list of defects and rough edges.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
