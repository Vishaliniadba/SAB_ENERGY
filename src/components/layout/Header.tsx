import React, { useState, useEffect } from 'react';
import { ChevronRight, Bell, Menu } from 'lucide-react';
import { enerlinkApi } from '../../services/enerlinkApi';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());
  const [brokerOnline, setBrokerOnline] = useState<boolean | null>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll MQTT Broker Status every 30s with consecutive-failure debouncing
  useEffect(() => {
    let isMounted = true;
    let consecutiveFailures = 0;

    const checkBroker = async () => {
      try {
        const res = await enerlinkApi.getBrokerStatus();

        // If it was a network/transport error (e.g. transient HTTP timeout), do not false-flag broker as offline
        if (res?.networkError) {
          return;
        }

        const online = Boolean(res?.data?.isConnected ?? res?.isConnected ?? (res?.isSuccess && res?.data !== false));
        if (online) {
          consecutiveFailures = 0;
          if (isMounted) setBrokerOnline(true);
        } else {
          consecutiveFailures += 1;
          // Only flag offline if 2 consecutive probes fail to prevent false positives from brief MQTT keepalive reconnects
          if (consecutiveFailures >= 2) {
            if (isMounted) setBrokerOnline(false);
          } else {
            // Fast retry in 3 seconds to re-verify before showing offline
            setTimeout(() => {
              if (isMounted) checkBroker();
            }, 3000);
          }
        }
      } catch {
        // Retain previous state on unexpected errors
      }
    };
    checkBroker();
    const interval = setInterval(checkBroker, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getBreadcrumbs = () => {
    switch (activeTab) {
      case 'dashboard':
        return { section: '', page: 'Dashboard' };
      case 'devices':
      case 'gateways':
        return { section: '', page: 'Gateway' };
      case 'asset-mapping':
        return { section: '', page: 'Asset Mapping' };
      case 'meter-profile':
      case 'meter-profiles':
        return { section: 'Meter Master', page: 'Meter Profile' };
      case 'meter-make':
      case 'make-master':
        return { section: 'Meter Master', page: 'Meter Makes' };
      case 'meter-model':
      case 'model-master':
        return { section: 'Meter Master', page: 'Meter Models' };
      case 'gateway-make':
      case 'gateway-make-master':
        return { section: 'Gateway Master', page: 'Gateway Makes' };
      case 'gateway-model':
      case 'gateway-model-master':
        return { section: 'Gateway Master', page: 'Gateway Models' };
      case 'parameter-dictionary':
        return { section: 'Meter Master', page: 'Parameter' };
      case 'communication-config':
      case 'comm-config':
      case 'config':
        return { section: '', page: 'Configuration' };
      case 'geolocation':
      case 'geo':
      case 'maps':
        return { section: '', page: 'Geolocation' };
      case 'concern-master':
        return { section: 'Other Masters', page: 'Concern' };
      case 'location-master':
        return { section: 'Other Masters', page: 'Location' };
      case 'service-no-master':
        return { section: 'Other Masters', page: 'Service' };
      case 'service-master':
      case 'service':
      case 'services':
        return { section: 'Other Masters', page: 'Master Management' };
      default:
        return { section: '', page: 'Dashboard' };
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header
      style={{
        height: '52px',
        flexShrink: 0,
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        borderBottom: '1px solid var(--border-color, #E2E8E5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
      }}
    >
      {/* Breadcrumb Hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', minWidth: 0, overflow: 'hidden' }}>
        <button
          className="header-mobile-menu-btn"
          onClick={() => window.dispatchEvent(new Event('toggle-sab-sidebar'))}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={17} />
        </button>
        {breadcrumbs.section && (
          <>
            <span
              className="header-breadcrumb-section"
              style={{
                color: 'var(--ca-badge-rust, #BD621F)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {breadcrumbs.section}
            </span>
            <ChevronRight className="header-breadcrumb-chevron" size={14} color="var(--text-secondary, #64748B)" style={{ flexShrink: 0 }} />
          </>
        )}
        <span
          className="header-breadcrumb-page"
          style={{
            color: 'var(--sidebar-navy-primary, #0C1E36)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {breadcrumbs.page}
        </span>
      </div>

      {/* Right Actions & Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* MQTT Broker Status Badge */}
        <div
          className="header-broker-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: brokerOnline ? '#ECFDF5' : 'rgba(220, 38, 38, 0.1)',
            border: `1px solid ${brokerOnline ? '#A7F3D0' : 'rgba(220, 38, 38, 0.25)'}`,
            padding: '3px 9px',
            borderRadius: 'var(--input-radius, 7px)',
            fontSize: '0.74rem',
            color: brokerOnline ? '#047857' : 'var(--error-color, #DC2626)',
            fontWeight: 650,
            boxShadow: brokerOnline ? '0 1px 2px rgba(16, 185, 129, 0.08)' : 'none',
          }}
          title="MQTT Telemetry Broker Connection Status"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: brokerOnline ? '#10B981' : 'var(--error-color, #DC2626)',
              boxShadow: brokerOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
              flexShrink: 0,
            }}
          />
          <span className="header-badge-text">{brokerOnline ? 'Broker Online' : 'Broker Offline'}</span>
        </div>

        {/* Polling Interval Indicator */}
        <div
          className="header-polling-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(189, 98, 31, 0.10)',
            border: '1px solid rgba(217, 162, 107, 0.35)',
            padding: '3px 9px',
            borderRadius: 'var(--input-radius, 8px)',
            fontSize: '0.74rem',
            color: '#BD621F',
            fontWeight: 650,
          }}
          title="Telemetry Polling Interval"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#BD621F',
              flexShrink: 0,
            }}
          />
          <span>Polling: 5m</span>
        </div>

        {/* Real-time Clock */}
        <div
          className="header-clock"                                                                                                      
          style={{
            fontSize: '0.78rem',                                                                  
            color: 'var(--text-secondary, #64748B)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            padding: '0 4px',
          }}
          title="System Clock"
        >
          {currentTime}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--input-radius, 7px)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color, #E2E8E5)',
            color: 'var(--text-secondary, #64748B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="System Notifications"
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
};

export default Header;
