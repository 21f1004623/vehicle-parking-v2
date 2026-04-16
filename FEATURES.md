# ParkEase — Planned Features

Features to be implemented incrementally. Grouped by priority.

---

## High Impact, Low Effort

- [ ] **Password hashing** — Passwords are currently stored plain text. Use `werkzeug.security.generate_password_hash` / `check_password_hash`. ~10-line backend fix.
- [ ] **Toast notifications** — Replace all `alert()` popups (booking confirmed, errors, etc.) with non-blocking toast messages for a more polished UX.
- [ ] **Reservation receipt modal** — After ending a booking, show a styled summary card (location, duration, cost) instead of a plain browser alert.

---

## Medium Impact, Medium Effort

- [ ] **Search on admin reservations** — Add a search/filter by username or vehicle number in the admin reservations table.
- [ ] **Pagination** — Paginate booking history table (client-side or server-side) as data grows.
- [ ] **Dark mode toggle** — CSS variables are already set up; adding a dark theme is mostly a palette swap + a toggle button.
- [ ] **Saved vehicle number** — Let users save their default vehicle number in their profile so they don't retype it every booking.

---

## Higher Effort, Course-Worthy

- [ ] **Booking time slot selection** — Let users pre-book for a future time window, not just "park now".
- [ ] **Admin lot occupancy heatmap** — Show which lots are busiest by hour/day using a grid heatmap chart.
- [ ] **PDF receipt download** — Generate a downloadable PDF bill after checkout using `reportlab` or `weasyprint`.
