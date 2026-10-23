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
  BookOpen,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Signal,
  Sliders,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  // Collapsible state for Master sub-menus
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isMeterMasterOpen, setIsMeterMasterOpen] = useState(true);
  const [isGatewayMasterOpen, setIsGatewayMasterOpen] = useState(true);

  // Top main navigation items
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'Gateway', icon: Server },
    { id: 'asset-mapping', label: 'Asset Mapping', icon: Activity },
    { id: 'meter-profile', label: 'Meter Profile', icon: Layers },
    { id: 'communication-config', label: 'Communication Config', icon: Radio },
  ];

  // Meter sub-items (Make, Model, Parameter)
  const meterMasterItems = [
    { id: 'meter-make', label: 'Make', icon: Building2 },
    { id: 'meter-model', label: 'Model', icon: Cpu },
    { id: 'parameter-dictionary', label: 'Parameter', icon: Sliders },
  ];

  // Gateway sub-items (Make, Model)
  const gatewayMasterItems = [
    { id: 'gateway-make', label: 'Make', icon: Building2 },
    { id: 'gateway-model', label: 'Model', icon: Cpu },
  ];

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

  const isAnyMasterActive = [
    'meter-make', 'make-master',
    'meter-model', 'model-master',
    'gateway-make', 'gateway-make-master',
    'gateway-model', 'gateway-model-master',
    'parameter-dictionary'
  ].includes(activeTab);

  const renderNavBtn = (item, level = 0) => {
    const Icon = item.icon;
    const active = isTabActive(item.id);

    const padLeft = level === 0 ? '14px' : level === 1 ? '22px' : '30px';

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `9px 12px 9px ${padLeft}`,
          borderRadius: '8px',
          border: active
            ? '1px solid transparent'
            : '1px solid transparent',
          backgroundColor: active
            ? '#2271b1'
            : 'transparent',
          color: active ? '#ffffff' : '#a7aaad',
          fontWeight: active ? 600 : 400,
          fontSize: level > 0 ? '0.84rem' : '0.88rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          textAlign: 'left',
          boxShadow: 'none',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = '#2c3338';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#a7aaad';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Icon
            size={level > 0 ? 15 : 17}
            color={active ? '#ffffff' : '#8c8f94'}
            style={{ flexShrink: 0 }}
          />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
        </div>

        {item.badge && (
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#3c434a',
              color: active ? '#ffffff' : '#a7aaad',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: '254px',
        backgroundColor: '#1d2327',
        borderRight: '1px solid #1d2327',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #3c434a',
          backgroundColor: '#1d2327',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
            flexShrink: 0,
          }}
        >
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            SaB Energy
          </h1>
          <span
            style={{
              fontSize: '0.68rem',
              color: '#72aee6',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '1px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#72aee6',
                boxShadow: '0 0 6px #72aee6',
              }}
            />
            SCADA Node Active
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {/* Main top navigation items */}
        {mainItems.map((item) => renderNavBtn(item, 0))}

        {/* ── MASTER SECTION AS SUB-MENU ── */}
        <div style={{ marginTop: '12px' }}>
          {/* Master Section Toggle */}
          <button
            onClick={() => setIsMasterOpen((prev) => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isAnyMasterActive ? '#72aee6' : '#a7aaad',
              borderRadius: '4px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c3338')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: isAnyMasterActive ? '#72aee6' : '#8c8f94',
                }}
              >
                Master
              </span>
            </div>
            {isMasterOpen ? (
              <ChevronDown size={14} color={isAnyMasterActive ? '#72aee6' : '#8c8f94'} />
            ) : (
              <ChevronRight size={14} color={isAnyMasterActive ? '#72aee6' : '#8c8f94'} />
            )}
          </button>

          {isMasterOpen && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                marginTop: '4px',
                paddingLeft: '4px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                marginLeft: '8px',
              }}
            >
              {/* Group A: Meter Master */}
              <div>
                <button
                  onClick={() => setIsMeterMasterOpen((prev) => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8c8f94',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c3338')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: '#8c8f94' }}>Meter</span>
                  {isMeterMasterOpen ? <ChevronDown size={12} color="#8c8f94" /> : <ChevronRight size={12} color="#8c8f94" />}
                </button>

                {isMeterMasterOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {meterMasterItems.map((item) => renderNavBtn(item, 1))}
                  </div>
                )}
              </div>

              {/* Group B: Gateway Master */}
              <div style={{ marginTop: '6px' }}>
                <button
                  onClick={() => setIsGatewayMasterOpen((prev) => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8c8f94',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c3338')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: '#8c8f94' }}>Gateway</span>
                  {isGatewayMasterOpen ? <ChevronDown size={12} color="#8c8f94" /> : <ChevronRight size={12} color="#8c8f94" />}
                </button>

                {isGatewayMasterOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {gatewayMasterItems.map((item) => renderNavBtn(item, 1))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};
