import React, { useEffect, useRef, useId } from 'react';
import { SAB_LOADING_ASSETS } from './loadingAssets';

export interface LoadingScreenProps {
  /** If true, fills the entire viewport with an executive overlay */
  fullScreen?: boolean;
  /** Size in pixels or CSS string (e.g. 420, '420px', 'min(92vw, 520px)'). Defaults to 440 */
  size?: number | string;
  /** Primary loading title or telemetry message */
  message?: string;
  /** Optional secondary subtitle or detail */
  subMessage?: string;
  /** Custom additional CSS class */
  className?: string;
  /** Custom inline style */
  style?: React.CSSProperties;
  /** Whether clicking the logo triggers a fresh animation burst */
  interactive?: boolean;
  /** Theme background preference: 'light-rust' (default soft warm rust-orange) or 'white' or 'dark' (Deep Navy #0C1E36) or 'transparent' */
  theme?: 'light-rust' | 'white' | 'dark' | 'light' | 'transparent';
}

const SEG_MAP: Record<string, string> = {
  0: 'abcdef',
  1: 'bc',
  2: 'abdeg',
  3: 'abcdg',
  4: 'bcfg',
  5: 'acdfg',
  6: 'acdefg',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
};

function getSegmentCoords(k: string, x: number, y: number, w: number, h: number): [number, number, number, number] {
  const m = y + h / 2;
  const coords: Record<string, [number, number, number, number]> = {
    a: [x + 5, y, x + w - 5, y],
    b: [x + w, y + 5, x + w, m - 4],
    c: [x + w, m + 4, x + w, y + h - 5],
    d: [x + 5, y + h, x + w - 5, y + h],
    e: [x, m + 4, x, y + h - 5],
    f: [x, y + 5, x, m - 4],
    g: [x + 5, m, x + w - 5, m],
  };
  return coords[k] || [0, 0, 0, 0];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  size = 185,
  message = '',
  subMessage = '',
  className = '',
  style,
  interactive = true,
  theme = 'light-rust',
}) => {
  const uid = useId().replace(/[:]/g, '_');
  const clip1Id = `${uid}_c1`;
  const clip2Id = `${uid}_c2`;
  const clipBarId = `${uid}_cb`;
  const shadeFilterId = `${uid}_shade`;

  const shkRef = useRef<SVGGElement | null>(null);
  const bodyRef = useRef<SVGImageElement | null>(null);
  const plugsRef = useRef<SVGImageElement | null>(null);
  const boltRef = useRef<SVGImageElement | null>(null);
  const sweepRef = useRef<SVGImageElement | null>(null);
  const digitsRef = useRef<SVGGElement | null>(null);
  const dgRef = useRef<SVGGElement | null>(null);
  const barRef = useRef<SVGRectElement | null>(null);
  const r1Ref = useRef<SVGRectElement | null>(null);
  const r2Ref = useRef<SVGRectElement | null>(null);
  const dotsRef = useRef<(SVGCircleElement | null)[]>([]);
  const sparksRef = useRef<(SVGLineElement | null)[]>([]);

  const tokenRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const triggerRunRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          resolve();
        }, ms);
        if (!isMountedRef.current) {
          clearTimeout(id);
          resolve();
        }
      });

    const drawDigits = (n: number) => {
      if (!dgRef.current) return;
      const s = String(n).padStart(4, '0');
      let o = '';
      for (let i = 0; i < 4; i++) {
        const segs = SEG_MAP[s[i]] || '';
        for (let j = 0; j < segs.length; j++) {
          const p = getSegmentCoords(segs[j], 505 + i * 43, 389, 32, 50);
          o += `<line x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}"/>`;
        }
      }
      dgRef.current.innerHTML = o;
    };

    const setProgressBar = (n: number) => {
      if (!barRef.current) return;
      const w = Math.max(0, (222 * n) / 9999);
      barRef.current.setAttribute('width', String(w));
    };

    const animateEl = (
      el: SVGElement | null,
      kf: Keyframe[] | PropertyIndexedKeyframes,
      opts: KeyframeAnimationOptions
    ) => {
      if (!el || typeof el.animate !== 'function') return Promise.resolve();
      try {
        const anim = el.animate(kf, {
          fill: 'forwards',
          easing: 'ease-out',
          ...opts,
        });
        return anim.finished.catch(() => {});
      } catch {
        return Promise.resolve();
      }
    };

    const count = (a: number, b: number, ms: number, t: number, cb?: (v: number) => void) => {
      return new Promise<void>((res) => {
        const start = performance.now();
        const f = (n: number) => {
          if (!isMountedRef.current || t !== tokenRef.current) return res();
          const p = Math.max(0, Math.min((n - start) / ms, 1));
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const v = Math.round(a + (b - a) * e);
          drawDigits(v);
          setProgressBar(v);
          if (cb) cb(v);
          if (p < 1) {
            requestAnimationFrame(f);
          } else {
            res();
          }
        };
        requestAnimationFrame(f);
      });
    };

    const wipe = (r: SVGRectElement | null, ms: number, t: number) => {
      return new Promise<void>((res) => {
        if (!r) return res();
        const start = performance.now();
        r.setAttribute('height', '0');
        const f = (n: number) => {
          if (!isMountedRef.current || t !== tokenRef.current) return res();
          const p = Math.max(0, Math.min((n - start) / ms, 1));
          r.setAttribute('height', String(338 * p * p));
          if (p < 1) {
            requestAnimationFrame(f);
          } else {
            res();
          }
        };
        requestAnimationFrame(f);
      });
    };

    const thunder = async (n: number, t: number) => {
      for (let i = 0; i < n; i++) {
        if (!isMountedRef.current || t !== tokenRef.current) return;
        animateEl(
          sweepRef.current,
          [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }],
          { duration: 320, easing: 'linear' }
        );
        await wipe(r2Ref.current, 180, t);
        await sleep(90);
      }
    };

    const burst = () => {
      sparksRef.current.forEach((l, i) => {
        if (l) {
          l.style.transformOrigin = '680px 650px';
          animateEl(l, [{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: i * 25 });
        }
      });
    };

    const shake = () => {
      if (shkRef.current) {
        animateEl(
          shkRef.current,
          [
            { transform: 'translate(0,0)' },
            { transform: 'translate(-7px,0)' },
            { transform: 'translate(7px,0)' },
            { transform: 'translate(-4px,0)' },
            { transform: 'translate(0,0)' },
          ],
          { duration: 280, easing: 'linear' }
        );
      }
    };

    const tw = (ms: number, fn: (p: number) => void) => {
      return new Promise<void>((res) => {
        const start = performance.now();
        const g = (n: number) => {
          if (!isMountedRef.current) return res();
          const p = Math.max(0, Math.min((n - start) / ms, 1));
          fn(p);
          if (p < 1) {
            requestAnimationFrame(g);
          } else {
            res();
          }
        };
        requestAnimationFrame(g);
      });
    };

    const lampKey: Record<number, number> = {};
    const lamp = (dot: SVGCircleElement | null, idx: number, on: boolean) => {
      if (!dot) return Promise.resolve();
      const k = (lampKey[idx] = (lampKey[idx] || 0) + 1);
      return tw(on ? 220 : 160, (p) => {
        if (lampKey[idx] !== k) return;
        if (on) {
          dot.setAttribute('opacity', '1');
          const rVal = Math.max(0, p < 0.6 ? (14.5 * 1.12 * p) / 0.6 : 14.5 * (1.12 - (0.12 * (p - 0.6)) / 0.4));
          dot.setAttribute('r', String(rVal));
        } else {
          dot.setAttribute('opacity', String(Math.max(0, 1 - p)));
        }
      });
    };

    const pulse = (dot: SVGCircleElement | null, idx: number) => {
      if (!dot) return Promise.resolve();
      const k = (lampKey[idx] = (lampKey[idx] || 0) + 1);
      return tw(360, (p) => {
        if (lampKey[idx] !== k) return;
        dot.setAttribute('r', String(Math.max(0, 14.5 + 3 * Math.sin(p * Math.PI))));
      });
    };

    const reset = () => {
      const allEls: (SVGElement | null)[] = [
        shkRef.current,
        bodyRef.current,
        plugsRef.current,
        boltRef.current,
        sweepRef.current,
        digitsRef.current,
        ...dotsRef.current,
        ...sparksRef.current,
      ];
      allEls.forEach((e) => {
        if (e && typeof e.getAnimations === 'function') {
          e.getAnimations().forEach((a) => a.cancel());
        }
      });

      setProgressBar(0);
      drawDigits(0);
      if (r1Ref.current) r1Ref.current.setAttribute('height', '0');
      if (r2Ref.current) r2Ref.current.setAttribute('height', '0');

      dotsRef.current.forEach((d, idx) => {
        if (d) {
          lampKey[idx] = (lampKey[idx] || 0) + 1;
          d.setAttribute('opacity', '0');
          d.setAttribute('r', '14.5');
        }
      });
    };

    const intro = async (t: number) => {
      const pop: Keyframe[] = [
        { opacity: 0, transform: 'translate(376px,339px) scale(.45)' },
        { opacity: 1, transform: 'translate(0px,0px) scale(1)' },
      ];
      const po: KeyframeAnimationOptions = { duration: 320, easing: 'cubic-bezier(.2, 1.2, .4, 1)' };

      animateEl(plugsRef.current, pop, po);
      await animateEl(bodyRef.current, pop, po);
      if (!isMountedRef.current || t !== tokenRef.current) return;

      burst();
      shake();

      animateEl(digitsRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 110 });
      drawDigits(8888);
      setProgressBar(9999);
      dotsRef.current.forEach((d, idx) => lamp(d, idx, true));

      await sleep(160);
      if (!isMountedRef.current || t !== tokenRef.current) return;

      dotsRef.current.forEach((d, idx) => lamp(d, idx, false));
      drawDigits(0);
      setProgressBar(0);
      await sleep(100);
    };

    const boltIn = async (t: number) => {
      if (boltRef.current) boltRef.current.setAttribute('opacity', '1');
      await wipe(r1Ref.current, 240, t);
      if (t === tokenRef.current && r1Ref.current) {
        r1Ref.current.setAttribute('height', '338');
      }
    };

    const boltOut = () => {
      if (boltRef.current) boltRef.current.setAttribute('opacity', '0');
      if (r1Ref.current) r1Ref.current.setAttribute('height', '0');
    };

    const loop = async (t: number) => {
      const st = [3333, 6666, 9999];
      let prev = 0;
      const dotOffFlags = [false, false, false];

      while (isMountedRef.current && t === tokenRef.current) {
        for (let i = 0; i < 3; i++) {
          if (i === 0) boltIn(t);
          lamp(dotsRef.current[i], i, true);
          thunder(1, t);
          await count(prev, st[i], 420, t);
          if (!isMountedRef.current || t !== tokenRef.current) return;
          prev = st[i];
          await sleep(25);
        }

        burst();
        shake();
        dotsRef.current.forEach((d, idx) => {
          setTimeout(() => {
            if (isMountedRef.current && t === tokenRef.current) pulse(d, idx);
          }, 50);
        });

        await sleep(200);
        if (!isMountedRef.current || t !== tokenRef.current) return;

        const off = [6666, 3333, 1];
        dotOffFlags[0] = false;
        dotOffFlags[1] = false;
        dotOffFlags[2] = false;

        await count(9999, 0, 680, t, (v) => {
          for (let k = 0; k < 3; k++) {
            if (v < off[k] && !dotOffFlags[k]) {
              dotOffFlags[k] = true;
              lamp(dotsRef.current[k], k, false);
            }
          }
        });

        dotsRef.current.forEach((_, idx) => {
          dotOffFlags[idx] = false;
        });

        boltOut();
        prev = 0;
        await sleep(150);
      }
    };

    const run = async () => {
      const t = ++tokenRef.current;
      reset();
      await intro(t);
      if (!isMountedRef.current || t !== tokenRef.current) return;
      loop(t);
    };

    triggerRunRef.current = run;
    run();

    return () => {
      isMountedRef.current = false;
      tokenRef.current++;
      reset();
    };
  }, []);

  const handleRestart = () => {
    if (!interactive) return;
    if (triggerRunRef.current) {
      triggerRunRef.current();
    }
  };

  const isDark = theme === 'dark';
  const isTransparent = theme === 'transparent';
  const isWhiteOnly = theme === 'white';
  const isLightRust = theme === 'light-rust' || theme === 'light' || !theme || isWhiteOnly;

  const bgStyle = isDark
    ? 'bg-[#0C1E36] text-white'
    : isTransparent
    ? 'bg-transparent text-white'
    : 'bg-[#FFF7ED] text-[#1E293B]';

  const containerClass = fullScreen
    ? `fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 ${bgStyle} select-none backdrop-blur-sm ${className}`
    : `flex flex-col items-center justify-center p-4 ${bgStyle} select-none ${className}`;

  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  const cleanMessage = (message || '').replace(/\.+$/, '');

  const backgroundGradient = isDark
    ? '#0C1E36'
    : isTransparent
    ? 'transparent'
    : isWhiteOnly
    ? '#FFFFFF'
    : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 45%, #FDEEE2 100%)';

  return (
    <div
      className={containerClass}
      style={{
        background: backgroundGradient,
        backgroundColor: isDark ? '#0C1E36' : isTransparent ? 'transparent' : isWhiteOnly ? '#FFFFFF' : '#FFF7ED',
        color: isDark ? '#FFFFFF' : '#1E293B',
        ...style,
      }}
    >
      {/* Keyframe animation for bouncing dots */}
      <style>{`
        @keyframes sabDotJump {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          40% {
            transform: translateY(-6.5px);
            opacity: 1;
          }
          80% {
            transform: translateY(0);
            opacity: 0.35;
          }
        }
        .sab-jumping-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background-color: #BD621F;
          animation: sabDotJump 0.95s infinite ease-in-out;
        }
      `}</style>

      {/* Animated SVG Meter (Clean standalone on white background, no circular or square card around it) */}
      <div
        className="relative flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{
          width: '160px',
          height: '185px',
          cursor: interactive ? 'pointer' : 'default',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={handleRestart}
        title={interactive ? 'Click to replay animation' : undefined}
      >
        <svg
          viewBox="320 180 614 710"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full overflow-visible"
          style={{
            background: 'transparent',
            boxShadow: 'none',
            display: 'block',
          }}
        >
          <defs>
            <clipPath id={clip1Id}>
              <rect ref={r1Ref} x="563" y="484" width="236" height="0" />
            </clipPath>
            <clipPath id={clip2Id}>
              <rect ref={r2Ref} x="563" y="484" width="236" height="0" />
            </clipPath>
            <clipPath id={clipBarId}>
              <rect ref={barRef} x="488" y="515" width="0" height="35" />
            </clipPath>
            {isLightRust && (
              <filter id={shadeFilterId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#BD621F" floodOpacity="0.25" />
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#C86A24" floodOpacity="0.16" />
              </filter>
            )}
          </defs>

          <g ref={shkRef} filter={isLightRust ? `url(#${shadeFilterId})` : undefined}>
            {/* Meter Body (Transparent PNG) */}
            <image
              ref={bodyRef}
              href={SAB_LOADING_ASSETS.body}
              x="0"
              y="0"
              width="1254"
              height="1254"
              opacity="0"
              style={{ transformOrigin: '0px 0px' }}
            />

            {/* Bottom Plugs (Transparent PNG) */}
            <image
              ref={plugsRef}
              href={SAB_LOADING_ASSETS.plugs}
              x="0"
              y="0"
              width="1254"
              height="1254"
              opacity="0"
              style={{ transformOrigin: '0px 0px' }}
            />

            {/* 7-Segment Digital Ingestion Display */}
            <g ref={digitsRef} opacity="0">
              <g ref={dgRef} stroke="#0C1E36" fill="none" strokeWidth="7" strokeLinecap="round" />
            </g>

            {/* Battery / Energy Level Progress Fill */}
            <image
              href={SAB_LOADING_ASSETS.bar}
              x="488"
              y="515"
              width="222"
              height="35"
              clipPath={`url(#${clipBarId})`}
            />

            {/* Status Pulse Dots (Rust Orange #BD621F) */}
            <g fill="#BD621F">
              <circle
                ref={(el) => {
                  dotsRef.current[0] = el;
                }}
                cx="544"
                cy="485"
                r="14.5"
                opacity="0"
              />
              <circle
                ref={(el) => {
                  dotsRef.current[1] = el;
                }}
                cx="625"
                cy="485"
                r="14.5"
                opacity="0"
              />
              <circle
                ref={(el) => {
                  dotsRef.current[2] = el;
                }}
                cx="705"
                cy="485"
                r="14.5"
                opacity="0"
              />
            </g>

            {/* Orange Lightning Bolt (Top-to-Bottom Wipe) */}
            <image
              ref={boltRef}
              href={SAB_LOADING_ASSETS.bolt}
              x="563"
              y="484"
              width="236"
              height="338"
              opacity="0"
              clipPath={`url(#${clip1Id})`}
            />

            {/* Lightning Sweep Flash */}
            <image
              ref={sweepRef}
              href={SAB_LOADING_ASSETS.bolt}
              x="563"
              y="484"
              width="236"
              height="338"
              opacity="0"
              clipPath={`url(#${clip2Id})`}
              style={{ filter: 'brightness(1.5) saturate(1.1)' }}
            />

            {/* High-Voltage Discharge Sparks Burst */}
            <g stroke="#BD621F" strokeWidth="9" strokeLinecap="round">
              <line
                ref={(el) => {
                  sparksRef.current[0] = el;
                }}
                x1="680"
                y1="560"
                x2="680"
                y2="520"
                opacity="0"
              />
              <line
                ref={(el) => {
                  sparksRef.current[1] = el;
                }}
                x1="790"
                y1="650"
                x2="835"
                y2="650"
                opacity="0"
              />
              <line
                ref={(el) => {
                  sparksRef.current[2] = el;
                }}
                x1="570"
                y1="650"
                x2="525"
                y2="650"
                opacity="0"
              />
              <line
                ref={(el) => {
                  sparksRef.current[3] = el;
                }}
                x1="765"
                y1="570"
                x2="800"
                y2="535"
                opacity="0"
              />
              <line
                ref={(el) => {
                  sparksRef.current[4] = el;
                }}
                x1="595"
                y1="570"
                x2="560"
                y2="535"
                opacity="0"
              />
              <line
                ref={(el) => {
                  sparksRef.current[5] = el;
                }}
                x1="765"
                y1="735"
                x2="800"
                y2="770"
                opacity="0"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Loading Title & Sub-Message with Jumping Dots */}
      {cleanMessage && (
        <div style={{ marginTop: '20px', textAlign: 'center', zIndex: 10, maxWidth: '90vw' }}>
          <div
            style={{
              fontSize: '1.02rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: isDark ? '#FFFFFF' : '#0C1E36',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{cleanMessage}</span>
            <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
              <span className="sab-jumping-dot" style={{ animationDelay: '0s' }} />
              <span className="sab-jumping-dot" style={{ animationDelay: '0.2s' }} />
              <span className="sab-jumping-dot" style={{ animationDelay: '0.4s' }} />
            </span>
          </div>

          {subMessage && (
            <div
              style={{
                marginTop: '6px',
                fontSize: '0.80rem',
                color: isDark ? '#94A3B8' : '#64748B',
                fontWeight: 500,
              }}
            >
              {subMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
