# DNS Lens — Feature Improvement Task Sheet

> Product/feature improvements focused on usefulness, clarity, and daily workflow — **not billing**.
>
> Companion to `PRODUCT_TASK_SHEET.md` (monetization roadmap). Use this sheet first.
>
> **Status:** Planning only — no implementation started.
> **Last updated:** 2026-07-14

---

## How to read this sheet

| Field | Meaning |
|-------|---------|
| **ID** | Unique task reference |
| **Priority** | P0 = high impact now, P1 = strong next, P2 = nice-to-have, P3 = later |
| **Effort** | S = days, M = 1–2 weeks, L = 3+ weeks |
| **Depends on** | Blocker task IDs |
| **Area** | Feature group |

---

## Guiding principles

1. Improve the **free check experience** before accounts or payments.
2. Prefer features that answer: *Did it propagate? Where is it stuck? What should I do next?*
3. Reuse existing strengths: live WebSocket stream, bulk mode, timeline, globe, filters.
4. Ship clarity before coverage (more resolvers come after consensus/expected-value UX).

---

## Recommended build order (first 6–8 weeks)

| Wave | Focus | Task IDs |
|------|--------|----------|
| **Wave 1** | Clarity of results | C-101, C-102, C-103, U-101, U-102 |
| **Wave 2** | Workflow stickiness | W-101, W-102, H-101, R-101 |
| **Wave 3** | Propagation intelligence | I-101, I-102, I-103, G-101 |
| **Wave 4** | Bulk + trust | B-101, B-102, R-102, D-101 |
| **Wave 5** | Depth expansion | T-101, T-102, H-201, X-101 |

---

## Area C — Consensus & result clarity

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| C-101 | Consensus summary card after each check | P0 | M | — | ✅ Done — `ConsensusSummaryCard` + `lib/consensus.ts` |
| C-102 | Expected-value assertion (optional input) | P0 | M | — | ✅ Done — SearchForm field + mismatch highlight |
| C-103 | Result chips: Distinct / Consensus / Pending / Failed | P0 | S | C-101 | ✅ Done — `ResultChipsRow` on consensus + table |
| C-104 | One-click copy answer / server / full row | P1 | S | — | ✅ Done — table + globe `CopyButton` |
| C-105 | Diff mode: current run vs previous run | P1 | M | H-101 | ✅ Done — session snapshot via `previousRunResults` (no H-101 yet) |
| C-106 | Smarter empty/error next-actions | P2 | S | — | ✅ Done — `lib/resultHints.ts` tips under consensus/table |

---

## Area U — URL, share & keyboard UX

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| U-101 | Shareable check URLs (`?domain=&type=&mode=`) | P0 | S | — | Deep-link reopen; sync on submit |
| U-102 | Copy share link button on results | P0 | S | U-101 | |
| U-103 | Keyboard shortcuts (submit, pause, switch mode) | P1 | S | — | Document in UI tooltip |
| U-104 | Mobile default tab = Summary (not Filters) | P1 | S | C-101 | Needs summary panel on mobile |
| U-105 | Persist last form state in query/local storage | P1 | S | U-101 | Survive refresh without accounts |

---

## Area W — Watch / live workflow

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| W-101 | “Watch until propagated” session mode | P0 | M | C-101 | Re-check or keep listening until threshold |
| W-102 | Configurable full-propagation threshold (e.g. 95%) | P1 | S | W-101 | |
| W-103 | Stall detection (“no progress for N minutes”) | P1 | M | W-101 | Banner + timeline annotation |
| W-104 | First-seen + full-propagation timestamps card | P0 | M | — | Extend timeline meta into hero/results summary |
| W-105 | Pause/resume with clear stream state recovery | P1 | S | R-101 | Tie into reconnect |

---

## Area I — Propagation intelligence

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| I-101 | Per-resolver TTL remaining display | P0 | M | — | From DNS answers where available |
| I-102 | Rough ETA (“may update in ~Xm”) from TTL | P1 | M | I-101 | Heuristic, label as estimate |
| I-103 | Regional rollup (EU / NA / APAC / Other) | P0 | M | — | Group current resolvers by region |
| I-104 | Stale / outlier resolver highlighting | P1 | S | C-101 | Visual flag when answer ≠ consensus |
| I-105 | Consistency score (0–100%) | P1 | S | C-101 | Alias of refined propagation % |
| I-106 | Negative caching / NXDOMAIN path notes | P2 | M | — | Explain soft-fail / old cache behavior |
| I-107 | Authoritative vs recursive query toggle | P1 | L | T-102 | Query domain NS directly vs public resolvers |

---

## Area G — Globe & map usefulness

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| G-101 | Click globe pin → focus matching table row | P0 | M | — | Bidirectional selection sync |
| G-102 | Filter presets: Mismatch only / Stale only / Failed only | P1 | S | C-101, I-104 | Reuse ResolverFilters |
| G-103 | Regional color heat on globe by agreement | P2 | M | I-103 | Soft encoding, keep accessible |
| G-104 | Hide/show legend density on small screens | P2 | S | — | Reduce mobile clutter |

---

## Area B — Bulk domain workflow

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| B-101 | Per-domain progress strip during bulk run | P0 | M | — | e.g. `example.com 100% · openai.com 62%` |
| B-102 | Clear invalid-entry triage (fix / remove / reparse) | P0 | S | — | Improve BulkInput invalid UX |
| B-103 | CSV import (domain[,recordType]) | P1 | M | — | |
| B-104 | Side-by-side domain compare view | P1 | L | C-101 | Two active domains / consensus cards |
| B-105 | Bulk “watch until all done” | P2 | M | W-101, B-101 | |
| B-106 | Paste helper: detect comma vs newline ambiguity | P2 | S | — | Reduce parser surprises |

---

## Area H — Local history (no accounts)

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| H-101 | Local run history (last 10 checks in browser) | P0 | M | — | localStorage; domain, type, time, summary |
| H-102 | Re-run from history with one click | P0 | S | H-101, U-101 | |
| H-103 | Optional clear history control | P1 | S | H-101 | Privacy-friendly |
| H-104 | History entry shows consensus snapshot | P1 | S | H-101, C-101 | |

---

## Area R — Reliability & trust

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| R-101 | WebSocket auto-reconnect with backoff | P0 | M | — | Preserve clientId/token flow if possible |
| R-102 | Clear Connecting / Connected / Reconnecting states | P0 | S | R-101 | Already partially present; harden |
| R-103 | Job resume / “still running” after reconnect | P1 | L | R-101 | Best-effort; document limitations |
| R-104 | Mock vs live data labeling | P1 | S | — | Never confuse demo/fallback with live DNS |
| R-105 | Prefer-reduced-motion audit across results UI | P2 | S | — | Keep accessibility |

---

## Area T — Timeline depth

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| T-101 | Auto-capture richer snapshots during live run | P0 | M | — | Improve density of timeline points |
| T-102 | Timeline annotations (manual or auto events) | P1 | M | T-101 | “cutover started”, “stall”, “threshold hit” |
| T-103 | Export timeline as CSV | P1 | S | — | Beside existing JSON export |
| T-104 | Export summary report as Markdown | P2 | S | C-101 | Easy paste into tickets |
| T-105 | Zoom / brush on timeline when many points | P2 | M | T-101 | |

---

## Area X — Record & resolver coverage

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| X-101 | Add record types: SOA, SRV, CAA | P1 | M | — | PTR may need reverse IP UX |
| X-102 | PTR lookup mode (IP → name) | P2 | M | X-101 | Separate input path |
| X-103 | Expand public resolvers (8 → 20) | P1 | L | — | After Wave 1–3 so UI can handle density |
| X-104 | Expand resolvers (20 → 30+) | P2 | L | X-103 | |
| X-105 | Custom resolver IP (advanced, local-only first) | P3 | M | — | Power-user; defer if risky |

---

## Area D — Diagnostics / health (optional section)

> Keep under Results as an expandable panel — not a separate product yet.

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| D-101 | Lightweight health panel after check | P1 | M | — | NS list, SOA basic fields |
| D-102 | SPF quick validation | P1 | M | D-101 | Pass / warn / fail with explanation |
| D-103 | DMARC quick validation | P1 | M | D-101 | |
| D-104 | DKIM selector probe (optional selector input) | P2 | M | D-101 | |
| D-105 | Combined DNS health score (simple) | P2 | M | D-102, D-103 | Don’t overclaim |
| D-106 | Cutover checklist generated from observed TTLs | P2 | S | I-101 | Educational CTA |

---

## Area E — Education & examples

| ID | Task | Priority | Effort | Depends on | Notes |
|----|------|----------|--------|------------|-------|
| E-101 | Post-check explanation from observed TTLs | P1 | S | I-101 | “Why this may still take time” |
| E-102 | Scenario examples gallery | P2 | S | U-101 | Preload sample domains / record types |
| E-103 | Cutover checklist content page/section | P2 | S | — | NS change, mail migration, CDN switch |
| E-104 | Inline glossary for TTL / NXDOMAIN / CNAME chain | P3 | S | — | |

---

## Explicitly out of scope for this sheet

| Topic | Where it lives instead |
|-------|------------------------|
| Accounts, Stripe, plans, quotas | `PRODUCT_TASK_SHEET.md` Phase 0 / Pro |
| Continuous cloud monitors & email/Slack alerts | `PRODUCT_TASK_SHEET.md` Phase 1–2 |
| Team seats, SSO, white-label | `PRODUCT_TASK_SHEET.md` Phase 5 |
| Change management / rollback workflows | `PRODUCT_TASK_SHEET.md` Phase 6 |

Local history + watch-until-done are **in scope** here because they work **without billing**.

---

## Definition of done (per task)

A task is done when:

1. Feature works in single **and** bulk modes where relevant.
2. Desktop + mobile don’t break primary check flow.
3. E2E covers the happy path or an existing test is updated.
4. Empty/error/loading states are intentional.
5. No new hard dependency on accounts or payments.

---

## Task count summary

| Area | Tasks |
|------|-------|
| C — Consensus & clarity | 6 |
| U — URL / share / keyboard | 5 |
| W — Watch workflow | 5 |
| I — Propagation intelligence | 7 |
| G — Globe usefulness | 4 |
| B — Bulk workflow | 6 |
| H — Local history | 4 |
| R — Reliability & trust | 5 |
| T — Timeline depth | 5 |
| X — Coverage | 5 |
| D — Diagnostics | 6 |
| E — Education | 4 |
| **Total** | **62** |

---

## Suggested MVP slice (ship first)

If you only do **10 tasks**, do these:

1. **C-101** Consensus summary card  
2. **C-102** Expected-value assertion  
3. **C-103** Result chips  
4. **U-101** Shareable check URLs  
5. **W-101** Watch until propagated  
6. **W-104** First-seen / full-propagation timestamps  
7. **I-103** Regional rollup  
8. **H-101** Local run history  
9. **R-101** Socket auto-reconnect  
10. **B-101** Bulk per-domain progress strip  

These make DNS Lens feel like a **workflow tool**, not only a prettier one-off checker.

---

*Planning only. Update statuses in this file as features are scoped, built, and shipped.*
