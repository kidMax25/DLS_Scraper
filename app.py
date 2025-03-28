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

# Import the optimized tracker functions
from Tracker import get_team_data

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