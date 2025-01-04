# Frontend Documentation

## Overview

The frontend is built using [React](https://reactjs.org/) and follows a component-based architecture. It uses [React Router](https://reactrouter.com/) for navigation and [Material-UI](https://mui.com/) for UI components.

## Project Structure

```
src/
├── components/           # Reusable components
├── pages/               # Page components
├── contexts/            # React contexts
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── styles/             # Global styles
├── tests/              # Test files
├── App.js              # Main application component
└── index.js            # Application entry point
```

## Environment Configuration

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
REACT_APP_MAP_UPLOAD_SIZE_LIMIT=10485760
```

## Key Dependencies

- [React](https://reactjs.org/) (v18) - Core framework
- [React Router](https://reactrouter.com/) (v6) - Navigation
- [Material-UI](https://mui.com/) (v5) - UI components
- [Leaflet.js](https://leafletjs.com/) - Map interactions
- [Phosphor Icons](https://phosphoricons.com/) - Icon system
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) - Real-time updates
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/react) - Component testing

## Component Architecture

### Core Components

1. **App.js**
   - Root component
   - Sets up routing
   - Manages global state
   - Handles navigation layout
   - Error boundaries
   - Authentication flow

2. **Sidebar.js**
   - Main navigation component
   - Campaign management
   - Map list
   - Connection status monitoring
   - Real-time updates via WebSocket
   - Campaign context integration

3. **Maps.js**
   - Interactive map viewer
   - Marker management
   - Custom marker shapes and colors
   - Popup system for marker editing
   - Uses Leaflet.js for map interactions
   - Grid overlay system
   - Fog of war management

4. **Timeline.js**
   - Campaign timeline management
   - Event creation and editing
   - Chronological event display
   - Event filtering and sorting
   - Real-time collaboration

5. **Log.js**
   - Action logging system
   - Activity monitoring
   - Filterable log entries
   - Real-time updates
   - Export functionality

### Utility Components

1. **MapUploadDialog.js**
   - Map upload interface
   - File validation
   - Upload progress
   - Error handling
   - Image optimization

2. **History.js**
   - Combat history tracking
   - Historical event viewing
   - Session summaries
   - Export capabilities

3. **CombatTracker.js**
   - Initiative tracking
   - Combat management
   - Turn order system
   - Status effect tracking
   - Real-time updates

## State Management

### Global State
- Campaign context for shared campaign data
- Authentication context for user state
- Theme context for application theming
- Socket context for WebSocket state

### Local State
- Component-specific useState
- Form state management
- UI state control
- Error state handling

### Custom Hooks
```javascript
useWebSocket    // WebSocket connection management
useCampaign     // Campaign data and operations
useAuth         // Authentication state and operations
useMapControls  // Map interaction utilities
useCombat       // Combat state management
```

## Styling System

1. **Component Styles**
   - CSS Modules for scoped styling
   - Material-UI styled components
   - Theme-aware components
   - Responsive design utilities

2. **Global Styles**
   - Base styles and resets
   - Theme variables
   - Typography system
   - Animation utilities

3. **Theme System**
   - Light/Dark mode support
   - Custom color palettes
   - Component variants
   - Responsive breakpoints

## Accessibility

1. **ARIA Implementation**
   - Semantic HTML
   - ARIA labels and roles
   - Keyboard navigation
   - Focus management

2. **Color Contrast**
   - WCAG 2.1 compliance
   - High contrast mode
   - Color blind considerations

3. **Responsive Design**
   - Mobile-first approach
   - Screen reader support
   - Reduced motion support

## Testing

### Unit Tests
```bash
npm run test:unit
```
- Component rendering
- Hook behavior
- Utility functions
- Context providers

### Integration Tests
```bash
npm run test:integration
```
- Component interactions
- Route transitions
- API integration
- WebSocket communication

### E2E Tests
```bash
npm run test:e2e
```
- User flows
- Campaign management
- Combat scenarios
- Map interactions

## Offline Capabilities

1. **Service Worker**
   - Static asset caching
   - API response caching
   - Offline fallbacks
   - Background sync

2. **State Persistence**
   - LocalStorage backup
   - IndexedDB for large data
   - Conflict resolution
   - Sync queue

## Deployment

### Build Process
```bash
npm run build
```
- Asset optimization
- Code splitting
- Environment configuration
- Source maps generation

### Deployment Platforms
- Vercel
- Netlify
- AWS S3/CloudFront
- Docker container

### CI/CD Pipeline
- Automated testing
- Build verification
- Environment promotion
- Release management

## Performance Monitoring

1. **Metrics**
   - Core Web Vitals
   - Custom metrics
   - Error tracking
   - User interactions

2. **Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Cache management

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS/Android) 