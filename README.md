# Vehicle Parking Management System



### Core Features
- **Database Models**: User, Admin, ParkingLot, ParkingSpot, Reservation
- **Authentication**: JWT-based (Admin/User roles)
- **Admin Dashboard**: Lot management, user monitoring, reservations, CSV export
- **User Dashboard**: Real-time booking, history, cost calculation
- **Analytics & Charts**: Chart.js for revenue/usage analytics
- **Redis Caching**: API performance boost (30s cache, see logs for [CACHE MISS])
- **Background Jobs**: Celery workers for async/scheduled tasks
- **Email System**: Daily reminders & monthly reports (MailHog, Jinja2 templates)
- **CSV Export**: Async data export, downloadable from dashboard


### Technology Stack
- **Backend**: Flask, Flask-RESTful, SQLAlchemy, JWT, Redis, Celery
- **Frontend**: Vue.js, Bootstrap 5, Chart.js
- **Database**: SQLite (auto-created)
- **Caching**: Redis
- **Async Jobs**: Celery + Redis
- **Email**: SMTP (MailHog), Jinja2 templates


### Features
- **Performance**: Redis-cached APIs for fast response
- **Automation**: Scheduled daily reminders & monthly reports (Celery Beat)
- **Data Export**: Real-time CSV generation (async, timestamped)
- **Email Notifications**: HTML email templates (analytics, reminders)
- **Background Processing**: Async/scheduled jobs with Celery


---

## 🚀 Quick Start

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Start all services (each in a separate terminal)
redis-server
mailhog
celery -A main.celery worker --loglevel=info
celery -A main.celery beat --loglevel=info
python main.py
```

**Access Points:**
- App: http://localhost:5000
- Admin: http://localhost:5000/admin
- User: http://localhost:5000/user
- Email UI: http://localhost:8025

---