import React, { useState, useEffect, useRef } from 'react';
import { DotsThree } from '@phosphor-icons/react';
import { useCampaign } from '../contexts/CampaignContext';

const formatDate = (timestamp) => {
  try {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const EventMenu = ({ event, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        <DotsThree size={20} weight="bold" />
      </button>
      {showMenu && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minWidth: '120px',
          zIndex: 10
        }}>
          <button
            onClick={() => {
              onEdit(event);
              setShowMenu(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'block'
            }}
          >
            Edit event
          </button>
          <button
            onClick={() => {
              onDelete(event.id);
              setShowMenu(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'block'
            }}
          >
            Delete event
          </button>
        </div>
      )}
    </div>
  );
};

const TimelineNavigation = ({ events, onTimelineClick }) => {
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(parseInt(event.timestamp));
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {});

  // Sort months for calculating fade
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });

  // Calculate opacity based on position
  const getColor = (month) => {
    const index = sortedMonths.indexOf(month);
    const totalMonths = sortedMonths.length - 1;
    if (totalMonths === 0) return 'rgb(107, 95, 95)'; // Warm cream-tinted color
    
    const opacity = 1 - (index / totalMonths * 0.7); // Fade from 1 to 0.3
    return `rgba(107, 95, 95, ${opacity})`;
  };

  return (
    <div style={{
      width: '296px',
      borderLeft: '1px solid #E5E7EB'
    }}>
      <h3 style={{ 
        fontSize: '14px', 
        color: '#6B7280', 
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: 0,
        marginBottom: '16px'
      }}>
        Timeline Navigation
      </h3>
      
      {Object.entries(groupedEvents)
        .sort(([monthA], [monthB]) => {
          const dateA = new Date(monthA);
          const dateB = new Date(monthB);
          return dateB - dateA;
        })
        .map(([month, monthEvents]) => (
          <div key={month} style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              color: getColor(month),
              margin: '0 0 8px 0'
            }}>
              {month}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {monthEvents
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(event => (
                  <button
                    key={event.id}
                    onClick={() => onTimelineClick(event)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#4B5563',
                      ':hover': {
                        background: '#F3F4F6'
                      }
                    }}
                  >
                    {event.event}
                  </button>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    setEvents([]); // Clear events when campaign changes
    if (selectedCampaign) {
      fetchEvents();
    }
  }, [selectedCampaign?.id]); // Add .id to ensure it updates when campaign changes

  const fetchEvents = async () => {
    if (!selectedCampaign) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/timeline?campaign_id=${selectedCampaign.id}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setIsAddingEvent(true);
  };

  const handleDelete = async (eventId) => {
    if (!selectedCampaign) {
      console.error('No campaign selected');
      return;
    }
    
    try {
      console.log('Deleting event:', eventId);
      const response = await fetch(
        `http://localhost:3001/api/timeline/${eventId}?campaign_id=${selectedCampaign.id}`, 
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete event');
      }

      console.log('Event deleted:', eventId);
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const EventForm = ({ isEditing = false, onCancel, initialEvent = null }) => {
    const [formData, setFormData] = useState({
      event: initialEvent?.event || '',
      details: initialEvent?.details || '',
      date: initialEvent ? new Date(initialEvent.timestamp).toISOString().split('T')[0] 
                       : new Date().toISOString().split('T')[0]
    });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = async () => {
      if (!selectedCampaign) {
        console.error('No campaign selected');
        return;
      }

      try {
        const timestamp = new Date(formData.date).getTime();
        const eventData = {
          event: formData.event,
          details: formData.details,
          timestamp,
          campaign_id: selectedCampaign.id
        };
        
        const url = initialEvent 
          ? `http://localhost:3001/api/timeline/${initialEvent.id}`
          : 'http://localhost:3001/api/timeline';
        
        const method = initialEvent ? 'PUT' : 'POST';
        
        console.log('Submitting event:', eventData);
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to save event');
        }

        const data = await response.json();
        console.log('Event saved:', data);
        
        await fetchEvents();
        onCancel();
      } catch (error) {
        console.error('Error saving event:', error);
      }
    };

    return (
      <div 
        style={{ 
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: isEditing ? '16px' : '20px'
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            name="event"
            placeholder="Event"
            value={formData.event}
            onChange={handleInputChange}
            className="event-input"
            style={{ 
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              color: formData.event ? '#111827' : '#6B7280',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
          <textarea
            name="details"
            placeholder="Details"
            value={formData.details}
            onChange={handleInputChange}
            className="details-input"
            style={{ 
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              color: formData.details ? '#111827' : '#6B7280',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              outline: 'none',
              whiteSpace: 'pre-wrap'
            }}
          />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: '#6B7280', fontSize: '14px' }}>
                Game session date:
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                style={{ 
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#111827'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={onCancel}
                style={{
                  background: 'white',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="dnd-button-secondary"
              >
                {isEditing ? 'Update event' : 'Save event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleTimelineClick = (event) => {
    // Scroll to the event in the main timeline
    const element = document.getElementById(`event-${event.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleExport = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign first');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/campaign/export/${selectedCampaign.id}`);
      if (!response.ok) throw new Error('Failed to export campaign data');
      const data = await response.json();

      // Format the data for JSON file
      const jsonStr = JSON.stringify(data, null, 2);

      // Create and download the file
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCampaign.name}-campaign-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting campaign data:', error);
      alert('Failed to export campaign data');
    }
  };

  return (
    <>
      <style>
        {`
          .event-input::placeholder {
            color: #6B7280 !important;
            font-weight: 600 !important;
          }
          .details-input::placeholder {
            color: #6B7280 !important;
          }
          .timeline-nav-button:hover {
            background: #F3F4F6;
          }
          .dnd-button {
            background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
            color: #F5E6D3;
            border: 1px solid #A0522D;
            border-radius: 6px;
            padding: 8px 20px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            text-transform: capitalize;
            letter-spacing: 0.02em;
            transition: all 0.2s ease;
          }
          .dnd-button:hover {
            background: linear-gradient(135deg, #9B5523 0%, #755331 100%);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          .dnd-button-secondary {
            background: #F5E6D3;
            color: #8B4513;
            border: 1px solid #A0522D;
            border-radius: 6px;
            padding: 8px 20px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
            text-transform: capitalize;
            letter-spacing: 0.02em;
            transition: all 0.2s ease;
          }
          .dnd-button-secondary:hover {
            background: #F8EFE3;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
          .timeline-event {
            background: white;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            position: relative;
            transition: all 0.2s ease;
          }
          .timeline-event.editing {
            border: 1px solid #6366F1;
            background: #F5F3FF;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          }
          .timeline-event.editing .event-title {
            color: #4F46E5;
          }
        `}
      </style>
      <div style={{ 
        padding: '32px 32px 0 32px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          gap: '48px',
          alignItems: 'flex-start',
          height: '100%'
        }}>
          <div style={{
            flex: '1 1 auto',
            minWidth: '400px',
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: '100%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Timeline</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setIsAddingEvent(true);
                    setEditingEvent(null);
                  }}
                  className="dnd-button"
                >
                  Add new event
                </button>
              </div>
            </div>

            {isAddingEvent && !editingEvent && (
              <EventForm onCancel={() => setIsAddingEvent(false)} />
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              overflowY: 'auto'
            }}>
              <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                {Object.entries(
                  events.reduce((acc, event) => {
                    const date = new Date(parseInt(event.timestamp));
                    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!acc[month]) {
                      acc[month] = [];
                    }
                    acc[month].push(event);
                    return acc;
                  }, {})
                )
                .sort(([monthA], [monthB]) => {
                  const dateA = new Date(monthA);
                  const dateB = new Date(monthB);
                  return dateB - dateA;
                })
                .map(([month, monthEvents]) => (
                  <div key={month}>
                    <h4 style={{ 
                      fontSize: '13px', 
                      color: 'rgb(107, 95, 95)',
                      margin: '24px 0 16px 0',
                      fontWeight: '500',
                      letterSpacing: '0.025em'
                    }}>
                      {month}
                    </h4>
                    {monthEvents
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map(event => {
                        if (editingEvent && editingEvent.id === event.id) {
                          return <EventForm 
                            key={event.id} 
                            isEditing 
                            initialEvent={event}
                            onCancel={() => {
                              setEditingEvent(null);
                              setIsAddingEvent(false);
                            }} 
                          />;
                        }
                        
                        return (
                          <div 
                            id={`event-${event.id}`}
                            key={event.id} 
                            className={`timeline-event ${editingEvent?.id === event.id ? 'editing' : ''}`}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: '8px',
                              position: 'sticky',
                              top: 0,
                              background: 'inherit',
                              zIndex: 1,
                              margin: '-16px -16px 8px -16px',
                              padding: '16px',
                              borderTopLeftRadius: '8px',
                              borderTopRightRadius: '8px',
                              borderBottom: '1px solid #E5E7EB'
                            }}>
                              <h3 className="event-title" style={{ margin: '0', color: '#111827', fontWeight: '500' }}>{event.event}</h3>
                              <EventMenu event={event} onEdit={handleEdit} onDelete={handleDelete} />
                            </div>
                            <p style={{ 
                              margin: '0 0 16px 0', 
                              color: '#6B7280',
                              whiteSpace: 'pre-wrap'
                            }}>{event.details}</p>
                            <small style={{ color: '#6B7280', display: 'block', margin: 0 }}>{formatDate(event.timestamp)}</small>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <TimelineNavigation events={events} onTimelineClick={handleTimelineClick} />
        </div>
      </div>
    </>
  );
};

export default Timeline;
