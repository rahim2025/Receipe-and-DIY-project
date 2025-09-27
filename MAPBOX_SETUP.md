# Mapbox Integration Setup

## Quick Start

The location system now includes interactive Mapbox maps for better vendor discovery and location services.

## Setup Instructions

### 1. Install Mapbox GL JS
```bash
npm install mapbox-gl
```

### 2. Get Free Mapbox Access Token
1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create a free account (50,000 requests/month included)
3. Create a new access token
4. Copy your token

### 3. Configure Environment Variables
Create or update your `.env` file in the frontend directory:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your-actual-mapbox-token-here
```

### 4. Restart Development Server
```bash
npm run dev
```

## Features

### 🗺️ Interactive Maps
- **Vendor Discovery**: Interactive map showing local vendors with markers
- **Search Integration**: Address search with autocomplete suggestions
- **Geolocation**: Find vendors near your location
- **Business Details**: Click markers to view vendor information

### 📍 Location Services
- **Geocoding**: Convert addresses to coordinates using Mapbox API
- **Reverse Geocoding**: Get address from coordinates
- **Place Search**: Autocomplete search for locations worldwide
- **Distance Calculations**: Show distances to vendors

### 🎛️ Map Controls
- **View Toggle**: Switch between map and list view
- **Navigation**: Zoom, pan, and geolocate controls
- **User Location**: Shows your current position on map
- **Responsive Design**: Works on desktop and mobile

## Usage

### In Vendors Page
1. Click "Map View" button to see interactive map
2. Use location selector to search for places
3. View vendor markers and click for details
4. Toggle back to "List View" for traditional cards

### Location Selector Enhanced
- Type in search box for location suggestions
- Autocomplete powered by Mapbox Places API
- Select from dropdown or press Enter to geocode
- Fallback to manual entry if needed

## API Limits

Mapbox provides generous free tier:
- **50,000 requests/month** for geocoding
- **50,000 map loads/month**
- **Unlimited** map interactions

## Fallback Behavior

The system gracefully handles missing configuration:
- Shows helpful error messages if token missing
- Falls back to manual location entry
- Provides links to Mapbox signup
- Works without Mapbox for basic functionality

## Map Styles Available

- Streets (default)
- Outdoors
- Light
- Dark
- Satellite
- Satellite Streets

## Technical Details

### Components
- `MapboxMap.jsx` - Interactive map component
- `LocationSelector.jsx` - Enhanced with Mapbox search
- `mapbox.js` - Utility functions for Mapbox API

### Dependencies
- `mapbox-gl` - Interactive maps
- Dynamic imports for optional loading
- Environment variable configuration

## Troubleshooting

### "Mapbox GL JS not installed"
Run: `npm install mapbox-gl`

### "Mapbox token not configured"
1. Check your `.env` file exists in frontend folder
2. Ensure variable name is `VITE_MAPBOX_ACCESS_TOKEN`
3. Restart development server after adding token

### Map not loading
1. Check browser console for errors
2. Verify token is valid at [Mapbox Account](https://account.mapbox.com/)
3. Check network connection

### Performance Issues
1. Limit number of vendor markers displayed
2. Use map bounds to filter visible vendors
3. Consider clustering for large datasets

---

**Ready to explore!** The location system now provides professional-grade mapping capabilities with the reliability of Mapbox's global infrastructure.