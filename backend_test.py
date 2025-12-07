#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class ColdEmailAPITester:
    def __init__(self, base_url="https://coldemailai.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    self.log_test(name, True, details)
                    return True, response_data
                except:
                    self.log_test(name, True, details)
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:100]}"
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            details = f"Exception: {str(e)}"
            self.log_test(name, False, details)
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("Health Check", "GET", "", 200)
        self.run_test("API Health", "GET", "health", 200)

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"

        # Test registration
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
        else:
            print("❌ Registration failed, cannot continue with auth tests")
            return False

        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)

        # Test login with same credentials
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']  # Update token
            print(f"   Login successful for: {test_email}")
        
        return True

    def test_campaign_flow(self):
        """Test complete campaign workflow"""
        print("\n" + "="*50)
        print("TESTING CAMPAIGN WORKFLOW")
        print("="*50)
        
        if not self.token:
            print("❌ No auth token, skipping campaign tests")
            return False

        # Test get campaigns (empty initially)
        self.run_test("Get Campaigns (Empty)", "GET", "campaigns", 200)

        # Test create campaign
        campaign_data = {
            "name": "Test Campaign",
            "work_description": "I'm a freelance web developer specializing in React and Node.js",
            "email_limit": 10
        }
        
        success, response = self.run_test(
            "Create Campaign",
            "POST",
            "campaigns",
            200,
            data=campaign_data
        )
        
        if not success or 'id' not in response:
            print("❌ Campaign creation failed, cannot continue")
            return False
            
        campaign_id = response['id']
        print(f"   Created campaign: {campaign_id}")

        # Test get specific campaign
        self.run_test(
            "Get Campaign Details",
            "GET",
            f"campaigns/{campaign_id}",
            200
        )

        # Wait for campaign processing to start
        print("\n   Waiting for campaign processing...")
        time.sleep(3)

        # Check campaign progress multiple times
        for i in range(3):
            success, campaign_data = self.run_test(
                f"Campaign Progress Check {i+1}",
                "GET",
                f"campaigns/{campaign_id}",
                200
            )
            if success:
                status = campaign_data.get('status', 'unknown')
                progress = campaign_data.get('progress', 0)
                print(f"   Status: {status}, Progress: {progress}%")
            time.sleep(2)

        # Test get all campaigns
        self.run_test("Get All Campaigns", "GET", "campaigns", 200)

        # Test delete campaign
        self.run_test(
            "Delete Campaign",
            "DELETE",
            f"campaigns/{campaign_id}",
            200
        )

        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        if not self.token:
            print("❌ No auth token, skipping dashboard tests")
            return False

        success, stats = self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)
        
        if success:
            expected_fields = ['total_campaigns', 'active_campaigns', 'total_emails_sent', 
                             'total_positive', 'total_negative', 'total_no_reply', 'response_rate']
            for field in expected_fields:
                if field in stats:
                    print(f"   {field}: {stats[field]}")
                else:
                    print(f"   ⚠️  Missing field: {field}")

    def test_error_cases(self):
        """Test error handling"""
        print("\n" + "="*50)
        print("TESTING ERROR CASES")
        print("="*50)
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )

        # Test duplicate registration
        if self.token:
            # Try to register with existing email
            self.run_test(
                "Duplicate Registration",
                "POST",
                "auth/register",
                400,
                data={
                    "email": "test_user_123456@example.com",  # Likely exists from previous test
                    "password": "TestPass123!",
                    "name": "Duplicate User"
                }
            )

        # Test unauthorized access
        old_token = self.token
        self.token = "invalid_token"
        self.run_test("Unauthorized Access", "GET", "campaigns", 401)
        self.token = old_token

        # Test invalid campaign creation
        if self.token:
            self.run_test(
                "Invalid Campaign Data",
                "POST",
                "campaigns",
                422,
                data={"name": "", "work_description": "", "email_limit": 0}
            )

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Cold Email AI Agent API Tests")
        print(f"Testing against: {self.base_url}")
        print("="*60)
        
        start_time = time.time()
        
        # Run test suites
        self.test_health_check()
        auth_success = self.test_auth_flow()
        
        if auth_success:
            self.test_dashboard_stats()
            self.test_campaign_flow()
        
        self.test_error_cases()
        
        # Print summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            return 1

def main():
    tester = ColdEmailAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())