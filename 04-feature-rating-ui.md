# 3.2. Feature — User Interface: Rating & Feedback Page

## UI Design

- Mobile-first, clean layout with no complex navigation.
- Displays the related UMKM's (store's) logo at the top.
- Large, touch-friendly interactive 5-star rating component.

## Interaction — 4 & 5 Stars

- As soon as a star is tapped, apply a smooth **300ms transition delay**.
- Redirect the browser via `window.location.href` to the store's Google Review link.

## Interaction — 1, 2, & 3 Stars

Replace the star display with an internal feedback form:

- One optional textarea field: **"What can we improve?"**
- A **"Submit Feedback"** button, or a **"Send directly via WhatsApp"** button.

### Submit Behavior

- If the submit button is pressed, the message is either:
  - Saved to the database (`internal_feedbacks` table — see [Database Schema](./05-database-schema.md)), **or**
  - Redirected to an auto-formatted WhatsApp chat link:
    ```
    https://wa.me/[number]?text=Halo%20saya%20ada%20masukan...
    ```
