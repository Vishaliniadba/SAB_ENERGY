import React from 'react';

export interface CardIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  pulseColor?: string;
  slashColor?: string;
  ledColor1?: string;
  ledColor2?: string;
  boltColor?: string;
}

/**
 * 1. Total Gateways Icon (Industrial IoT Gateway)
 * Authentic IoT gateway with soft duotone tinted chassis, dual dipole antennas,
 * Modbus/Ethernet port, and colored status LEDs (Power: Green, Link: Blue).
 */
export const TotalGatewaysIcon: React.FC<CardIconProps> = ({
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
export const OnlineActiveIcon: React.FC<CardIconProps> = ({
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
export const OfflineAlertIcon: React.FC<CardIconProps> = ({
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
export const ConnectedMetersIcon: React.FC<CardIconProps> = ({
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

/**
 * 5. Asset Mapping Hub & Network Nodes Icon
 * Matching exact network node topology: central hub connected to 6 peripheral nodes.
 */
export const AssetMappingIcon: React.FC<CardIconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth ? (strokeWidth / 2) * 8 : 8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ ...style, flexShrink: 0 }}
    {...props}
  >
    {/* Peripheral connection branches */}
    <line x1="40.6" y1="51.1" x2="24.7" y2="29.5" />
    <line x1="62.5" y1="46.8" x2="67.7" y2="26.7" />
    <line x1="74.0" y1="53.3" x2="100.0" y2="26.4" />
    <line x1="81.6" y1="76.7" x2="97.2" y2="79.6" />
    <line x1="71.4" y1="92.9" x2="81.7" y2="106.8" />
    <line x1="34.2" y1="86.2" x2="20.5" y2="95.1" />

    {/* Center node */}
    <circle cx="56" cy="72" r="26" />

    {/* Peripheral nodes */}
    <circle cx="17" cy="19" r="13" />
    <circle cx="70" cy="18" r="9" />
    <circle cx="109" cy="17" r="13" />
    <circle cx="110" cy="82" r="13" />
    <circle cx="87" cy="114" r="9" />
    <circle cx="13" cy="100" r="9" />
  </svg>
);

/**
 * 6. Gateway Router Icon (IoT Edge Gateway)
 * Dual vertical antennas, wireless Wi-Fi telemetry waves, rounded chassis with port and LED indicators.
 */
export const GatewayRouterIcon: React.FC<CardIconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => {
  const sw = strokeWidth ? (strokeWidth / 2) * 8 : 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ ...style, flexShrink: 0 }}
      {...props}
    >
      {/* Dual vertical antennas */}
      <line x1="24" y1="14" x2="24" y2="74" />
      <line x1="104" y1="14" x2="104" y2="74" />

      {/* Central wireless Wi-Fi telemetry arcs */}
      <path d="M 42.8 41.8 A 30 30 0 0 1 85.2 41.8" />
      <path d="M 52.7 51.7 A 16 16 0 0 1 75.3 51.7" />
      <circle cx="64" cy="63" r="3.5" fill={color} stroke="none" />

      {/* Gateway main chassis */}
      <rect x="8" y="74" width="112" height="40" rx="20" />

      {/* Front panel port and indicator LEDs */}
      <line x1="26" y1="94" x2="40" y2="94" />
      <circle cx="88" cy="94" r="4.2" fill={color} stroke="none" />
      <circle cx="104" cy="94" r="4.2" fill={color} stroke="none" />
    </svg>
  );
};

/**
 * 7. Location Pin with Ground Target Icon
 * Custom location marker with ground ellipse ring matching user specification.
 */
export const LocationPinIcon: React.FC<CardIconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ ...style, flexShrink: 0 }}
    {...props}
  >
    {/* Ground target ring / location footprint */}
    <ellipse cx="12" cy="19.6" rx="9" ry="2.8" />

    {/* Location pin outer contour */}
    <path d="M 12 18.2 L 7.5 10.4 A 5.2 5.2 0 1 1 16.5 10.4 Z" />

    {/* Center beacon eye / hole */}
    <circle cx="12" cy="7.8" r="2.2" />
  </svg>
);

/**
 * 8. Master Crown Icon (Master Console / Storage Chassis)
 * Console chassis with front status indicator and stamped crown emblem matching user reference.
 */
export const MasterCrownIcon: React.FC<CardIconProps> = ({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ ...style, flexShrink: 0 }}
    {...props}
  >
    {/* Outer chassis perimeter with perspective top */}
    <path d="M 6.2 4.5 L 17.8 4.5 C 18.7 4.5 19.4 5.2 19.6 6 L 21.4 14.5 C 21.5 15 21.5 15.5 21.5 16 L 21.5 19 C 21.5 19.8 20.8 20.5 20 20.5 L 4 20.5 C 3.2 20.5 2.5 19.8 2.5 19 L 2.5 16 C 2.5 15.5 2.5 15 2.6 14.5 L 4.4 6 C 4.6 5.2 5.3 4.5 6.2 4.5 Z" />

    {/* Front panel dividing seam */}
    <line x1="2.7" y1="15" x2="21.3" y2="15" />

    {/* Front panel status LED dot */}
    <circle cx="18" cy="17.7" r="1" fill={color} stroke="none" />

    {/* Master crown emblem */}
    <path
      d="M 8.5 12.2 L 8.2 8.2 L 10.2 10 L 12 7.2 L 13.8 10 L 15.8 8.2 L 15.5 12.2 Z"
      fill={color}
      stroke={color}
      strokeWidth={0.8}
    />
  </svg>
);

export default {
  TotalGatewaysIcon,
  OnlineActiveIcon,
  OfflineAlertIcon,
  ConnectedMetersIcon,
  AssetMappingIcon,
  GatewayRouterIcon,
  LocationPinIcon,
  MasterCrownIcon,
};
