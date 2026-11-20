import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MapPin,
  Search,
  X,
  Crosshair,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Building,
  Building2,
  Radio,
  Zap,
  Copy,
  Check,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Filter,
  Sliders,
  CircleDot,
} from 'lucide-react';
import { useEnergyData } from '../../../context/EnergyDataContext';
import { meterApi } from '../../gateways-devices/api/meterApi';
import '../styles/geolocation.css';
import { loadLeaflet } from '../utils/loadLeaflet';

export interface InstalledMeterInfo {
  id: string;
  tag: string;
  name: string;
  slaveId: number;
  placementLocation: string; // which place / room the meter is installed
  status: 'Online' | 'Active' | 'Standby';
}

export interface FacilitySite {
  id: string;
  concernName: string;
  name: string;
  type: string;
  city: string;
  state: string;
  country: string;
  address: string;
  query: string;
  lat: number;
  lng: number;
  zoom: number;
  gatewayName: string;
  gatewayMac: string;
  gatewayStatus: 'Online' | 'Active' | 'Standby';
  meters: InstalledMeterInfo[];
}

const PRESET_FACILITIES: FacilitySite[] = [
  {
    id: 'site-perundurai',
    concernName: 'NavaNala',
    name: 'Perundurai Industrial Facility',
    type: 'Substation & Metering Bay (NNT Head Office)',
    city: 'Perundurai',
    state: 'Tamil Nadu',
    country: 'India',
    address: 'Perundurai Industrial Area, Erode District, Tamil Nadu 638052, India',
    query: '11.275143, 77.579820',
    lat: 11.275143,
    lng: 77.579820,
    zoom: 19,
    gatewayName: 'Enerlink IoT Gateway',
    gatewayMac: '441BF6D37C80',
    gatewayStatus: 'Online',
    meters: [],
  },
  {
    id: 'site-navanala',
    concernName: 'NavaNala',
    name: 'NavaNala Facility',
    type: 'Substation & Metering Bay (NNT Head Office)',
    city: 'Perundurai',
    state: 'Tamil Nadu',
    country: 'India',
    address: 'NNT Complex, Perundurai Industrial Area, Erode District, Tamil Nadu 638052, India',
    query: '11.275143, 77.579820',
    lat: 11.275143,
    lng: 77.579820,
    zoom: 19,
    gatewayName: 'Enerlink IoT Gateway 01',
    gatewayMac: '441BF6D37C80',
    gatewayStatus: 'Online',
    meters: [],
  },
  {
    id: 'site-panikkampalayam',
    concernName: 'Panikkampalayam',
    name: 'Panikkampalayam Facility',
    type: 'Apparel Manufacturing & Feeder Substation',
    city: 'Perundurai',
    state: 'Tamil Nadu',
    country: 'India',
    address: 'SF.No. 746, D.No. 85/19-21, Panickampalayam, Perundurai, Tamil Nadu 638052',
    query: '11.275640, 77.587940',
    lat: 11.275640,
    lng: 77.587940,
    zoom: 19,
    gatewayName: 'Enerlink IoT Gateway 02',
    gatewayMac: '441BF6D37CA5',
    gatewayStatus: 'Online',
    meters: [],
  },
];

interface SuggestionItem {
  display_name: string;
  lat: string;
  lon: string;
}

// Robust coordinate parser for Decimal Degrees and Degrees Minutes Seconds (DMS)
function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const str = input.trim();
  if (!str) return null;

  // 1. Decimal degrees: e.g. "11.274972, 77.579889" or "11.274972 77.579889"
  const ddPattern = /^([-+]?\d{1,3}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/;
  const ddMatch = str.match(ddPattern);
  if (ddMatch) {
    const lat = parseFloat(ddMatch[1]);
    const lng = parseFloat(ddMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // 2. DMS coordinates: e.g. 11°16'29.9"N 77°34'47.6"E or 11°16'29.9" N, 77°34'47.6" E
  const dmsPattern = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)(?:["\s]*)?([NnSs])[\s,]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)(?:["\s]*)?([EeWw])/;
  const dmsMatch = str.match(dmsPattern);
  if (dmsMatch) {
    const d1 = parseFloat(dmsMatch[1]);
    const m1 = parseFloat(dmsMatch[2]);
    const s1 = parseFloat(dmsMatch[3]);
    const dir1 = dmsMatch[4].toUpperCase();

    const d2 = parseFloat(dmsMatch[5]);
    const m2 = parseFloat(dmsMatch[6]);
    const s2 = parseFloat(dmsMatch[7]);
    const dir2 = dmsMatch[8].toUpperCase();

    let lat = d1 + m1 / 60 + s1 / 3600;
    if (dir1 === 'S') lat = -lat;

    let lng = d2 + m2 / 60 + s2 / 3600;
    if (dir2 === 'W') lng = -lng;

    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

// Compress image via canvas to ensure reliable, automatic localStorage saving (<50KB)
function compressImage(file: File, maxWidth = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('/images/nnt-office.jpg');
    reader.readAsDataURL(file);
  });
}

export interface MeterCardData {
  placeName: string;
  image: string;
  lat: number;
  lng: number;
}

export const GeolocationPage: React.FC = () => {
  // Active Selected Site (defaults to NavaNala Facility at 11.275143, 77.579820)
  const [selectedSite, setSelectedSite] = useState<FacilitySite>(PRESET_FACILITIES[0]);
  const [selectedConcernName, setSelectedConcernName] = useState<string>('NavaNala');
  const [previousConcernName, setPreviousConcernName] = useState<string>('NavaNala');
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [flyingDestination, setFlyingDestination] = useState<string>('');
  const flightPolylineRef = useRef<any>(null);
  const flightOriginMarkerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeLat, setActiveLat] = useState<number>(11.275143);
  const [activeLng, setActiveLng] = useState<number>(77.579820);
  const [activeZoom, setActiveZoom] = useState<number>(19);
  const [mapType, setMapType] = useState<'m' | 'k' | 'h' | 'p'>('k'); // Default to Satellite ('k') as requested

  // Selected Meter inside the facility (defaults to first active meter in Meter Master)
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');

  // Per-meter custom configuration map (Place Name, Coordinates, and Image Uploaded)
  const [meterConfigs, setMeterConfigs] = useState<Record<string, MeterCardData>>({});

  // Meter Geofence Radius Circle (drawn dynamically centered on active meter lat/lng)
  const [geofenceRadius, setGeofenceRadius] = useState<number>(50); // default 50 meters
  const [isRadiusVisible, setIsRadiusVisible] = useState<boolean>(true);

  // By default, only the clean green pin + pill label shows; pops up detailed card when selected/clicked
  const [isCardVisibleOnMap, setIsCardVisibleOnMap] = useState(false);
  const [cardPosition, setCardPosition] = useState<'above-pin' | 'corner'>('above-pin');

  // Map Pan Lock: Locks map by default so pin is solidly anchored to coordinates and doesn't drift
  const [isMapPanLocked, setIsMapPanLocked] = useState(true);

  // Modal State for configuring a specific meter's geolocation pin & image
  const [configModalMeter, setConfigModalMeter] = useState<InstalledMeterInfo | null>(null);
  const [editLat, setEditLat] = useState<number>(11.275143);
  const [editLng, setEditLng] = useState<number>(77.579820);
  const [editPlaceName, setEditPlaceName] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [saveSuccessToast, setSaveSuccessToast] = useState<string>('');

  // Suggestions & Geocoding
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Meter Master integration: Load meters from EnergyDataContext & Meter API
  const energyData = useEnergyData();
  const contextMeters = energyData?.meters || [];
  const [apiMeters, setApiMeters] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    meterApi
      .getAll()
      .then((res: any) => {
        if (!isMounted || !res) return;
        const list = Array.isArray(res) ? res : res.data || [];
        setApiMeters(list);
      })
      .catch((err: any) => {
        console.warn('Geolocation: meterApi.getAll fallback to master context', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute master meters: dynamically resolved based on selected concern
  // For Panikkampalayam, maintains 1 dedicated dummy meter as requested
  const allMasterMeters: InstalledMeterInfo[] = useMemo(() => {
    const isPanikkampalayam =
      selectedConcernName.toLowerCase().includes('panikkam') ||
      (selectedSite?.concernName || '').toLowerCase().includes('panikkam') ||
      selectedSite?.id === 'site-panikkampalayam';

    if (isPanikkampalayam) {
      // JEGA GARMENTS LLP meter for Panikkampalayam facility
      const dummyMeter: InstalledMeterInfo = {
        id: 'MTR-JGL-01',
        tag: 'JGL-LG-5310',
        name: 'JEGA GARMENTS LLP',
        slaveId: 1,
        placementLocation: 'SF.No. 746, D.No. 85/19-21, Panickampalayam, Perundurai',
        status: 'Online',
      };
      return [dummyMeter];
    }

    const isUnwantedMeter = (m: any): boolean => {
      const rawTag = (m.meter_serial_number || m.serialNo || m.tag || m.Meter_id || '').toString().trim().toUpperCase();
      const rawName = (m.customName || m.Meter_name || m.name || '').toString().trim().toUpperCase();
      const rawId = (m.id || m.Meter_id || '').toString().trim().toUpperCase();

      return (
        rawTag === 'ELM-LG-4401' ||
        rawTag === 'SCH-EM-9921' ||
        rawTag === 'SLC-MFM-3840' ||
        rawTag === 'SCH-PM-5300' ||
        rawId === 'MTR-001' ||
        rawId === 'MTR-002' ||
        rawId === 'MTR-003' ||
        rawId === 'MTR-004' ||
        rawName === 'NAVANALA EB METER' ||
        rawName.includes('DUMMY')
      );
    };

    const map = new Map<string, InstalledMeterInfo>();

    const processMeter = (m: any, defaultPrefix: string) => {
      if (!m || isUnwantedMeter(m)) return;

      const tag = (m.meter_serial_number || m.serialNo || m.tag || (m.Meter_id ? String(m.Meter_id) : '')).toString().trim();
      if (!tag) return;

      const dedupeKey = tag.toUpperCase();
      const slaveId = Number(m.slaveId || m.slave_id || (map.size + 1));
      const id = String(m.id ?? m.Meter_id ?? `${defaultPrefix}-${tag}`);
      const name = m.customName || m.Meter_name || m.name || `Meter ${tag}`;
      const placement = m.placementLocation || (m.make_name ? `${m.make_name} ${m.meter_model || ''}`.trim() : `${selectedSite?.name || 'Facility'} — Bay ${slaveId}`);

      if (map.has(dedupeKey)) {
        // Meter already registered: enrich placementLocation if existing is generic
        const existing = map.get(dedupeKey)!;
        if (
          (!existing.placementLocation || existing.placementLocation.includes('Station')) &&
          placement &&
          !placement.includes('Station')
        ) {
          existing.placementLocation = placement;
        }
        return;
      }

      map.set(dedupeKey, {
        id,
        tag,
        name,
        slaveId,
        placementLocation: placement,
        status: 'Online',
      });
    };

    // 1. First process context meters (configured in Meter Master)
    (contextMeters || []).forEach((m: any) => processMeter(m, 'MTR-CTX'));

    // 2. Then process backend API meters (deduplicating against existing)
    (apiMeters || []).forEach((m: any) => processMeter(m, 'MTR-API'));

    return Array.from(map.values());
  }, [contextMeters, apiMeters, selectedSite, selectedConcernName]);

  // Auto-sync selectedMeterId to the first meter from Meter Master
  useEffect(() => {
    if (allMasterMeters.length > 0 && !allMasterMeters.some((m) => m.id === selectedMeterId)) {
      setSelectedMeterId(allMasterMeters[0].id);
    }
  }, [allMasterMeters, selectedMeterId]);

  // Helper to obtain distinct default coordinates and area names for each meter
  const getInitialMeterConfig = (meter: InstalledMeterInfo, index: number, site?: FacilitySite): MeterCardData => {
    const currentSite = site || selectedSite;
    const isPanikkampalayam =
      (currentSite?.concernName || currentSite?.name || '').toLowerCase().includes('panikkam') ||
      currentSite?.id === 'site-panikkampalayam' ||
      selectedConcernName.toLowerCase().includes('panikkam');
    const tagUpper = (meter.tag || '').toUpperCase();
    const isMeter2 = meter.slaveId === 2 || tagUpper.includes('6360') || index === 1;

    // Distinct default facility areas for each concern
    const defaultArea = isPanikkampalayam
      ? { lat: 11.275640, lng: 77.587940, place: 'SF.No. 746, D.No. 85/19-21, Panickampalayam, Perundurai' }
      : (isMeter2
          ? { lat: 11.275850, lng: 77.580420, place: 'Station 2 — Power Substation Bay' }
          : { lat: 11.275143, lng: 77.579820, place: 'NNT Head Office — Main Incomer / UPS Room' });

    const keyPrefix = isPanikkampalayam ? 'sab_mtr_pnk_' : 'sab_mtr_';
    // Read saved values by tag first, then by id
    const savedPlace = localStorage.getItem(`${keyPrefix}place_${meter.tag}`) || localStorage.getItem(`${keyPrefix}place_${meter.id}`);
    const savedImg = localStorage.getItem(`${keyPrefix}img_${meter.tag}`) || localStorage.getItem(`${keyPrefix}img_${meter.id}`);
    const savedLatStr = localStorage.getItem(`${keyPrefix}lat_${meter.tag}`) || localStorage.getItem(`${keyPrefix}lat_${meter.id}`);
    const savedLngStr = localStorage.getItem(`${keyPrefix}lng_${meter.tag}`) || localStorage.getItem(`${keyPrefix}lng_${meter.id}`);

    let lat = savedLatStr ? parseFloat(savedLatStr) : defaultArea.lat;
    let lng = savedLngStr ? parseFloat(savedLngStr) : defaultArea.lng;

    // Migrate any previous dummy / approximate coordinates for Panikkampalayam to 11.275640, 77.587940
    if (isPanikkampalayam && (lat === 11.4469 || lat === 11.2845 || lat === 11.27552 || isNaN(lat))) {
      lat = 11.275640;
      lng = 77.587940;
    }

    // Cleanse placement name if generic "Elmeasure LG5310" or empty
    let placeName = savedPlace || meter.placementLocation || defaultArea.place;
    if (!placeName || placeName === 'Elmeasure LG5310' || (isPanikkampalayam && (placeName.includes('Kulampalayam') || placeName.includes('Feeder Bay')))) {
      placeName = defaultArea.place;
    }

    return {
      placeName,
      image: savedImg || '/images/nnt-office.jpg',
      lat,
      lng,
    };
  };

  // Auto-sync meterConfigs so each meter has its distinct area coordinates initialized for active concern
  useEffect(() => {
    if (allMasterMeters.length > 0) {
      const next: Record<string, MeterCardData> = {};
      allMasterMeters.forEach((m, idx) => {
        next[m.id] = getInitialMeterConfig(m, idx, selectedSite);
      });
      setMeterConfigs(next);
    }
  }, [allMasterMeters, selectedSite]);

  // Active Meter from Meter Master
  const activeMeter: InstalledMeterInfo =
    allMasterMeters.find((m) => m.id === selectedMeterId) ||
    allMasterMeters[0] || {
      id: 'default',
      tag: 'METER',
      name: 'Meter',
      slaveId: 1,
      placementLocation: selectedSite?.name || 'Main Panel',
      status: 'Online',
    };

  const activeMeterConfig: MeterCardData =
    (activeMeter && meterConfigs[activeMeter.id]) ||
    getInitialMeterConfig(activeMeter, activeMeter.slaveId === 2 ? 1 : 0);

  // Main Map Leaflet References
  const mainMapRef = useRef<any>(null);
  const mainTileLayerRef = useRef<any>(null);
  const mainMarkersMapRef = useRef<Map<string, any>>(new Map());
  const mainRadiusCircleRef = useRef<any>(null);

  // Expose global modal opener and selector for Leaflet popup and pin clicks
  useEffect(() => {
    (window as any).sabOpenMeterConfig = (meterId: string) => {
      const target = allMasterMeters.find((m) => m.id === meterId);
      if (target) {
        handleOpenConfigModal(target);
      }
    };
    (window as any).sabSelectMeter = (meterId: string) => {
      const target = allMasterMeters.find((m) => m.id === meterId);
      if (target) {
        handleSelectMeter(target);
      }
    };
    return () => {
      delete (window as any).sabOpenMeterConfig;
      delete (window as any).sabSelectMeter;
    };
  }, [allMasterMeters, meterConfigs]);

  // Switch active meter smoothly and open its popup directly on the map
  const handleSelectMeter = (meter: InstalledMeterInfo) => {
    setSelectedMeterId(meter.id);
    const cfg = meterConfigs[meter.id] || getInitialMeterConfig(meter, meter.slaveId === 2 ? 1 : 0);
    setActiveLat(cfg.lat);
    setActiveLng(cfg.lng);
    setActiveZoom(19);

    if (mainMapRef.current) {
      const map = mainMapRef.current;
      const targetLat = cfg.lat + 0.00010;
      map.flyTo([targetLat, cfg.lng], 19, {
        duration: 1.0,
        easeLinearity: 0.25,
      });

      // Instantly open popup on the marker
      setTimeout(() => {
        const marker = mainMarkersMapRef.current.get(meter.id);
        if (marker) {
          marker.openPopup();
        }
      }, 500);
    }
  };

  const handleOpenConfigModal = (meter: InstalledMeterInfo) => {
    setConfigModalMeter(meter);
    const cfg = meterConfigs[meter.id] || getInitialMeterConfig(meter, meter.slaveId === 2 ? 1 : 0);

    setEditPlaceName(cfg.placeName || meter.placementLocation || 'NNT Head Office');
    setEditImage(cfg.image || '/images/nnt-office.jpg');
    setEditLat(cfg.lat);
    setEditLng(cfg.lng);
  };

  const modalMapRef = useRef<any>(null);
  const modalMarkerRef = useRef<any>(null);

  // Sync coordinates to Leaflet marker and map view
  const updateModalPinCoords = (newLat: number, newLng: number, panMap = true) => {
    const latFixed = Number(Number(newLat).toFixed(6));
    const lngFixed = Number(Number(newLng).toFixed(6));
    if (isNaN(latFixed) || isNaN(lngFixed)) return;

    setEditLat(latFixed);
    setEditLng(lngFixed);

    if (modalMarkerRef.current) {
      modalMarkerRef.current.setLatLng([latFixed, lngFixed]);
    }
    if (panMap && modalMapRef.current) {
      modalMapRef.current.panTo([latFixed, lngFixed]);
    }
  };

  // Mount Interactive Leaflet Dynamic Map Pin Picker inside the Modal
  useEffect(() => {
    if (!configModalMeter) {
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
        modalMarkerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    // Small delay to ensure the modal DOM container is fully mounted
    const timer = setTimeout(() => {
      loadLeaflet().then((L) => {
        if (!isMounted) return;
        const container = document.getElementById('modal-pin-picker-map');
        if (!container) return;

        if (modalMapRef.current) {
          modalMapRef.current.remove();
          modalMapRef.current = null;
          modalMarkerRef.current = null;
        }

        const initialLat = editLat || 11.275143;
        const initialLng = editLng || 77.579820;

        const map = L.map(container, {
          zoomControl: false,
          attributionControl: false,
        }).setView([initialLat, initialLng], 19);

        // High-resolution Google Hybrid Satellite Tiles (satellite imagery + street names & landmarks)
        L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 21,
          maxNativeZoom: 20,
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        // Custom High-Res Draggable Blue Pin Icon with meter name label (perfectly hit-box aligned)
        const pinIcon = L.divIcon({
          className: 'custom-interactive-leaflet-pin',
          html: `
            <div class="modal-pin-inner" style="width:160px; height:64px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; cursor:grab; pointer-events:auto; position:relative;">
              <div style="background:linear-gradient(180deg, #1E4A8A 0%, #1D3461 100%); color:#FFFFFF; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:12px; white-space:nowrap; max-width:160px; overflow:hidden; text-overflow:ellipsis; box-shadow:0 3px 8px rgba(0,0,0,0.35); border:1.5px solid #1D3461; margin-bottom:2px; display:flex; align-items:center; gap:4px; pointer-events:none;">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#FFFFFF; flex-shrink:0;"></span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${configModalMeter.name || configModalMeter.tag}">${configModalMeter.name || configModalMeter.tag}</span>
              </div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#1D3461" stroke="#FFFFFF" stroke-width="1.8" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
              </svg>
            </div>
          `,
          iconSize: [160, 64],
          iconAnchor: [80, 64],
        });

        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: pinIcon,
        }).addTo(map);

        modalMapRef.current = map;
        modalMarkerRef.current = marker;

        // Dynamic pin drag: updates coordinates in real time as user drags
        marker.on('drag', (e: any) => {
          const latlng = e.latlng;
          setEditLat(Number(latlng.lat.toFixed(6)));
          setEditLng(Number(latlng.lng.toFixed(6)));
        });

        marker.on('dragend', (e: any) => {
          const latlng = e.target.getLatLng();
          setEditLat(Number(latlng.lat.toFixed(6)));
          setEditLng(Number(latlng.lng.toFixed(6)));
        });

        // Dynamic map click: user can click ANYWHERE on the map to set the pin!
        map.on('click', (e: any) => {
          const latlng = e.latlng;
          marker.setLatLng(latlng);
          setEditLat(Number(latlng.lat.toFixed(6)));
          setEditLng(Number(latlng.lng.toFixed(6)));
        });

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
        modalMarkerRef.current = null;
      }
    };
  }, [configModalMeter]);

  const handleSaveConfig = () => {
    if (!configModalMeter) return;
    const meterId = configModalMeter.id;
    const tag = configModalMeter.tag;

    const updatedCfg: MeterCardData = {
      placeName: editPlaceName.trim() || configModalMeter.placementLocation,
      image: editImage || '/images/nnt-office.jpg',
      lat: editLat,
      lng: editLng,
    };

    const isPanikkampalayam =
      (selectedSite?.concernName || selectedConcernName).toLowerCase().includes('panikkam');
    const keyPrefix = isPanikkampalayam ? 'sab_mtr_pnk_' : 'sab_mtr_';

    // Save with both prefixed and generic keys for 100% persistence
    localStorage.setItem(`${keyPrefix}place_${meterId}`, updatedCfg.placeName);
    localStorage.setItem(`${keyPrefix}place_${tag}`, updatedCfg.placeName);
    localStorage.setItem(`${keyPrefix}img_${meterId}`, updatedCfg.image);
    localStorage.setItem(`${keyPrefix}img_${tag}`, updatedCfg.image);
    localStorage.setItem(`${keyPrefix}lat_${meterId}`, String(updatedCfg.lat));
    localStorage.setItem(`${keyPrefix}lat_${tag}`, String(updatedCfg.lat));
    localStorage.setItem(`${keyPrefix}lng_${meterId}`, String(updatedCfg.lng));
    localStorage.setItem(`${keyPrefix}lng_${tag}`, String(updatedCfg.lng));

    localStorage.setItem(`sab_mtr_place_${meterId}`, updatedCfg.placeName);
    localStorage.setItem(`sab_mtr_place_${tag}`, updatedCfg.placeName);
    localStorage.setItem(`sab_mtr_img_${meterId}`, updatedCfg.image);
    localStorage.setItem(`sab_mtr_img_${tag}`, updatedCfg.image);
    localStorage.setItem(`sab_mtr_lat_${meterId}`, String(updatedCfg.lat));
    localStorage.setItem(`sab_mtr_lat_${tag}`, String(updatedCfg.lat));
    localStorage.setItem(`sab_mtr_lng_${meterId}`, String(updatedCfg.lng));
    localStorage.setItem(`sab_mtr_lng_${tag}`, String(updatedCfg.lng));

    setMeterConfigs((prev) => ({
      ...prev,
      [meterId]: updatedCfg,
    }));

    // Select the meter and update state
    setSelectedMeterId(meterId);
    setActiveLat(updatedCfg.lat);
    setActiveLng(updatedCfg.lng);
    setActiveZoom(19);

    // Close modal first so user sees the map navigation clearly
    setConfigModalMeter(null);

    // Smooth cinematic flyTo the newly pinned location (business flow: config → navigate → see pin)
    setTimeout(() => {
      if (mainMapRef.current) {
        mainMapRef.current.flyTo(
          [updatedCfg.lat + 0.00010, updatedCfg.lng],
          19,
          { duration: 1.6, easeLinearity: 0.25 }
        );
        setTimeout(() => {
          const marker = mainMarkersMapRef.current.get(meterId);
          if (marker) marker.openPopup();
        }, 1100);
      }
    }, 120); // slight delay so modal unmounts cleanly before animation

    setSaveSuccessToast(`✅ ${tag} pinned at ${updatedCfg.lat.toFixed(5)}°N, ${updatedCfg.lng.toFixed(5)}°E — navigating…`);
    setTimeout(() => setSaveSuccessToast(''), 5000);
  };

  // ── Main Map Leaflet Initializer ──
  useEffect(() => {
    let isMounted = true;
    const container = document.getElementById('main-geolocation-leaflet-map');
    if (!container) return;

    loadLeaflet().then((L) => {
      if (!isMounted) return;
      if (mainMapRef.current) return; // already initialized

      const initialLat = activeLat || 11.275143;
      const initialLng = activeLng || 77.579820;

      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], activeZoom || 19);

      const getTileUrl = (type: string) => {
        switch (type) {
          case 'm':
            return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
          case 'p':
            return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
          case 'h':
          case 'k':
          default:
            return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        }
      };

      const tileLayer = L.tileLayer(getTileUrl(mapType), {
        maxZoom: 21,
        maxNativeZoom: 20,
      }).addTo(map);

      mainTileLayerRef.current = tileLayer;
      mainMapRef.current = map;

      map.on('zoomend', () => {
        setActiveZoom(map.getZoom());
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mainRadiusCircleRef.current) {
        mainRadiusCircleRef.current.remove();
        mainRadiusCircleRef.current = null;
      }
      if (flightPolylineRef.current) {
        flightPolylineRef.current.remove();
        flightPolylineRef.current = null;
      }
      if (flightOriginMarkerRef.current) {
        flightOriginMarkerRef.current.remove();
        flightOriginMarkerRef.current = null;
      }
      if (mainRadiusCircleRef.current) {
        mainRadiusCircleRef.current.remove();
        mainRadiusCircleRef.current = null;
      }
      if (mainMapRef.current) {
        mainMapRef.current.remove();
        mainMapRef.current = null;
        mainTileLayerRef.current = null;
      }
    };
  }, []);

  // Sync Map Type (Satellite, Roadmap, Terrain) on Main Leaflet Map
  useEffect(() => {
    if (!mainMapRef.current || !window.L) return;
    const L = window.L;
    if (mainTileLayerRef.current) {
      mainMapRef.current.removeLayer(mainTileLayerRef.current);
    }
    const getTileUrl = (type: string) => {
      switch (type) {
        case 'm':
          return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        case 'p':
          return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
        case 'h':
        case 'k':
        default:
          return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      }
    };
    const newTileLayer = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 21,
      maxNativeZoom: 20,
    }).addTo(mainMapRef.current);
    mainTileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Helper: Create custom HTML divIcon for main meter pins (Blue Pin marker as requested)
  const createMainPinIcon = (L: any, meter: InstalledMeterInfo, isSelected: boolean) => {
    const pinColor = isSelected ? '#1D3461' : '#0C1E36';
    const meterDisplayName = meter.name || meter.tag;
    return L.divIcon({
      className: `custom-main-meter-pin ${isSelected ? 'active-pin' : ''}`,
      html: `
        <div class="main-pin-inner" onclick="window.sabSelectMeter && window.sabSelectMeter('${meter.id}')" style="width:160px; height:66px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; cursor:pointer; pointer-events:auto; position:relative;">
          <div style="background:${isSelected ? 'linear-gradient(180deg, #1E4A8A 0%, #1D3461 100%)' : '#FFFFFF'}; color:${isSelected ? '#FFFFFF' : '#0C1E36'}; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:12px; white-space:nowrap; max-width:160px; overflow:hidden; text-overflow:ellipsis; box-shadow:0 3px 8px rgba(0,0,0,0.35); border:1.5px solid ${isSelected ? '#1D3461' : '#CBD5E1'}; margin-bottom:2px; display:flex; align-items:center; gap:4px; pointer-events:none;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isSelected ? '#FFFFFF' : '#1D3461'}; flex-shrink:0;"></span>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${meterDisplayName}">${meterDisplayName}</span>
          </div>
          <svg width="${isSelected ? 36 : 30}" height="${isSelected ? 36 : 30}" viewBox="0 0 24 24" fill="${pinColor}" stroke="#FFFFFF" stroke-width="1.6" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5)); pointer-events:none;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
          </svg>
          ${isSelected ? '<div class="geolocation-custom-pin-pulse"></div>' : ''}
        </div>
      `,
      iconSize: [160, 66],
      iconAnchor: [80, 66],
    });
  };

  // Sync Markers for ALL meters on the Main Map (created once per meter list or config change)
  useEffect(() => {
    if (!mainMapRef.current || !window.L) return;
    const L = window.L;
    const map = mainMapRef.current;

    // Clear existing markers
    mainMarkersMapRef.current.forEach((marker) => marker.remove());
    mainMarkersMapRef.current.clear();

    allMasterMeters.forEach((meter, idx) => {
      const isSelected = meter.id === selectedMeterId;
      const cfg = meterConfigs[meter.id] || getInitialMeterConfig(meter, idx);
      const pinIcon = createMainPinIcon(L, meter, isSelected);

      const marker = L.marker([cfg.lat, cfg.lng], {
        icon: pinIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);

      // Bind rich interactive popup physically attached to the marker coordinates
      const popupHtml = `
        <div class="geolocation-leaflet-popup-card compact-horizontal">
          <div class="geolocation-popup-img-wrap">
            <img src="${cfg.image || '/images/nnt-office.jpg'}" alt="${cfg.placeName}" class="geolocation-popup-img" />
            <div class="geolocation-popup-badge" style="background:linear-gradient(180deg, #1E4A8A 0%, #1D3461 100%);">
              ${meter.name || meter.tag}
            </div>
          </div>
          <div class="geolocation-popup-body">
            <div class="geolocation-popup-header-box">
              <div class="geolocation-popup-place" title="${cfg.placeName}">${cfg.placeName}</div>
            </div>
            <div class="geolocation-popup-sub" title="${selectedSite?.name || 'Facility'} — ${meter.name}">
              ${selectedSite?.name || 'Facility'} • ${meter.name}
            </div>
            <div class="geolocation-popup-meta">
              <span>📍 ${cfg.lat.toFixed(5)}° N, ${cfg.lng.toFixed(5)}° E</span>
            </div>
            <button onclick="window.sabOpenMeterConfig && window.sabOpenMeterConfig('${meter.id}')" class="geolocation-popup-config-btn" style="background:linear-gradient(135deg, #1D3461 0%, #0C1E36 100%);">
              ⚙️ Configure & Pin
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup-wrapper',
        maxWidth: 320,
        minWidth: 300,
        offset: [0, -68],
        autoPan: false, // Prevents conflicting autoPan animations that cause the shaking effect
      });

      marker.on('click', () => {
        handleSelectMeter(meter);
      });

      mainMarkersMapRef.current.set(meter.id, marker);
    });
  }, [allMasterMeters, meterConfigs, selectedSite]);

  // Lightweight icon update when selectedMeterId changes (keeps markers alive, no map shaking!)
  useEffect(() => {
    if (!window.L) return;
    const L = window.L;
    mainMarkersMapRef.current.forEach((marker, id) => {
      const meter = allMasterMeters.find((m) => m.id === id);
      if (meter) {
        const isSelected = id === selectedMeterId;
        marker.setIcon(createMainPinIcon(L, meter, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      }
    });
  }, [selectedMeterId, allMasterMeters]);

  // ── Sync Radius Circle for the Active Meter (centered on that particular meter's lat & lng in GREEN) ──
  useEffect(() => {
    if (!mainMapRef.current || !window.L) return;
    const L = window.L;
    const map = mainMapRef.current;

    const lat = activeMeterConfig?.lat ?? activeLat;
    const lng = activeMeterConfig?.lng ?? activeLng;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    const tooltipText = `📍 Geofence Radius: ${geofenceRadius}m • ${activeMeter?.tag || activeMeter?.name || 'Meter'} (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`;

    if (!mainRadiusCircleRef.current) {
      const circle = L.circle([lat, lng], {
        radius: geofenceRadius,
        color: '#16A34A',
        weight: 2,
        opacity: isRadiusVisible ? 0.9 : 0,
        fillColor: '#16A34A',
        fillOpacity: isRadiusVisible ? 0.18 : 0,
        dashArray: '6, 6',
        className: 'geolocation-radius-geofence-circle',
      }).addTo(map);

      circle.bindTooltip(tooltipText, {
        permanent: false,
        direction: 'top',
        className: 'geolocation-radius-tooltip',
        offset: [0, -10],
      });

      mainRadiusCircleRef.current = circle;
    } else {
      const circle = mainRadiusCircleRef.current;
      circle.setLatLng([lat, lng]);
      circle.setRadius(geofenceRadius);
      circle.setStyle({
        color: '#16A34A',
        fillColor: '#16A34A',
        opacity: isRadiusVisible ? 0.9 : 0,
        fillOpacity: isRadiusVisible ? 0.18 : 0,
      });
      circle.setTooltipContent(tooltipText);
    }
  }, [activeMeterConfig?.lat, activeMeterConfig?.lng, geofenceRadius, isRadiusVisible, activeMeter?.tag, activeMeter?.name, activeLat, activeLng]);


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Place Geocoding Suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const qLower = query.toLowerCase();
    const isPerunduraiQuery = qLower.includes('peru') || qLower.includes('perudur') || qLower.includes('perund');
    const matchingPresets: SuggestionItem[] = PRESET_FACILITIES
      .filter((s) => s.name.toLowerCase().includes(qLower) || s.city.toLowerCase().includes(qLower) || s.query.toLowerCase().includes(qLower) || (isPerunduraiQuery && s.city.toLowerCase() === 'perundurai'))
      .map((s) => ({
        display_name: `${s.name} — ${s.city}, ${s.state}`,
        lat: String(s.lat),
        lon: String(s.lng),
      }));

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const combined = [...matchingPresets];
        data.forEach((item: any) => {
          if (!combined.some((c) => Math.abs(Number(c.lat) - Number(item.lat)) < 0.01)) {
            combined.push({
              display_name: item.display_name,
              lat: item.lat,
              lon: item.lon,
            });
          }
        });
        setSuggestions(combined);
        setShowDropdown(combined.length > 0);
      } else {
        setSuggestions(matchingPresets);
        setShowDropdown(matchingPresets.length > 0);
      }
    } catch {
      setSuggestions(matchingPresets);
      setShowDropdown(matchingPresets.length > 0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleExecuteSearch = async (customQuery?: string, lat?: number, lng?: number) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;

    setShowDropdown(false);

    // 1. If explicit lat/lng passed
    if (lat !== undefined && lng !== undefined) {
      setActiveLat(lat);
      setActiveLng(lng);
      setActiveZoom(18);
      const nearSite = PRESET_FACILITIES.find(
        (f) => Math.abs(f.lat - lat) < 0.05 && Math.abs(f.lng - lng) < 0.05
      );
      if (nearSite) {
        setSelectedSite(nearSite);
        setSelectedMeterId(nearSite.meters[0]?.id || '');
      }
      return;
    }

    // 2. Check if query is GPS coordinates (DMS or Decimal)
    const parsedCoords = parseCoordinates(q);
    if (parsedCoords) {
      setActiveLat(parsedCoords.lat);
      setActiveLng(parsedCoords.lng);
      setActiveZoom(18);

      const nearSite = PRESET_FACILITIES.find(
        (f) => Math.abs(f.lat - parsedCoords.lat) < 0.05 && Math.abs(f.lng - parsedCoords.lng) < 0.05
      );
      if (nearSite) {
        setSelectedSite(nearSite);
        setSelectedMeterId(nearSite.meters[0]?.id || '');
      }
      return;
    }

    // 3. Check if query matches a known preset facility keyword
    const qLower = q.toLowerCase();
    const isPerunduraiQuery = qLower.includes('peru') || qLower.includes('perudur') || qLower.includes('perund');
    const matchedFacility = PRESET_FACILITIES.find(
      (f) =>
        f.name.toLowerCase().includes(qLower) ||
        f.city.toLowerCase().includes(qLower) ||
        qLower.includes(f.city.toLowerCase()) ||
        qLower.includes(f.name.toLowerCase()) ||
        (isPerunduraiQuery && f.city.toLowerCase() === 'perundurai')
    );

    if (matchedFacility) {
      setSelectedSite(matchedFacility);
      setActiveLat(matchedFacility.lat);
      setActiveLng(matchedFacility.lng);
      setActiveZoom(matchedFacility.zoom || 19);
      if (allMasterMeters.length > 0) {
        handleSelectMeter(allMasterMeters[0]);
      } else {
        setSelectedMeterId(matchedFacility.meters[0]?.id || '');
      }
      return;
    }

    // 4. Geocode query with OpenStreetMap Nominatim for arbitrary places
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const latNum = parseFloat(data[0].lat);
          const lngNum = parseFloat(data[0].lon);
          setActiveLat(latNum);
          setActiveLng(lngNum);
          setActiveZoom(19);

          const nearSite = PRESET_FACILITIES.find(
            (f) => Math.abs(f.lat - latNum) < 0.08 && Math.abs(f.lng - lngNum) < 0.08
          );
          if (nearSite) {
            setSelectedSite(nearSite);
            if (allMasterMeters.length > 0) {
              handleSelectMeter(allMasterMeters[0]);
            } else {
              setSelectedMeterId(nearSite.meters[0]?.id || '');
            }
          }
        }
      }
    } catch {
      // Keep existing map view if network lookup fails
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setSearchQuery(item.display_name);
    const latNum = parseFloat(item.lat);
    const lngNum = parseFloat(item.lon);
    setActiveLat(latNum);
    setActiveLng(lngNum);
    handleExecuteSearch(item.display_name, latNum, lngNum);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocateError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setActiveLat(latitude);
        setActiveLng(longitude);
        const locStr = `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`;
        setSearchQuery(`My Current Location (${locStr})`);
        setActiveZoom(18);

        const nearSite = PRESET_FACILITIES.find(
          (f) => Math.abs(f.lat - latitude) < 0.05 && Math.abs(f.lng - longitude) < 0.05
        );
        if (nearSite) {
          setSelectedSite(nearSite);
          setSelectedMeterId(nearSite.meters[0]?.id || '');
        }
      },
      (err) => {
        setIsLocating(false);
        setLocateError(`Unable to retrieve location (${err.message}).`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Check if active view is at NNT Office coordinates (11.275143, 77.579820)
  const isViewingOffice = Math.abs(activeLat - 11.275143) < 0.003 && Math.abs(activeLng - 77.579820) < 0.003;

  // Google Maps dynamic embed URL centered on exact coordinates without Google's red query search pin
  const googleMapsUrl = `https://maps.google.com/maps?ll=${activeLat},${activeLng}&t=${mapType}&z=${activeZoom}&output=embed`;

  const externalGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`;

  // Dynamic Concern options merged with EnergyDataContext
  const allConcernsList = useMemo(() => {
    const defaults = [
      { name: 'NavaNala', label: 'NavaNala Facility (Perundurai)', siteId: 'site-navanala' },
      { name: 'Panikkampalayam', label: 'Panikkampalayam Facility (Perundurai)', siteId: 'site-panikkampalayam' },
    ];
    (energyData?.concerns || []).forEach((c: any) => {
      const cName = c.concern_name || c.name;
      if (
        cName &&
        !defaults.some((d) => d.name.toLowerCase() === cName.toLowerCase()) &&
        !cName.toLowerCase().includes('kulam') &&
        !cName.toLowerCase().includes('gobi')
      ) {
        defaults.push({
          name: cName,
          label: `${cName}${c.city ? ` (${c.city})` : ''}`,
          siteId: `site-${cName.toLowerCase().replace(/\s+/g, '-')}`,
        });
      }
    });
    return defaults;
  }, [energyData?.concerns]);

  // Concern Filter change handler with cinematic flight navigation
  const handleConcernChange = (concernName: string) => {
    if (concernName === selectedConcernName && !isFlying) return;
    setPreviousConcernName(selectedConcernName);
    setSelectedConcernName(concernName);

    const isPnk = concernName.toLowerCase().includes('panikkam');
    const targetSite =
      PRESET_FACILITIES.find(
        (f) =>
          f.concernName.toLowerCase() === concernName.toLowerCase() ||
          f.name.toLowerCase().includes(concernName.toLowerCase())
      ) || (isPnk ? PRESET_FACILITIES[1] : PRESET_FACILITIES[0]);

    setSelectedSite(targetSite);

    // Target coordinates and active meter: accurately match the concern's pinned meter
    let targetLat = targetSite.lat;
    let targetLng = targetSite.lng;
    let targetMeterId = isPnk ? 'MTR-JGL-01' : (allMasterMeters.find(m => m.id !== 'MTR-JGL-01')?.id || allMasterMeters[0]?.id || '');

    if (isPnk) {
      targetMeterId = 'MTR-JGL-01';
      const savedLat = localStorage.getItem('sab_mtr_pnk_lat_JGL-LG-5310') || localStorage.getItem('sab_mtr_lat_MTR-JGL-01');
      const savedLng = localStorage.getItem('sab_mtr_pnk_lng_JGL-LG-5310') || localStorage.getItem('sab_mtr_lng_MTR-JGL-01');
      const pLat = savedLat ? parseFloat(savedLat) : 11.275640;
      const pLng = savedLng ? parseFloat(savedLng) : 77.587940;
      targetLat = (pLat === 11.4469 || pLat === 11.2845 || pLat === 11.27552 || isNaN(pLat)) ? 11.275640 : pLat;
      targetLng = (pLng === 77.4597 || pLng === 77.4603 || pLng === 77.58812 || isNaN(pLng)) ? 77.587940 : pLng;
    } else {
      const savedLat = localStorage.getItem('sab_mtr_lat_ELM-LG-4418') || localStorage.getItem('sab_mtr_lat_MTR-CTX-Navanala_UPS_Meter');
      const savedLng = localStorage.getItem('sab_mtr_lng_ELM-LG-4418') || localStorage.getItem('sab_mtr_lng_MTR-CTX-Navanala_UPS_Meter');
      targetLat = savedLat ? parseFloat(savedLat) : 11.275143;
      targetLng = savedLng ? parseFloat(savedLng) : 77.579820;
    }

    if (targetMeterId) {
      setSelectedMeterId(targetMeterId);
    }

    const originLat = activeLat;
    const originLng = activeLng;

    setActiveLat(targetLat);
    setActiveLng(targetLng);
    setActiveZoom(19);

    if (mainMapRef.current && window.L) {
      const L = window.L;
      const map = mainMapRef.current;

      // Clean up previous flight trajectory
      if (flightPolylineRef.current) {
        flightPolylineRef.current.remove();
        flightPolylineRef.current = null;
      }
      if (flightOriginMarkerRef.current) {
        flightOriginMarkerRef.current.remove();
        flightOriginMarkerRef.current = null;
      }

      // Draw visible dashed flight trajectory polyline between origin and destination
      const flightPath = [
        [originLat, originLng],
        [targetLat, targetLng],
      ];
      const flightLine = L.polyline(flightPath, {
        color: '#1D3461',
        weight: 4,
        opacity: 0.9,
        dashArray: '10, 10',
        className: 'geolocation-flight-path',
      }).addTo(map);
      flightPolylineRef.current = flightLine;

      // Origin departure marker ring
      const originMarker = L.circleMarker([originLat, originLng], {
        radius: 8,
        color: '#1D3461',
        fillColor: '#FFFFFF',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      flightOriginMarkerRef.current = originMarker;

      setIsFlying(true);
      setFlyingDestination(targetSite.name || concernName);

      // Smooth cinematic camera flight centered precisely on the meter
      map.flyTo([targetLat + 0.00010, targetLng], 19, {
        duration: 1.8,
        easeLinearity: 0.25,
      });

      setTimeout(() => {
        setIsFlying(false);
        if (flightPolylineRef.current) {
          flightPolylineRef.current.remove();
          flightPolylineRef.current = null;
        }
        if (flightOriginMarkerRef.current) {
          flightOriginMarkerRef.current.remove();
          flightOriginMarkerRef.current = null;
        }

        // Open popup on destination meter marker
        const marker = mainMarkersMapRef.current.get(targetMeterId);
        if (marker) {
          marker.openPopup();
        }
      }, 2100);
    }
  };

  return (
    <div className="geolocation-container">
      {/* ── 1. Top Concern Filter & Controls Bar (Concern Filter in place of Search Bar) ── */}
      <div className="geolocation-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Concern Filter Selector & Quick Switcher */}
          <div className="geolocation-concern-filter-row" style={{ flex: 1, minWidth: '280px' }}>
            <div className="geolocation-concern-box">
              <Building2 size={16} style={{ color: '#1D3461', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0C1E36', whiteSpace: 'nowrap' }}>
                Concern:
              </span>
              <select
                value={selectedConcernName}
                onChange={(e) => handleConcernChange(e.target.value)}
                className="geolocation-concern-select"
                title="Select Concern to navigate on map"
              >
                {allConcernsList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Active Gateway Badge in Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'rgba(12, 30, 54, 0.06)',
              border: '1.5px solid rgba(12, 30, 54, 0.18)',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#0C1E36',
              flexShrink: 0,
            }}
          >
            <Radio size={12} style={{ color: '#1D3461' }} />
            <span>{selectedSite?.gatewayName || 'Enerlink IoT Gateway'} ({selectedSite?.gatewayMac || '441BF6D37C80'})</span>
            <span style={{ fontSize: '0.62rem', backgroundColor: 'rgba(29, 52, 97, 0.12)', color: '#1D3461', padding: '1px 6px', borderRadius: '4px', fontWeight: 750 }}>
              {selectedSite?.gatewayStatus || 'Online'}
            </span>
          </div>
        </div>

        {locateError && (
          <div style={{ fontSize: '0.70rem', color: '#DC2626', marginTop: '4px' }}>
            {locateError}
          </div>
        )}
      </div>

      {/* ── 2. Main Grid: Interactive Map (Left) + Detailed Meter Information (Right) ── */}
      <div className="geolocation-main-grid">
        {/* Left: Responsive Google Map Card */}
        <div className="geolocation-map-card">
          {/* Map Toolbar: Modes & Zoom Controls */}
          <div className="geolocation-map-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setMapType('m')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mapType === 'm' ? '#0C1E36' : 'transparent',
                  color: mapType === 'm' ? '#FFFFFF' : '#64748B',
                  boxShadow: mapType === 'm' ? '0 1px 4px rgba(12, 30, 54, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setMapType('k')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mapType === 'k' ? '#0C1E36' : 'transparent',
                  color: mapType === 'k' ? '#FFFFFF' : '#64748B',
                  boxShadow: mapType === 'k' ? '0 1px 4px rgba(12, 30, 54, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapType('h')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mapType === 'h' ? '#0C1E36' : 'transparent',
                  color: mapType === 'h' ? '#FFFFFF' : '#64748B',
                  boxShadow: mapType === 'h' ? '0 1px 4px rgba(12, 30, 54, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Hybrid
              </button>
              <button
                type="button"
                onClick={() => setMapType('p')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mapType === 'p' ? '#0C1E36' : 'transparent',
                  color: mapType === 'p' ? '#FFFFFF' : '#64748B',
                  boxShadow: mapType === 'p' ? '0 1px 4px rgba(12, 30, 54, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Terrain
              </button>
            </div>

            {/* Zoom Controls, Asset GPS Lock, & Google Maps Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Asset GPS Pin Lock: Prevents accidental dragging/shifting away from the pinned building */}
              <button
                type="button"
                onClick={() => setIsMapPanLocked((prev) => !prev)}
                title={
                  isMapPanLocked
                    ? 'Map is locked to pinned asset coordinates (Click to unlock pan)'
                    : 'Map pan is active (Click to lock to asset coordinates)'
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isMapPanLocked ? 'rgba(189, 98, 31, 0.12)' : '#FFFBEB',
                  border: `1px solid ${isMapPanLocked ? 'rgba(217, 162, 107, 0.40)' : '#FDE68A'}`,
                  color: isMapPanLocked ? '#BD621F' : '#B45309',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isMapPanLocked ? (
                  <>
                    <ShieldCheck size={12} style={{ color: '#BD621F' }} />
                    <span>Pinned Asset Locked</span>
                  </>
                ) : (
                  <>
                    <Navigation size={12} style={{ color: '#B45309' }} />
                    <span>Pan Active</span>
                  </>
                )}
              </button>

              {!isMapPanLocked && (
                <button
                  type="button"
                  onClick={() => {
                    if (mainMapRef.current && activeMeterConfig) {
                      mainMapRef.current.flyTo([activeMeterConfig.lat + 0.00010, activeMeterConfig.lng], 19, {
                        duration: 0.8,
                        easeLinearity: 0.25,
                      });
                      setTimeout(() => {
                        const marker = mainMarkersMapRef.current.get(selectedMeterId);
                        if (marker) marker.openPopup();
                      }, 500);
                    }
                    setActiveLat(activeMeterConfig.lat);
                    setActiveLng(activeMeterConfig.lng);
                    setActiveZoom(19);
                    setIsMapPanLocked(true);
                  }}
                  title="Snap back to pinned asset coordinates"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#0C1E36',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Crosshair size={12} />
                  <span>Snap to Pin</span>
                </button>
              )}

              {/* Fit All Meters button */}
              <button
                type="button"
                onClick={() => {
                  if (!mainMapRef.current || allMasterMeters.length === 0) return;
                  const bounds = allMasterMeters.map((m, idx) => {
                    const cfg = meterConfigs[m.id] || getInitialMeterConfig(m, idx);
                    return [cfg.lat, cfg.lng];
                  });
                  mainMapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 19 });
                }}
                title="Fit and view all meters on map"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAF9',
                  border: '1px solid var(--border-color, #E2E8E5)',
                  fontSize: '0.70rem',
                  fontWeight: 650,
                  color: '#0C1E36',
                  cursor: 'pointer',
                }}
              >
                <Layers size={12} />
                <span>Fit All Pins</span>
              </button>

              {/* Meter Geofence Radius Circle Control (Green) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  backgroundColor: isRadiusVisible ? 'rgba(22, 163, 74, 0.12)' : '#F8FAF9',
                  border: `1px solid ${isRadiusVisible ? 'rgba(22, 163, 74, 0.40)' : 'var(--border-color, #E2E8E5)'}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsRadiusVisible((prev) => !prev)}
                  title={isRadiusVisible ? 'Click to hide coverage radius circle' : 'Click to show coverage radius circle'}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isRadiusVisible ? '#16A34A' : 'var(--text-secondary, #64748B)',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px',
                  }}
                >
                  <CircleDot size={12} style={{ color: isRadiusVisible ? '#16A34A' : 'var(--text-secondary, #64748B)' }} />
                  <span>Radius: {geofenceRadius}m</span>
                </button>
                {isRadiusVisible && (
                  <select
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                    title="Change coverage radius distance"
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#16A34A',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    <option value={25}>25m</option>
                    <option value={50}>50m</option>
                    <option value={75}>75m</option>
                    <option value={100}>100m</option>
                    <option value={150}>150m</option>
                    <option value={200}>200m</option>
                  </select>
                )}
              </div>



              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color, #E2E8E5)', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => mainMapRef.current?.zoomIn()}
                  title="Zoom In"
                  style={{
                    padding: '3px 7px',
                    border: 'none',
                    backgroundColor: 'var(--card-bg, #FFFFFF)',
                    color: 'var(--text-secondary, #475569)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ZoomIn size={13} />
                </button>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0 5px', color: '#0C1E36', fontFamily: 'monospace' }}>
                  {activeZoom}x
                </span>
                <button
                  type="button"
                  onClick={() => mainMapRef.current?.zoomOut()}
                  title="Zoom Out"
                  style={{
                    padding: '3px 7px',
                    border: 'none',
                    backgroundColor: 'var(--card-bg, #FFFFFF)',
                    color: 'var(--text-secondary, #475569)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ZoomOut size={13} />
                </button>
              </div>

              <a
                href={externalGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open location directly in Google Maps"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAF9',
                  border: '1px solid var(--border-color, #E2E8E5)',
                  fontSize: '0.70rem',
                  fontWeight: 650,
                  color: '#0C1E36',
                  textDecoration: 'none',
                }}
              >
                <span>Google Maps</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Main Leaflet Interactive Map Container */}
          <div className="geolocation-map-frame-wrapper" style={{ position: 'relative' }}>
            {/* Live Navigation Flight Status HUD */}
            {isFlying && (
              <div className="geolocation-flight-hud-overlay">
                <div className="geolocation-flight-hud-badge">
                  <Navigation size={15} className="geolocation-flight-spinner" />
                  <div className="geolocation-flight-info">
                    <span className="geolocation-flight-title">
                      Navigating from <strong>{previousConcernName}</strong> → <strong>{selectedConcernName}</strong>
                    </span>
                    <span className="geolocation-flight-coords">
                      Flying to {flyingDestination} ({activeLat.toFixed(5)}° N, {activeLng.toFixed(5)}° E)
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div
              id="main-geolocation-leaflet-map"
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </div>
        </div>

        {/* Right: Dedicated Meter Details & Installation Placement Panel */}
        <div className="geolocation-meters-panel">
          {/* Meters at this Location (Primary View) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: '#0C1E36',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cpu size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1F2937', lineHeight: 1.2 }}>
                    Meters at this Location
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#0C1E36', fontWeight: 650 }}>
                    {selectedSite?.name || 'Active Site'} • {selectedSite?.city || 'Perundurai'}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(12, 30, 54, 0.08)',
                  color: '#0C1E36',
                  border: '1px solid rgba(12, 30, 54, 0.20)',
                  padding: '2px 7px',
                  borderRadius: '12px',
                }}
              >
                {allMasterMeters.length} Meters Present
              </span>
            </div>

            {/* Notification Toast when a meter's location / image is saved */}
            {saveSuccessToast && (
              <div className="geolocation-auto-save-toast">
                <Check size={13} />
                <span>{saveSuccessToast}</span>
              </div>
            )}

            {/* List of Meters from Meter Master (Click ANY meter to dynamically switch) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allMasterMeters.map((meter) => {
                const isSelected = meter.id === selectedMeterId;
                const cfg = meterConfigs[meter.id] || getInitialMeterConfig(meter, meter.slaveId === 2 ? 1 : 0);

                return (
                  <div
                    key={meter.id}
                    onClick={() => handleSelectMeter(meter)}
                    className={`geolocation-meter-card ${isSelected ? 'active-selected' : ''}`}
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(189, 98, 31, 0.04)' : '#FFFFFF',
                      border: isSelected ? '1.5px solid #BD621F' : '1px solid #E2E8F0',
                      borderTop: isSelected ? '2.5px solid #BD621F' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? 'inset 0 1px 0 rgba(251, 146, 60, 0.3), 0 3px 12px rgba(189, 98, 31, 0.16)'
                        : '0 1px 3px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.16s ease',
                    }}
                    title={`Click to switch map view to ${meter.name} (${meter.tag})`}
                  >
                    {/* Meter Header: Tag, Name & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#BD621F' : '#0C1E36',
                            display: 'inline-block',
                            flexShrink: 0,
                            boxShadow: isSelected ? '0 0 0 3px rgba(189, 98, 31, 0.3)' : 'none',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 750,
                            color: isSelected ? '#BD621F' : '#1E293B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {meter.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              background: 'linear-gradient(180deg, #F97316 0%, #BD621F 100%)',
                              borderTop: '1px solid rgba(251, 146, 60, 0.8)',
                              color: '#FFFFFF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.3px',
                              boxShadow: '0 1px 4px rgba(189, 98, 31, 0.35)',
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            backgroundColor: isSelected ? 'rgba(189, 98, 31, 0.10)' : 'rgba(12, 30, 54, 0.06)',
                            border: `1px solid ${isSelected ? 'rgba(189, 98, 31, 0.40)' : 'rgba(12, 30, 54, 0.18)'}`,
                            color: isSelected ? '#BD621F' : '#0C1E36',
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>{meter.tag}</span>
                          <span>•</span>
                          <span>{meter.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Physical Placement Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', paddingLeft: '14px' }}>
                      <MapPin size={12} style={{ color: isSelected ? '#BD621F' : '#0C1E36', flexShrink: 0 }} />
                      <span style={{ fontWeight: 550, color: '#475569' }}>
                        {cfg?.placeName || meter.placementLocation}
                      </span>
                    </div>

                    {/* Coordinates & Thumbnail Row + Configure Button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '4px',
                        borderTop: '1px solid #F1F5F9',
                        paddingLeft: '14px',
                        marginTop: '1px',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img
                          src={cfg.image || '/images/nnt-office.jpg'}
                          alt={meter.name}
                          style={{
                            width: '30px',
                            height: '22px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            border: '1px solid #CBD5E1',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/nnt-office.jpg';
                          }}
                        />
                        <span style={{ fontSize: '0.67rem', color: '#64748B', fontFamily: 'monospace' }}>
                          {cfg.lat.toFixed(5)}°, {cfg.lng.toFixed(5)}°
                        </span>
                        {isSelected && isRadiusVisible && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#16A34A',
                              backgroundColor: 'rgba(22, 163, 74, 0.12)',
                              border: '1px solid rgba(22, 163, 74, 0.35)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                            title={`Geofence coverage radius: ${geofenceRadius}m`}
                          >
                            <CircleDot size={9} />
                            {geofenceRadius}m
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenConfigModal(meter);
                        }}
                        className="geolocation-card-config-btn"
                        title="Configure location, pin GPS on map, and update photo"
                      >
                        <Sliders size={12} />
                        <span>Configure &amp; Pin</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Configuration & Pinning Modal ── */}
      {configModalMeter && (
        <div className="geolocation-modal-overlay" onClick={() => setConfigModalMeter(null)}>
          <div className="geolocation-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="geolocation-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="geolocation-modal-icon-badge">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Configure Meter Geolocation &amp; Asset Pin
                  </h2>
                  <div style={{ fontSize: '0.72rem', color: '#0C1E36', fontWeight: 650, marginTop: '1px' }}>
                    {configModalMeter.name} • {configModalMeter.tag}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalMeter(null)}
                className="geolocation-modal-close-btn"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="geolocation-modal-body">
              {/* Section 1: Coordinates Pinning */}
              <div className="geolocation-modal-section">
                <div className="geolocation-modal-section-header">
                  <label className="geolocation-modal-section-title">
                    <MapPin size={13} style={{ color: '#1D3461' }} />
                    <span>Pinned GPS Coordinates</span>
                  </label>
                  <div className="geolocation-modal-quick-presets">
                    <button
                      type="button"
                      onClick={() => updateModalPinCoords(11.275640, 77.587940, true)}
                      className="geolocation-modal-preset-btn"
                      title="Jega Garments Panickampalayam (11.275640, 77.587940)"
                    >
                      <Building size={11} style={{ color: '#BD621F' }} />
                      <span>Jega Garments</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateModalPinCoords(11.275143, 77.579820, true)}
                      className="geolocation-modal-preset-btn"
                      title="NNT Head Office (11.275143, 77.579820)"
                    >
                      <Building size={11} style={{ color: '#0C1E36' }} />
                      <span>NNT Office</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            updateModalPinCoords(pos.coords.latitude, pos.coords.longitude, true);
                          });
                        }
                      }}
                      className="geolocation-modal-preset-btn"
                      title="Use live device location"
                    >
                      <Crosshair size={11} style={{ color: '#1D3461' }} />
                      <span>Live GPS</span>
                    </button>
                  </div>
                </div>

                <div className="geolocation-modal-coords-grid">
                  <div>
                    <label className="geolocation-modal-label">Latitude (°N)</label>
                    <input
                      type="number"
                      step="any"
                      value={editLat}
                      onChange={(e) => updateModalPinCoords(parseFloat(e.target.value) || 0, editLng, true)}
                      className="geolocation-modal-input"
                      placeholder="11.275143"
                    />
                  </div>
                  <div>
                    <label className="geolocation-modal-label">Longitude (°E)</label>
                    <input
                      type="number"
                      step="any"
                      value={editLng}
                      onChange={(e) => updateModalPinCoords(editLat, parseFloat(e.target.value) || 0, true)}
                      className="geolocation-modal-input"
                      placeholder="77.579820"
                    />
                  </div>
                </div>

                {/* Interactive Leaflet Satellite Pin Picker */}
                <div className="geolocation-modal-picker-wrapper">
                  <div id="modal-pin-picker-map" style={{ width: '100%', height: '100%', cursor: 'crosshair' }} />
                  <div className="geolocation-picker-coord-badge">
                    <MapPin size={11} style={{ color: '#1D3461' }} />
                    <span>{editLat.toFixed(6)}° N, {editLng.toFixed(6)}° E</span>
                  </div>
                </div>
                <div className="geolocation-modal-hint">
                  Drag the marker or click anywhere on the satellite view to set this meter's installation position.
                </div>
              </div>

              {/* Section 2: Installation Placement Name */}
              <div className="geolocation-modal-section">
                <label className="geolocation-modal-section-title">
                  <Building size={13} style={{ color: '#1D3461' }} />
                  <span>Physical Placement / Area Name</span>
                </label>
                <input
                  type="text"
                  value={editPlaceName}
                  onChange={(e) => setEditPlaceName(e.target.value)}
                  className="geolocation-modal-input"
                  placeholder="e.g. Main Switchboard Room, Panel B"
                />
              </div>

              {/* Section 3: Asset Location Photo Upload */}
              <div className="geolocation-modal-section">
                <label className="geolocation-modal-section-title">
                  <ImageIcon size={13} style={{ color: '#1D3461' }} />
                  <span>Location Card Image</span>
                </label>
                <div className="geolocation-modal-photo-card">
                  <div className="geolocation-modal-photo-thumb">
                    <img
                      src={editImage || '/images/nnt-office.jpg'}
                      alt="Location Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/nnt-office.jpg';
                      }}
                    />
                  </div>

                  <div className="geolocation-modal-photo-info">
                    <div className="geolocation-modal-photo-actions">
                      <label className="geolocation-modal-upload-btn">
                        <Upload size={13} />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressImage(file);
                              setEditImage(compressed);
                            }
                          }}
                        />
                      </label>
                      {editImage && editImage !== '/images/nnt-office.jpg' && (
                        <button
                          type="button"
                          onClick={() => setEditImage('/images/nnt-office.jpg')}
                          className="geolocation-modal-reset-btn"
                          title="Reset to default facility image"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="geolocation-modal-photo-help">
                      Shown on the map pop-up card for this meter. PNG or JPG up to 10MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="geolocation-modal-footer">
              <button
                type="button"
                onClick={() => setConfigModalMeter(null)}
                className="geolocation-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="geolocation-modal-save-btn"
              >
                <Check size={14} />
                <span>Save &amp; Pin to Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeolocationPage;

