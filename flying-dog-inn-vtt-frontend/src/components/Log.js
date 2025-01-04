import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCampaign } from '../contexts/CampaignContext';
import { Plus, PencilSimple, Trash, ArrowsVertical, Dot } from '@phosphor-icons/react';

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const observer = useRef();
  const refreshInterval = useRef();
  const { selectedCampaign } = useCampaign();

  const lastLogElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prevOffset => prevOffset + limit);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchLogs = async () => {
    if (!selectedCampaign) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/logs?campaign_id=${selectedCampaign.id}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      
      setLogs(prevLogs => {
        const newLogs = offset === 0 ? data : [...prevLogs, ...data];
        
        const uniqueLogs = Array.from(new Map(newLogs.map(log => [log.id, log])).values());
        
        return uniqueLogs.sort((a, b) => b.created_at - a.created_at);
      });
      setHasMore(data.length === limit);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset logs and offset when campaign changes
  useEffect(() => {
    setLogs([]);
    setOffset(0);
    setHasMore(true);
    if (selectedCampaign) {
      fetchLogs();
    }
    
    // Set up refresh interval
    if (selectedCampaign) {
      refreshInterval.current = setInterval(() => {
        setOffset(0);
      }, 10000);

      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    }
  }, [selectedCampaign?.id]); // Add .id to ensure it updates when campaign changes

  // Fetch more logs when offset changes
  useEffect(() => {
    if (selectedCampaign && offset > 0) {
      fetchLogs();
    }
  }, [offset, selectedCampaign?.id]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      date: `${dayOfWeek} ${date.toLocaleDateString()}`,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getActionIcon = (action_type) => {
    switch (action_type) {
      case 'CREATE':
        return <Plus weight="bold" />;
      case 'UPDATE':
        return <PencilSimple weight="bold" />;
      case 'DELETE':
        return <Trash weight="bold" />;
      case 'REORDER':
        return <ArrowsVertical weight="bold" />;
      default:
        return <Dot weight="bold" />;
    }
  };

  const getActionColor = (action_type) => {
    switch (action_type) {
      case 'CREATE':
        return '#2D7A4C'; // Deep forest green
      case 'UPDATE':
        return '#8B4513'; // Saddle brown
      case 'DELETE':
        return '#8B0000'; // Dark red
      case 'REORDER':
        return '#4B0082'; // Indigo
      default:
        return '#483C32'; // Dark taupe
    }
  };

  const formatActionName = (log) => {
    const entityMap = {
      'map': 'Map',
      'marker': 'Marker',
      'timeline_event': 'Timeline Event',
      'campaign': 'Campaign'
    };

    if (log.details) {
      const nameMatch = log.details.match(/"([^"]+)"/);
      if (nameMatch) return nameMatch[1];
      
      return log.details;
    }

    return `${entityMap[log.entity_type] || log.entity_type} ${log.entity_id}`;
  };

  const formatActionLocation = (log) => {
    switch (log.entity_type) {
      case 'map':
        return 'Maps';
      case 'marker': {
        const mapMatch = log.details?.match(/on map "([^"]+)"/);
        if (mapMatch) return mapMatch[1];
        return 'Maps';
      }
      case 'timeline_event':
        return 'Timeline';
      case 'campaign':
        return 'Campaign Settings';
      default:
        return '';
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
    <div style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: 'calc(100vw - 296px)',
      boxSizing: 'border-box',
      background: '#F5E6D3',
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      overflowY: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginLeft: '32px',
        marginRight: '32px'
      }}>
        <h2 style={{ margin: 0 }}>Campaign Log</h2>
        <button 
          onClick={handleExport}
          className="dnd-button-secondary"
          style={{
            background: '#F5E6D3',
            color: '#8B4513',
            border: '1px solid #A0522D',
            borderRadius: '6px',
            padding: '8px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            textTransform: 'capitalize',
            letterSpacing: '0.02em',
            transition: 'all 0.2s ease'
          }}
        >
          Export Campaign Data
        </button>
      </div>
      
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        margin: '32px',
        boxShadow: '0 4px 6px rgba(44, 24, 16, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflowY: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          bottom: '24px',
          overflowY: 'auto',
          overflowX: 'auto'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate', 
            borderSpacing: 0,
            tableLayout: 'fixed'
          }}>
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '180px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 16px 8px 12px',
                  borderBottom: '2px solid #8B4513',
                  color: '#2C1810',
                  fontWeight: '600',
                  backgroundColor: '#DEB887',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  fontSize: '12pt'
                }}>Action</th>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  borderBottom: '2px solid #8B4513',
                  color: '#2C1810',
                  fontWeight: '600',
                  backgroundColor: '#DEB887',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  fontSize: '12pt'
                }}>Name</th>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  borderBottom: '2px solid #8B4513',
                  color: '#2C1810',
                  fontWeight: '600',
                  backgroundColor: '#DEB887',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  fontSize: '12pt'
                }}>Location</th>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  borderBottom: '2px solid #8B4513',
                  color: '#2C1810',
                  fontWeight: '600',
                  backgroundColor: '#DEB887',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  fontSize: '12pt'
                }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#483C32',
                    fontStyle: 'italic'
                  }}>
                    No actions logged in the chronicles yet...
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const isLastElement = index === logs.length - 1;
                  return (
                    <tr
                      key={log.id}
                      ref={isLastElement ? lastLogElementRef : null}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#FFF' : '#F5E6D3',
                        fontSize: '12pt',
                        lineHeight: '1.2'
                      }}
                    >
                      <td style={{
                        padding: '6px 16px 6px 12px',
                        whiteSpace: 'nowrap',
                        color: '#2C1810'
                      }}>
                        <span style={{ 
                          color: getActionColor(log.action_type),
                          marginRight: '8px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          {getActionIcon(log.action_type)}
                        </span>
                        {log.action_type}
                      </td>
                      <td style={{
                        padding: '6px 16px',
                        color: '#2C1810',
                        textDecoration: log.action_type === 'DELETE' ? 'line-through' : 'none'
                      }}>
                        {formatActionName(log)}
                      </td>
                      <td style={{
                        padding: '6px 16px',
                        color: '#2C1810',
                        textDecoration: log.action_type === 'DELETE' ? 'line-through' : 'none'
                      }}>
                        {formatActionLocation(log)}
                      </td>
                      <td style={{
                        padding: '6px 16px',
                        color: '#666',
                        whiteSpace: 'nowrap'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span>{formatTimestamp(log.created_at).date}</span>
                          <span style={{ 
                            fontSize: '8pt',
                            marginTop: '-2px',
                            opacity: 0.8
                          }}>
                            {formatTimestamp(log.created_at).time}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 0',
            textAlign: 'center',
            color: '#483C32',
            fontStyle: 'italic',
            fontFamily: '"Crimson Text", serif',
            background: 'linear-gradient(transparent, white)'
          }}>
            Consulting the archives...
          </div>
        )}
      </div>
    </div>
  );
};

export default Log; 