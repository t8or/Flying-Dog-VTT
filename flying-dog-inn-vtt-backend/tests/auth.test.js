const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test report setup
const reportPath = path.join(__dirname, 'test-report.log');
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
  
  logStep('Starting authentication tests...');

  // Test 1: Successful Authentication
  try {
    logStep('TEST 1: Testing successful authentication flow');
    
    // Step 1: Attempt login with correct credentials
    logStep('Step 1.1: Sending login request with correct password and empty username');
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

    if (!loginResponse) {
      throw new Error('No response received from auth service');
    }

    const loginResult = await loginResponse.json().catch(error => {
      throw new Error(`Failed to parse response: ${error.message}`);
    });
    
    logStep(`Step 1.1a: Received response with status ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResult.error || 'Unknown error'}`);
    }
    logStep('Step 1.2: Login successful, received response');

    // Extract auth token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    logStep(`Step 1.2a: Received cookies: ${cookies || 'none'}`);
    
    const authToken = cookies?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authToken) {
      throw new Error('No auth token received in cookies');
    }
    logStep('Step 1.3: Successfully extracted auth token from cookies');

    // Step 2: Validate token
    logStep('Step 1.4: Validating token with auth service');
    const validateResponse = await fetch('http://localhost:3002/api/auth/validate', {
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    }).catch(error => {
      throw new Error(`Validation request failed: ${error.message}`);
    });

    const validateResult = await validateResponse.json().catch(error => {
      throw new Error(`Failed to parse validation response: ${error.message}`);
    });
    
    if (!validateResult.valid) {
      throw new Error(`Token validation failed: ${JSON.stringify(validateResult)}`);
    }
    logStep('Step 1.5: Token successfully validated');
    logStep('TEST 1: PASSED - Successful authentication flow complete');

  } catch (error) {
    logStep(`TEST 1: FAILED - ${error.message}`);
  }

  // Wait for rate limit to reset
  logStep('Waiting 5 seconds for rate limit to reset...');
  await wait(5000);

  // Test 2: Failed Authentication Attempts
  try {
    logStep('\nTEST 2: Testing failed authentication scenarios');

    // Scenario 1: Wrong password
    logStep('Step 2.1: Testing wrong password');
    const wrongPassResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: '',
        password: 'wrongpassword'
      })
    }).catch(error => {
      throw new Error(`Network error: ${error.message}`);
    });

    logStep(`Step 2.1a: Received response with status ${wrongPassResponse.status}`);

    if (wrongPassResponse.status !== 401) {
      const result = await wrongPassResponse.json().catch(() => ({}));
      throw new Error(`Wrong password should return 401, got ${wrongPassResponse.status}: ${JSON.stringify(result)}`);
    }
    logStep('Step 2.2: Wrong password correctly rejected');

    // Wait for rate limit
    await wait(5000);

    // Scenario 2: Honeypot username
    logStep('Step 2.3: Testing honeypot username field');
    const honeypotResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test',
        password: 'dndforever'
      })
    }).catch(error => {
      throw new Error(`Network error: ${error.message}`);
    });

    logStep(`Step 2.3a: Received response with status ${honeypotResponse.status}`);

    if (honeypotResponse.status !== 401) {
      const result = await honeypotResponse.json().catch(() => ({}));
      throw new Error(`Honeypot username should return 401, got ${honeypotResponse.status}: ${JSON.stringify(result)}`);
    }
    logStep('Step 2.4: Honeypot username correctly triggered');

    // Wait for rate limit
    await wait(5000);

    // Scenario 3: Rate limiting
    logStep('Step 2.5: Testing rate limiting');
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: '',
          password: 'wrongpassword'
        })
      }).catch(error => {
        throw new Error(`Rate limit test failed: ${error.message}`);
      }));
    }

    const responses = await Promise.all(requests);
    const responseStatuses = responses.map(r => r.status);
    logStep(`Step 2.5a: Received response statuses: ${responseStatuses.join(', ')}`);
    
    const hasRateLimit = responses.some(r => r.status === 429);
    
    if (!hasRateLimit) {
      throw new Error(`Rate limiting not working. Got statuses: ${responseStatuses.join(', ')}`);
    }
    logStep('Step 2.6: Rate limiting correctly enforced');

    logStep('TEST 2: PASSED - Failed authentication scenarios handled correctly');

  } catch (error) {
    logStep(`TEST 2: FAILED - ${error.message}`);
  }

  logStep('\nAll tests completed.');
}

// Run tests
runTests().catch(error => {
  logStep(`Test suite failed: ${error.message}`);
}); 