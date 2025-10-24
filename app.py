# app.py (Full & Final Code)

import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date # Auto-delete ke liye zaroori

# --- App, DB, aur CORS Setup ---
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

# Ek hi database file 'events.db' use karenge, jismein 3 alag-alag tables hongi
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'events.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app) # Taaki frontend aur backend baat kar sakein

# --- DATABASE MODELS (Tables) ---

# 1. Event Model
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    club = db.Column(db.String(100), nullable=False)
    eligible = db.Column(db.String(100))
    # Auto-delete ke liye date ka type 'Date' hona zaroori hai
    date = db.Column(db.Date, nullable=False) 
    description = db.Column(db.Text)
    link = db.Column(db.String(200))

    # Event ko dictionary (JSON) me badalne ke liye helper function
    def to_dict(self):
        return { 
            'id': self.id, 
            'name': self.name, 
            'club': self.club, 
            'eligible': self.eligible, 
            'date': self.date, # Ye 'date' object rahega
            'description': self.description, 
            'link': self.link 
        }

# 2. User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # Password ko hash (encrypt) karke save karenge
    password_hash = db.Column(db.String(256)) 

# 3. Organization Model
class Organization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    org_name = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    college_name = db.Column(db.String(200))
    password_hash = db.Column(db.String(256))


# --- API ROUTES ---

# == Events API ==

@app.route('/api/create-event', methods=['POST'])
def create_event():
    data = request.get_json()

    # HTML se aayi string date ("YYYY-MM-DD") ko 'date' object me convert karo
    try:
        event_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    new_event = Event(
        name=data['name'],
        club=data['club'],
        eligible=data['eligible'],
        date=event_date, # Converted date object save karo
        description=data['description'],
        link=data['link']
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event created successfully!'}), 201

@app.route('/api/all-events', methods=['GET'])
def get_all_events():
    
    # --- AUTO-DELETE LOGIC ---
    try:
        today = date.today()
        # Un sabhi events ko delete karo jinki date aaj se puraani hai
        Event.query.filter(Event.date < today).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting old events: {e}")
    # --- END AUTO-DELETE ---

    # Ab, sirf bache hue (active) events ko database se nikaalo
    events_list = Event.query.all() 
    
    # Events ko dictionary ki list me badlo
    events_json = [event.to_dict() for event in events_list]
    
    # JSON bhejne se pehle 'date' object ko waapas string me badlo
    for event_json in events_json:
        if isinstance(event_json['date'], date):
             event_json['date'] = event_json['date'].strftime('%Y-%m-%d')
            
    return jsonify(events_json)


# == Organization Auth API ==

@app.route('/api/org/register', methods=['POST'])
def org_register():
    data = request.get_json()
    if Organization.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400

    hashed_password = generate_password_hash(data['password'])
    
    new_org = Organization(
        org_name=data['org_name'],
        email=data['email'],
        college_name=data['college_name'],
        password_hash=hashed_password
    )
    db.session.add(new_org)
    db.session.commit()
    return jsonify({'message': 'Organization registered successfully!'}), 201

@app.route('/api/org/login', methods=['POST'])
def org_login():
    data = request.get_json()
    org = Organization.query.filter_by(email=data['email']).first()

    if org and check_password_hash(org.password_hash, data['password']):
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401


# == User Auth API ==

@app.route('/api/user/register', methods=['POST'])
def user_register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already taken'}), 400

    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        email=data['email'],
        username=data['username'],
        password_hash=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first() # Email se login

    if user and check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401


# --- Server Run Karne ke liye ---
if __name__ == '__main__':
    with app.app_context():
        # Server start hone par saari tables (Event, User, Organization) create karo
        db.create_all() 
    app.run(debug=True, port=5000)