from celery import shared_task
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from csv import DictWriter

from datetime import datetime, timedelta

from applications.models import User, ParkingLot, ParkingSpot, Reservation
from applications import db

@shared_task
def daily_reminder():
    """Send daily reminder emails to users about parking availability"""
    from flask import current_app
    
    # Ensure we're in Flask app context
    with current_app.app_context():
        smtpObj = smtplib.SMTP('localhost', 1025)  # MailHog SMTP server
        
        from flask import render_template
        
        # Get all regular users (not admins)
        users = User.query.filter_by(is_admin=False).all()
        
        for user in users:
            # Get available parking spots count
            available_spots = ParkingSpot.query.filter_by(status='A').count()
            subject = f"Daily Parking Reminder - {user.name}"
            msg = MIMEMultipart()
            msg['From'] = "admin@parkingsystem.com"
            msg['To'] = user.email or user.username
            msg['Subject'] = subject
            html = render_template(
                'daily-reminder.html',
                user=user,
                available_spots=available_spots,
                subject=subject
            )
            msg.attach(MIMEText(html, 'html'))
            print(msg.as_string())
            smtpObj.sendmail(msg['From'], [msg['To']], msg.as_string())
        
        smtpObj.quit()
        return f"Daily reminders sent to {len(users)} users"

@shared_task
def monthly_report():
    """Generate and send monthly parking activity report to admin"""
    from flask import current_app
    
    # Ensure we're in Flask app context
    with current_app.app_context():
        smtpObj = smtplib.SMTP('localhost', 1025)  # MailHog SMTP server
        
        from flask import render_template
        
        # Get admin user
        admin = User.query.filter_by(is_admin=True).first()
        if not admin:
            return "No admin user found"
        
        # Generate report data
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = current_month - timedelta(days=1)
        last_month = last_month.replace(day=1)
        
        # Get monthly statistics
        monthly_stats = []
        for lot in ParkingLot.query.all():
            reservations = Reservation.query.filter(
                Reservation.parking_timestamp >= last_month,
                Reservation.parking_timestamp < current_month
            ).join(ParkingSpot).filter(ParkingSpot.lot_id == lot.id).all()
            
            total_revenue = sum(r.parking_cost or 0 for r in reservations)
            total_bookings = len(reservations)
            
            monthly_stats.append({
                "lot_name": lot.prime_location_name,
                "total_bookings": total_bookings,
                "total_revenue": total_revenue,
                "utilization": f"{(total_bookings / lot.number_of_spots) * 100:.1f}%"
            })
        
        subject = f"Monthly Parking Report - {last_month.strftime('%B %Y')}"
        msg = MIMEMultipart()
        msg['From'] = "admin@parkingsystem.com"
        msg['To'] = admin.email or admin.username
        msg['Subject'] = subject
        html = render_template(
            'monthly-report.html',
            admin=admin,
            monthly_stats=monthly_stats,
            report_month=last_month.strftime('%B %Y'),
            subject=subject
        )
        msg.attach(MIMEText(html, 'html'))
        print(msg.as_string())
        smtpObj.sendmail(msg['From'], [msg['To']], msg.as_string())
        
        smtpObj.quit()
        return f"Monthly report sent to {admin.name}"

@shared_task
def user_monthly_activity_report():
    """Generate and send monthly activity report to each user"""
    from flask import current_app
    
    # Ensure we're in Flask app context
    with current_app.app_context():
        smtpObj = smtplib.SMTP('localhost', 1025)  # MailHog SMTP server
        
        from flask import render_template
        
        # Get all non-admin users
        users = User.query.filter_by(is_admin=False).all()
        if not users:
            return "No users found"
        
        # Calculate date range for last month
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = current_month - timedelta(days=1)
        last_month = last_month.replace(day=1)
        
        reports_sent = 0
        
        for user in users:
            # Get user's reservations for last month
            user_reservations = Reservation.query.filter(
                Reservation.user_id == user.id,
                Reservation.parking_timestamp >= last_month,
                Reservation.parking_timestamp < current_month
            ).all()
            
            if not user_reservations:
                continue  # Skip users with no activity last month
            
            # Calculate user statistics
            total_bookings = len(user_reservations)
            total_spent = sum(r.parking_cost or 0 for r in user_reservations)
            
            # Find most used parking lot
            lot_usage = {}
            for reservation in user_reservations:
                spot = ParkingSpot.query.get(reservation.spot_id)
                lot = ParkingLot.query.get(spot.lot_id)
                lot_name = lot.prime_location_name
                lot_usage[lot_name] = lot_usage.get(lot_name, 0) + 1
            
            most_used_lot = max(lot_usage, key=lot_usage.get) if lot_usage else "N/A"
            most_used_count = lot_usage.get(most_used_lot, 0)
            
            # Calculate total parking hours
            total_hours = 0
            for reservation in user_reservations:
                if reservation.leaving_timestamp:
                    duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                    total_hours += duration
            
            # Prepare email data
            user_stats = {
                "total_bookings": total_bookings,
                "total_spent": total_spent,
                "total_hours": round(total_hours, 1),
                "most_used_lot": most_used_lot,
                "most_used_count": most_used_count,
                "avg_cost_per_booking": round(total_spent / total_bookings, 2) if total_bookings > 0 else 0,
                "recent_bookings": []
            }
            
            # Add recent booking details (last 5)
            for reservation in user_reservations[-5:]:
                spot = ParkingSpot.query.get(reservation.spot_id)
                lot = ParkingLot.query.get(spot.lot_id)
                
                duration_hours = 0
                if reservation.leaving_timestamp:
                    duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                
                user_stats["recent_bookings"].append({
                    "lot_name": lot.prime_location_name,
                    "date": reservation.parking_timestamp.strftime("%b %d, %Y"),
                    "duration": f"{duration_hours:.1f}h" if duration_hours > 0 else "Ongoing",
                    "cost": f"₹{reservation.parking_cost}" if reservation.parking_cost else "₹0"
                })
            
            # Send email
            subject = f"Your Monthly Parking Activity - {last_month.strftime('%B %Y')}"
            msg = MIMEMultipart()
            msg['From'] = "noreply@parkingsystem.com"
            msg['To'] = user.email or user.username
            msg['Subject'] = subject
            
            html = render_template(
                'user-monthly-report.html',
                user=user,
                stats=user_stats,
                report_month=last_month.strftime('%B %Y'),
                subject=subject
            )
            msg.attach(MIMEText(html, 'html'))
            smtpObj.sendmail(msg['From'], [msg['To']], msg.as_string())
            reports_sent += 1
        
        smtpObj.quit()
        return f"Monthly activity reports sent to {reports_sent} users"

@shared_task
def export_csv():
    """Export parking lot and reservation data to CSV file"""
    from flask import current_app
    
    # Ensure we're in Flask app context
    with current_app.app_context():
        # Create exports directory if it doesn't exist
        exports_dir = "static/exports"
        os.makedirs(exports_dir, exist_ok=True)
        
        # Generate timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"parking_data_{timestamp}.csv"
        filepath = os.path.join(exports_dir, filename)
        
        # Write to actual CSV file
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ["Parking Lot", "Address", "Total Spots", "Price per Hour", "Total Bookings", "Total Revenue"]
            writer = DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for lot in ParkingLot.query.all():
                # Get total bookings and revenue for this lot
                bookings = db.session.query(Reservation).join(ParkingSpot).filter(
                    ParkingSpot.lot_id == lot.id
                ).all()
                
                total_bookings = len(bookings)
                total_revenue = sum(booking.parking_cost or 0 for booking in bookings)
                
                writer.writerow({
                    "Parking Lot": lot.prime_location_name,
                    "Address": lot.address,
                    "Total Spots": lot.number_of_spots,
                    "Price per Hour": lot.price,
                    "Total Bookings": total_bookings,
                    "Total Revenue": total_revenue
                })
        
        # Return file info
        file_size = os.path.getsize(filepath)
        return {
            "filename": filename,
            "filepath": filepath,
            "file_size": file_size,
            "download_url": f"/static/exports/{filename}",
            "generated_at": timestamp
        }

@shared_task
def user_csv_export(user_id):
    """Export user's complete parking history to CSV file"""
    from flask import current_app
    import os
    from csv import DictWriter
    
    # Ensure we're in Flask app context
    with current_app.app_context():
        # Get user
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}
        
        # Create exports directory if it doesn't exist
        exports_dir = "static/exports"
        os.makedirs(exports_dir, exist_ok=True)
        
        # Generate timestamped filename for this user
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"user_{user.username}_parking_history_{timestamp}.csv"
        filepath = os.path.join(exports_dir, filename)
        
        # Get all user's reservations with related data
        user_bookings = db.session.query(Reservation, ParkingSpot, ParkingLot).join(
            ParkingSpot, Reservation.spot_id == ParkingSpot.id
        ).join(
            ParkingLot, ParkingSpot.lot_id == ParkingLot.id
        ).filter(
            Reservation.user_id == user_id
        ).order_by(Reservation.parking_timestamp.desc()).all()
        
        # Write to CSV file
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                "Reservation ID", "Parking Lot", "Lot Address", "Spot Number", 
                "Vehicle Number", "Check-in Time", "Check-out Time", 
                "Duration (Hours)", "Hourly Rate", "Total Cost", "Status"
            ]
            writer = DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for reservation, spot, lot in user_bookings:
                # Calculate duration and status
                if reservation.leaving_timestamp:
                    duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                    status = "Completed"
                    checkout_time = reservation.leaving_timestamp.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    duration_hours = (datetime.now() - reservation.parking_timestamp).total_seconds() / 3600
                    status = "Active"
                    checkout_time = "Still Parked"
                
                writer.writerow({
                    "Reservation ID": reservation.id,
                    "Parking Lot": lot.prime_location_name,
                    "Lot Address": lot.address,
                    "Spot Number": spot.spot_number,
                    "Vehicle Number": reservation.vehicle_number,
                    "Check-in Time": reservation.parking_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "Check-out Time": checkout_time,
                    "Duration (Hours)": f"{duration_hours:.2f}",
                    "Hourly Rate": f"₹{lot.price}",
                    "Total Cost": f"₹{reservation.parking_cost}" if reservation.parking_cost else "₹0",
                    "Status": status
                })
        
        # Get file info
        file_size = os.path.getsize(filepath)
        total_bookings = len(user_bookings)
        
        return {
            "filename": filename,
            "filepath": filepath,
            "file_size": file_size,
            "total_records": total_bookings,
            "download_url": f"/static/exports/{filename}",
            "generated_at": timestamp,
            "user_id": user_id,
            "username": user.username
        } 