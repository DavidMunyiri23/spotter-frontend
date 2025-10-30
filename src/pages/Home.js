import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TripForm from "../components/TripForm";
import MapView from "../components/MapView";
import api from "../api/api";

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [routePreview, setRoutePreview] = useState(null);
  const [eldLogs, setEldLogs] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get("/trips/");
      let tripsData = [];
      if (Array.isArray(response.data.results)) {
        tripsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        tripsData = response.data;
      } else {
        tripsData = [];
      }
      setTrips(tripsData);
    } catch (err) {
      setError("Failed to load trips. Please check if the backend is running.");
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCreated = (newTrip) => {
    setTrips([newTrip, ...trips]);
    setSelectedTrip(newTrip);
    // Clear previous route data when creating new trip
    setRoutePreview(null);
    setEldLogs(null);
  };

  const handleRouteCalculated = (routeData, eldData) => {
    setRoutePreview(routeData);
    setEldLogs(eldData);
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <TripForm 
        onTripCreated={handleTripCreated}
        onRouteCalculated={handleRouteCalculated}
      />
      
      {error && <div className="error">{error}</div>}

      {routePreview && routePreview.coordinates && (
        <div className="trip-details">
          <h2>🗺️ Route & Map View</h2>
          <MapView 
            trip={selectedTrip || {}} 
            route={routePreview.combined_route?.geometry || []}
            coordinates={routePreview.coordinates}
            routeData={routePreview}
          />
        </div>
      )}

      {eldLogs && eldLogs.daily_logs && eldLogs.daily_logs.length > 0 && (
        <div className="eld-preview">
          <h2>📄 Generated ELD Log Sheets</h2>
          <div className="eld-summary-cards">
            {eldLogs.daily_logs.map((log, index) => (
              <div key={index} className="eld-summary-card">
                <h4>Day {log.day_of_trip} - {new Date(log.date).toLocaleDateString()}</h4>
                <div className="summary-row">
                  <span>🚗 Driving: {log.total_drive_time?.toFixed(1)}h</span>
                  <span>📏 Distance: {log.distance_traveled} mi</span>
                  <span className={log.hos_compliant ? 'compliant' : 'non-compliant'}>
                    {log.hos_compliant ? '✅ Compliant' : '❌ Violations'}
                  </span>
                </div>
                {log.violations && log.violations.length > 0 && (
                  <div className="violations-preview">
                    <strong>⚠️ {log.violations.length} violation(s) detected</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Link to="/eld-logs" className="btn btn-primary">
            📊 View Detailed Log Sheets
          </Link>
        </div>
      )}
      
      <div className="trip-list">
        <h2>Recent Trips</h2>
        {Array.isArray(trips) && trips.length === 0 ? (
          <p>No trips found. Create your first trip above!</p>
        ) : (
          Array.isArray(trips) && trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <h3>
                <Link to={`/trip/${trip.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                  {trip.pickup_location} → {trip.dropoff_location}
                </Link>
              </h3>
              <p><strong>Current Location:</strong> {trip.current_location}</p>
              <p><strong>Cycle Hours Used:</strong> {trip.current_cycle_used}/70 hours</p>
              <p><strong>Distance:</strong> {trip.distance} miles</p>
              <p><strong>Created:</strong> {new Date(trip.created_at).toLocaleString()}</p>
              <p><strong>Logs:</strong> {trip.logs ? trip.logs.length : 0} entries</p>
              {/* Progress bar for cycle hours */}
              <div style={{marginTop: '10px'}}>
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((trip.current_cycle_used / 70) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: trip.current_cycle_used > 60 ? '#dc3545' : 
                                   trip.current_cycle_used > 50 ? '#ffc107' : '#28a745',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <small style={{color: '#666'}}>
                  {((trip.current_cycle_used / 70) * 100).toFixed(1)}% of 70-hour cycle used
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}