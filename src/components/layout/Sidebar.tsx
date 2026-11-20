import React, { useState, useRef, useEffect } from 'react';
import { AssetMappingIcon, GatewayRouterIcon, LocationPinIcon, MasterCrownIcon } from '../common/CardIcons';
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
  ChevronLeft,
  Wrench,
  Zap,
  X,
  Menu,
  LogOut,
} from 'lucide-react';

const MASTER_CATEGORIES = [
  {
    id: 'meter-masters',
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
    id: 'gateway-masters',
    label: 'Gateway Master',
    icon: Cpu,
    items: [
      { id: 'gateway-make', label: 'Gateway Makes', icon: Building2 },
      { id: 'gateway-model', label: 'Gateway Models', icon: Cpu },
    ],
  },
  {
    id: 'other-masters',
    label: 'Other Masters',
    icon: MasterCrownIcon,
    items: [
      { id: 'concern-master', label: 'Concern', icon: Building2 },
      { id: 'location-master', label: 'Location', icon: LocationPinIcon },
      { id: 'service-no-master', label: 'Service', icon: Zap },
    ],
  },
];

const MENU_STRUCTURE = [
  {
    type: 'item',
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'item',
    id: 'devices',
    label: 'Gateway',
    icon: GatewayRouterIcon,
  },
  {
    type: 'item',
    id: 'asset-mapping',
    label: 'Asset Mapping',
    icon: AssetMappingIcon,
  },
  {
    type: 'item',
    id: 'communication-config',
    label: 'Configuration',
    icon: Radio,
  },
  {
    type: 'item',
    id: 'geolocation',
    label: 'Geolocation',
    icon: LocationPinIcon,
  },
  {
    type: 'group',
    id: 'master',
    label: 'Master',
    icon: MasterCrownIcon,
    subCategories: [
      {
        id: 'meter-masters',
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
        id: 'gateway-masters',
        label: 'Gateway Master',
        icon: Cpu,
        items: [
          { id: 'gateway-make', label: 'Gateway Makes', icon: Building2 },
          { id: 'gateway-model', label: 'Gateway Models', icon: Cpu },
        ],
      },
      {
        id: 'other-masters',
        label: 'Other Masters',
        icon: MasterCrownIcon,
        items: [
          { id: 'concern-master', label: 'Concern', icon: Building2 },
          { id: 'location-master', label: 'Location', icon: LocationPinIcon },
          { id: 'service-no-master', label: 'Service', icon: Zap },
        ],
      },
    ],
    items: [
      { id: 'meter-profile', label: 'Meter Profile', icon: Layers },
      { id: 'meter-make', label: 'Meter Makes', icon: Building2 },
      { id: 'meter-model', label: 'Meter Models', icon: Cpu },
      { id: 'parameter-dictionary', label: 'Parameter', icon: Sliders },
      { id: 'gateway-make', label: 'Gateway Makes', icon: Building2 },
      { id: 'gateway-model', label: 'Gateway Models', icon: Cpu },
      { id: 'concern-master', label: 'Concern', icon: Building2 },
      { id: 'location-master', label: 'Location', icon: LocationPinIcon },
      { id: 'service-no-master', label: 'Service', icon: Zap },
    ],
  },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
    return localStorage.getItem('sab_sidebar_collapsed') === 'true';
  });

  // Accordion open/close state when sidebar is expanded
  const [openSections, setOpenSections] = useState({
    'master': true,
  });

  const [openSubSections, setOpenSubSections] = useState({
    'meter-masters': true,
    'gateway-masters': false,
    'other-masters': false,
  });

  // Floating flyout popup state for collapsed mode
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const [flyoutOpenCat, setFlyoutOpenCat] = useState<string | null>(null);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth < 1024 && !mobile && !localStorage.getItem('sab_sidebar_collapsed')) {
        setIsCollapsed(true);
      }
    };
    const handleCustomToggle = () => setIsCollapsed((prev) => !prev);

    window.addEventListener('resize', handleResize);
    window.addEventListener('toggle-sab-sidebar', handleCustomToggle);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggle-sab-sidebar', handleCustomToggle);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (!isMobile) {
        localStorage.setItem('sab_sidebar_collapsed', String(next));
      }
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
    if (id === 'concern-master') return activeTab === 'concern-master';
    if (id === 'location-master') return activeTab === 'location-master';
    if (id === 'service-no-master') return activeTab === 'service-no-master';
    if (id === 'service-master') return activeTab === 'service-master' || activeTab === 'service' || activeTab === 'services';
    return activeTab === id;
  };

  const isGroupActive = (group) => {
    return group.items.some((item) => isTabActive(item.id));
  };

  // Auto-expand accordion section when an item within it is active
  useEffect(() => {
    MENU_STRUCTURE.forEach((entry: any) => {
      if (entry.type === 'group' && entry.items.some((it: any) => isTabActive(it.id))) {
        setOpenSections((prev) => (prev[entry.id] ? prev : { ...prev, [entry.id]: true }));
        if (entry.subCategories) {
          entry.subCategories.forEach((subCat: any) => {
            if (subCat.items.some((it: any) => isTabActive(it.id))) {
              setOpenSubSections((prev) => (prev[subCat.id] ? prev : { ...prev, [subCat.id]: true }));
            }
          });
        }
      }
    });
  }, [activeTab]);

  // Flyout trigger handlers (used in collapsed sidebar)
  const handleItemMouseEnter = (entry, event) => {
    if (!isCollapsed) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (entry.type === 'group') {
      setFlyoutOpenCat(null);
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
      setFlyoutOpenCat(null);
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
      setFlyoutOpenCat(null);
    }, 180);
  };

  // Render a standard nav item button (expanded or collapsed single)
  const renderNavButton = (id: string, label: string, Icon: any, isChild = false) => {
    const active = isTabActive(id);
    const isHovered = hoveredNavId === id;

    return (
      <button
        key={id}
        onClick={(e) => {
          setActiveTab(id);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sab_refresh_tab', { detail: { tab: id } }));
          }
          setFlyoutMenu(null);
          if (isMobile) {
            setIsCollapsed(true);
          }
          e.currentTarget.blur();
        }}
        onMouseEnter={() => setHoveredNavId(id)}
        onMouseLeave={(e) => {
          setHoveredNavId(null);
          e.currentTarget.blur();
        }}
        className={`sidebar-nav-btn ${isChild ? 'child-item' : ''} ${active ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
        title={isCollapsed ? label : undefined}
        style={{
          width: isCollapsed ? '38px' : '100%',
          height: isCollapsed ? '38px' : isChild ? '30px' : '38px',
          minHeight: isCollapsed ? '38px' : isChild ? '30px' : '38px',
          margin: isCollapsed ? '0 auto' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: isCollapsed ? 0 : isChild ? '8px' : '10px',
          padding: isCollapsed
            ? 0
            : isChild
            ? '0 8px 0 12px'
            : '0 8px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          borderRadius: isCollapsed ? '9px' : isChild ? '7px' : '9px',
          fontSize: isChild ? '0.78rem' : '0.84rem',
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          boxSizing: 'border-box',
          background: active
            ? 'linear-gradient(180deg, #C86A24 0%, #BD621F 100%)'
            : isHovered
            ? 'rgba(189, 98, 31, 0.18)'
            : 'transparent',
          border: active
            ? '1px solid rgba(253, 186, 116, 0.35)'
            : isHovered
            ? '1px solid rgba(217, 162, 107, 0.30)'
            : '1px solid transparent',
          borderTop: active
            ? '1.5px solid rgba(253, 186, 116, 0.75)'
            : isHovered
            ? '1px solid rgba(217, 162, 107, 0.30)'
            : '1px solid transparent',
          borderLeft: active && !isCollapsed
            ? '3.5px solid #F59E0B'
            : active
            ? '1px solid rgba(253, 186, 116, 0.35)'
            : isHovered
            ? '1px solid rgba(217, 162, 107, 0.30)'
            : '1px solid transparent',
          borderRight: active
            ? '1px solid rgba(253, 186, 116, 0.35)'
            : isHovered
            ? '1px solid rgba(217, 162, 107, 0.30)'
            : '1px solid transparent',
          backdropFilter: isHovered ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: isHovered ? 'blur(6px)' : undefined,
          color: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: active && !isCollapsed
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.20), 0 3px 10px rgba(189, 98, 31, 0.35)'
            : active
            ? 'inset 0 1px 0 rgba(253, 186, 116, 0.65), 0 3px 10px rgba(189, 98, 31, 0.38)'
            : isHovered
            ? '0 2px 8px rgba(189, 98, 31, 0.16)'
            : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <Icon
          size={isCollapsed ? 18 : isChild ? 15 : 20}
          strokeWidth={isChild ? 1.9 : 2.4}
          style={{
            flexShrink: 0,
            color: '#FFFFFF',
            stroke: '#FFFFFF',
            transition: 'color 0.14s ease, stroke 0.14s ease',
          }}
        />
        {!isCollapsed && (
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color 0.14s ease',
              fontWeight: 400,
              color: '#FFFFFF',
            }}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  // Render a group section button in collapsed mode
  const renderCollapsedGroupButton = (group: any) => {
    const active = isGroupActive(group);
    const GroupIcon = group.icon;
    const isHoveredInFlyout = flyoutMenu && flyoutMenu.id === group.id;
    const isHovered = hoveredNavId === group.id || isHoveredInFlyout;
    const isGold = active || isHovered;

    return (
      <div
        key={group.id}
        onMouseEnter={(e) => {
          setHoveredNavId(group.id);
          handleItemMouseEnter(group, e);
        }}
        onMouseLeave={() => {
          setHoveredNavId(null);
          handleItemMouseLeave();
        }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <button
          onClick={(e) => {
            // Clicking group in collapsed mode navigates to its first item
            if (group.items[0]) {
              setActiveTab(group.items[0].id);
              setFlyoutMenu(null);
              e.currentTarget.blur();
            }
          }}
          className={`sidebar-nav-btn ${active ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
          style={{
            width: '38px',
            height: '38px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9px',
            cursor: 'pointer',
            position: 'relative',
            backgroundColor: active
              ? 'var(--ca-badge-rust, #BD621F)'
              : isHovered
              ? 'rgba(189, 98, 31, 0.20)'
              : 'transparent',
            border: active
              ? '1px solid rgba(253, 186, 116, 0.35)'
              : isHovered
              ? '1px solid rgba(217, 162, 107, 0.35)'
              : '1px solid transparent',
            borderTop: active ? '1.5px solid rgba(253, 186, 116, 0.75)' : isHovered ? '1px solid rgba(217, 162, 107, 0.35)' : '1px solid transparent',
            color: '#FFFFFF',
            boxShadow: active
              ? 'inset 0 1px 0 rgba(253, 186, 116, 0.65), 0 3px 10px rgba(189, 98, 31, 0.38)'
              : isHovered
              ? '0 2px 8px rgba(189, 98, 31, 0.18)'
              : 'none',
            transform: isHovered ? 'scale(1.05)' : 'none',
            transition: 'all 0.15s ease',
          }}
          title={group.label}
        >
          <GroupIcon
            size={18}
            style={{
              flexShrink: 0,
              color: '#FFFFFF',
              stroke: '#FFFFFF',
              filter: 'none',
              transition: 'color 0.14s ease, stroke 0.14s ease',
            }}
          />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && !isCollapsed && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <aside
        data-collapsed={isCollapsed ? 'true' : 'false'}
        className={`sidebar-container ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
        style={{
          width: isMobile ? '260px' : isCollapsed ? '72px' : '248px',
          backgroundColor: isCollapsed ? 'var(--bg-app)' : 'var(--bg-sidebar)',
          borderRight: isCollapsed ? 'none' : '1px solid var(--border-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          height: '100vh',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: isMobile ? 9999 : 100,
          userSelect: 'none',
          transform: isMobile && isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0,
          overflow: 'visible',
          boxShadow: isMobile && !isCollapsed
            ? '4px 0 24px rgba(0, 0, 0, 0.5)'
            : 'none',
        }}
      >
        {isCollapsed ? (
          /* ══════════════════════════════════════════════════════════════════════════
             COLLAPSED FLOATING CAPSULE / PILL DOCK WITH CONCAVE ACTIVE SCOOP NOTCH
             Theme based on reference design: Capsule dock + concave wave + active bubble
             ══════════════════════════════════════════════════════════════════════════ */
          <div
            className="sidebar-capsule-dock"
            style={{
              width: '56px',
              height: 'calc(100vh - 24px)',
              margin: '12px auto',
              borderRadius: '16px',
              backgroundColor: 'var(--sidebar-navy-dark, #0C1E36)',
              boxShadow: '0 10px 30px rgba(12, 30, 54, 0.30), 0 2px 8px rgba(12, 30, 54, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0 14px',
              position: 'relative',
              overflow: 'visible',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Top: Meter Logo with Small Arrow Badge to expand back to Image 1 */}
            <div
              onClick={toggleCollapse}
              className="sidebar-collapsed-logo-btn"
              title="Expand sidebar"
              aria-label="Expand sidebar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {/* White rounded box with meter icon */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '11px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.40)',
                  transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.40)';
                }}
              >
                <img
                  src="/meter-icon.png"
                  alt="SaB Energy"
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain',
                    display: 'block',
                    transform: 'translateY(-0.5px)',
                  }}
                />
              </div>

              {/* Small arrow indicator badge to expand sidebar to Image 1 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ca-badge-rust, #BD621F)',
                  border: '1.5px solid var(--sidebar-navy-dark, #0C1E36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                  zIndex: 2,
                }}
              >
                <ChevronRight size={10} strokeWidth={3} />
              </div>
            </div>

            {/* 2. Middle: Navigation Items */}
            <nav
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'flex-start',
                flex: 1,
                paddingTop: '16px',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {MENU_STRUCTURE.map((entry) => {
                const active = entry.type === 'group' ? isGroupActive(entry) : isTabActive(entry.id);
                const Icon = entry.icon;

                if (active) {
                  return (
                    <div
                      key={entry.id}
                      className="sidebar-collapsed-active-row"
                      onMouseEnter={(e) => handleItemMouseEnter(entry, e)}
                      onMouseLeave={handleItemMouseLeave}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible',
                      }}
                    >
                      {/* Fluid Organic Concave Scoop Cutout into the dark navy pill */}
                      <svg
                        viewBox="0 0 35 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: 'absolute',
                          right: '-2px',
                          top: 'calc(50% - 40px)',
                          width: '35px',
                          height: '80px',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      >
                        <path
                          d="M 32 0 C 32 18, 4 22, 4 40 C 4 58, 32 62, 32 80 L 35 80 L 35 0 Z"
                          fill="var(--bg-app, #F8FAFC)"
                        />
                      </svg>

                      {/* Floating Active Highlight Bubble Nestled in the Scoop */}
                      <button
                        type="button"
                        onClick={(e) => {
                          if (entry.type === 'group') {
                            if (entry.items[0]) setActiveTab(entry.items[0].id);
                          } else {
                            setActiveTab(entry.id);
                          }
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(
                              new CustomEvent('sab_refresh_tab', {
                                detail: { tab: entry.type === 'group' ? entry.items[0]?.id : entry.id },
                              })
                            );
                          }
                          setFlyoutMenu(null);
                          e.currentTarget.blur();
                        }}
                        className="sidebar-active-bubble"
                        title={entry.label}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ca-badge-rust, #BD621F)',
                          background: 'linear-gradient(135deg, #BD621F 0%, #D97706 100%)',
                          boxShadow: '0 4px 14px rgba(189, 98, 31, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'absolute',
                          top: 'calc(50% - 21px)',
                          right: '-6px',
                          zIndex: 3,
                          transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Icon size={20} strokeWidth={2.4} color="#FFFFFF" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className="sidebar-collapsed-inactive-row"
                    onMouseEnter={(e) => handleItemMouseEnter(entry, e)}
                    onMouseLeave={handleItemMouseLeave}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        if (entry.type === 'group') {
                          if (entry.items[0]) setActiveTab(entry.items[0].id);
                        } else {
                          setActiveTab(entry.id);
                        }
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('sab_refresh_tab', {
                              detail: { tab: entry.type === 'group' ? entry.items[0]?.id : entry.id },
                            })
                          );
                        }
                        setFlyoutMenu(null);
                        e.currentTarget.blur();
                      }}
                      title={entry.label}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1.10)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Icon size={20} strokeWidth={2.4} color="#FFFFFF" style={{ stroke: '#FFFFFF' }} />
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* 3. Bottom: User Profile Avatar & Logout Icon */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                paddingBottom: '4px',
                flexShrink: 0,
              }}
            >
              {/* User Avatar Circle */}
              <div
                title="Plant Engineer (SCADA Admin • Active)"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ca-badge-rust, #BD621F)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  transition: 'transform 0.16s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                PE
              </div>

              {/* Logout / Exit Button */}
              <button
                type="button"
                title="Sign Out"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out?')) {
                    window.location.reload();
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <LogOut size={17} strokeWidth={2} color="#FFFFFF" />
              </button>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════════
             EXPANDED SIDEBAR VIEW (Retains Full Industrial Corporate Header & Menus)
             ══════════════════════════════════════════════════════════════════════════ */
          <>
            {/* Brand Header */}
            <div
              style={{
                width: '100%',
                height: '66px',
                minHeight: '66px',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                borderBottom: 'none',
                backgroundColor: 'transparent',
                flexShrink: 0,
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              <div
                onClick={() => setActiveTab('dashboard')}
                title="SaB Energy Dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: 1,
                  minWidth: 0,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* Meter box WITH white background */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    minWidth: '50px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.40)',
                    flexShrink: 0,
                    transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
                  }}
                >
                  <img
                    src="/meter-icon.png"
                    alt="SaB Energy"
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain',
                      display: 'block',
                      transform: 'translateY(-0.5px)',
                    }}
                  />
                </div>

                {/* SaB Energy letters WITHOUT background */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: '1.36rem',
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    SaB
                  </span>
                  <span
                    style={{
                      color: 'var(--ca-badge-rust, #BD621F)',
                      fontSize: '1.36rem',
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                  >
                    Energy
                  </span>
                </div>
              </div>

              <button
                onClick={toggleCollapse}
                className="sidebar-toggle-btn-header"
                title={isMobile ? 'Close navigation' : 'Collapse sidebar'}
                aria-label={isMobile ? 'Close navigation' : 'Collapse sidebar'}
              >
                {isMobile ? <X size={15} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
              </button>
            </div>

            {/* Navigation List */}
            <nav
              className="sidebar-nav-container"
              style={{
                width: '100%',
                padding: '4px 6px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                boxSizing: 'border-box',
              }}
            >
              {MENU_STRUCTURE.map((entry) => {
                if (entry.type === 'item') {
                  return renderNavButton(entry.id, entry.label, entry.icon);
                }

                if (entry.type === 'group') {
                  const isOpen = Boolean(openSections[entry.id]);
                  const GroupIcon = entry.icon || Layers;
                  const hasActiveChild = isGroupActive(entry);
                  const isGroupHovered = hoveredNavId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        marginTop: '4px',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <button
                        onClick={() =>
                          setOpenSections((prev) => ({
                            ...prev,
                            [entry.id]: !prev[entry.id],
                          }))
                        }
                        onMouseEnter={() => setHoveredNavId(entry.id)}
                        onMouseLeave={() => setHoveredNavId(null)}
                        className="sidebar-group-header"
                        style={{
                          width: '100%',
                          height: '38px',
                          minHeight: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 8px',
                          background: isGroupHovered
                            ? 'linear-gradient(135deg, rgba(189, 98, 31, 0.16) 0%, rgba(217, 162, 107, 0.08) 100%)'
                            : 'transparent',
                          border: isGroupHovered ? '1px solid rgba(217, 162, 107, 0.25)' : '1px solid transparent',
                          backdropFilter: isGroupHovered ? 'blur(6px)' : 'none',
                          WebkitBackdropFilter: isGroupHovered ? 'blur(6px)' : 'none',
                          cursor: 'pointer',
                          color: hasActiveChild ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                          fontSize: '0.84rem',
                          fontWeight: 500,
                          borderRadius: '9px',
                          textAlign: 'left',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <GroupIcon
                            size={20}
                            strokeWidth={2.0}
                            style={{
                              color: hasActiveChild ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                              stroke: hasActiveChild ? 'var(--ca-accent-gold, #D9A26B)' : 'currentColor',
                              transition: 'color 0.14s ease',
                            }}
                          />
                          <span style={{ color: '#FFFFFF', fontWeight: 400 }}>{entry.label}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          style={{
                            color: hasActiveChild ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '0px', marginTop: '2px' }}>
                          {entry.subCategories ? (
                            <>
                              {entry.subCategories.map((subCat: any) => {
                                const isSubOpen = Boolean(openSubSections[subCat.id]);
                                const SubIcon = subCat.icon;
                                const isSubActive = subCat.items.some((it: any) => isTabActive(it.id));
                                const isSubHovered = hoveredNavId === subCat.id;

                                return (
                                  <div
                                    key={subCat.id}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '2px',
                                      marginBottom: isSubOpen ? '4px' : '1px',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenSubSections((prev) => ({
                                          ...prev,
                                          [subCat.id]: !prev[subCat.id],
                                        }))
                                      }
                                      onMouseEnter={() => setHoveredNavId(subCat.id)}
                                      onMouseLeave={() => setHoveredNavId(null)}
                                      style={{
                                        width: '100%',
                                        height: '34px',
                                        minHeight: '34px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0 8px',
                                        background: isSubHovered
                                          ? 'rgba(189, 98, 31, 0.14)'
                                          : isSubActive
                                          ? 'rgba(189, 98, 31, 0.08)'
                                          : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: isSubActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                                        fontSize: '0.80rem',
                                        fontWeight: 400,
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <SubIcon
                                          size={16}
                                          strokeWidth={2.0}
                                          style={{
                                            color: isSubActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                                            stroke: isSubActive ? 'var(--ca-accent-gold, #D9A26B)' : 'currentColor',
                                            flexShrink: 0,
                                          }}
                                        />
                                        <span style={{ color: isSubActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF', fontWeight: 400 }}>{subCat.label}</span>
                                      </div>
                                      <ChevronDown
                                        size={12}
                                        style={{
                                          color: isSubActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                                          transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                          transition: 'transform 0.18s ease',
                                          flexShrink: 0,
                                        }}
                                      />
                                    </button>

                                    {isSubOpen && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '2px',
                                          marginLeft: '10px',
                                          paddingLeft: '6px',
                                          borderLeft: '1.5px solid rgba(255, 255, 255, 0.12)',
                                          marginTop: '2px',
                                        }}
                                      >
                                        {subCat.items.map((sub: any) => renderNavButton(sub.id, sub.label, sub.icon, true))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            entry.items.map((sub: any) => renderNavButton(sub.id, sub.label, sub.icon, true))
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </nav>

            {/* Expanded User Profile Block */}
            <div
              className="sidebar-user-profile-card"
              style={{
                padding: '8px 10px',
                margin: 'auto 6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'space-between',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                width: 'calc(100% - 12px)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--ca-badge-rust-light, #C86A24)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    position: 'relative',
                    boxShadow: '0 2px 6px rgba(12, 30, 54, 0.45)',
                  }}
                >
                  PE
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--ca-badge-rust-light, #C86A24)',
                      border: '1.5px solid #FFFFFF',
                      boxShadow: '0 0 0 1px rgba(200, 106, 36, 0.4)',
                    }}
                  />
                </div>

                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 550, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: 1.2 }}>
                    Plant Engineer
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--sidebar-nav-muted, #98A4B5)', whiteSpace: 'nowrap' }}>
                    SCADA Admin • Active
                  </div>
                </div>
              </div>

              <ChevronRight size={13} style={{ color: 'var(--text-sidebar-dim, #94A3B8)', flexShrink: 0 }} />
            </div>
          </>
        )}
      
</aside>

                                  {/* â”€â”€ FLOATING FLYOUT POPUP (APPEARS ON HOVER IN COLLAPSED MODE) â”€â”€ */}
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
            backgroundColor: 'var(--sidebar-navy-dark, #0C1E36)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.40), 0 6px 14px -3px rgba(0, 0, 0, 0.20)',
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
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('sab_refresh_tab', { detail: { tab: flyoutMenu.id } }));
                    }
                    setFlyoutMenu(null);
                  }
                : undefined
            }
            style={{
              padding: '7px 10px 8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#FFFFFF',
              borderBottom: flyoutMenu.isGroup ? '1px solid #1A365D' : 'none',
              marginBottom: flyoutMenu.isGroup ? '4px' : '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: !flyoutMenu.isGroup ? 'pointer' : 'default',
            }}
          >
            <span>{flyoutMenu.title}</span>
          </div>

          {/* Sub-items (for groups) */}
          {flyoutMenu.isGroup && (
            flyoutMenu.id === 'master' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {MASTER_CATEGORIES.map((cat) => {
                  const isCatOpen = flyoutOpenCat === cat.id;
                  const hasActive = cat.items.some((it: any) => isTabActive(it.id));

                  return (
                    <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlyoutOpenCat((prev) => (prev === cat.id ? null : cat.id));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          height: '33px',
                          padding: '0 10px',
                          borderRadius: '7px',
                          border: hasActive ? '1px solid rgba(217, 162, 107, 0.40)' : '1px solid transparent',
                          backgroundColor: hasActive
                            ? 'rgba(189, 98, 31, 0.22)'
                            : isCatOpen
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'transparent',
                          color: hasActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                          fontSize: '0.80rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.14s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!hasActive && !isCatOpen) {
                            e.currentTarget.style.backgroundColor = 'rgba(189, 98, 31, 0.16)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!hasActive && !isCatOpen) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span>{cat.label}</span>
                        <ChevronRight
                          size={13}
                          style={{
                            color: hasActive ? 'var(--ca-accent-gold, #D9A26B)' : '#FFFFFF',
                            transform: isCatOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.18s ease',
                            flexShrink: 0,
                          }}
                        />
                      </button>

                      {/* Child menu displayed when category is clicked */}
                      {isCatOpen && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            paddingLeft: '10px',
                            paddingTop: '2px',
                            paddingBottom: '2px',
                            borderLeft: '1.5px solid rgba(189, 98, 31, 0.35)',
                            marginLeft: '8px',
                          }}
                        >
                          {cat.items.map((sub: any) => {
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
                                  gap: '8px',
                                  width: '100%',
                                  height: '30px',
                                  padding: '0 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: active ? 'var(--ca-badge-rust, #BD621F)' : 'transparent',
                                  borderTop: active ? '1.5px solid rgba(253, 186, 116, 0.75)' : 'none',
                                  color: '#FFFFFF',
                                  fontSize: '0.78rem',
                                  fontWeight: active ? 500 : 450,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.14s ease',
                                  boxShadow: active
                                    ? 'inset 0 1px 0 rgba(253, 186, 116, 0.65), 0 3px 10px rgba(189, 98, 31, 0.38)'
                                    : 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (!active) {
                                    e.currentTarget.style.backgroundColor = 'rgba(189, 98, 31, 0.20)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!active) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <SubIcon size={14} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {flyoutMenu.items.map((sub: any) => {
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
                        gap: '9px',
                        width: '100%',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '7px',
                        border: 'none',
                        backgroundColor: active ? 'var(--ca-badge-rust, #BD621F)' : 'transparent',
                        borderTop: active ? '1.5px solid rgba(253, 186, 116, 0.75)' : 'none',
                        color: '#FFFFFF',
                        fontSize: '0.80rem',
                        fontWeight: 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.14s ease',
                        boxShadow: active ? 'inset 0 1px 0 rgba(253, 186, 116, 0.65), 0 3px 10px rgba(189, 98, 31, 0.38)' : 'none',
                      }}
                    >
                      <SubIcon size={16} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </>
  );
};
