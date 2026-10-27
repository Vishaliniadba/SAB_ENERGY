import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Server,
  Activity,
  Layers,
  Building2,
  Cpu,
  Radio,
  Sliders,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const MENU_STRUCTURE = [
  {
    type: 'item',
    id: 'dashboard',
    label: 'Energy Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'item',
    id: 'devices',
    label: 'Gateways & Devices',
    icon: Server,
  },
  {
    type: 'item',
    id: 'asset-mapping',
    label: 'Asset-to-Meter Mapping',
    icon: Activity,
  },
  {
    type: 'item',
    id: 'communication-config',
    label: 'Comm Configuration',
    icon: Radio,
  },
  {
    type: 'group',
    id: 'meter-master',
    label: 'Meter Master',
    icon: Layers,
    items: [
      { id: 'meter-profile', label: 'Meter Profile', icon: Layers },
      { id: 'meter-make', label: 'Meter Makes', icon: Building2 },
      { id: 'meter-model', label: 'Meter Models', icon: Cpu },
      { id: 'parameter-dictionary', label: 'Parameter', icon: Sliders },
    ],
  },
  {
    type: 'group',
    id: 'gateway-masters',
    label: 'Gateway Masters',
    icon: Cpu,
    items: [
      { id: 'gateway-make', label: 'Gateway Makes', icon: Building2 },
      { id: 'gateway-model', label: 'Gateway Models', icon: Cpu },
    ],
  },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sab_sidebar_collapsed') === 'true';
  });

  // Accordion open/close state when sidebar is expanded
  const [openSections, setOpenSections] = useState({
    'meter-master': true,
    'gateway-masters': true,
  });

  // Floating flyout popup state for collapsed mode
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sab_sidebar_collapsed', String(next));
      return next;
    });
    setFlyoutMenu(null);
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

  const isGroupActive = (group) => {
    return group.items.some((item) => isTabActive(item.id));
  };

  // Flyout trigger handlers (used in collapsed sidebar)
  const handleItemMouseEnter = (entry, event) => {
    if (!isCollapsed) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (entry.type === 'group') {
      setFlyoutMenu({
        id: entry.id,
        title: entry.label,
        icon: entry.icon,
        items: entry.items,
        isGroup: true,
        rect,
      });
    } else {
      setFlyoutMenu({
        id: entry.id,
        title: entry.label,
        icon: entry.icon,
        items: [{ id: entry.id, label: entry.label, icon: entry.icon }],
        isGroup: false,
        rect,
      });
    }
  };

  const handleItemMouseLeave = () => {
    if (!isCollapsed) return;
    closeTimeoutRef.current = setTimeout(() => {
      setFlyoutMenu(null);
    }, 180);
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setFlyoutMenu(null);
    }, 180);
  };

  // Render a standard nav item button (expanded or collapsed single)
  const renderNavButton = (id, label, Icon, isChild = false) => {
    const active = isTabActive(id);

    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          setFlyoutMenu(null);
        }}
        title={isCollapsed ? label : undefined}
        style={{
          width: isCollapsed ? '42px' : '100%',
          height: isCollapsed ? '42px' : 'auto',
          margin: isCollapsed ? '0 auto' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: isCollapsed ? 0 : '10px',
          padding: isCollapsed
            ? 0
            : isChild
            ? '7px 12px 7px 28px'
            : '8px 12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          borderRadius: isCollapsed ? '8px' : 'var(--radius-sm)',
          border: isCollapsed && active ? '1px solid var(--sidebar-active-indicator)' : 'none',
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
        {active && !isCollapsed && (
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
          size={isCollapsed ? 19 : 17}
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

  // Render a group section button in collapsed mode
  const renderCollapsedGroupButton = (group) => {
    const active = isGroupActive(group);
    const GroupIcon = group.icon;
    const isHoveredInFlyout = flyoutMenu && flyoutMenu.id === group.id;

    return (
      <div
        key={group.id}
        onMouseEnter={(e) => handleItemMouseEnter(group, e)}
        onMouseLeave={handleItemMouseLeave}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <button
          onClick={() => {
            // Clicking group in collapsed mode navigates to its first item
            if (group.items[0]) {
              setActiveTab(group.items[0].id);
              setFlyoutMenu(null);
            }
          }}
          style={{
            width: '42px',
            height: '42px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: active ? '1px solid var(--sidebar-active-indicator)' : 'none',
            backgroundColor: active
              ? 'var(--sidebar-active-bg)'
              : isHoveredInFlyout
              ? 'var(--bg-sidebar-hover)'
              : 'transparent',
            color: active || isHoveredInFlyout ? '#FFFFFF' : 'var(--text-sidebar-muted)',
            cursor: 'pointer',
            transition: 'all 0.14s ease',
            position: 'relative',
          }}
          title={group.label}
        >
          <GroupIcon
            size={19}
            color={active ? 'var(--sidebar-active-indicator)' : 'var(--text-sidebar-dim)'}
            style={{ flexShrink: 0 }}
          />
        </button>
      </div>
    );
  };

  return (
    <>
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
          <div
            onClick={isCollapsed ? toggleCollapse : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
              cursor: isCollapsed ? 'pointer' : 'default',
            }}
            title={isCollapsed ? 'Click to expand sidebar' : undefined}
          >
            <img
              src="/logo.png"
              alt="SaB Energy Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              }}
            />

            {!isCollapsed && (
              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-sidebar)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  SaB Energy
                </h1>
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
            padding: isCollapsed ? '16px 0' : '10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: isCollapsed ? '8px' : '2px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {MENU_STRUCTURE.map((entry, entryIdx) => {
            if (entry.type === 'item') {
              if (isCollapsed) {
                return (
                  <div
                    key={entry.id}
                    onMouseEnter={(e) => handleItemMouseEnter(entry, e)}
                    onMouseLeave={handleItemMouseLeave}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  >
                    {renderNavButton(entry.id, entry.label, entry.icon)}
                  </div>
                );
              }
              return renderNavButton(entry.id, entry.label, entry.icon);
            }

            if (entry.type === 'group') {
              if (isCollapsed) {
                return (
                  <React.Fragment key={entry.id}>
                    {entryIdx === 4 && (
                      <div
                        style={{
                          height: '1px',
                          backgroundColor: 'var(--border-sidebar)',
                          margin: '4px auto',
                          width: '32px',
                        }}
                      />
                    )}
                    {renderCollapsedGroupButton(entry)}
                  </React.Fragment>
                );
              }

              // Expanded group view with accordion header
              const isOpen = Boolean(openSections[entry.id]);
              return (
                <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [entry.id]: !prev[entry.id],
                      }))
                    }
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px 4px 10px',
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
                    <span>{entry.label}</span>
                    {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {entry.items.map((sub) => renderNavButton(sub.id, sub.label, sub.icon, true))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* Bottom Controls / Expand Action */}
        <div
          style={{
            padding: isCollapsed ? '12px 0' : '12px 14px',
            borderTop: '1px solid var(--border-sidebar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            flexShrink: 0,
          }}
        >
          <button
            onClick={toggleCollapse}
            style={{
              width: isCollapsed ? '42px' : '30px',
              height: isCollapsed ? '42px' : '30px',
              margin: isCollapsed ? '0 auto' : undefined,
              borderRadius: isCollapsed ? '8px' : 'var(--radius-sm)',
              color: 'var(--text-sidebar-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.14s ease',
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
              e.currentTarget.style.color = 'var(--text-sidebar)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-sidebar-muted)';
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={16} />}
          </button>

          {!isCollapsed && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-sidebar-dim)' }}>
              v2.4 Enterprise
            </span>
          )}
        </div>
      </aside>

      {/* ── FLOATING FLYOUT POPUP (APPEARS ON HOVER IN COLLAPSED MODE) ── */}
      {flyoutMenu && (
        <div
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
          style={{
            position: 'fixed',
            top: `${Math.min(
              Math.max(12, flyoutMenu.rect.top),
              window.innerHeight - (flyoutMenu.items.length * 40 + (flyoutMenu.isGroup ? 55 : 20))
            )}px`,
            left: `${flyoutMenu.rect.right + 8}px`,
            zIndex: 99999,
            minWidth: flyoutMenu.isGroup ? '210px' : '180px',
            maxWidth: '240px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.20), 0 6px 14px -3px rgba(0, 0, 0, 0.10)',
            padding: '7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'flyoutFadeIn 0.14s ease-out',
            pointerEvents: 'auto',
          }}
        >
          {/* Header Title (Matches reference image) */}
          <div
            onClick={
              !flyoutMenu.isGroup
                ? () => {
                    setActiveTab(flyoutMenu.id);
                    setFlyoutMenu(null);
                  }
                : undefined
            }
            style={{
              padding: '7px 10px 8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              borderBottom: flyoutMenu.isGroup ? '1px solid var(--border-subtle)' : 'none',
              marginBottom: flyoutMenu.isGroup ? '4px' : '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: !flyoutMenu.isGroup ? 'pointer' : 'default',
            }}
          >
            {!flyoutMenu.isGroup && flyoutMenu.icon && (
              <flyoutMenu.icon size={15} color="var(--brand-primary)" />
            )}
            <span>{flyoutMenu.title}</span>
          </div>

          {/* Sub-items (for groups) */}
          {flyoutMenu.isGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {flyoutMenu.items.map((sub) => {
                const active = isTabActive(sub.id);
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveTab(sub.id);
                      setFlyoutMenu(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: active ? 'var(--brand-surface)' : 'transparent',
                      color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: active ? 650 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
                        e.currentTarget.style.color = 'var(--brand-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    <SubIcon
                      size={16}
                      color={active ? 'var(--brand-primary)' : 'var(--text-secondary)'}
                      style={{ flexShrink: 0 }}
                    />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};
