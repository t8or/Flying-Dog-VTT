# Sidebar Component Documentation

## Overview

The Sidebar component serves as the main navigation interface, providing access to campaigns, maps, and system features while displaying real-time connection status.

## Component Location

```
src/components/Sidebar.js
```

## Core Features

### Navigation Management

1. Navigation Structure
```javascript
interface NavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  requiresCampaign: boolean;
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/', requiresCampaign: false },
  { id: 'maps', label: 'Maps', icon: <MapIcon />, path: '/maps', requiresCampaign: true },
  { id: 'combat', label: 'Combat', icon: <SwordIcon />, path: '/combat', requiresCampaign: true },
  { id: 'timeline', label: 'Timeline', icon: <TimelineIcon />, path: '/timeline', requiresCampaign: true },
  { id: 'log', label: 'Activity Log', icon: <LogIcon />, path: '/log', requiresCampaign: true }
];
```

2. Campaign Selection
```javascript
<div className="campaign-selector">
  <Select
    value={selectedCampaign}
    onChange={handleCampaignChange}
    options={campaigns}
    placeholder="Select Campaign"
  />
</div>
```

## Component Architecture

### Main Components

1. **Navigation Menu**
   - Route links
   - Active state
   - Icon display
   - Permission checks

2. **Campaign Manager**
   - Campaign selection
   - Campaign creation
   - Quick actions
   - Status display

3. **Connection Status**
   - Server status
   - WebSocket state
   - Sync indicator
   - Error display

## State Management

### Navigation State
```javascript
const [selectedItem, setSelectedItem] = useState('home');
const [campaigns, setCampaigns] = useState([]);
const [selectedCampaign, setSelectedCampaign] = useState(null);
const [isConnected, setIsConnected] = useState(true);
```

### UI State
```javascript
const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
const [error, setError] = useState(null);
```

## API Integration

### Campaign Operations

1. Fetch Campaigns
```javascript
const fetchCampaigns = async () => {
  const response = await fetch('http://localhost:3001/api/campaigns');
  const data = await response.json();
  setCampaigns(data);
};
```

2. Create Campaign
```javascript
const createCampaign = async (campaignData) => {
  const response = await fetch('http://localhost:3001/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData)
  });
  const data = await response.json();
  setCampaigns(prev => [...prev, data]);
};
```

## Event Handling

### Navigation Events

1. Route Change
```javascript
const handleNavigation = (item) => {
  setSelectedItem(item.id);
  if (item.requiresCampaign && !selectedCampaign) {
    setError('Please select a campaign first');
    return;
  }
  navigate(item.path);
};
```

2. Campaign Selection
```javascript
const handleCampaignChange = (campaign) => {
  setSelectedCampaign(campaign);
  localStorage.setItem('lastCampaign', campaign.id);
};
```

## Styling System

### Sidebar Layout
```css
.sidebar {
  width: 280px;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
```

### Navigation Styling
```css
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.1);
}
```

## Error Handling

1. Connection Errors
```javascript
const handleConnectionError = () => {
  setIsConnected(false);
  setError('Lost connection to server');
};
```

2. Campaign Errors
```javascript
const handleCampaignError = (error) => {
  setError('Failed to load campaigns: ' + error.message);
  setCampaigns([]);
};
```

## Performance Optimization

1. Navigation
   - Memoized routes
   - Cached campaign data
   - Optimized renders

2. State Updates
   - Debounced changes
   - Selective updates
   - Context optimization

## Integration Points

1. Router Integration
   - Route management
   - Navigation guards
   - History handling

2. Campaign Context
   - Global campaign state
   - Permission checks
   - Data synchronization

## Real-time Features

1. Connection Status
```javascript
useEffect(() => {
  const socket = io('http://localhost:3001');
  socket.on('connect', () => setIsConnected(true));
  socket.on('disconnect', () => setIsConnected(false));
  return () => socket.disconnect();
}, []);
```

2. Campaign Updates
```javascript
const handleCampaignUpdate = (update) => {
  setCampaigns(prev => 
    prev.map(camp => 
      camp.id === update.id ? { ...camp, ...update } : camp
    )
  );
};
```

## Development Notes

1. Navigation Logic
   - Route protection
   - Permission handling
   - State persistence

2. UI/UX Considerations
   - Responsive design
   - Accessibility
   - Visual feedback

## Testing Considerations

1. Component Tests
   - Navigation flow
   - Campaign selection
   - Error states

2. Integration Tests
   - Router integration
   - WebSocket connection
   - Campaign management 