import re
import time
import json
import random
import string
import secrets
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import traceback

# Import the TrackerScraper class
from Tracker import TrackerScraper

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for matches
matches = {}
active_scrapes = {}
team_data_cache = {}

def generate_match_code():
    """Generate a unique match code in the format ARN + 3 random numbers"""
    random_numbers = ''.join(random.choices(string.digits, k=3))
    return f"ARN{random_numbers}"

def generate_secure_token():
    """Generate a secure 16 character token"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))

def get_team_data_from_id(team_id):
    """Get team data from tracker ID and cache it"""
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
                tracker = TrackerScraper(team_id)
                tracker.scrape()
                
                # Prepare data for cache and response
                result = {
                    "team_name": tracker.player_team_name,
                    "team_stats": tracker.team_stats,
                    "matches": tracker.matches[:10],  # Last 10 matches
                    "form": tracker.team_form,
                    "recent_match": tracker.recent_match,
                    "recent_match_stats": tracker.match_stats,
                    "recent_match_goals": tracker.goals
                }
                
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
    """Get team information by team name or ID"""
    team_id = request.args.get('team_id')
    team_name = request.args.get('team_name')
    
    if not team_id and not team_name:
        return jsonify({"status": "error", "message": "Either team_id or team_name is required"}), 400
    
    if team_id:
        # Validate team ID format
        if not re.match(r'^[a-z0-9]{8}$', team_id.lower()):
            return jsonify({"status": "error", "message": "Invalid team ID format"}), 400
        
        # Get data using team ID
        result = get_team_data_from_id(team_id)
        return jsonify(result)
    
    # Team name search would require a different approach
    # For now, return an error
    return jsonify({"status": "error", "message": "Search by team name not implemented yet"}), 501


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


if __name__ == '__main__':
    app.run(debug=True, port=5000)