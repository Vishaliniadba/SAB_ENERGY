import React, { useState, useEffect } from 'react';
import { Sun, Moon, Radio, Activity, ChevronRight } from 'lucide-react';
import { useEnergyData } from '../../context/EnergyDataContext';

export const Header = ({ activeTab }) => {
  const { config } = useEnergyData();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sab_theme_mode') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sab_theme_mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbs = () => {
    switch (activeTab) {
      case 'dashboard':
        return { section: 'Overview', page: 'Energy Dashboard' };
      case 'devices':
      case 'gateways':
        return { section: 'Connectivity', page: 'Gateways & Devices' };
      case 'asset-mapping':
        return { section: 'Asset Management', page: 'Asset-to-Meter Mapping' };
      case 'meter-profile':
      case 'meter-profiles':
        return { section: 'Device Profiles', page: 'Meter Profiles' };
      case 'meter-make':
      case 'make-master':
        return { section: 'Device Profiles', page: 'Meter Makes' };
      case 'meter-model':
      case 'model-master':
        return { section: 'Device Profiles', page: 'Meter Models' };
      case 'gateway-make':
      case 'gateway-make-master':
        return { section: 'Gateway Management', page: 'Gateway Makes' };
      case 'gateway-model':
      case 'gateway-model-master':
        return { section: 'Gateway Management', page: 'Gateway Models' };
      case 'parameter-dictionary':
        return { section: 'Device Profiles', page: 'Parameter Dictionary' };
      case 'communication-config':
      case 'comm-config':
      case 'config':
        return { section: 'Connectivity', page: 'Communication Config' };
      default:
        return { section: 'SaB Energy', page: 'Dashboard' };
    }
  };

  const breadcrumbs = getBreadcrumbs();

  const pollingDisplay =
    config.polling_interval_unit === 'minutes'
      ? `${config.polling_interval_value || Math.round((config.polling_interval_seconds || 60) / 60) || 1}m`
      : `${config.polling_interval_seconds || 5}s`;

  return (
    <header
      style={{
        height: '56px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-header)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
      }}
    >
      {/* Breadcrumb Hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          {breadcrumbs.section}
        </span>
        <ChevronRight size={14} color="var(--text-dim)" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 650 }}>
          {breadcrumbs.page}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Polling Interval Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--status-success-bg)',
            border: '1px solid var(--status-success-border)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            color: 'var(--status-success-text)',
            fontWeight: 600,
          }}
          title="Telemetry Polling Interval"
        >
          <span className="pulse-dot animate-pulse" style={{ backgroundColor: 'var(--status-success-text)' }} />
          <span>Polling: {pollingDisplay}</span>
        </div>

        {/* Real-time Clock */}
        <div
          className="mono-num"
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            fontWeight: 550,
            minWidth: '80px',
            textAlign: 'right',
            letterSpacing: '0.02em',
          }}
          title="Current System Time"
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
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand-primary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={13} color="#F2C66D" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={13} color="#475569" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
