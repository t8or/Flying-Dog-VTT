-- Action logs table for tracking all user actions
DROP TABLE IF EXISTS action_logs;
CREATE TABLE action_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  description TEXT NOT NULL,
  campaign_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  details TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);