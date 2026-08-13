# Tracking applications

> **Audience:** People recording and maintaining job applications in Job Tracker.  ·  **Scope:** The application form and every field on it, the eighteen statuses and when to use each, moving an application through the pipeline, the detail view and its history, deleting, and finding things again with search, filters and sorting.

This is the core of the application. Everything on the dashboard is derived from the records you create here, so it is worth understanding what each field feeds and what the statuses mean before you build up a large list.

## Contents

- [1. Adding an application](#1-adding-an-application)
- [2. The eighteen statuses](#2-the-eighteen-statuses)
- [3. Moving an application through the pipeline](#3-moving-an-application-through-the-pipeline)
- [4. Viewing an application and its history](#4-viewing-an-application-and-its-history)
- [5. Editing and deleting](#5-editing-and-deleting)
- [6. Finding things again](#6-finding-things-again)
- [See also](#see-also)

---

## 1. Adding an application

Press `n`, or click **+ Add** above the applications table. A form opens with the cursor already in the company field.

**Table 1.** *Every field on the application form, in the order it appears.*

| Field | What it is for |
| --- | --- |
| COMPANY | The employer's name. Also the field the search box matches on, and the label used in the salary and stage charts. |
| ROLE | The job title. The other field the search box matches on. |
| LEVEL | Seniority. Feeds the Position Level Insights chart, which breaks your success and interview rates down by level. Optional. |
| STATUS | Where the application stands. Defaults to Applied. See [section 2](#2-the-eighteen-statuses). |
| DATE APPLIED | When you sent it. Drives the day-of-week and hour charts, the activity heatmap, the Total Days column, and the response-time calculation. Defaults to the current date and time. |
| INTERVIEW DATE | When your next interview is. This field only appears while the status is one of the seven interview statuses. If you move the status elsewhere the field disappears from the form, but the stored value is kept. |
| SALARY MIN | The bottom of the posted or discussed range. |
| SALARY MAX | The top of the range. Together with the minimum this places one dot on the Salary Range Distribution chart and feeds the average salary figures in the location and level charts. Nothing checks that the maximum is larger than the minimum. |
| LOCATION | Free text. Feeds the Location & RTO Insights chart, which groups on the exact string, so "Austin, TX" and "Austin TX" become two separate locations. |
| RTO | The return-to-office expectation: fully remote, hybrid with a number of days in the office per week, or fully on-site. Feeds the work-arrangement breakdown. Optional. |
| JOB URL | A link to the posting. The detail view turns this into a link labeled with the site's domain. |
| JOB DESCRIPTION | The posting text, if you want to keep it. Shown in the detail view with its line breaks preserved. |
| NAME, PHONE, EMAIL | Your contact at the company. Shown in the detail view when any of the three is filled in. |
| NOTES | Anything else. |
| STATUS CHANGED DATE | Only appears when you are editing an existing application. Use it to backfill when a status change really happened, so that the Status Age column and the stage-timing charts reflect reality rather than the moment you got round to typing it in. |

Save with the **Save** button, or with Cmd+S, Ctrl+S, Cmd+Enter or Ctrl+Enter. Cancel with the **Cancel** button, the Escape key, or a click outside the form. Nothing is saved until you save.

> [!NOTE]
> The form does no checking of its own. The asterisks next to COMPANY, ROLE and DATE APPLIED are decoration; the form will happily submit with them blank, and the server rejects the request. What you see is the form staying open and a red banner reading "Failed to save application. Please try again." If a save fails for no obvious reason, check that company, role and the applied date are all filled in.

> [!IMPORTANT]
> Three options in the dropdowns are not accepted by the server: **Intern** and **C-Level** in LEVEL, and **Hybrid 1 day** in RTO. The server's own lists do not contain them, so saving with one of them selected fails with the same generic banner. Conversely, the server recognizes two levels the dropdown does not offer, Lead and Manager, so there is no way to select them from the interface. Until this is fixed, use Junior for interns, VP or Director for executive roles, and Hybrid 2 days for a one-day-a-week arrangement.

---

## 2. The eighteen statuses

Status is the only field that drives the pipeline. Every status belongs to exactly one of eight stages, and those stages are what the filter chips, the Pipeline Funnel chart and the Max Days in Stage chart group on.

**Table 2.** *The eighteen statuses, the stage each belongs to, and when to use it.*

| Status | Stage | When to use it |
| --- | --- | --- |
| Applied | Applied | You submitted the application and nothing has come back yet. This is the default for a new record. |
| Recruiter Screen | Recruiter | A recruiter or hiring-manager conversation is scheduled or has happened. |
| Tech Screen | Technical | A first technical conversation, usually short and usually with an engineer. |
| Take Home | Technical | You have been given an exercise to complete in your own time. |
| System Design | Technical | A design or architecture interview. |
| Technical I | Technical | The first full technical round. |
| Technical II | Technical | A second full technical round. |
| Reference Check | Reference | The employer is contacting your references. Usually the last step before an offer. |
| Offer Received | Offer | You have an offer in hand and have not responded to it. |
| Negotiating | Offer | You are discussing the terms. |
| Offer Accepted | Offer | You accepted. The application is finished. |
| Offer Declined | Rejected | You turned the offer down. |
| Offer Rescinded | Rejected | The employer withdrew an offer it had already made. |
| Rejected | Rejected | The employer said no. |
| Ghosted | Rejected | You never heard back and have stopped waiting. |
| Withdrawn | Withdrawn | You pulled out before any decision was made. |
| On Hold | Waiting | The process is paused, whether by you or by them. |
| Waiting for Response | Waiting | You are waiting on a reply after some contact has happened. |

Three consequences of this grouping are worth knowing, because they are not obvious from the names:

- **Offer Declined and Offer Rescinded sit in the Rejected stage.** The table's Active filter hides them and the "still active" count on the Total Applied card excludes them, yet they still count toward True Offer Rate, because reaching either one means an offer existed.
- **Ghosted is not a response.** It is deliberately excluded from True Response Rate, which is the point of having a separate status for it rather than leaving an application at Applied forever.
- **On Hold and Waiting for Response are treated as finished when the Total Days column is calculated.** That column stops climbing while an application sits in either status, even though the application is still live in ordinary terms. The Status Age column keeps climbing normally.

---

## 3. Moving an application through the pipeline

There is no enforced sequence. The status list is flat, every status is selectable at any time, and you can jump from Applied straight to Offer Received or back to an earlier stage without complaint. Nothing warns you, and nothing prevents it.

To move an application, open it for editing and change the STATUS field. When you save with a different status than you started with, three things happen:

1. The moment of the change is recorded, which resets the **Status Age** column to zero and feeds the stage-timing charts.
2. A "Status changed from X to Y" entry is added to that application's history.
3. If the new status is one of the seven interview statuses, the INTERVIEW DATE field appears the next time you open the form.

If you are recording a change that happened days ago, edit the **STATUS CHANGED DATE** field in the same session and set it to when the change actually occurred. That field is only offered on existing applications, and only that field will backfill the timing.

Every other edit is recorded too. Changing a salary figure, a location or the notes adds a field-change entry to the history alongside the status changes.

---

## 4. Viewing an application and its history

Open the read-only detail view by clicking the company name in the table, or by selecting a row with `j` and `k` and pressing Enter. Close it with the **Close** button, the Escape key, or a click outside it.

The detail view shows, in order: a colored status chip, the company and role, a grid of Level, Applied, Location, Work Type, Salary Range and Last Updated, then the interview date, the job posting link, the job description, the contact details and the notes. Fields you left empty are shown as a dash rather than omitted, so you can see at a glance what is missing.

At the bottom is the **Activity Timeline**, the recorded history for that application, newest entry first. Each entry has a timestamp and a description:

**Table 3.** *The kinds of entry that appear in the Activity Timeline.*

| Entry | What it means |
| --- | --- |
| Application created | The record was created. Every application has exactly one of these. |
| Status changed from X to Y | You moved the application to a different status. |
| Interview scheduled for {date} | An interview date was set for the first time. |
| Interview rescheduled from {old} to {new} | An existing interview date was changed. |
| Note added | A note was recorded. |
| {field} updated from {old} to {new} | Any other field changed. The field is named as the system names it internally, so you may see `positionTitle` rather than "Role". |

The timeline is the only history view in the interface. There is no stage-by-stage journey or timeline chart on the detail view, despite the name appearing in some parts of the project.

---

## 5. Editing and deleting

To edit, click **Edit** on the row, or select the row and press `e`. The form opens filled in, with "Edit Application" as its title. It is the same form described in [section 1](#1-adding-an-application), with the STATUS CHANGED DATE field added at the bottom.

To delete, click **Del** on the row, or select the row and press Delete or Backspace. Your browser asks "Are you sure you want to delete this application?" and the deletion happens when you confirm.

> [!WARNING]
> Deleting is permanent and immediate. There is no undo, no trash, and no export. The application's entire recorded history is deleted with it. If you are unsure, set the status to Withdrawn instead: that keeps the record and its history while taking it out of the Active view.

To clear out many at once rather than one at a time, use the Danger Zone in the Settings dialog, which can delete all your closed-out applications or all of them outright. See [settings and shortcuts](./05-settings-and-shortcuts.md#5-deleting-applications-in-bulk). Note that setting something to Withdrawn to get it out of the Active view does put it in range of that bulk delete.

---

## 6. Finding things again

The toolbar above the table has three tools, and they combine: the search filters what the chips have already filtered, and the sort applies to what is left.

**Search.** Type in the box, or press `/` to jump straight to it. Matching is case-insensitive and matches anywhere in the text, but it only looks at the company name and the role. Searching for a location, a note or a level finds nothing.

**Filter chips.** Ten chips sit next to the search box:

- **All** shows everything loaded.
- **Active** is the default, and hides the four statuses in the Rejected stage: Rejected, Offer Declined, Offer Rescinded and Ghosted. Note that it keeps Withdrawn and On Hold, so the row count under an Active filter can be higher than the "still active" figure on the Total Applied stat card, which also excludes Withdrawn.
- The remaining eight (Applied, Recruiter, Technical, Reference, Offer, Rejected, Waiting, Withdrawn) each show one stage from Table 2.

**Sorting.** Click any column heading to sort by it. The default is Last Update, newest first.

Sorting has two limitations worth knowing before you rely on it. First, there is no direction toggle: clicking a heading a second time does nothing, so date and duration columns are always newest or longest first, and text columns are always A to Z. Second, the small downward arrow appears on whichever column is active regardless of the actual direction, so it points down even on an A-to-Z sort. The Salary column also sorts as text rather than as a number, which puts 90,000 after 150,000.

**The twelve columns** are Company, Role, Level, Status, Location, RTO, Salary, Applied, Status Age, Total Days, Last Update, and Actions. Three of them read oddly at first:

- **Status Age** is days since the status last changed, colored green under a week, amber under two weeks and red beyond that.
- **Total Days** is the whole lifetime of the application, from the applied date to now, or to the last update for applications counted as finished.
- **Salary** is shown in thousands, for example `$120k-$150k`. An application with only one of the two figures filled in shows the missing side as `$0k`.

The Applied and Last Update columns show a month and a day but no year, so applications from different years look alike in the table. The detail view shows full dates.

**With a lot of records.** There is no paging. When more than 25 rows survive your filters the table becomes a scrolling area with the headings pinned at the top; below that it just grows down the page. The footer reads `{shown} of {loaded} applications`, which is the quickest check on whether a filter is hiding something.

There is a hard ceiling: only your first 100 applications are loaded when the dashboard opens, and there is no indication when you exceed it. Beyond 100 applications the table shows a subset while the stat cards, which are calculated on the server, continue to reflect everything you have recorded. The two will disagree, and the table is the one that is incomplete.

---

## See also

- [Dashboard and navigation](./02-dashboard-and-navigation.md), for the stat cards and charts that these records feed.
- [Analytics and insights](./04-analytics-and-insights.md), for exactly how each rate is calculated from the statuses in Table 2.
- [Settings and shortcuts](./05-settings-and-shortcuts.md), for the complete keyboard reference.
- [Troubleshooting](./06-troubleshooting.md), for what to do when a save or a delete fails.

*Documentation current as of Job Tracker 2.0.0 (August 2026). Source of truth is the code; report drift as an issue.*
