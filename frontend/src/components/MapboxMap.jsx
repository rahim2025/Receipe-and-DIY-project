import React, { useEffect, useRef, useState } from 'react';
import { mapboxConfig, validateMapboxToken, MAPBOX_ACCESS_TOKEN } from '../lib/mapbox.js';

const MapboxMap = ({ 
  vendors = [], 
  center, 
  zoom = 12, 
  height = '400px',
  onVendorClick = null,
  showUserLocation = true,
  userLocation = null
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mapboxgl, setMapboxgl] = useState(null);

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Check if mapbox-gl is available
        const mapboxModule = await import('mapbox-gl');
        const mapboxCSS = await import('mapbox-gl/dist/mapbox-gl.css');
        setMapboxgl(mapboxModule.default || mapboxModule);
      } catch (error) {
        console.warn('Mapbox GL JS not installed. Please install it with: npm install mapbox-gl');
        setError('Mapbox GL JS not installed. Please install the mapbox-gl package.');
      }
    };
    
    loadMapbox();
  }, []);

  useEffect(() => {
    if (!mapboxgl) return;
    
    // Validate Mapbox token
    if (!validateMapboxToken()) {
      setError('Mapbox token not configured. Please check your environment variables.');
      return;
    }

    if (map.current) return; // Initialize map only once

    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapboxConfig.style,
        center: center || mapboxConfig.center,
        zoom: zoom,
        attributionControl: true
      });

      map.current.on('load', () => {
        setIsLoaded(true);
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control if user location is enabled
        if (showUserLocation) {
          const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          });
          map.current.addControl(geolocate, 'top-right');
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map. Please check your internet connection.');
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxgl, center, zoom, showUserLocation]);

  // Update vendors markers
  useEffect(() => {
    if (!map.current || !isLoaded || !mapboxgl) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add vendor markers
    vendors.forEach(vendor => {
      if (!vendor.address?.coordinates) return;

      const [longitude, latitude] = vendor.address.coordinates;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'vendor-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      markerElement.innerHTML = '🏪';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${vendor.name}</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${vendor.description || 'Local vendor'}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Phone:</strong> ${vendor.phone || 'N/A'}</p>
          <p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Address:</strong> ${vendor.address?.displayLocation || 'N/A'}</p>
          ${vendor.hours && vendor.hours.length > 0 ? `
            <div style="font-size: 12px;">
              <strong>Hours:</strong>
              <ul style="margin: 4px 0 0 0; padding-left: 16px;">
                ${vendor.hours.slice(0, 3).map(hour => 
                  `<li>${hour.day}: ${hour.open} - ${hour.close}</li>`
                ).join('')}
                ${vendor.hours.length > 3 ? '<li>...</li>' : ''}
              </ul>
            </div>
          ` : ''}
          ${onVendorClick ? '<button onclick="this.dataset.clicked=true" style="margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button>' : ''}
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Handle vendor click
      if (onVendorClick) {
        markerElement.addEventListener('click', () => {
          onVendorClick(vendor);
        });
      }

      markers.current.push(marker);
    });

    // Fit map to show all vendors
    if (vendors.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      vendors.forEach(vendor => {
        if (vendor.address?.coordinates) {
          bounds.extend(vendor.address.coordinates);
        }
      });
      
      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
      }
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  }, [vendors, isLoaded, onVendorClick, userLocation, mapboxgl]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !isLoaded || !userLocation || !mapboxgl) return;

    // Remove existing user marker
    if (map.current.userMarker) {
      map.current.userMarker.remove();
    }

    // Create user location marker
    const userMarkerElement = document.createElement('div');
    userMarkerElement.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    map.current.userMarker = new mapboxgl.Marker(userMarkerElement)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<div style="padding: 8px;"><strong>Your Location</strong></div>'))
      .addTo(map.current);

  }, [userLocation, isLoaded, mapboxgl]);

  if (error) {
    return (
      <div 
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg"
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Get your free Mapbox token at: 
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      style={{ height }} 
      className="w-full rounded-lg border border-gray-300"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;