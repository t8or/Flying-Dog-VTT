import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Maps.css';
import { useCampaign } from '../contexts/CampaignContext';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { DotsThreeVertical } from "@phosphor-icons/react";

// Marker configuration
const MARKER_COLORS = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#000000': 'Black'
};

const Maps = ({ onMapChange }) => {
  const { id: mapId } = useParams();
  const navigate = useNavigate();
  const [mapData, setMapData] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCampaign } = useCampaign();
  const mapContainerRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);

  // Menu handlers
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleRenameMap = async () => {
    handleMenuClose();
    const newName = prompt('Enter new map name:', mapData?.name);
    if (!newName || !newName.trim() || newName === mapData?.name) return;

    try {
      const response = await fetch(`http://localhost:3001/api/maps/${mapId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          campaign_id: selectedCampaign.id
        }),
      });

      if (!response.ok) throw new Error('Failed to rename map');
      
      // Update local state
      setMapData(prev => ({ ...prev, name: newName.trim() }));
      if (onMapChange) onMapChange({ ...mapData, name: newName.trim() });
    } catch (error) {
      console.error('Error renaming map:', error);
      alert('Failed to rename map');
    }
  };

  const handleDeleteMap = async () => {
    handleMenuClose();
    if (!window.confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/maps/${mapId}?campaign_id=${selectedCampaign.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete map');
      
      // Notify parent about map deletion
      if (onMapChange) onMapChange({ type: 'delete', id: mapId });
      
      // Navigate back to maps list
      navigate('/maps');
    } catch (error) {
      console.error('Error deleting map:', error);
      alert('Failed to delete map');
    }
  };

  // Cleanup function
  const cleanupMap = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  };

  // Reset state when map changes
  useEffect(() => {
    setIsLoading(true);
    setMapData(null);
    setImageDimensions(null);
    setMarkers([]);
    cleanupMap();
    return cleanupMap;
  }, [mapId]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupMap;
  }, []);

  // Fetch map data and markers
  useEffect(() => {
    if (selectedCampaign && mapId) {
      fetchMap();
      fetchMarkers();
    }
  }, [mapId, selectedCampaign]);

  const fetchMap = async () => {
    if (!selectedCampaign) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/maps/${mapId}?campaign_id=${selectedCampaign.id}`);
      if (!response.ok) throw new Error('Failed to fetch map');
      const data = await response.json();
      setMapData(data);
      
      // Load image dimensions
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, img.height);
        setImageDimensions({ width: img.width, height: img.height });
        setIsLoading(false);
      };
      img.onerror = (error) => {
        console.error('Failed to load map image:', error);
        setIsLoading(false);
      };
      img.src = `http://localhost:3001/maps/${data.path}`;
      
      if (onMapChange) onMapChange(data);
    } catch (error) {
      console.error('Error fetching map:', error);
      setIsLoading(false);
      navigate('/maps');
    }
  };

  const fetchMarkers = async () => {
    if (!selectedCampaign || !mapId) return;
    
    try {
      console.log('Fetching markers for campaign:', selectedCampaign.id, 'map:', mapId);
      const response = await fetch(`http://localhost:3001/api/maps/${mapId}/markers?campaign_id=${selectedCampaign.id}`);
      
      const responseText = await response.text();
      console.log('Fetch markers response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch markers: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log('Parsed markers:', data);
      
      // Convert lat/lng to numbers
      const parsedMarkers = data.map(marker => ({
        ...marker,
        lat: Number(marker.lat),
        lng: Number(marker.lng),
        campaign_id: selectedCampaign.id // Ensure campaign_id is set
      }));
      
      console.log('Processed markers:', parsedMarkers);
      setMarkers(parsedMarkers);
      
      // If map is already initialized, add markers
      if (leafletMapRef.current) {
        addMarkersToMap(parsedMarkers, leafletMapRef.current);
      }
    } catch (error) {
      console.error('Error fetching markers:', error);
    }
  };

  const createMarkerIcon = (color = '#FF0000') => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-icon" style="color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="currentColor"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0, 0, 0, 0.25)" stroke-width="10"/>
        </svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, 0]
    });
  };

  const createPopupContent = (markerData, isNewMarker = false) => {
    const uniqueId = Math.random().toString(36).substring(7);
    const formId = `marker-form-${uniqueId}`;
    const deleteId = `delete-btn-${uniqueId}`;
    const submitId = `submit-btn-${uniqueId}`;

    // Create popup content with unique IDs
    const content = `
      <div class="marker-content">
        <form id="${formId}" class="marker-header">
          <div class="marker-title-container">
            <input 
              type="text" 
              name="label" 
              value="${markerData.label || ''}" 
              placeholder="Marker Label" 
              class="marker-title" 
              required
            />
          </div>
          <textarea 
            name="description" 
            placeholder="Description (optional)" 
            class="marker-description" 
            rows="2"
          >${markerData.description || ''}</textarea>
          <select name="color" class="marker-input">
            ${Object.entries(MARKER_COLORS).map(([value, label]) => `
              <option value="${value}" ${value === (markerData.color || '#FF0000') ? 'selected' : ''}>
                ${label}
              </option>
            `).join('')}
          </select>
        </form>
        <div class="marker-actions">
          <button type="button" id="${deleteId}" class="cancel-button">
            Cancel
          </button>
          <button type="submit" id="${submitId}" class="dnd-button">
            ${isNewMarker ? 'Add Marker' : 'Save Changes'}
          </button>
        </div>
      </div>
    `;

    return { content, formId, deleteId, submitId };
  };

  const createViewPopupContent = (markerData) => {
    const uniqueId = Math.random().toString(36).substring(7);
    const editId = `edit-btn-${uniqueId}`;
    const deleteId = `delete-btn-${uniqueId}`;

    return {
      content: `
        <div class="marker-content">
          <div class="marker-header">
            <div class="marker-title-container">
              <div class="marker-title">${markerData.label || 'Unnamed Marker'}</div>
            </div>
            ${markerData.description ? `<div class="marker-description">${markerData.description}</div>` : ''}
          </div>
          <div class="marker-actions">
            <button type="button" id="${deleteId}" class="delete-button">Delete</button>
            <button type="button" id="${editId}" class="edit-button">Edit</button>
          </div>
        </div>
      `,
      editId,
      deleteId
    };
  };

  const bindMarkerEvents = (marker, markerData, map, popup) => {
    console.log('Binding events for marker with data:', markerData);  // Debug log
    
    // Create initial popup if not exists
    if (!popup) {
      popup = L.popup({
        className: 'custom-popup',
        closeButton: true,
        autoClose: false,
        closeOnClick: false
      });
      marker.bindPopup(popup);
    }

    // Store marker data in the marker instance to ensure it persists
    marker.markerData = markerData;

    // Function to show view mode
    const showViewMode = () => {
      const { content, editId, deleteId } = createViewPopupContent(marker.markerData);
      popup.setContent(content);
      
      // Get buttons after content is set
      const deleteBtn = document.getElementById(deleteId);
      const editBtn = document.getElementById(editId);

      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          try {
            if (!selectedCampaign) throw new Error('No campaign selected');
            if (!window.confirm('Are you sure you want to delete this marker?')) return;

            deleteBtn.disabled = true;
            console.log('Deleting marker with ID:', marker.markerData.id);  // Debug log
            const response = await fetch(`http://localhost:3001/api/maps/${mapId}/markers/${marker.markerData.id}?campaign_id=${selectedCampaign.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to delete marker');

            marker.closePopup();
            map.removeLayer(marker);
            setMarkers(prev => prev.filter(m => m.id !== marker.markerData.id));
          } catch (error) {
            console.error('Error deleting marker:', error);
            deleteBtn.disabled = false;
            alert('Failed to delete marker: ' + error.message);
          }
        };
      }

      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation();  // Prevent map click handler from firing
          const { content, formId, deleteId, submitId } = createPopupContent(marker.markerData, false);
          popup.setContent(content);
          
          // Get form elements after setting content
          const form = document.getElementById(formId);
          const cancelBtn = document.getElementById(deleteId);
          const submitBtn = document.getElementById(submitId);

          if (cancelBtn) {
            cancelBtn.onclick = () => showViewMode();
          }

          if (submitBtn && form) {
            submitBtn.onclick = async () => {
              try {
                if (!selectedCampaign) throw new Error('No campaign selected');
                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }

                submitBtn.disabled = true;
                const formData = new FormData(form);
                const updatedMarker = {
                  id: marker.markerData.id,
                  map_id: Number(mapId),
                  campaign_id: selectedCampaign.id,
                  lat: Number(marker.markerData.lat),
                  lng: Number(marker.markerData.lng),
                  label: formData.get('label') || '',
                  description: formData.get('description') || '',
                  color: formData.get('color') || '#FF0000'
                };

                console.log('Updating marker with ID:', marker.markerData.id, updatedMarker);  // Debug log

                const response = await fetch(`http://localhost:3001/api/maps/${mapId}/markers/${marker.markerData.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedMarker)
                });

                if (!response.ok) throw new Error('Failed to update marker');
                
                const savedMarker = await response.json();
                const parsedMarker = {
                  ...savedMarker,
                  lat: Number(savedMarker.lat),
                  lng: Number(savedMarker.lng),
                  label: formData.get('label') || '',
                  description: formData.get('description') || '',
                  color: formData.get('color') || '#FF0000',
                  campaign_id: selectedCampaign.id,
                  map_id: Number(mapId)
                };
                
                setMarkers(prev => prev.map(m => m.id === parsedMarker.id ? parsedMarker : m));
                marker.setIcon(createMarkerIcon(parsedMarker.color));
                
                // Update marker data and show view mode
                marker.markerData = parsedMarker;
                showViewMode();
              } catch (error) {
                console.error('Error updating marker:', error);
                submitBtn.disabled = false;
                alert('Failed to update marker: ' + error.message);
              }
            };
          }
        };
      }
    };

    // Add click handler
    marker.on('click', () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer !== marker) {
          layer.closePopup();
        }
      });
      
      marker.openPopup();
      showViewMode();
    });

    // Initialize with view mode
    showViewMode();
    return popup;
  };

  const addMarkersToMap = (markersData, targetMap) => {
    if (!targetMap || !targetMap.getContainer()) {
      console.warn('Map not ready for markers');
      return;
    }

    // Only clear temporary markers
    targetMap.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer.options.permanent) {
        targetMap.removeLayer(layer);
      }
    });

    // Add new markers
    markersData.forEach(markerData => {
      if (!markerData || typeof markerData.lat !== 'number' || typeof markerData.lng !== 'number') {
        console.warn('Invalid marker data:', markerData);
        return;
      }

      try {
        // Remove any existing marker with the same ID
        targetMap.eachLayer((layer) => {
          if (layer instanceof L.Marker && layer.markerData && layer.markerData.id === markerData.id) {
            targetMap.removeLayer(layer);
          }
        });

        // Create new marker with dragging enabled
        const marker = L.marker([markerData.lat, markerData.lng], {
          icon: createMarkerIcon(markerData.color || '#FF0000'),
          permanent: true,
          draggable: true
        });

        // Store marker data immediately
        marker.markerData = { ...markerData };

        // Handle drag end
        marker.on('dragend', async () => {
          const newPos = marker.getLatLng();
          try {
            const response = await fetch(`http://localhost:3001/api/maps/${mapId}/markers/${marker.markerData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...marker.markerData,
                lat: newPos.lat,
                lng: newPos.lng
              })
            });

            if (!response.ok) {
              throw new Error('Failed to update marker position');
            }

            // Update the marker data with new position
            marker.markerData = {
              ...marker.markerData,
              lat: newPos.lat,
              lng: newPos.lng
            };

            // Update markers state with new position
            setMarkers(prev => prev.map(m => 
              m.id === marker.markerData.id 
                ? { ...m, lat: newPos.lat, lng: newPos.lng }
                : m
            ));
          } catch (error) {
            console.error('Error updating marker position:', error);
            // Revert to original position
            marker.setLatLng([marker.markerData.lat, marker.markerData.lng]);
            alert('Failed to update marker position');
          }
        });

        // Add drag handler to update marker data during drag
        marker.on('drag', (e) => {
          const pos = e.target.getLatLng();
          e.target.markerData = {
            ...e.target.markerData,
            lat: pos.lat,
            lng: pos.lng
          };
        });

        // Bind all events
        bindMarkerEvents(marker, markerData, targetMap);

        // Add to map
        marker.addTo(targetMap);
      } catch (error) {
        console.error('Error adding marker:', markerData, error);
      }
    });
  };

  // Initialize map when data is ready
  useEffect(() => {
    if (!mapData || !imageDimensions || !mapContainerRef.current) return;

    try {
      console.log('Initializing map with dimensions:', imageDimensions);
      
      // Clean up any existing map first
      cleanupMap();

      const bounds = [[0, 0], [imageDimensions.height, imageDimensions.width]];
      const map = L.map(mapContainerRef.current, {
        crs: L.CRS.Simple,
        maxZoom: 2,
        minZoom: -2,
        maxBounds: bounds,
        zoomControl: true
      });

      // Store the map instance in the ref
      leafletMapRef.current = map;

      // Add the image overlay immediately
      const imageOverlay = L.imageOverlay(`http://localhost:3001/maps/${mapData.path}`, bounds).addTo(map);
      map.fitBounds(bounds);

      // Add click handler for new markers
      map.on('click', (e) => {
        // Only handle map clicks if we're not clicking a marker or popup
        const isMarkerClick = e.originalEvent.target.closest('.leaflet-marker-icon');
        const isPopupClick = e.originalEvent.target.closest('.leaflet-popup');

        // If clicking on a marker or popup, ignore
        if (isMarkerClick || isPopupClick) {
          return;
        }

        // Check if any tooltips are open
        let hasOpenTooltip = false;
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker && layer.isPopupOpen()) {
            hasOpenTooltip = true;
            layer.closePopup();
          }
        });

        // Only create new marker if no tooltips were open
        if (!hasOpenTooltip) {
          if (!selectedCampaign) {
            alert('Please select a campaign first');
            return;
          }

          const tempMarker = L.marker(e.latlng, {
            icon: createMarkerIcon('#FF0000'),
            permanent: false,
            draggable: true  // Enable dragging for temp marker
          });

          const tempMarkerData = {
            map_id: Number(mapId),
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            label: '',
            description: '',
            color: '#FF0000',
            campaign_id: selectedCampaign.id
          };

          // Update temp marker data during drag
          tempMarker.on('drag', (e) => {
            const pos = e.target.getLatLng();
            tempMarkerData.lat = pos.lat;
            tempMarkerData.lng = pos.lng;
          });

          const { content, formId, deleteId, submitId } = createPopupContent(tempMarkerData, true);
          const popup = L.popup({
            className: 'custom-popup',
            closeButton: true,
            autoClose: false,
            closeOnClick: false
          }).setContent(content);

          tempMarker.bindPopup(popup);
          tempMarker.addTo(map);
          tempMarker.openPopup();

          // Remove temp marker when popup is closed
          popup.on('remove', () => {
            map.removeLayer(tempMarker);
          });

          // Get form elements after popup is added to DOM
          setTimeout(() => {
            const form = document.getElementById(formId);
            const cancelBtn = document.getElementById(deleteId);
            const submitBtn = document.getElementById(submitId);

            if (cancelBtn) {
              cancelBtn.onclick = () => {
                map.removeLayer(tempMarker);
              };
            }

            if (submitBtn && form) {
              submitBtn.onclick = async () => {
                try {
                  if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                  }

                  submitBtn.disabled = true;
                  const formData = new FormData(form);
                  const newMarker = {
                    map_id: Number(mapId),
                    campaign_id: selectedCampaign.id,
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                    label: formData.get('label') || '',
                    description: formData.get('description') || '',
                    color: formData.get('color') || '#FF0000'
                  };

                  const response = await fetch(`http://localhost:3001/api/maps/${mapId}/markers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMarker)
                  });

                  if (!response.ok) throw new Error('Failed to create marker');
                  
                  const savedMarker = await response.json();
                  map.removeLayer(tempMarker);

                  // Refresh markers from server to ensure we have the latest data
                  await fetchMarkers();

                  // No need to create permanent marker here since fetchMarkers will handle it
                  submitBtn.disabled = false;

                } catch (error) {
                  console.error('Error creating marker:', error);
                  submitBtn.disabled = false;
                  alert('Failed to create marker: ' + error.message);
                }
              };
            }
          }, 0);
        }
      });

      // Handle ESC key to close popups
      const handleEscKey = (e) => {
        if (e.key === 'Escape' && leafletMapRef.current) {
          leafletMapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              layer.closePopup();
            }
          });
        }
      };

      // Add ESC key listener
      document.addEventListener('keydown', handleEscKey);

      // Add existing markers if any
      if (markers.length > 0) {
        console.log('Adding existing markers:', markers.length);
        addMarkersToMap(markers, map);
      }

      setIsLoading(false);

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleEscKey);
        cleanupMap();
      };

    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }
  }, [mapData, imageDimensions]); // Remove markers dependency

  // Add separate effect for marker updates
  useEffect(() => {
    if (leafletMapRef.current && markers.length > 0) {
      console.log('Updating markers on map');
      addMarkersToMap(markers, leafletMapRef.current);
    }
  }, [markers]);

  const handleMarkerCreate = () => {};
  const handleMarkerUpdate = () => {};
  const handleMarkerDelete = () => {};
  const handleMarkerEdit = () => {};

  if (isLoading || !mapData || !imageDimensions) {
    return (
      <div className="map-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {isLoading ? (
        <div className="loading">Loading map...</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              {mapData?.name}
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                aria-label="map settings"
                style={{ marginLeft: '8px', color: '#111827' }}
              >
                <DotsThreeVertical size={24} />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleRenameMap}>Rename Map</MenuItem>
                <MenuItem onClick={handleDeleteMap} style={{ color: '#d32f2f' }}>Delete Map</MenuItem>
              </Menu>
            </h2>
          </div>
          <div ref={mapContainerRef} style={{ height: 'calc(100vh - 80px)', width: '100%' }} />
        </>
      )}
    </div>
  );
};

export default Maps;
