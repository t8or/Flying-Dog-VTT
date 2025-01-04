import React, { useEffect } from 'react';
import './Login.css';

const Login = () => {
  useEffect(() => {
    // Redirect to auth service
    window.location.href = 'http://localhost:3002';
  }, []);

  return (
    <div className="login-container">
      <div className="login-message">
        <h2>Redirecting to login...</h2>
        <p>Please wait while we redirect you to the authentication service.</p>
      </div>
    </div>
  );
};

export default Login; 