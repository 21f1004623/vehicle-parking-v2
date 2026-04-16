import io
import csv
from flask import request, Response
from flask_restful import Resource
from applications.models import User, ParkingLot, ParkingSpot, Reservation
from applications import db
from applications.cache import cache
from applications.utils import api_response
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime

# Constants for better code readability
SPOT_STATUS_AVAILABLE = 'A'
SPOT_STATUS_OCCUPIED = 'O'
MINIMUM_PARKING_HOURS = 1.0

class UserLoginAPI(Resource):
    """Handle user authentication and login"""
    
    def post(self):
        user_credentials = request.get_json()
        if not user_credentials:
            return api_response(False, "Please provide your login details", status=400)
        username = user_credentials.get('username', '').strip()
        password = user_credentials.get('password', '')
        if not username or not password:
            return api_response(False, "Please enter both username and password", status=400)
        user_account = User.query.filter_by(username=username).first()
        if user_account and user_account.password == password and not user_account.is_admin:
            access_token = create_access_token(identity=str(user_account.id))
            return api_response(True, f"Welcome back, {user_account.name or username}!", data={
                "token": access_token,
                "user": {
                    "id": user_account.id,
                    "username": user_account.username,
                    "name": user_account.name or user_account.username
                }
            })
        return api_response(False, "Invalid username or password. Please try again.", status=401)


class UserRegistrationAPI(Resource):
    """Handle new user account creation"""
    
    def post(self):
        registration_data = request.get_json()
        if not registration_data:
            return api_response(False, "Please provide registration details", status=400)
        username = registration_data.get('username', '').strip()
        password = registration_data.get('password', '')
        full_name = registration_data.get('name', '').strip()
        email_address = registration_data.get('email', '').strip()
        if not username or not password:
            return api_response(False, "Username and password are required", status=400)
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return api_response(False, f"Username '{username}' is already taken. Please choose another.", status=400)
        if email_address:
            existing_email = User.query.filter_by(email=email_address).first()
            if existing_email:
                return api_response(False, f"Email '{email_address}' is already registered. Please use a different email.", status=400)
        new_user_account = User(
            username=username,
            password=password,  # Note: In production, this should be hashed
            name=full_name if full_name else username,
            email=email_address if email_address else None,
            is_admin=False
        )
        try:
            db.session.add(new_user_account)
            db.session.commit()
            access_token = create_access_token(identity=str(new_user_account.id))
            return api_response(True, f"Welcome to the parking app, {new_user_account.name}! Your account has been created successfully.", data={
                "token": access_token,
                "user": {
                    "id": new_user_account.id,
                    "username": new_user_account.username,
                    "name": new_user_account.name
                }
            }, status=201)
        except Exception:
            db.session.rollback()
            return api_response(False, "Sorry, we couldn't create your account right now. Please try again.", status=500)


class ParkingLocationAPI(Resource):
    """Handle parking lot information for users"""

    @jwt_required()
    @cache.cached(timeout=30, key_prefix='parking_locations')
    def get(self):
        all_parking_lots = ParkingLot.query.all()
        available_locations = []
        for parking_lot in all_parking_lots:
            all_spots_in_lot = ParkingSpot.query.filter_by(lot_id=parking_lot.id).all()
            spots_currently_available = len([spot for spot in all_spots_in_lot if spot.status == SPOT_STATUS_AVAILABLE])
            location_info = {
                "id": parking_lot.id,
                "name": parking_lot.prime_location_name,
                "address": parking_lot.address,
                "hourly_rate": round(parking_lot.price),
                "postal_code": parking_lot.pin_code,
                "spots_available": spots_currently_available,
                "total_spots": parking_lot.number_of_spots
            }
            available_locations.append(location_info)
        return api_response(True, f"Found {len(available_locations)} parking locations", data={"locations": available_locations})


class ParkingReservationAPI(Resource):
    """Handle parking spot reservations"""
    
    @jwt_required()
    def post(self):
        current_user_id = int(get_jwt_identity())
        booking_request = request.get_json()
        if not booking_request:
            return api_response(False, "Please provide booking details", status=400)
        desired_parking_lot_id = booking_request.get('lot_id')
        vehicle_registration = booking_request.get('vehicle_number', '').strip().upper()
        if not desired_parking_lot_id:
            return api_response(False, "Please select a parking location", status=400)
        if not vehicle_registration:
            return api_response(False, "Please enter your vehicle number", status=400)
        available_parking_spot = ParkingSpot.query.filter_by(
            lot_id=desired_parking_lot_id, status=SPOT_STATUS_AVAILABLE
        ).first()
        if not available_parking_spot:
            parking_lot = ParkingLot.query.get(desired_parking_lot_id)
            lot_name = parking_lot.prime_location_name if parking_lot else "this location"
            return api_response(False, f"Sorry, all parking spots at {lot_name} are currently occupied. Please try another location.", status=400)
        new_reservation = Reservation(
            user_id=current_user_id,
            spot_id=available_parking_spot.id,
            vehicle_number=vehicle_registration,
            parking_timestamp=datetime.now()
        )
        available_parking_spot.user_id = current_user_id
        available_parking_spot.status = SPOT_STATUS_OCCUPIED
        try:
            db.session.add(new_reservation)
            db.session.commit()
            parking_lot = ParkingLot.query.get(desired_parking_lot_id)
            return api_response(True, f"Great! Your parking spot has been reserved at {parking_lot.prime_location_name}", data={
                "reservation": {
                    "id": new_reservation.id,
                    "location": parking_lot.prime_location_name,
                    "spot_number": available_parking_spot.spot_number,
                    "vehicle": vehicle_registration,
                    "hourly_rate": f"₹{round(parking_lot.price)}/hour",
                    "started_at": new_reservation.parking_timestamp.strftime("%I:%M %p on %B %d, %Y")
                }
            }, status=201)
        except Exception:
            db.session.rollback()
            return api_response(False, "Sorry, we couldn't complete your booking right now. Please try again.", status=500)
    
    @jwt_required()
    def delete(self, reservation_id):
        """
        End a parking session and calculate final cost
        Returns: Final bill and session summary
        """
        current_user_id = int(get_jwt_identity())
        user_reservation = Reservation.query.filter_by(
            id=reservation_id, 
            user_id=current_user_id
        ).first()
        if not user_reservation:
            return api_response(False, "Reservation not found. Please check your booking history.", status=404)
        if user_reservation.leaving_timestamp:
            return api_response(False, "This parking session has already been completed.", status=400)
        session_end_time = datetime.now()
        parking_duration = session_end_time - user_reservation.parking_timestamp
        hours_parked = parking_duration.total_seconds() / 3600
        parking_spot = ParkingSpot.query.get(user_reservation.spot_id)
        parking_lot = ParkingLot.query.get(parking_spot.lot_id)
        billable_hours = max(hours_parked, MINIMUM_PARKING_HOURS)
        total_cost = billable_hours * parking_lot.price
        user_reservation.leaving_timestamp = session_end_time
        user_reservation.parking_cost = round(total_cost)
        parking_spot.user_id = None
        parking_spot.status = SPOT_STATUS_AVAILABLE
        try:
            db.session.commit()
            hours = int(hours_parked)
            minutes = int((hours_parked - hours) * 60)
            duration_text = f"{hours} hours and {minutes} minutes" if hours > 0 else f"{minutes} minutes"
            bill_summary = {
                "location": parking_lot.prime_location_name,
                "vehicle": user_reservation.vehicle_number,
                "duration": duration_text,
                "hourly_rate": f"₹{round(parking_lot.price)}",
                "total_cost": f"₹{round(total_cost)}",
                "started_at": user_reservation.parking_timestamp.strftime("%I:%M %p on %B %d"),
                "ended_at": session_end_time.strftime("%I:%M %p on %B %d")
            }
            return api_response(True, f"Parking session ended successfully! Thank you for using {parking_lot.prime_location_name}.", data={"bill_summary": bill_summary})
        except Exception:
            db.session.rollback()
            return api_response(False, "Sorry, we couldn't end your session right now. Please try again.", status=500)


class UserBookingHistoryAPI(Resource):
    """Handle user's booking history and active sessions"""
    
    @jwt_required()
    def get(self):
        """
        Get user's complete parking history
        Returns: List of all bookings (active and completed)
        """
        current_user_id = int(get_jwt_identity())
        all_user_bookings = db.session.query(Reservation, ParkingSpot, ParkingLot).join(
            ParkingSpot, Reservation.spot_id == ParkingSpot.id
        ).join(
            ParkingLot, ParkingSpot.lot_id == ParkingLot.id
        ).filter(
            Reservation.user_id == current_user_id
        ).order_by(Reservation.parking_timestamp.desc()).all()
        booking_history = []
        active_sessions_count = 0
        for reservation, parking_spot, parking_lot in all_user_bookings:
            if reservation.leaving_timestamp:
                session_duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                session_status = 'completed'
                status_display = 'Completed'
                cost_display = f"₹{reservation.parking_cost}" if reservation.parking_cost else "₹0"
            else:
                session_duration = (datetime.now() - reservation.parking_timestamp).total_seconds() / 3600
                session_status = 'active'
                status_display = 'Currently Parked'
                cost_display = "Ongoing..."
                active_sessions_count += 1
            hours = int(session_duration)
            minutes = int((session_duration - hours) * 60)
            duration_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            booking_details = {
                "id": reservation.id,
                "location": {
                    "name": parking_lot.prime_location_name,
                    "address": parking_lot.address
                },
                "vehicle_number": reservation.vehicle_number,
                "spot_number": parking_spot.spot_number,
                "started_at": reservation.parking_timestamp.strftime("%I:%M %p, %b %d, %Y"),
                "ended_at": reservation.leaving_timestamp.strftime("%I:%M %p, %b %d, %Y") if reservation.leaving_timestamp else None,
                "duration": duration_display,
                "cost": cost_display,
                "status": session_status,
                "status_display": status_display,
                "hourly_rate": f"₹{parking_lot.price}/hour"
            }
            booking_history.append(booking_details)
        total_bookings = len(booking_history)
        if total_bookings == 0:
            summary_message = "You haven't made any parking reservations yet. Start by booking your first spot!"
        elif active_sessions_count > 0:
            summary_message = f"You have {active_sessions_count} active parking session(s) and {total_bookings - active_sessions_count} completed booking(s)."
        else:
            summary_message = f"You have {total_bookings} completed parking session(s)."
        return api_response(True, summary_message, data={
            "active_sessions": active_sessions_count,
            "total_bookings": total_bookings,
            "bookings": booking_history
        })


class UserProfileAPI(Resource):
    """Handle user profile information and updates"""
    
    @jwt_required()
    def get(self):
        """
        Get user's profile information and statistics
        Returns: User details with parking statistics
        """
        current_user_id = int(get_jwt_identity())
        user_account = User.query.get(current_user_id)
        if not user_account:
            return api_response(False, "User account not found", status=404)
        all_reservations = Reservation.query.filter_by(user_id=current_user_id).all()
        total_money_spent = sum(reservation.parking_cost or 0 for reservation in all_reservations)
        active_sessions = Reservation.query.filter_by(user_id=current_user_id, leaving_timestamp=None).all()
        return api_response(True, f"Profile information for {user_account.name}", data={
            "profile": {
                "id": user_account.id,
                "username": user_account.username,
                "name": user_account.name if user_account.name else user_account.username,
                "email": user_account.email if user_account.email else "Not provided",
                "member_since": user_account.last_visit.strftime("%B %Y") if user_account.last_visit else "Recently"
            },
            "parking_stats": {
                "total_bookings": len(all_reservations),
                "total_spent": f"₹{total_money_spent}",
                "active_sessions": len(active_sessions),
                "favorite_activity": "Regular Parker" if len(all_reservations) > 5 else "New User"
            }
        })
    
    @jwt_required()
    def put(self):
        current_user_id = int(get_jwt_identity())
        user_account = User.query.get(current_user_id)
        if not user_account:
            return api_response(False, "User account not found", status=404)
        profile_updates = request.get_json()
        if not profile_updates:
            return api_response(False, "No updates provided", status=400)
        updated_fields = []
        if 'name' in profile_updates:
            new_name = profile_updates['name'].strip()
            if new_name and new_name != user_account.name:
                user_account.name = new_name
                updated_fields.append("name")
        if 'email' in profile_updates:
            new_email = profile_updates['email'].strip()
            if new_email and new_email != user_account.email:
                existing_email = User.query.filter(User.email == new_email, User.id != current_user_id).first()
                if existing_email:
                    return api_response(False, f"Email '{new_email}' is already in use by another account", status=400)
                user_account.email = new_email
                updated_fields.append("email")
        try:
            db.session.commit()
            if updated_fields:
                fields_text = " and ".join(updated_fields)
                message = f"Your {fields_text} has been updated successfully!"
            else:
                message = "No changes were made to your profile."
            return api_response(True, message, data={"updated_fields": updated_fields})
        except Exception:
            db.session.rollback()
            return api_response(False, "Sorry, we couldn't update your profile right now. Please try again.", status=500)


class UserChangePasswordAPI(Resource):
    """Handle user password change"""

    @jwt_required()
    def put(self):
        current_user_id = int(get_jwt_identity())
        user_account = User.query.get(current_user_id)
        if not user_account:
            return api_response(False, "User account not found", status=404)
        data = request.get_json()
        if not data:
            return api_response(False, "No data provided", status=400)
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        if not current_password or not new_password:
            return api_response(False, "Current and new password are required", status=400)
        if user_account.password != current_password:
            return api_response(False, "Current password is incorrect", status=400)
        if len(new_password) < 6:
            return api_response(False, "New password must be at least 6 characters", status=400)
        user_account.password = new_password
        try:
            db.session.commit()
            return api_response(True, "Password changed successfully!")
        except Exception:
            db.session.rollback()
            return api_response(False, "Failed to change password. Please try again.", status=500)


class UserCSVExportAPI(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return {"success": False, "message": "User not found"}, 404

            reservations = Reservation.query.filter_by(user_id=current_user_id).all()
            csv_content = [[
                'Reservation ID', 'Parking Lot', 'Address', 'Spot Number',
                'Vehicle Number', 'Check-in Time', 'Check-out Time',
                'Duration (Hours)', 'Hourly Rate (₹)', 'Total Cost (₹)', 'Status'
            ]]

            for reservation in reservations:
                spot = reservation.spot
                lot = spot.lot if spot else None
                duration = ""
                hourly_rate = ""
                total_cost = ""

                if reservation.parking_timestamp and reservation.leaving_timestamp:
                    duration_delta = reservation.leaving_timestamp - reservation.parking_timestamp
                    duration = f"{duration_delta.total_seconds() / 3600:.2f}"
                    hourly_rate = f"{lot.price}" if lot else "N/A"
                    total_cost = f"{reservation.parking_cost:.2f}" if reservation.parking_cost else "N/A"

                csv_content.append([
                    reservation.id,
                    lot.prime_location_name if lot else "N/A",
                    lot.address if lot else "N/A",
                    spot.spot_number if spot else "N/A",
                    reservation.vehicle_number,
                    reservation.parking_timestamp.strftime('%Y-%m-%d %H:%M:%S') if reservation.parking_timestamp else "N/A",
                    reservation.leaving_timestamp.strftime('%Y-%m-%d %H:%M:%S') if reservation.leaving_timestamp else "Active",
                    duration or "Active",
                    hourly_rate or "N/A",
                    total_cost or "Active",
                    "Completed" if reservation.leaving_timestamp else "Active"
                ])

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerows(csv_content)
            csv_string = output.getvalue()
            output.close()

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"my_parking_history_{timestamp}.csv"

            return Response(
                csv_string,
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; filename={filename}'}
            )

        except Exception as e:
            return api_response(False, f"Export failed: {str(e)}", status=500)





