'use client';

import { useEffect, useRef, useState } from 'react';

/** Re-renders subscribers every animation frame with a fresh Date.
 *  Returns null until mounted so SSR markup never contains a time. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    if (reduced) {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    } else {
      const tick = () => {
        setNow(new Date());
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (interval) clearInterval(interval);
    };
  }, []);

  return now;
}

type MegaClockProps = {
  /** CSS size of the square clock, e.g. 'min(78vw, 720px)' */
  size: string;
  /** IANA zone; defaults to viewer's local time */
  timeZone?: string;
  ghost?: boolean;
};

function zonedTimeParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds() + date.getMilliseconds() / 1000,
    };
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { h: get('hour') % 24, m: get('minute'), s: get('second') + date.getMilliseconds() / 1000 };
}

/** Giant SVG analog clock with neon rings, 60 tick marks and glowing hands.
 *  The second hand sweeps smoothly (rAF-driven). */
export function MegaClock({ size, timeZone, ghost = false }: MegaClockProps) {
  const now = useNow();
  const { h, m, s } = now ? zonedTimeParts(now, timeZone) : { h: 0, m: 0, s: 0 };

  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  // toFixed keeps SSR and client markup byte-identical — raw float math can
  // differ in the last ulp between V8 builds and trips hydration warnings.
  const fx = (n: number) => n.toFixed(3);
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const r1 = major ? 88 : 92;
    const r2 = 96;
    return (
      <line
        key={i}
        x1={fx(100 + r1 * Math.sin(angle))}
        y1={fx(100 - r1 * Math.cos(angle))}
        x2={fx(100 + r2 * Math.sin(angle))}
        y2={fx(100 - r2 * Math.cos(angle))}
        stroke={major ? '#e879f9' : 'rgba(168,85,247,0.45)'}
        strokeWidth={major ? 1.6 : 0.7}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div
      aria-hidden={ghost}
      className={ghost ? 'opacity-40' : 'gx-clock-face'}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="98" fill="rgba(10,4,20,0.55)" stroke="rgba(168,85,247,0.8)" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(124,58,237,0.18)" strokeWidth="0.5" strokeDasharray="1 4" />
        {ticks}
        {[12, 3, 6, 9].map((n, i) => {
          const angle = (i * 90 * Math.PI) / 180;
          return (
            <text
              key={n}
              x={fx(100 + 76 * Math.sin(angle))}
              y={fx(100 - 76 * Math.cos(angle))}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ede9fe"
              fontSize="13"
              fontFamily="var(--font-mono), monospace"
              style={{ filter: 'drop-shadow(0 0 6px rgba(232,121,249,0.9))' }}
            >
              {n}
            </text>
          );
        })}
        {now && (
          <g>
            <line
              x1="100" y1="112" x2="100" y2="54"
              stroke="#ede9fe" strokeWidth="5" strokeLinecap="round"
              transform={`rotate(${hourDeg} 100 100)`}
              style={{ filter: 'drop-shadow(0 0 5px rgba(237,233,254,0.9))' }}
            />
            <line
              x1="100" y1="116" x2="100" y2="32"
              stroke="#a855f7" strokeWidth="3" strokeLinecap="round"
              transform={`rotate(${minDeg} 100 100)`}
              style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,1))' }}
            />
            <line
              x1="100" y1="124" x2="100" y2="18"
              stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round"
              transform={`rotate(${secDeg} 100 100)`}
              style={{ filter: 'drop-shadow(0 0 7px rgba(34,211,238,1))' }}
            />
          </g>
        )}
        <circle cx="100" cy="100" r="4.5" fill="#0b0414" stroke="#e879f9" strokeWidth="1.6" />
      </svg>
    </div>
  );
}

/** Huge HH:MM:SS readout with blinking colons. */
export function DigitalClock({ timeZone, label }: { timeZone?: string; label?: string }) {
  const now = useNow();
  const { h, m, s } = now ? zonedTimeParts(now, timeZone) : { h: 0, m: 0, s: 0 };
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

  return (
    <div className="text-center">
      {label && (
        <div className="mb-2 text-[0.6rem] uppercase tracking-[0.5em] text-[var(--gx-dim)]">{label}</div>
      )}
      <div className="gx-neon font-mono tabular-nums" suppressHydrationWarning>
        {now ? (
          <>
            {pad(h)}
            <span className="gx-colon-blink">:</span>
            {pad(m)}
            <span className="gx-colon-blink">:</span>
            {pad(s)}
          </>
        ) : (
          '--:--:--'
        )}
      </div>
    </div>
  );
}

/** Mini analog clock + digital readout for the server-time wall. */
export function WorldClock({ city, timeZone }: { city: string; timeZone: string }) {
  const now = useNow();
  const { h, m, s } = now ? zonedTimeParts(now, timeZone) : { h: 0, m: 0, s: 0 };
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

  return (
    <div className="gx-panel gx-panel-glow flex flex-col items-center gap-5 rounded-2xl p-8">
      <MegaClock size="min(52vw, 220px)" timeZone={timeZone} />
      <div className="text-center">
        <div className="text-sm uppercase tracking-[0.45em] text-[var(--gx-magenta)]">{city}</div>
        <div className="gx-neon-cyan mt-1 font-mono text-2xl tabular-nums" suppressHydrationWarning>
          {now ? `${pad(h)}:${pad(m)}:${pad(s)}` : '--:--:--'}
        </div>
      </div>
    </div>
  );
}

function nextSeasonStart(from: Date): Date {
  // Next Friday 21:00 local time — the weekly "season gate" the countdown targets.
  const target = new Date(from);
  target.setHours(21, 0, 0, 0);
  const day = target.getDay();
  let add = (5 - day + 7) % 7;
  if (add === 0 && target.getTime() <= from.getTime()) add = 7;
  target.setDate(target.getDate() + add);
  return target;
}

/** Giant segmented DD:HH:MM:SS countdown. */
export function CountdownClock() {
  const now = useNow();
  const targetRef = useRef<Date | null>(null);

  let cells: { value: string; label: string }[] = [
    { value: '--', label: 'days' },
    { value: '--', label: 'hours' },
    { value: '--', label: 'mins' },
    { value: '--', label: 'secs' },
  ];

  if (now) {
    if (!targetRef.current || targetRef.current.getTime() <= now.getTime()) {
      targetRef.current = nextSeasonStart(now);
    }
    const diff = Math.max(0, targetRef.current.getTime() - now.getTime());
    const total = Math.floor(diff / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    cells = [
      { value: pad(Math.floor(total / 86400)), label: 'days' },
      { value: pad(Math.floor((total % 86400) / 3600)), label: 'hours' },
      { value: pad(Math.floor((total % 3600) / 60)), label: 'mins' },
      { value: pad(total % 60), label: 'secs' },
    ];
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5" suppressHydrationWarning>
      {cells.map((cell, i) => (
        <div key={cell.label} className="flex items-start gap-3 sm:gap-5">
          <div className="flex flex-col items-center gap-3">
            <div className="gx-digit-cell flex h-24 w-20 items-center justify-center rounded-xl sm:h-40 sm:w-32 lg:h-52 lg:w-44">
              <span className="gx-neon font-mono text-5xl tabular-nums sm:text-7xl lg:text-8xl">{cell.value}</span>
            </div>
            <span className="text-[0.6rem] uppercase tracking-[0.5em] text-[var(--gx-dim)]">{cell.label}</span>
          </div>
          {i < cells.length - 1 && (
            <span className="gx-neon gx-colon-blink mt-6 font-mono text-4xl sm:mt-12 sm:text-6xl lg:mt-16 lg:text-7xl">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
