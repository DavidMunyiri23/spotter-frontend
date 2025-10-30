import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import LogSheet from "../components/LogSheet";
import api from "../api/api";

export default function ELDLogsPage({ eldLogs: propEldLogs }) {
  const [eldLogs, setEldLogs] = useState(propEldLogs);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(!propEldLogs);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  const { tripId } = useParams();

  useEffect(() => {
    if (propEldLogs) {
      setEldLogs(propEldLogs);
      setSelectedLog(propEldLogs.daily_logs?.[0]);
      setLoading(false);
      return;
    }
    
    fetchTripsWithEldLogs();
  }, [propEldLogs]);

  const fetchTripsWithEldLogs = async () => {
    try {
      setLoading(true);
      // Get all trips first
      const tripsResponse = await api.get("/trips/");
      const allTrips = tripsResponse.data.results || [];
      
      // Filter trips that have ELD logs
      const tripsWithLogs = [];
      for (const trip of allTrips) {
        if (trip.eld_logs && trip.eld_logs.length > 0) {
          tripsWithLogs.push({
            ...trip,
            eldLogs: { daily_logs: trip.eld_logs, total_days: trip.eld_logs.length }
          });
        } else {
          // Try to fetch ELD logs from the dedicated endpoint
          try {
            const eldResponse = await api.get(`/trips/${trip.id}/eld-logs/`);
            if (eldResponse.data.success && eldResponse.data.eld_logs.length > 0) {
              tripsWithLogs.push({
                ...trip,
                eldLogs: {
                  daily_logs: eldResponse.data.eld_logs,
                  total_days: eldResponse.data.eld_logs.length
                }
              });
            }
          } catch (eldErr) {
            // Trip doesn't have ELD logs, skip it
            console.log(`No ELD logs for trip ${trip.id}`);
          }
        }
      }
      
      setTrips(tripsWithLogs);
      
      // If we have a specific trip ID from URL, select it
      if (tripId) {
        const specificTrip = tripsWithLogs.find(t => t.id === tripId);
        if (specificTrip) {
          setSelectedTrip(specificTrip);
          setEldLogs(specificTrip.eldLogs);
          setSelectedLog(specificTrip.eldLogs.daily_logs[0]);
        }
      } else if (tripsWithLogs.length > 0) {
        // Select the most recent trip
        const recentTrip = tripsWithLogs[0];
        setSelectedTrip(recentTrip);
        setEldLogs(recentTrip.eldLogs);
        setSelectedLog(recentTrip.eldLogs.daily_logs[0]);
      }
      
    } catch (err) {
      setError("Failed to load ELD logs. Please ensure you have created trips with route calculations.");
      console.error("Error fetching ELD logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setEldLogs(trip.eldLogs);
    setSelectedLog(trip.eldLogs.daily_logs[0]);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading ELD logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" className="btn btn-primary">Go back to Dashboard</a>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>📊 No ELD Logs Available</h3>
          <p>No trips with ELD logs found. Please create a trip and calculate its route to generate ELD logs.</p>
          <a href="/" className="btn btn-primary">Create Your First Trip</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="eld-logs-container">
        <div className="logs-sidebar">
          <h3>Available Trips with ELD Logs</h3>
          <div className="trip-selector">
            {trips.map((trip, index) => (
              <div
                key={trip.id}
                className={`trip-selector-item ${selectedTrip?.id === trip.id ? 'active' : ''}`}
                onClick={() => handleTripSelect(trip)}
              >
                <div className="trip-selector-header">
                  <strong>{trip.pickup_location} → {trip.dropoff_location}</strong>
                </div>
                <div className="trip-selector-info">
                  {trip.eldLogs.total_days} day(s) • {new Date(trip.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          
          {eldLogs && (
            <div className="log-days-selector">
              <h4>Daily Log Sheets ({eldLogs.total_days} Days)</h4>
              <div className="log-list">
                {eldLogs.daily_logs.map((log, index) => (
                  <div
                    key={index}
                    className={`log-list-item ${selectedLog === log ? 'active' : ''}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="log-list-date">
                      Day {log.day_of_trip} - {new Date(log.date).toLocaleDateString()}
                    </div>
                    <div className="log-list-summary">
                      {log.total_drive_time?.toFixed(1)}h driving, {log.distance_traveled} miles
                    </div>
                    <div className={`log-list-status ${log.hos_compliant ? 'compliant' : 'non-compliant'}`}>
                      {log.hos_compliant ? '✅' : '❌'} {log.hos_compliant ? 'Compliant' : 'Violations'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="log-display">
          {selectedLog && <LogSheet dailyLog={selectedLog} />}
        </div>
      </div>
    </div>
  );
}