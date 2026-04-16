# ParkEase — Vehicle Parking Management System

A full-stack web application for managing vehicle parking — built with Flask, Vue.js, Redis, and Celery.  
*A project by Vikash Ram Mahuri*

---

## Features

### User
- Register / login with JWT authentication (**passwords hashed with werkzeug**)
- Browse parking lots with **live search, availability filter, and price sort**
- Book a parking spot (auto-assigns next available spot)
- **Live duration timer and estimated cost** on active bookings
- **Reservation receipt modal** — styled bill summary after ending a session
- Full booking history with check-in / check-out times and cost
- Personal analytics — spending trends, weekly usage charts, favourite location
- Export booking history to CSV
- Profile page — name, email, bookings count, total spent, **change password**
- Monthly activity report delivered by email

### Admin
- Separate admin login
- **Dashboard summary cards** — total lots, users, active sessions, total revenue
- Create, edit, and delete parking lots (spot count, price, address)
- Monitor all reservations (filter by active / completed), cancel active bookings
- User management — view all users, their spend, and current status
- Export all parking data to CSV (async via Celery)
- Revenue and utilisation analytics with Chart.js charts
- Monthly analytics report delivered by email

### System
- **Toast notifications** — non-blocking success/error/warning messages throughout the app
- Redis-cached API responses (1-minute TTL)
- Celery background workers for async CSV export and email delivery
- Celery Beat scheduled tasks:
  - Daily parking reminders — 6 PM every day
  - Admin monthly report — 1st of each month, midnight
  - User activity report — 1st of each month, 9 AM
- HTML email templates (Jinja2)
- Seed data on first run — 5 demo users, 5 parking lots, 80+ sample reservations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Flask 2.3, Flask-RESTful, SQLAlchemy 2.0 |
| Auth | Flask-JWT-Extended (JWT tokens), Werkzeug password hashing |
| Frontend | Vue.js 3, Vue Router 4, Chart.js, Font Awesome |
| Styling | Custom CSS design system (Inter font, no Bootstrap) |
| Database | SQLite (auto-created on first run) |
| Cache | Redis (Flask-Caching) |
| Task queue | Celery 5.3 + Redis broker |
| Email | SMTP — MailHog for development |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
vehicle-parking-v2/
├── applications/
│   ├── api/
│   │   ├── admin_api.py      # Admin endpoints (auth, lots, users, reservations, stats)
│   │   └── user_api.py       # User endpoints (auth, booking, profile, password)
│   ├── __init__.py           # App factory, DB init, seed data
│   ├── cache.py              # Redis cache config
│   ├── models.py             # SQLAlchemy models (User, ParkingLot, ParkingSpot, Reservation)
│   ├── utils.py              # Celery init, API response helper
│   └── worker.py             # Celery tasks (email, CSV export)
├── static/
│   ├── components/           # Vue.js SPA components (user + admin)
│   ├── style.css             # Custom design system
│   ├── admin-app.js          # Admin SPA router
│   └── user-app.js           # User SPA router
├── templates/                # HTML templates (pages + email)
├── main.py                   # Entry point — app init, API routes, Celery schedule
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── FEATURES.md               # Planned feature roadmap
├── setup_venv.sh             # One-command venv setup (Linux / Mac)
├── setup_venv.bat            # One-command venv setup (Windows)
└── .env.example
```

---

## Quick Start

### Option A — Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Copy and configure environment variables
cp .env.example .env        # Linux/Mac
copy .env.example .env      # Windows

# 2. Build and start all services
docker compose up --build
```

All five services start automatically:

| Service | What it does |
|---------|-------------|
| `web` | Flask app on port 5000 |
| `redis` | Message broker + API cache |
| `mailhog` | Catches all outgoing emails |
| `celery_worker` | Processes background tasks |
| `celery_beat` | Fires scheduled tasks |

**Access points:**
- App → http://localhost:5000
- Admin panel → http://localhost:5000/admin
- User panel → http://localhost:5000/user
- Email inbox (MailHog) → http://localhost:8025

To stop: `docker compose down`  
To stop **and delete all data**: `docker compose down -v`

> **Note:** The SQLite database lives inside a named Docker volume (`sqlite_data`). Running `down` without `-v` preserves your data across restarts.

---

### Option B — Virtual Environment (local)

Requires Python 3.9+, Redis, and MailHog installed locally.

**Windows**
```bat
setup_venv.bat
```

**Linux / Mac**
```bash
bash setup_venv.sh
```

Both scripts create the venv, install dependencies, and copy `.env.example` to `.env`.

Then start each service in a separate terminal:

```bash
# Terminal 1 — Redis (must be running first)
redis-server

# Terminal 2 — MailHog
mailhog

# Terminal 3 — Celery worker
source venv/bin/activate        # or: venv\Scripts\activate on Windows
celery -A main worker --loglevel=info

# Terminal 4 — Celery beat (scheduled tasks)
celery -A main beat --loglevel=info

# Terminal 5 — Flask app
python main.py
```

---

## Environment Variables

Copy `.env.example` to `.env` and update the values. Docker Compose overrides
`REDIS_URL`, `DATABASE_URL`, `MAIL_SERVER`, and `MAIL_PORT` automatically.

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me-in-production` | Flask session secret |
| `JWT_SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `DATABASE_URL` | `sqlite:///parking.db` | SQLAlchemy DB URI |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `MAIL_SERVER` | `localhost` | SMTP host |
| `MAIL_PORT` | `1025` | SMTP port |

---

## Default Credentials

### Admin
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin` |

### Demo Users (seeded automatically)
| Username | Password |
|----------|----------|
| `user1` | `user1` |
| `user2` | `user2` |
| `user3` | `user3` |
| `user4` | `user4` |
| `user5` | `user5` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/auth` | User login |
| POST | `/api/user/register` | User registration |
| POST | `/api/admin/auth` | Admin login |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking-lots` | List all parking lots |
| POST | `/api/reservations` | Book a parking spot |
| DELETE | `/api/reservations/<id>` | End a parking session |
| GET | `/api/bookings` | Booking history |
| GET/PUT | `/api/profile` | Get / update profile |
| PUT | `/api/user/change-password` | Change password |
| GET | `/api/user/export-csv` | Download booking history as CSV |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Summary stats (lots, users, revenue) |
| GET/POST | `/api/admin/parking-lots` | List / create parking lots |
| PUT/DELETE | `/api/admin/parking-lots/<id>` | Update / delete a lot |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/reservations` | List all reservations |
| PUT | `/api/admin/cancel-booking/<id>` | Cancel an active booking |
| GET | `/api/admin/export-csv` | Export all data as CSV |
