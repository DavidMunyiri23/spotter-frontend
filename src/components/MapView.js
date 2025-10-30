import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView({ trip, route = null, coordinates = null, routeData = null }) {
  console.log('MapView rendering with:', { coordinates, route, routeData }); // Debug log
  
  // Default center of US
  const defaultCenter = [39.5, -98.35];
  const defaultZoom = 4;

  // Create markers for trip locations
  const markers = [];
  let mapCenter = defaultCenter;
  let mapZoom = defaultZoom;
  
  // Use coordinates from route calculation if available
  if (coordinates) {
    // Add current location marker
    if (coordinates.current) {
      markers.push({
        position: coordinates.current,
        popup: `🚛 Current Location`,
        color: 'blue',
        icon: 'truck'
      });
      mapCenter = coordinates.current;
      mapZoom = 8;
    }
    
    // Add pickup location marker
    if (coordinates.pickup) {
      markers.push({
        position: coordinates.pickup,
        popup: `📦 Pickup Location`,
        color: 'green',
        icon: 'pickup'
      });
    }
    
    // Add dropoff location marker
    if (coordinates.dropoff) {
      markers.push({
        position: coordinates.dropoff,
        popup: `🎯 Dropoff Location`,
        color: 'red',
        icon: 'dropoff'
      });
    }
  } else if (trip) {
    // Fallback to trip coordinates
    if (trip.pickup_coordinates) {
      markers.push({
        position: trip.pickup_coordinates,
        popup: `Pickup: ${trip.pickup_location}`,
        color: 'green',
        icon: 'pickup'
      });
    }
    
    if (trip.dropoff_coordinates) {
      markers.push({
        position: trip.dropoff_coordinates,
        popup: `Dropoff: ${trip.dropoff_location}`,
        color: 'red',
        icon: 'dropoff'
      });
    }
    
    if (trip.current_coordinates) {
      markers.push({
        position: trip.current_coordinates,
        popup: `Current: ${trip.current_location}`,
        color: 'blue',
        icon: 'truck'
      });
      mapCenter = trip.current_coordinates;
      mapZoom = 8;
    }
  }

  // Add rest stops and fuel stops along the route
  if (routeData && coordinates) {
    const totalDistance = routeData.combined_route?.distance_miles || 0;
    const hosPlans = routeData.hos_plan?.daily_plans || [];
    
    // Calculate intermediate stops based on HOS plan
    let accumulatedDistance = 0;
    hosPlans.forEach((dayPlan, dayIndex) => {
      const dayDistance = dayPlan.distance_miles || 0;
      
      // Add mandatory rest stop at end of each day (except last day)
      if (dayIndex < hosPlans.length - 1) {
        const progress = (accumulatedDistance + dayDistance) / totalDistance;
        if (coordinates.pickup && coordinates.dropoff && progress > 0 && progress < 1) {
          const restLat = coordinates.pickup[0] + (coordinates.dropoff[0] - coordinates.pickup[0]) * progress;
          const restLng = coordinates.pickup[1] + (coordinates.dropoff[1] - coordinates.pickup[1]) * progress;
          
          markers.push({
            position: [restLat, restLng],
            popup: `🛏️ Mandatory Rest Stop - Day ${dayIndex + 1}\n10-hour off-duty period`,
            color: 'purple',
            icon: 'rest'
          });
        }
      }
      
      // Add fuel stops if needed
      const fuelStops = dayPlan.fuel_stops || 0;
      for (let i = 0; i < fuelStops; i++) {
        const fuelProgress = (accumulatedDistance + (dayDistance * (i + 1) / (fuelStops + 1))) / totalDistance;
        if (coordinates.pickup && coordinates.dropoff && fuelProgress > 0 && fuelProgress < 1) {
          const fuelLat = coordinates.pickup[0] + (coordinates.dropoff[0] - coordinates.pickup[0]) * fuelProgress;
          const fuelLng = coordinates.pickup[1] + (coordinates.dropoff[1] - coordinates.pickup[1]) * fuelProgress;
          
          markers.push({
            position: [fuelLat, fuelLng],
            popup: `⛽ Fuel Stop ${i + 1} - Day ${dayIndex + 1}\n30-minute refueling`,
            color: 'orange',
            icon: 'fuel'
          });
        }
      }
      
      accumulatedDistance += dayDistance;
    });
  }

  // Custom icon creation
  const createCustomIcon = (color, iconType) => {
    const iconConfig = {
      truck: { html: '🚛', className: 'custom-truck-icon' },
      pickup: { html: '📦', className: 'custom-pickup-icon' },
      dropoff: { html: '🎯', className: 'custom-dropoff-icon' },
      rest: { html: '🛏️', className: 'custom-rest-icon' },
      fuel: { html: '⛽', className: 'custom-fuel-icon' }
    };

    const config = iconConfig[iconType] || iconConfig.truck;
    
    return L.divIcon({
      html: `<div style="background-color: ${color}; border-radius: 50%; padding: 5px; text-align: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${config.html}</div>`,
      className: config.className,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <div className="map-container">
      <div className="map-legend">
        <h4>🗺️ Route Information</h4>
        <div className="legend-items">
          <div className="legend-item"><span className="legend-icon">🚛</span> Current Location</div>
          <div className="legend-item"><span className="legend-icon">📦</span> Pickup Location</div>
          <div className="legend-item"><span className="legend-icon">🎯</span> Dropoff Location</div>
          <div className="legend-item"><span className="legend-icon">🛏️</span> Mandatory Rest Stops</div>
          <div className="legend-item"><span className="legend-icon">⛽</span> Fuel Stops</div>
        </div>
        {routeData && (
          <div className="route-stats">
            <div className="stat">
              <strong>Total Distance:</strong> {routeData.combined_route?.distance_miles?.toFixed(1)} miles
            </div>
            <div className="stat">
              <strong>Estimated Time:</strong> {routeData.combined_route?.duration_hours?.toFixed(1)} hours
            </div>
            <div className="stat">
              <strong>Days Required:</strong> {routeData.hos_plan?.total_days_needed} days
            </div>
          </div>
        )}
      </div>
      
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render route if available */}
        {route && route.length > 0 && (
          <Polyline 
            positions={route} 
            color="#007bff" 
            weight={5}
            opacity={0.8}
          />
        )}
        
        {/* Render markers with custom icons */}
        {markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={marker.position}
            icon={createCustomIcon(marker.color, marker.icon)}
          >
            <Popup>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {marker.popup.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {routeData && routeData.combined_route?.instructions && (
        <div className="route-instructions">
          <h4>📋 Route Instructions</h4>
          <div className="instructions-list">
            {routeData.combined_route.instructions.slice(0, 5).map((instruction, index) => (
              <div key={index} className="instruction-item">
                <div className="instruction-distance">
                  {instruction.distance?.toFixed(1)} mi
                </div>
                <div className="instruction-text">
                  {instruction.instruction}
                </div>
              </div>
            ))}
            {routeData.combined_route.instructions.length > 5 && (
              <div className="instruction-item more-instructions">
                ... and {routeData.combined_route.instructions.length - 5} more instructions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}