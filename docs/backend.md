# Backend Documentation

## Overview

The backend is built using [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/), with [SQLite](https://www.sqlite.org/) as the database. It provides a REST API and WebSocket connections for real-time updates.

## Project Structure

```
server/
├── data/                # SQLite database files
├── maps/               # Uploaded map images
├── src/
│   ├── controllers/    # Route controllers
│   ├── models/        # Database models
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── websocket/     # WebSocket handlers
├── tests/             # Test files
├── server.js          # Main server file
└── package.json       # Dependencies
```

## Environment Configuration

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/vtt.db
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./maps
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

## Key Dependencies

- [Express](https://expressjs.com/) (v4) - Web framework
- [SQLite3](https://github.com/TryGhost/node-sqlite3) - Database
- [Socket.IO](https://socket.io/) - Real-time communication
- [Multer](https://github.com/expressjs/multer) - File uploads
- [CORS](https://github.com/expressjs/cors) - Cross-origin resource sharing
- [Winston](https://github.com/winstonjs/winston) - Logging
- [Jest](https://jestjs.io/) - Testing

## API Versioning

### Version Strategy
```
/api/v1/resource
/api/v2/resource
```

### Version Support
- v1: Current stable version
- v2: Beta features (when available)
- Support for last 2 major versions

## Rate Limiting

### Configuration
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Endpoint-specific Limits
```javascript
const mapUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50 // limit each IP to 50 map uploads per hour
});
```

## Database Design

### Schema Overview

The database uses SQLite with the following tables:

1. **campaigns**
   - Primary storage for campaign information
   - Tracks creation and update timestamps
   - References all campaign-specific data

2. **maps**
   - Stores map metadata and file paths
   - Links to campaigns
   - Maintains map order through position field

3. **markers**
   - Stores map markers with coordinates
   - Contains marker styling information
   - Links to both maps and campaigns

4. **combat_encounters**
   - Stores combat session data
   - Tracks participants and turns
   - Maintains combat state

5. **combat_history**
   - Archives completed combat sessions
   - Stores round-by-round data
   - Tracks combat statistics

6. **action_logs**
   - Tracks all system actions
   - Provides audit trail
   - Links actions to campaigns

7. **timeline_events**
   - Stores campaign timeline events
   - Chronological event tracking
   - Campaign-specific event history

## API Implementation

### REST Endpoints

#### Campaign Management
```javascript
GET    /api/v1/campaigns
POST   /api/v1/campaigns
PUT    /api/v1/campaigns/:id
DELETE /api/v1/campaigns/:id
```

#### Combat System
```javascript
POST   /api/v1/combat/start
PUT    /api/v1/combat/:id/turn
POST   /api/v1/combat/:id/participant
DELETE /api/v1/combat/:id/participant/:participantId
PUT    /api/v1/combat/:id/end
GET    /api/v1/combat/history
GET    /api/v1/combat/history/:id
```

#### History System
```javascript
GET    /api/v1/history
GET    /api/v1/history/:campaignId
GET    /api/v1/history/export
POST   /api/v1/history/import
DELETE /api/v1/history/:id
```

## WebSocket Events

### Combat Events
```javascript
socket.on('combatStart', (data) => {
  // Handle combat start
});

socket.on('turnChange', (data) => {
  // Handle turn change
});

socket.on('combatUpdate', (data) => {
  // Handle combat state update
});

socket.on('combatEnd', (data) => {
  // Handle combat end
});
```

### Map Events
```javascript
socket.on('mapUpdate', (data) => {
  // Handle map updates
});

socket.on('markerChange', (data) => {
  // Handle marker changes
});
```

## Monitoring and Logging

### Winston Logger Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics Collection
- Request duration
- Error rates
- WebSocket connections
- Database performance
- File system usage

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
sqlite3 data/vtt.db ".backup 'backup/vtt_${timestamp}.db'"
```

### File System Backup
```javascript
const backup = require('./utils/backup');

// Scheduled backup job
cron.schedule('0 0 * * *', () => {
  backup.createFullBackup();
});
```

### Recovery Procedures
1. Database restoration
2. File system recovery
3. State reconciliation
4. Integrity verification

## Scaling Considerations

### Horizontal Scaling
- Load balancing
- Session management
- WebSocket clustering
- File storage distribution

### Vertical Scaling
- Database optimization
- Connection pooling
- Memory management
- CPU utilization

## Security Measures

### API Security
- JWT authentication
- Request validation
- SQL injection prevention
- XSS protection

### File Security
- Type validation
- Virus scanning
- Access control
- Encryption at rest

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize database:
```bash
npm run db:init
```

3. Run tests:
```bash
npm run test
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Production Setup
```bash
npm run build
npm run db:migrate
npm start
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Health Checks
```javascript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  res.send(health);
});
``` 