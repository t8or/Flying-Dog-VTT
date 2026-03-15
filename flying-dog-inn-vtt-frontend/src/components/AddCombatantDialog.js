import React, { useState, useEffect } from 'react';
import './AddCombatantDialog.css';

const MONSTER_PRESETS = [
  { label: 'Goblin',        hp: 7,  ac: 15, initiative: 2 },
  { label: 'Skeleton',      hp: 13, ac: 13, initiative: 2 },
  { label: 'Zombie',        hp: 22, ac: 8,  initiative: -2 },
  { label: 'Orc',           hp: 15, ac: 13, initiative: 0 },
  { label: 'Wolf',          hp: 11, ac: 13, initiative: 2 },
  { label: 'Bandit',        hp: 11, ac: 12, initiative: 1 },
  { label: 'Cultist',       hp: 9,  ac: 12, initiative: 0 },
  { label: 'Giant Rat',     hp: 7,  ac: 12, initiative: 2 },
  { label: 'Kobold',        hp: 5,  ac: 12, initiative: 2 },
  { label: 'Hobgoblin',     hp: 11, ac: 18, initiative: 1 },
  { label: 'Bugbear',       hp: 27, ac: 16, initiative: 1 },
  { label: 'Owlbear',       hp: 59, ac: 13, initiative: 0 },
  { label: 'Troll',         hp: 84, ac: 15, initiative: -1 },
  { label: 'Young Dragon',  hp: 178, ac: 18, initiative: 0 },
];

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

const defaultForm = (type) => ({
  name: '',
  type,
  initiative: '',
  hp_max: '',
  hp_current: '',
  ac: '10',
  conditions: [],
  notes: '',
});

export default function AddCombatantDialog({ open, type, editing, allConditions, onClose, onSave }) {
  const [form, setForm] = useState(defaultForm(type));
  const [selectedPreset, setSelectedPreset] = useState('');

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || '',
          type: editing.type || type,
          initiative: editing.initiative != null ? String(editing.initiative) : '',
          hp_max: editing.hp_max != null ? String(editing.hp_max) : '',
          hp_current: editing.hp_current != null ? String(editing.hp_current) : '',
          ac: editing.ac != null ? String(editing.ac) : '10',
          conditions: Array.isArray(editing.conditions) ? [...editing.conditions] : [],
          notes: editing.notes || '',
        });
      } else {
        setForm(defaultForm(type));
      }
      setSelectedPreset('');
    }
  }, [open, editing, type]);

  const applyPreset = (label) => {
    const preset = MONSTER_PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setSelectedPreset(label);
    setForm((prev) => ({
      ...prev,
      name: label,
      initiative: String(preset.initiative),
      hp_max: String(preset.hp),
      hp_current: String(preset.hp),
      ac: String(preset.ac),
    }));
  };

  const toggleCondition = (cond) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hpMax = parseInt(form.hp_max) || 0;
    const hpCurrent = form.hp_current !== '' ? parseInt(form.hp_current) : hpMax;
    onSave({
      name: form.name.trim(),
      type: form.type,
      initiative: parseInt(form.initiative) || 0,
      hp_max: hpMax,
      hp_current: hpCurrent,
      ac: parseInt(form.ac) || 10,
      conditions: form.conditions,
      notes: form.notes.trim(),
    });
  };

  if (!open) return null;

  const isMonster = form.type === 'monster';
  const isEditing = !!editing;

  return (
    <div className="acd-overlay" onClick={onClose}>
      <div className="acd-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="acd-header">
          <h2>{isEditing ? 'Edit Combatant' : `Add ${form.type.charAt(0).toUpperCase() + form.type.slice(1)}`}</h2>
          <button className="acd-close" onClick={onClose}>✕</button>
        </div>

        {/* Type toggle (only when adding) */}
        {!isEditing && (
          <div className="acd-type-toggle">
            {['player', 'monster', 'npc'].map((t) => (
              <button
                key={t}
                type="button"
                className={`acd-type-btn acd-type-${t} ${form.type === t ? 'active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, type: t }))}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Monster preset picker */}
        {isMonster && !isEditing && (
          <div className="acd-presets">
            <label className="acd-label">Quick-fill preset</label>
            <select
              className="acd-select"
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="">— choose a preset —</option>
              {MONSTER_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label} (HP {p.hp}, AC {p.ac})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="acd-form">
          {/* Name */}
          <div className="acd-field">
            <label className="acd-label">Name *</label>
            <input
              className="acd-input"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={isMonster ? 'Goblin Archer' : 'Character name'}
            />
          </div>

          {/* Initiative / AC row */}
          <div className="acd-row">
            <div className="acd-field">
              <label className="acd-label">Initiative</label>
              <input
                className="acd-input"
                type="number"
                value={form.initiative}
                onChange={(e) => setForm((p) => ({ ...p, initiative: e.target.value }))}
                placeholder="0"
                min="-10"
                max="40"
              />
            </div>
            <div className="acd-field">
              <label className="acd-label">AC</label>
              <input
                className="acd-input"
                type="number"
                value={form.ac}
                onChange={(e) => setForm((p) => ({ ...p, ac: e.target.value }))}
                placeholder="10"
                min="0"
                max="40"
              />
            </div>
          </div>

          {/* HP row */}
          <div className="acd-row">
            <div className="acd-field">
              <label className="acd-label">Max HP</label>
              <input
                className="acd-input"
                type="number"
                value={form.hp_max}
                onChange={(e) => setForm((p) => ({ ...p, hp_max: e.target.value, hp_current: p.hp_current === p.hp_max ? e.target.value : p.hp_current }))}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="acd-field">
              <label className="acd-label">Current HP</label>
              <input
                className="acd-input"
                type="number"
                value={form.hp_current}
                onChange={(e) => setForm((p) => ({ ...p, hp_current: e.target.value }))}
                placeholder={form.hp_max || '0'}
                min="0"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="acd-field">
            <label className="acd-label">Conditions</label>
            <div className="acd-conditions">
              {(allConditions || Object.keys(CONDITION_COLORS)).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  className={`acd-cond-btn ${form.conditions.includes(cond) ? 'active' : ''}`}
                  style={form.conditions.includes(cond) ? { backgroundColor: CONDITION_COLORS[cond], color: '#fff', borderColor: CONDITION_COLORS[cond] } : {}}
                  onClick={() => toggleCondition(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="acd-field">
            <label className="acd-label">Notes</label>
            <textarea
              className="acd-textarea"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Special abilities, reminders..."
              rows={2}
            />
          </div>

          <div className="acd-footer">
            <button type="button" className="acd-btn acd-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="acd-btn acd-btn-save">
              {isEditing ? 'Save Changes' : 'Add to Combat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
