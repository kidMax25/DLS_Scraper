import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import json

class TrackerScraper:
    def __init__(self, user_id):
        # Validate and format user ID
        self.user_id = user_id.lower()
        if not re.match(r'^[a-z0-9]{8}$', self.user_id):
            raise ValueError("Invalid ID: Must be 8 characters (letters and numbers)")

        chrome_options = Options()
        # chrome_options.add_argument("--headless")
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
        self.team_name = None
        self.team_stats = {}
        self.recent_match = {}
        self.team_form = []

        
    def validate_tracker_id(self):
        """Check if the tracker ID is valid"""
        try:
            self.driver.get(self.user_url)
            self.driver.implicitly_wait(5)
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

    def extract_team_name(self):
        """Extract team name from the header"""
        try:
            # Try multiple selectors
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
                    self.team_name = team_name_element.text
                    print(f"Team Name is {self.team_name}")
                    return
                except:
                    continue
            
            print("Could not find team name")
        except Exception as e:
            print(f"Could not extract team name: {e}")

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
                        print(f"Team Overview:\n{self.team_stats}")
                        return
                except:
                    continue
            
            print("Could not find team overview statistics")
        except Exception as e:
            print(f"Could not extract team overview: {e}")

    def extract_recent_match(self):
        """Extract details of the most recent match"""
        try:
            # Multiple selectors for match card
            match_selectors = [
                '.bg-card.relative.m-2.rounded-md',
                '.bg-card.m-2',
                '.bg-card'
            ]
            
            for selector in match_selectors:
                try:
                    recent_match_div = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    # Find score element
                    score_element = recent_match_div.find_element(
                        By.CSS_SELECTOR, 
                        'h1.text-lg.xs\\:text-cxl.sm\\:text-3xl'
                    )
                    score_1, score_2 = map(int, score_element.text.split('-'))

                    # Determine match result
                    if score_1 > score_2:
                        result = "Win"
                    elif score_1 == score_2:
                        result = "Draw"
                    else:
                        result = "Loose"

                    # Extract opponent name
                    opponent_elements = recent_match_div.find_elements(
                        By.CSS_SELECTOR, 
                        '.truncate'
                    )
                    if len(opponent_elements) > 1:
                        opponent_name = opponent_elements[1].text

                        self.recent_match = {
                            'score_1': score_1,
                            'score_2': score_2,
                            'result': result,
                            'opponent': opponent_name
                        }

                        print(f"Recent Match: {self.recent_match}")
                        return
                except:
                    continue
            
            print("Could not find recent match details")
        except Exception as e:
            print(f"Could not extract recent match details: {e}")

    def extract_match_statistics(self, card_index=0):
        """
        Extracts match statistics for a specific match index.
        
        :param card_index: Index of the match (0 for latest)
        :return: Dictionary with match stats
        """
        try:
            self.driver.implicitly_wait(5)
            
            # Dynamically toggle the stats panel for the correct card
            script = f"""
            let el = document.querySelectorAll("div.min-w-full > div:nth-of-type(2) svg")[{card_index}];
            if (el) el.dispatchEvent(new MouseEvent("click", {{ bubbles: true }}));
            """
            self.driver.execute_script(script)
            print("Toggled stats dynamically")

            # Wait for the stats panel to appear
            stats_panel_xpath = '//div[contains(@class, "flex-1 w-full p-2 animate-in slide-in-from-left-10 fade-in-50")]'
            WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, stats_panel_xpath)))

            # Locate the stats container
            stats_container = self.driver.find_element(By.XPATH, '//div[contains(@class, "flex flex-col")]')

            if not stats_container:
                print("No stats container found")
                return {}

            stat_rows = stats_container.find_elements(By.XPATH, './/div[contains(@class, "relative my-1")]')

            match_statistics = {}

            for row in stat_rows:
                values = row.find_elements(By.TAG_NAME, "p")

                if len(values) == 3:  # Expected structure
                    home_value = values[0].text.strip()
                    stat_name = values[1].text.strip().lower().replace(" ", "_")  # Normalize stat name
                    away_value = values[2].text.strip()

                    match_statistics[stat_name] = {
                        'home_team': home_value,
                        'away_team': away_value
                    }

            if not match_statistics:
                print("Statistics extracted but empty. Check structure.")
                return {}

            print(f"Match Statistics for Card {card_index}:")
            print(json.dumps(match_statistics, indent=2))

            return match_statistics

        except TimeoutException:
            print("Timeout waiting for stats panel.")
            return {}
        except Exception as e:
            print(f"Error extracting match statistics: {e}")
            return {}

    def _extract_goals(self, card_index=0):
        """Extract goal scorers and their details based on the match card index."""
        try:
            # Select the appropriate match card dynamically
            match_cards = self.driver.find_elements(By.XPATH, '//div[contains(@class, "match-card-class")]')
            
            if card_index >= len(match_cards):
                print(f"Match card index {card_index} is out of range.")
                return []

            match_card = match_cards[card_index]

            # Extract goal elements
            goal_elements = match_card.find_elements(By.XPATH, './/div[contains(@class, "leading-5 my-1")]')
            goals = []

            for goal in goal_elements:
                try:
                    # Extract goal time
                    time_element = goal.find_element(By.XPATH, './/span[contains(@class, "text-gray-100")]')
                    time = time_element.text

                    # Extract scorer name
                    scorer_element = goal.find_element(By.XPATH, './/span[contains(@class, "text-white font-HEAD")]')
                    scorer = scorer_element.text

                    # Check if there's an assist
                    assist_element = goal.find_elements(By.XPATH, './/div[contains(@class, "flex-row")]')
                    assist = assist_element[0].text if assist_element else "No assist"

                    goals.append({
                        'time': time,
                        'scorer': scorer,
                        'assist': assist
                    })
                except Exception as e:
                    print(f"Could not extract individual goal details: {e}")

            return goals

        except Exception as e:
            print(f"Could not extract goals: {e}")
            return []


    def extract_team_form(self):
        """Extract team form for last 5 matches"""
        try:
            match_cards = self.driver.find_elements(
                By.CSS_SELECTOR, 
                '.bg-card.relative.m-2.rounded-md'
            )

            # Skip first (most recent) match which was already processed
            match_results = []
            for card in match_cards[0:5]:
                try:
                    score_element = card.find_element(
                        By.CSS_SELECTOR, 
                        'h1.text-lg.xs\\:text-cxl.sm\\:text-3xl'
                    )
                    score_1, score_2 = map(int, score_element.text.split('-'))

                    if score_1 > score_2:
                        match_results.append("🟢")  # Win
                    elif score_1 == score_2:
                        match_results.append("🟠")  # Draw
                    else:
                        match_results.append("🔴")  # Loss
                except:
                    break

            self.team_form = match_results
            print("Team Form (Last 5 matches) Including Friendly Matches:", ' '.join(self.team_form))
        except Exception as e:
            print(f"Could not extract team form: {e}")

    def scrape(self):
        """Main method to scrape all data"""
        try:
            if self.validate_tracker_id():
                self.extract_team_name()
                self.extract_team_overview()
                self.extract_recent_match()
                self.extract_match_statistics()
                self._extract_goals()
                self.extract_team_form()
            else:
                print("Scraping failed.")
        except Exception as e:
            print(f"Scraping error: {e}")
        finally:
            self.driver.quit()

def main():
    try:
        user_id = input("Enter Your DLS ID: ").strip()
        tracker = TrackerScraper(user_id)
        tracker.scrape()
    except ValueError as ve:
        print(ve)

if __name__ == "__main__":
    main()