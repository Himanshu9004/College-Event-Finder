# app.py (Updated with AI Generative Content)

import os
import openai # NAYA: OpenAI import kiya
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
from sqlalchemy import func 

# --- App, DB, aur CORS Setup ---
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'events.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'event-finder-secret-key-12345'

# NAYA: OpenAI API Key Setup
# Environment Variable se API key load karega
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    print("Warning: OPENAI_API_KEY environment variable not set. AI features will fail.")


db = SQLAlchemy(app)
CORS(app, supports_credentials=True) 

# --- DATABASE MODELS (Tables) ---
# (Yahaan poora ka poora 'registrations' Table, 'Event' class, 'Organization' class, aur 'User' class AAYEGA)
# (Aapki file se poora copy-paste kar dein - YEH IMPORTANT HAI)
# ...
# ... (Poora Model code yahaan paste karein) ...
# ...

# --- NAYA: Many-to-Many Table ---
registrations = db.Table('registrations',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('event_id', db.Integer, db.ForeignKey('event.id'), primary_key=True)
)

# --- DATABASE MODELS (Tables) ---

class Event(db.Model):
    __tablename__ = 'event' 
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    club = db.Column(db.String(100), nullable=False)
    eligible = db.Column(db.String(100))
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    link = db.Column(db.String(200))
    
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'club': self.club,
            'eligible': self.eligible,
            'date': self.date.strftime('%Y-%m-%d'),
            'description': self.description,
            'link': self.link,
            'organization_id': self.organization_id
        }

class Organization(db.Model):
    __tablename__ = 'organization'
    id = db.Column(db.Integer, primary_key=True)
    org_name = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    college_name = db.Column(db.String(200))
    password_hash = db.Column(db.String(256))
    
    events = db.relationship('Event', backref='organizer', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.org_name,
            'email': self.email,
            'college': self.college_name
        }

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    user_type = db.Column(db.String(50), nullable=False, default='Student')
    institution = db.Column(db.String(100), nullable=False, default='Unknown')

    registered_events = db.relationship('Event', secondary=registrations, lazy='subquery',
        backref=db.backref('registered_users', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'user_type': self.user_type,
            'institution': self.institution
        }

# --- Helper: Check karo ki user logged in hai ya nahi ---
def is_user_logged_in():
    return 'user_id' in session and session.get('user_type') == 'user'

def is_org_logged_in():
    return 'org_id' in session and session.get('user_type') == 'org'

def is_admin_logged_in():
    return 'admin_id' in session and session.get('user_type') == 'admin'


# ===============================================
# === SECTION 1: ORGANIZATION API ROUTES ===
# ===============================================
# (Yahaan org_register, org_login, create_event, get_my_events, delete_event, get_org_profile aayega)
# ... (Aapki file se poora copy-paste kar dein) ...
@app.route('/api/org/register', methods=['POST'])
def org_register():
    data = request.get_json()
    if Organization.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    if Organization.query.filter_by(org_name=data['org_name']).first():
        return jsonify({'message': 'Organization name already taken'}), 400

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
        session['org_id'] = org.id
        session['user_type'] = 'org' 
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/api/create-event', methods=['POST'])
def create_event():
    if not is_org_logged_in():
        return jsonify({'message': 'Organization not logged in'}), 401

    data = request.get_json()
    
    try:
        event_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    new_event = Event(
        name=data['name'],
        club=data['club'],
        eligible=data['eligible'],
        date=event_date,
        description=data['description'],
        link=data['link'],
        organization_id=session['org_id']
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event created successfully!'}), 201

@app.route('/api/org/my-events', methods=['GET'])
def get_my_events():
    if not is_org_logged_in():
        return jsonify({'message': 'Organization not logged in'}), 401
    
    org_id = session['org_id']
    events = Event.query.filter_by(organization_id=org_id).all()
    
    return jsonify([event.to_dict() for event in events]), 200

@app.route('/api/org/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    if not is_org_logged_in():
        return jsonify({'message': 'Organization not logged in'}), 401
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    if event.organization_id != session['org_id']:
        return jsonify({'message': 'Unauthorized to delete this event'}), 403
    
    event.registered_users = []
    
    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted successfully'}), 200

@app.route('/api/org/profile', methods=['GET'])
def get_org_profile():
    if not is_org_logged_in():
        return jsonify({'message': 'Organization not logged in'}), 401
    
    org_id = session['org_id']
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({'message': 'Organization not found'}), 404
        
    return jsonify({
        'org_info': org.to_dict()
    }), 200

# ===============================================
# === SECTION 2: USER API ROUTES ===
# ===============================================
# (Yahaan user_register, user_login, get_all_events, register_for_event, get_user_profile aayega)
# ... (Aapki file se poora copy-paste kar dein) ...
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
        password_hash=hashed_password,
        user_type=data.get('user_type', 'Student'),
        institution=data.get('institution', 'Unknown')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first() 

    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        session['user_type'] = 'user'
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/api/all-events', methods=['GET'])
def get_all_events():
    events = Event.query.all()
    return jsonify([event.to_dict() for event in events]), 200

@app.route('/api/user/register-event/<int:event_id>', methods=['POST'])
def register_for_event(event_id):
    if not is_user_logged_in():
        return jsonify({'message': 'User not logged in'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    event = Event.query.get(event_id)

    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    if event in user.registered_events:
        return jsonify({'message': 'Already registered for this event'}), 200 

    user.registered_events.append(event)
    db.session.commit()
    return jsonify({'message': 'Registered successfully!'}), 201

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    if not is_user_logged_in():
        return jsonify({'message': 'User not logged in'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # --- Ranking Logic ---
    total_events_registered = len(user.registered_events)
    
    all_users_ranks = db.session.query(
        User.id, 
        func.count(registrations.c.event_id).label('event_count')
    ).outerjoin(registrations).group_by(User.id).order_by(func.count(registrations.c.event_id).desc()).all()
    
    overall_rank = -1
    for i, (id, count) in enumerate(all_users_ranks):
        if id == user_id:
            overall_rank = i + 1 
            break
            
    total_users = len(all_users_ranks)

    institution_users_ranks = db.session.query(
        User.id, 
        func.count(registrations.c.event_id).label('event_count')
    ).outerjoin(registrations).filter(User.institution == user.institution).group_by(User.id).order_by(func.count(registrations.c.event_id).desc()).all()

    institution_rank = -1
    for i, (id, count) in enumerate(institution_users_ranks):
        if id == user_id:
            institution_rank = i + 1
            break
            
    total_in_institution = len(institution_users_ranks)

    return jsonify({
        'user_info': user.to_dict(),
        'registered_events': [event.to_dict() for event in user.registered_events],
        'stats': {
            'total_events': total_events_registered,
            'overall_rank': overall_rank,
            'total_users': total_users,
            'institution_rank': institution_rank,
            'total_in_institution': total_in_institution
        }
    }), 200

# ===============================================
# === NAYA SECTION: AI GENERATIVE CONTENT ===
# ===============================================
@app.route('/api/user/generate-event-view/<int:event_id>', methods=['GET'])
def generate_event_view(event_id):
    if not is_user_logged_in():
        return jsonify({'message': 'User not logged in'}), 401
        
    if not openai.api_key:
        return jsonify({'message': 'AI service not configured'}), 500

    user = User.query.get(session['user_id'])
    event = Event.query.get(event_id)

    if not user or not event:
        return jsonify({'message': 'User or Event not found'}), 404

    # AI Prompt Engineering
    prompt = f"""
    Ek event description ko rewrite karo (bas description hi dena).
    
    USER PROFILE:
    - Username: {user.username}
    - Type: {user.user_type}
    - Institution: {user.institution}

    ORIGINAL EVENT DESCRIPTION:
    "{event.description}"

    EVENT NAME: {event.name}
    CLUB: {event.club}

    TASK:
    Upar diye gaye user profile ke liye is event description ko zyada exciting aur personal banakar rewrite karo.
    User ko directly address karo (jaise "Aapke liye...").
    Focus on "kyun" yeh event user ke liye important ho sakta hai.
    Tone: Exciting, friendly, aur professional.
    Output: SIRF naya description text dena.
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert copywriter for college events."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        ai_description = response.choices[0].message['content'].strip()
        
        return jsonify({'ai_description': ai_description}), 200

    except Exception as e:
        print(f"OpenAI API error: {e}")
        # Agar AI fail hota hai, toh original description bhej do
        return jsonify({'ai_description': event.description}), 500


# ===============================================
# === SECTION 3 & 4: ADMIN & LOGOUT ===
# ===============================================
# (Yahaan admin_login, get_admin_stats, get_all_organizations, aur logout aayega)
# ... (Aapki file se poora copy-paste kar dein) ...
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    ADMIN_EMAIL = "admin@app.com"
    ADMIN_PASS = "admin123"
    
    if data['email'] == ADMIN_EMAIL and data['password'] == ADMIN_PASS:
        session['admin_id'] = "admin_user"
        session['user_type'] = 'admin'
        return jsonify({'message': 'Admin login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid admin credentials'}), 401

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    if not is_admin_logged_in():
        return jsonify({'message': 'Admin not logged in'}), 401
    
    total_users = User.query.count()
    total_orgs = Organization.query.count()
    
    return jsonify({
        'total_users': total_users,
        'total_organizations': total_orgs
    }), 200

@app.route('/api/admin/organizations', methods=['GET'])
def get_all_organizations():
    if not is_admin_logged_in():
        return jsonify({'message': 'Admin not logged in'}), 401
    
    orgs = Organization.query.all()
    return jsonify([org.to_dict() for org in orgs]), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear() 
    return jsonify({'message': 'Logged out successfully'}), 200

# --- Server Run Karne ke liye ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all() 
    app.run(debug=True, port=5000)