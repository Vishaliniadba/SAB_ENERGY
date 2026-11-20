import React from 'react';

export interface ThemeDotsLoaderProps {
  /** Optional loading message or subtitle displayed beneath the dots */
  message?: React.ReactNode;
  /** Size of each dot in pixels (default: 10) */
  size?: number;
  /** Spacing between dots in pixels (default: 10) */
  gap?: number;
  /** Custom additional CSS class */
  className?: string;
  /** Custom inline styles for wrapper */
  style?: React.CSSProperties;
  /** Custom color array if overriding */
  colors?: string[];
  /** Palette variant: 'navy' (sidebar navy blue #0C1E36) | 'theme' | 'rust' | 'original' */
  variant?: 'navy' | 'theme' | 'rust' | 'original' | 'brand';
}

/**
 * Sidebar Navy Blue Foundation
 * Exactly matches --sidebar-navy-dark / brand Navy Blue (#0C1E36)
 */
const SIDEBAR_NAVY_COLORS = [
  '#0C1E36', // Navy Blue
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
];

const THEME_4_COLORS = [
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
];

const RUST_4_COLORS = [
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
];

const ORIGINAL_LOTTIE_COLORS = [
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
  '#0C1E36',
];

// Snappy phase delays for 0.80s cycle (fast & compact)
const PHASE_DELAYS = ['0s', '-0.74s', '-0.68s', '-0.62s'];

/**
 * ThemeDotsLoader / TableLottieLoader
 * Exact 4-dot wave bounce animation extracted from uploaded CGEyPwyznP.lottie.
 * Colored in Sidebar Navy Blue (#0C1E36), compact size and snappy timing.
 */
export const ThemeDotsLoader: React.FC<ThemeDotsLoaderProps> = ({
  message = 'Loading records...',
  size = 10,
  gap = 10,
  className = '',
  style = {},
  colors,
  variant = 'navy',
}) => {
  const dotColors = colors && colors.length > 0
    ? colors
    : variant === 'theme' || variant === 'brand'
    ? THEME_4_COLORS
    : variant === 'rust'
    ? RUST_4_COLORS
    : variant === 'original'
    ? ORIGINAL_LOTTIE_COLORS
    : SIDEBAR_NAVY_COLORS;

  return (
    <div
      className={`lottie-wave-container ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '18px 16px',
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      {/* 4-Dot Wave Bounce matching CGEyPwyznP.lottie in Sidebar Navy Blue */}
      <div
        className="lottie-wave-loader"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${gap}px`,
          height: '36px',
        }}
      >
        {dotColors.slice(0, 4).map((color, idx) => (
          <span
            key={idx}
            className="lottie-wave-dot"
            style={{
              display: 'inline-block',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: color,
              animationDelay: PHASE_DELAYS[idx] || '0s',
            }}
          />
        ))}
      </div>

      {/* Loading Label / Subtitle in Navy Blue */}
      {message && (
        <span
          style={{
            fontSize: '0.80rem',
            fontWeight: 600,
            color: '#0C1E36',
            letterSpacing: '0.015em',
            userSelect: 'none',
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export const TableLottieLoader = ThemeDotsLoader;
export default ThemeDotsLoader;
