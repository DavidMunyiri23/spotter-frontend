import React, { useState } from "react";
import api from "../api/api";

export default function TripForm({ onTripCreated, onRouteCalculated }) {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: 0
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [routePreview, setRoutePreview] = useState(null);
  const [eldLogs, setEldLogs] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const calculateRoute = async () => {
    if (!form.current_location || !form.pickup_location || !form.dropoff_location) {
      setError("Please fill in all location fields first");
      return;
    }

    setCalculating(true);
    setError("");

    try {
      // Calculate route and HOS plan
      const routeResponse = await api.post("/calculate-route/", form);
      setRoutePreview(routeResponse.data);

      // Generate ELD logs
      const eldResponse = await api.post("/generate-eld-logs/", {
        trip_plan: routeResponse.data,
        start_date: new Date().toISOString().split('T')[0]
      });
      setEldLogs(eldResponse.data);

      // Call parent callback if provided
      if (onRouteCalculated) {
        onRouteCalculated(routeResponse.data, eldResponse.data);
      }

    } catch (err) {
      setError("Failed to calculate route. Please check your locations and try again.");
      console.error("Error calculating route:", err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!routePreview || !eldLogs) {
      setError("Please calculate route and generate ELD logs first");
      setLoading(false);
      return;
    }

    try {
      // Save complete trip data with route and ELD logs
      const tripData = {
        ...form,
        route_data: routePreview,
        eld_logs: eldLogs.daily_logs || []
      };
      
      const response = await api.post("/save-trip-with-eld/", tripData);
      
      if (response.data.success) {
        onTripCreated(response.data.trip);
        
        // Reset form and clear preview data
        setForm({
          current_location: "",
          pickup_location: "",
          dropoff_location: "",
          current_cycle_used: 0
        });
        setRoutePreview(null);
        setEldLogs(null);
      } else {
        setError("Failed to save trip: " + response.data.error);
      }
    } catch (err) {
      setError("Failed to create trip. Please try again.");
      console.error("Error creating trip:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Trip</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="current_location">Current Location</label>
          <input
            id="current_location"
            name="current_location"
            type="text"
            placeholder="Enter current location"
            value={form.current_location}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="pickup_location">Pickup Location</label>
          <input
            id="pickup_location"
            name="pickup_location"
            type="text"
            placeholder="Enter pickup location"
            value={form.pickup_location}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dropoff_location">Dropoff Location</label>
          <input
            id="dropoff_location"
            name="dropoff_location"
            type="text"
            placeholder="Enter dropoff location"
            value={form.dropoff_location}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="current_cycle_used">Current Cycle Hours Used</label>
          <input
            id="current_cycle_used"
            name="current_cycle_used"
            type="number"
            step="0.1"
            min="0"
            max="70"
            placeholder="Hours used in 70hr/8-day cycle"
            value={form.current_cycle_used}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={calculateRoute}
            disabled={calculating || !form.current_location || !form.pickup_location || !form.dropoff_location}
          >
            {calculating ? "Calculating..." : "Calculate Route & HOS Plan"}
          </button>
          
          <button type="submit" className="btn btn-primary" disabled={loading || !routePreview}>
            {loading ? "Creating..." : "Create Trip"}
          </button>
        </div>
      </form>

      {/* Route Preview */}
      {routePreview && (
        <div className="route-preview">
          <h3>📋 Trip Plan Summary</h3>
          <div className="route-summary">
            <div className="route-stats">
              <div className="stat">
                <span className="label">Total Distance:</span>
                <span className="value">{routePreview.combined_route?.distance_miles?.toFixed(1)} miles</span>
              </div>
              <div className="stat">
                <span className="label">Estimated Driving Time:</span>
                <span className="value">{routePreview.combined_route?.duration_hours?.toFixed(1)} hours</span>
              </div>
              <div className="stat">
                <span className="label">Days Required:</span>
                <span className="value">{routePreview.hos_plan?.total_days_needed} days</span>
              </div>
              <div className="stat">
                <span className="label">HOS Compliant:</span>
                <span className={`value ${routePreview.hos_plan?.cycle_compliant ? 'compliant' : 'non-compliant'}`}>
                  {routePreview.hos_plan?.cycle_compliant ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>

            <div className="daily-plan">
              <h4>📅 Daily Breakdown</h4>
              {routePreview.hos_plan?.daily_plans?.map((day, index) => (
                <div key={index} className="day-plan">
                  <strong>Day {day.day}:</strong>
                  <span>{day.driving_hours?.toFixed(1)}h driving, </span>
                  <span>{day.distance_miles?.toFixed(0)} miles, </span>
                  <span>{day.fuel_stops} fuel stops, </span>
                  <span>{day.mandatory_breaks} breaks</span>
                </div>
              ))}
            </div>

            {eldLogs && eldLogs.daily_logs && (
              <div className="eld-summary">
                <h4>📊 ELD Logs Generated</h4>
                <p>{eldLogs.total_days} daily log sheets created with detailed duty status changes</p>
                {eldLogs.daily_logs.some(log => log.violations?.length > 0) && (
                  <div className="warnings">
                    <h5>⚠️ HOS Violations Detected:</h5>
                    {eldLogs.daily_logs.map((log, index) => 
                      log.violations?.map((violation, vIndex) => (
                        <div key={`${index}-${vIndex}`} className="violation">
                          Day {log.day_of_trip}: {violation}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}