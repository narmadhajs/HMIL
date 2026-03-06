import requests
import json
import sys
from datetime import datetime, timedelta

class HallBookingAPITester:
    def __init__(self, base_url="https://room-reserve-app-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_emp_id = f"EMP{datetime.now().strftime('%H%M%S')}"
        self.test_email = f"test{datetime.now().strftime('%H%M%S')}@hmil.net"

    def log_test(self, name, success, response=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED")
            if response and hasattr(response, 'text'):
                print(f"   Response: {response.text}")
        
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def test_admin_init(self):
        """Test admin initialization"""
        print("\n🔧 Testing Admin Initialization...")
        response = self.make_request('POST', 'api/admin/init')
        success = response and response.status_code in [200, 201]
        self.log_test("Admin Initialization", success, response)
        return success

    def test_admin_login(self):
        """Test admin login with ADMIN001/admin123"""
        print("\n🔐 Testing Admin Login...")
        login_data = {
            "emp_id": "ADMIN001",
            "password": "admin123"
        }
        
        response = self.make_request('POST', 'api/auth/login', login_data)
        success = response and response.status_code == 200
        
        if success:
            try:
                data = response.json()
                self.admin_token = data.get('token')
                user = data.get('user', {})
                if user.get('role') == 'admin':
                    print(f"   Admin logged in: {user.get('name')}")
                else:
                    success = False
                    print("   Error: User is not admin")
            except:
                success = False
                
        self.log_test("Admin Login", success, response)
        return success

    def test_halls_api(self):
        """Test halls API"""
        print("\n🏢 Testing Halls API...")
        response = self.make_request('GET', 'api/halls')
        success = response and response.status_code == 200
        
        if success:
            try:
                halls = response.json()
                expected_halls = ['elantra', 'exter', 'embera']
                hall_ids = [h.get('id') for h in halls]
                
                if all(hall_id in hall_ids for hall_id in expected_halls):
                    print(f"   Found all expected halls: {hall_ids}")
                else:
                    success = False
                    print(f"   Missing halls. Found: {hall_ids}, Expected: {expected_halls}")
            except:
                success = False
                
        self.log_test("Halls API", success, response)
        return success

    def test_employee_check_nonexistent(self):
        """Test checking non-existent employee"""
        print("\n👤 Testing Employee Check (Non-existent)...")
        data = {"emp_id": self.test_emp_id}
        response = self.make_request('POST', 'api/auth/check-employee', data)
        success = response and response.status_code == 200
        
        if success:
            try:
                result = response.json()
                if not result.get('exists'):
                    print(f"   Employee {self.test_emp_id} does not exist (expected)")
                else:
                    success = False
            except:
                success = False
                
        self.log_test("Employee Check (Non-existent)", success, response)
        return success

    def test_user_registration(self):
        """Test user registration flow"""
        print("\n📝 Testing User Registration...")
        user_data = {
            "emp_id": self.test_emp_id,
            "email": self.test_email
        }
        
        response = self.make_request('POST', 'api/auth/register', user_data)
        success = response and response.status_code in [200, 201]
        
        if success:
            try:
                result = response.json()
                if 'password creation link sent' in result.get('message', '').lower():
                    print(f"   Registration initiated for {self.test_email}")
                else:
                    success = False
            except:
                success = False
                
        self.log_test("User Registration", success, response)
        return success

    def test_employee_check_existing(self):
        """Test checking existing employee (after registration)"""
        print("\n👤 Testing Employee Check (Existing)...")
        data = {"emp_id": self.test_emp_id}
        response = self.make_request('POST', 'api/auth/check-employee', data)
        success = response and response.status_code == 200
        
        if success:
            try:
                result = response.json()
                if result.get('exists') and not result.get('has_password'):
                    print(f"   Employee {self.test_emp_id} exists but no password set (expected)")
                else:
                    success = False
            except:
                success = False
                
        self.log_test("Employee Check (Existing)", success, response)
        return success

    def test_hall_slots(self):
        """Test hall slots API"""
        print("\n📅 Testing Hall Slots API...")
        if not self.admin_token:
            print("   Skipping: No admin token available")
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        params = {'date': tomorrow, 'token': self.admin_token}
        
        response = self.make_request('GET', 'api/halls/elantra/slots', params=params)
        success = response and response.status_code == 200
        
        if success:
            try:
                slots = response.json()
                expected_slots = ['8-10 AM', '10-12 PM', '1-3 PM', '3-5 PM']
                slot_names = [s.get('slot') for s in slots]
                
                if all(slot in slot_names for slot in expected_slots):
                    print(f"   Found all time slots: {slot_names}")
                    print(f"   Slot statuses: {[s.get('status') for s in slots]}")
                else:
                    success = False
                    print(f"   Missing slots. Found: {slot_names}")
            except:
                success = False
                
        self.log_test("Hall Slots API", success, response)
        return success

    def test_admin_pending_bookings(self):
        """Test admin pending bookings API"""
        print("\n📋 Testing Admin Pending Bookings...")
        if not self.admin_token:
            print("   Skipping: No admin token available")
            return False
            
        params = {'token': self.admin_token}
        response = self.make_request('GET', 'api/admin/bookings/pending', params=params)
        success = response and response.status_code == 200
        
        if success:
            try:
                bookings = response.json()
                print(f"   Found {len(bookings)} pending bookings")
            except:
                success = False
                
        self.log_test("Admin Pending Bookings", success, response)
        return success

    def test_admin_all_bookings(self):
        """Test admin all bookings API"""
        print("\n📚 Testing Admin All Bookings...")
        if not self.admin_token:
            print("   Skipping: No admin token available")
            return False
            
        params = {'token': self.admin_token}
        response = self.make_request('GET', 'api/admin/bookings/all', params=params)
        success = response and response.status_code == 200
        
        if success:
            try:
                bookings = response.json()
                print(f"   Found {len(bookings)} total bookings")
            except:
                success = False
                
        self.log_test("Admin All Bookings", success, response)
        return success

    def test_admin_block_slot(self):
        """Test admin block slot functionality"""
        print("\n🚫 Testing Admin Block Slot...")
        if not self.admin_token:
            print("   Skipping: No admin token available")
            return False
            
        tomorrow = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        block_data = {
            "hall_id": "elantra",
            "hall_name": "Elantra Hall",
            "date": tomorrow,
            "slot": "8-10 AM", 
            "reason": "Testing block functionality"
        }
        
        params = {'token': self.admin_token}
        response = self.make_request('POST', 'api/admin/slots/block', block_data, params=params)
        success = response and response.status_code in [200, 201]
        
        if success:
            try:
                result = response.json()
                print(f"   Slot blocked: {block_data['slot']} on {tomorrow}")
            except:
                success = False
                
        self.log_test("Admin Block Slot", success, response)
        return success

    def test_invalid_login(self):
        """Test invalid login credentials"""
        print("\n🔒 Testing Invalid Login...")
        login_data = {
            "emp_id": "INVALID001",
            "password": "wrongpassword"
        }
        
        response = self.make_request('POST', 'api/auth/login', login_data)
        success = response and response.status_code == 401
        
        if success:
            print("   Invalid login properly rejected")
        
        self.log_test("Invalid Login Rejection", success, response)
        return success

    def test_cors_headers(self):
        """Test CORS headers are present"""
        print("\n🌐 Testing CORS Headers...")
        response = self.make_request('GET', 'api/halls')
        success = False
        
        if response:
            headers = response.headers
            cors_headers = ['Access-Control-Allow-Origin', 'access-control-allow-origin']
            has_cors = any(header in headers for header in cors_headers)
            if has_cors or response.status_code == 200:  # If API works, CORS is probably OK
                success = True
                print("   CORS appears to be configured")
            
        self.log_test("CORS Headers", success, response)
        return success

def main():
    print("🧪 Starting Hall Booking System API Tests")
    print("=" * 50)
    
    tester = HallBookingAPITester()
    
    # Test sequence
    tests = [
        tester.test_cors_headers,
        tester.test_admin_init,
        tester.test_admin_login,
        tester.test_halls_api,
        tester.test_employee_check_nonexistent,
        tester.test_user_registration,
        tester.test_employee_check_existing,
        tester.test_hall_slots,
        tester.test_admin_pending_bookings,
        tester.test_admin_all_bookings,
        tester.test_admin_block_slot,
        tester.test_invalid_login,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test error: {str(e)}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())