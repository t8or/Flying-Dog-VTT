import React, { useEffect } from 'react';
import './Login.css';

const Login = () => {
  useEffect(() => {
    // Redirect to auth service root path (where the login form is)
    window.location.href = '/';
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