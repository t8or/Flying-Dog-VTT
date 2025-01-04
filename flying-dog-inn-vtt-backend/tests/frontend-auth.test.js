const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test report setup
const reportPath = path.join(__dirname, 'frontend-auth-test-report.log');
let testSteps = [];

function logStep(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  testSteps.push(logMessage);
  fs.appendFileSync(reportPath, logMessage + '\n');
  console.log(logMessage);
}

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  // Clear previous test report
  fs.writeFileSync(reportPath, '');
  
  logStep('Starting frontend authentication flow tests...');

  // Test 1: Initial Auth Check
  try {
    logStep('TEST 1: Testing initial authentication check');
    
    // Step 1: Check auth status without token
    logStep('Step 1.1: Checking auth status without token');
    const noTokenResponse = await fetch('http://localhost:3002/api/auth/validate', {
      credentials: 'include'
    }).catch(error => {
      throw new Error(`Network error: ${error.message}`);
    });

    const noTokenResult = await noTokenResponse.json().catch(error => {
      throw new Error(`Failed to parse response: ${error.message}`);
    });

    if (noTokenResult.valid) {
      throw new Error('Should not be authenticated without token');
    }
    logStep('Step 1.2: Correctly reported as not authenticated without token');

    // Step 2: Attempt login
    logStep('Step 1.3: Attempting login with correct credentials');
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: '',
        password: 'dndforever'
      })
    }).catch(error => {
      throw new Error(`Network error: ${error.message}`);
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    logStep('Step 1.4: Login successful');

    // Extract auth token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    const authToken = cookies?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authToken) {
      throw new Error('No auth token received in cookies');
    }
    logStep('Step 1.5: Successfully received auth token in cookies');

    // Step 3: Verify auth status with token
    logStep('Step 1.6: Verifying auth status with token');
    const validationResponse = await fetch('http://localhost:3002/api/auth/validate', {
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    }).catch(error => {
      throw new Error(`Validation request failed: ${error.message}`);
    });

    const validationResult = await validationResponse.json();
    
    if (!validationResult.valid) {
      throw new Error('Token validation failed');
    }
    logStep('Step 1.7: Successfully validated authentication token');
    logStep('TEST 1: PASSED - Authentication flow complete');

  } catch (error) {
    logStep(`TEST 1: FAILED - ${error.message}`);
  }

  // Wait for rate limit to reset
  logStep('Waiting 5 seconds for rate limit to reset...');
  await wait(5000);

  // Test 2: Protected Route Access
  try {
    logStep('\nTEST 2: Testing protected route access');

    // Step 1: Attempt access without token
    logStep('Step 2.1: Attempting to access protected route without token');
    const unprotectedResponse = await fetch('http://localhost:3001/api/campaigns', {
      credentials: 'include'
    }).catch(error => {
      throw new Error(`Network error: ${error.message}`);
    });

    if (unprotectedResponse.status !== 401) {
      throw new Error(`Expected 401 status, got ${unprotectedResponse.status}`);
    }
    logStep('Step 2.2: Correctly denied access without token');

    // Step 2: Login and get token
    logStep('Step 2.3: Logging in to get auth token');
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: '',
        password: 'dndforever'
      })
    });

    const cookies = loginResponse.headers.get('set-cookie');
    const authToken = cookies?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authToken) {
      throw new Error('Failed to get auth token');
    }
    logStep('Step 2.4: Successfully obtained auth token');

    // Step 3: Access protected route with token
    logStep('Step 2.5: Attempting to access protected route with token');
    const protectedResponse = await fetch('http://localhost:3001/api/campaigns', {
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    });

    if (!protectedResponse.ok) {
      throw new Error(`Protected route access failed: ${protectedResponse.status}`);
    }
    logStep('Step 2.6: Successfully accessed protected route with token');
    logStep('TEST 2: PASSED - Protected route access verified');

  } catch (error) {
    logStep(`TEST 2: FAILED - ${error.message}`);
  }

  logStep('\nAll frontend authentication tests completed.');
}

// Run tests
runTests().catch(error => {
  logStep(`Test suite failed: ${error.message}`);
}); 