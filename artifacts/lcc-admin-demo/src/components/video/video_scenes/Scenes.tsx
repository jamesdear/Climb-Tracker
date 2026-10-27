import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Check, Copy, ExternalLink, Minus, Plus, Trophy, Users, X } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';

const E = [0.22, 1, 0.36, 1] as const;
const LOGO = `${import.meta.env.BASE_URL}images/lcc-logo.svg`;
const EVENT = 'Round 3 · Spring 2026';

function useBeats(times: number[]) {
  const [b, setB] = useState(0);
  useSceneTimer(times.map((t, i) => ({ time: t, callback: () => setB(i + 1) })));
  return b;
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <motion.div className="stage" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: E }}>
      {children}
    </motion.div>
  );
}

function Cap({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="cap">
      <motion.div className="n" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>STEP {n}</motion.div>
      <div style={{ overflow: 'hidden' }}>
        <motion.h2 initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: E }}>{title}</motion.h2>
      </div>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>{text}</motion.p>
    </div>
  );
}

type Cam = { x: number; y: number; s: number };
function Win({ cam, side, title, children }: { cam: Cam; side: number; title: string; children: ReactNode }) {
  return (
    <motion.div className="cam" initial={{ x: '8vh', y: '3vh', scale: 0.96, opacity: 0 }} animate={{ x: `${cam.x}vh`, y: `${cam.y}vh`, scale: cam.s, opacity: 1 }} transition={{ duration: 0.9, ease: E }}>
      <div className="win">
        <aside className="side">
          <img src={LOGO} alt="" />
          <div className="bn">LCC Intersquad<span>Comp Series</span></div>
          {[[Activity, 'Events'], [Users, 'Accounts'], [Trophy, 'Series']].map(([I, l], i) => {
            const Icon = I as typeof Activity;
            return <div key={i} className={`sl ${side === i ? 'on' : ''}`}><Icon size={13} style={{ verticalAlign: 'middle', marginRight: 8 }} />{l as string}</div>;
          })}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #ffffff22', paddingTop: '1.4vh', fontSize: '1.2vh' }}>Organizer<div className="sl" style={{ paddingLeft: 0 }}>Sign out</div></div>
        </aside>
        <div className="main">
          <div className="top"><h1>{title}</h1><span className="b o">Public site <ExternalLink size={11} /></span></div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function Cursor({ x, y, click }: { x: number; y: number; click: number }) {
  return (
    <motion.div className="cursor" initial={false} animate={{ left: `${x}vh`, top: `${y}vh` }} transition={{ duration: 0.7, ease: E }}>
      <motion.div key={click} className="ring" initial={{ scale: 0.4, opacity: click ? 1 : 0 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.5 }} />
      <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3 2l17 9-7.5 2L9 21z" fill="#1d1d1b" stroke="#fdfcfa" strokeWidth="1.6" /></svg>
    </motion.div>
  );
}

const Fade = ({ show, children, d = 0 }: { show: boolean; children: ReactNode; d?: number }) => (
  <motion.div initial={false} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 10 }} transition={{ duration: 0.4, delay: d, ease: E }}>{children}</motion.div>
);

function typed(text: string, start: number, b: number, per: number[]) {
  // per: beat indices -> number of characters revealed
  return b < start ? '' : text.slice(0, per[Math.min(b - start, per.length - 1)]);
}

/* 1 ─ Intro */
export function SceneIntro() {
  const b = useBeats([500, 1000, 1500, 3300]);
  return (
    <Scene>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.img src={LOGO} alt="LCC" style={{ height: '18vh' }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: b >= 4 ? 0.9 : 1, opacity: b >= 4 ? 0 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} />
          <motion.div className="eb" style={{ fontSize: '2vh', marginTop: '4vh' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 1 ? 1 : 0 }}>LCC Intersquad Comp Series</motion.div>
          <div style={{ overflow: 'hidden' }}>
            <motion.h1 style={{ font: "800 11vh/1 'Kumbh Sans'", textTransform: 'uppercase', margin: '1.5vh 0 0', letterSpacing: '-.03em' }} initial={{ y: '105%' }} animate={{ y: b >= 2 ? (b >= 4 ? '-105%' : 0) : '105%' }} transition={{ duration: 0.6, ease: E }}>Organizer dashboard</motion.h1>
          </div>
          <motion.div style={{ height: '.8vh', background: 'var(--or)', margin: '3vh auto 0', transformOrigin: 'left' }} initial={{ scaleX: 0, width: '60vh' }} animate={{ scaleX: b >= 3 && b < 4 ? 1 : 0 }} transition={{ duration: 0.5, ease: E }} />
        </div>
      </div>
    </Scene>
  );
}

/* 2 ─ Create event */
export function SceneEvents() {
  const b = useBeats([700, 1300, 1700, 2100, 2500, 2900, 3400, 4100, 4700, 5600]);
  const showForm = b >= 2 && b < 8;
  const name = typed(EVENT, 3, b, [6, 14, EVENT.length]);
  const cur: [number, number, number][] = [[105, 14, 0], [105, 14, 0], [105, 14, 2], [60, 22, 2], [60, 22, 2], [60, 22, 2], [60, 22, 2], [36, 42, 7], [36, 42, 7], [100, 52, 7], [100, 52, 7]];
  const [cx, cy, ck] = cur[Math.min(b, cur.length - 1)];
  return (
    <Scene>
      <Cap n="01" title="Create an event" text="New event, a date and points by attempt. It starts as a draft." />
      <Win cam={b >= 10 ? { x: -6, y: -2, s: 1.05 } : { x: 0, y: 0, s: 1 }} side={0} title="Event overview">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.6vh' }}>
          <span className="eb">Events</span><span className={`b c ${b === 2 ? 'press' : ''}`}><Plus size={12} /> New event</span>
        </div>
        <motion.div initial={false} animate={{ height: showForm ? 'auto' : 0, opacity: showForm ? 1 : 0 }} style={{ overflow: 'hidden', marginBottom: '1.6vh' }} transition={{ duration: 0.4 }}>
          <div className="panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4vh' }}>
            <div className="fld" style={{ gridColumn: '1/-1' }}><label>Event name</label><div className={`inp ${b >= 3 && b < 6 ? 'on' : ''}`}>{name}</div></div>
            <div className="fld"><label>Event date</label><div className={`inp ${b === 6 ? 'on' : ''}`}>{b >= 6 ? '18/04/2026' : 'dd/mm/yyyy'}</div></div>
            <div className="fld" style={{ gridColumn: '1/-1' }}><label>Points by attempts · 1 / 2 / 3 / 4</label>
              <div style={{ display: 'flex', gap: '1vh' }}>{[10, 7, 4, 1].map(p => <div key={p} className="inp mono" style={{ width: '8vh' }}>{p}</div>)}</div></div>
            <div style={{ display: 'flex', gap: '1vh' }}><span className={`b ${b === 7 ? 'press' : ''}`}>Create draft</span><span className="b o">Cancel</span></div>
          </div>
        </motion.div>
        <table className="tbl"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Boulders</th><th>Controls</th></tr></thead>
          <tbody>
            {b >= 8 && (
              <motion.tr initial={{ opacity: 0, backgroundColor: '#fff2d9' }} animate={{ opacity: 1, backgroundColor: '#fefefd00' }} transition={{ duration: 1.2 }}>
                <td><strong>{EVENT}</strong></td><td>18/04/2026</td><td><span className="st draft">draft</span></td><td>20</td><td><span className={`b ${b >= 9 ? 'press' : ''}`}>Manage <ArrowRight size={11} /></span></td>
              </motion.tr>
            )}
            <tr><td><strong>Round 2 · Spring 2026</strong></td><td>21/03/2026</td><td><span className="st closed">closed</span></td><td>20</td><td><span className="b">Manage <ArrowRight size={11} /></span></td></tr>
            <tr><td><strong>Round 1 · Spring 2026</strong></td><td>14/02/2026</td><td><span className="st closed">closed</span></td><td>20</td><td><span className="b">Manage <ArrowRight size={11} /></span></td></tr>
          </tbody></table>
        <Cursor x={cx} y={cy} click={ck} />
      </Win>
    </Scene>
  );
}

const SQUADS: { name: string; c: string; avg: number[]; n: number; z: number }[] = [
  { name: 'Ravens Wall', c: '#047732', avg: [0, 41.2, 96.4], n: 14, z: 1 },
  { name: 'Vaux Wall', c: '#009DDC', avg: [0, 44.7, 91.8], n: 11, z: 0 },
  { name: 'Harro Wall', c: '#772055', avg: [0, 35.9, 84.3], n: 12, z: 2 },
  { name: 'Croy Wall', c: '#52b93c', avg: [0, 31.2, 78.6], n: 9, z: 1 },
];
function Squads({ step, live }: { step: number; live: string }) {
  const rows = [...SQUADS].sort((a, b) => b.avg[step] - a.avg[step]);
  return (
    <div>
      <span className="eb">{live}</span>
      <div style={{ font: "600 2.4vh 'Kumbh Sans'", letterSpacing: '-.04em', margin: '.4vh 0 1vh' }}>Squad standings</div>
      {rows.map((s, i) => (
        <motion.div layout key={s.name} className="sq" style={{ borderLeftColor: s.c }} transition={{ duration: 0.5 }}>
          <b>#{i + 1}</b><span><strong>{s.name}</strong><small>{s.n} climbers · {s.z} on zero</small></span>
          <b className="avg">{s.avg[step].toFixed(1)}<small>avg pts</small></b>
        </motion.div>
      ))}
    </div>
  );
}

/* 3 ─ Open & monitor */
export function SceneMonitor() {
  const b = useBeats([800, 1400, 2400, 3400, 4400, 5800]);
  const status = b >= 2 ? 'open' : 'draft';
  const step = b >= 4 ? 2 : b >= 3 ? 1 : 0;
  const climbers = [0, 0, 0, 23, 46, 46, 46][b];
  const attempts = [0, 0, 0, 311, 874, 874, 874][b];
  return (
    <Scene>
      <Cap n="02" title="Open & monitor" text="Share the event QR. Climbers need no account. Scores stream in live." />
      <Win cam={b >= 4 ? { x: -6, y: -30, s: 1.12 } : { x: 0, y: 0, s: 1 }} side={0} title={EVENT}>
        <span className="eb">Event monitor</span>
        <div className="stats">
          <div className="stat"><span>REGISTERED CLIMBERS</span><strong>{climbers}</strong></div>
          <div className="stat"><span>LOGGED ATTEMPTS</span><strong>{attempts}</strong></div>
          <div className="stat"><span>EVENT STATUS</span><div style={{ marginTop: '.8vh' }}><span className={`st ${status}`}>{status}</span></div></div>
        </div>
        <div className="panel" style={{ marginBottom: '1.6vh' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2vh', alignItems: 'center', borderBottom: '1px solid #e9e6db', paddingBottom: '1.4vh', marginBottom: '1.4vh' }}>
            <div><span className="eb">Event scorecard QR</span><p style={{ fontSize: '1.35vh', color: '#778077', margin: '.8vh 0' }}>Opens scorecard setup for this event while it is open. No account needed.</p>
              <span className="b o"><Copy size={11} />{b === 1 ? 'Copied' : 'Copy event link'}</span></div>
            <QR />
          </div>
          <div style={{ display: 'flex', gap: '1vh' }}>
            <span className={`b ${b === 2 ? 'press' : ''}`}>{status === 'open' ? 'Close event' : 'Open event'}</span><span className="b o">Edit setup</span>
            <span className="b c dis">Release final results</span><span className="b o">View public results</span>
          </div>
        </div>
        <Squads step={step} live="Live, not public" />
        <Cursor x={b >= 2 ? 30 : 46} y={b >= 4 ? 80 : b >= 2 ? 49 : 34} click={b >= 2 ? 2 : b} />
      </Win>
      <motion.div className="toast" style={{ left: '5vh', top: '52vh', width: '36vh' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 4 ? 1 : 0 }}>
        Squad score = average of every climber in the squad, including those on zero.
      </motion.div>
    </Scene>
  );
}

function QR() {
  const cells: number[] = [];
  for (let i = 0; i < 225; i++) cells.push(((i * 7919) % 13) % 3 === 0 ? 1 : 0);
  const fin = (r: number, c: number) => (r < 5 && c < 5) || (r < 5 && c > 9) || (r > 9 && c < 5);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15,1fr)', width: '13vh', height: '13vh', padding: '.8vh', background: '#fff', border: '1px solid #e4e1db' }}>
      {cells.map((v, i) => { const r = Math.floor(i / 15), c = i % 15; const f = fin(r, c); const on = f ? (r % 10 === 0 || r % 10 === 4 || c % 10 === 0 || c % 10 === 4 || ((r % 10 === 2) && (c % 10 === 2))) : v; return <div key={i} style={{ background: on ? '#1d1d1b' : 'transparent' }} />; })}
    </div>
  );
}

const BOULDERS = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1; const a = [1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 0, 3, 1, 0, 2, 4, 0, 0][i];
  const done = [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0][i];
  return { n, a, done: !!done, p: done ? [0, 10, 7, 4, 1][a] : 0 };
});

function Grid({ fix }: { fix: boolean }) {
  return (
    <div className="grid">
      {BOULDERS.map(x => {
        const d = x.n === 7 && fix ? { ...x, a: 3, done: true, p: 4 } : x;
        return (
          <div key={x.n} className={`bd ${d.done ? 'done' : d.a ? 'tried' : ''}`} style={x.n === 7 ? { outline: '.3vh solid var(--cy)', outlineOffset: '.2vh' } : undefined}>
            <b>{String(x.n).padStart(2, '0')}</b><i>{d.done && <Check size={9} />} {d.a}/4</i><small>{d.p} pts</small>
          </div>
        );
      })}
    </div>
  );
}

/* 4 ─ Inspect & correct */
export function SceneInspect() {
  const b = useBeats([900, 1700, 2500, 3200, 3900, 4600, 5600]);
  const modal = b >= 2 && b < 6;
  const total = b >= 4 ? 3 : 2;
  const fix = b >= 6;
  return (
    <Scene>
      <Cap n="03" title="Inspect & correct" text="Open any scorecard to fix a mistake. Each correction is a new, attributed record." />
      <Win cam={{ x: 0, y: 0, s: 1 }} side={0} title="Scorecard inspection">
        <span className="eb">Organizer corrections</span>
        <div style={{ font: "800 2.6vh 'Kumbh Sans'", letterSpacing: '-.02em', margin: '.6vh 0 .4vh' }}>Maya Okafor · {fix ? 101 : 97} pts</div>
        <p style={{ fontSize: '1.35vh', color: '#778077', margin: '0 0 1.6vh' }}>{EVENT} · CroyWall · U14 · W+ · Supervisor: Dele Okafor</p>
        <Grid fix={fix} />
        <div style={{ font: "800 2vh 'Kumbh Sans'", margin: '2vh 0 1vh' }}>Correction history</div>
        <div className="hist">
          {fix && <motion.div className="hi" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}><strong>Boulder 7 · topped</strong><p>3 attempts · Organizer (admin)</p><span className="mono" style={{ fontSize: '1vh', color: '#6b6b6b' }}>18/04/2026, 17:42</span><span style={{ color: '#778077' }}> · correction</span></motion.div>}
          <div className="hi"><strong>Boulder 7 · attempted</strong><p>4 attempts · Dele Okafor (supervisor)</p><span className="mono" style={{ fontSize: '1vh', color: '#6b6b6b' }}>18/04/2026, 15:08</span></div>
        </div>
        <motion.div className="veil" initial={false} animate={{ opacity: modal ? 1 : 0 }} />
        <motion.div className="modal" style={{ left: '28vh', top: '16vh', width: '46vh' }} initial={false} animate={{ opacity: modal ? 1 : 0, y: modal ? 0 : 30 }} transition={{ duration: 0.35, ease: E }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div><span className="eb">Organizer correction</span><div style={{ font: "800 3vh 'Kumbh Sans'", textTransform: 'uppercase' }}>Boulder 07</div></div>
            <div style={{ width: '4.4vh', height: '4.4vh', border: '1px solid #d9d6d0', display: 'grid', placeItems: 'center' }}><X size={16} /></div>
          </div>
          <p style={{ fontWeight: 700, fontSize: '1.5vh', margin: '1.6vh 0 1vh' }}>Total attempts including the completing attempt</p>
          <div className="spin"><div><Minus size={18} /></div><output>{total}</output><div style={{ outline: b === 3 ? '.3vh solid var(--cy)' : 'none' }}><Plus size={18} /></div></div>
          <p style={{ fontSize: '1.2vh', color: '#778077' }}>Saved as completed only when you confirm.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1vh', marginTop: '1.4vh' }}>
            <span className="b o" style={{ justifyContent: 'center' }}>Cancel</span><span className={`b c ${b === 5 ? 'press' : ''}`} style={{ justifyContent: 'center' }}>{b === 5 ? 'Saving…' : 'Confirm completed'}</span>
          </div>
        </motion.div>
        <Cursor x={b >= 4 ? 89 : b >= 2 ? 92 : 54} y={b >= 4 ? 52 : b >= 2 ? 36 : 26} click={b} />
      </Win>
    </Scene>
  );
}

/* 5 ─ Close & release */
export function SceneRelease() {
  const b = useBeats([900, 1700, 2600, 3500, 4400, 5200, 6600]);
  const closed = b >= 1;
  const released = b >= 5;
  const confirm = b >= 3 && b < 5;
  return (
    <Scene>
      <Cap n="04" title="Close, then release" text="Close scoring first. Only a closed event can publish its final results." />
      <Win cam={b >= 6 ? { x: -2, y: -18, s: 1.06 } : { x: 0, y: 0, s: 1 }} side={0} title={EVENT}>
        <span className="eb">Event monitor</span>
        <div className="stats">
          <div className="stat"><span>REGISTERED CLIMBERS</span><strong>46</strong></div>
          <div className="stat"><span>LOGGED ATTEMPTS</span><strong>874</strong></div>
          <div className="stat"><span>EVENT STATUS</span><div style={{ marginTop: '.8vh' }}><span className={`st ${closed ? 'closed' : 'open'}`}>{closed ? 'closed' : 'open'}</span></div></div>
        </div>
        <div className="panel" style={{ marginBottom: '1.6vh', display: 'flex', gap: '1vh' }}>
          <span className={`b ${b === 1 ? 'press' : ''} ${released ? 'dis' : ''}`}>{closed ? 'Open event' : 'Close event'}</span>
          <span className={`b o ${released ? 'dis' : ''}`}>Edit setup</span>
          <span className={`b c ${!closed || released ? 'dis' : ''} ${b === 2 ? 'press' : ''}`}>{released ? 'Results released' : 'Release final results'}</span>
          <span className="b o">View public results</span>
        </div>
        <Squads step={2} live={released ? 'Published results' : 'Live, not public'} />
        <motion.div className="veil" initial={false} animate={{ opacity: confirm ? 1 : 0 }} />
        <motion.div className="modal" style={{ left: '22vh', top: '20vh', width: '56vh', background: '#fdfcfa' }} initial={false} animate={{ opacity: confirm ? 1 : 0, scale: confirm ? 1 : 0.95 }}>
          <div style={{ fontSize: '1.6vh', lineHeight: 1.5 }}>Release these results publicly? Competitor scoring stays closed. Admin corrections will update the public results.</div>
          <div style={{ display: 'flex', gap: '1vh', justifyContent: 'flex-end', marginTop: '2vh' }}><span className="b o">Cancel</span><span className={`b ${b === 4 ? 'press' : ''}`}>OK</span></div>
        </motion.div>
        <Cursor x={b >= 3 ? 70 : b >= 2 ? 44 : 10} y={b >= 3 ? 33 : 26} click={b} />
      </Win>
    </Scene>
  );
}

/* 6 ─ Correction after release */
export function SceneAfter() {
  const b = useBeats([1200, 2400, 3400, 5000]);
  const upd = b >= 2;
  return (
    <Scene>
      <Cap n="05" title="Fix it after release" text="Admins can still correct a score. Nothing is overwritten and public results update." />
      <motion.div style={{ position: 'absolute', left: '52vh', top: '9vh', width: '56vh' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: E }}>
        <div className="panel" style={{ padding: '3vh' }}>
          <span className="eb">Correction history · append-only</span>
          <div className="hist" style={{ marginTop: '2vh' }}>
            {b >= 1 && <motion.div className="hi" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}><strong>Boulder 14 · topped</strong><p>2 attempts · Organizer (admin)</p><span className="mono" style={{ fontSize: '1vh' }}>19/04/2026, 09:15</span><span style={{ color: '#778077' }}> · correction</span></motion.div>}
            <div className="hi"><strong>Boulder 14 · topped</strong><p>3 attempts · Sam Reyes (climber)</p><span className="mono" style={{ fontSize: '1vh' }}>18/04/2026, 15:31</span></div>
            <div className="hi"><strong>Boulder 14 · attempted</strong><p>2 attempts · Sam Reyes (climber)</p><span className="mono" style={{ fontSize: '1vh' }}>18/04/2026, 15:22</span></div>
          </div>
        </div>
      </motion.div>
      <motion.div style={{ position: 'absolute', left: '114vh', top: '9vh', width: '58vh' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: E }}>
        <div className="panel" style={{ padding: '3vh' }}>
          <span className="eb">Final results · public</span>
          <div style={{ font: "800 1.8vh 'Kumbh Sans'", textTransform: 'uppercase', margin: '1.6vh 0 1vh' }}>Squad standings</div>
          {[['Ravens Wall', '#047732', 96.4, 96.4], ['Vaux Wall', '#009DDC', 91.8, 92.1], ['Harro Wall', '#772055', 84.3, 84.3], ['Croy Wall', '#52b93c', 78.6, 78.6]].map(([n, c, a, z]) => (
            <div key={n as string} className="sq" style={{ borderLeftColor: c as string }}>
              <b /><strong>{n as string}</strong>
              <motion.b className="avg" animate={{ color: upd && a !== z ? ['#1d1d1b', '#F6A017', '#1d1d1b'] : '#1d1d1b' }} transition={{ duration: 1.4 }}>{(upd ? (z as number) : (a as number)).toFixed(1)}</motion.b>
            </div>
          ))}
          <motion.div style={{ font: "700 1.3vh 'Space Mono'", color: '#047732', marginTop: '1.4vh' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 3 ? 1 : 0 }}>Results updated from the correction</motion.div>
        </div>
      </motion.div>
      <motion.svg style={{ position: 'absolute', left: '108vh', top: '24vh', width: '6vh', height: '4vh' }} viewBox="0 0 60 40">
        <motion.path d="M2 20 H50 M40 8 L54 20 L40 32" stroke="#F6A017" strokeWidth="5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: b >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }} />
      </motion.svg>
    </Scene>
  );
}

/* 7 ─ Accounts */
export function SceneAccounts() {
  const b = useBeats([1500, 2300, 3700]);
  const promoted = b >= 2;
  const rows: [string, string, string][] = [['Alex Mercer', 'a.mercer@example.org', 'admin'], ['Jordan Pike', 'j.pike@example.org', promoted ? 'admin' : 'competitor'], ['Priya Nair', 'p.nair@example.org', 'competitor']];
  return (
    <Scene>
      <Cap n="06" title="Accounts & roles" text="Give another organizer admin access. At least one admin is always kept." />
      <Win cam={b >= 3 ? { x: -4, y: -4, s: 1.04 } : { x: 0, y: 0, s: 1 }} side={1} title="Accounts & roles">
        <p style={{ fontSize: '1.4vh', color: '#778077', margin: '0 0 2vh' }}>Assign organizer access.</p>
        <table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th></tr></thead>
          <tbody>{rows.map(([n, e, r], i) => (
            <tr key={n}><td><strong>{n}</strong></td><td>{e}</td><td><motion.span className="mono" key={r} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{r}</motion.span></td>
              <td><span className={`b ${r === 'admin' ? 'o' : ''} ${i === 1 && b === 1 ? 'press' : ''}`}>{r === 'admin' ? 'Remove organizer' : 'Make organizer'}</span></td></tr>
          ))}</tbody></table>
        <Cursor x={b >= 1 ? 90 : 60} y={b >= 1 ? 26 : 40} click={b} />
      </Win>
    </Scene>
  );
}

/* 8 ─ End */
export function SceneEnd() {
  const b = useBeats([300, 900, 2400]);
  return (
    <motion.div className="stage" style={{ background: '#383838' }} initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: E }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#fdfcfa' }}>
        <div>
          <motion.div style={{ display: 'inline-block', background: '#fdfcfa', padding: '2vh' }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: b >= 1 ? 1 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
            <img src={LOGO} alt="LCC" style={{ height: '14vh', display: 'block' }} />
          </motion.div>
          <motion.div style={{ font: "800 6vh 'Kumbh Sans'", textTransform: 'uppercase', marginTop: '4vh' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: b >= 2 ? 1 : 0, y: b >= 2 ? 0 : 20 }}>LCC Intersquad Comp Series</motion.div>
          <motion.div className="eb" style={{ fontSize: '2vh', color: 'var(--or)', marginTop: '1.6vh' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 2 && b < 3 ? 1 : b >= 3 ? 0.6 : 0 }}>Create · Open · Correct · Release</motion.div>
        </div>
      </div>
    </motion.div>
  );
}
