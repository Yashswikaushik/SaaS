'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Starfield } from './starfield';
import { CountdownClock, DigitalClock, MegaClock, WorldClock } from './clocks';

/* ------------------------------------------------------------------ */
/* shared bits                                                         */
/* ------------------------------------------------------------------ */

const MARQUEE_ITEMS = [
  '240 FPS LOCKED',
  'ZERO-LATENCY NETCODE',
  'RANKED SEASON VIII',
  'RTX OVERDRIVE',
  '14M PLAYERS ONLINE',
  'CROSS-REALM PLAY',
  'NEON DIVISION OPEN',
  '₿ PRIZE VAULT LIVE',
];

const GAMES = [
  { title: 'NEON DRIFT', genre: 'Synth Racing', players: '2.1M', art: 'linear-gradient(140deg,#7c3aed 0%,#d946ef 55%,#22d3ee 120%)' },
  { title: 'CYBER SIEGE', genre: 'Tactical 5v5', players: '4.8M', art: 'linear-gradient(160deg,#1e0a3c 0%,#7c3aed 60%,#e879f9 120%)' },
  { title: 'VOID PROTOCOL', genre: 'Extraction RPG', players: '3.3M', art: 'linear-gradient(200deg,#22d3ee -20%,#312e81 40%,#a855f7 110%)' },
  { title: 'PHANTOM CIRCUIT', genre: 'Mecha Arena', players: '1.7M', art: 'linear-gradient(120deg,#0b0414 0%,#a855f7 70%,#f0abfc 130%)' },
  { title: 'DUSKFALL ZERO', genre: 'Open Void', players: '2.9M', art: 'linear-gradient(180deg,#4c1d95 0%,#db2777 80%)' },
  { title: 'HEX RUNNER', genre: 'Roguelike', players: '950K', art: 'linear-gradient(135deg,#0e7490 -30%,#6d28d9 50%,#c026d3 120%)' },
];

const LEADERBOARD = [
  { rank: 1, tag: 'NULLSECTOR', realm: 'Mumbai', elo: 3412 },
  { rank: 2, tag: 'GHOSTWIRE_X', realm: 'Tokyo', elo: 3387 },
  { rank: 3, tag: 'VANTABLADE', realm: 'Berlin', elo: 3290 },
  { rank: 4, tag: 'PIXELREAPER', realm: 'São Paulo', elo: 3244 },
  { rank: 5, tag: 'ASTRALYNX', realm: 'Los Angeles', elo: 3198 },
];

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-14 text-center">
      <div className="gx-neon-cyan mb-3 text-xs uppercase tracking-[0.6em]">{kicker}</div>
      <h2 className="gx-neon font-display text-4xl font-bold uppercase tracking-[0.12em] sm:text-6xl">{title}</h2>
      <hr className="gx-hr mx-auto mt-6 w-48" />
    </div>
  );
}

/** Wraps a section and slides/fades it in with a subtle depth offset. */
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* cursor + nebula                                                     */
/* ------------------------------------------------------------------ */

function NeonCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 350, damping: 28 });
  const sy = useSpring(y, { stiffness: 350, damping: 28 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
      style={{
        x: sx,
        y: sy,
        background: 'radial-gradient(circle, rgba(232,121,249,0.5) 0%, rgba(124,58,237,0.18) 45%, transparent 70%)',
        boxShadow: '0 0 32px 6px rgba(168,85,247,0.35)',
      }}
    />
  );
}

/** Fixed nebula blobs that crawl at different rates as the page scrolls —
 *  the deepest parallax layer behind the starfield content. */
function Nebula() {
  const { scrollYProgress } = useScroll();
  const slow = useTransform(scrollYProgress, [0, 1], ['0vh', '-30vh']);
  const mid = useTransform(scrollYProgress, [0, 1], ['0vh', '-75vh']);
  const fast = useTransform(scrollYProgress, [0, 1], ['10vh', '-130vh']);
  const hueSpin = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const filter = useTransform(hueSpin, (v) => `hue-rotate(${v}deg)`);

  return (
    <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{ filter }}>
      <motion.div
        className="absolute -left-[20%] top-[5%] h-[70vh] w-[70vh] rounded-full blur-[120px]"
        style={{ y: slow, background: 'radial-gradient(circle, rgba(124,58,237,0.32), transparent 70%)' }}
      />
      <motion.div
        className="absolute -right-[15%] top-[45%] h-[80vh] w-[80vh] rounded-full blur-[140px]"
        style={{ y: mid, background: 'radial-gradient(circle, rgba(217,70,239,0.22), transparent 70%)' }}
      />
      <motion.div
        className="absolute left-[30%] top-[95%] h-[60vh] w-[60vh] rounded-full blur-[110px]"
        style={{ y: fast, background: 'radial-gradient(circle, rgba(34,211,238,0.16), transparent 70%)' }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const clockY = useTransform(scrollYProgress, [0, 1], ['0%', '45%']);
  const clockRotate = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const clockScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '120%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const subY = useTransform(scrollYProgress, [0, 1], ['0%', '260%']);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 20 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[115vh] flex-col items-center justify-center overflow-hidden px-4"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      {/* layer 1 — giant ghost clock drifting slower than the headline */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ y: clockY, rotate: reduced ? 0 : clockRotate, scale: clockScale }}
      >
        <MegaClock size="min(95vw, 880px)" ghost />
      </motion.div>

      {/* layer 2 — grid floor */}
      <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: gridOpacity }}>
        <div className="gx-grid-floor" />
      </motion.div>

      {/* layer 3 — headline block, fastest layer */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ y: titleY, opacity: titleOpacity, rotateX: reduced ? 0 : tiltX, rotateY: reduced ? 0 : tiltY, transformPerspective: 1200 }}
      >
        <motion.div
          initial={{ opacity: 0, letterSpacing: '1.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.6em' }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="gx-neon-cyan mb-6 text-[0.65rem] uppercase sm:text-xs"
        >
          The arena never sleeps
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="gx-glitch gx-neon gx-flicker font-display text-[17vw] font-bold uppercase leading-none tracking-[0.08em] sm:text-[11vw] lg:text-[9.5rem]"
          data-text="VOIDREALM"
        >
          VOIDREALM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-6 max-w-xl text-sm uppercase tracking-[0.35em] text-[var(--gx-dim)] sm:text-base"
        >
          Dark-grid esports. Purple-shifted reality. Your clock is already ticking.
        </motion.p>

        <motion.div style={{ y: subY }} className="mt-10">
          <div className="text-6xl sm:text-8xl">
            <DigitalClock label="local sync" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-5"
        >
          <a href="#drop" className="gx-btn px-10 py-4 text-sm">Enter the void</a>
          <a href="#games" className="gx-btn gx-btn-ghost px-10 py-4 text-sm">Browse arsenal</a>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-[var(--gx-dim)]"
        animate={reduced ? undefined : { y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ opacity: titleOpacity }}
      >
        <span className="text-[0.6rem] uppercase tracking-[0.5em]">descend</span>
        <span className="gx-neon text-xl">▾</span>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* marquee                                                             */
/* ------------------------------------------------------------------ */

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const track = (
    <div className="gx-marquee-track">
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="flex items-center whitespace-nowrap px-8 text-sm uppercase tracking-[0.4em]">
          <span className="gx-neon">{item}</span>
          <span className="gx-neon-cyan pl-8">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={`gx-marquee border-y border-[rgba(168,85,247,0.3)] bg-[rgba(18,8,34,0.6)] py-4 ${reverse ? 'gx-marquee-reverse' : ''}`}
      aria-hidden
    >
      {track}
      {track}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* countdown section                                                   */
/* ------------------------------------------------------------------ */

function DropSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-18%', '18%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.92]);

  return (
    <section id="drop" ref={ref} className="relative overflow-hidden py-36">
      <motion.div
        aria-hidden
        className="gx-outline-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[24vw] font-bold uppercase leading-none"
        style={{ y: bgY }}
      >
        SEASON VIII
      </motion.div>

      <motion.div className="relative z-10 mx-auto max-w-6xl px-4" style={{ scale }}>
        <SectionTitle kicker="transmission incoming" title="Season VIII begins in" />
        <CountdownClock />
        <Reveal className="mt-16 text-center">
          <p className="mx-auto max-w-lg text-sm uppercase tracking-[0.3em] text-[var(--gx-dim)]">
            Gates open Friday 21:00 sharp. Ranks reset. Vault unlocks. Nobody waits for stragglers.
          </p>
          <a href="#cta" className="gx-btn mt-10 px-12 py-4 text-sm">Reserve callsign</a>
        </Reveal>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* world clocks                                                        */
/* ------------------------------------------------------------------ */

function RealmTimeSection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle kicker="every realm, one heartbeat" title="Server time walls" />
        <div className="grid gap-8 sm:grid-cols-3">
          <Reveal><WorldClock city="Mumbai" timeZone="Asia/Kolkata" /></Reveal>
          <Reveal><WorldClock city="Tokyo" timeZone="Asia/Tokyo" /></Reveal>
          <Reveal><WorldClock city="Los Angeles" timeZone="America/Los_Angeles" /></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* games grid with 3D tilt                                             */
/* ------------------------------------------------------------------ */

function TiltCard({ game, index }: { game: (typeof GAMES)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        rx.set((0.5 - py) * 14);
        ry.set((px - 0.5) * 14);
        ref.current.style.setProperty('--gx-mx', `${px * 100}%`);
        ref.current.style.setProperty('--gx-my', `${py * 100}%`);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className="gx-panel group relative overflow-hidden rounded-2xl"
    >
      <div className="h-44 w-full transition-transform duration-500 group-hover:scale-105" style={{ background: game.art }}>
        <div className="flex h-full items-end bg-gradient-to-t from-[rgba(5,2,8,0.9)] to-transparent p-5">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--gx-cyan)]">{game.players} active</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="gx-neon font-display text-2xl font-bold uppercase tracking-[0.1em]">{game.title}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.35em] text-[var(--gx-dim)]">{game.genre}</p>
      </div>
      <div className="gx-card-shine" />
    </motion.div>
  );
}

function GamesSection() {
  return (
    <section id="games" className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle kicker="the arsenal" title="Choose your poison" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, i) => (
            <TiltCard key={game.title} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* stats with count-up                                                 */
/* ------------------------------------------------------------------ */

function CountUp({ to, suffix, decimals = 0 }: { to: number; suffix: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setValue(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="gx-neon font-mono tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['25%', '-25%']);

  const stats: { to: number; suffix: string; decimals?: number; label: string }[] = [
    { to: 14.2, suffix: 'M', decimals: 1, label: 'players in the void' },
    { to: 240, suffix: '', label: 'fps tournament lock' },
    { to: 4.2, suffix: 'M', decimals: 1, label: 'prize vault (USD)' },
    { to: 9, suffix: 'ms', label: 'edge latency' },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden py-32">
      <motion.div
        aria-hidden
        className="gx-outline-text pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[20vw] font-bold uppercase leading-none"
        style={{ y: bgY }}
      >
        NO MERCY
      </motion.div>
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Reveal key={s.label} className="text-center">
            <div className="text-5xl sm:text-6xl">
              <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals} />
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.4em] text-[var(--gx-dim)]">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* leaderboard                                                         */
/* ------------------------------------------------------------------ */

function LeaderboardSection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-4xl px-4">
        <SectionTitle kicker="hall of ghosts" title="Global leaderboard" />
        <div className="gx-panel gx-panel-glow overflow-hidden rounded-2xl">
          {LEADERBOARD.map((row, i) => (
            <motion.div
              key={row.tag}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-6 border-b border-[rgba(168,85,247,0.18)] px-6 py-5 last:border-0 sm:px-10"
            >
              <span className={`font-mono text-2xl tabular-nums ${row.rank === 1 ? 'gx-neon' : 'text-[var(--gx-dim)]'}`}>
                {String(row.rank).padStart(2, '0')}
              </span>
              <span className="gx-neon-cyan flex-1 font-display text-lg font-bold uppercase tracking-[0.2em] sm:text-2xl">
                {row.tag}
              </span>
              <span className="hidden text-xs uppercase tracking-[0.3em] text-[var(--gx-dim)] sm:block">{row.realm}</span>
              <span className="gx-neon font-mono text-xl tabular-nums">{row.elo}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* final CTA + footer                                                  */
/* ------------------------------------------------------------------ */

function CtaSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const clockRotate = useTransform(scrollYProgress, [0, 1], [-30, 0]);

  return (
    <section id="cta" ref={ref} className="relative overflow-hidden py-40">
      <motion.div className="absolute inset-0 flex items-center justify-center opacity-30" style={{ rotate: clockRotate }}>
        <MegaClock size="min(90vw, 700px)" ghost />
      </motion.div>
      <motion.div className="relative z-10 mx-auto max-w-3xl px-4 text-center" style={{ scale }}>
        <h2 className="gx-glitch gx-neon font-display text-5xl font-bold uppercase tracking-[0.1em] sm:text-7xl" data-text="JACK IN NOW">
          JACK IN NOW
        </h2>
        <p className="mt-8 text-sm uppercase tracking-[0.35em] text-[var(--gx-dim)]">
          Free to enter. Impossible to leave. The clock already started.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
          <a href="#top" className="gx-btn px-14 py-5 text-base">Create account</a>
          <a href="#games" className="gx-btn gx-btn-ghost px-14 py-5 text-base">Watch trailer</a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-[rgba(168,85,247,0.25)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
        <div className="gx-neon font-display text-xl font-bold uppercase tracking-[0.4em]">VOIDREALM</div>
        <div className="text-4xl">
          <DigitalClock label="you are still here" />
        </div>
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[var(--gx-dim)]">
          A concept microsite — no actual games were harmed · built in the void
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* page composition                                                    */
/* ------------------------------------------------------------------ */

export function GamingExperience() {
  return (
    <div id="top" className="gx relative min-h-screen scroll-smooth">
      <Starfield />
      <Nebula />
      <NeonCursor />
      <div className="gx-scanlines" />
      <div className="gx-vignette" />
      <div className="gx-noise" />

      <main className="relative z-10">
        <Hero />
        <Marquee />
        <DropSection />
        <Marquee reverse />
        <RealmTimeSection />
        <GamesSection />
        <StatsSection />
        <LeaderboardSection />
        <CtaSection />
        <Footer />
      </main>
    </div>
  );
}
