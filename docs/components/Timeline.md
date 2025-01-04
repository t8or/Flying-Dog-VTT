# Timeline Component Documentation

## Overview

The Timeline component provides a chronological view of campaign events, allowing users to create, edit, and manage campaign milestones and activities.

## Component Location

```
src/components/Timeline.js
```

## Core Features

### Event Management

1. Event Creation
```javascript
const handleAddEvent = async (event) => {
  const response = await fetch('http://localhost:3001/api/timeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  // Event creation logic
};
```

2. Event Editing
```javascript
const handleUpdateEvent = async (eventId, updatedEvent) => {
  const response = await fetch(`http://localhost:3001/api/timeline/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedEvent)
  });
  // Event update logic
};
```

### Timeline Display

1. Event List
```javascript
<div className="timeline-events">
  {events.map(event => (
    <TimelineEvent
      key={event.id}
      event={event}
      onEdit={handleEditEvent}
      onDelete={handleDeleteEvent}
    />
  ))}
</div>
```

2. Event Sorting
```javascript
const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
```

## Component Architecture

### Main Components

1. **TimelineEvent**
   - Event display
   - Edit interface
   - Delete functionality
   - Timestamp management

2. **EventForm**
   - Event creation form
   - Validation
   - Date/time picker
   - Description editor

3. **TimelineControls**
   - Filtering options
   - Sort controls
   - View options

## State Management

### Timeline State
```javascript
const [events, setEvents] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [editingEvent, setEditingEvent] = useState(null);
```

### Form State
```javascript
const [newEvent, setNewEvent] = useState({
  event: '',
  details: '',
  timestamp: Date.now()
});
```

## API Integration

### Event Operations

1. Fetch Events
```javascript
const fetchEvents = async () => {
  const response = await fetch('http://localhost:3001/api/timeline');
  const data = await response.json();
  setEvents(data);
};
```

2. Delete Event
```javascript
const handleDeleteEvent = async (eventId) => {
  await fetch(`http://localhost:3001/api/timeline/${eventId}`, {
    method: 'DELETE'
  });
  // Update UI
};
```

## Event Handling

### User Interactions

1. Event Creation
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  handleAddEvent(newEvent);
};
```

2. Event Editing
```javascript
const handleEdit = (event) => {
  setEditingEvent(event);
  setIsEditing(true);
};
```

## Styling System

### Timeline Layout
```css
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}
```

### Event Styling
```css
.timeline-event {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
```

## Error Handling

1. API Errors
```javascript
try {
  await handleAddEvent(newEvent);
} catch (error) {
  setError('Failed to create event');
}
```

2. Validation
```javascript
const validateEvent = (event) => {
  if (!event.event.trim()) {
    throw new Error('Event title is required');
  }
  // Additional validation
};
```

## Performance Optimization

1. Event List
   - Virtual scrolling for large lists
   - Optimized rendering
   - Cached data

2. Form Handling
   - Debounced updates
   - Optimistic UI updates
   - Efficient validation

## Integration Points

1. Campaign System
   - Campaign-specific events
   - Shared timeline
   - Event synchronization

2. Map Integration
   - Location references
   - Map markers
   - Spatial context

## Development Notes

1. Event Structure
   - Timestamp handling
   - Event categorization
   - Data relationships

2. UI/UX Considerations
   - Chronological display
   - Visual hierarchy
   - Interactive elements 