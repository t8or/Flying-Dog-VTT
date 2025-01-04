# Log Component Documentation

## Overview

The Log component displays a chronological record of all system actions and events, providing an audit trail for campaign activities.

## Component Location

```
src/components/Log.js
```

## Core Features

### Action Log Display

1. Log Entry Structure
```javascript
interface LogEntry {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  details: string;
  campaign_id: number;
  created_at: number;
}
```

2. Log List
```javascript
<div className="log-entries">
  {logs.map(log => (
    <LogEntry
      key={log.id}
      entry={log}
      onFilter={handleFilterByType}
    />
  ))}
</div>
```

## Component Architecture

### Main Components

1. **LogEntry**
   - Entry display
   - Action type indicator
   - Timestamp formatting
   - Entity references

2. **LogFilters**
   - Action type filtering
   - Date range selection
   - Entity type filtering
   - Campaign filtering

3. **LogHeader**
   - Filter controls
   - Search functionality
   - View options

## State Management

### Log State
```javascript
const [logs, setLogs] = useState([]);
const [filters, setFilters] = useState({
  actionType: null,
  entityType: null,
  dateRange: null,
  campaign: null
});
const [isLoading, setIsLoading] = useState(true);
```

### Filter State
```javascript
const [searchTerm, setSearchTerm] = useState('');
const [selectedTypes, setSelectedTypes] = useState([]);
const [dateRange, setDateRange] = useState([null, null]);
```

## API Integration

### Log Operations

1. Fetch Logs
```javascript
const fetchLogs = async () => {
  const response = await fetch('http://localhost:3001/api/logs');
  const data = await response.json();
  setLogs(data);
};
```

2. Filtered Fetch
```javascript
const fetchFilteredLogs = async (filters) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3001/api/logs?${queryParams}`);
  const data = await response.json();
  setLogs(data);
};
```

## Event Handling

### Filter Events

1. Type Filtering
```javascript
const handleTypeFilter = (type) => {
  setSelectedTypes(prev => 
    prev.includes(type) 
      ? prev.filter(t => t !== type)
      : [...prev, type]
  );
};
```

2. Date Range Selection
```javascript
const handleDateRangeChange = (range) => {
  setDateRange(range);
  applyFilters({ ...filters, dateRange: range });
};
```

## Styling System

### Log Layout
```css
.log-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}
```

### Entry Styling
```css
.log-entry {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
```

## Error Handling

1. Load Error
```javascript
if (error) {
  return (
    <div className="error-container">
      <ErrorIcon />
      <span>Failed to load logs: {error}</span>
    </div>
  );
}
```

2. Filter Error
```javascript
const handleFilterError = (error) => {
  setError('Invalid filter combination');
  resetFilters();
};
```

## Performance Optimization

1. Log List
   - Virtual scrolling
   - Pagination
   - Cached results

2. Filter Operations
   - Debounced search
   - Optimized filter logic
   - Memoized results

## Integration Points

1. Campaign Integration
   - Campaign-specific logs
   - Cross-campaign filtering
   - Campaign context

2. Entity References
   - Map references
   - Timeline events
   - Combat logs

## Development Notes

1. Log Structure
   - Action categorization
   - Entity relationships
   - Timestamp handling

2. Filter Implementation
   - Complex filter logic
   - Search optimization
   - Filter combinations

## Real-time Updates

1. WebSocket Integration
```javascript
useEffect(() => {
  const socket = io('http://localhost:3001');
  socket.on('newLog', handleNewLog);
  return () => socket.disconnect();
}, []);
```

2. Log Updates
```javascript
const handleNewLog = (log) => {
  setLogs(prev => [log, ...prev]);
};
```

## Testing Considerations

1. Component Tests
   - Filter logic
   - Display formatting
   - User interactions

2. Integration Tests
   - API integration
   - WebSocket updates
   - Filter combinations 