import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Activity,
  Layers,
  Building2,
  Cpu,
  Zap,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const topItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gateways', label: 'Gateways', icon: Radio },
    { id: 'asset-mapping', label: 'Asset Mapping', icon: Activity },
  ];

  const profileItem = { id: 'meter-profile', label: 'Meter Profile', icon: Layers };

  // Master heading with Make and Model as sub-items
  const masterItems = [
    { id: 'make-master', label: 'Make', icon: Building2 },
    { id: 'model-master', label: 'Model', icon: Cpu },
  ];

  const isMasterActive = activeTab === 'make-master' || activeTab === 'model-master';

  const renderNavBtn = (item, isSubItem = false) => {
    const Icon = item.icon;
    const isActive =
      activeTab === item.id ||
      (item.id === 'meter-profile' && activeTab === 'meter-profiles');

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: isSubItem ? '9px 14px 9px 24px' : '11px 16px',
          borderRadius: '9px',
          border: isActive
            ? '1px solid rgba(56, 189, 248, 0.4)'
            : '1px solid transparent',
          backgroundColor: isActive
            ? 'rgba(2, 132, 199, 0.18)'
            : 'transparent',
          color: isActive ? '#38bdf8' : '#94a3b8',
          fontWeight: isActive ? 600 : 500,
          fontSize: isSubItem ? '0.86rem' : '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          textAlign: 'left',
          boxShadow: isActive
            ? 'inset 3px 0 0 #38bdf8, 0 2px 8px rgba(2, 132, 199, 0.15)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.color = '#f8fafc';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }
        }}
      >
        <Icon
          size={isSubItem ? 16 : 18}
          color={isActive ? '#38bdf8' : '#64748b'}
          style={{ transition: 'color 0.18s ease' }}
        />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#0f172a', // Premium deep industrial slate-navy
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '22px 20px',
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
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {/* Top Items: Dashboard, Gateways, Asset Mapping */}
        {topItems.map((item) => renderNavBtn(item))}

        {/* Meter Profile */}
        <div style={{ marginTop: '2px' }}>
          {renderNavBtn(profileItem)}
        </div>

        {/* Master Heading (Moved down below Meter Profile) */}
        <div style={{ marginTop: '14px' }}>
          <div
            style={{
              padding: '6px 14px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '0.67rem',
                fontWeight: 700,
                color: isMasterActive ? '#38bdf8' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Master
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: isMasterActive ? 'rgba(56, 189, 248, 0.3)' : '#1e293b',
              }}
            />
          </div>

          {/* Sub-headings: Make, Model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
            {masterItems.map((item) => renderNavBtn(item, true))}
          </div>
        </div>
      </nav>


    </aside>
  );
};
