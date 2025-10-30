import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import TripDetails from './pages/TripDetails';
import ELDLogsPage from './pages/ELDLogsPage';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="app-navigation">
      <Link 
        to="/" 
        className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
      >
        🏠 Dashboard
      </Link>
      <Link 
        to="/eld-logs" 
        className={`nav-btn ${location.pathname === '/eld-logs' ? 'active' : ''}`}
      >
        📊 ELD Logs
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trip/:id" element={<TripDetails />} />
            <Route path="/eld-logs" element={<ELDLogsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;