# Settings and shortcuts

> **Audience:** People using Job Tracker day to day.  ·  **Scope:** The dashboard Settings dialog, where your preferences are stored, and the complete keyboard reference including the places where the in-app help list is wrong.

Job Tracker has one settings dialog and no settings page. It controls which parts of the dashboard are visible and nothing else. The second half of this page is the keyboard reference, taken from what the application actually responds to rather than from the list it shows you when you press `?`.

## Contents

- [1. The Settings dialog](#1-the-settings-dialog)
- [2. What each switch controls](#2-what-each-switch-controls)
- [3. Where your preferences are stored](#3-where-your-preferences-are-stored)
- [4. Resetting](#4-resetting)
- [5. The keyboard reference](#5-the-keyboard-reference)
- [6. Where the in-app help disagrees with reality](#6-where-the-in-app-help-disagrees-with-reality)
- [See also](#see-also)

---

## 1. The Settings dialog

Click **Settings** at the top right of the dashboard. A dialog headed "Dashboard Settings" opens over the page with a list of switches in two groups:

- **Statistics**, containing a single switch, Stat Cards, described as "Controls all statistics cards at the top". It shows and hides all ten cards together. There is no way to hide one card.
- **Charts & Analytics**, containing one switch per chart.

Toggling a switch takes effect immediately behind the dialog. Close it by clicking the `x`, or by clicking the dark area outside it. Escape does not close this dialog.

Two things about the dialog to expect:

- The list order does not match the order the charts appear in on the page. The dialog lists the day and hour charts before Activity Heatmap and the insight charts; the page renders the insight charts first.
- Clicking a switch's text label does nothing. Click the switch itself.

The applications table has no switch. It is always visible, and the dialog says so at the bottom.

---

## 2. What each switch controls

Several switches are named differently from the heading on the chart they control, which makes finding the right one harder than it should be. Table 1 pairs them up in the order the dialog lists them.

**Table 1.** *Every switch in the Settings dialog, the chart it controls, and its default.*

| Switch in the dialog | Heading on the dashboard | On by default |
| --- | --- | --- |
| Stat Cards | The block of ten cards at the top | Yes |
| Stage Funnel | Pipeline Funnel | Yes |
| Salary Range Chart | Salary Range Distribution | Yes |
| Max Time Per Stage | Max Days in Stage | Yes |
| Day of Week Chart | Applications by Day of Week | Yes |
| Hour Distribution Chart | Applications by Hour | Yes |
| Activity Heatmap | Application Activity | Yes |
| Company Insights | Company Insights | Yes |
| Location Insights | Location & RTO Insights | Yes |
| Position Insights | Position Level Insights | Yes |
| Status Transition Heatmap | Status Transitions | No |
| Funnel Analytics | Funnel Analytics | No |
| Application Health Dashboard | Application Health | No |

The last three are off deliberately. They are the views that need recorded history to say anything, so a first-run dashboard stays readable without them. [Analytics and insights](./04-analytics-and-insights.md) explains what each one needs before it is worth turning on.

When every chart in a dashboard row is switched off, the row disappears rather than leaving an empty gap.

---

## 3. Where your preferences are stored

Your choices are saved in the browser you are using, not on the server and not against your account. That single fact has several consequences worth knowing before you spend time arranging the dashboard.

- **Another browser or another machine gives you the defaults again.** Your arrangement does not follow you.
- **Preferences are not tied to your account.** If two people use Job Tracker in the same browser, they share one set of preferences. Signing out and signing in as somebody else does not change what is shown.
- **Signing out does not reset them.** Logging out clears your session but leaves your dashboard arrangement in place for the next person to use that browser.
- **A private or incognito window loses them when you close it.**
- **Clearing site data or cookies for the site resets them to the defaults.**
- **Two tabs do not stay in step.** Preferences are read once when a dashboard loads. Change a switch in one tab and the other tab keeps its old arrangement until you reload it.
- **If your browser refuses to store data**, because storage is disabled or full, the switches still work for the rest of the session but the choices are gone after a reload. Nothing warns you when this happens.

Because the preferences are stored under one name and merged against the defaults when they are read, a new chart added in a future version arrives switched to whatever that version's default is, without disturbing your other choices.

---

## 4. Resetting

**Reset to Default** at the bottom of the dialog restores the arrangement in Table 1: the first ten switches on, the last three off. It applies immediately and it saves straight away, so there is no undo and no confirmation prompt. The dialog stays open, so you can see the result.

If the dialog itself will not open, or the dashboard looks broken in a way the switches cannot explain, clearing the site's stored data in your browser also returns the arrangement to the defaults. That also signs you out, because your session is stored in the same place.

---

## 5. The keyboard reference

Table 2 is the definitive list. It reflects what the application responds to, which is not identical to the list shown by the in-app help; [section 6](#6-where-the-in-app-help-disagrees-with-reality) covers the differences.

Nothing in the table works on the landing, login or registration pages. Every shortcut belongs to the dashboard.

**Table 2.** *Shortcuts active on the dashboard when no dialog is open.*

| Key | What it does |
| --- | --- |
| `n` | Open the new application form |
| `/` | Put the cursor in the table's search box |
| `?` | Open or close the keyboard shortcut help |
| `j` or Down arrow | Select the next row in the table, wrapping from the last row to the first |
| `k` or Up arrow | Select the previous row, wrapping from the first row to the last |
| Enter | Open the selected row's read-only detail view |
| `e` | Open the selected row in the edit form |
| Delete | Delete the selected row, after a confirmation prompt |
| Backspace | The same as Delete |
| Escape | Clear the row selection |

These are switched off while the applications are still loading, and while the new, edit or detail dialog is open. They stay active while the keyboard help itself is open.

**Table 3.** *Shortcuts active inside a dialog.*

| Dialog | Key | What it does |
| --- | --- | --- |
| New or edit application | Cmd+Enter or Ctrl+Enter | Save and close |
| New or edit application | Cmd+S or Ctrl+S | Save and close |
| New or edit application | Escape | Close without saving |
| Application detail (read-only) | Escape | Close |
| Keyboard shortcut help | Escape | Close |
| Dashboard Settings | none | Escape does not close it; use the `x` or click outside |

While you are typing in a text box, a number box, a dropdown or a text area, the plain-letter shortcuts are ignored, so you can type "n" into a company name without opening a new form. Escape still works, and so do the combinations that need Cmd or Ctrl.

> [!TIP]
> `/` then a company name, then `j` and Enter is the fastest way to open a specific application. Selection follows the filtered and sorted table, so the row `j` moves to is the row you can see.

---

## 6. Where the in-app help disagrees with reality

The list you get from pressing `?` is written by hand and is not derived from the shortcuts the application registers. It has drifted. Four differences will catch you out.

**Backspace is missing from the list but works.** The help shows only Delete under Table Navigation. Backspace deletes the selected row in exactly the same way, with the same confirmation prompt. If you press Backspace intending to go back a page in your browser while a row is selected, you get a delete prompt instead.

**The "Global" group is not global.** The help groups `n`, `/`, `?` and Escape under a heading called Global. None of them work anywhere except the dashboard. Pressing `?` on the landing page, the login page or the registration page does nothing at all.

**Cmd or Ctrl does not suppress the plain-letter shortcuts, and they are not listed.** Pressing Cmd+N or Ctrl+N opens the new application form rather than a new browser window, and the browser's own action is blocked. Cmd+E or Ctrl+E opens the edit form for the selected row. Neither combination appears in the help. If you rely on Cmd+N for a new window, use the browser menu while the dashboard has focus.

**Escape while the help is open does two things.** It closes the help, and it also clears your table row selection, because both handlers respond to the same keypress. The help lists Escape once, as "Close modal / clear selection", which is accurate about the effect but does not warn you that both happen at once.

One smaller detail: the help shows the save shortcut as `Cmd/Ctrl + S` with a capital S. The application matches the lowercase key only, so Cmd+Shift+S or Ctrl+Shift+S does not save.

---

## See also

- [Dashboard and navigation](./02-dashboard-and-navigation.md), for what each chart shows and where it sits on the page.
- [Analytics and insights](./04-analytics-and-insights.md), for what the three off-by-default views need before they are worth turning on.
- [Tracking applications](./03-tracking-applications.md), for the application form the save shortcuts apply to.
- [Known gaps](../development/11-known-gaps.md), for the current list of defects including the shortcut drift described above.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
