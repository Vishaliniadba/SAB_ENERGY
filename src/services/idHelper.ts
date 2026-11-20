/**
 * ID & Foreign Key Helper for SaB Energy SCADA Platform
 * Ensures strict compliance with ASP.NET Core backend integer primary keys (int32).
 */

/**
 * Safely parses any value (number, numeric string, object) into a positive integer database ID.
 * Returns null if the value is non-numeric, <= 0, or invalid.
 */
export function toIntegerId(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : null;
  }
  if (typeof val === 'object' && val !== null) {
    return toIntegerId(val.id ?? val.Id ?? val.gatewayId ?? val.meterId ?? val.channelId ?? val.makeId ?? val.modelId);
  }
  const str = String(val).trim();
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return num > 0 ? num : null;
  }
  return null;
}

/**
 * Checks if a value is a valid integer primary key.
 */
export function isValidIntegerId(val: any): boolean {
  return toIntegerId(val) !== null;
}

/**
 * Known device-code to integer primary key mapping.
 */
const KNOWN_CODE_TO_ID: Record<string, number> = {
  'GW-ENERLINK': 1,
  'MOD-LG5310': 1,
  'MOD-LG6400': 2,
};

/**
 * Resolves a database integer ID from either an integer, numeric string, or known business code.
 * If the value cannot be resolved to an integer, returns the provided default fallback (or null).
 */
export function resolveIntegerId(val: any, defaultFallback: number | null = null): number | null {
  const direct = toIntegerId(val);
  if (direct !== null) return direct;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (KNOWN_CODE_TO_ID[trimmed]) {
      return KNOWN_CODE_TO_ID[trimmed];
    }
  }

  return defaultFallback;
}

/**
 * Asserts that an ID is a valid integer for an API route/query parameter.
 * Throws a descriptive Error instead of letting an invalid string reach the backend and cause HTTP 400.
 */
export function ensureValidIntegerId(id: any, entityName = 'Record'): number {
  const resolved = resolveIntegerId(id);
  if (resolved === null) {
    throw new Error(
      `Invalid ${entityName} ID: '${String(id)}'. The backend API requires an integer database primary key, but a non-numeric business code was provided.`
    );
  }
  return resolved;
}

