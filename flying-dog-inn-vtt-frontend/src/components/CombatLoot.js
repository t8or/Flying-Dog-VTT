import React, { useState, useEffect } from 'react';
import { useCampaign } from '../contexts/CampaignContext';
import './CombatLoot.css';

const CombatLoot = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCampaign } = useCampaign();
  const [editingEntry, setEditingEntry] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [formData, setFormData] = useState({
    combat_name: '',
    loot_description: '',
    gold_pieces: '',
    silver_pieces: '',
    copper_pieces: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (selectedCampaign) {
      fetchLootEntries();
    }
  }, [selectedCampaign]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.entry-actions')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchLootEntries = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/combat/loot/${selectedCampaign.id}`);
      if (!response.ok) throw new Error('Failed to fetch loot entries');
      const data = await response.json();
      setEntries(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching loot entries:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('pieces') ? (value === '' ? '' : parseInt(value) || 0) : value
    }));
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      combat_name: entry.combat_name,
      loot_description: entry.loot_description,
      gold_pieces: entry.gold_pieces || '',
      silver_pieces: entry.silver_pieces || '',
      copper_pieces: entry.copper_pieces || '',
      date: entry.date
    });
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this loot entry?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/combat/loot/${entryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete loot entry');
      await fetchLootEntries();
    } catch (error) {
      console.error('Error deleting loot entry:', error);
      alert('Failed to delete loot entry');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) {
      alert('Please select a campaign first');
      return;
    }

    try {
      const url = editingEntry 
        ? `http://localhost:3001/api/combat/loot/${editingEntry.id}`
        : 'http://localhost:3001/api/combat/loot';

      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          gold_pieces: formData.gold_pieces === '' ? 0 : parseInt(formData.gold_pieces),
          silver_pieces: formData.silver_pieces === '' ? 0 : parseInt(formData.silver_pieces),
          copper_pieces: formData.copper_pieces === '' ? 0 : parseInt(formData.copper_pieces),
          campaign_id: selectedCampaign.id
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingEntry ? 'update' : 'create'} loot entry`);

      // Clear form and refresh entries
      setFormData({
        combat_name: '',
        loot_description: '',
        gold_pieces: '',
        silver_pieces: '',
        copper_pieces: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingEntry(null);
      await fetchLootEntries();
    } catch (error) {
      console.error('Error saving loot entry:', error);
      alert('Failed to save loot entry');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading loot entries...</div>;
  }

  return (
    <div className="combat-loot-container">
      <div className="loot-entries-section">
        <h2>Loot History</h2>
        <div className="loot-entries">
          {entries.length === 0 ? (
            <p className="no-entries">No loot entries yet</p>
          ) : (
            entries.map(entry => (
              <div 
                key={entry.id} 
                className={`loot-entry ${editingEntry?.id === entry.id ? 'editing' : ''}`}
              >
                <div className="entry-header">
                  <h3>{entry.combat_name}</h3>
                  <div className="entry-actions">
                    <button
                      className="dropdown-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === entry.id ? null : entry.id);
                      }}
                    >
                      ⋮
                    </button>
                    {openDropdownId === entry.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => {
                          handleEdit(entry);
                          setOpenDropdownId(null);
                        }}>
                          Edit
                        </button>
                        <button 
                          className="delete"
                          onClick={() => {
                            handleDelete(entry.id);
                            setOpenDropdownId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <span className="timestamp">{entry.date}</span>
                <p className="loot-description">{entry.loot_description}</p>
                <div className="currency-summary">
                  <span className="gold">{entry.gold_pieces} GP</span>
                  <span className="silver">{entry.silver_pieces} SP</span>
                  <span className="copper">{entry.copper_pieces} CP</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="loot-form-section">
        <h2>{editingEntry ? 'Edit Loot Entry' : 'Add New Loot Entry'}</h2>
        <form onSubmit={handleSubmit} className="loot-form">
          <div className="form-group">
            <label htmlFor="combat_name">Combat Name</label>
            <input
              type="text"
              id="combat_name"
              name="combat_name"
              value={formData.combat_name}
              onChange={handleInputChange}
              required
              placeholder="Enter combat name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="loot_description">Loot Description</label>
            <textarea
              id="loot_description"
              name="loot_description"
              value={formData.loot_description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe the loot gained..."
            />
          </div>

          <div className="currency-inputs">
            <div className="form-group">
              <label htmlFor="gold_pieces">Gold Pieces</label>
              <input
                type="number"
                id="gold_pieces"
                name="gold_pieces"
                value={formData.gold_pieces}
                onChange={handleInputChange}
                min="0"
                placeholder="Gold Pieces"
              />
            </div>

            <div className="form-group">
              <label htmlFor="silver_pieces">Silver Pieces</label>
              <input
                type="number"
                id="silver_pieces"
                name="silver_pieces"
                value={formData.silver_pieces}
                onChange={handleInputChange}
                min="0"
                placeholder="Silver Pieces"
              />
            </div>

            <div className="form-group">
              <label htmlFor="copper_pieces">Copper Pieces</label>
              <input
                type="number"
                id="copper_pieces"
                name="copper_pieces"
                value={formData.copper_pieces}
                onChange={handleInputChange}
                min="0"
                placeholder="Copper Pieces"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">Game Session Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editingEntry ? 'Update Loot Entry' : 'Add Loot Entry'}
            </button>
            {editingEntry && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditingEntry(null);
                  setFormData({
                    combat_name: '',
                    loot_description: '',
                    gold_pieces: '',
                    silver_pieces: '',
                    copper_pieces: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CombatLoot; 