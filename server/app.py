import re
import time
import json
import random
import string
import secrets
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import threading
import traceback
import requests
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, verify_jwt_in_request
import os
from flask_jwt_extended.exceptions import JWTExtendedException
# Import the optimized tracker functions
from Tracker import get_team_data

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'Z9qilGEJQpAvFdby6C5sVGeChCwLjdFUYxVtII0qpXw4GTtPwhb7QbRzwd4qqmIcdQ5Nm1YQIz6xtcT4gQRbLQ==')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 60 * 60 * 24 * 7  # 7 days
app.config['JWT_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') != 'development'  # Only send cookies over HTTPS in production
app.config['JWT_COOKIE_CSRF_PROTECT'] = True  # Protect against CSRF
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'  # This was missing! Specify where to look for tokens
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers'] 
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
# app.config['JWT_ACCESS_COOKIE_PATH'] = '/'

CORS(app, 
     supports_credentials=True, 
     origins=[os.environ.get('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000')],
     allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Set-Cookie"])

jwt = JWTManager(app)


# Add this to handle failed token verification
@jwt.unauthorized_loader
def unauthorized_callback(error):
    print("Missing token:", error)
    return jsonify({"error": "Unauthorized access - No valid token provided"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print("Invalid token:", error)
    return jsonify({"error": "Invalid token"}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("Token has expired:", jwt_payload)
    return jsonify({"error": "Token has expired"}), 401



SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_AUTH_URL = f"{SUPABASE_URL}/auth/v1/user"

def verify_jwt(token):
    headers = {"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY}
    response = requests.get(SUPABASE_AUTH_URL, headers=headers)
    return response.json() if response.status_code == 200 else None

@jwt.token_verification_failed_loader
def token_verification_failed_callback(jwt_header, jwt_payload):
    print("Token verification failed")
    return jsonify({"error": "Token verification failed"}), 401

@app.errorhandler(JWTExtendedException)
def handle_jwt_exceptions(error):
    print(f"JWT Exception: {str(error)}")
    return jsonify({"error": str(error)}), 401

@app.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get JSON data
        data = request.json
        print("Registration data received:", data)  # Debugging
        
        # Extract required fields
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("full_name")  # Still get full_name from request
        team_id = data.get("team_id")
        
        # Validate all required fields
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not password:
            return jsonify({"error": "Password is required"}), 400
        if not full_name:
            return jsonify({"error": "Name is required"}), 400
        if not team_id:
            return jsonify({"error": "Team ID is required"}), 400
            
        # Validate team ID format if needed
        if not re.match(r'^[a-z0-9]{8}$', str(team_id).lower()):
            return jsonify({"error": "Team ID must be 8 alphanumeric characters"}), 400

        # Register user with Supabase Auth
        response = requests.post(f"{SUPABASE_URL}/auth/v1/signup", json={
            "email": email,
            "password": password
        }, headers={"apikey": SUPABASE_KEY})

        if response.status_code == 400:
            # User might already exist
            error_msg = response.json().get("msg", "Registration failed")
            return jsonify({"error": error_msg}), 400
        
        if response.status_code != 200:
            print("Supabase signup error:", response.text)  # Debugging
            return jsonify({"error": "Registration failed"}), 400

        user_id = response.json().get("id")  # Get user ID
        if not user_id:
            print("No user ID in response:", response.json())  # Debugging
            return jsonify({"error": "Failed to create user account"}), 500

        # Create a profile in `profiles` table - use first_name instead of full_name
        profile_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/profiles", 
            json={
                "id": user_id,
                "first_name": full_name,  # Changed to first_name to match the database schema
                "team_id": team_id
            }, 
            headers={
                "apikey": SUPABASE_KEY, 
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
        )
        
        if profile_response.status_code not in [200, 201]:
            print("Profile creation error:", profile_response.text)  # Debugging
            # Clean up the user if profile creation fails
            requests.delete(
                f"{SUPABASE_URL}/auth/v1/user/{user_id}",
                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            )
            return jsonify({"error": "Failed to create user profile"}), 500

        # Check if confirmation email is required
        requires_confirmation = response.json().get("confirmation_sent_at") is not None

        return jsonify({
            "success": True, 
            "message": "User registered successfully. Please check your email for confirmation link." if requires_confirmation else "User registered successfully. You can now log in.",
            "requires_confirmation": requires_confirmation
        }), 201
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())  # Print full traceback
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        print(f"Login attempt for {email}")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Authenticate with Supabase
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password", 
            json={
                "email": email,
                "password": password
            }, 
            headers={"apikey": SUPABASE_KEY}
        )

        print(f"Supabase response: {response.status_code}")
        
        if response.status_code != 200:
            # Log the error for debugging
            error_data = response.json() if response.text else "No response data"
            print(f"Login failed: {error_data}")
            return jsonify({"error": "Invalid credentials"}), 401

        # Parse the response
        user_data = response.json()
        print(f"User authenticated successfully: {user_data.get('user', {}).get('id')}")
        
        user_id = user_data.get("user", {}).get("id")
        if not user_id:
            print("No user ID found in response")
            return jsonify({"error": "Authentication error"}), 500

        # Create an access token with the user_id
        access_token = create_access_token(identity=user_id)
        
        # Create a response
        resp = jsonify({"success": True, "message": "Login successful"})
        
        # Log the token for debugging
        print(f"Generated JWT token (first 20 chars): {access_token[:20]}...")
        
        # Set the JWT as a cookie with explicit parameters
        max_age = 60*60*24*7  # 7 days
        resp.set_cookie(
            "access_token", 
            access_token, 
            httponly=True, 
            secure=app.config.get('JWT_COOKIE_SECURE', False), 
            samesite="Strict", 
            max_age=max_age,
            path="/"
        )
        
        print(f"Login successful, token set for user {user_id}")
        print(f"Response headers: {dict(resp.headers)}")
        return resp
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())  # Print full traceback
        return jsonify({"error": "An unexpected error occurred"}), 500
# In-memory storage for matches
matches = {}
active_scrapes = {}
team_data_cache = {}

# Add a logout route
@app.route('/logout', methods=['POST'])
def logout():
    resp = jsonify({"success": True, "message": "Logged out successfully"})
    resp.delete_cookie("access_token")
    return resp

@app.route('/protected', methods=['GET'])
def protected():
    try:
        # Manually extract and verify JWT token from cookies
        token = request.cookies.get('access_token')
        
        # Log information about the request
        print(f"Protected route accessed")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request cookies: {dict(request.cookies)}")
        print(f"Access token present: {token is not None}")
        
        if not token:
            print("No access token in cookies")
            return jsonify({"error": "Unauthorized access - No token"}), 401
        
        try:
            # Verify the token manually
            from flask_jwt_extended import decode_token, get_jwt_identity
            decoded_token = decode_token(token)
            user_id = decoded_token.get('sub')  # 'sub' is where the identity is stored
            
            print(f"Token successfully decoded, user_id: {user_id}")
        except Exception as e:
            print(f"Token verification failed: {str(e)}")
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
        
        # Token is valid, get user data from Supabase
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        # Get user profile
        profile_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
            headers=headers
        )
        
        if profile_response.status_code != 200 or not profile_response.json():
            print(f"User profile not found for ID: {user_id}")
            return jsonify({"error": "User not found"}), 404
            
        profile = profile_response.json()[0]
        print(f"Retrieved profile: {profile}")
        
        # Get user auth data
        auth_response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user/{user_id}",
            headers=headers
        )
        
        if auth_response.status_code != 200:
            print(f"Failed to get auth data: {auth_response.status_code}")
            return jsonify({"error": "Could not retrieve user data"}), 500
            
        auth_data = auth_response.json()
        
        # Combine the data with all available profile fields
        user_data = {
            "id": user_id,
            "email": auth_data.get("email"),
            "full_name": profile.get("first_name"),  # Map first_name to full_name for frontend
            "team_id": profile.get("team_id"),
            "balance": profile.get("balance", 0),
            "dls_id": profile.get("dls_id")
            # Add any other fields you need from the profile
        }
        
        print(f"Returning user data: {user_data}")
        return jsonify(user_data)
    except Exception as e:
        print(f"Protected route error: {str(e)}")
        print(traceback.format_exc())  # Print full traceback
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/confirm', methods=['GET'])
def confirm_email():
    """Handle email confirmation"""
    # Get token from URL parameters
    token_hash = request.args.get('token_hash')
    type = request.args.get('type')
    
    if not token_hash or type != 'signup':
        return redirect(f"{os.environ.get('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000')}/login?error=invalid_confirmation_link")
    
    try:
        # Confirm the user with Supabase
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/verify", 
            json={
                "type": "signup",
                "token": token_hash
            },
            headers={"apikey": SUPABASE_KEY}
        )
        
        if response.status_code != 200:
            print("Email confirmation error:", response.text)
            return redirect(f"{os.environ.get('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000')}/login?error=confirmation_failed")
            
        # Get user data from response
        user_data = response.json()
        
        # Create access token for the user
        access_token = create_access_token(identity=user_data.get('id'))
        
        # Redirect to frontend with cookie
        resp = redirect(f"{os.environ.get('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000')}/")
        
        # Set the JWT as a cookie
        resp.set_cookie(
            "access_token", 
            access_token, 
            httponly=True, 
            secure=app.config.get('JWT_COOKIE_SECURE', False), 
            samesite="Strict", 
            max_age=60*60*24*7  # 7 days
        )
        
        return resp
        
    except Exception as e:
        print(f"Confirmation error: {str(e)}")
        print(traceback.format_exc())
        return redirect(f"{os.environ.get('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000')}/login?error=confirmation_failed")

@app.route('/user/stats', methods=['GET'])
@jwt_required(locations = ["cookies"])
def user_stats():
    try:
        # Get the user identity from the JWT
        user_id = get_jwt_identity()
        print(f"Fetching stats for user: {user_id}")
        
        # Get user data from Supabase
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        # Get user profile
        profile_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
            headers=headers
        )
        
        if profile_response.status_code != 200 or not profile_response.json():
            return jsonify({"error": "User not found"}), 404
            
        profile = profile_response.json()[0]
        
        # You can fetch additional data from other tables if needed
        
        # For now, return some basic stats
        stats = {
            "matches_played": profile.get("matches_played", 0),
            "wins": profile.get("wins", 0),
            "losses": profile.get("losses", 0),
            "draws": profile.get("draws", 0),
            "goals_scored": profile.get("goals_scored", 0),
            "goals_conceded": profile.get("goals_conceded", 0),
            "win_percentage": calculate_win_percentage(profile),
            "recent_form": profile.get("form", "")
        }
        
        return jsonify(stats)
    except Exception as e:
        print(f"User stats error: {str(e)}")
        print(traceback.format_exc())  # Print full traceback
        return jsonify({"error": "An unexpected error occurred"}), 500

def calculate_win_percentage(profile):
    """Calculate win percentage based on matches played"""
    matches_played = profile.get("matches_played", 0)
    wins = profile.get("wins", 0)
    
    if matches_played == 0:
        return 0
    
    return round((wins / matches_played) * 100)

def generate_match_code():
    """Generate a unique match code in the format ARN + 3 random numbers"""
    random_numbers = ''.join(random.choices(string.digits, k=3))
    return f"ARN{random_numbers}"

def generate_secure_token():
    """Generate a secure 16 character token"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))

def get_team_data_async(team_id, headless=False):  # Changed default to False
    """Get team data asynchronously and cache it"""
    if team_id in team_data_cache:
        # Check if cache is less than 5 minutes old
        cache_time, data = team_data_cache[team_id]
        if (datetime.now() - cache_time).seconds < 300:  # 5 minutes cache
            return data
    
    # Cache is expired or doesn't exist, fetch new data
    try:
        # Run the scraper in background if not already running
        if team_id in active_scrapes:
            # Check if scraping thread is still alive
            if active_scrapes[team_id].is_alive():
                return {"status": "pending", "message": "Data is being fetched"}
            else:
                # Thread has completed but data is not in cache
                del active_scrapes[team_id]
        
        # Start a new scraping thread
        def scrape_team_data():
            try:
                # Use the improved API-friendly function with headless=False
                result = get_team_data(team_id, headless=headless, logging_level='minimal')
                
                # Update cache with timestamp
                team_data_cache[team_id] = (datetime.now(), result)
            except Exception as e:
                print(f"Error in scrape thread: {str(e)}")
                print(traceback.format_exc())
                # Store error in cache
                team_data_cache[team_id] = (datetime.now(), {"status": "error", "message": str(e)})
        
        # Start the thread and track it
        scrape_thread = threading.Thread(target=scrape_team_data)
        scrape_thread.daemon = True
        scrape_thread.start()
        active_scrapes[team_id] = scrape_thread
        
        return {"status": "pending", "message": "Data fetch started"}
        
    except Exception as e:
        print(f"Error getting team data: {str(e)}")
        return {"status": "error", "message": str(e)}

# Add a home page with a simple UI
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create-match', methods=['POST'])
def create_match():
    """Create a new match and return a match code"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['player_1', 'player_2', 'team_A', 'team_B']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Generate match code and secure token
        match_code = generate_match_code()
        secure_token = generate_secure_token()
        full_code = f"{match_code}@[{secure_token}]"
        
        # Store match data
        matches[match_code] = {
            "player_1": data['player_1'],
            "player_2": data['player_2'],
            "team_A": data['team_A'],
            "team_B": data['team_B'],
            "created_at": datetime.now().isoformat(),
            "result_fetched": False,
            "match_data": None,
            "secure_token": secure_token
        }
        
        return jsonify({
            "status": "success",
            "message": "Match created successfully",
            "match_code": full_code
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/team-info', methods=['GET'])
def get_team_info():
    """Get team information by team ID"""
    team_id = request.args.get('team_id')
    
    if not team_id:
        return jsonify({"status": "error", "message": "Team ID is required"}), 400
    
    # Validate team ID format
    if not re.match(r'^[a-z0-9]{8}$', team_id.lower()):
        return jsonify({"status": "error", "message": "Invalid team ID format"}), 400
    
    # Get data using team ID
    result = get_team_data_async(team_id)
    return jsonify(result)


@app.route('/match-result', methods=['GET'])
def get_match_result():
    """Get match result using match code"""
    full_match_code = request.args.get('match_code')
    
    if not full_match_code:
        return jsonify({"status": "error", "message": "Match code is required"}), 400
    
    # Parse match code
    try:
        match_code, token_part = full_match_code.split('@')
        token = token_part.strip('[]')
    except ValueError:
        return jsonify({"status": "error", "message": "Invalid match code format"}), 400
    
    # Check if match exists
    if match_code not in matches:
        return jsonify({"status": "error", "message": "Match not found"}), 404
    
    # Verify token
    match_data = matches[match_code]
    if match_data['secure_token'] != token:
        return jsonify({"status": "error", "message": "Invalid token"}), 403
    
    # If result already fetched, return it
    if match_data['result_fetched'] and match_data['match_data']:
        return jsonify({
            "status": "success",
            "home_team": match_data['team_A'],
            "away_team": match_data['team_B'],
            "match_data": match_data['match_data']
        })
    
    # Otherwise, indicate match is still in progress
    return jsonify({
        "status": "pending",
        "message": "Match results not available yet",
        "home_team": match_data['team_A'],
        "away_team": match_data['team_B']
    })


@app.route('/match-stats', methods=['GET'])
def get_match_stats():
    """Get detailed match statistics using match code"""
    full_match_code = request.args.get('match_code')
    
    if not full_match_code:
        return jsonify({"status": "error", "message": "Match code is required"}), 400
    
    # Parse match code
    try:
        match_code, token_part = full_match_code.split('@')
        token = token_part.strip('[]')
    except ValueError:
        return jsonify({"status": "error", "message": "Invalid match code format"}), 400
    
    # Check if match exists
    if match_code not in matches:
        return jsonify({"status": "error", "message": "Match not found"}), 404
    
    # Verify token
    match_data = matches[match_code]
    if match_data['secure_token'] != token:
        return jsonify({"status": "error", "message": "Invalid token"}), 403
    
    # If we have match data with stats, return it
    if match_data['result_fetched'] and match_data['match_data'] and 'stats' in match_data['match_data']:
        return jsonify({
            "status": "success",
            "home_team": match_data['team_A'],
            "away_team": match_data['team_B'],
            "stats": match_data['match_data']['stats'],
            "goals": match_data['match_data']['goals'] if 'goals' in match_data['match_data'] else []
        })
    
    # Otherwise, indicate stats not available
    return jsonify({
        "status": "pending",
        "message": "Match statistics not available yet",
        "home_team": match_data['team_A'],
        "away_team": match_data['team_B']
    })


@app.route('/update-match-result', methods=['POST'])
def update_match_result():
    """Update match result (admin endpoint)"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['match_code', 'token', 'match_data']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        match_code = data['match_code']
        token = data['token']
        
        # Check if match exists
        if match_code not in matches:
            return jsonify({"status": "error", "message": "Match not found"}), 404
        
        # Verify token
        match_data = matches[match_code]
        if match_data['secure_token'] != token:
            return jsonify({"status": "error", "message": "Invalid token"}), 403
        
        # Update match data
        matches[match_code]['match_data'] = data['match_data']
        matches[match_code]['result_fetched'] = True
        matches[match_code]['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            "status": "success",
            "message": "Match result updated successfully"
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/status', methods=['GET'])
def status():
    """Check API status"""
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "active_matches": len(matches),
        "cached_teams": len(team_data_cache)
    })

@app.route('/debug', methods=['GET'])
def debug_info():
    """Endpoint for debugging authentication"""
    auth_header = request.headers.get('Authorization', '')
    cookie_header = request.headers.get('Cookie', '')
    auth_cookie = next((c for c in request.cookies.items() if c[0] == 'access_token'), (None, None))
    
    try:
        # Try to extract and decode the JWT if it exists
        token = None
        jwt_data = None
        
        if auth_cookie[1]:
            token = auth_cookie[1]
            try:
                jwt_data = decode_token(token)
            except Exception as e:
                jwt_data = {"error": str(e)}
        
        debug_info = {
            "request_method": request.method,
            "request_path": request.path,
            "request_headers": dict(request.headers),
            "cookies": dict(request.cookies),
            "auth_cookie_present": auth_cookie[0] is not None,
            "auth_cookie_value": auth_cookie[1][:10] + "..." if auth_cookie[1] else None,
            "jwt_data": jwt_data,
            "cors_config": {
                "origins": app.config.get('CORS_ORIGINS', '*'),
                "supports_credentials": app.config.get('CORS_SUPPORTS_CREDENTIALS', False)
            },
            "flask_config": {
                "JWT_TOKEN_LOCATION": app.config.get('JWT_TOKEN_LOCATION'),
                "JWT_COOKIE_SECURE": app.config.get('JWT_COOKIE_SECURE'),
                "JWT_COOKIE_CSRF_PROTECT": app.config.get('JWT_COOKIE_CSRF_PROTECT'),
                "JWT_COOKIE_SAMESITE": app.config.get('JWT_COOKIE_SAMESITE')
            }
        }
        
        return jsonify(debug_info)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

def decode_token(token):
    """Attempt to decode a JWT token"""
    try:
        from flask_jwt_extended import decode_token
        return decode_token(token)
    except ImportError:
        import jwt
        # This is a fallback if flask_jwt_extended can't be used directly
        # You'll need to adjust this with your actual secret key
        return jwt.decode(
            token, 
            app.config.get('JWT_SECRET_KEY', 'your-secret-key'),
            algorithms=['HS256']
        )

# Create a simple HTML template for testing the API
@app.route('/test', methods=['GET'])
def test_page():
    """Simple test page for API"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>DLL Tracker API Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            .panel { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            h1, h2 { color: #333; }
            button { padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
            input, select { padding: 8px; margin: 5px 0; width: 100%; box-sizing: border-box; }
            #results { background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>DLL Tracker API Test</h1>
            
            <div class="panel">
                <h2>Get Team Info</h2>
                <input type="text" id="teamIdInput" placeholder="Enter 8-character team ID (e.g., 4c51fw0c)" />
                <button onclick="getTeamInfo()">Get Info</button>
            </div>
            
            <div class="panel">
                <h2>Create Match</h2>
                <input type="text" id="player1Input" placeholder="Player 1 ID" />
                <input type="text" id="player2Input" placeholder="Player 2 ID" />
                <input type="text" id="teamAInput" placeholder="Team A Name" />
                <input type="text" id="teamBInput" placeholder="Team B Name" />
                <button onclick="createMatch()">Create Match</button>
            </div>
            
            <div class="panel">
                <h2>Match Result/Stats</h2>
                <input type="text" id="matchCodeInput" placeholder="Enter full match code" />
                <select id="endpointSelect">
                    <option value="match-result">Match Result</option>
                    <option value="match-stats">Match Stats</option>
                </select>
                <button onclick="getMatchData()">Get Data</button>
            </div>
            
            <div class="panel">
                <h2>Results</h2>
                <pre id="results">Results will appear here...</pre>
            </div>
        </div>
        
        <script>
            async function getTeamInfo() {
                const teamId = document.getElementById('teamIdInput').value;
                if (!teamId) {
                    alert('Please enter a team ID');
                    return;
                }
                
                const resultsElement = document.getElementById('results');
                resultsElement.textContent = 'Loading...';
                
                try {
                    const response = await fetch(`/team-info?team_id=${teamId}`);
                    const data = await response.json();
                    
                    if (data.status === 'pending') {
                        resultsElement.textContent = 'Data is being fetched. This may take up to 20 seconds. Refreshing in 5 seconds...';
                        setTimeout(() => getTeamInfo(), 5000);
                    } else {
                        resultsElement.textContent = JSON.stringify(data, null, 2);
                    }
                } catch (error) {
                    resultsElement.textContent = `Error: ${error.message}`;
                }
            }
            
            async function createMatch() {
                const player1 = document.getElementById('player1Input').value;
                const player2 = document.getElementById('player2Input').value;
                const teamA = document.getElementById('teamAInput').value;
                const teamB = document.getElementById('teamBInput').value;
                
                if (!player1 || !player2 || !teamA || !teamB) {
                    alert('Please fill in all fields');
                    return;
                }
                
                const resultsElement = document.getElementById('results');
                resultsElement.textContent = 'Creating match...';
                
                try {
                    const response = await fetch('/create-match', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            player_1: player1,
                            player_2: player2,
                            team_A: teamA,
                            team_B: teamB
                        })
                    });
                    
                    const data = await response.json();
                    resultsElement.textContent = JSON.stringify(data, null, 2);
                    
                    if (data.match_code) {
                        document.getElementById('matchCodeInput').value = data.match_code;
                    }
                } catch (error) {
                    resultsElement.textContent = `Error: ${error.message}`;
                }
            }
            
            async function getMatchData() {
                const matchCode = document.getElementById('matchCodeInput').value;
                const endpoint = document.getElementById('endpointSelect').value;
                
                if (!matchCode) {
                    alert('Please enter a match code');
                    return;
                }
                
                const resultsElement = document.getElementById('results');
                resultsElement.textContent = 'Loading...';
                
                try {
                    const response = await fetch(`/${endpoint}?match_code=${encodeURIComponent(matchCode)}`);
                    const data = await response.json();
                    resultsElement.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    resultsElement.textContent = `Error: ${error.message}`;
                }
            }
        </script>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    import os
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Create index.html in templates directory
    with open('templates/index.html', 'w') as f:
        f.write("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>DLL Tracker API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .panel { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h1, h2 { color: #333; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; margin-right: 10px; }
                .get { background: #61affe; color: white; }
                .post { background: #49cc90; color: white; }
                a.button { display: inline-block; padding: 8px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>DLL Tracker API</h1>
                <p>Welcome to the DLL Tracker API. Use the endpoints below to access team and match data.</p>
                
                <div class="panel">
                    <h2>Available Endpoints</h2>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <strong>/team-info</strong>
                        <p>Get comprehensive team statistics, match history, and form.</p>
                        <p><em>Query parameter:</em> team_id (required)</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <strong>/create-match</strong>
                        <p>Create a new match with team and player information.</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <strong>/match-result</strong>
                        <p>Get match results using the match code.</p>
                        <p><em>Query parameter:</em> match_code (required)</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <strong>/match-stats</strong>
                        <p>Get detailed match statistics using the match code.</p>
                        <p><em>Query parameter:</em> match_code (required)</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <strong>/status</strong>
                        <p>Check the API status.</p>
                    </div>
                </div>
                
                <div class="panel">
                    <h2>Need to test the API?</h2>
                    <p>Use our interactive test page to try out the API endpoints.</p>
                    <a href="/test" class="button">Go to Test Page</a>
                </div>
            </div>
        </body>
        </html>
        """)
    
    app.run(debug=True, port=5000)