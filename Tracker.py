import re
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
import json

# Configure logging to file instead of console
logging.basicConfig(
    filename='tracker.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class TrackerScraper:
    def __init__(self, user_id, headless=False, logging_level='minimal'):
        """
        Initialize the TrackerScraper
        
        :param user_id: 8-character DLL Tracker ID
        :param headless: Whether to run browser in headless mode (invisible)
        :param logging_level: 'minimal', 'standard', or 'verbose'
        """
        # Validate and format user ID
        self.user_id = user_id.lower()
        if not re.match(r'^[a-z0-9]{8}$', self.user_id):
            raise ValueError("Invalid ID: Must be 8 characters (letters and numbers)")
            
        # Set logging level and headless mode
        self.logging_level = logging_level
        self.headless = headless

        # Configure Chrome options with headless mode
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless=new")  # Updated headless flag for newer Chrome versions
            chrome_options.add_argument("--window-size=1920,1080")  # Add window size for better rendering
            chrome_options.add_argument("--disable-gpu")  # Sometimes needed with headless
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Initialize the WebDriver
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )

        # Construct user URL
        self.user_url = f"https://tracker.ftgames.com/?id={self.user_id}"
        
        # Initialize data containers
        self.player_team_name = None
        self.opponent_team_names = []
        self.match_cards = []
        self.team_stats = {}
        self.matches = []
        self.team_form = []
        self.match_stats = {}
        self.goals = []
        
    def log(self, message, level='info'):
        """Log messages based on the configured verbosity"""
        if self.logging_level == 'minimal' and level != 'error':
            return
        
        if self.logging_level == 'standard' and level == 'debug':
            return
            
        if level == 'error':
            logging.error(message)
        elif level == 'warning':
            logging.warning(message)
        elif level == 'info':
            logging.info(message)
        elif level == 'debug':
            logging.debug(message)
        
    def validate_tracker_id(self):
        """Check if the tracker ID is valid"""
        try:
            self.driver.get(self.user_url)
            
            # Wait for the page to load fully - longer wait if headless
            wait_time = 5 if not self.headless else 10
            time.sleep(wait_time)
            
            # Look for elements that indicate page load
            try:
                WebDriverWait(self.driver, 15).until(  # Increased timeout
                    EC.presence_of_element_located((By.CSS_SELECTOR, "body"))
                )
            except:
                self.log("Page did not load properly", 'error')
                return False

            # Check for invalid ID message
            try:
                invalid_divs = self.driver.find_elements(
                    By.XPATH, 
                    "//*[contains(text(), 'Could not find player')]"
                )
                if invalid_divs:
                    self.log("Invalid Tracker ID", 'error')
                    return False
            except:
                pass

            return True

        except Exception as e:
            self.log(f"Error validating ID: {str(e)}", 'error')
            return False
    
    def extract_match_cards(self):
        """Extract all match cards at once and store them for later use"""
        try:
            # Multiple selectors for match cards
            match_selectors = [
                '.bg-card.relative.m-2.rounded-md',
                '.bg-card.m-2',
                '.bg-card'
            ]
            
            for selector in match_selectors:
                try:
                    self.match_cards = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if self.match_cards:
                        self.log(f"Found {len(self.match_cards)} match cards", 'debug')
                        return True
                except:
                    continue
            
            self.log("Could not find any match cards", 'warning')
            return False
        except Exception as e:
            self.log(f"Error extracting match cards: {str(e)}", 'error')
            return False
            
    def extract_team_names(self):
        """Extract player's team name and opponent team names"""
        try:
            # Extract player's team name
            selectors = [
                'span.font-HEAD.text-2xl',
                'header span.text-2xl',
                'header span'
            ]
            
            for selector in selectors:
                try:
                    team_name_element = WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    self.player_team_name = team_name_element.text
                    self.log(f"Team name: {self.player_team_name}", 'debug')
                    break
                except:
                    continue
            
            if not self.player_team_name:
                self.log("Could not find player's team name", 'warning')
                return False
                
            # Now extract opponent team names from match cards
            if self.match_cards:
                for i, card in enumerate(self.match_cards[:10]):
                    try:
                        opponent_elements = card.find_elements(
                            By.CSS_SELECTOR, 
                            '.truncate'
                        )
                        if len(opponent_elements) > 1:
                            opponent_name = opponent_elements[1].text
                            self.opponent_team_names.append(opponent_name)
                    except Exception as e:
                        self.log(f"Error extracting opponent for match {i+1}: {str(e)}", 'debug')
                
                self.log(f"Extracted {len(self.opponent_team_names)} opponent names", 'debug')
                return True
            return False
        except Exception as e:
            self.log(f"Error extracting team names: {str(e)}", 'error')
            return False

    def extract_team_overview(self):
        """Extract team overview statistics"""
        try:
            # Try different selector strategies
            stats_selectors = [
                '.grid.grid-cols-2 .text-xl.font-HEAD.text-primary',
                '.grid .text-xl.font-HEAD.text-primary'
            ]
            
            for selector in stats_selectors:
                try:
                    stats_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if len(stats_elements) >= 4:
                        self.team_stats = {
                            'games_played': int(stats_elements[0].text),
                            'games_won': int(stats_elements[1].text),
                            'games_lost': int(stats_elements[2].text),
                            'win_percentage': float(stats_elements[3].text.rstrip('%'))
                        }
                        self.log(f"Team stats extracted", 'debug')
                        return True
                except:
                    continue
            
            self.log("Could not find team overview statistics", 'warning')
            return False
        except Exception as e:
            self.log(f"Error extracting team overview: {str(e)}", 'error')
            return False
            
    def extract_matches(self, limit=10):
        """Extract details of matches with team names"""
        if not self.match_cards:
            self.log("No match cards available", 'warning')
            return False
            
        try:
            for i, card in enumerate(self.match_cards[:limit]):
                try:
                    # Find score element
                    score_element = card.find_element(
                        By.CSS_SELECTOR, 
                        'h1.text-lg.xs\\:text-cxl.sm\\:text-3xl'
                    )
                    score_text = score_element.text
                    score_1, score_2 = map(int, score_text.split('-'))

                    # Determine match result from player's perspective
                    if score_1 > score_2:
                        result = "Win"
                    elif score_1 == score_2:
                        result = "Draw"
                    else:
                        result = "Loss"

                    # Get opponent name
                    opponent_name = self.opponent_team_names[i] if i < len(self.opponent_team_names) else "Unknown"
                    
                    # Try to get match date if available
                    date = None
                    try:
                        date_elements = card.find_elements(By.CSS_SELECTOR, '.text-gray-400')
                        if date_elements:
                            date = date_elements[0].text
                    except:
                        pass

                    match_data = {
                        'index': i,
                        'home_team': self.player_team_name,
                        'away_team': opponent_name,
                        'home_score': score_1,
                        'away_score': score_2,
                        'result': result,
                        'date': date
                    }
                    
                    self.matches.append(match_data)
                    
                    # Store the most recent match separately for backwards compatibility
                    if i == 0:
                        self.recent_match = match_data
                        
                except Exception as e:
                    self.log(f"Error extracting match {i+1}: {str(e)}", 'debug')
            
            self.log(f"Extracted data for {len(self.matches)} matches", 'debug')
            return True
        except Exception as e:
            self.log(f"Error extracting match details: {str(e)}", 'error')
            return False
            
    def extract_match_statistics(self, match_index=0):
        """
        Extract match statistics with team name associations
        
        :param match_index: Index of the match (0 for latest)
        :return: Dictionary with match stats
        """
        if not self.match_cards or match_index >= len(self.match_cards):
            self.log(f"No match card available for index {match_index}", 'warning')
            return {}
        
        try:
            self.driver.implicitly_wait(5)
            
            # Match info for context
            match_info = self.matches[match_index] if match_index < len(self.matches) else {
                'home_team': self.player_team_name,
                'away_team': self.opponent_team_names[match_index] if match_index < len(self.opponent_team_names) else "Unknown"
            }
            
            # Dynamically toggle the stats panel for the correct card
            script = f"""
            let el = document.querySelectorAll("div.min-w-full > div:nth-of-type(2) svg")[{match_index}];
            if (el) {{
                el.scrollIntoView({{block: 'center'}});
                setTimeout(() => {{
                    el.dispatchEvent(new MouseEvent("click", {{ bubbles: true }}));
                }}, 500);
            }}
            """
            self.driver.execute_script(script)
            self.log(f"Toggled stats panel for match {match_index}", 'debug')
            
            # Wait for the stats panel to appear
            try:
                stats_panel_xpath = '//div[contains(@class, "flex-1 w-full p-2 animate-in slide-in-from-left-10 fade-in-50")]'
                WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, stats_panel_xpath)))
            except TimeoutException:
                self.log("Stats panel did not appear, trying alternative approach", 'debug')
                # Alternative click approach
                self.driver.execute_script(f"""
                    let matches = document.querySelectorAll('.bg-card.relative.m-2.rounded-md');
                    if ({match_index} < matches.length) {{
                        let match = matches[{match_index}];
                        match.scrollIntoView({{block: 'center'}});
                        setTimeout(() => {{
                            let svgs = match.querySelectorAll('svg');
                            if (svgs.length > 0) {{
                                svgs[0].dispatchEvent(new MouseEvent("click", {{ bubbles: true, cancelable: true }}));
                            }}
                        }}, 700);
                    }}
                """)
                time.sleep(1.5)
                
                # Try waiting again
                try:
                    WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, stats_panel_xpath)))
                except TimeoutException:
                    self.log("Could not get stats panel to appear", 'warning')
                    return {}

            # Locate the stats container
            try:
                stats_container = self.driver.find_element(By.XPATH, '//div[contains(@class, "flex flex-col")]')
            except:
                self.log("No stats container found", 'warning')
                return {}

            # Get all stat rows
            stat_rows = stats_container.find_elements(By.XPATH, './/div[contains(@class, "relative my-1")]')

            if not stat_rows:
                self.log("No statistics rows found in container", 'warning')
                return {}

            match_statistics = {
                'home_team': match_info['home_team'],
                'away_team': match_info['away_team'],
                'stats': {}
            }

            for row in stat_rows:
                values = row.find_elements(By.TAG_NAME, "p")

                if len(values) == 3:  # Expected structure: home value, stat name, away value
                    home_value = values[0].text.strip()
                    stat_name = values[1].text.strip().lower().replace(" ", "_")  # Normalize stat name
                    away_value = values[2].text.strip()

                    # Try to convert numeric values to ints
                    try:
                        if home_value.isdigit():
                            home_value = int(home_value)
                        if away_value.isdigit():
                            away_value = int(away_value)
                    except:
                        pass

                    match_statistics['stats'][stat_name] = {
                        'home': home_value,
                        'away': away_value
                    }

            if not match_statistics['stats']:
                self.log("Statistics extracted but empty. Check structure.", 'warning')
                return {}

            self.log(f"Extracted {len(match_statistics['stats'])} statistics", 'debug')
            return match_statistics

        except Exception as e:
            self.log(f"Error extracting match statistics: {str(e)}", 'error')
            return {}
            
    def extract_goals(self, match_index=0):
        """Extract goal scorers and their details for a specific match"""
        if not self.match_cards or match_index >= len(self.match_cards):
            self.log(f"No match card available for index {match_index}", 'warning')
            return []
            
        try:
            # Match info for context
            match_info = self.matches[match_index] if match_index < len(self.matches) else None
            
            # Reference the match card by index
            match_card = self.match_cards[match_index]
            
            # Find goal elements within the match card
            # Try different selectors until we find one that works
            selectors = [
                './/div[contains(@class, "leading-5 my-1")]',
                './/div[contains(@class, "my-1") and contains(@class, "leading-5")]',
                './/div[contains(@class, "flex") and contains(@class, "items-center")]'
            ]
            
            goals = []
            
            for selector in selectors:
                goal_elements = match_card.find_elements(By.XPATH, selector)
                if goal_elements:
                    for goal in goal_elements:
                        try:
                            # Try to find the time element
                            time_elements = goal.find_elements(By.XPATH, './/span[contains(@class, "text-gray-100")]')
                            time = time_elements[0].text if time_elements else "?"
                            
                            # Try to find the scorer name
                            scorer_elements = goal.find_elements(By.XPATH, './/span[contains(@class, "text-white font-HEAD")]')
                            if not scorer_elements:
                                scorer_elements = goal.find_elements(By.XPATH, './/span[contains(@class, "font-HEAD")]')
                            
                            scorer = scorer_elements[0].text if scorer_elements else "Unknown"
                            
                            # Check if there's an assist
                            assist = "No assist"
                            assist_elements = goal.find_elements(By.XPATH, './/div[contains(@class, "flex-row")]')
                            if assist_elements:
                                assist_text = assist_elements[0].text
                                if "assist" in assist_text.lower():
                                    assist = assist_text.replace("assist", "").replace("Assist", "").strip()
                            
                            # Determine which team scored
                            team = match_info['home_team'] if match_info else self.player_team_name
                            
                            # Only add if we have at least a time and scorer
                            if time and scorer and scorer != "Unknown":
                                goals.append({
                                    'time': time,
                                    'scorer': scorer,
                                    'team': team,
                                    'assist': assist
                                })
                        except Exception as e:
                            self.log(f"Error extracting goal details: {str(e)}", 'debug')
                    
                    # If we found goals with this selector, break the loop
                    if goals:
                        break
            
            self.log(f"Extracted {len(goals)} goals", 'debug')
            return goals

        except Exception as e:
            self.log(f"Error extracting goals: {str(e)}", 'error')
            return []
    
    def extract_team_form(self, limit=5):
        """Extract team form based on already processed match data"""
        if not self.matches:
            self.log("No matches data available for form extraction", 'warning')
            return False
        
        try:
            # Clear previous form data
            self.team_form = []
            
            # Get form from already processed matches
            for match in self.matches[:limit]:
                if match['result'] == "Win":
                    self.team_form.append("Win")  # Win
                elif match['result'] == "Draw":
                    self.team_form.append("Draw")  # Draw
                else:
                    self.team_form.append("Loss")  # Loss
            
            self.log(f"Extracted form for {len(self.team_form)} matches", 'debug')
            return True
            
        except Exception as e:
            self.log(f"Error extracting team form: {str(e)}", 'error')
            return False
    
    def scrape(self):
        """Main method to scrape all data using optimized approach"""
        try:
            if self.validate_tracker_id():
                # First extract all match cards once
                if self.extract_match_cards():
                    # Then extract team names (both player's team and opponents)
                    self.extract_team_names()
                    
                    # Extract team overview stats
                    self.extract_team_overview()
                    
                    # Process all matches with team names
                    self.extract_matches()
                    
                    # Extract team form from processed matches
                    self.extract_team_form()
                    
                    # Extract statistics for the most recent match
                    self.match_stats = self.extract_match_statistics(0)
                    
                    # Extract goals from the most recent match
                    self.goals = self.extract_goals(0)
                    
                    return self.to_json()
                else:
                    self.log("No match cards found. Scraping limited.", 'warning')
                    return {'status': 'error', 'message': 'No match data found'}
            else:
                self.log("Invalid tracker ID or page did not load properly.", 'error')
                return {'status': 'error', 'message': 'Invalid tracker ID or page did not load'}
        except Exception as e:
            self.log(f"Scraping error: {str(e)}", 'error')
            return {'status': 'error', 'message': str(e)}
        finally:
            self.driver.quit()
    
    def to_json(self):
        """Convert scraped data to JSON-friendly dictionary"""
        result = {
            'status': 'success',
            'team_name': self.player_team_name,
            'team_stats': self.team_stats,
            'matches': self.matches[:10],  # Last 10 matches
            'form': self.team_form,
            'recent_match': self.recent_match if hasattr(self, 'recent_match') else None
        }
        
        # Add match statistics if available
        if self.match_stats and 'stats' in self.match_stats:
            result['recent_match_stats'] = self.match_stats
            
        # Add goals if available
        if self.goals:
            result['recent_match_goals'] = self.goals
            
        return result


def get_team_data(team_id, headless=False, logging_level='minimal'):
    """
    Convenience function to get team data in a single call
    
    :param team_id: 8-character DLL Tracker ID
    :param headless: Whether to run browser in headless mode
    :param logging_level: 'minimal', 'standard', or 'verbose'
    :return: JSON-friendly dictionary with team data
    """
    try:
        scraper = TrackerScraper(team_id, headless=headless, logging_level=logging_level)
        return scraper.scrape()
    except Exception as e:
        logging.error(f"Error in get_team_data: {str(e)}")
        return {'status': 'error', 'message': str(e)}


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        team_id = sys.argv[1]
    else:
        team_id = input("Enter DLS Tracker ID: ").strip()
    
    result = get_team_data(team_id, headless=False, logging_level='standard')
    print(json.dumps(result, indent=2))