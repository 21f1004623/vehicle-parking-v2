import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')

    # Basic configuration — override defaults via environment variables
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-me-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///parking.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-me-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    # Redis and Celery configuration
    app.config["CELERY"] = {
        "broker_url": f"{redis_url}/0",      # Database 0 - Task Queue
        "result_backend": f"{redis_url}/1",  # Database 1 - Results
        "broker_connection_retry_on_startup": True
    }
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Initialize Redis cache
    from applications.cache import cache
    cache.init_app(app)
    
    return app

def init_database(app):
    """Initialize database tables and create admin user"""
    with app.app_context():
        from applications.models import User, ParkingLot, ParkingSpot, Reservation
        db.create_all()
        
        # Create admin user if doesn't exist
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                name='Administrator',
                username='admin',
                email='admin@parkingsystem.com',
                password='admin',
                is_admin=True
            )
            db.session.add(admin_user)
            db.session.commit()
        
        # Create sample parking lots if they don't exist
        if ParkingLot.query.count() == 0:
            parking_lots_data = [
                {
                    'name': 'Park Street Metro Parking',
                    'price': 25.0,
                    'address': '15 Park Street, Near Metro Station',
                    'pin_code': '700016',
                    'spots': 20
                },
                {
                    'name': 'Netaji Subhash Airport Parking',
                    'price': 35.0,
                    'address': 'Jessore Road, Dum Dum Airport',
                    'pin_code': '700052',
                    'spots': 50
                },
                {
                    'name': 'New Market Shopping Complex',
                    'price': 20.0,
                    'address': '19 Lindsay Street, New Market Area',
                    'pin_code': '700087',
                    'spots': 30
                },
                {
                    'name': 'Salt Lake Sector V IT Hub',
                    'price': 40.0,
                    'address': 'Sector V, Salt Lake City',
                    'pin_code': '700091',
                    'spots': 25
                },
                {
                    'name': 'Jadavpur University Campus',
                    'price': 15.0,
                    'address': '188 Raja S.C. Mallick Road, Jadavpur',
                    'pin_code': '700032',
                    'spots': 100
                }
            ]
            
            for lot_data in parking_lots_data:
                # Create parking lot
                parking_lot = ParkingLot(
                    prime_location_name=lot_data['name'],
                    price=lot_data['price'],
                    address=lot_data['address'],
                    pin_code=lot_data['pin_code'],
                    number_of_spots=lot_data['spots'],
                    admin_id=admin_user.id
                )
                db.session.add(parking_lot)
                db.session.flush()  # Get the ID for the parking lot
                
                # Create parking spots for this lot
                for spot_num in range(1, lot_data['spots'] + 1):
                    parking_spot = ParkingSpot(
                        lot_id=parking_lot.id,
                        status='A',  # Available
                        spot_number=spot_num
                    )
                    db.session.add(parking_spot)
            
            db.session.commit() 