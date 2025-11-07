import React, { useState, useEffect } from 'react';
import { BeerStein, MapTrifold, Sword, Clock, Users, CalendarCheck, Scroll } from '@phosphor-icons/react';
import { useCampaign } from '../contexts/CampaignContext';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    totalMaps: 0,
    lastTimelineEvent: null,
    timelineEventCount: 0,
    lastActive: null
  });
  const [lootForLastEvent, setLootForLastEvent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    setIsLoading(true);
    setLootForLastEvent([]);
    if (selectedCampaign) {
      console.log('Fetching stats for campaign:', selectedCampaign.id);
      fetchStats();
    } else {
      setStats({
        totalMaps: 0,
        lastTimelineEvent: null,
        timelineEventCount: 0,
        lastActive: null
      });
      setIsLoading(false);
    }
  }, [selectedCampaign?.id]);

  const fetchStats = async () => {
    if (!selectedCampaign) return;
    
    try {
      console.log('Fetching campaign stats...');
      
              const mapsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3334/api'}/maps?campaign_id=${selectedCampaign.id}`);
      if (!mapsResponse.ok) throw new Error('Failed to fetch maps');
      const maps = await mapsResponse.json();
      console.log('Found maps:', maps);
      
      // Ensure maps is an array
      if (!Array.isArray(maps)) {
        console.error('Expected maps to be an array, got:', typeof maps, maps);
        throw new Error('Invalid maps data received');
      }
      
              const timelineResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3334/api'}/timeline?campaign_id=${selectedCampaign.id}`);
      if (!timelineResponse.ok) throw new Error('Failed to fetch timeline events');
      const timelineEvents = await timelineResponse.json();
      console.log('Found timeline events:', timelineEvents);
      
      // Ensure timelineEvents is an array
      if (!Array.isArray(timelineEvents)) {
        console.error('Expected timeline events to be an array, got:', typeof timelineEvents, timelineEvents);
        throw new Error('Invalid timeline events data received');
      }
      
      const lastEvent = timelineEvents.length > 0 
        ? timelineEvents.reduce((latest, event) => 
            event.timestamp > latest.timestamp ? event : latest
          )
        : null;

      setStats({
        totalMaps: maps.length,
        lastTimelineEvent: lastEvent,
        timelineEventCount: timelineEvents.length,
        lastActive: lastEvent ? new Date(parseInt(lastEvent.timestamp)) : null
      });

      // Fetch loot for the last event if it exists
      if (lastEvent) {
        fetchLootForEvent(lastEvent);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalMaps: 0,
        lastTimelineEvent: null,
        timelineEventCount: 0,
        lastActive: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLootForEvent = async (event) => {
    if (!selectedCampaign || !event) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3334/api'}/combat/loot/${selectedCampaign.id}`);
      if (!response.ok) throw new Error('Failed to fetch loot entries');
      const allLoot = await response.json();
      
      // Filter loot that matches the event's date
      const eventDate = new Date(parseInt(event.timestamp)).toISOString().split('T')[0];
      const matchingLoot = allLoot.filter(loot => loot.date === eventDate);
      
      setLootForLastEvent(matchingLoot);
    } catch (error) {
      console.error('Error fetching loot for event:', error);
      setLootForLastEvent([]);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No activity';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (minutes < 60) return `${minutes} minutes ago at ${timeStr}`;
    if (hours < 24) return `${hours} hours ago at ${timeStr}`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  // Mini Loot Card component for horizontal swimlane display
  const MiniLootCard = ({ loot }) => {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FFF9E6 0%, #F5E6D3 100%)',
        border: '1px solid #D4AF37',
        borderRadius: '6px',
        padding: '12px',
        minWidth: '200px',
        maxWidth: '200px',
        boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)',
        transition: 'all 0.2s ease'
      }}>
        <h4 style={{ 
          margin: '0 0 6px 0', 
          fontSize: '13px', 
          fontWeight: '600',
          color: '#8B4513',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {loot.combat_name}
        </h4>
        {loot.loot_description && (
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '11px',
            color: '#6B5B4E',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}>
            {loot.loot_description}
          </p>
        )}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {loot.gold_pieces > 0 && (
            <span style={{ color: '#FFD700' }}>{loot.gold_pieces} GP</span>
          )}
          {loot.silver_pieces > 0 && (
            <span style={{ color: '#C0C0C0' }}>{loot.silver_pieces} SP</span>
          )}
          {loot.copper_pieces > 0 && (
            <span style={{ color: '#B87333' }}>{loot.copper_pieces} CP</span>
          )}
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, date }) => (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={24} weight="regular" />
      </div>
      <div className="stat-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {date && (
          <small className="stat-date">
            {getRelativeTime(date)}
          </small>
        )}
      </div>
    </div>
  );

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <BeerStein size={48} weight="regular" style={{ color: '#111827' }} />
          <div>
            <h1 className="home-title">
              {selectedCampaign ? selectedCampaign.name : 'Welcome to Flying Dog Inn VTT'}
            </h1>
            <p className="home-subtitle">
              {selectedCampaign ? 'Campaign Overview' : 'Please select a campaign to get started'}
            </p>
          </div>
        </div>

        {selectedCampaign ? (
          <>
            <div className="stats-section">
              <h2 className="stats-title">Campaign Stats</h2>
              <div className="stats-grid">
                <StatCard 
                  icon={MapTrifold}
                  title="Total Maps"
                  value={isLoading ? 'Loading...' : stats.totalMaps}
                />
                <StatCard 
                  icon={Scroll}
                  title="Timeline Events"
                  value={isLoading ? 'Loading...' : stats.timelineEventCount}
                />
                <StatCard 
                  icon={CalendarCheck}
                  title="Last Activity"
                  value={isLoading ? 'Loading...' : (stats.lastActive ? formatDate(stats.lastActive) : 'No activity')}
                  date={stats.lastActive}
                />
              </div>
            </div>

            {stats.lastTimelineEvent && (
              <div className="latest-event">
                <h2 className="latest-event-title">Latest Timeline Event</h2>
                <div className="event-card">
                  <h3 className="event-name">{stats.lastTimelineEvent.event}</h3>
                  <p className="event-details" style={{ whiteSpace: 'pre-wrap' }}>{stats.lastTimelineEvent.details}</p>
                  <small className="event-date">
                    {new Date(parseInt(stats.lastTimelineEvent.timestamp)).toLocaleDateString()}
                  </small>
                  
                  {/* Show loot swimlane if there are loot items */}
                  {lootForLastEvent && lootForLastEvent.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#8B4513',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Loot
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '4px'
                      }}>
                        {lootForLastEvent.map(loot => (
                          <MiniLootCard key={loot.id} loot={loot} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-campaign">
            Please select a campaign from the sidebar to view stats and information.
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 