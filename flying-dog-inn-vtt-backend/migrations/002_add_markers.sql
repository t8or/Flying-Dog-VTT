-- Markers table
DROP TABLE IF EXISTS markers;
CREATE TABLE markers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  label TEXT,
  description TEXT,
  color TEXT DEFAULT '#FF0000',
  shape TEXT DEFAULT 'default',
  campaign_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (map_id) REFERENCES maps(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
); 