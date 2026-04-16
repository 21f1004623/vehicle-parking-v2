
from flask import render_template
from applications import create_app, init_database
from applications.api.admin_api import AdminAPI, AdminUsersAPI, AdminParkingLotsAPI, AdminReservationsAPI, CancelBookingAPI, CSVExportAPI, AdminSummaryStatsAPI
from applications.api.user_api import UserLoginAPI, UserRegistrationAPI, ParkingLocationAPI, ParkingReservationAPI, UserBookingHistoryAPI, UserProfileAPI, UserCSVExportAPI, UserChangePasswordAPI
from applications.utils import celery_init_app
from applications.worker import daily_reminder, monthly_report, user_monthly_activity_report
from flask_restful import Api
from celery.schedules import crontab


# --- App Initialization ---
tsapp = create_app()
init_database(tsapp)
celery = celery_init_app(tsapp)

# Set Celery timezone to local (Asia/Kolkata)
celery.conf.timezone = 'Asia/Kolkata'
celery.conf.enable_utc = False

# --- Celery Periodic Tasks ---
@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=18, minute=0), daily_reminder.s(), name="daily parking reminder (6 PM)"
    )
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=0, minute=0), monthly_report.s(), name="monthly parking report (midnight 1st)"
    )
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=9, minute=0), user_monthly_activity_report.s(), name="user monthly activity reports (9 AM 1st)"
    )


# --- API Setup ---
api = Api(tsapp)
# Admin APIs
api.add_resource(AdminAPI, '/api/admin/auth')
api.add_resource(AdminUsersAPI, '/api/admin/users')
api.add_resource(AdminParkingLotsAPI, '/api/admin/parking-lots', '/api/admin/parking-lots/<int:lot_id>')
api.add_resource(AdminReservationsAPI, '/api/admin/reservations')
api.add_resource(CancelBookingAPI, '/api/admin/cancel-booking/<int:reservation_id>')
api.add_resource(CSVExportAPI, '/api/admin/export-csv')
api.add_resource(AdminSummaryStatsAPI, '/api/admin/stats')
# User APIs
api.add_resource(UserLoginAPI, '/api/user/auth')
api.add_resource(UserRegistrationAPI, '/api/user/register')
api.add_resource(ParkingLocationAPI, '/api/parking-lots')
api.add_resource(ParkingReservationAPI, '/api/reservations', '/api/reservations/<int:reservation_id>')
api.add_resource(UserBookingHistoryAPI, '/api/bookings')
api.add_resource(UserProfileAPI, '/api/profile')
api.add_resource(UserCSVExportAPI, '/api/user/export-csv')
api.add_resource(UserChangePasswordAPI, '/api/user/change-password')


# --- Basic Routes ---
@tsapp.route('/')
def index():
    return render_template('index.html')

@tsapp.route('/user')
def user():
    return render_template('user.html')

@tsapp.route('/admin')
def admin():
    return render_template('admin.html')

@tsapp.route('/docs')
def docs():
    return render_template('docs.html')


# --- App Runner ---
if __name__ == '__main__':
    tsapp.run(debug=False, host='0.0.0.0', port=5000)