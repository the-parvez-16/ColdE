#!/usr/bin/env node

const axios = require("axios");
const process = require("process");

class ColdEmailAPITester {
  constructor(baseUrl = "http://localhost:3000/api") {
    // original: https://coldemailai.preview.emergentagent.com/api
    this.baseUrl = baseUrl;
    this.token = null;
    this.userId = null;
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testResults = [];
  }

  logTest(name, success, details = "") {
    this.testsRun += 1;
    if (success) {
      this.testsPassed += 1;
      console.log(`✅ ${name} - PASSED`);
    } else {
      console.log(`❌ ${name} - FAILED: ${details}`);
    }

    this.testResults.push({
      test: name,
      success,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  async runTest(name, method, endpoint, expectedStatus, data = null, headers = null) {
    const url = `${this.baseUrl}/${endpoint}`;
    const testHeaders = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      testHeaders["Authorization"] = `Bearer ${this.token}`;
    }
    if (headers) {
      Object.assign(testHeaders, headers);
    }

    console.log(`\n🔍 Testing ${name}...`);
    console.log(`   URL: ${url}`);

    try {
      let response;
      if (method === "GET") {
        response = await axios.get(url, { headers: testHeaders, timeout: 10000 });
      } else if (method === "POST") {
        response = await axios.post(url, data, { headers: testHeaders, timeout: 10000 });
      } else if (method === "DELETE") {
        response = await axios.delete(url, { headers: testHeaders, timeout: 10000 });
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      const success = response.status === expectedStatus;
      let details = `Status: ${response.status}, Expected: ${expectedStatus}`;

      if (success) {
        try {
          const responseData = response.data;
          console.log(
            `   Response: ${JSON.stringify(responseData, null, 2).slice(0, 200)}...`
          );
          this.logTest(name, true, details);
          return [true, responseData];
        } catch {
          this.logTest(name, true, details);
          return [true, {}];
        }
      } else {
        let extra = "";
        try {
          extra = JSON.stringify(response.data);
        } catch {
          extra = String(response.data).slice(0, 100);
        }
        details += `, Error: ${extra}`;
        this.logTest(name, false, details);
        return [false, {}];
      }
    } catch (e) {
      const details = `Exception: ${e.message}`;
      this.logTest(name, false, details);
      return [false, {}];
    }
  }

  async testHealthCheck() {
    console.log("\n" + "=".repeat(50));
    console.log("TESTING HEALTH ENDPOINTS");
    console.log("=".repeat(50));

    await this.runTest("Health Check", "GET", "", 200);
    await this.runTest("API Health", "GET", "health", 200);
  }

  async testAuthFlow() {
    console.log("\n" + "=".repeat(50));
    console.log("TESTING AUTHENTICATION");
    console.log("=".repeat(50));

    const now = new Date();
    const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    const testEmail = `test_user_${timestamp}@example.com`;
    const testPassword = "TestPass123!";
    const testName = `Test User ${timestamp}`;

    const [success, response] = await this.runTest(
      "User Registration",
      "POST",
      "auth/register",
      200,
      {
        email: testEmail,
        password: testPassword,
        name: testName,
      }
    );

    if (success && response && response.access_token) {
      this.token = response.access_token;
      this.userId = response.user.id;
      console.log(`   Registered user: ${testEmail}`);
    } else {
      console.log("❌ Registration failed, cannot continue with auth tests");
      return false;
    }

    await this.runTest("Get Current User", "GET", "auth/me", 200);

    const [loginSuccess, loginResponse] = await this.runTest(
      "User Login",
      "POST",
      "auth/login",
      200,
      {
        email: testEmail,
        password: testPassword,
      }
    );

    if (loginSuccess && loginResponse && loginResponse.access_token) {
      this.token = loginResponse.access_token;
      console.log(`   Login successful for: ${testEmail}`);
    }

    return true;
  }

  async testCampaignFlow() {
    console.log("\n" + "=".repeat(50));
    console.log("TESTING CAMPAIGN WORKFLOW");
    console.log("=".repeat(50));

    if (!this.token) {
      console.log("❌ No auth token, skipping campaign tests");
      return false;
    }

    await this.runTest("Get Campaigns (Empty)", "GET", "campaigns", 200);

    const campaignBody = {
      name: "Test Campaign",
      work_description:
        "I'm a freelance web developer specializing in React and Node.js",
      email_limit: 10,
    };

    const [success, response] = await this.runTest(
      "Create Campaign",
      "POST",
      "campaigns",
      200,
      campaignBody
    );

    if (!success || !response || !response.id) {
      console.log("❌ Campaign creation failed, cannot continue");
      return false;
    }

    const campaignId = response.id;
    console.log(`   Created campaign: ${campaignId}`);

    await this.runTest(
      "Get Campaign Details",
      "GET",
      `campaigns/${campaignId}`,
      200
    );

    console.log("\n   Waiting for campaign processing...");
    await new Promise((r) => setTimeout(r, 3000));

    for (let i = 0; i < 3; i++) {
      const [ok, campaignData] = await this.runTest(
        `Campaign Progress Check ${i + 1}`,
        "GET",
        `campaigns/${campaignId}`,
        200
      );
      if (ok) {
        const status = campaignData.status || "unknown";
        const progress = campaignData.progress || 0;
        console.log(`   Status: ${status}, Progress: ${progress}%`);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    await this.runTest("Get All Campaigns", "GET", "campaigns", 200);

    await this.runTest(
      "Delete Campaign",
      "DELETE",
      `campaigns/${campaignId}`,
      200
    );

    return true;
  }

  async testDashboardStats() {
    console.log("\n" + "=".repeat(50));
    console.log("TESTING DASHBOARD STATS");
    console.log("=".repeat(50));

    if (!this.token) {
      console.log("❌ No auth token, skipping dashboard tests");
      return false;
    }

    const [success, stats] = await this.runTest(
      "Get Dashboard Stats",
      "GET",
      "dashboard/stats",
      200
    );

    if (success && stats) {
      const expectedFields = [
        "total_campaigns",
        "active_campaigns",
        "total_emails_sent",
        "total_positive",
        "total_negative",
        "total_no_reply",
        "response_rate",
      ];
      for (const field of expectedFields) {
        if (field in stats) {
          console.log(`   ${field}: ${stats[field]}`);
        } else {
          console.log(`   ⚠️  Missing field: ${field}`);
        }
      }
    }

    return true;
  }

  async testErrorCases() {
    console.log("\n" + "=".repeat(50));
    console.log("TESTING ERROR CASES");
    console.log("=".repeat(50));

    await this.runTest(
      "Invalid Login",
      "POST",
      "auth/login",
      401,
      { email: "invalid@test.com", password: "wrongpass" }
    );

    if (this.token) {
      await this.runTest(
        "Duplicate Registration",
        "POST",
        "auth/register",
        400,
        {
          email: "test_user_123456@example.com",
          password: "TestPass123!",
          name: "Duplicate User",
        }
      );
    }

    const oldToken = this.token;
    this.token = "invalid_token";
    await this.runTest("Unauthorized Access", "GET", "campaigns", 401);
    this.token = oldToken;

    if (this.token) {
      await this.runTest(
        "Invalid Campaign Data",
        "POST",
        "campaigns",
        422,
        { name: "", work_description: "", email_limit: 0 }
      );
    }
  }

  async runAllTests() {
    console.log("🚀 Starting Cold Email AI Agent API Tests");
    console.log(`Testing against: ${this.baseUrl}`);
    console.log("=".repeat(60));

    const startTime = Date.now();

    await this.testHealthCheck();
    const authSuccess = await this.testAuthFlow();

    if (authSuccess) {
      await this.testDashboardStats();
      await this.testCampaignFlow();
    }

    await this.testErrorCases();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Tests Run: ${this.testsRun}`);
    console.log(`Tests Passed: ${this.testsPassed}`);
    console.log(`Tests Failed: ${this.testsRun - this.testsPassed}`);
    console.log(
      `Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`
    );
    console.log(`Duration: ${duration.toFixed(2)} seconds`);

    if (this.testsPassed === this.testsRun) {
      console.log("🎉 All tests passed!");
      return 0;
    } else {
      console.log("❌ Some tests failed!");
      return 1;
    }
  }
}

(async () => {
  const tester = new ColdEmailAPITester(); // change base URL here if needed
  const code = await tester.runAllTests();
  process.exit(code);
})();
