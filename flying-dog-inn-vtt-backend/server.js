const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'maps/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Connect to SQLite database
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Middleware
app.use(express.json());

// Directory for storing map images
const mapsDir = path.join(__dirname, 'maps');
if (!fs.existsSync(mapsDir)) {
  fs.mkdirSync(mapsDir);
}

// Basic route
app.get('/', (req, res) => {
  res.send('Flying Dog Inn VTT Backend');
});

// Campaign endpoints
app.get('/api/campaigns', (req, res) => {
  db.all('SELECT * FROM campaigns ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching campaigns:', err);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
    res.json(rows);
  });
});

app.post('/api/campaigns', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Campaign name is required' });
  }

  db.run(
    'INSERT INTO campaigns (name) VALUES (?)',
    [name],
    function(err) {
      if (err) {
        console.error('Error creating campaign:', err);
        return res.status(500).json({ error: 'Failed to create campaign' });
      }
      const campaignId = this.lastID;
      // Log the action
      logAction('CREATE', 'campaign', campaignId, `Campaign "${name}" created`, campaignId);
      res.json({ 
        id: campaignId, 
        name,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      });
    }
  );
});

// Helper function to log actions
function logAction(action_type, entity_type, entity_id, details, campaign_id) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    console.log('Logging action:', { action_type, entity_type, entity_id, details, campaign_id, timestamp });
    
    db.run(
      'INSERT INTO action_logs (action_type, entity_type, entity_id, details, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [action_type, entity_type, entity_id, details, campaign_id, timestamp],
      function(err) {
        if (err) {
          console.error('Error logging action:', err);
          reject(err);
        } else {
          console.log('Action logged successfully, ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}

// Maps Endpoints
app.post('/api/maps', upload.single('image'), (req, res) => {
  console.log('Received map upload request:', { 
    body: req.body, 
    file: req.file,
    campaign_id: req.body.campaign_id 
  });
  
  if (!req.file || !req.body.name || !req.body.campaign_id) {
    console.error('Validation error:', { 
      file: !!req.file, 
      name: !!req.body.name,
      campaign_id: !!req.body.campaign_id 
    });
    return res.status(400).send('Missing file, name, or campaign_id');
  }

  const name = req.body.name;
  const imagePath = req.file.filename;
  const campaignId = parseInt(req.body.campaign_id, 10);

  if (isNaN(campaignId)) {
    console.error('Invalid campaign_id:', req.body.campaign_id);
    return res.status(400).send('Invalid campaign_id');
  }

  console.log('Saving map to database:', { name, imagePath, campaignId });

  // First verify the campaign exists
  db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId], (err, campaign) => {
    if (err) {
      console.error('Error checking campaign:', err);
      return res.status(500).send('Database error');
    }
    if (!campaign) {
      console.error('Campaign not found:', campaignId);
      return res.status(400).send('Invalid campaign_id');
    }

    console.log('Found campaign:', campaign);

    // Get the next position for this campaign
    db.get(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM maps WHERE campaign_id = ?',
      [campaignId],
      (err, row) => {
        if (err) {
          console.error('Error getting next position:', err);
          return res.status(500).send('Database error');
        }

        const position = row ? row.next_position : 0;
        console.log('Using position:', position);

        // Insert the map
        db.run(
          'INSERT INTO maps (name, path, campaign_id, position) VALUES (?, ?, ?, ?)',
          [name, imagePath, campaignId, position],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).send('Error saving map');
            }

            const mapId = this.lastID;
            
            // Fetch the created map to ensure all fields are returned
            db.get('SELECT * FROM maps WHERE id = ?', [mapId], (err, map) => {
              if (err || !map) {
                console.error('Error fetching created map:', err);
                return res.status(500).send('Error retrieving created map');
              }

              console.log('Map saved successfully:', map);
              res.json(map);

              // Log the action
              logAction('CREATE', 'map', mapId, `Map "${name}" created`, campaignId);
            });
          }
        );
      }
    );
  });
});

app.get('/api/maps', (req, res) => {
  const campaignId = req.query.campaign_id;
  
  if (!campaignId) {
    console.error('No campaign_id provided');
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  console.log('Fetching maps for campaign:', campaignId);
  
  const query = 'SELECT * FROM maps WHERE campaign_id = ? ORDER BY position ASC';
  const params = [campaignId];
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error retrieving maps:', err);
      return res.status(500).send('Error retrieving maps');
    }
    console.log('Found maps for campaign', campaignId + ':', rows);
    res.json(rows);
  });
});

app.get('/api/maps/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM maps WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error retrieving map:', err);
      return res.status(500).send('Error retrieving map');
    }
    if (!row) {
      return res.status(404).send('Map not found');
    }
    res.json(row);
  });
});

// Serve map images statically
app.use('/maps', (req, res, next) => {
  console.log('Static file request:', req.url);
  console.log('Full path:', path.join(__dirname, 'maps', req.url));
  next();
}, express.static(path.join(__dirname, 'maps')));

// Timeline Endpoints
app.get('/api/timeline', (req, res) => {
  const campaignId = req.query.campaign_id;
  console.log('Fetching timeline events for campaign:', campaignId);

  if (!campaignId) {
    console.error('No campaign_id provided');
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  const query = 'SELECT * FROM timeline_events WHERE campaign_id = ? ORDER BY timestamp DESC';
  const params = [campaignId];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching timeline events:', err);
      res.status(500).json({ error: 'Failed to fetch timeline events' });
      return;
    }
    console.log('Found timeline events:', rows);
    res.json(rows || []);
  });
});

app.post('/api/timeline', (req, res) => {
  const { event, details, timestamp, campaign_id } = req.body;
  console.log('Received timeline event:', { event, details, timestamp, campaign_id });
  
  if (!event || !timestamp || !campaign_id) {
    console.error('Validation error:', { event: !!event, timestamp: !!timestamp, campaign_id: !!campaign_id });
    return res.status(400).json({ error: 'Event, timestamp, and campaign_id are required' });
  }

  // First verify the campaign exists
  db.get('SELECT * FROM campaigns WHERE id = ?', [campaign_id], async (err, campaign) => {
    if (err) {
      console.error('Error checking campaign:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!campaign) {
      console.error('Campaign not found:', campaign_id);
      return res.status(400).json({ error: 'Invalid campaign_id' });
    }

    console.log('Found campaign:', campaign);

    db.run(
      'INSERT INTO timeline_events (event, details, timestamp, campaign_id) VALUES (?, ?, ?, ?)',
      [event, details || '', timestamp, campaign_id],
      async function(err) {
        if (err) {
          console.error('Error saving timeline event:', err);
          res.status(500).json({ error: 'Failed to save timeline event' });
          return;
        }
        const savedEvent = { 
          id: this.lastID, 
          event, 
          details: details || '', 
          timestamp,
          campaign_id
        };

        try {
          // Log the action
          await logAction('CREATE', 'timeline_event', this.lastID, `Timeline event "${event}" created`, campaign_id);
          console.log('Timeline event logged successfully');
          res.json(savedEvent);
        } catch (logError) {
          console.error('Error logging timeline event:', logError);
          // Still return success since the event was saved
          res.json(savedEvent);
        }
      }
    );
  });
});

app.put('/api/timeline/:id', (req, res) => {
  const { event, details, timestamp } = req.body;
  const { id } = req.params;
  const campaignId = req.body.campaign_id;

  if (!campaignId) {
    console.error('No campaign_id provided');
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  db.run(
    'UPDATE timeline_events SET event = ?, details = ?, timestamp = ? WHERE id = ? AND campaign_id = ?', 
    [event, details, timestamp, id, campaignId], 
    function(err) {
      if (err) {
        console.error('Error updating timeline event:', err);
        return res.status(500).json({ error: 'Failed to update event' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found or unauthorized' });
      }

      // Log the action
      logAction('UPDATE', 'timeline_event', id, `Timeline event "${event}" updated`, campaignId);

      res.json({ id, event, details, timestamp, campaign_id: campaignId });
    }
  );
});

app.delete('/api/timeline/:id', (req, res) => {
  const { id } = req.params;
  const campaignId = req.query.campaign_id;

  if (!campaignId) {
    console.error('No campaign_id provided');
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  db.run('DELETE FROM timeline_events WHERE id = ? AND campaign_id = ?', [id, campaignId], function(err) {
    if (err) {
      console.error('Error deleting timeline event:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    // Log the action
    logAction('DELETE', 'timeline_event', id, `Timeline event deleted`, campaignId);

    res.json({ success: true });
  });
});

// History Endpoint
app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM history', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving history');
    }
    res.json(rows);
  });
});

// Endpoint to rename a map
app.put('/api/maps/:id/rename', async (req, res) => {
  const { id } = req.params;
  const { name, campaign_id } = req.body;

  if (!name || !name.trim() || !campaign_id) {
    return res.status(400).json({ error: 'Name and campaign_id are required' });
  }

  try {
    await db.run('UPDATE maps SET name = ? WHERE id = ? AND campaign_id = ?', [name.trim(), id, campaign_id]);
    // Log the action
    logAction('UPDATE', 'map', id, `Map renamed to "${name.trim()}"`, campaign_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error renaming map:', error);
    res.status(500).json({ error: 'Failed to rename map' });
  }
});

// Endpoint to delete a map
app.delete('/api/maps/:id', (req, res) => {
  const { id } = req.params;
  const { campaign_id } = req.query;

  if (!campaign_id) {
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  // First get the map details
  db.get('SELECT * FROM maps WHERE id = ? AND campaign_id = ?', [id, campaign_id], (err, map) => {
    if (err) {
      console.error('Error finding map:', err);
      return res.status(500).json({ error: 'Failed to delete map' });
    }
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }

    // Delete associated markers first
    db.run('DELETE FROM markers WHERE map_id = ? AND campaign_id = ?', [id, campaign_id], (markerErr) => {
      if (markerErr) {
        console.error('Error deleting markers:', markerErr);
        // Continue with map deletion even if marker deletion fails
      }

      // Delete the image file
      const imagePath = path.join(__dirname, 'maps', map.path);
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
          // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        db.run('DELETE FROM maps WHERE id = ? AND campaign_id = ?', [id, campaign_id], (deleteErr) => {
          if (deleteErr) {
            console.error('Error deleting from database:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete map' });
          }
          // Log the action
          logAction('DELETE', 'map', id, `Map "${map.name}" deleted`, campaign_id);
          res.json({ success: true });
        });
      });
    });
  });
});

// Markers Endpoints
app.get('/api/maps/:mapId/markers', (req, res) => {
  const { mapId } = req.params;
  const { campaign_id } = req.query;

  console.log('GET /api/maps/:mapId/markers', { mapId, campaign_id });

  if (!campaign_id) {
    console.error('Missing campaign_id');
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  // First verify the map exists and belongs to the campaign
  db.get('SELECT * FROM maps WHERE id = ? AND campaign_id = ?', [mapId, campaign_id], (err, map) => {
    if (err) {
      console.error('Error finding map:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!map) {
      console.error('Map not found or unauthorized:', { mapId, campaign_id });
      return res.status(404).json({ error: 'Map not found or unauthorized' });
    }

    console.log('Found map:', map);

    // Get all markers for this map
    db.all('SELECT * FROM markers WHERE map_id = ? AND campaign_id = ?', [mapId, campaign_id], (err, markers) => {
      if (err) {
        console.error('Error fetching markers:', err);
        return res.status(500).json({ error: 'Failed to fetch markers' });
      }
      console.log('Found markers:', markers);
      res.json(markers || []);
    });
  });
});

app.post('/api/maps/:mapId/markers', (req, res) => {
  const { mapId } = req.params;
  const { lat, lng, label, description, color, shape, campaign_id } = req.body;
  
  if (!lat || !lng || !campaign_id) {
    return res.status(400).json({ error: 'lat, lng, and campaign_id are required' });
  }

  // First verify the map exists and belongs to the campaign
  db.get('SELECT * FROM maps WHERE id = ? AND campaign_id = ?', [mapId, campaign_id], (err, map) => {
    if (err) {
      console.error('Error finding map:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!map) {
      console.error('Map not found or unauthorized:', { mapId, campaign_id });
      return res.status(404).json({ error: 'Map not found or unauthorized' });
    }

    const stmt = db.prepare(
      'INSERT INTO markers (map_id, lat, lng, label, description, color, shape, campaign_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    try {
      const result = stmt.run(
        mapId,
        lat,
        lng,
        label || '',
        description || '',
        color || '#FF0000',
        shape || 'default',
        campaign_id
      );

      const newMarker = {
        id: result.lastInsertRowid,
        map_id: mapId,
        lat,
        lng,
        label: label || '',
        description: description || '',
        color: color || '#FF0000',
        shape: shape || 'default',
        campaign_id
      };

      // Log the action with map name context
      logAction(
        'CREATE', 
        'marker', 
        result.lastInsertRowid, 
        `Marker "${label || 'Unnamed'}" created on map "${map.name}"`, 
        campaign_id
      );

      res.json(newMarker);
    } catch (error) {
      console.error('Error creating marker:', error);
      return res.status(500).json({ error: 'Failed to create marker' });
    }
  });
});

app.put('/api/maps/:mapId/markers/:id', (req, res) => {
  const { mapId, id } = req.params;
  const { lat, lng, label, description, color, shape, campaign_id } = req.body;

  if (!campaign_id) {
    return res.status(400).send('campaign_id is required');
  }

  // First get the map name for the log message
  db.get('SELECT name FROM maps WHERE id = ?', [mapId], (err, map) => {
    if (err || !map) {
      console.error('Error finding map:', err);
      return res.status(500).json({ error: 'Failed to update marker' });
    }

    db.run(
      'UPDATE markers SET lat = ?, lng = ?, label = ?, description = ?, color = ?, shape = ? WHERE id = ? AND map_id = ? AND campaign_id = ?',
      [lat, lng, label || '', description || '', color || '#FF0000', shape || 'default', id, mapId, campaign_id],
      function(err) {
        if (err) {
          console.error('Error updating marker:', err);
          return res.status(500).json({ error: 'Failed to update marker' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Marker not found or unauthorized' });
        }

        // Log the action with map name context
        logAction(
          'UPDATE', 
          'marker', 
          id, 
          `Marker "${label || 'Unnamed'}" updated on map "${map.name}"`, 
          campaign_id
        );

        res.json({ id: parseInt(id), map_id: mapId, lat, lng, label, description, color, shape, campaign_id });
      }
    );
  });
});

app.delete('/api/maps/:mapId/markers/:id', (req, res) => {
  const { mapId, id } = req.params;
  const { campaign_id } = req.query;

  if (!campaign_id) {
    return res.status(400).send('campaign_id is required');
  }

  // First get the marker and map details for the log message
  db.get(
    `SELECT m.label, maps.name as map_name 
     FROM markers m 
     JOIN maps ON m.map_id = maps.id 
     WHERE m.id = ? AND m.map_id = ?`, 
    [id, mapId], 
    (err, data) => {
      if (err) {
        console.error('Error finding marker:', err);
        return res.status(500).json({ error: 'Failed to delete marker' });
      }

      db.run(
        'DELETE FROM markers WHERE id = ? AND map_id = ? AND campaign_id = ?',
        [id, mapId, campaign_id],
        function(err) {
          if (err) {
            console.error('Error deleting marker:', err);
            return res.status(500).json({ error: 'Failed to delete marker' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Marker not found or unauthorized' });
          }

          // Log the action with marker and map name context
          logAction(
            'DELETE', 
            'marker', 
            id, 
            `Marker "${data?.label || 'Unnamed'}" deleted from map "${data?.map_name || 'Unknown'}"`, 
            campaign_id
          );

          res.json({ message: 'Marker deleted successfully' });
        }
      );
    }
  );
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Add endpoint to add dummy logs
app.post('/api/logs/seed', async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Add dummy logs
    await logAction('CREATE', 'map', 1, 'Map "Dwarven Stronghold" created', 1);
    await logAction('CREATE', 'marker', 1, 'Marker "Secret Entrance" added to map 1', 1);
    await logAction('UPDATE', 'timeline_event', 1, 'Timeline event "Party discovers ancient artifact" updated', 1);
    await logAction('CREATE', 'map', 2, 'Map "Frozen Cave" created', 1);
    await logAction('DELETE', 'marker', 2, 'Marker "Hidden Treasure" deleted from map 2', 1);
    
    res.json({ success: true, message: 'Added dummy logs' });
  } catch (error) {
    console.error('Error adding dummy logs:', error);
    res.status(500).json({ error: 'Failed to add dummy logs' });
  }
});

// Action logs endpoint
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const campaignId = req.query.campaign_id;
  
  if (!campaignId) {
    return res.status(400).json({ error: 'campaign_id is required' });
  }

  // First verify the campaign exists
  db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId], (err, campaign) => {
    if (err) {
      console.error('Error checking campaign:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const query = `SELECT * FROM action_logs WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const params = [campaignId, limit, offset];
    
    console.log('Executing logs query:', query, 'with params:', params);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching action logs:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        return res.status(500).json({ error: 'Failed to fetch action logs', details: err.message });
      }
      console.log('Successfully fetched logs for campaign', campaignId + ':', rows);
      res.json(rows || []);
    });
  });
});

// Add endpoint to reorder maps
app.put('/api/maps/reorder', (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    try {
      // Update positions for all maps in the order
      orderedIds.forEach((id, index) => {
        db.run('UPDATE maps SET position = ? WHERE id = ?', [index, id]);
      });

      db.run('COMMIT');
      // Log the action
      logAction('REORDER', 'map', null, `Maps reordered`, null);
      res.json({ success: true });
    } catch (err) {
      db.run('ROLLBACK');
      console.error('Error reordering maps:', err);
      res.status(500).json({ error: 'Failed to reorder maps' });
    }
  });
});

// Campaign endpoints
app.get('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  console.log('Fetching campaign by ID:', id);
  
  db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching campaign:', err);
      return res.status(500).json({ error: 'Failed to fetch campaign' });
    }
    if (!row) {
      console.log('Campaign not found:', id);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    console.log('Found campaign:', row);
    res.json(row);
  });
});

app.put('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Campaign name is required' });
  }

  db.run(
    'UPDATE campaigns SET name = ?, updated_at = strftime("%s", "now") WHERE id = ?',
    [name, id],
    function(err) {
      if (err) {
        console.error('Error updating campaign:', err);
        return res.status(500).json({ error: 'Failed to update campaign' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      // Log the action
      logAction('UPDATE', 'campaign', id, `Campaign renamed to "${name}"`, id);
      res.json({ id: parseInt(id), name });
    }
  );
});

app.delete('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the campaign name for logging
  db.get('SELECT name FROM campaigns WHERE id = ?', [id], (err, campaign) => {
    if (err || !campaign) {
      console.error('Error finding campaign:', err);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Delete associated records
      const tables = ['maps', 'markers', 'timeline_events'];
      let completed = 0;
      
      tables.forEach(table => {
        db.run(`DELETE FROM ${table} WHERE campaign_id = ?`, [id], (err) => {
          if (err) {
            console.error(`Error deleting from ${table}:`, err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: `Failed to delete from ${table}` });
          }
          
          completed++;
          if (completed === tables.length) {
            // All associated records deleted, now delete the campaign
            db.run('DELETE FROM campaigns WHERE id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error deleting campaign:', err);
                return res.status(500).json({ error: 'Failed to delete campaign' });
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Campaign not found' });
              }
              
              db.run('COMMIT');
              // Log the action
              logAction('DELETE', 'campaign', id, `Campaign "${campaign.name}" deleted`, null);
              res.json({ success: true });
            });
          }
        });
      });
    });
  });
});

// Combat Loot Endpoints
app.post('/api/combat/loot', express.json(), (req, res) => {
  const { combat_name, loot_description, gold_pieces, silver_pieces, copper_pieces, date, campaign_id } = req.body;
  
  const sql = `
    INSERT INTO combat_loot (combat_name, loot_description, gold_pieces, silver_pieces, copper_pieces, date, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [combat_name, loot_description, gold_pieces || 0, silver_pieces || 0, copper_pieces || 0, date, campaign_id], function(err) {
    if (err) {
      console.error('Error creating combat loot:', err);
      res.status(500).json({ error: 'Failed to create combat loot entry' });
      return;
    }
    
    res.status(201).json({ id: this.lastID });
  });
});

app.get('/api/combat/loot/:campaignId', (req, res) => {
  const campaignId = req.params.campaignId;
  
  const sql = `
    SELECT * FROM combat_loot
    WHERE campaign_id = ?
    ORDER BY date DESC, created_at DESC
  `;
  
  db.all(sql, [campaignId], (err, rows) => {
    if (err) {
      console.error('Error fetching combat loot:', err);
      res.status(500).json({ error: 'Failed to fetch combat loot entries' });
      return;
    }
    
    res.json(rows);
  });
});

app.put('/api/combat/loot/:id', express.json(), (req, res) => {
  const { combat_name, loot_description, gold_pieces, silver_pieces, copper_pieces, date } = req.body;
  const id = req.params.id;
  
  const sql = `
    UPDATE combat_loot
    SET combat_name = ?,
        loot_description = ?,
        gold_pieces = ?,
        silver_pieces = ?,
        copper_pieces = ?,
        date = ?,
        updated_at = strftime('%s', 'now')
    WHERE id = ?
  `;
  
  db.run(sql, [combat_name, loot_description, gold_pieces || 0, silver_pieces || 0, copper_pieces || 0, date, id], function(err) {
    if (err) {
      console.error('Error updating combat loot:', err);
      res.status(500).json({ error: 'Failed to update combat loot entry' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Combat loot entry not found' });
      return;
    }
    
    res.json({ success: true });
  });
});

app.delete('/api/combat/loot/:id', (req, res) => {
  const id = req.params.id;
  
  const sql = 'DELETE FROM combat_loot WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting combat loot:', err);
      res.status(500).json({ error: 'Failed to delete combat loot entry' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Combat loot entry not found' });
      return;
    }
    
    res.json({ success: true });
  });
});

// Export timeline events for a campaign
app.get('/api/timeline/export/:campaign_id', async (req, res) => {
  try {
    const campaignId = req.params.campaign_id;
    const events = await db.all(
      `SELECT * FROM timeline_events WHERE campaign_id = ? ORDER BY timestamp DESC`,
      [campaignId]
    );
    
    // Format the data for export
    const formattedEvents = events.map(event => ({
      ...event,
      date: new Date(parseInt(event.timestamp)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Error exporting timeline events:', error);
    res.status(500).json({ error: 'Failed to export timeline events' });
  }
});

// Export all campaign data
app.get('/api/campaign/export/:campaign_id', async (req, res) => {
  try {
    const campaignId = req.params.campaign_id;
    
    // Get campaign info
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get all related data
    const [timeline_events, maps, markers, combat_loot] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM timeline_events WHERE campaign_id = ? ORDER BY timestamp DESC', [campaignId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM maps WHERE campaign_id = ? ORDER BY position', [campaignId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM markers WHERE campaign_id = ?', [campaignId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM combat_loot WHERE campaign_id = ? ORDER BY date DESC', [campaignId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      })
    ]);

    // Format dates and timestamps
    const formattedData = {
      campaign: {
        ...campaign,
        created_at: new Date(campaign.created_at * 1000).toISOString(),
        updated_at: new Date(campaign.updated_at * 1000).toISOString()
      },
      timeline_events: timeline_events.map(event => ({
        ...event,
        date: new Date(parseInt(event.timestamp)).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        created_at: new Date(event.created_at * 1000).toISOString(),
        updated_at: new Date(event.updated_at * 1000).toISOString()
      })),
      maps: maps.map(map => ({
        ...map,
        created_at: new Date(map.created_at * 1000).toISOString(),
        updated_at: new Date(map.updated_at * 1000).toISOString()
      })),
      markers: markers.map(marker => ({
        ...marker,
        created_at: new Date(marker.created_at * 1000).toISOString(),
        updated_at: new Date(marker.updated_at * 1000).toISOString()
      })),
      combat_loot: combat_loot.map(loot => ({
        ...loot,
        created_at: new Date(loot.created_at * 1000).toISOString(),
        updated_at: new Date(loot.updated_at * 1000).toISOString()
      }))
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Error exporting campaign data:', error);
    res.status(500).json({ error: 'Failed to export campaign data' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
}); 