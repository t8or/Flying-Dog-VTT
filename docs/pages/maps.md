# Maps Component Documentation

## Overview

The Maps component provides an interactive map viewer with marker management capabilities. It uses [Leaflet.js](https://leafletjs.com/) for map interactions and supports custom markers with various shapes and colors.

## Component Location

```
src/components/Maps.js
src/components/Maps.css
src/components/MapUploadDialog.js
```

## Core Features

### Map Display

1. Image Overlay
```javascript
<ImageOverlay
  url={`http://localhost:3001/maps/${currentMap.path}`}
  bounds={bounds}
/>
```

2. Map Container
```javascript
<MapContainer
  bounds={bounds}
  maxBounds={bounds}
  style={{ height: '100%', width: '100%' }}
  crs={L.CRS.Simple}
>
```

### Marker System

#### Marker Types
```javascript
const MARKER_SHAPES = {
  default: { label: 'Default Pin', icon: <MapPin /> },
  circle: { label: 'Circle', icon: <Circle /> },
  square: { label: 'Square', icon: <Square /> },
  triangle: { label: 'Triangle', icon: <Triangle /> }
};
```

#### Custom Icons
```javascript
function createCustomIcon(color, shape) {
  // SVG template generation
  const svgTemplate = `<svg>...</svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgTemplate)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
}
```

## Component Architecture

### Main Components

1. **MapEventHandler**
   - Handles map click events
   - Creates temporary markers
   - Manages marker placement

2. **MarkerPopupContent**
   - Marker editing interface
   - Color and shape selection
   - Label and description management

3. **MapResetter**
   - Handles map bounds
   - Resets view on changes
   - Maintains map constraints

## State Management

### Map State
```javascript
const [currentMap, setCurrentMap] = useState(null);
const [markers, setMarkers] = useState([]);
const [imageDimensions, setImageDimensions] = useState(null);
const [isEditingMarker, setIsEditingMarker] = useState(false);
```

### Menu State
```javascript
const [anchorEl, setAnchorEl] = useState(null);
const [renameDialogOpen, setRenameDialogOpen] = useState(false);
const [newMapName, setNewMapName] = useState('');
```

## API Integration

### Marker Operations

1. Fetch Markers
```javascript
const fetchMarkers = () => {
  fetch(`http://localhost:3001/api/maps/${id}/markers`)
    .then(response => response.json())
    .then(data => setMarkers(data));
};
```

2. Add Marker
```javascript
const handleMarkerAdd = (marker) => {
  fetch(`http://localhost:3001/api/maps/${id}/markers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marker)
  });
};
```

3. Update Marker
```javascript
const handleMarkerUpdate = (updatedMarker) => {
  return fetch(`http://localhost:3001/api/maps/${id}/markers/${updatedMarker.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedMarker)
  });
};
```

## Event Handling

### Map Events

1. Click Handling
```javascript
const map = useMapEvents({
  click: (e) => {
    // Marker creation logic
  }
});
```

2. Popup Events
```javascript
marker.on('popupclose', () => {
  // Cleanup logic
});
```

## Styling System

### Popup Styling
```css
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 0;
}
```

### Marker Content
```css
.marker-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

## Error Handling

1. Map Loading
```javascript
if (!currentMap || !imageDimensions) {
  return <div>Loading map...</div>;
}
```

2. API Errors
```javascript
.catch(error => {
  console.error('Error:', error);
  setError(error.message);
});
```

## Performance Optimization

1. Image Loading
   - Dimensions calculation
   - Bounds management
   - Memory cleanup

2. Marker Management
   - Efficient marker updates
   - Popup cleanup
   - Event listener cleanup

## Map Controls

### Menu Options
```javascript
<Menu>
  <MenuItem onClick={handleRenameClick}>Rename</MenuItem>
  <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
</Menu>
```

### Rename Dialog
```javascript
<Dialog open={renameDialogOpen}>
  <DialogTitle>Rename Map</DialogTitle>
  <DialogContent>
    <TextField
      value={newMapName}
      onChange={(e) => setNewMapName(e.target.value)}
    />
  </DialogContent>
</Dialog>
```

## Integration Points

1. Campaign System
   - Map ownership
   - Campaign-specific markers
   - Shared resources

2. Timeline Integration
   - Event markers
   - Location references
   - Historical tracking

## Testing Strategy

1. Map Interactions
   - Click handling
   - Marker placement
   - Popup behavior

2. API Integration
   - Marker CRUD operations
   - Map management
   - Error scenarios

## Development Notes

1. Leaflet Configuration
   - Simple CRS for image maps
   - Custom icon system
   - Event management

2. React Integration
   - Component lifecycle
   - State management
   - Event propagation 