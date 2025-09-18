# Flying Dog Inn VTT

A virtual tabletop tool for managing D&D campaigns, maps, and markers. Built with React and Node.js, this application provides a seamless experience for Dungeon Masters to manage their campaigns and share interactive maps with players.

## 🎮 Features

### Campaign Management
- Create and manage multiple campaigns
- Campaign-specific maps and markers
- Customizable campaign settings
- Timeline tracking for campaign events
- Track loot and treasure from combat

### Interactive Map System
- Upload custom PNG maps
- Intuitive pan/zoom interface powered by Leaflet.js
- Custom marker system with various colors
- Detailed marker descriptions and labels
- Real-time-ish map updates for all connected players

### Real-time Collaboration
- Live WebSocket connection for instant updates
- Action logging system for tracking changes
- Connection status monitoring
- Synchronized map viewing for all players

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flying-dog-inn-vtt.git
cd flying-dog-inn-vtt
```

2. Install dependencies for all services:
```bash
# Auth Service
cd flying-dog-inn-vtt-auth
npm install

# Backend
cd ../flying-dog-inn-vtt-backend
npm install

# Frontend
cd ../flying-dog-inn-vtt-frontend
npm install
```

3. Create environment files:
```bash
# Auth Service (.env)
PORT=3002
DATABASE_PATH=./auth.sqlite

# Backend (.env)
PORT=3001
DATABASE_PATH=./data/database.sqlite
MAPS_DIRECTORY=./maps
AUTH_SERVICE_URL=http://localhost:3002

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_AUTH_URL=http://localhost:3002
```

4. Start all services (in separate terminals):
```bash
# Start Auth Service (port 3002)
cd flying-dog-inn-vtt-auth
npm start

# Start Backend (port 3001)
cd flying-dog-inn-vtt-backend
npm start

# Start Frontend (port 3000)
cd flying-dog-inn-vtt-frontend
npm start
```

The application will be available at `http://localhost:3000`. You'll be redirected to the auth service at `http://localhost:3002` for login.

### Docker Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flying-dog-inn-vtt.git
cd flying-dog-inn-vtt
```

2. Create environment files as described in the standard installation section above.

3. Build and run using Docker Compose:
```bash
docker-compose up --build
```

The services will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Auth Service: `http://localhost:3002`

### Docker Volumes

The application uses Docker volumes to persist data:
```yaml
volumes:
  - /mnt/user/appdata/flying-dog-inn-vtt/auth:/config     # Auth service data
  - /mnt/user/appdata/flying-dog-inn-vtt/backend:/config  # Backend data
  - /mnt/user/appdata/flying-dog-inn-vtt/maps:/maps       # Map storage
```

### Container Details

1. **Auth Service**
   - Port: 3002
   - Base image: Node.js 16
   - Handles user authentication
   - Rate limiting enabled

2. **Backend Service**
   - Port: 3001
   - Base image: Node.js 16
   - Manages game data and WebSocket connections
   - Handles file uploads

3. **Frontend Service**
   - Port: 3000
   - Base image: Nginx
   - Serves static React application files
   - Connects to backend and auth services

## �� Development Notes

- The backend uses SQLite for simplicity and portability
- Map images are stored in the filesystem with references in the database
- The frontend uses React Router for client-side routing
- Leaflet.js is used for map interactions with custom marker implementations
- Material-UI provides the base component library
- WebSocket connection provides real-time updates and health monitoring 

### Project Structure
```
flying-dog-inn-vtt-backend/     # Backend server
├── data/                       # SQLite database storage
├── maps/                       # Uploaded map images
├── server.js                   # Express server + API endpoints
└── package.json                # Backend dependencies

flying-dog-inn-vtt-frontend/    # React frontend
├── public/                     # Static assets
└── src/                        # Source code
    ├── components/             # React components
    └── pages/                  # Page components
```

### Tech Stack

**Frontend:**
- React 18.2.0
- React Router v6.11.2
- Leaflet.js v1.9.4
- Material-UI v5.14.18
- Phosphor Icons v2.0.15
- CSS Modules for styling
- Socket.IO Client v4.8.1

**Backend:**
- Node.js + Express v4.21.2
- SQLite3 v5.1.7
- Socket.IO v4.8.1
- Multer v1.4.5-lts.1
- CORS v2.8.5
- Cookie Parser v1.4.7

**Auth Service:**
- Node.js + Express v4.18.2
- SQLite3 v5.1.7
- CORS v2.8.5
- Cookie Parser v1.4.7
- Express Rate Limit v7.1.5

### Development Guidelines
- Use ESLint and Prettier for code formatting
- Follow component-based architecture
- Implement proper error handling
- Write meaningful commit messages
- Document new features and API changes

## 🔌 API Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check auth status

### Maps
- `GET /api/maps` - List all maps
  - Query params: `campaign_id`, `sort`, `limit`
- `POST /api/maps` - Upload new map
  - Body: `FormData` with `map` file and metadata
- `GET /api/maps/:id` - Get map details
- `PUT /api/maps/:id/rename` - Rename map
  - Body: `{ name: string }`
- `DELETE /api/maps/:id` - Delete map
- `PUT /api/maps/reorder` - Reorder maps
  - Body: `{ mapIds: number[] }`

### Markers
- `GET /api/maps/:id/markers` - Get markers for map
- `POST /api/maps/:id/markers` - Create marker
  - Body: `{ lat, lng, label, description, color, shape }`
- `PUT /api/maps/:id/markers/:markerId` - Update marker
- `DELETE /api/maps/:id/markers/:markerId` - Delete marker

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
  - Body: `{ name, description }`
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Timeline
- `GET /api/timeline` - Get timeline events
  - Query params: `campaign_id`, `start_date`, `end_date`
- `POST /api/timeline` - Create event
- `PUT /api/timeline/:id` - Update event
- `DELETE /api/timeline/:id` - Delete event

### System
- `GET /api/health` - Server health check
- `GET /api/logs` - Get action logs
  - Query params: `campaign_id`, `limit`, `offset`

## 📊 Database Schema

### campaigns
```sql
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### maps
```sql
CREATE TABLE maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    campaign_id INTEGER,
    position INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

### markers
```sql
CREATE TABLE markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_id INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    label TEXT,
    description TEXT,
    color TEXT,
    shape TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_id) REFERENCES maps(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

### action_logs
```sql
CREATE TABLE action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    campaign_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

### timeline_events
```sql
CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME,
    campaign_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

