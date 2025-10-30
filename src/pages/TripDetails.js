import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "../components/MapView";
import LogSheet from "../components/LogSheet";
import api from "../api/api";

export default function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTripDetails();
    fetchTripLogs();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const response = await api.get(`/trips/${id}/`);
      setTrip(response.data);
    } catch (err) {
      setError("Failed to load trip details.");
      console.error("Error fetching trip:", err);
    }
  };

  const fetchTripLogs = async () => {
    try {
      const response = await api.get(`/logs/?trip=${id}`);
      setLogs(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading trip details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/" className="btn">← Back to Home</Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container">
        <div className="error">Trip not found.</div>
        <Link to="/" className="btn">← Back to Home</Link>
      </div>
    );
  }

  // Calculate HOS compliance metrics
  const totalDrivingHours = logs.reduce((sum, log) => sum + (log.driving_hours || 0), 0);
  const totalOnDutyHours = logs.reduce((sum, log) => sum + (log.on_duty_hours || 0), 0);
  const dailyDrivingLimit = 11;
  const dailyOnDutyLimit = 14;
  const cycleLimitRemaining = 70 - trip.current_cycle_used;

  return (
    <div className="container">
      <div style={{marginBottom: '20px'}}>
        <Link to="/" className="btn" style={{marginRight: '10px'}}>← Back to Home</Link>
      </div>

      <div className="trip-card">
        <h2>Trip Details</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
          <div>
            <p><strong>Pickup Location:</strong> {trip.pickup_location}</p>
            <p><strong>Dropoff Location:</strong> {trip.dropoff_location}</p>
            <p><strong>Current Location:</strong> {trip.current_location}</p>
          </div>
          <div>
            <p><strong>Distance:</strong> {trip.distance} miles</p>
            <p><strong>Cycle Hours Used:</strong> {trip.current_cycle_used}/70</p>
            <p><strong>Created:</strong> {new Date(trip.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* HOS Compliance Summary */}
      <div className="log-summary">
        <h3>HOS Compliance Summary</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
          <div className="log-item">
            <div>Daily Driving</div>
            <div>{totalDrivingHours.toFixed(1)}/{dailyDrivingLimit}h</div>
          </div>
          <div className="log-item">
            <div>Daily On-Duty</div>
            <div>{totalOnDutyHours.toFixed(1)}/{dailyOnDutyLimit}h</div>
          </div>
          <div className="log-item">
            <div>70-Hour Cycle</div>
            <div>{trip.current_cycle_used}/70h</div>
          </div>
          <div className="log-item">
            <div>Remaining Cycle</div>
            <div style={{color: cycleLimitRemaining < 10 ? '#dc3545' : '#28a745'}}>
              {cycleLimitRemaining.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Compliance Warnings */}
        <div style={{marginTop: '15px'}}>
          {totalDrivingHours > dailyDrivingLimit && (
            <div className="error">
              ⚠️ Daily driving limit exceeded ({totalDrivingHours.toFixed(1)} {'>'}  {dailyDrivingLimit} hours)
            </div>
          )}
          {totalOnDutyHours > dailyOnDutyLimit && (
            <div className="error">
              ⚠️ Daily on-duty limit exceeded ({totalOnDutyHours.toFixed(1)} {'>'} {dailyOnDutyLimit} hours)
            </div>
          )}
          {trip.current_cycle_used > 70 && (
            <div className="error">
              ⚠️ 70-hour cycle limit exceeded ({trip.current_cycle_used} {'>'} 70 hours)
            </div>
          )}
          {cycleLimitRemaining < 10 && cycleLimitRemaining > 0 && (
            <div style={{color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', padding: '10px', borderRadius: '5px'}}>
              ⚠️ Less than 10 hours remaining in 70-hour cycle
            </div>
          )}
        </div>
      </div>

      {/* Map View */}
      <div>
        <h3>Route Map</h3>
        <MapView trip={trip} route={trip.route_data?.coordinates} />
        <p style={{color: '#666', fontSize: '14px', marginTop: '10px'}}>
          * Map shows general US view. Route integration with OpenRouteService API can be implemented for actual routing.
        </p>
      </div>

      {/* Log Sheet Component */}
      <LogSheet trip={trip} logs={logs} />
    </div>
  );
}