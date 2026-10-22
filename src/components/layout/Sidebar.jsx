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
  ];

  // Meter sub-items
  const meterMasterItems = [
    { id: 'meter-make', label: 'Make', icon: Building2 },
    { id: 'meter-model', label: 'Model', icon: Cpu },
  ];

  // Gateway sub-items (Make, Model, Parameter)
  const gatewayMasterItems = [
    { id: 'gateway-make', label: 'Make', icon: Building2 },
    { id: 'gateway-model', label: 'Model', icon: Cpu },
    { id: 'parameter-dictionary', label: 'Parameter', icon: Sliders },
  ];

  const isTabActive = (id) => {
    if (id === 'devices') return activeTab === 'devices' || activeTab === 'gateways';
    if (id === 'meter-profile') return activeTab === 'meter-profile' || activeTab === 'meter-profiles';
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
            ? '1px solid rgba(56, 189, 248, 0.4)'
            : '1px solid transparent',
          backgroundColor: active
            ? 'rgba(2, 132, 199, 0.18)'
            : 'transparent',
          color: active ? '#38bdf8' : '#94a3b8',
          fontWeight: active ? 600 : 500,
          fontSize: level > 0 ? '0.84rem' : '0.88rem',
          cursor: 'pointer',
          transition: 'all 0.16s ease',
          textAlign: 'left',
          boxShadow: active
            ? 'inset 3px 0 0 #38bdf8, 0 2px 8px rgba(2, 132, 199, 0.12)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.color = '#f8fafc';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Icon
            size={level > 0 ? 15 : 17}
            color={active ? '#38bdf8' : '#64748b'}
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
              backgroundColor: active ? 'rgba(56, 189, 248, 0.25)' : '#1e293b',
              color: active ? '#38bdf8' : '#64748b',
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
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0b1120',
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
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            SaB Energy
          </h1>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#10b981',
              fontWeight: 600,
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
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
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
              color: isAnyMasterActive ? '#38bdf8' : '#94a3b8',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: isAnyMasterActive ? '#38bdf8' : '#64748b',
                }}
              >
                Master
              </span>
            </div>
            {isMasterOpen ? (
              <ChevronDown size={14} color={isAnyMasterActive ? '#38bdf8' : '#64748b'} />
            ) : (
              <ChevronRight size={14} color={isAnyMasterActive ? '#38bdf8' : '#64748b'} />
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
                borderLeft: '1px solid rgba(148, 163, 184, 0.15)',
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
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: '#94a3b8' }}>Meter</span>
                  {isMeterMasterOpen ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
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
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: '#94a3b8' }}>Gateway</span>
                  {isGatewayMasterOpen ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
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
