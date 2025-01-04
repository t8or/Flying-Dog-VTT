# System Architecture

## Overview

The Virtual Tabletop (VTT) application follows a client-server architecture with real-time communication capabilities. The system is designed to be scalable, maintainable, and provide a seamless user experience for tabletop gaming.

## System Components

```mermaid
graph TD
    Client[React Frontend]
    Server[Express Backend]
    DB[(SQLite Database)]
    FS[File Storage]
    WS[WebSocket Server]

    Client -->|HTTP| Server
    Client <-->|WebSocket| WS
    Server -->|Query| DB
    Server -->|Read/Write| FS
    WS -->|Event| Server
```

## Technology Stack

### Frontend
- React 18 for UI components
- React Router for navigation
- Material-UI for component library
- Socket.IO Client for real-time updates
- Leaflet.js for map interactions

### Backend
- Node.js runtime
- Express.js web framework
- SQLite database
- Socket.IO for WebSocket server
- Multer for file handling

## Data Flow

### Request Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Interact with UI
    Frontend->>Backend: HTTP Request
    Backend->>Database: Query Data
    Database-->>Backend: Return Results
    Backend-->>Frontend: Send Response
    Frontend-->>User: Update UI
```

### Real-time Updates
```mermaid
sequenceDiagram
    participant User1
    participant Frontend1
    participant WebSocket
    participant Backend
    participant Frontend2
    participant User2
    
    User1->>Frontend1: Make Change
    Frontend1->>Backend: Send Update
    Backend->>WebSocket: Broadcast Event
    WebSocket->>Frontend2: Push Update
    Frontend2->>User2: Update UI
```

## Core Subsystems

### 1. Campaign Management
- Campaign CRUD operations
- User permissions
- Campaign state management
- Data synchronization

### 2. Map System
- Map upload and storage
- Image processing
- Grid overlay system
- Marker management
- Fog of war

### 3. Combat Tracker
- Initiative tracking
- Turn management
- Status effects
- Combat history
- Statistics tracking

### 4. Timeline System
- Event management
- Chronological tracking
- Event categorization
- Timeline visualization

### 5. Activity Logger
- Action tracking
- Event filtering
- Real-time updates
- Export capabilities

## State Management

### Frontend State
```mermaid
graph TD
    Global[Global State]
    Campaign[Campaign Context]
    Auth[Auth Context]
    Socket[Socket Context]
    Local[Local Component State]

    Global --> Campaign
    Global --> Auth
    Global --> Socket
    Campaign --> Local
```

### Backend State
```mermaid
graph TD
    DB[Database]
    Cache[Memory Cache]
    Session[Session Store]
    WS[WebSocket State]

    DB --> Cache
    Cache --> WS
    Session --> WS
```

## Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Auth

    User->>Frontend: Login Request
    Frontend->>Backend: Auth Request
    Backend->>Auth: Validate
    Auth-->>Backend: Token
    Backend-->>Frontend: JWT
    Frontend-->>User: Success
```

### Authorization Layers
1. JWT Validation
2. Route Guards
3. Resource Permission
4. WebSocket Authentication
5. File Access Control

## Scalability Design

### Horizontal Scaling
```mermaid
graph TD
    LB[Load Balancer]
    S1[Server 1]
    S2[Server 2]
    S3[Server 3]
    DB[(Database)]
    FS[File Storage]

    LB --> S1
    LB --> S2
    LB --> S3
    S1 --> DB
    S2 --> DB
    S3 --> DB
    S1 --> FS
    S2 --> FS
    S3 --> FS
```

### Performance Optimization
1. Database indexing
2. Caching layers
3. Asset optimization
4. Connection pooling
5. Load balancing

## Deployment Architecture

### Development Environment
```mermaid
graph TD
    Dev[Development]
    Test[Testing]
    Stage[Staging]
    Prod[Production]

    Dev --> Test
    Test --> Stage
    Stage --> Prod
```

### Production Environment
```mermaid
graph TD
    DNS[DNS]
    CDN[CDN]
    LB[Load Balancer]
    App[Application Servers]
    DB[(Database)]
    Storage[File Storage]

    DNS --> CDN
    CDN --> LB
    LB --> App
    App --> DB
    App --> Storage
```

## Monitoring and Logging

### Metrics Collection
1. Application metrics
2. System metrics
3. Business metrics
4. User metrics

### Logging Levels
1. Error tracking
2. Performance monitoring
3. User activity
4. System health

## Disaster Recovery

### Backup Strategy
1. Database backups
2. File system backups
3. Configuration backups
4. State snapshots

### Recovery Procedures
1. System restoration
2. Data recovery
3. State reconciliation
4. Service resumption

## Future Considerations

### Planned Improvements
1. Microservices architecture
2. Container orchestration
3. Cloud migration
4. AI integration

### Scalability Roadmap
1. Database sharding
2. Global distribution
3. Edge computing
4. Service mesh 