# 2. User Persona & User Journey

## A. Persona

**Store Customer**
- Sitting at a cafe/restaurant table, or waiting at the cashier counter.
- Using an Android or iPhone device.
- Has a short/low attention span — the experience must be instant and frictionless.

## B. User Journey

1. The customer taps their phone on the NFC card at the table.
2. The phone's default browser opens the link: `https://domain.com/r/[slug]`.
3. The server validates the `slug` and asynchronously logs visit metadata to the database.
4. The customer sees a minimal interface: **"Rate your experience (1–5 stars)."**
5. **Condition A — Rating 4 or 5:** The system immediately redirects the customer to the store's official Google Business Profile review link.
6. **Condition B — Rating 1, 2, or 3:** A short internal feedback form appears, or a direct "Chat via WhatsApp" button to the store manager is shown.
