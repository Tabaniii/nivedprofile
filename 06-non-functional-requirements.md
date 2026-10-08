# 5. Non-Functional Requirements (NFR)

## Performance

- **TTFB (Time to First Byte)** must be under **300ms** on a 4G mobile network.
- Redirects and filter-UI rendering must be near-instant, with no heavy animations.
- Overall page load time target: **under 1 second** (see [Overview](./01-overview.md)).

## Logging Protection (Debounce / Rate Limit)

- Ignore duplicate logs from the same IP address/User-Agent within a **< 5 second** window.
- This prevents fake data spikes caused by a customer tapping the card repeatedly.

## Display Compatibility

- Interface must be fully responsive on phone screen widths from **360px to 430px** (standard smartphone screen sizes).
