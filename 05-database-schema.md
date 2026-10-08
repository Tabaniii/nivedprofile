# 4. Database Schema (Supabase / PostgreSQL)

## A. Table: `cards`

Stores the physical card's identity and configuration.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary Key |
| `slug` | VARCHAR | Unique, Indexed — e.g. `kopi-senja-01` |
| `store_name` | VARCHAR | Display name of the store |
| `google_review_url` | TEXT | Direct link to the Google Maps review |
| `whatsapp_number` | VARCHAR | Nullable — destination number for complaints |
| `is_shield_active` | BOOLEAN | Default: `true` — toggles whether the star filter is active or traffic goes direct |
| `created_at` | TIMESTAMPTZ | |

## B. Table: `tap_logs`

Stores analytics data for every card interaction.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL / UUID | Primary Key |
| `card_id` | UUID | Foreign Key → `cards.id` |
| `device_os` | VARCHAR | e.g. `iOS`, `Android` |
| `user_agent` | TEXT | |
| `selected_stars` | INT | Nullable — star value if the customer selected one on the web |
| `created_at` | TIMESTAMPTZ | Indexed |

## C. Table: `internal_feedbacks`

Stores feedback submitted for 1–3 star ratings.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL / UUID | Primary Key |
| `card_id` | UUID | Foreign Key → `cards.id` |
| `rating` | INT | Rating value (1, 2, or 3) |
| `feedback_text` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

## Relationships

```
cards (1) ───< (many) tap_logs
cards (1) ───< (many) internal_feedbacks
```
