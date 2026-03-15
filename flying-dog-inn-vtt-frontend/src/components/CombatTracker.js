import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCampaign } from '../contexts/CampaignContext';
import { useSocket } from '../contexts/SocketContext';
import AddCombatantDialog from './AddCombatantDialog';
import './CombatTracker.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3334/api';

const CONDITION_COLORS = {
  Poisoned: '#22c55e',
  Prone: '#eab308',
  Stunned: '#f97316',
  Blinded: '#9ca3af',
  Frightened: '#a855f7',
  Incapacitated: '#ef4444',
  Concentration: '#3b82f6',
  Dead: '#1f2937',
};

const ALL_CONDITIONS = Object.keys(CONDITION_COLORS);

export default function CombatTracker() {
  const { selectedCampaign } = useCampaign();
  const { socket } = useSocket();

  const [session, setSession] = useState(null);
  const [combatants, setCombatants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState('monster');
  const [editingCombatant, setEditingCombatant] = useState(null);
  const [damageInputs, setDamageInputs] = useState({});
  const [sessionNameEdit, setSessionNameEdit] = useState(false);
  const [sessionNameValue, setSessionNameValue] = useState('');
  const sessionNameRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    if (!selectedCampaign) return;
    try {
      const res = await fetch(`${API_BASE}/combat/session/${selectedCampaign.id}`);
      const data = await res.json();
      setSession(data);
      if (data) {
        setSessionNameValue(data.name);
        await fetchCombatants(data.id);
      } else {
        setCombatants([]);
      }
    } catch (err) {
      console.error('Failed to fetch combat session', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  const fetchCombatants = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/combat/combatants/${sessionId}`);
      const data = await res.json();
      setCombatants(Array.isArray(data) ? data.map(parseCombatant) : []);
    } catch (err) {
      console.error('Failed to fetch combatants', err);
    }
  };

  const parseCombatant = (c) => ({
    ...c,
    conditions: typeof c.conditions === 'string' ? JSON.parse(c.conditions) : (c.conditions || []),
  });

  useEffect(() => {
    setLoading(true);
    fetchSession();
  }, [fetchSession]);

  // ── Socket.io real-time sync ───────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = ({ type, data }) => {
      if (type === 'session-created' || type === 'session-updated') {
        setSession(data);
        setSessionNameValue(data.name);
      } else if (type === 'session-deleted') {
        setSession(null);
        setCombatants([]);
      } else if (type === 'combatant-added') {
        setCombatants((prev) => {
          const updated = [...prev, parseCombatant(data)];
          return sortCombatants(updated);
        });
      } else if (type === 'combatant-updated') {
        setCombatants((prev) => {
          const updated = prev.map((c) => c.id === data.id ? parseCombatant(data) : c);
          return sortCombatants(updated);
        });
      } else if (type === 'combatant-removed') {
        setCombatants((prev) => prev.filter((c) => c.id !== parseInt(data.id)));
      }
    };
    socket.on('combat-update', handler);
    return () => socket.off('combat-update', handler);
  }, [socket]);

  const sortCombatants = (list) =>
    [...list].sort((a, b) => b.initiative - a.initiative || a.id - b.id);

  // ── Session actions ────────────────────────────────────────
  const startCombat = async () => {
    if (!selectedCampaign) return;
    const res = await fetch(`${API_BASE}/combat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: selectedCampaign.id, name: 'Combat' }),
    });
    const data = await res.json();
    setSession(data);
    setSessionNameValue(data.name);
    setCombatants([]);
  };

  const endCombat = async () => {
    if (!session) return;
    if (!window.confirm('End this combat? All combatants will be removed.')) return;
    await fetch(`${API_BASE}/combat/session/${session.id}`, { method: 'DELETE' });
    setSession(null);
    setCombatants([]);
  };

  const updateSession = async (patch) => {
    if (!session) return;
    const res = await fetch(`${API_BASE}/combat/session/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSession(data);
  };

  const nextTurn = async () => {
    if (!session || combatants.length === 0) return;
    const living = combatants.filter((c) => c.hp_current > 0 || c.hp_max === 0);
    if (living.length === 0) return;

    let nextIndex = session.active_combatant_index + 1;
    let round = session.round;
    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      round = round + 1;
    }
    // Skip dead combatants
    let attempts = 0;
    while (combatants[nextIndex]?.hp_current === 0 && combatants[nextIndex]?.hp_max > 0 && attempts < combatants.length) {
      nextIndex = (nextIndex + 1) % combatants.length;
      if (nextIndex === 0) round++;
      attempts++;
    }
    await updateSession({ round, active_combatant_index: nextIndex });
  };

  // ── Combatant actions ──────────────────────────────────────
  const addCombatant = async (values) => {
    if (!session) return;
    await fetch(`${API_BASE}/combat/combatants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, session_id: session.id, campaign_id: selectedCampaign.id }),
    });
  };

  const updateCombatant = async (id, patch) => {
    const res = await fetch(`${API_BASE}/combat/combatants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setCombatants((prev) => sortCombatants(prev.map((c) => c.id === id ? parseCombatant(data) : c)));
  };

  const removeCombatant = async (id) => {
    await fetch(`${API_BASE}/combat/combatants/${id}`, { method: 'DELETE' });
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const applyDamage = async (combatant, amount) => {
    const newHp = Math.max(0, Math.min(combatant.hp_max, combatant.hp_current + amount));
    const patch = { hp_current: newHp };
    if (newHp === 0 && combatant.hp_max > 0) {
      const conds = Array.isArray(combatant.conditions) ? combatant.conditions : [];
      if (!conds.includes('Dead')) patch.conditions = [...conds, 'Dead'];
    } else if (amount > 0) {
      // healing — remove Dead if present
      const conds = Array.isArray(combatant.conditions) ? combatant.conditions : [];
      if (conds.includes('Dead')) patch.conditions = conds.filter((c) => c !== 'Dead');
    }
    await updateCombatant(combatant.id, patch);
    setDamageInputs((prev) => ({ ...prev, [combatant.id]: '' }));
  };

  // ── Inline damage input ────────────────────────────────────
  const handleDamageKey = (e, combatant) => {
    if (e.key === 'Enter') {
      const val = parseInt(damageInputs[combatant.id] || '0');
      if (!isNaN(val) && val !== 0) applyDamage(combatant, -val);
    }
  };

  // ── Session name editing ───────────────────────────────────
  const commitSessionName = () => {
    if (sessionNameValue.trim()) updateSession({ name: sessionNameValue.trim() });
    setSessionNameEdit(false);
  };

  // ── Render helpers ─────────────────────────────────────────
  const renderConditions = (conditions) =>
    (Array.isArray(conditions) ? conditions : []).map((c) => (
      <span
        key={c}
        className="condition-chip"
        style={{ backgroundColor: CONDITION_COLORS[c] || '#6b7280' }}
      >
        {c}
      </span>
    ));

  const hpBarPercent = (c) => c.hp_max > 0 ? Math.max(0, (c.hp_current / c.hp_max) * 100) : 100;
  const hpBarColor = (pct) => pct > 50 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444';

  if (!selectedCampaign) {
    return (
      <div className="combat-tracker-empty">
        <p>Select a campaign to use the Combat Tracker.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="combat-tracker-empty"><p>Loading...</p></div>;
  }

  // ── No active combat ───────────────────────────────────────
  if (!session) {
    return (
      <div className="combat-tracker-empty">
        <div className="combat-tracker-start">
          <h2>No Active Combat</h2>
          <p>Start a new combat encounter to track initiative, HP, and conditions.</p>
          <button className="ct-btn ct-btn-primary" onClick={startCombat}>
            Start Combat
          </button>
        </div>
      </div>
    );
  }

  const activeCombatant = combatants[session.active_combatant_index] || null;

  return (
    <div className="combat-tracker">
      {/* ── Header ── */}
      <div className="ct-header">
        <div className="ct-header-left">
          {sessionNameEdit ? (
            <input
              ref={sessionNameRef}
              className="ct-session-name-input"
              value={sessionNameValue}
              onChange={(e) => setSessionNameValue(e.target.value)}
              onBlur={commitSessionName}
              onKeyDown={(e) => e.key === 'Enter' && commitSessionName()}
              autoFocus
            />
          ) : (
            <h1
              className="ct-session-name"
              onClick={() => setSessionNameEdit(true)}
              title="Click to rename"
            >
              {session.name}
            </h1>
          )}
          <span className="ct-round-badge">Round {session.round}</span>
          {activeCombatant && (
            <span className="ct-active-label">
              {activeCombatant.name}'s Turn
            </span>
          )}
        </div>
        <div className="ct-header-right">
          <button className="ct-btn ct-btn-secondary" onClick={nextTurn} disabled={combatants.length === 0}>
            Next Turn ▶
          </button>
          <button className="ct-btn ct-btn-danger" onClick={endCombat}>
            End Combat
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ct-toolbar">
        <button
          className="ct-btn ct-btn-player"
          onClick={() => { setAddDialogType('player'); setEditingCombatant(null); setAddDialogOpen(true); }}
        >
          + Add Player
        </button>
        <button
          className="ct-btn ct-btn-monster"
          onClick={() => { setAddDialogType('monster'); setEditingCombatant(null); setAddDialogOpen(true); }}
        >
          + Add Monster
        </button>
        <button
          className="ct-btn ct-btn-npc"
          onClick={() => { setAddDialogType('npc'); setEditingCombatant(null); setAddDialogOpen(true); }}
        >
          + Add NPC
        </button>
        <span className="ct-combatant-count">{combatants.length} combatant{combatants.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Combatant list ── */}
      {combatants.length === 0 ? (
        <div className="ct-empty-list">
          <p>No combatants yet — add players and monsters to begin.</p>
        </div>
      ) : (
        <div className="ct-list">
          {/* Table header */}
          <div className="ct-row ct-row-header">
            <div className="ct-col ct-col-turn" />
            <div className="ct-col ct-col-name">Name</div>
            <div className="ct-col ct-col-init">Init</div>
            <div className="ct-col ct-col-hp">HP</div>
            <div className="ct-col ct-col-ac">AC</div>
            <div className="ct-col ct-col-conditions">Conditions</div>
            <div className="ct-col ct-col-actions" />
          </div>

          {combatants.map((c, idx) => {
            const isActive = idx === session.active_combatant_index;
            const isDead = c.hp_current === 0 && c.hp_max > 0;
            const hpPct = hpBarPercent(c);

            return (
              <div
                key={c.id}
                className={[
                  'ct-row',
                  `ct-row-${c.type}`,
                  isActive ? 'ct-row-active' : '',
                  isDead ? 'ct-row-dead' : '',
                ].join(' ')}
              >
                {/* Active indicator */}
                <div className="ct-col ct-col-turn">
                  {isActive && <span className="ct-turn-arrow">▶</span>}
                </div>

                {/* Name */}
                <div className="ct-col ct-col-name">
                  <span className={`ct-type-badge ct-type-${c.type}`}>{c.type}</span>
                  <span className={isDead ? 'ct-name-dead' : 'ct-name'}>{c.name}</span>
                  {c.notes && <span className="ct-notes" title={c.notes}>📝</span>}
                </div>

                {/* Initiative */}
                <div className="ct-col ct-col-init">{c.initiative}</div>

                {/* HP */}
                <div className="ct-col ct-col-hp">
                  <div className="ct-hp-wrap">
                    <div className="ct-hp-text">
                      {c.hp_max > 0 ? `${c.hp_current} / ${c.hp_max}` : '—'}
                    </div>
                    {c.hp_max > 0 && (
                      <div className="ct-hp-bar-bg">
                        <div
                          className="ct-hp-bar-fill"
                          style={{ width: `${hpPct}%`, backgroundColor: hpBarColor(hpPct) }}
                        />
                      </div>
                    )}
                    {c.hp_max > 0 && (
                      <div className="ct-damage-row">
                        <button
                          className="ct-dmg-btn ct-dmg-btn-heal"
                          onClick={() => {
                            const v = parseInt(damageInputs[c.id] || '0');
                            if (!isNaN(v) && v > 0) applyDamage(c, v);
                          }}
                          title="Heal"
                        >+</button>
                        <input
                          className="ct-dmg-input"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={damageInputs[c.id] || ''}
                          onChange={(e) => setDamageInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={(e) => handleDamageKey(e, c)}
                        />
                        <button
                          className="ct-dmg-btn ct-dmg-btn-damage"
                          onClick={() => {
                            const v = parseInt(damageInputs[c.id] || '0');
                            if (!isNaN(v) && v > 0) applyDamage(c, -v);
                          }}
                          title="Damage"
                        >−</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AC */}
                <div className="ct-col ct-col-ac">{c.ac}</div>

                {/* Conditions */}
                <div className="ct-col ct-col-conditions">
                  {renderConditions(c.conditions)}
                </div>

                {/* Actions */}
                <div className="ct-col ct-col-actions">
                  <button
                    className="ct-action-btn"
                    onClick={() => { setEditingCombatant(c); setAddDialogType(c.type); setAddDialogOpen(true); }}
                    title="Edit"
                  >✏️</button>
                  <button
                    className="ct-action-btn ct-action-remove"
                    onClick={() => removeCombatant(c.id)}
                    title="Remove"
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Dialog ── */}
      <AddCombatantDialog
        open={addDialogOpen}
        type={addDialogType}
        editing={editingCombatant}
        allConditions={ALL_CONDITIONS}
        onClose={() => { setAddDialogOpen(false); setEditingCombatant(null); }}
        onSave={async (values) => {
          if (editingCombatant) {
            await updateCombatant(editingCombatant.id, values);
          } else {
            await addCombatant(values);
          }
          setAddDialogOpen(false);
          setEditingCombatant(null);
        }}
      />
    </div>
  );
}
