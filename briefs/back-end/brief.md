# Back-End Agent Implementation Brief — NFC Public Web

**Role:** Back-End AI Agent  
**Domain:** Server-Side Routing, Route Handlers, Database Architecture, Telemetry Ingestion, Anti-Spam Debouncing  
**Repository Context:** Next.js (App Router), Supabase / PostgreSQL  
**Primary Target Performance:** TTFB < 300ms, Non-blocking Asynchronous Logging  
**Parent PRD References:**
- [`01-overview.md`](file:///Users/tabaniii/Herd/filter-rating/01-overview.md)
- [`03-feature-route-handler.md`](file:///Users/tabaniii/Herd/filter-rating/03-feature-route-handler.md)
- [`05-database-schema.md`](file:///Users/tabaniii/Herd/filter-rating/05-database-schema.md)
- [`06-non-functional-requirements.md`](file:///Users/tabaniii/Herd/filter-rating/06-non-functional-requirements.md)

---

## 1. Mission & Objectives

Engineer the server-side infrastructure for the **NFC Public Web**, ensuring ultra-fast route resolution, automated device telemetry, spam protection, and reliable data persistence.

### Key Goals:
1. **Dynamic Route `/r/[slug]` Resolution:** Fetch card configuration with sub-millisecond overhead.
2. **Instant Direct Mode Redirect:** When `is_shield_active === false`, immediately return an **HTTP 307 Temporary Redirect** to the store's Google Review URL without rendering any HTML.
3. **Non-Blocking Telemetry:** Record visit metadata asynchronously so database writes never delay Time To First Byte (TTFB target `< 300ms`).
4. **Debounce Protection:** Discard duplicate logs originating from the same IP address and User-Agent within a **5-second window**.
5. **Private Feedback Ingestion:** Expose secure, validated endpoints to capture 1–3 star complaints into the `internal_feedbacks` table.

---

## 2. Route & Request Flow Architecture

```
                                  Incoming Request
                                 GET /r/[slug]
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Query `cards` table where         │
                     │ slug = params.slug                │
                     └─────────────────┬─────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
          [Card Not Found]                             [Card Found]
                 │                                           │
                 ▼                                           ▼
      ┌─────────────────────┐               ┌─────────────────────────────────┐
      │ Render Friendly     │               │ Check Card Status               │
      │ Fallback Page       │               │ `is_shield_active`              │
      │ (Status: 404/200)   │               └────────┬───────────────┬────────┘
      └─────────────────────┘                        │               │
                                                     │               │
                                    [is_shield_active = false]       [is_shield_active = true]
                                    ("Direct Mode")                  ("Shield Mode")
                                                     │               │
                                                     ▼               ▼
                                          ┌──────────────────┐   ┌───────────────────────────┐
                                          │ Return HTTP 307  │   │ 1. Spawn Async Tap Log    │
                                          │ Location:        │   │    (non-blocking)         │
                                          │ google_review_url│   │ 2. Render Rating UI Page  │
                                          └──────────────────┘   └───────────────────────────┘
```

---

## 3. Database Schema (PostgreSQL / Supabase)

Create the tables, foreign keys, and indexes using this DDL reference:

```sql
-- 1. Cards Table (Stores physical card identity and configuration)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    google_review_url TEXT NOT NULL,
    whatsapp_number VARCHAR(30),
    is_shield_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);

-- 2. Tap Logs Table (Stores analytics data for every physical tap/scan)
CREATE TABLE IF NOT EXISTS tap_logs (
    id BIGSERIAL PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    device_os VARCHAR(30) NOT NULL, -- 'iOS', 'Android', 'Other'
    user_agent TEXT NOT NULL,
    selected_stars INT CHECK (selected_stars BETWEEN 1 AND 5),
    ip_hash VARCHAR(64),           -- Anonymized IP hash for debouncing
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tap_logs_card_id ON tap_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_tap_logs_created_at ON tap_logs(created_at DESC);

-- 3. Internal Feedbacks Table (Stores complaints for 1-3 star ratings)
CREATE TABLE IF NOT EXISTS internal_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 3),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_internal_feedbacks_card_id ON internal_feedbacks(card_id);
```

---

## 4. Telemetry Logging Engine & Debounce Mechanism

### A. OS Parsing Rule
Parse incoming `user-agent` header into one of three normalized categories:
```js
export function parseDeviceOS(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  return 'Other';
}
```

### B. Anti-Spam Debounce Rule (< 5 Seconds)
Physical NFC cards are often accidentally double-tapped or scanned multiple times in quick succession.
- **Rule:** Ignore and drop log entries for the same `(card_id + client_ip + user_agent)` that occur within `< 5000ms`.
- **Implementation:**
  Use an in-memory sliding cache (e.g., `lru-cache` or `Map` with timestamp cleanup) or a fast Redis/KV check:
  ```js
  const tapDebounceMap = new Map(); // key -> lastTapTimestamp

  export function shouldLogTap(cardId, clientIp, userAgent) {
    const key = `${cardId}:${clientIp}:${userAgent}`;
    const now = Date.now();
    const lastTap = tapDebounceMap.get(key);

    if (lastTap && now - lastTap < 5000) {
      return false; // Debounced / ignore duplicate
    }

    tapDebounceMap.set(key, now);
    return true;
  }
  ```

### C. Non-Blocking Asynchronous Execution
Under no circumstance should database insertion delay the HTTP response or UI render:
```js
// In Next.js App Router:
// Trigger asynchronous task without awaiting it before rendering
if (shouldLogTap(card.id, clientIp, userAgent)) {
  // Fire and forget, or use Next.js waitUntil if available in Edge runtime
  logTapAsync({
    card_id: card.id,
    device_os: parseDeviceOS(userAgent),
    user_agent: userAgent,
    ip_hash: hashIp(clientIp),
  }).catch((err) => console.error('Failed to log tap:', err));
}
```

---

## 5. API Endpoints Specification

### 1. Route Handler: `/r/[slug]`
- **Method:** `GET`
- **Behavior:**
  1. Fetch `card` by `slug`.
  2. If card does not exist: return fallback response (or pass empty state to render friendly fallback UI).
  3. If `card.is_shield_active === false`:
     - Return `NextResponse.redirect(card.google_review_url, { status: 307 })`.
  4. If `card.is_shield_active === true`:
     - Run async tap logger.
     - Pass `card` props to the page renderer.

### 2. Feedback Ingestion: `POST /api/feedback`
- **Method:** `POST`
- **Payload Schema:**
  ```json
  {
    "card_id": "UUID (required)",
    "rating": "Integer between 1 and 3 (required)",
    "feedback_text": "String (optional, max 2000 chars)"
  }
  ```
- **Validation:**
  - Verify `card_id` is a valid UUID and exists in `cards`.
  - Verify `rating` is strictly `1`, `2`, or `3`.
  - Sanitize `feedback_text` (strip potential injection/control characters).
- **Responses:**
  - `201 Created`: `{ "success": true, "message": "Feedback recorded" }`
  - `400 Bad Request`: `{ "error": "Validation error" }`
  - `500 Internal Error`: `{ "error": "Database error" }`

### 3. Star Telemetry Update: `POST /api/telemetry/star`
- **Method:** `POST`
- **Payload Schema:**
  ```json
  {
    "card_id": "UUID (required)",
    "selected_stars": "Integer between 1 and 5 (required)"
  }
  ```
- **Behavior:**
  - Records the star selection in `tap_logs` or updates the most recent tap log for that card/IP session.
- **Responses:**
  - `200 OK`: `{ "success": true }`

---

## 6. Environment Variables Setup

Ensure a `.env.example` file is provided:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 7. Definition of Done (BE Agent)

- [ ] Supabase client helper created (`lib/supabase.js` or `lib/db.js`).
- [ ] SQL schema migration file created with tables, constraints, and indexes.
- [ ] `/r/[slug]` checks slug and performs instant HTTP 307 redirect when `is_shield_active === false`.
- [ ] Async tap logger runs in the background and respects the 5-second debounce window.
- [ ] OS parser accurately maps iPhone/iPad to `iOS`, Android devices to `Android`, and other browsers to `Other`.
- [ ] `POST /api/feedback` validates inputs and inserts into `internal_feedbacks`.
- [ ] `POST /api/telemetry/star` successfully captures rating telemetry.
- [ ] Error scenarios (DB down, invalid UUID, empty slug) handled gracefully without crashing.
