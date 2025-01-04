const fetch = require('node-fetch');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Validate token with auth service
    const response = await fetch('http://localhost:3002/api/auth/validate', {
      headers: {
        'Cookie': `auth_token=${token}`
      }
    });

    const result = await response.json();

    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    next();
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
};

module.exports = authMiddleware; 