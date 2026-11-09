# 21st editorial integration — private release notes

Date: 2026-11-09
Branch: design/21st-services-editorial-v1 (based on the newest *local* Windows main, which includes unsynced consent provenance changes).
Production change: NONE.

Preview after build: dist/studio/21st-services/index.html
Source: scripts/21st-editorial-study.mjs
Test: tests/21st-editorial.test.mjs

This is an architecture-compatible, zero-framework-cost adaptation of the MIT 21st Editorial service-list pattern, not a downloaded full site template. The normal NiteRun Services public home, quote form, privacy notices, canonical URLs, sitemap and DNS are unaffected. No money, bookings, outreach or customer records are created.

What is intentionally different from the original:
- NITERUN brand typography, service taxonomy, and real scope statements
- Numbered editorial rows instead of cards
- No arrow icon; plain "DETAILS" and "CLOSE" labels
- Understated sticky glass on navigation only
- Keyboard-operable accordion with aria-expanded, aria-hidden, and reduced-motion support
- Real links to existing service pages and the existing quote-request form
- No invented project photography

To evaluate: run npm run check, open preview locally, inspect desktop/mobile at 1440/390, activate every row, verify focus and navigation. Only approve incorporation into the main public route after founder art-direction review and rigorous intake regression checks.

Real-time tracking note: this page is a *visual experiment*; it does not display live buyer/revenue data. Financial and execution truth must come from permission-scoped CRM/payment ledgers and independent payment reconciliation.
