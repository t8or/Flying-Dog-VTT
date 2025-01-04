-- Timeline Events
DROP TABLE IF EXISTS timeline_events;
CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  details TEXT,
  timestamp INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
); 