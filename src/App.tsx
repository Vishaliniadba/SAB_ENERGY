import React, { useState, useEffect } from 'react';
import { EnergyDataProvider } from './context/EnergyDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EnergyDashboardPage as DashboardView } from './modules/energy-dashboard';
import { GatewaysDevicesPage as DeviceMasterView } from './modules/gateways-devices';
import { AssetMappingPage as AssetMappingView } from './modules/asset-mapping';
import { CommConfigurationPage as CommunicationConfigView } from './modules/comm-configuration';
import { GeolocationPage as GeolocationView } from './modules/geolocation';
import {
  MeterProfilePage as MeterProfileView,
  MeterMakePage as MakeMasterView,
  MeterModelPage as ModelMasterView,
  ParameterDictionaryPage as ParameterDictionaryView,
} from './modules/masters/meter-master';
import {
  GatewayMakePage as GatewayMakeMasterView,
  GatewayModelPage as GatewayModelMasterView,
} from './modules/masters/gateway-master';
import {
  ConcernMasterPage as ConcernMasterView,
  LocationMasterPage as LocationMasterView,
  ServiceNoMasterPage as ServiceNoMasterView,
} from './modules/masters/service-master';

const VALID_TABS = new Set([
  'dashboard',
  'devices',
  'gateways',
  'asset-mapping',
  'meter-profiles',
  'meter-profile',
  'meter-make',
  'make-master',
  'meter-model',
  'model-master',
  'gateway-make',
  'gateway-make-master',
  'gateway-model',
  'gateway-model-master',
  'parameter-dictionary',
  'parameter',
  'communication-config',
  'comm-config',
  'config',
  'geolocation',
  'geo',
  'maps',
  'concern-master',
  'location-master',
  'service-no-master',
  'service-master',
  'service',
  'services',
]);

const normalizeTab = (raw: string): string => {
  const t = raw.replace(/^#\/?/, '').trim().toLowerCase();
  if (VALID_TABS.has(t)) {
    if (t === 'gateways') return 'devices';
    if (t === 'meter-profiles') return 'meter-profile';
    if (t === 'make-master') return 'meter-make';
    if (t === 'model-master') return 'meter-model';
    if (t === 'gateway-make-master') return 'gateway-make';
    if (t === 'gateway-model-master') return 'gateway-model';
    if (t === 'parameter') return 'parameter-dictionary';
    if (t === 'comm-config' || t === 'config') return 'communication-config';
    if (t === 'geo' || t === 'maps') return 'geolocation';
    if (t === 'service' || t === 'services') return 'concern-master';
    return t;
  }
  return 'dashboard';
};

const getInitialTab = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Check URL Hash (e.g. #devices, #asset-mapping, #meter-profile)
    const hash = window.location.hash;
    if (hash) {
      const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_TABS.has(clean)) {
        return normalizeTab(clean);
      }
    }

    // 2. Check URL pathname (e.g. /devices)
    const path = window.location.pathname.replace(/^\//, '').trim().toLowerCase();
    if (path && VALID_TABS.has(path)) {
      return normalizeTab(path);
    }

    // 3. Check persistent localStorage
    try {
      const saved = localStorage.getItem('sab_active_tab');
      if (saved && VALID_TABS.has(saved)) {
        return normalizeTab(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }
  return 'dashboard';
};

function AppContent() {
  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    const normalized = normalizeTab(tab);
    setActiveTabState(normalized);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sab_active_tab', normalized);
        const currentHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
        if (currentHash !== normalized) {
          window.history.replaceState(null, '', '#' + normalized);
        }
      } catch {
        // Ignore storage errors
      }
    }
  };

  // Sync with browser back/forward and hash changes, and guarantee initial URL hash
  useEffect(() => {
    const handleHashOrPop = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (hash && VALID_TABS.has(hash)) {
        const normalized = normalizeTab(hash);
        if (normalized !== activeTab) {
          setActiveTabState(normalized);
          try {
            localStorage.setItem('sab_active_tab', normalized);
          } catch {}
        }
      }
    };

    window.addEventListener('hashchange', handleHashOrPop);
    window.addEventListener('popstate', handleHashOrPop);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sab_active_tab', activeTab);
        const currentHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
        if (currentHash !== activeTab) {
          window.history.replaceState(null, '', '#' + activeTab);
        }
      } catch {}
    }

    return () => {
      window.removeEventListener('hashchange', handleHashOrPop);
      window.removeEventListener('popstate', handleHashOrPop);
    };
  }, [activeTab]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'devices':
      case 'gateways':
        return <DeviceMasterView />;
      case 'asset-mapping':
        return <AssetMappingView />;
      case 'meter-profiles':
      case 'meter-profile':
        return <MeterProfileView />;
      case 'meter-make':
      case 'make-master':
        return <MakeMasterView />;
      case 'meter-model':
      case 'model-master':
        return <ModelMasterView />;
      case 'gateway-make':
      case 'gateway-make-master':
        return <GatewayMakeMasterView />;
      case 'gateway-model':
      case 'gateway-model-master':
        return <GatewayModelMasterView />;
      case 'parameter-dictionary':
        return <ParameterDictionaryView />;
      case 'communication-config':
      case 'comm-config':
      case 'config':
        return <CommunicationConfigView />;
      case 'geolocation':
      case 'geo':
      case 'maps':
        return <GeolocationView />;
      case 'concern-master':
        return <ConcernMasterView />;
      case 'location-master':
        return <LocationMasterView />;
      case 'service-no-master':
        return <ServiceNoMasterView />;
      case 'service-master':
      case 'service':
      case 'services':
        return <ConcernMasterView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const isFullViewportView = activeTab === 'dashboard' || activeTab === 'geolocation';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
        <Header activeTab={activeTab} />
        <main
          className={
            activeTab === 'dashboard'
              ? 'app-dashboard-viewport'
              : activeTab === 'geolocation'
              ? 'app-geo-viewport'
              : 'app-main-viewport'
          }
          style={{
            flex: 1,
            height: 'calc(100vh - 52px)',
            maxHeight: 'calc(100vh - 52px)',
            overflowY: activeTab === 'geolocation' ? 'hidden' : 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-app)',
            width: '100%',
          }}
        >
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <EnergyDataProvider>
      <AppContent />
    </EnergyDataProvider>
  );
}
