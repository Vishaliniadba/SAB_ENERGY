import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const Header = ({ activeTab }) => {
  const { config } = useEnergyData();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'gateways':
        return 'Gateways';
      case 'asset-mapping':
        return 'Asset Mapping';
      case 'meter-profile':
      case 'meter-profiles':
        return 'Meter Profile';
      case 'make-master':
        return 'Make Master';
      case 'model-master':
        return 'Model Master';
      case 'parameter-dictionary':
        return 'Parameter Dictionary';
      default:
        return 'SaB Energy';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 90
      }}
    >
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          {getBreadcrumbTitle()}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: '#059669',
            fontWeight: 600
          }}
        >
          <span className="pulse-dot" style={{ backgroundColor: '#059669' }} />
          <span>Polling: {config.polling_interval_seconds}s</span>
        </div>

        {/* Backend Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#475569',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '5px 10px',
            borderRadius: '8px',
            fontWeight: 500
          }}
        >
          <Database size={14} color="#0284c7" />
          <span>ASP.NET Backend Ready</span>
        </div>

        {/* Real-time Clock */}
        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
          {currentTime}
        </div>
      </div>
    </header>
  );
};
