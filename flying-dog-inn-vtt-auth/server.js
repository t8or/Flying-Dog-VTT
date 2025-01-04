const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();

// Database setup
const db = new sqlite3.Database('auth.sqlite');
db.serialize(() => {
  // Table for login attempts
  db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    username TEXT,
    password TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    success INTEGER DEFAULT 0
  )`);

  // Table for blocked IPs
  db.run(`CREATE TABLE IF NOT EXISTS blocked_ips (
    ip_address TEXT PRIMARY KEY,
    blocked_until INTEGER NOT NULL
  )`);

  // Table for valid tokens
  db.run(`CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )`);
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.static('public')); // Serve the login page

// Rate limiter - 5 requests per 10 seconds
const loginLimiter = rateLimit({
  windowMs: 10000, // 10 seconds
  max: 5, // 5 requests per window
  message: { error: 'Too many login attempts. Please wait.' }
});

// Check if IP is blocked
const checkBlockedIP = async (req, res, next) => {
  const ip = req.ip;
  
  db.get('SELECT blocked_until FROM blocked_ips WHERE ip_address = ?', [ip], (err, row) => {
    if (err) {
      console.error('Error checking blocked IP:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (row) {
      const now = Math.floor(Date.now() / 1000);
      if (row.blocked_until > now) {
        return res.status(403).json({ 
          error: 'IP is blocked',
          blockedUntil: new Date(row.blocked_until * 1000).toISOString()
        });
      } else {
        // Remove expired block
        db.run('DELETE FROM blocked_ips WHERE ip_address = ?', [ip]);
      }
    }
    next();
  });
};

// Generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate token endpoint
app.get('/api/auth/validate', (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  db.get('SELECT * FROM auth_tokens WHERE token = ?', [token], (err, row) => {
    if (err) {
      console.error('Error validating token:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (row) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  });
});

// Login endpoint
app.post('/api/auth/login', loginLimiter, checkBlockedIP, async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  // Honeypot check - fail if username is not empty
  if (username.length > 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Log the attempt
  db.run(
    'INSERT INTO login_attempts (ip_address, username, password) VALUES (?, ?, ?)',
    [ip, username, password]
  );

  // Check recent failed attempts
  db.get(
    'SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND success = 0 AND timestamp > ?',
    [ip, Math.floor(Date.now() / 1000) - 3600],
    (err, row) => {
      if (err) {
        console.error('Error checking failed attempts:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Block IP if 5 or more failed attempts
      if (row.count >= 5) {
        const blockedUntil = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week
        db.run(
          'INSERT OR REPLACE INTO blocked_ips (ip_address, blocked_until) VALUES (?, ?)',
          [ip, blockedUntil]
        );
        return res.status(403).json({ 
          error: 'Too many failed attempts. IP blocked for 1 week.',
          blockedUntil: new Date(blockedUntil * 1000).toISOString()
        });
      }

      // Check password
      if (password === 'dndforever') {
        // Generate and store token
        const token = generateToken();
        db.run('INSERT INTO auth_tokens (token) VALUES (?)', [token], (err) => {
          if (err) {
            console.error('Error storing token:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          // Update attempt as successful
          db.run(
            'UPDATE login_attempts SET success = 1 WHERE ip_address = ? AND timestamp = (SELECT MAX(timestamp) FROM login_attempts WHERE ip_address = ?)',
            [ip, ip]
          );
          
          // Set permanent cookie and redirect
          res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
          });

          res.json({ 
            success: true,
            frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
          });
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  );
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`);
}); 