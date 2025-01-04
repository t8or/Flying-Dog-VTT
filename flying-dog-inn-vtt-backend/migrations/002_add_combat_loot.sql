-- Combat Loot
DROP TABLE IF EXISTS combat_loot;
CREATE TABLE combat_loot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combat_name TEXT NOT NULL,
  loot_description TEXT,
  gold_pieces INTEGER DEFAULT 0,
  silver_pieces INTEGER DEFAULT 0,
  copper_pieces INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  campaign_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
); 