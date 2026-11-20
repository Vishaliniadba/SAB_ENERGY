import React from 'react';
import { ConcernMasterPage } from './ConcernMasterPage';
import { LocationMasterPage } from './LocationMasterPage';
import { ServiceNoMasterPage } from './ServiceNoMasterPage';

interface ServiceMasterPageProps {
  initialTab?: string;
  onNavigate?: (tab: string) => void;
}

export const ServiceMasterPage: React.FC<ServiceMasterPageProps> = ({ initialTab }) => {
  if (initialTab === 'location' || initialTab === 'location-master') {
    return <LocationMasterPage />;
  }
  if (initialTab === 'service-no' || initialTab === 'service-no-master' || initialTab === 'service') {
    return <ServiceNoMasterPage />;
  }
  return <ConcernMasterPage />;
};

export default ServiceMasterPage;
