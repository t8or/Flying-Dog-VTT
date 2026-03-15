-- Combat Sessions
CREATE TABLE IF NOT EXISTS combat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT DEFAULT 'Combat',
  round INTEGER DEFAULT 1,
  active_combatant_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Combat Combatants
CREATE TABLE IF NOT EXISTS combat_combatants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'monster',
  initiative INTEGER DEFAULT 0,
  hp_current INTEGER DEFAULT 0,
  hp_max INTEGER DEFAULT 0,
  ac INTEGER DEFAULT 10,
  conditions TEXT DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES combat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
