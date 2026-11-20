// ─── Concern, Location & Service No Master API ──────────────────────────────
export interface ConcernRecord {
  id: string;
  concern_code: string;
  concern_name: string;
  client_category: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at?: string;
}

export interface LocationRecord {
  id: string;
  location_code: string;
  location_name: string;
  concern_name: string;
  building: string;
  floor: string;
  area_type: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at?: string;
}

export interface ServiceNoRecord {
  id: string;
  service_no: string;
  service_name: string;
  concern_name: string;
  location_name: string;
  meter_tag: string;
  meter_serial_number: string;
  sanctioned_load_kw: number;
  tariff_category: string;
  power_factor_target: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at?: string;
  sub_meter_count?: number;
  sub_meters?: string[];
  meter_name?: string;
}

// ─── Initial Seed Records (Empty by default: records sourced from database/user configuration) ─────
export const INITIAL_CONCERNS: ConcernRecord[] = [];
export const INITIAL_LOCATIONS: LocationRecord[] = [];
export const INITIAL_SERVICE_NOS: ServiceNoRecord[] = [];

const STORAGE_KEY_CONCERNS = 'sab_concerns';
const STORAGE_KEY_LOCATIONS = 'sab_locations';
const STORAGE_KEY_SERVICE_NOS = 'sab_service_nos';

const getStored = <T>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to persist to ${key}:`, err);
  }
};

// ─── Concern Master API ─────────────────────────────────────────────────────
export const concernMasterApi = {
  getAll: async (): Promise<ConcernRecord[]> => {
    return getStored<ConcernRecord>(STORAGE_KEY_CONCERNS, INITIAL_CONCERNS);
  },

  create: async (payload: Omit<ConcernRecord, 'id' | 'created_at'>): Promise<ConcernRecord> => {
    const list = getStored<ConcernRecord>(STORAGE_KEY_CONCERNS, INITIAL_CONCERNS);
    const newRecord: ConcernRecord = {
      ...payload,
      id: `CON-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    list.unshift(newRecord);
    setStored(STORAGE_KEY_CONCERNS, list);
    return newRecord;
  },

  update: async (id: string, payload: Partial<ConcernRecord>): Promise<ConcernRecord> => {
    const list = getStored<ConcernRecord>(STORAGE_KEY_CONCERNS, INITIAL_CONCERNS);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Concern with ID ${id} not found.`);
    list[idx] = {
      ...list[idx],
      ...payload,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setStored(STORAGE_KEY_CONCERNS, list);
    return list[idx];
  },

  delete: async (id: string): Promise<boolean> => {
    const list = getStored<ConcernRecord>(STORAGE_KEY_CONCERNS, INITIAL_CONCERNS);
    const filtered = list.filter((c) => c.id !== id);
    setStored(STORAGE_KEY_CONCERNS, filtered);
    return true;
  },
};

// ─── Location Master API ────────────────────────────────────────────────────
export const locationMasterApi = {
  getAll: async (): Promise<LocationRecord[]> => {
    return getStored<LocationRecord>(STORAGE_KEY_LOCATIONS, INITIAL_LOCATIONS);
  },

  create: async (payload: Omit<LocationRecord, 'id' | 'created_at'>): Promise<LocationRecord> => {
    const list = getStored<LocationRecord>(STORAGE_KEY_LOCATIONS, INITIAL_LOCATIONS);
    const newRecord: LocationRecord = {
      ...payload,
      id: `LOC-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    list.unshift(newRecord);
    setStored(STORAGE_KEY_LOCATIONS, list);
    return newRecord;
  },

  update: async (id: string, payload: Partial<LocationRecord>): Promise<LocationRecord> => {
    const list = getStored<LocationRecord>(STORAGE_KEY_LOCATIONS, INITIAL_LOCATIONS);
    const idx = list.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Location with ID ${id} not found.`);
    list[idx] = {
      ...list[idx],
      ...payload,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setStored(STORAGE_KEY_LOCATIONS, list);
    return list[idx];
  },

  delete: async (id: string): Promise<boolean> => {
    const list = getStored<LocationRecord>(STORAGE_KEY_LOCATIONS, INITIAL_LOCATIONS);
    const filtered = list.filter((l) => l.id !== id);
    setStored(STORAGE_KEY_LOCATIONS, filtered);
    return true;
  },
};

// ─── Service No Master API ──────────────────────────────────────────────────
export const serviceNoMasterApi = {
  getAll: async (): Promise<ServiceNoRecord[]> => {
    return getStored<ServiceNoRecord>(STORAGE_KEY_SERVICE_NOS, INITIAL_SERVICE_NOS);
  },

  create: async (payload: Omit<ServiceNoRecord, 'id' | 'created_at'>): Promise<ServiceNoRecord> => {
    const list = getStored<ServiceNoRecord>(STORAGE_KEY_SERVICE_NOS, INITIAL_SERVICE_NOS);
    const newRecord: ServiceNoRecord = {
      ...payload,
      id: `SVC-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    list.unshift(newRecord);
    setStored(STORAGE_KEY_SERVICE_NOS, list);
    return newRecord;
  },

  update: async (id: string, payload: Partial<ServiceNoRecord>): Promise<ServiceNoRecord> => {
    const list = getStored<ServiceNoRecord>(STORAGE_KEY_SERVICE_NOS, INITIAL_SERVICE_NOS);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Service No with ID ${id} not found.`);
    list[idx] = {
      ...list[idx],
      ...payload,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setStored(STORAGE_KEY_SERVICE_NOS, list);
    return list[idx];
  },

  delete: async (id: string): Promise<boolean> => {
    const list = getStored<ServiceNoRecord>(STORAGE_KEY_SERVICE_NOS, INITIAL_SERVICE_NOS);
    const filtered = list.filter((s) => s.id !== id);
    setStored(STORAGE_KEY_SERVICE_NOS, filtered);
    return true;
  },
};
