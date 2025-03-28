import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
import json

class TrackerScraper:
    def __init__(self, user_id):
        # Validate and format user ID
        self.user_id = user_id.lower()
        if not re.match(r'^[a-z0-9]{8}$', self.user_id):
            raise ValueError("Invalid ID: Must be 8 characters (letters and numbers)")

        chrome_options = Options()
        # chrome_options.add_argument("--headless")  # Uncomment for headless mode
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )

        # Construct user URL
        self.user_url = f"https://tracker.ftgames.com/?id={self.user_id}"
        
        # Initialize team information
        self.player_team_name = None  # The player's team name
        self.opponent_team_names = [] # List of opponent team names
        self.match_cards = []         # Store all match cards in one place
        self.team_stats = {}
        self.matches = []             # List of match details with team names
        self.team_form = []
        self.match_stats = {}         # Store match statistics
        self.goals = []               # Store goals
        
    def validate_tracker_id(self):
        """Check if the tracker ID is valid"""
        try:
            self.driver.get(self.user_url)
            
            # Wait for the page to load fully
            time.sleep(5)  # Add a static wait
            
            # Look for elements that indicate page load
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "body"))
                )
            except:
                print("Page did not load properly")
                return False

            # Check for invalid ID message
            try:
                invalid_divs = self.driver.find_elements(
                    By.XPATH, 
                    "//*[contains(text(), 'Could not find player')]"
                )
                if invalid_divs:
                    print("Invalid Tracker ID. Please check and try again.")
                    return False
            except:
                pass

            return True

        except Exception as e:
            print(f"Error validating ID: {e}")
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
                        print(f"Found {len(self.match_cards)} match cards")
                        return True
                except:
                    continue
            
            print("Could not find any match cards")
            return False
        except Exception as e:
            print(f"Could not extract match cards: {e}")
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
                    print(f"Player's Team Name: {self.player_team_name}")
                    break
                except:
                    continue
            
            if not self.player_team_name:
                print("Could not find player's team name")
                return False
                
            # Now extract opponent team names from match cards
            if self.match_cards:
                for i, card in enumerate(self.match_cards[:10]):  # Limit to 10 most recent matches
                    try:
                        opponent_elements = card.find_elements(
                            By.CSS_SELECTOR, 
                            '.truncate'
                        )
                        if len(opponent_elements) > 1:
                            opponent_name = opponent_elements[1].text
                            self.opponent_team_names.append(opponent_name)
                    except Exception as e:
                        print(f"Could not extract opponent name for match {i+1}: {e}")
                
                print(f"Extracted {len(self.opponent_team_names)} opponent team names")
                return True
            return False
        except Exception as e:
            print(f"Could not extract team names: {e}")
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
                        print(f"Team Overview: {self.team_stats}")
                        return True
                except:
                    continue
            
            print("Could not find team overview statistics")
            return False
        except Exception as e:
            print(f"Could not extract team overview: {e}")
            return False
            
    def extract_matches(self, limit=10):
        """Extract details of matches with team names"""
        if not self.match_cards:
            print("No match cards available")
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
                        result = "Loss"  # Fixed typo from "Loose" to "Loss"

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
                        print(f"Recent Match: {self.player_team_name} {score_1}-{score_2} {opponent_name} ({result})")
                    
                except Exception as e:
                    print(f"Could not extract details for match {i+1}: {e}")
            
            print(f"Extracted data for {len(self.matches)} matches")
            return True
        except Exception as e:
            print(f"Could not extract match details: {e}")
            return False
            
    def extract_match_statistics(self, match_index=0):
        """
        Extract match statistics with team name associations
        
        :param match_index: Index of the match (0 for latest)
        :return: Dictionary with match stats
        """
        if not self.match_cards or match_index >= len(self.match_cards):
            print(f"No match card available for index {match_index}")
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
            print(f"Toggled stats panel for match {match_index}")
            
            # Wait for the stats panel to appear
            try:
                stats_panel_xpath = '//div[contains(@class, "flex-1 w-full p-2 animate-in slide-in-from-left-10 fade-in-50")]'
                WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, stats_panel_xpath)))
            except TimeoutException:
                print("Stats panel did not appear after clicking, trying alternative approach...")
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
                time.sleep(1.5)  # Wait longer for this operation
                
                # Try waiting again
                try:
                    WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, stats_panel_xpath)))
                except TimeoutException:
                    print("Still couldn't get stats panel to appear")
                    return {}

            # Locate the stats container
            try:
                stats_container = self.driver.find_element(By.XPATH, '//div[contains(@class, "flex flex-col")]')
            except:
                print("No stats container found")
                return {}

            # Get all stat rows
            stat_rows = stats_container.find_elements(By.XPATH, './/div[contains(@class, "relative my-1")]')

            if not stat_rows:
                print("No statistics rows found in container")
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

                    match_statistics['stats'][stat_name] = {
                        'home': home_value,
                        'away': away_value
                    }

            if not match_statistics['stats']:
                print("Statistics extracted but empty. Check structure.")
                return {}

            print(f"Extracted {len(match_statistics['stats'])} statistics for {match_info['home_team']} vs {match_info['away_team']}")
            return match_statistics

        except Exception as e:
            print(f"Error extracting match statistics: {e}")
            return {}
            
    def extract_goals(self, match_index=0):
        """Extract goal scorers and their details for a specific match"""
        if not self.match_cards or match_index >= len(self.match_cards):
            print(f"No match card available for index {match_index}")
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
                            print(f"Could not extract individual goal details: {e}")
                    
                    # If we found goals with this selector, break the loop
                    if goals:
                        break
            
            print(f"Extracted {len(goals)} goals for match index {match_index}")
            return goals

        except Exception as e:
            print(f"Could not extract goals: {e}")
            return []
    
    def extract_team_form(self, limit=5):
        """Extract team form based on already processed match data"""
        if not self.matches:
            print("No matches data available for form extraction")
            return False
        
        try:
            # Clear previous form data
            self.team_form = []
            
            # Get form from already processed matches
            for match in self.matches[:limit]:
                if match['result'] == "Win":
                    self.team_form.append("🟢")  # Win
                elif match['result'] == "Draw":
                    self.team_form.append("🟠")  # Draw
                else:
                    self.team_form.append("🔴")  # Loss
            
            form_string = ' '.join(self.team_form)
            print(f"Team Form (Last {len(self.team_form)} matches): {form_string}")
            return True
            
        except Exception as e:
            print(f"Could not extract team form: {e}")
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
                    
                    # Prepare a comprehensive summary
                    self._print_summary()
                else:
                    print("No match cards found. Scraping limited.")
            else:
                print("Invalid tracker ID or page did not load properly.")
        except Exception as e:
            print(f"Scraping error: {e}")
        finally:
            self.driver.quit()
            
    def _print_summary(self):
        """Print a comprehensive summary of the extracted data"""
        print("\n" + "="*50)
        print(f"TEAM SUMMARY: {self.player_team_name}")
        print("="*50)
        
        # Print team stats
        if self.team_stats:
            print("\nTEAM STATISTICS:")
            print(f"Games Played: {self.team_stats.get('games_played', 'N/A')}")
            print(f"Games Won: {self.team_stats.get('games_won', 'N/A')}")
            print(f"Games Lost: {self.team_stats.get('games_lost', 'N/A')}")
            print(f"Win Percentage: {self.team_stats.get('win_percentage', 'N/A')}%")
        
        # Print recent match
        if self.recent_match:
            print("\nLAST MATCH:")
            rm = self.recent_match
            print(f"{rm['home_team']} {rm['home_score']} - {rm['away_score']} {rm['away_team']}")
            print(f"Result: {rm['result']}")
            if rm.get('date'):
                print(f"Date: {rm['date']}")
            
            # Print match statistics if available
            if self.match_stats and 'stats' in self.match_stats:
                print("\nMATCH STATISTICS:")
                for stat_name, values in self.match_stats['stats'].items():
                    home_team = self.match_stats.get('home_team', rm['home_team'])
                    away_team = self.match_stats.get('away_team', rm['away_team'])
                    print(f"{stat_name.replace('_', ' ').title()}: {values['home']} ({home_team}) - {values['away']} ({away_team})")
            
            # Print goals if available
            if self.goals:
                print("\nGOALS:")
                for i, goal in enumerate(self.goals):
                    print(f"{i+1}. {goal['time']} - {goal['scorer']}")
                    if 'assist' in goal and goal['assist'] != "No assist":
                        print(f"   Assist: {goal['assist']}")
        
        # Print form
        if self.team_form:
            print("\nRECENT FORM:")
            print(' '.join(self.team_form))
        
        print("="*50)
        
    def export_to_json(self, filename=None):
        """Export all collected data to a JSON file"""
        if not filename:
            filename = f"{self.player_team_name.replace(' ', '_').lower()}_stats.json"
            
        export_data = {
            "team_name": self.player_team_name,
            "team_stats": self.team_stats,
            "matches": self.matches,
            "form": self.team_form,
            "recent_match_stats": self.match_stats,
            "recent_match_goals": self.goals
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2)
            print(f"Data exported successfully to {filename}")
            return True
        except Exception as e:
            print(f"Error exporting data: {e}")
            return False


def main():
    try:
        user_id = input("Enter Your DLS ID: ").strip()
        tracker = TrackerScraper(user_id)
        tracker.scrape()
        
        # Optionally export data to JSON
        export = input("Export data to JSON? (y/n): ").strip().lower()
        if export == 'y':
            tracker.export_to_json()
            
    except ValueError as ve:
        print(ve)

if __name__ == "__main__":
    main()