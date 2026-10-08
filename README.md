# PRD — NFC Public Web (Reputation Shield)

This folder contains the Product Requirement Document for the **NFC Public Web**, a lightweight middleware/landing page accessed by customers when they tap their phone on an in-store NFC card or scan a QR code at a table/cashier.

## Table of Contents

1. [Overview & Objective](./01-overview.md)
2. [User Persona & User Journey](./02-user-persona-journey.md)
3. [Feature — Route Handler `/r/[slug]`](./03-feature-route-handler.md)
4. [Feature — Rating & Feedback UI](./04-feature-rating-ui.md)
5. [Database Schema](./05-database-schema.md)
6. [Non-Functional Requirements](./06-non-functional-requirements.md)

## Agent Engineering Briefs

Role-specific implementation briefs for AI agents:
- **Master Coordination:** [briefs/README.md](./briefs/README.md)
- **Front-End Agent:** [briefs/front-end/README.md](./briefs/front-end/README.md)
- **Back-End Agent:** [briefs/back-end/README.md](./briefs/back-end/README.md)
- **QA Agent:** [briefs/qa/README.md](./briefs/qa/README.md)

## Quick Summary

- **Core idea:** Customer taps an NFC card → lands on `/r/[slug]` → system logs the visit → customer rates 1–5 stars → high ratings (4–5) are redirected to Google Reviews, low ratings (1–3) are captured internally (form or WhatsApp) to shield the store's public reputation.
- **Performance target:** TTFB under 300ms, full page load under 1 second.
- **Stack hint:** Supabase/PostgreSQL for the database layer.
