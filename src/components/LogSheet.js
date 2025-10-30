import React from "react";

export default function LogSheet({ dailyLog }) {
  if (!dailyLog) return null;

  const statusColors = {
    'off_duty': '#28a745',
    'sleeper_berth': '#6f42c1', 
    'driving': '#dc3545',
    'on_duty_not_driving': '#ffc107'
  };

  const statusLabels = {
    'off_duty': 'Off Duty',
    'sleeper_berth': 'Sleeper Berth',
    'driving': 'Driving',
    'on_duty_not_driving': 'On Duty (Not Driving)'
  };

  const formatTime = (slot) => {
    const hour = Math.floor(slot / 4);
    const minute = (slot % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const renderLogGrid = () => {
    const grid = dailyLog.log_sheet_data?.grid || [];
    const hours = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourSlots = [];
      for (let quarter = 0; quarter < 4; quarter++) {
        const slotIndex = hour * 4 + quarter;
        const status = grid[slotIndex] || 'off_duty';
        hourSlots.push(
          <div 
            key={slotIndex}
            className="time-slot"
            style={{ backgroundColor: statusColors[status] }}
            title={`${formatTime(slotIndex)} - ${statusLabels[status]}`}
          />
        );
      }
      
      hours.push(
        <div key={hour} className="hour-block">
          <div className="hour-label">{hour.toString().padStart(2, '0')}</div>
          <div className="slots">{hourSlots}</div>
        </div>
      );
    }
    
    return hours;
  };

  return (
    <div className="log-sheet">
      <div className="log-header">
        <h3>📄 Daily Log Sheet - Day {dailyLog.day_of_trip}</h3>
        <div className="log-date">{new Date(dailyLog.date).toLocaleDateString()}</div>
      </div>

      <div className="driver-info">
        <div className="info-row">
          <span className="label">Driver:</span>
          <span className="value">{dailyLog.driver_name}</span>
        </div>
        <div className="info-row">
          <span className="label">Carrier:</span>
          <span className="value">{dailyLog.carrier_name}</span>
        </div>
        <div className="info-row">
          <span className="label">Vehicle:</span>
          <span className="value">{dailyLog.vehicle_id}</span>
        </div>
        <div className="info-row">
          <span className="label">Trailer:</span>
          <span className="value">{dailyLog.trailer_id}</span>
        </div>
      </div>

      <div className="log-grid-container">
        <h4>24-Hour Duty Status Grid</h4>
        <div className="status-legend">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: statusColors[status] }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
        
        <div className="log-grid">
          {renderLogGrid()}
        </div>
      </div>

      <div className="duty-summary">
        <h4>Daily Summary</h4>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Driving Time:</span>
            <span className="stat-value">{dailyLog.total_drive_time?.toFixed(1)}h</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">On Duty Time:</span>
            <span className="stat-value">{dailyLog.total_on_duty_time?.toFixed(1)}h</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Off Duty Time:</span>
            <span className="stat-value">{dailyLog.total_off_duty_time?.toFixed(1)}h</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Distance:</span>
            <span className="stat-value">{dailyLog.distance_traveled?.toFixed(0)} mi</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Odometer Start:</span>
            <span className="stat-value">{dailyLog.odometer_start?.toLocaleString()}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Odometer End:</span>
            <span className="stat-value">{dailyLog.odometer_end?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="duty-status-changes">
        <h4>Duty Status Changes</h4>
        <div className="status-changes-list">
          {dailyLog.duty_status_changes?.map((change, index) => (
            <div key={index} className="status-change">
              <div className="change-time">{change.time}</div>
              <div 
                className="change-status"
                style={{ backgroundColor: statusColors[change.status] }}
              >
                {statusLabels[change.status]}
              </div>
              <div className="change-location">{change.location}</div>
              <div className="change-notes">{change.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {dailyLog.violations && dailyLog.violations.length > 0 && (
        <div className="violations-section">
          <h4>⚠️ HOS Violations</h4>
          {dailyLog.violations.map((violation, index) => (
            <div key={index} className="violation-item">
              {violation}
            </div>
          ))}
        </div>
      )}

      <div className="compliance-status">
        <div className={`compliance-badge ${dailyLog.hos_compliant ? 'compliant' : 'non-compliant'}`}>
          {dailyLog.hos_compliant ? '✅ HOS Compliant' : '❌ HOS Violations'}
        </div>
      </div>
    </div>
  );
}