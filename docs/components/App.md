# App Component Documentation

## Overview

The App component serves as the root component of the application, handling routing, layout, and global state management.

## Component Location

```
src/App.js
src/App.css
```

## Core Functionality

### Router Setup
```javascript
<BrowserRouter>
  <div className="app">
    <Sidebar onMapChange={handleMapChange} />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/maps/:id" element={<Maps />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/log" element={<Log />} />
      <Route path="/combat" element={<CombatTracker />} />
      <Route path="/combat/history" element={<History />} />
    </Routes>
  </div>
</BrowserRouter>
```

### Layout Structure

1. Main Layout
   - Fixed sidebar
   - Dynamic content area
   - Responsive design

2. Route Management
   - Home dashboard
   - Map viewer
   - Timeline view
   - Activity log
   - Combat system

### Global State

```javascript
const [mapRefreshKey, setMapRefreshKey] = useState(0);

const handleMapChange = () => {
  setMapRefreshKey(prev => prev + 1);
};
```

## Component Integration

### Sidebar Integration
```javascript
<Sidebar onMapChange={handleMapChange} />
```

### Route Components
```javascript
<Route path="/maps/:id" element={<Maps onMapChange={handleMapChange} />} />
```

## Styling System

### Global Styles
```css
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}
```

### Layout Management
```css
.content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
```

## Error Boundaries

```javascript
<ErrorBoundary>
  <Routes>
    {/* Route definitions */}
  </Routes>
</ErrorBoundary>
```

## Performance Considerations

1. Route-based Code Splitting
```javascript
const Maps = lazy(() => import('./components/Maps'));
const Timeline = lazy(() => import('./components/Timeline'));
```

2. Suspense Integration
```javascript
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    {/* Route definitions */}
  </Routes>
</Suspense>
```

## State Management

1. Global State
   - Map refresh mechanism
   - Route state
   - Navigation history

2. Context Providers
   - Theme provider
   - Authentication context
   - Campaign context

## Event Handling

1. Navigation Events
   - Route changes
   - History management
   - Deep linking

2. Global Events
   - Error handling
   - Loading states
   - Network status

## Integration Points

1. Router Integration
   - Route configuration
   - Navigation guards
   - Route parameters

2. Component Communication
   - Props passing
   - Event bubbling
   - State synchronization

## Development Notes

1. Component Organization
   - Route-based structure
   - Shared components
   - Layout management

2. State Flow
   - Top-down props
   - Event handling
   - State updates 