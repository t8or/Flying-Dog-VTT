# Loot x Timeline Integration

## Overview
This document describes the integration between Loot History entries and Timeline events, allowing for seamless display of loot items within the timeline interface.

## Features Implemented

### 1. Mini Loot Cards
- Created `MiniLootCard` component for compact horizontal display
- Shows combat name, loot description (truncated to 2 lines), and currency values
- Styled with gold/parchment theme to match D&D aesthetic
- Dimensions: 200px width with responsive padding and borders

### 2. Date-Based Matching
- Loot entries are automatically matched to Timeline entries by date
- Uses ISO date format (YYYY-MM-DD) for precise matching
- Multiple loot entries can be associated with a single timeline entry
- Timeline entries can exist without loot, and vice versa

### 3. Blank Timeline Entries
- Automatically creates blank timeline entries for dates that have loot but no timeline event
- Blank entries are visually distinct with:
  - Dashed gold border
  - Subtle gradient background (#FFFBF5 to #FFF9E6)
  - Date stamp shown in the loot section header
  - No timeline event title or details shown

### 4. Horizontal Swimlane Display
- Loot cards are displayed in a horizontal scrollable container at the bottom of each timeline card
- Swimlane is separated from timeline content with a subtle border
- "LOOT HISTORY" label identifies the section
- Smooth horizontal scrolling for multiple loot entries
- 12px gap between loot cards for visual clarity

## Technical Implementation

### Data Flow
1. **Fetching Data**: Timeline component now fetches both timeline events and loot entries on campaign change
2. **Merging Logic**: `getMergedTimelineData()` function handles:
   - Creating date-indexed maps for both timeline and loot data
   - Identifying dates with loot but no timeline entry
   - Generating blank timeline entries as needed
   - Attaching loot arrays to timeline events
3. **Rendering**: Timeline events are grouped by month and rendered with their associated loot swimlanes

### Component Structure
```
Timeline
├── EventForm (for creating/editing events)
├── MiniLootCard (for displaying loot in swimlane)
│   ├── Combat Name
│   ├── Loot Description (truncated)
│   └── Currency Display (GP/SP/CP)
├── TimelineNavigation (sidebar navigation)
└── Timeline Events (main content)
    ├── Event Header (title + menu)
    ├── Event Details
    ├── Event Date
    └── Loot Swimlane (if loot exists)
        ├── Section Label
        └── Horizontal Loot Card List
```

### Key Functions

#### `fetchLootEntries()`
- Fetches all loot entries for the selected campaign
- Endpoint: `GET /api/combat/loot/:campaignId`
- Stores in `lootEntries` state

#### `getMergedTimelineData()`
- Returns object with dates as keys
- Each date contains array of timeline events with attached loot
- Creates blank timeline entries when needed
- Example output structure:
```javascript
{
  "2025-01-15": [{
    id: "event-123",
    event: "Dragon Battle",
    details: "...",
    timestamp: 1736899200000,
    loot: [
      { id: 1, combat_name: "Dragon Hoard", gold_pieces: 500, ... },
      { id: 2, combat_name: "Dragon Scales", gold_pieces: 100, ... }
    ]
  }],
  "2025-01-16": [{
    id: "blank-2025-01-16",
    event: "",
    details: "",
    timestamp: 1736985600000,
    isBlank: true,
    loot: [
      { id: 3, combat_name: "Goblin Treasure", gold_pieces: 50, ... }
    ]
  }]
}
```

## Visual Design

### Color Scheme
- **Loot Cards**: Cream/gold gradient (#FFF9E6 to #F5E6D3)
- **Blank Timeline**: Light cream gradient (#FFFBF5 to #FFF9E6)
- **Borders**: Gold (#D4AF37)
- **Text**: Brown tones (#8B4513, #6B5B4E)

### Typography
- **Section Label**: 12px, uppercase, 600 weight, letter-spacing 0.05em
- **Combat Name**: 13px, 600 weight
- **Description**: 11px, line-height 1.4
- **Currency**: 11px, 600 weight, color-coded by type

### Interactions
- Horizontal scroll for multiple loot cards
- Hover effects on loot cards (planned for future enhancement)
- Blank timeline entries are non-editable
- Regular timeline entries with loot remain fully editable

## Future Enhancements
- Click on loot card to open full loot details/edit modal
- Drag-and-drop to reassociate loot with different timeline entries
- Visual indicators for high-value loot entries
- Quick-add loot button directly from timeline entry
- Filter/search within loot swimlane
- Export timeline with associated loot data

## Files Modified
- `/flying-dog-inn-vtt-frontend/src/components/Timeline.js`
  - Added `MiniLootCard` component
  - Added `fetchLootEntries()` function
  - Added `getMergedTimelineData()` function
  - Updated rendering logic to display loot swimlanes
  - Added CSS styles for blank timeline entries

## Database Schema
No database changes were required. Existing tables:
- `timeline_events`: id, event, details, timestamp, campaign_id
- `combat_loot`: id, combat_name, loot_description, gold_pieces, silver_pieces, copper_pieces, date, campaign_id

## Testing Checklist
- [x] Timeline displays without loot entries
- [x] Timeline displays with loot entries on matching dates
- [x] Blank timeline entries created for loot-only dates
- [x] Multiple loot entries display in horizontal swimlane
- [x] Loot cards display all currency types correctly
- [x] Blank timeline entries have distinct visual styling
- [x] Timeline navigation sidebar works with merged data
- [x] Edit/delete functionality preserved for regular timeline entries
- [x] Campaign switching clears and reloads both timeline and loot data

## Notes
- Loot entries use `date` field (YYYY-MM-DD format)
- Timeline events use `timestamp` field (Unix milliseconds)
- Date comparison converts timestamp to ISO date for matching
- Blank timeline entries use synthetic IDs: `blank-{date}`
- Loot description is truncated using CSS (-webkit-line-clamp)

