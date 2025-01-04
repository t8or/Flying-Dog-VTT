# History Component Documentation

## Overview

The History component provides a detailed view of past combat encounters and their outcomes, allowing users to review and analyze previous battles.

## Component Location

```
src/components/History.js
```

## Core Features

### Combat History Display

1. History Entry Structure
```javascript
interface CombatHistory {
  id: number;
  campaign_id: number;
  encounter_name: string;
  start_time: number;
  end_time: number;
  participants: Participant[];
  rounds: number;
  outcome: string;
  notes: string;
}
```

2. History List
```javascript
<div className="history-entries">
  {combatHistory.map(entry => (
    <HistoryEntry
      key={entry.id}
      entry={entry}
      onView={handleViewDetails}
    />
  ))}
</div>
```

## Component Architecture

### Main Components

1. **HistoryEntry**
   - Combat summary
   - Participant list
   - Duration display
   - Outcome status

2. **HistoryFilters**
   - Date filtering
   - Campaign filtering
   - Participant search
   - Outcome filtering

3. **HistoryDetails**
   - Round-by-round view
   - Participant stats
   - Action log
   - Notes display

## State Management

### History State
```javascript
const [combatHistory, setCombatHistory] = useState([]);
const [selectedEntry, setSelectedEntry] = useState(null);
const [filters, setFilters] = useState({
  campaign: null,
  dateRange: null,
  participant: null,
  outcome: null
});
const [isLoading, setIsLoading] = useState(true);
```

### Detail View State
```javascript
const [isDetailView, setIsDetailView] = useState(false);
const [roundDetails, setRoundDetails] = useState([]);
const [participants, setParticipants] = useState([]);
```

## API Integration

### History Operations

1. Fetch History
```javascript
const fetchHistory = async () => {
  const response = await fetch('http://localhost:3001/api/combat/history');
  const data = await response.json();
  setCombatHistory(data);
};
```

2. Fetch Entry Details
```javascript
const fetchEntryDetails = async (entryId) => {
  const response = await fetch(`http://localhost:3001/api/combat/history/${entryId}`);
  const data = await response.json();
  setSelectedEntry(data);
};
```

## Event Handling

### View Controls

1. Detail View Toggle
```javascript
const handleViewDetails = (entryId) => {
  setIsDetailView(true);
  fetchEntryDetails(entryId);
};
```

2. Filter Application
```javascript
const applyFilters = (filters) => {
  setFilters(filters);
  fetchFilteredHistory(filters);
};
```

## Styling System

### History Layout
```css
.history-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}
```

### Entry Styling
```css
.history-entry {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## Error Handling

1. Load Error
```javascript
const handleLoadError = (error) => {
  setError('Failed to load combat history');
  setIsLoading(false);
};
```

2. Detail View Error
```javascript
const handleDetailError = (error) => {
  setError('Failed to load encounter details');
  setIsDetailView(false);
};
```

## Performance Optimization

1. History List
   - Pagination
   - Infinite scroll
   - Cached results

2. Detail View
   - Lazy loading
   - Data caching
   - Optimized rendering

## Integration Points

1. Campaign System
   - Campaign filtering
   - Permission checks
   - Context sharing

2. Combat System
   - Encounter references
   - Participant links
   - Action tracking

## Export Features

1. Data Export
```javascript
const exportHistory = async (format) => {
  const response = await fetch(
    `http://localhost:3001/api/combat/history/export?format=${format}`
  );
  const blob = await response.blob();
  downloadFile(blob, `combat_history.${format}`);
};
```

2. Report Generation
```javascript
const generateReport = async (entryId) => {
  const response = await fetch(
    `http://localhost:3001/api/combat/history/${entryId}/report`
  );
  const data = await response.blob();
  downloadFile(data, 'encounter_report.pdf');
};
```

## Development Notes

1. Data Structure
   - Combat records
   - Participant tracking
   - Round management

2. UI/UX Considerations
   - Timeline display
   - Filter interactions
   - Detail navigation

## Testing Considerations

1. Component Tests
   - History display
   - Filter logic
   - Export functionality

2. Integration Tests
   - API integration
   - Campaign context
   - Data consistency 