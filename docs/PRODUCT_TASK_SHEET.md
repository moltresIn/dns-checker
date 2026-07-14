# DNS Lens — Product Task Sheet

> Monetization & feature roadmap based on competitor research (DNSChecker.org, WhatsMyDNS, DNSChkr, ZoneWatcher, DNS Check, VectorDNS, Trace Warrior, StatusDrift, Oh Dear, Site24x7).
>
> **Status:** Planning only — no implementation started.
> **Last updated:** 2026-07-12

---

## How to read this sheet

| Field | Meaning |
|-------|---------|
| **ID** | Unique task reference |
| **Priority** | P0 = must-have for paid launch, P1 = strong revenue driver, P2 = differentiation, P3 = enterprise / later |
| **Tier** | Which paid plan the feature belongs to |
| **Effort** | S = days, M = 1–2 weeks, L = 3+ weeks, XL = major initiative |
| **Depends on** | Blocker task IDs |

---

## Phase 0 — Foundation (required before any paid tier)

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| F-001 | User accounts (sign up, login, password reset) | P0 | All paid | L | — | Email or OAuth (Google/GitHub) |
| F-002 | Workspace / organization model | P0 | Team+ | M | F-001 | Single user → team upgrade path |
| F-003 | Billing integration (Stripe) | P0 | All paid | L | F-001 | Subscriptions, invoices, webhooks |
| F-004 | Plan & quota enforcement middleware | P0 | All paid | M | F-003 | Domains, checks/day, API calls, history retention |
| F-005 | Persistent database (replace in-memory stores) | P0 | All paid | L | — | Cache, rate limits, timeline, monitors |
| F-006 | Production deploy pipeline (CI/CD, Docker) | P0 | — | M | — | Blocker from prod-readiness audit |
| F-007 | Legal pages (Terms, Privacy, GDPR basics) | P0 | All paid | S | — | Required for payments in EU/US |
| F-008 | Marketing landing page with pricing table | P0 | — | M | F-003 | Free vs Pro vs Team vs Business |

---

## Phase 1 — Pro tier ($9–18/mo)

*Target user: solo dev, freelancer, small site owner who needs monitoring, not just lookups.*

### 1.1 Monitoring & alerts

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| P-101 | Saved domain library (per account) | P0 | Pro | M | F-001, F-005 | Bookmark domains + record types |
| P-102 | Scheduled DNS monitors (cron-based checks) | P0 | Pro | L | P-101, F-005 | Configurable interval (e.g. 1h, 6h, 12h) |
| P-103 | Record change detection (compare snapshot vs last) | P0 | Pro | M | P-102 | Alert when A/MX/TXT/etc. changes |
| P-104 | Expected-value assertions | P1 | Pro | M | P-103 | "Alert if A ≠ 1.2.3.4" |
| P-105 | Email alerts on change / propagation complete | P0 | Pro | M | P-103 | Instant + optional digest |
| P-106 | "Watch until propagated" mode | P1 | Pro | M | — | Extend current live check → notify at 95%+ |
| P-107 | Alert on propagation stall / timeout | P1 | Pro | M | P-106 | No progress for N minutes |

### 1.2 History & reporting

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| P-201 | Persistent propagation timeline (30-day retention) | P0 | Pro | M | F-005 | Upgrade from in-memory timeline |
| P-202 | Change history log per domain | P0 | Pro | M | P-103 | Timestamped before/after values |
| P-203 | Shareable check URLs (`?domain=&type=`) | P1 | Pro | S | — | Pre-filled links for clients |
| P-204 | Export results as JSON (existing) → add CSV | P2 | Pro | S | — | |
| P-205 | Export propagation report as PDF | P1 | Pro | M | P-201 | For agencies / postmortems |
| P-206 | PNG/map screenshot export | P2 | Pro | M | — | Compete with WhatsMyDNS export |

### 1.3 Limits & experience

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| P-301 | Raise bulk domain limit (20 → 50) | P1 | Pro | S | F-004 | |
| P-302 | Ad-free experience flag | P1 | Pro | S | — | If ads added to free tier later |
| P-303 | Higher rate limits vs free | P0 | Pro | S | F-004 | e.g. 60 checks/min vs 15 |
| P-304 | Check history in dashboard | P1 | Pro | M | P-101 | Recent runs per saved domain |

---

## Phase 2 — Team tier ($29–69/mo)

*Target user: DevOps team, startup infra, agency with multiple domains.*

### 2.1 API & automation

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| T-101 | REST API for single propagation check | P0 | Team | M | F-001, F-004 | `GET /api/v1/propagation?domain=&type=` |
| T-102 | REST API for bulk propagation job | P1 | Team | M | T-101 | Async job + poll or webhook |
| T-103 | API key management (create, revoke, scopes) | P0 | Team | M | F-001 | Dashboard UI |
| T-104 | API usage dashboard & quotas | P0 | Team | M | T-103, F-004 | Credits or requests/day |
| T-105 | Webhook on propagation complete | P1 | Team | M | T-102 | POST to customer URL |
| T-106 | Webhook on record change detected | P1 | Team | M | P-103 | |
| T-107 | CI/CD integration docs + GitHub Action example | P1 | Team | S | T-101 | "Verify DNS after deploy" |
| T-108 | Terraform provider or OpenAPI spec | P2 | Team | L | T-101 | Developer adoption |

### 2.2 Notifications

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| T-201 | Slack integration | P0 | Team | M | P-105 | Incoming webhook |
| T-202 | Microsoft Teams integration | P1 | Team | M | P-105 | |
| T-203 | Discord integration | P2 | Team | S | P-105 | |
| T-204 | PagerDuty / Opsgenie integration | P1 | Team | M | P-105 | For on-call teams |
| T-205 | Custom webhook (generic JSON payload) | P0 | Team | M | P-105 | |

### 2.3 Team & collaboration

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| T-301 | Team member invites (up to N seats) | P0 | Team | M | F-002 | Admin / member roles |
| T-302 | Shared domain library across team | P0 | Team | M | P-101, F-002 | |
| T-303 | Role-based access (admin, viewer) | P1 | Team | M | T-301 | |
| T-304 | Audit log (who ran check, who changed monitor) | P1 | Team | M | F-005 | |
| T-305 | 1-year history retention | P0 | Team | M | P-201 | Upgrade from 30-day |

### 2.4 Scale & coverage

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| T-401 | Expand resolvers (8 → 30+ global locations) | P0 | Team | L | — | Close gap vs DNSChecker/WhatsMyDNS |
| T-402 | Regional propagation summary | P1 | Team | M | T-401 | "EU: 100%, APAC: 60%" |
| T-403 | Custom resolver list (per account) | P2 | Team | M | T-401 | Google / CF / Quad9 / custom IP |
| T-404 | Authoritative nameserver direct query option | P1 | Team | M | — | Bypass resolver cache |
| T-405 | More record types (PTR, SOA, SRV, CAA) | P1 | Team | M | — | WhatsMyDNS supports more |

---

## Phase 3 — Propagation intelligence (differentiation)

*Features that go beyond "did it propagate yes/no" — inspired by DNSChkr, StatusDrift, ZoneWatcher.*

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| I-101 | Per-resolver TTL countdown display | P1 | Pro | M | T-401 | "Updates in 42 min" |
| I-102 | Cache freshness percentage per resolver | P1 | Team | M | I-101 | |
| I-103 | Global consistency score (0–100%) | P1 | Team | M | — | Extend current propagation % |
| I-104 | "Fully propagated" event (configurable threshold) | P1 | Pro | S | P-106 | e.g. 95% of resolvers agree |
| I-105 | Per-resolver first-seen timestamp | P1 | Team | M | P-201 | When each resolver picked up change |
| I-106 | Estimated time-to-full-propagation | P2 | Team | L | I-101, I-105 | Predictive model from TTL + history |
| I-107 | Negative caching / NXDOMAIN propagation tracking | P2 | Team | M | — | |
| I-108 | Response time per resolver (latency column) | P1 | Pro | S | — | Already partially in UI |
| I-109 | Stale resolver highlighting | P1 | Pro | S | I-101 | Visual flag on outlier resolvers |

---

## Phase 4 — DNS health suite (bundle value)

*Expand beyond propagation — compete with Trace Warrior / DNSChkr toolkits.*

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| H-101 | SPF record validator | P1 | Team | M | — | |
| H-102 | DKIM record validator | P1 | Team | M | — | |
| H-103 | DMARC record validator | P1 | Team | M | — | |
| H-104 | MX / mail routing health check | P1 | Team | M | — | |
| H-105 | DNSSEC validation check | P2 | Team | M | — | |
| H-106 | Nameserver / lame delegation check | P2 | Team | M | — | |
| H-107 | Combined DNS health score (0–100) | P1 | Team | L | H-101–H-106 | Single report card |
| H-108 | WHOIS / domain expiry monitoring | P2 | Pro | M | P-102 | VectorDNS includes this |
| H-109 | SSL certificate expiry monitoring | P2 | Pro | M | P-102 | Bundle with DNS |
| H-110 | Blacklist / reputation check | P3 | Team | M | — | |

---

## Phase 5 — Business / Enterprise tier ($99–149/mo)

*Target user: MSP, agency, enterprise platform team.*

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| E-101 | SAML SSO | P2 | Business | L | F-001 | |
| E-102 | 3–7 year history retention | P2 | Business | M | P-201 | ZoneWatcher offers 7yr |
| E-103 | Compliance PDF reports | P2 | Business | M | P-205 | |
| E-104 | White-label reports (agency logo) | P1 | Business | M | P-205 | |
| E-105 | Public status page per domain | P1 | Business | L | P-106 | "example.com DNS status" |
| E-106 | Multi-tenant client workspaces (MSP) | P2 | Business | XL | F-002 | Agency manages client domains |
| E-107 | Priority support SLA | P2 | Business | S | — | Process, not code |
| E-108 | Custom check intervals (down to 30s) | P2 | Business | M | P-102 | StatusDrift: 30s paid |
| E-109 | Higher API rate limits (500 req/min) | P2 | Business | M | T-104 | |
| E-110 | Dedicated resolver endpoints | P3 | Business | L | T-401 | Enterprise networking |

---

## Phase 6 — Change management (premium / future)

*Inspired by ZoneWatcher DNS change management — highest complexity, highest ARPU.*

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| C-101 | Pre-change baseline snapshot | P3 | Business | M | P-201 | |
| C-102 | Staged changeset (plan before apply) | P3 | Business | XL | C-101 | |
| C-103 | Approval workflow (reviewer signs off) | P3 | Business | L | C-102, T-301 | |
| C-104 | Live propagation dashboard during cutover | P2 | Team | M | — | Partially exists today |
| C-105 | Rollback guidance / integration (Cloudflare, Route53, etc.) | P3 | Business | XL | C-102 | API integrations per provider |
| C-106 | Post-change propagation report auto-generated | P2 | Team | M | P-205, C-101 | |

---

## Phase 7 — Free tier improvements (conversion funnel)

*Keep free useful but create clear upgrade pressure — do not over-build.*

| ID | Task | Priority | Tier | Effort | Depends on | Notes |
|----|------|----------|------|--------|------------|-------|
| FR-101 | Shareable check URL (limited, no account) | P1 | Free | S | — | Drives virality |
| FR-102 | "Sign up to save this check" CTA after run | P0 | Free | S | F-001 | Conversion hook |
| FR-103 | Show "upgrade to monitor" after check completes | P0 | Free | S | — | |
| FR-104 | Limit free history to current session only | P0 | Free | S | — | Already in-memory |
| FR-105 | Free tier rate limit messaging (15/min) | P1 | Free | S | — | Transparent upsell |
| FR-106 | Comparison table on results page (Free vs Pro) | P1 | Free | S | F-008 | |

---

## Suggested pricing packaging

| Plan | Price | Domains | Monitors | History | API | Alerts | Resolvers |
|------|-------|---------|----------|---------|-----|--------|-----------|
| **Free** | $0 | — | — | Session only | — | — | 8 |
| **Pro** | $12/mo | 10 | 10 | 30 days | — | Email | 8 |
| **Team** | $39/mo | 50 | 50 | 1 year | Yes | Email + Slack + Webhook | 30+ |
| **Business** | $99/mo | 200 | 200 | 3 years | High quota | All channels | 30+ + custom |

---

## Recommended build order (first 90 days)

### Month 1 — Ship paid foundation
1. F-001, F-005, F-006 (accounts, database, deploy)
2. F-003, F-004 (billing, quotas)
3. P-101, P-102, P-103, P-105 (monitors + email alerts)
4. P-201 (persistent timeline)
5. F-008 (pricing page)

### Month 2 — Team tier & API
1. T-101, T-103, T-104 (API + keys)
2. T-201, T-205 (Slack + webhooks)
3. T-401 (expand resolvers)
4. P-203, P-205 (shareable URLs + PDF)
5. T-301, T-302 (team seats)

### Month 3 — Differentiation
1. I-101, I-103, I-104 (TTL, consistency, full propagation event)
2. H-101, H-103, H-107 (SPF/DMARC + health score)
3. T-105, T-107 (webhooks + CI docs)
4. E-105 (status pages) — if agency demand

---

## What NOT to build early (low ROI)

| Feature | Reason |
|---------|--------|
| 3D globe monetization | Visual delight, not a purchase driver |
| More UI themes | Expected baseline, not paid feature |
| Radial menus / plasma backgrounds | No revenue correlation |
| Change management (Phase 6) | High effort, niche until core monitoring works |
| 50+ DNS health checks | Breadth before depth; start with SPF/DMARC |

---

## Competitive positioning statement

> **DNS Lens Free:** The fastest way to watch DNS propagation live — streamed row by row, not a static map.
>
> **DNS Lens Pro:** Know the moment your DNS change lands — monitors, alerts, and 30-day history.
>
> **DNS Lens Team:** Automate propagation checks in CI, alert Slack, and verify across 30+ global resolvers.
>
> **DNS Lens Business:** Client-ready reports, status pages, and compliance history for agencies and enterprises.

---

## Task count summary

| Phase | Tasks |
|-------|-------|
| Phase 0 — Foundation | 8 |
| Phase 1 — Pro | 17 |
| Phase 2 — Team | 22 |
| Phase 3 — Intelligence | 9 |
| Phase 4 — Health suite | 10 |
| Phase 5 — Business | 10 |
| Phase 6 — Change management | 6 |
| Phase 7 — Free funnel | 6 |
| **Total** | **88** |

---

*This document is planning-only. Update task status here as features are scoped, built, and shipped.*
