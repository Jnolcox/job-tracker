# Analytics and insights

> **Audience:** People using Job Tracker who want to know what the numbers mean.  ·  **Scope:** Every stat card and chart on the dashboard: the question it answers, how to read it, and what it deliberately does not tell you.

Job Tracker computes about a dozen different views of your application history. Most of them are honest about a fact that is easy to miss: they look at where each application stands **right now**, not at everything that happened to it. This page explains each view, and it spends the last three sections on the places where two views will show you different things about the same application. That is expected, and knowing why saves a lot of confusion.

## Contents

- [1. How almost every number is calculated](#1-how-almost-every-number-is-calculated)
- [2. The stat cards](#2-the-stat-cards)
- [3. Pipeline, timing and salary charts](#3-pipeline-timing-and-salary-charts)
- [4. When you applied](#4-when-you-applied)
- [5. Company, location and level breakdowns](#5-company-location-and-level-breakdowns)
- [6. The three advanced views](#6-the-three-advanced-views)
- [7. Why the numbers disagree with each other](#7-why-the-numbers-disagree-with-each-other)
- [8. How much history each view needs](#8-how-much-history-each-view-needs)
- [See also](#see-also)

---

## 1. How almost every number is calculated

Each application has one status at any moment: Applied, Tech Screen, Rejected, and so on. When you change an application's status, the old one is replaced, and Job Tracker records the change. Some views read that record of what happened, and some read only where each application stands today. Which one a view uses changes what its number means.

**Pipeline Funnel** and **Status Transitions** read the record. Suppose you applied to a company, did a recruiter screen, did two technical rounds, and were then rejected. Both of those views count the stages you actually reached, so your interviews show up even though the application ended as a rejection.

The stat cards, the per-company and per-level rates, and the offer and response rates read current status only. In the same example they see one rejection and nothing else. Read them as "where is my pipeline sitting today", not "what have I been through".

One consequence worth knowing: an application you recorded before the audit trail existed has no history to read, so it contributes only its current status even to the views that would otherwise count its stages.

> [!IMPORTANT]
> Adding, editing or deleting an application refreshes the charts as well as the table, so the two halves of the dashboard agree without a page reload.

---

## 2. The stat cards

The ten cards across the top are described mechanically in [Dashboard and navigation](./02-dashboard-and-navigation.md). Table 1 covers the other half: what each one is good for and where it will mislead you.

**Table 1.** *What each stat card is useful for and what it leaves out.*

| Card | Useful for | What it does not tell you |
| --- | --- | --- |
| Total Applied | The size of what is loaded in the table right now. | Your real total, if you have recorded more than 100 applications. Only the first 100 are loaded. |
| True Response Rate | Roughly how often anybody gets back to you at all. | Whether the response was good news. A rejection counts as a response. So do the On Hold and Waiting for Response statuses, despite what their names suggest. |
| True Interview Rate | How much of your pipeline is sitting at an interview stage today. | How many interviews you have actually done. Applications that interviewed and were then rejected or withdrawn count for nothing here. The Pipeline Funnel does count them. |
| Avg Response Time | A rough sense of how long employers take. | The time to the *first* response. It measures from the applied date to the *most recent* status change, so an application that screened on day 3 and was rejected on day 60 contributes 60 days. Whole days only, rounded down: a reply in 23 hours counts as 0 days. When there is nothing to average it shows `0d`, which looks the same as a genuine zero. |
| True Offer Rate | The share of applications currently at an offer status. | Offers you walked away from. Marking an application Withdrawn removes it from this rate entirely, even if you had an offer in hand. Declined and rescinded offers, on the other hand, still count as offers. |
| In Interviews | How many loaded applications are at an interview stage. | Anything about applications past the first 100 loaded. |
| Applied → Screen | The share of all your applications currently at a recruiter screen or later. | How many ever reached a screen. Same current-status rule as the interview rate. |
| Screen → Tech | Of the applications currently at screen or later, the share currently at a technical stage or later. | A real stage-to-stage conversion. Both halves are snapshots, not counts of people who progressed. |
| Weekly Pace | Your average applications per week. | A sensible number when you have very little data. With fewer than two applications, or with all of them on the same day, it reports the raw count instead of a rate. Over a very short span it inflates badly: 50 applications sent across two consecutive days works out to 350 per week. |
| Current Offers | How many loaded applications are at Offer Received, Negotiating or Offer Accepted. | Offers on applications past the first 100 loaded. |

---

## 3. Pipeline, timing and salary charts

### Pipeline Funnel

Answers: where is my pipeline sitting right now?

One horizontal bar per pipeline group, sized by how many applications currently hold a status in that group. The groups are Applied, Recruiter, Technical, Reference, Offer, Rejected, Waiting and Withdrawn.

What it does not tell you: it is a snapshot, not a funnel over time. A short Technical bar does not mean you rarely reach technical rounds; it means few applications are sitting there today. Bars do not shrink from left to right the way a conversion funnel does, because a rejected application leaves whatever group it was in and joins Rejected.

### Max Days in Stage

Answers: what is the single longest-neglected application in each part of my pipeline?

For each pipeline group except Rejected, the chart shows the largest number of days any one application has spent in its current status, labeled with the company that holds the record.

What it does not tell you: an average. One application stuck for 90 days makes the bar 90 days long no matter how healthy the other nine are. Where an application has no recorded status change, the count runs from the applied date instead, which makes newly imported or seeded applications look older in their stage than they are.

### Salary Range Distribution

Answers: what pay bands am I actually applying into?

One dot per application that has a salary figure recorded, with the minimum on the horizontal axis and the maximum on the vertical. Dashed crosshair lines mark the average minimum and the average maximum. Hovering a dot names the company.

What it does not tell you:

- Applications with only one of the two figures are not skipped. The missing figure is filled in with the one you did record, which places the dot exactly on the diagonal and pulls both averages toward that single number. A posting where you recorded only an upper bound raises the average minimum.
- It is not a picture of live opportunities only. Rejected, withdrawn and ghosted applications are excluded, but accepted, declined and rescinded offers are not.
- It says nothing about what you were offered. These are the ranges you recorded on the posting.

---

## 4. When you applied

Three charts describe your own behavior rather than employers'.

**Table 2.** *The timing charts and their limits.*

| Chart | Answers | What it does not tell you |
| --- | --- | --- |
| Applications by Day of Week | Which weekdays you send applications on, Monday first. | Anything about when employers reply. It counts applied dates only. |
| Applications by Hour | Which hours of the day you send applications in, across 24 bars. | The same. It also says nothing about whether the hour affects your results. |
| Application Activity | A full-year grid, one cell per day, shaded by how many applications you sent that day. Hovering a cell shows the date and count. | Any year other than the current one. There is no year picker, and no way to see last year's grid from the interface. Days before you started using Job Tracker look identical to days when you sent nothing. |

One caveat applies to all three: the day and hour buckets are calculated using the clock of the machine running the backend, not your own. If you run Job Tracker on your own laptop this makes no difference. If the backend runs somewhere else, in a container set to UTC for instance, an application you sent at 11pm local time can be counted as the following day.

---

## 5. Company, location and level breakdowns

### Company Insights

Answers: which companies respond to me and which ignore me?

Your five most-applied-to companies, each with a Response rate, a Ghost rate, an Interview rate and an average response time. The header reads "Top 5 of N", where N is how many distinct companies you have applied to.

What it does not tell you:

- Company names are matched as exact text. `Google`, `google` and `Google ` with a trailing space are three separate companies with three separate sets of rates. Type company names consistently or this view fragments.
- The rates use current status, so the interview rate here has the same downward bias described in [section 1](#1-how-almost-every-number-is-calculated).
- The average response time can be blank for a company where no application has both an applied date and a recorded status change.

### Location & RTO Insights

Answers: where are the jobs I apply to, and what work arrangements do they offer?

Your five most common locations with an application count, a salary band and a success rate, followed by a breakdown by work arrangement (Remote, the hybrid options, Onsite).

What it does not tell you:

- Locations are also matched as exact text. `Austin, TX` and `austin, tx` are two locations. Applications with no location recorded are grouped as "Not Specified".
- The two ends of the salary band are averaged over different sets of applications: the average minimum over those that have a minimum, the average maximum over those that have a maximum. They are not two ends of one range, and an average minimum above the average maximum is possible.
- The work arrangement rows show only the count and the share. Their salary and success figures are calculated but not displayed.

### Position Level Insights

Answers: how do I do at each seniority level?

A row per Level value you have used, with an application count, a share of the total, a Success rate and an Interview rate, plus a salary band.

What it does not tell you: this groups by the **Level** field you chose on the form, not by the job title. It is a different grouping from the "Success by Position" section inside Funnel Analytics, which reads keywords out of the title. The two will not agree. Applications with no Level set are grouped as "Not Specified".

---

## 6. The three advanced views

These three are switched off by default. Turn them on in the Settings dialog; see [Settings and shortcuts](./05-settings-and-shortcuts.md).

### Status Transitions

Answers: what path do my applications actually take?

A grid of counts. Each cell is the number of times an application moved from the status on the left to the status along the top, shaded darker as the count rises. A total appears in the corner of the panel.

This is the only view on the dashboard built from recorded history rather than current status. It is where the three interview rounds from [section 1](#1-how-almost-every-number-is-calculated) actually show up.

What it does not tell you:

- Anything about applications whose status you have never changed inside Job Tracker. Only changes you make by editing an application are recorded. Applications created already at a later status contribute nothing.
- Anything about a deleted application. Deleting an application erases its recorded history too, and this grid shrinks accordingly.
- Anything in pipeline order. The rows and columns are ordered by how frequently the transitions appear, not by where the statuses sit in the pipeline, so the grid does not read diagonally.
- Anything at all on a fresh installation with the demo data. The five sample applications are created directly in the database with no history behind them, so this view reads "No transition data available" until you change a status yourself.

### Funnel Analytics

Answers: where do applications drop out, and what succeeds?

Five blocks in one panel:

- **Overall Success**, the share of applications currently at any offer status.
- **Stage Conversion**, which shows exactly one row, Applied, giving the share of applications that have moved off Applied to anything else. The layout suggests a row per stage; the other rows are never populated. This is a known limitation, not empty data.
- **Response Breakdown**, an estimate of interviewed, ghosted, rejected and active counts. It is worked back from the percentages above rather than counted directly, so it can be off by a rounding.
- **Drop-Off Points**, a bar per terminal status with a count and a percentage of your total. Note that Offer Accepted is included here, which is not a drop-off in any ordinary sense of the word.
- **Success by Position**, grouped by a keyword found in the job title: Principal, Staff, Senior, Lead, Junior, Mid-Level, Intern or Entry Level.

What Success by Position does not tell you: titles with none of those keywords are dropped from the section entirely, so the counts in it do not add up to your total. Matching is a plain text search inside the title, so "Internal Tools Engineer" is filed under Intern and "Leadership Program Analyst" under Lead. "Junior Team Lead" is filed under Lead, because Lead is checked before Junior.

### Application Health

Answers: what needs my attention this week?

Four tiles across the top (Stale, Hot, Quick Wins, Active), then three short lists and a condensed count of quick rejections.

**Table 3.** *What each part of the Application Health panel counts.*

| Part | Counts | What to know |
| --- | --- | --- |
| Stale | Non-terminal applications with nothing recorded for 14 days, longest first. | Recorded activity means any edit you made, not just a status change. Fixing a typo in a phone number resets an application's staleness clock. Applications with no recorded activity at all fall back to the applied date. |
| Hot | Applications with three or more recorded changes in the last seven days. | One save that changes three fields records three changes, so a single tidy-up session can make an application "hot". Rejected and ghosted applications are not excluded, so a recently rejected one can appear here. |
| Quick Wins | Applications that reached an offer status within seven days of the applied date. | Offer Received and Negotiating count, so an application still in negotiation appears here as a resolved win. |
| Quick Rejections | Applications that reached a negative terminal status within seven days. | An offer you declined or that was rescinded within seven days appears in both this list and Quick Wins, and is counted in both totals. That double count is a known defect. |
| Active | Everything not in a terminal status. | This includes On Hold and Waiting for Response, so it is a looser definition of "active" than the one behind the Total Applied card. |

On a fresh installation with only the demo data, this panel is nearly empty, because the sample applications carry no recorded history.

---

## 7. Why the numbers disagree with each other

Three specific disagreements come up often enough to name.

**The Status Transitions grid shows interviews your interview rate does not.** This is the big one. The grid counts the moves you made; the rate counts where the application sits now. An application that went Applied, then Recruiter Screen, then Technical I, then Rejected puts three cells on the grid and contributes zero to the interview rate. If you compare the two you will conclude one of them is broken. Neither is. They are answering different questions, and only the grid is answering the one about history.

**"Active" means two different things.** The applications table's Active filter hides rejected, declined, rescinded and ghosted applications but keeps withdrawn ones. The "N still active" line under the Total Applied card also drops withdrawn ones. The Application Health panel's Active tile counts everything not terminal, which keeps On Hold and Waiting for Response. If you have any withdrawn or on-hold applications, these three counts will differ.

**Withdrawing an application erases it from your success figures.** Withdrawn belongs to none of the sets behind the response rate, the interview rate or the offer rate. If you withdraw from a process after receiving an offer, that offer disappears from your offer rate, your overall success rate, and every per-company, per-location and per-level success rate. It shows up only as a drop-off point and, if it resolved quickly, in the quick rejections count. If you want your offer rate to reflect an offer you turned down, use Offer Declined rather than Withdrawn.

---

## 8. How much history each view needs

Several views are technically working but meaningless on small data. Table 4 is a rough guide.

**Table 4.** *When each view starts to be worth reading.*

| View | Needs before it means much |
| --- | --- |
| Stat card rates | Around twenty applications. With three, one rejection swings a rate by 33 points. |
| Weekly Pace | At least two applications sent on different days. Below that it reports the raw count. |
| Applications by Day of Week, Applications by Hour | Several weeks of applications, or the shape is one or two tall bars. |
| Application Activity | A month or more. A near-empty year grid is normal early on. |
| Pipeline Funnel, Max Days in Stage | Enough applications to have some in more than one stage. |
| Salary Range Distribution | Salary figures actually filled in. Applications without them are simply absent from the chart. |
| Company Insights | Repeat applications to the same company. A company with one application shows 0% or 100% on every rate. |
| Location & RTO, Position Level Insights | The Location, RTO and Level fields filled in consistently. |
| Status Transitions | Status changes made by editing applications inside Job Tracker. It stays empty until then, however many applications you have. |
| Application Health | Edit history. The stale and hot lists are built from recorded changes, so a freshly imported set of applications produces almost nothing. |

---

## See also

- [Dashboard and navigation](./02-dashboard-and-navigation.md), for where each of these appears on the page and what the numbers literally count.
- [Tracking applications](./03-tracking-applications.md), for the status list and how a status change is recorded.
- [Settings and shortcuts](./05-settings-and-shortcuts.md), for turning the three advanced views on.
- [Known gaps](../development/11-known-gaps.md), for the current list of defects behind the limitations described here.
- [Analytics internals](../development/05-analytics-internals.md), if you want the exact formulas.

*Documentation current as of Job Tracker 2.1.0 (August 2026). Source of truth is the code; report drift as an issue.*
