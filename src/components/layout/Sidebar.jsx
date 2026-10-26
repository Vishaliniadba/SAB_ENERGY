import React, { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  Activity,
  Layers,
  Building2,
  Cpu,
  Zap,
  Radio,
  Sliders,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sab_sidebar_collapsed') === 'true';
  });

  // Collapsible sub-sections
  const [isProfilesOpen, setIsProfilesOpen] = useState(true);
  const [isGatewaysOpen, setIsGatewaysOpen] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sab_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isTabActive = (id) => {
    if (id === 'devices') return activeTab === 'devices' || activeTab === 'gateways';
    if (id === 'meter-profile') return activeTab === 'meter-profile' || activeTab === 'meter-profiles';
    if (id === 'communication-config') return activeTab === 'communication-config' || activeTab === 'comm-config' || activeTab === 'config';
    if (id === 'meter-make') return activeTab === 'meter-make' || activeTab === 'make-master';
    if (id === 'meter-model') return activeTab === 'meter-model' || activeTab === 'model-master';
    if (id === 'gateway-make') return activeTab === 'gateway-make' || activeTab === 'gateway-make-master';
    if (id === 'gateway-model') return activeTab === 'gateway-model' || activeTab === 'gateway-model-master';
    if (id === 'parameter-dictionary') return activeTab === 'parameter-dictionary' || activeTab === 'parameter';
    return activeTab === id;
  };

  const renderNavItem = (id, label, Icon, isChild = false) => {
    const active = isTabActive(id);

    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        title={isCollapsed ? label : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: isCollapsed
            ? '9px 0'
            : isChild
            ? '7px 12px 7px 28px'
            : '8px 12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
          color: active ? '#FFFFFF' : 'var(--text-sidebar-muted)',
          fontSize: isChild ? '0.80rem' : '0.835rem',
          fontWeight: active ? 600 : 450,
          cursor: 'pointer',
          transition: 'all 0.14s ease',
          textAlign: 'left',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
            e.currentTarget.style.color = 'var(--text-sidebar)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-sidebar-muted)';
          }
        }}
      >
        {active && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '4px',
              bottom: '4px',
              width: '3px',
              borderRadius: '0 2px 2px 0',
              backgroundColor: 'var(--sidebar-active-indicator)',
            }}
          />
        )}
        <Icon
          size={17}
          color={active ? 'var(--sidebar-active-indicator)' : 'var(--text-sidebar-dim)'}
          style={{ flexShrink: 0 }}
        />
        {!isCollapsed && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        )}
      </button>
    );
  };

  const renderSectionHeader = (label, isOpen, onToggle) => {
    if (isCollapsed) {
      return (
        <div
          style={{
            height: '1px',
            backgroundColor: 'var(--border-sidebar)',
            margin: '8px 10px',
          }}
        />
      );
    }

    return (
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px 4px 10px',
          marginTop: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-sidebar-dim)',
          fontSize: '0.675rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius-xs)',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-sidebar)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-sidebar-dim)')}
      >
        <span>{label}</span>
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '244px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        transition: 'width 0.18s ease',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '56px',
          padding: isCollapsed ? '0 12px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-sidebar)',
          backgroundColor: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #16805D 0%, #0D5D45 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
            }}
          >
            <Zap size={18} color="#FFFFFF" />
          </div>

          {!isCollapsed && (
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: '0.975rem',
                  fontWeight: 700,
                  color: 'var(--text-sidebar)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                SaB Energy
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--sidebar-active-indicator)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  lineHeight: 1,
                  marginTop: '1px',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--sidebar-active-indicator)',
                  }}
                />
                EMS Platform
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="btn-icon"
            style={{ color: 'var(--text-sidebar-dim)' }}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        style={{
          padding: isCollapsed ? '10px 6px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* 1. Overview */}
        {renderNavItem('dashboard', 'Energy Dashboard', LayoutDashboard)}

        {/* 2. Connectivity */}
        {renderNavItem('devices', 'Gateways & Devices', Server)}
        {renderNavItem('communication-config', 'Comm Configuration', Radio)}

        {/* 3. Asset Management */}
        {renderNavItem('asset-mapping', 'Asset-to-Meter Mapping', Activity)}

        {/* 4. Device Profiles Accordion */}
        {renderSectionHeader('Device Profiles', isProfilesOpen, () => setIsProfilesOpen((p) => !p))}
        {(isProfilesOpen || isCollapsed) && (
          <>
            {renderNavItem('meter-profile', 'Meter Profiles', Layers, !isCollapsed)}
            {renderNavItem('meter-make', 'Meter Makes', Building2, !isCollapsed)}
            {renderNavItem('meter-model', 'Meter Models', Cpu, !isCollapsed)}
            {renderNavItem('parameter-dictionary', 'Parameter Dictionary', Sliders, !isCollapsed)}
          </>
        )}

        {/* 5. Gateway Management Accordion */}
        {renderSectionHeader('Gateway Masters', isGatewaysOpen, () => setIsGatewaysOpen((p) => !p))}
        {(isGatewaysOpen || isCollapsed) && (
          <>
            {renderNavItem('gateway-make', 'Gateway Makes', Building2, !isCollapsed)}
            {renderNavItem('gateway-model', 'Gateway Models', Cpu, !isCollapsed)}
          </>
        )}
      </nav>

      {/* Bottom Controls / Expand Action */}
      {isCollapsed && (
        <div
          style={{
            padding: '10px',
            borderTop: '1px solid var(--border-sidebar)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={toggleCollapse}
            className="btn-icon"
            style={{ color: 'var(--text-sidebar-muted)' }}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};
