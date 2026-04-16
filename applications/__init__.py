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
    """Initialize database tables and seed demo data"""
    with app.app_context():
        from applications.models import User, ParkingLot, ParkingSpot, Reservation
        from werkzeug.security import generate_password_hash
        from datetime import datetime, timedelta
        import random
        db.create_all()

        # ── Admin user ────────────────────────────────────────────────────────
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                name='Administrator',
                username='admin',
                email='admin@parkingsystem.com',
                password=generate_password_hash('admin'),
                is_admin=True
            )
            db.session.add(admin_user)
            db.session.commit()

        # ── Regular users ─────────────────────────────────────────────────────
        seed_users = [
            ('user1', 'User One',   'user1@example.com', 'user1'),
            ('user2', 'User Two',   'user2@example.com', 'user2'),
            ('user3', 'User Three', 'user3@example.com', 'user3'),
            ('user4', 'User Four',  'user4@example.com', 'user4'),
            ('user5', 'User Five',  'user5@example.com', 'user5'),
        ]
        users = {}
        for username, name, email, password in seed_users:
            u = User.query.filter_by(username=username).first()
            if not u:
                u = User(name=name, username=username, email=email, password=generate_password_hash(password),
                         last_visit=datetime.utcnow() - timedelta(days=random.randint(0, 10)))
                db.session.add(u)
            users[username] = u
        db.session.commit()

        # ── Parking lots & spots ──────────────────────────────────────────────
        if ParkingLot.query.count() == 0:
            parking_lots_data = [
                ('Park Street Metro Parking',     25.0, '15 Park Street, Near Metro Station',  '700016', 20),
                ('Netaji Subhash Airport Parking', 35.0, 'Jessore Road, Dum Dum Airport',       '700052', 50),
                ('New Market Shopping Complex',    20.0, '19 Lindsay Street, New Market Area',  '700087', 30),
                ('Salt Lake Sector V IT Hub',      40.0, 'Sector V, Salt Lake City',            '700091', 25),
                ('Jadavpur University Campus',     15.0, '188 Raja S.C. Mallick Road, Jadavpur','700032', 40),
            ]
            for name, price, address, pin, spots in parking_lots_data:
                lot = ParkingLot(
                    prime_location_name=name, price=price,
                    address=address, pin_code=pin,
                    number_of_spots=spots, admin_id=admin_user.id
                )
                db.session.add(lot)
                db.session.flush()
                for spot_num in range(1, spots + 1):
                    db.session.add(ParkingSpot(lot_id=lot.id, status='A', spot_number=spot_num))
            db.session.commit()

        # ── Reservations (past + active) ──────────────────────────────────────
        if Reservation.query.count() == 0:
            all_spots = ParkingSpot.query.all()
            all_lots  = {s.lot_id: s.lot for s in all_spots}
            regular_users = list(users.values())
            vehicles = ['KA01AB1234','MH02CD5678','DL03EF9012',
                        'TN04GH3456','WB05IJ7890','UP06KL2345']
            now = datetime.utcnow()

            # Past completed reservations spread over last 60 days
            for i in range(80):
                spot = random.choice(all_spots)
                user = random.choice(regular_users)
                price_per_hour = all_lots[spot.lot_id].price
                start = now - timedelta(days=random.randint(1, 60),
                                        hours=random.randint(0, 20))
                duration_hrs = random.uniform(0.5, 8)
                end = start + timedelta(hours=duration_hrs)
                cost = round(price_per_hour * duration_hrs, 2)
                db.session.add(Reservation(
                    spot_id=spot.id, user_id=user.id,
                    parking_timestamp=start, leaving_timestamp=end,
                    parking_cost=cost,
                    vehicle_number=random.choice(vehicles)
                ))

            # Active reservations (no leaving_timestamp)
            used_spots = set()
            for user in regular_users:
                spot = random.choice([s for s in all_spots if s.id not in used_spots])
                used_spots.add(spot.id)
                spot.status = 'O'
                spot.user_id = user.id
                db.session.add(Reservation(
                    spot_id=spot.id, user_id=user.id,
                    parking_timestamp=now - timedelta(hours=random.uniform(0.5, 3)),
                    leaving_timestamp=None,
                    parking_cost=None,
                    vehicle_number=random.choice(vehicles)
                ))

            db.session.commit()