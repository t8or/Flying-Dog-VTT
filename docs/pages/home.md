# Home Page Documentation

## Overview

The Home page serves as the main dashboard for the application, displaying recent activity, available maps, and campaign information.

## Component Location

```
src/pages/Home.js
src/pages/Home.css
```

## Features

### Recent Activity Display

```javascript
const RecentActivity = () => {
  const [logs, setLogs] = useState([]);
  
  // Fetches recent activity logs
  useEffect(() => {
    fetch('http://localhost:3001/api/logs?limit=5')
      .then(response => response.json())
      .then(data => setLogs(data));
  }, []);
  
  return (
    <div className="activity-section">
      {/* Activity rendering logic */}
    </div>
  );
};
```

### Map Grid

The map grid displays available maps in a responsive grid layout:

1. Grid Implementation
   - Uses CSS Grid for layout
   - Responsive columns based on viewport
   - Card-based map display

2. Map Preview
   - Thumbnail generation
   - Hover effects
   - Quick access links

3. Upload Interface
   - Drag and drop support
   - File type validation
   - Progress indication

## State Management

```javascript
const [maps, setMaps] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
```

## Data Fetching

1. Maps Data
```javascript
useEffect(() => {
  fetchMaps();
}, [selectedCampaign]);
```

2. Activity Logs
```javascript
useEffect(() => {
  fetchRecentActivity();
}, []);
```

## Layout Structure

```jsx
<div className="home-container">
  <header>
    <h1>Dashboard</h1>
  </header>
  
  <main>
    <section className="recent-activity">
      <RecentActivity />
    </section>
    
    <section className="map-grid">
      <MapGrid maps={maps} />
    </section>
  </main>
</div>
```

## Styling

### Grid Layout
```css
.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  padding: 24px;
}
```

### Card Styling
```css
.map-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}
```

## Event Handlers

1. Map Selection
```javascript
const handleMapClick = (mapId) => {
  navigate(`/maps/${mapId}`);
};
```

2. Upload Handling
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  // Upload logic
};
```

## Error Handling

1. Loading States
```javascript
if (isLoading) {
  return <LoadingSpinner />;
}
```

2. Error States
```javascript
if (error) {
  return <ErrorMessage message={error} />;
}
```

## Responsive Design

### Breakpoints
```css
@media (max-width: 768px) {
  .map-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
```

### Mobile Optimization
```css
@media (max-width: 480px) {
  .map-grid {
    grid-template-columns: 1fr;
  }
}
```

## Performance Optimization

1. Image Loading
   - Lazy loading for map thumbnails
   - Optimized image sizes
   - Loading placeholders

2. Data Management
   - Pagination for large datasets
   - Cached responses
   - Debounced updates

## Integration Points

1. Backend API
   - Map data fetching
   - Activity log retrieval
   - File uploads

2. Navigation
   - React Router integration
   - Dynamic routing
   - History management

## Testing Considerations

1. Component Tests
   - Render testing
   - User interaction
   - State management

2. Integration Tests
   - API calls
   - Navigation
   - Error states 