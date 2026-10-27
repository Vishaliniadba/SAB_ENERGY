import React from 'react';

/**
 * 1. Total Gateways Icon (Industrial IoT Gateway)
 * Authentic IoT gateway with soft duotone tinted chassis, dual dipole antennas,
 * Modbus/Ethernet port, and colored status LEDs (Power: Green, Link: Blue).
 */
export const TotalGatewaysIcon = ({
  size = 20,
  color = 'currentColor',
  ledColor1 = '#10B981', // Power LED (Emerald Green)
  ledColor2 = '#3B82F6', // Link/Tx LED (Blue)
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Left dipole antenna */}
    <path d="M6 9V3.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <circle cx="6" cy="2.8" r="1.3" fill={color} />

    {/* Right dipole antenna */}
    <path d="M18 9V3.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <circle cx="18" cy="2.8" r="1.3" fill={color} />

    {/* Gateway chassis with duotone soft tint */}
    <rect
      x="2.5"
      y="9"
      width="19"
      height="12"
      rx="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={color}
      fillOpacity="0.12"
    />

    {/* Front panel RJ-45 / RS-485 port */}
    <rect
      x="13.5"
      y="12.5"
      width="5.5"
      height="4.5"
      rx="1"
      stroke={color}
      strokeWidth={1.5}
      fill={color}
      fillOpacity="0.2"
    />
    <line x1="15.5" y1="12.5" x2="15.5" y2="14.5" stroke={color} strokeWidth={1} strokeLinecap="round" />
    <line x1="17" y1="12.5" x2="17" y2="14.5" stroke={color} strokeWidth={1} strokeLinecap="round" />

    {/* Status LEDs (Live indicator lights) */}
    <circle cx="6" cy="15" r="1.15" fill={ledColor1} />
    <circle cx="9.5" cy="15" r="1.15" fill={ledColor2} />
  </svg>
);

/**
 * 2. Online / Active Icon (High-Fidelity Telemetry Broadcast)
 * Features concentric wireless waves with layered opacities and pulsing beacon core.
 */
export const OnlineActiveIcon = ({
  size = 20,
  color = 'currentColor',
  pulseColor,
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Outer broadcast wave (soft) */}
    <path
      d="M2.5 8C5.5 5 8.7 3.5 12 3.5C15.3 3.5 18.5 5 21.5 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.55"
    />

    {/* Mid broadcast wave (medium) */}
    <path
      d="M5.8 11.5C7.6 9.8 9.7 8.8 12 8.8C14.3 8.8 16.4 9.8 18.2 11.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Inner broadcast wave (strong) */}
    <path
      d="M9 15C10 14 11 13.5 12 13.5C13 13.5 14 14 15 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />

    {/* Pulse ring aura */}
    <circle cx="12" cy="19" r="3" fill={color} fillOpacity="0.22" />

    {/* Center transmission beacon core */}
    <circle cx="12" cy="19" r="1.6" fill={pulseColor || color} />
  </svg>
);

/**
 * 3. Offline / Alert Icon (Severed Signal & Alert Indicator)
 * Features severed signal arcs, alert beacon, and bold diagonal disconnect strike.
 */
export const OfflineAlertIcon = ({
  size = 20,
  color = 'currentColor',
  slashColor,
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Outer arc segments (broken by slash) */}
    <path
      d="M2.5 8C4.3 6.3 6.4 5.1 8.8 4.4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M15.2 4.4C17.6 5.1 19.7 6.3 21.5 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.6"
    />

    {/* Mid arc segments */}
    <path
      d="M5.8 11.5C7 10.3 8.4 9.5 9.9 9.1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M14.1 9.1C15.6 9.5 17 10.3 18.2 11.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Inner arc segment */}
    <path
      d="M9 15C9.8 14.3 10.9 13.8 12 13.8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />

    {/* Severed slash line (bold) */}
    <line
      x1="2.5"
      y1="2.5"
      x2="21.5"
      y2="21.5"
      stroke={slashColor || color}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />

    {/* Offline beacon core */}
    <circle cx="12" cy="19" r="1.6" fill={color} />
  </svg>
);

/**
 * 4. Connected Meters Icon (Industrial Digital kWh Energy Meter)
 * Features backlit LCD screen, golden energy lightning bolt, and terminal pins.
 */
export const ConnectedMetersIcon = ({
  size = 20,
  color = 'currentColor',
  boltColor = '#F59E0B', // Amber Gold Energy Bolt
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Meter chassis with soft duotone background */}
    <rect
      x="4"
      y="3"
      width="16"
      height="17"
      rx="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={color}
      fillOpacity="0.12"
    />

    {/* Digital LCD display window */}
    <rect
      x="7"
      y="6"
      width="10"
      height="4"
      rx="1"
      stroke={color}
      strokeWidth={1.4}
      fill={color}
      fillOpacity="0.25"
    />
    {/* LCD readout digits indicator */}
    <line
      x1="9"
      y1="8"
      x2="15"
      y2="8"
      stroke={color}
      strokeWidth={1.4}
      strokeDasharray="1.5 1"
      strokeLinecap="round"
    />

    {/* Energy bolt glyph (vibrant lightning bolt) */}
    <path
      d="M12.5 11.5L9.8 14.5H13L11.5 17.8"
      stroke={boltColor}
      strokeWidth={2}
      strokeLinejoin="miter"
      strokeLinecap="round"
      fill={boltColor}
      fillOpacity="0.35"
    />

    {/* Bottom terminal pins (L, N, Modbus RS-485) */}
    <line x1="8" y1="20" x2="8" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <line x1="12" y1="20" x2="12" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <line x1="16" y1="20" x2="16" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

export default {
  TotalGatewaysIcon,
  OnlineActiveIcon,
  OfflineAlertIcon,
  ConnectedMetersIcon,
};
