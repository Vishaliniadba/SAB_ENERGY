import { request } from './client';

const BASE_URL = '/api/Enerlink';
export const DEFAULT_DEVICE_ID = '441BF6D37C80';

export interface EnerlinkTelemetryReading {
  profile_id: string;
  device_id: string;
  meter_serial: string;
  channel: number;
  slave_id: number;
  meter_name: string;
  log_ts: string;
  timestamp_ms: number;
  message_id: number;
  values: Array<Record<string, number | string>>;
  placementLocation?: string;
  concern?: string;
  serviceNo?: string;
  meter_model?: string;
  isOffline?: boolean;
}

export interface EnerlinkBrokerStatus {
  isConnected: boolean;
}

export interface EnerlinkTestConnectionResponse {
  connected: string;
  isConnected: boolean;
  deviceId: string;
  response?: string;
}

export const enerlinkApi = {
  /**
   * Tests connection to edge hardware gateway via MQTT / Enerlink
   */
  testConnection: async (deviceId: string = DEFAULT_DEVICE_ID, cmd: string = 'test'): Promise<any> => {
    try {
      const res = await request(`${BASE_URL}/test-connection`, {
        method: 'POST',
        body: JSON.stringify({
          cmd,
          device_id: deviceId ? deviceId.replace(/[^a-zA-Z0-9]/g, '') : DEFAULT_DEVICE_ID,
        }),
      });
      const dataObj = res?.data || res || {};
      const isConn = Boolean(
        dataObj.isConnected === true ||
        dataObj.connected === 'YES' ||
        res?.isConnected === true ||
        res?.connected === 'YES' ||
        res?.isSuccess === true
      );
      return {
        ...res,
        connected: isConn ? 'YES' : 'NO',
        isConnected: isConn,
        deviceId: dataObj.deviceId || deviceId,
        data: dataObj,
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        connected: 'NO',
        isConnected: false,
        deviceId,
        error: err?.message || 'Connection failed',
      };
    }
  },

  /**
   * Fetches latest decoded live telemetry from device
   */
  getLatestTelemetry: (
    deviceId: string = DEFAULT_DEVICE_ID,
    options?: { channelId?: number | string; slaveId?: number | string | number[] } | number
  ): Promise<any> => {
    const cleanId = (deviceId || DEFAULT_DEVICE_ID).replace(/[^a-zA-Z0-9]/g, '') || DEFAULT_DEVICE_ID;
    const params = new URLSearchParams();

    if (typeof options === 'number') {
      if (!isNaN(options) && Number.isInteger(options) && options > 0) {
        params.append('slaveId', String(options));
      }
    } else if (options && typeof options === 'object') {
      if (options.channelId !== undefined && options.channelId !== '' && options.channelId !== 'all') {
        params.append('channelId', String(options.channelId));
      }
      if (options.slaveId !== undefined && options.slaveId !== '' && options.slaveId !== 'all') {
        if (Array.isArray(options.slaveId)) {
          options.slaveId.forEach((s) => {
            const num = Number(s);
            if (!isNaN(num) && Number.isInteger(num) && num > 0) {
              params.append('slaveId', String(num));
            }
          });
        } else {
          const num = Number(options.slaveId);
          if (!isNaN(num) && Number.isInteger(num) && num > 0) {
            params.append('slaveId', String(num));
          }
        }
      }
    }

    const query = params.toString();
    const url = query
      ? `${BASE_URL}/devices/${encodeURIComponent(cleanId)}/telemetry/latest?${query}`
      : `${BASE_URL}/devices/${encodeURIComponent(cleanId)}/telemetry/latest`;

    return request(url).catch((err: any) => {
      // 404 means no live telemetry is stored for this device yet (device in standby or offline)
      if (err?.status === 404 || (err?.message && err.message.toLowerCase().includes('not found'))) {
        return { isSuccess: false, data: [], message: 'No live telemetry found for device' };
      }
      return { isSuccess: false, data: [], message: err?.message || 'Telemetry unavailable' };
    });
  },

  /**
   * Checks real-time MQTT broker status
   */
  getBrokerStatus: (): Promise<any> =>
    request(`${BASE_URL}/broker/status`).catch(() => ({
      isSuccess: false,
      isConnected: false,
      data: { isConnected: false },
    })),

  /**
   * Sends device command payload to hardware
   */
  sendCommand: (deviceId: string = DEFAULT_DEVICE_ID, payload: any = {}): Promise<any> => {
    const cleanId = (deviceId || DEFAULT_DEVICE_ID).replace(/[^a-zA-Z0-9]/g, '') || DEFAULT_DEVICE_ID;
    return request(`${BASE_URL}/devices/${encodeURIComponent(cleanId)}/cmd`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetches current configuration from persistent store
   * Endpoint: http://192.23.1.7:8007/api/Enerlink/configuration
   */
  getConfiguration: async (deviceId: string = DEFAULT_DEVICE_ID): Promise<any> => {
    try {
      const saved = localStorage.getItem('sab_enerlink_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  },

  /**
   * Saves or updates configuration
   * Endpoint: POST http://192.23.1.7:8007/api/Enerlink/configuration
   */
  saveConfiguration: async (payload: any): Promise<any> => {
    const cleanId = (payload.device_id || payload.deviceId || DEFAULT_DEVICE_ID).replace(/[^a-zA-Z0-9_-]/g, '') || DEFAULT_DEVICE_ID;

    // Format payload strictly matching ASP.NET Core endpoint schema
    const formattedPayload: any = {
      device_id: cleanId,
    };

    if (payload.polling_time !== undefined && payload.polling_time !== null) {
      formattedPayload.polling_time = Number(payload.polling_time);
      formattedPayload.polling_time_unit = String(payload.polling_time_unit || 'seconds').toLowerCase();
    }

    if (payload.mqtt_publish !== undefined && payload.mqtt_publish !== null) {
      formattedPayload.mqtt_publish = Number(payload.mqtt_publish);
      formattedPayload.mqtt_publish_unit = String(payload.mqtt_publish_unit || 'minutes').toLowerCase();
    }

    let responseData: any = null;

    // 1. Try relative URL through Vite dev proxy
    try {
      responseData = await request(`${BASE_URL}/configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedPayload),
      });
    } catch (err: any) {
      // 2. Direct call to active backend host http://192.23.1.7:8007
      try {
        const directRes = await fetch('http://192.23.1.7:8007/api/Enerlink/configuration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedPayload),
        });
        if (directRes.ok) {
          responseData = await directRes.json();
        } else {
          const errJson = await directRes.json().catch(() => null);
          throw new Error(errJson?.message || `Backend responded with HTTP ${directRes.status}`);
        }
      } catch (directErr: any) {
        throw new Error(directErr?.message || err?.message || 'Failed to apply configuration to Enerlink backend.');
      }
    }

    // Cache successful config locally
    if (responseData) {
      try {
        localStorage.setItem(
          'sab_enerlink_config',
          JSON.stringify({
            ...formattedPayload,
            ...(responseData?.data || {}),
          })
        );
      } catch (_) {}
    }

    return responseData;
  },
};

export default enerlinkApi;

