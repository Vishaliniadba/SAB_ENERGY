import React, { useState, useEffect } from 'react';
import { Database, Sun, Moon } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const Header = ({ activeTab }) => {
  const { config } = useEnergyData();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [theme, setTheme] = useState(() => {
    // Default to clean enterprise light theme
    const saved = localStorage.getItem('sab_theme_mode');
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sab_theme_mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

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
      case 'devices':
      case 'gateways':
        return 'Devices (ThingsBoard)';
      case 'asset-mapping':
        return 'Asset Mapping';
      case 'meter-profile':
      case 'meter-profiles':
        return 'Meter Profile';
      case 'meter-make':
      case 'make-master':
        return 'Meter Master — Make';
      case 'meter-model':
      case 'model-master':
        return 'Meter Master — Model';
      case 'gateway-make':
      case 'gateway-make-master':
        return 'Gateway Master — Make';
      case 'gateway-model':
      case 'gateway-model-master':
        return 'Gateway Master — Model';
      case 'parameter-dictionary':
        return 'Meter Master — Parameter';
      case 'communication-config':
      case 'comm-config':
      case 'config':
        return 'Communication Config';
      default:
        return 'SaB Energy';
    }
  };

  const pollingDisplay = config.polling_interval_unit === 'minutes'
    ? `${config.polling_interval_value || Math.round((config.polling_interval_seconds || 60) / 60) || 1}m (${config.polling_interval_seconds}s)`
    : `${config.polling_interval_seconds}s`;

  return (
    <header
      style={{
        height: '56px',
        flexShrink: 0,
        backgroundColor: '#1d2327',
        borderBottom: '1px solid #3c434a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
          {getBreadcrumbTitle()}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'rgba(0, 163, 42, 0.15)',
            border: '1px solid rgba(0, 163, 42, 0.3)',
            padding: '4px 11px',
            borderRadius: '4px',
            fontSize: '0.74rem',
            color: '#68de7c',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <span className="pulse-dot" style={{ backgroundColor: '#68de7c' }} />
          <span>Polling: {pollingDisplay}</span>
        </div>



        {/* Real-time Clock */}
        <div
          className="mono-num"
          style={{
            fontSize: '0.80rem',
            color: '#c3c4c7',
            fontWeight: 500,
            minWidth: '85px',
            textAlign: 'right',
          }}
        >
          {currentTime}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#c3c4c7',
            fontSize: '0.74rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#72aee6';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#c3c4c7';
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'SCADA Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} color="#f59e0b" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} color="#0284c7" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
