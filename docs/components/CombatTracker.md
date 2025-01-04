# CombatTracker Component Documentation

## Overview

The CombatTracker component manages active combat encounters, handling initiative order, turn management, and combat statistics in real-time.

## Component Location

```
src/components/CombatTracker.js
```

## Core Features

### Combat Management

1. Participant Structure
```javascript
interface Combatant {
  id: number;
  name: string;
  initiative: number;
  hp: number;
  max_hp: number;
  ac: number;
  status_effects: StatusEffect[];
  type: 'player' | 'npc' | 'monster';
  conditions: string[];
}
```

2. Combat Display
```javascript
<div className="combat-tracker">
  <InitiativeOrder
    combatants={sortedCombatants}
    currentTurn={currentTurn}
    onNextTurn={handleNextTurn}
  />
  <CombatControls
    onAddCombatant={handleAddCombatant}
    onEndCombat={handleEndCombat}
  />
</div>
```

## Component Architecture

### Main Components

1. **InitiativeOrder**
   - Turn order display
   - Current turn indicator
   - Initiative management
   - Quick stats display

2. **CombatantCard**
   - HP tracking
   - Status effects
   - Action management
   - Condition tracking

3. **CombatControls**
   - Turn management
   - Round tracking
   - Combat flow
   - Quick actions

4. **StatisticsPanel**
   - Damage tracking
   - Healing summary
   - Round statistics
   - Combat duration

## State Management

### Combat State
```javascript
const [combatants, setCombatants] = useState([]);
const [currentTurn, setCurrentTurn] = useState(0);
const [round, setRound] = useState(1);
const [isActive, setIsActive] = useState(false);
const [combatLog, setCombatLog] = useState([]);
```

### Combatant State
```javascript
const [selectedCombatant, setSelectedCombatant] = useState(null);
const [editMode, setEditMode] = useState(false);
const [statusEffects, setStatusEffects] = useState([]);
```

## API Integration

### Combat Operations

1. Start Combat
```javascript
const startCombat = async () => {
  const response = await fetch('http://localhost:3001/api/combat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      combatants,
      campaign_id: currentCampaign.id
    })
  });
  const data = await response.json();
  setIsActive(true);
  setCombatId(data.id);
};
```

2. Update Combatant
```javascript
const updateCombatant = async (combatantId, updates) => {
  const response = await fetch(
    `http://localhost:3001/api/combat/combatant/${combatantId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }
  );
  const data = await response.json();
  updateCombatantState(data);
};
```

## Event Handling

### Combat Flow

1. Turn Management
```javascript
const handleNextTurn = () => {
  setCurrentTurn(prev => (prev + 1) % combatants.length);
  if (currentTurn === combatants.length - 1) {
    setRound(prev => prev + 1);
  }
  checkStatusEffects();
};
```

2. Damage Handling
```javascript
const handleDamage = (combatantId, amount) => {
  const combatant = combatants.find(c => c.id === combatantId);
  const newHp = Math.max(0, combatant.hp - amount);
  updateCombatant(combatantId, { hp: newHp });
  logAction('damage', { target: combatant.name, amount });
};
```

## Styling System

### Combat Layout
```css
.combat-tracker {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 20px;
  height: 100%;
}
```

### Combatant Styling
```css
.combatant-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.combatant-card.active {
  box-shadow: 0 0 0 2px #4CAF50;
}
```

## Error Handling

1. Combat Errors
```javascript
const handleCombatError = (error) => {
  setError('Combat system error: ' + error.message);
  logAction('error', { message: error.message });
};
```

2. State Recovery
```javascript
const recoverCombatState = async () => {
  const savedState = await fetch(
    `http://localhost:3001/api/combat/${combatId}/state`
  );
  const data = await savedState.json();
  restoreCombatState(data);
};
```

## Performance Optimization

1. Combat Updates
   - Optimistic UI updates
   - Batched state updates
   - Memoized calculations

2. Real-time Features
   - WebSocket integration
   - State synchronization
   - Efficient updates

## Integration Points

1. Map Integration
   - Position tracking
   - Movement visualization
   - Range calculations

2. Character System
   - Character imports
   - Stat synchronization
   - Ability integration

## Real-time Features

1. WebSocket Updates
```javascript
useEffect(() => {
  const socket = io('http://localhost:3001');
  socket.on('combatUpdate', handleCombatUpdate);
  socket.on('turnChange', handleTurnChange);
  return () => socket.disconnect();
}, []);
```

2. State Sync
```javascript
const syncCombatState = (update) => {
  setCombatants(update.combatants);
  setCurrentTurn(update.currentTurn);
  setRound(update.round);
};
```

## Development Notes

1. Combat Logic
   - Initiative handling
   - Turn resolution
   - Status management

2. UI/UX Considerations
   - Turn indicators
   - Health visualization
   - Action feedback

## Testing Considerations

1. Component Tests
   - Combat flow
   - State management
   - Error handling

2. Integration Tests
   - API integration
   - WebSocket sync
   - State persistence 