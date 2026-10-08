# 3.1. Feature — Route Handler: `/r/[slug]` (Background Logger)

## Execution Logic

1. Check whether the card `slug` exists and is active in the database table.
2. **If the `slug` is invalid / inactive:** show a friendly fallback page (not a raw 404 error).
3. **If the card status is "Direct Mode"** (e.g., the client did not renew the filter subscription): immediately perform an **HTTP 307 redirect** to the destination URL, without showing the filter UI.
4. **If the card status is "Shield Mode" (active):** log the visit data, then display the star-rating filter page.

## Metadata Automatically Logged

| Field | Description |
|---|---|
| `timestamp` | Exact time the card was tapped. |
| `user_agent` | Raw browser/OS user-agent string. |
| `device_os` | Parsed result of the User-Agent: `iOS`, `Android`, or `Other`. |
| `card_id` | Relation to the physical card's ID. |

> **Note:** Logging must happen **asynchronously** so it never blocks or delays the page render for the customer (see [Non-Functional Requirements](./06-non-functional-requirements.md) for the debounce/rate-limit rule on duplicate taps).
