# NFC Public Web (filter-rating) — Multi-Agent Brief Master Index

This directory contains role-specific engineering briefs for the AI agents building and verifying the **NFC Public Web (filter-rating)** application.

---

## 1. System Overview & Architecture

The **NFC Public Web** is a lightweight, mobile-first middleware web application. Customers tap an in-store NFC card or scan a QR code at a table or cashier counter, hitting `https://domain.com/r/[slug]`. 

The system acts as a **Reputation Shield**:
- **High ratings (4–5 stars):** Redirect instantly to the store's public Google Business Profile review page.
- **Low ratings (1–3 stars):** Captured internally (private database feedback form or WhatsApp direct message) to shield public reviews and resolve customer dissatisfaction privately.
- **Direct Mode:** When the store's subscription is inactive (`is_shield_active: false`), instantly HTTP 307 redirects to Google Reviews with no intermediary UI.
- **Background Telemetry:** Logs physical card taps asynchronously, debounced (< 5s per IP/User-Agent) to avoid spam.

```
                    ┌────────────────────────┐
                    │ Customer Taps NFC / QR │
                    └───────────┬────────────┘
                                │ GET /r/[slug]
                                ▼
                    ┌────────────────────────┐
                    │ Next.js Route / Page   │
                    │   - Validate Slug      │
                    │   - Check Shield Mode  │
                    │   - Async Tap Logger   │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │ [Direct Mode / Inactive]                      │ [Shield Mode Active]
        ▼                                               ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│ HTTP 307 Instant Redirect │               │ Render Rating UI (< 1s)   │
│ to Google Maps Review URL │               │ 1–5 Interactive Stars     │
└───────────────────────────┘               └─────────────┬─────────────┘
                                                          │
                        ┌─────────────────────────────────┴─────────────────────────────────┐
                        │ [Taps 4 or 5 Stars]                                               │ [Taps 1, 2, or 3 Stars]
                        ▼                                                                   ▼
        ┌───────────────────────────────┐                                   ┌───────────────────────────────┐
        │ 300ms visual micro-feedback   │                                   │ Smooth transition to internal │
        │ Update tap_log (selected_stars│                                   │ feedback card:                │
        │ window.location.href to Google│                                   │ - Textarea (What to improve?) │
        └───────────────────────────────┘                                   │ - Submit Button -> DB         │
                                                                            │ - Direct WhatsApp Button      │
                                                                            └───────────────────────────────┘
```

---

## 2. Agent Directory & Navigation

Each agent has a dedicated brief located in its respective subfolder:

| Role | Brief Location | Core Responsibility |
|---|---|---|
| **Front-End Agent** | [`briefs/front-end/README.md`](file:///Users/tabaniii/Herd/filter-rating/briefs/front-end/README.md) | Mobile-first UI (360–430px), star rating interactions, 300ms transition delay, feedback forms, WhatsApp link formatting, fallback UI, sub-1s load budget. |
| **Back-End Agent** | [`briefs/back-end/README.md`](file:///Users/tabaniii/Herd/filter-rating/briefs/back-end/README.md) | Next.js dynamic route `/r/[slug]`, HTTP 307 redirects, Supabase schema & queries, non-blocking asynchronous tap logging, <5s IP debounce, feedback submission API. |
| **QA Agent** | [`briefs/qa/README.md`](file:///Users/tabaniii/Herd/filter-rating/briefs/qa/README.md) | End-to-end test scenarios, NFR performance benchmarking (TTFB <300ms, load <1s), anti-spam debounce tests, device matrix (360–430px), automated test suites. |

---

## 3. Inter-Agent Communication & Interface Contracts

### A. Route & Data Flow Contract
1. **Server Component → Client Component:**
   The page at `/r/[slug]` fetches the card configuration on the server:
   ```ts
   interface CardConfig {
     id: string;              // UUID
     slug: string;
     store_name: string;
     google_review_url: string;
     whatsapp_number?: string | null;
     is_shield_active: boolean;
   }
   ```
2. **Telemetry Logging API (`POST /api/telemetry/star`):**
   When a customer taps any star (1–5), the front-end asynchronously notifies the back-end to record `selected_stars` against the session/tap log.
   - Payload: `{ card_id: string, selected_stars: number, session_id?: string }`
   - Response: `{ success: true }`

3. **Feedback Submission API (`POST /api/feedback`):**
   When 1–3 star feedback is submitted:
   - Request Body:
     ```json
     {
       "card_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
       "rating": 2,
       "feedback_text": "Pelayanan agak lama saat jam makan siang"
     }
     ```
   - Response:
     ```json
     { "success": true, "message": "Feedback submitted successfully" }
     ```

4. **WhatsApp URL Protocol:**
   Target format:
   ```
   https://wa.me/{clean_whatsapp_number}?text={url_encoded_message}
   ```
   *Example message:* `Halo Tim {store_name}, saya ada masukan terkait kunjungan saya: ...`

---

## 4. Shared Tech Stack & Constraints

- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **CSS Engine:** Tailwind CSS v4
- **Database:** Supabase / PostgreSQL
- **Target Viewport:** 360px to 430px (iPhone SE, iPhone 14/15/16, Samsung Galaxy, Pixel)
- **Performance Budget:** 
  - Time To First Byte (TTFB): `< 300ms` on 4G
  - Total Interactive Load: `< 1000ms`
  - Zero heavy animation or icon libraries (keep client bundle minimal)
