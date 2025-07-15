from datetime import datetime
from applications import db

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password = db.Column(db.String(255), nullable=False)
    last_visit = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)  # True for admin, False for regular user
    created_parking_lots = db.relationship("ParkingLot", back_populates="admin")
    reservations = db.relationship("Reservation", back_populates="user")

class ParkingLot(db.Model):
    __tablename__ = 'parking_lot'
    id = db.Column(db.Integer, primary_key=True)
    prime_location_name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)  # Price per hour
    address = db.Column(db.String(255), nullable=False)
    pin_code = db.Column(db.String(10), nullable=False)
    number_of_spots = db.Column(db.Integer, nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    admin = db.relationship('User', back_populates='created_parking_lots')
    parking_spots = db.relationship('ParkingSpot', back_populates='lot', cascade="all, delete-orphan")

class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parking_lot.id'), nullable=False)
    status = db.Column(db.String(1), default='A')  # 'A' for Available, 'O' for Occupied
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    spot_number = db.Column(db.Integer, nullable=False, default=1)
    lot = db.relationship('ParkingLot', back_populates='parking_spots')
    reservations = db.relationship('Reservation', back_populates='spot', cascade="all, delete-orphan")

class Reservation(db.Model):
    __tablename__ = 'reservation'
    id = db.Column(db.Integer, primary_key=True)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    parking_timestamp = db.Column(db.DateTime, nullable=False)
    leaving_timestamp = db.Column(db.DateTime, nullable=True)
    parking_cost = db.Column(db.Float, nullable=True)
    vehicle_number = db.Column(db.String(20), nullable=False)
    spot = db.relationship('ParkingSpot', back_populates='reservations')
    user = db.relationship('User', back_populates='reservations')
