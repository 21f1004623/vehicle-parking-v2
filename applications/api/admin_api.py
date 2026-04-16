from flask import request
from flask_restful import Resource
from applications.models import User, ParkingLot, ParkingSpot, Reservation
from applications import db
from applications.worker import export_csv
from applications.utils import api_response
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from celery.result import AsyncResult


class AdminAPI(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return api_response(False, "No data provided", status=400)
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return api_response(False, "Username and password required", status=400)
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password) and user.is_admin:
            access_token = create_access_token(identity=str(user.id))
            return api_response(True, data={
                "token": access_token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "is_admin": user.is_admin,
                    "name": user.name or user.username
                }
            })
        return api_response(False, "Invalid credentials or insufficient privileges", status=401)


class AdminParkingLotsAPI(Resource):
    @jwt_required()
    def get(self):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        lots = ParkingLot.query.filter_by(admin_id=current_user_id).all()
        lots_data = [{
            "id": lot.id,
            "prime_location_name": lot.prime_location_name,
            "address": lot.address,
            "price": lot.price,
            "pin_code": lot.pin_code,
            "number_of_spots": lot.number_of_spots,
            "available_spots": sum(1 for s in lot.parking_spots if s.status == 'A')
        } for lot in lots]
        return api_response(True, data={"lots": lots_data})
    
    @jwt_required()
    def post(self):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        data = request.get_json()
        new_lot = ParkingLot(
            prime_location_name=data['prime_location_name'],
            price=data['price'],
            address=data['address'],
            pin_code=data['pin_code'],
            number_of_spots=data['number_of_spots'],
            admin_id=current_user_id
        )
        db.session.add(new_lot)
        db.session.commit()
        for i in range(data['number_of_spots']):
            db.session.add(ParkingSpot(lot_id=new_lot.id, spot_number=i+1, status='A'))
        db.session.commit()
        return api_response(True, "Parking lot created successfully", status=201)
    
    @jwt_required()
    def put(self, lot_id):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        lot = ParkingLot.query.get(lot_id)
        if not lot or lot.admin_id != current_user_id:
            return api_response(False, "Parking lot not found", status=404)
        data = request.get_json()
        lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
        lot.price = data.get('price', lot.price)
        lot.address = data.get('address', lot.address)
        lot.pin_code = data.get('pin_code', lot.pin_code)
        new_spot_count = data.get('number_of_spots', lot.number_of_spots)
        if new_spot_count != lot.number_of_spots:
            current_spots = ParkingSpot.query.filter_by(lot_id=lot.id).order_by(ParkingSpot.spot_number).all()
            current_count = len(current_spots)
            if new_spot_count > current_count:
                for i in range(current_count, new_spot_count):
                    db.session.add(ParkingSpot(lot_id=lot.id, spot_number=i+1, status='A'))
            elif new_spot_count < current_count:
                spots_to_remove = current_spots[new_spot_count:]
                for spot in spots_to_remove:
                    if spot.status == 'A':
                        db.session.delete(spot)
                    else:
                        return api_response(False, f"Cannot remove spot {spot.spot_number} as it is currently occupied.", status=400)
            lot.number_of_spots = new_spot_count
        db.session.commit()
        return api_response(True, "Parking lot updated successfully")
    
    @jwt_required()
    def delete(self, lot_id):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        lot = ParkingLot.query.get(lot_id)
        if not lot or lot.admin_id != current_user_id:
            return api_response(False, "Parking lot not found", status=404)
        spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
        for spot in spots:
            Reservation.query.filter_by(spot_id=spot.id).delete()
        ParkingSpot.query.filter_by(lot_id=lot_id).delete()
        db.session.delete(lot)
        db.session.commit()
        return api_response(True, "Parking lot deleted successfully")


class AdminSummaryStatsAPI(Resource):
    """Return high-level stats for the admin dashboard header cards"""

    @jwt_required()
    def get(self):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)

        total_lots = ParkingLot.query.filter_by(admin_id=current_user_id).count()
        total_users = User.query.filter_by(is_admin=False).count()

        all_reservations = (
            db.session.query(Reservation)
            .join(ParkingSpot, Reservation.spot_id == ParkingSpot.id)
            .join(ParkingLot, ParkingSpot.lot_id == ParkingLot.id)
            .filter(ParkingLot.admin_id == current_user_id)
            .all()
        )

        active_count = sum(1 for r in all_reservations if not r.leaving_timestamp)
        total_revenue = sum(r.parking_cost or 0 for r in all_reservations if r.leaving_timestamp)

        return api_response(True, data={
            "total_lots": total_lots,
            "total_users": total_users,
            "active_reservations": active_count,
            "total_revenue": round(total_revenue),
            "total_reservations": len(all_reservations)
        })


class AdminUsersAPI(Resource):
    @jwt_required()
    def get(self):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        users = User.query.filter_by(is_admin=False).all()
        users_data = []
        for user in users:
            user_reservations = Reservation.query.filter_by(user_id=user.id).all()
            total_revenue = sum(r.parking_cost or 0 for r in user_reservations)
            current_spot = ParkingSpot.query.filter_by(user_id=user.id).first()
            users_data.append({
                "id": user.id,
                "username": user.username,
                "name": user.username,
                "email": getattr(user, 'email', None),
                "total_reservations": len(user_reservations),
                "total_revenue": total_revenue,
                "current_spot": current_spot.id if current_spot else None
            })
        return api_response(True, data={"users": users_data})


class AdminReservationsAPI(Resource):
    @jwt_required()
    def get(self):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        reservations = db.session.query(Reservation, User, ParkingSpot, ParkingLot).join(
            User, Reservation.user_id == User.id
        ).join(
            ParkingSpot, Reservation.spot_id == ParkingSpot.id
        ).join(
            ParkingLot, ParkingSpot.lot_id == ParkingLot.id
        ).filter(
            ParkingLot.admin_id == current_user_id
        ).all()
        reservations_data = []
        for reservation, user, spot, lot in reservations:
            duration = 0
            status = 'active'
            if reservation.leaving_timestamp:
                duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                status = 'completed'
            else:
                duration = (datetime.now() - reservation.parking_timestamp).total_seconds() / 3600
            reservations_data.append({
                "id": reservation.id,
                "username": user.username,
                "parking_lot_name": lot.prime_location_name,
                "vehicle_number": reservation.vehicle_number,
                "parking_timestamp": reservation.parking_timestamp.isoformat(),
                "leaving_timestamp": reservation.leaving_timestamp.isoformat() if reservation.leaving_timestamp else None,
                "duration_hours": round(duration, 2),
                "parking_cost": reservation.parking_cost,
                "status": status
            })
        return api_response(True, data={"reservations": reservations_data})


class CancelBookingAPI(Resource):
    @jwt_required()
    def put(self, reservation_id):
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return api_response(False, "Reservation not found", status=404)
        if reservation.leaving_timestamp:
            return api_response(False, "Reservation already completed", status=400)
        # Calculate cost and end reservation
        duration = datetime.now() - reservation.parking_timestamp
        hours = duration.total_seconds() / 3600
        # Get parking lot to calculate cost
        spot = ParkingSpot.query.get(reservation.spot_id)
        lot = ParkingLot.query.get(spot.lot_id)
        cost = max(hours * lot.price, lot.price)  # Minimum 1 hour charge
        reservation.leaving_timestamp = datetime.now()
        reservation.parking_cost = round(cost)
        # Free up the parking spot
        spot.user_id = None
        spot.status = 'A'  # Set status back to Available
        db.session.commit()
        return api_response(True, "Booking cancelled successfully", data={"cost": round(cost)})


class CSVExportAPI(Resource):
    """Handle CSV export for parking lot data"""
    
    @jwt_required()
    def get(self):
        """
        Trigger CSV export job and return task ID
        Returns: Task ID for monitoring export progress
        """
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        # Start background CSV export task
        task = export_csv.delay()
        return api_response(True, "CSV export started", data={"task_id": task.id}, status=202)

    @jwt_required()
    def post(self):
        """
        Get CSV export result by task ID
        Returns: CSV data or task status
        """
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return api_response(False, "Access denied", status=403)
        data = request.get_json()
        task_id = data.get('task_id')
        if not task_id:
            return api_response(False, "Task ID required", status=400)
        # Get task result
        task_result = AsyncResult(task_id)
        if task_result.state == 'PENDING':
            return api_response(False, "Export still in progress", data={"state": task_result.state}, status=202)
        elif task_result.state == 'SUCCESS':
            file_info = task_result.result
            return api_response(True, "CSV file generated successfully", data={"file_info": file_info}, status=200)
        else:
            return api_response(False, "Export failed", data={"state": task_result.state}, status=500)



