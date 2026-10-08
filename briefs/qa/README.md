# QA Agent Verification & Testing Brief — NFC Public Web

**Role:** QA AI Agent  
**Domain:** End-to-End Testing, Test Automation, Performance Benchmarking, Cross-Device Verification, Security & Boundary Testing  
**Repository Context:** Next.js (App Router), Supabase / PostgreSQL  
**Parent PRD References:**
- [`01-overview.md`](file:///Users/tabaniii/Herd/filter-rating/01-overview.md)
- [`02-user-persona-journey.md`](file:///Users/tabaniii/Herd/filter-rating/02-user-persona-journey.md)
- [`03-feature-route-handler.md`](file:///Users/tabaniii/Herd/filter-rating/03-feature-route-handler.md)
- [`04-feature-rating-ui.md`](file:///Users/tabaniii/Herd/filter-rating/04-feature-rating-ui.md)
- [`05-database-schema.md`](file:///Users/tabaniii/Herd/filter-rating/05-database-schema.md)
- [`06-non-functional-requirements.md`](file:///Users/tabaniii/Herd/filter-rating/06-non-functional-requirements.md)

---

## 1. Mission & Quality Objectives

Guarantee that the **NFC Public Web (filter-rating)** operates with sub-second speeds, absolute reliability across smartphones, flawless redirect logic for high reviews, and zero data leakage for store reputation defense.

### Core Quality Metrics:
- **Redirection Accuracy:** 100% of 4–5 star taps route to Google Maps review; 0% of 1–3 star taps reach Google Maps.
- **Performance Thresholds:** TTFB `< 300ms` on simulated 4G; Total Interactive Load `< 1000ms`.
- **Anti-Spam Debounce Rate:** 100% suppression of duplicate taps from the same IP/UA within `< 5s`.
- **Mobile Usability:** 0 visual or layout defects on viewports from **360px to 430px**.

---

## 2. Test Matrix Overview

| Test ID | Test Category | Scenario | Expected Result |
|---|---|---|---|
| **TM-01** | Functional (Shield) | 5-star tap | 300ms visual delay → redirect to `google_review_url` |
| **TM-02** | Functional (Shield) | 4-star tap | 300ms visual delay → redirect to `google_review_url` |
| **TM-03** | Functional (Shield) | 3-star tap | Star UI swaps to Feedback Form (Textarea + WA + Submit) |
| **TM-04** | Functional (Shield) | 2-star tap | Star UI swaps to Feedback Form |
| **TM-05** | Functional (Shield) | 1-star tap | Star UI swaps to Feedback Form |
| **TM-06** | Functional (Direct) | Card has `is_shield_active: false` | Instant HTTP 307 redirect to Google Review, no UI flash |
| **TM-07** | Functional (Fallback)| Invalid or non-existent slug | Friendly fallback view rendered; no raw 404 or stack trace |
| **TM-08** | Ingestion | Submit internal feedback with text | Saved to `internal_feedbacks` table; thank-you state shown |
| **TM-09** | Ingestion | Submit internal feedback without text | Allowed (optional field); saved to DB; thank-you state shown |
| **TM-10** | Integration | Click WhatsApp button | Opens `https://wa.me/{clean_phone}?text={encoded_msg}` |
| **TM-11** | Integration | Card has no `whatsapp_number` | WhatsApp button gracefully hidden; form still submittable |
| **TM-12** | Telemetry | Single tap on `/r/[slug]` | Row created in `tap_logs` with parsed OS and UA |
| **TM-13** | Anti-Spam | Rapid tap x 3 within 3 seconds | Exactly 1 log entry in `tap_logs`; subsequent 2 debounced |
| **TM-14** | Anti-Spam | Repeat tap after 6 seconds | Second tap logged successfully in `tap_logs` |
| **TM-15** | Performance | Throttled 4G network | TTFB `< 300ms`, full page interactive `< 1000ms` |
| **TM-16** | Responsiveness | Viewports 360px, 375px, 390px, 430px | No horizontal scrollbar; touch targets ≥ 48px |
| **TM-17** | Security | XSS script payload in feedback | Sanitized in DB and client; no execution |
| **TM-18** | Security | Rating tamper payload (`rating: 5` to `/api/feedback`) | Returns 400 Bad Request (only 1–3 permitted) |

---

## 3. Detailed Test Scenarios & Execution Steps

### Scenario 1: Shield Mode — High Rating Flow (4–5 Stars)
1. Open browser in mobile viewport (e.g., iPhone 14, 390x844).
2. Navigate to `http://localhost:3000/r/demo-card` (configured with `is_shield_active: true`).
3. Verify store name and 5 unfilled stars are displayed cleanly.
4. Tap star **5**.
5. **Verify:**
   - Star 5 and preceding stars visually highlight.
   - A timer measures approximately **300ms** before navigation occurs.
   - Browser navigates to the configured `google_review_url`.
   - In `tap_logs`, verify `selected_stars` is recorded as `5`.

### Scenario 2: Shield Mode — Low Rating Flow (1–3 Stars)
1. Navigate to `http://localhost:3000/r/demo-card`.
2. Tap star **2**.
3. **Verify:**
   - Rating stars are replaced by the feedback container with heading "What can we improve?".
   - Selected rating (2/5) is indicated.
   - Textarea is visible and autofocuses or is easily tap-friendly.
   - Two buttons are visible: **"Submit Feedback"** and **"Send directly via WhatsApp"**.
4. Type test message: `"Meja agak kotor dan pesanan lama"`.
5. Click **"Submit Feedback"**.
6. **Verify:**
   - Loading indicator appears momentarily.
   - Successful transition to the Thank-You resolution screen.
   - Database table `internal_feedbacks` contains:
     - `card_id`: matches demo card UUID
     - `rating`: `2`
     - `feedback_text`: `"Meja agak kotor dan pesanan lama"`

### Scenario 3: Direct Mode (Subscription Inactive)
1. Configure test card with `is_shield_active = false`.
2. Send request to `http://localhost:3000/r/direct-card`.
3. **Verify:**
   - Server returns **HTTP 307 Temporary Redirect**.
   - Header `Location` matches `google_review_url`.
   - Zero HTML payload or intermediate rating screen flash is presented.

### Scenario 4: Anti-Spam Debounce Rule
1. Run automated script sending 5 consecutive GET requests to `/r/demo-card` with identical User-Agent and IP:
   - Request 1 at T = 0ms
   - Request 2 at T = 800ms
   - Request 3 at T = 2200ms
   - Request 4 at T = 4500ms
   - Request 5 at T = 6000ms
2. Inspect `tap_logs` table.
3. **Verify:**
   - Only **2** log records exist:
     - One corresponding to Request 1 (T = 0ms).
     - One corresponding to Request 5 (T = 6000ms, outside the 5s window).
   - Requests 2, 3, and 4 were dropped.

---

## 4. Device & Responsiveness Matrix

Test across standard mobile viewports in DevTools / Playwright:

| Device Preset | Screen Width | Screen Height | Test Verification Focus |
|---|---|---|---|
| **Compact Android** (Galaxy S8 / A series) | `360px` | `740px` | Star touch target spacing, no word clipping |
| **iPhone SE** (3rd gen) | `375px` | `667px` | Vertical spacing, textarea visibility above keyboard |
| **iPhone 14 / 15 / 16** | `390px` | `844px` | Standard primary device proportions |
| **Android Flagship** (Pixel 7 / S23) | `412px` | `915px` | Margins, high-DPI scaling |
| **iPhone 15/16 Pro Max** | `430px` | `932px` | Max width bounds (`max-w-md`), centered layout |

---

## 5. Automated Testing Guidelines (Playwright & Vitest)

### A. Recommended Vitest Unit Tests
Create unit tests under `tests/unit/`:
- `tests/unit/parseDeviceOS.test.js`:
  - `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)` → `'iOS'`
  - `Mozilla/5.0 (Linux; Android 14; SM-S918B...)` → `'Android'`
  - `Mozilla/5.0 (Windows NT 10.0; Win64; x64...)` → `'Other'`
- `tests/unit/debounce.test.js`:
  - Validates `shouldLogTap` drops duplicate calls within 5000ms.
- `tests/unit/whatsappUrl.test.js`:
  - Validates phone normalization (stripping spaces, `+`, `-`) and URI component encoding.

### B. Recommended Playwright E2E Tests
Create E2E tests under `tests/e2e/`:
- `tests/e2e/rating-flow.spec.js`:
  - Test 5-star redirect with 300ms timing assertion.
  - Test 2-star feedback submission.
  - Test invalid slug fallback display.

---

## 6. Bug Reporting Template

When filing issues discovered during verification, follow this format:

```markdown
### [BUG-ID] Short Title

- **Severity:** Critical | High | Medium | Low
- **Category:** Functional | Performance | Responsive | Security
- **Affected Route:** `/r/[slug]` or `/api/...`
- **Device / Viewport:** e.g., iPhone 14 (390px) on iOS 17 Safari

#### Reproduction Steps:
1. ...
2. ...

#### Expected Behavior:
...

#### Actual Behavior:
...

#### Evidence / Logs:
(Screenshot, network HAR trace, or database row dump)
```

---

## 7. Definition of Done (QA Agent Sign-Off)

- [ ] All 18 Test Matrix scenarios (TM-01 through TM-18) verified and passing.
- [ ] Direct Mode verified to emit pure HTTP 307 without visual flicker.
- [ ] 300ms transition delay on 4-5 stars verified via performance timeline or Playwright timing assertion.
- [ ] Anti-spam debounce tested with repeated requests; no spam logs in `tap_logs`.
- [ ] Responsive design verified on 360px, 375px, 390px, and 430px viewports with zero horizontal scrolling.
- [ ] Input validation verified for empty, overlength, and special character feedback texts.
- [ ] Lighthouse audit scores: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95 on mobile profile.
