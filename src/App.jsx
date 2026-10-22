import React, { useState } from 'react';
import { EnergyDataProvider } from './context/EnergyDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/dashboard/DashboardView';
import { DeviceMasterView } from './views/masters/DeviceMasterView';
import { AssetMappingView } from './views/mapping/AssetMappingView';
import { MeterProfilesView } from './views/profiles/MeterProfilesView';
import { MakeMasterView } from './views/profiles/MakeMasterView';
import { ModelMasterView } from './views/profiles/ModelMasterView';
import { GatewayMakeMasterView } from './views/masters/GatewayMakeMasterView';
import { GatewayModelMasterView } from './views/masters/GatewayModelMasterView';
import { ParameterDictionaryView } from './views/profiles/ParameterDictionaryView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'devices':
      case 'gateways':
        return <DeviceMasterView />;
      case 'asset-mapping':
        return <AssetMappingView />;
      case 'meter-profiles':
      case 'meter-profile':
        return <MeterProfilesView />;
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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Header activeTab={activeTab} />
        <main style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
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
