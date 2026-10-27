import { useState, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';

const E = [0.22, 1, 0.36, 1] as const;
const LOGO = `${import.meta.env.BASE_URL}images/lcc-logo.svg`;
const EVENT = 'Round 3 · Spring 2026';
const SQC: Record<string, string> = { RavensWall: '#047732', HarroWall: '#772055', VauxWall: '#009DDC', CroyWall: '#cc2c24' };

function useBeats(times: number[]) {
  const [b, setB] = useState(0);
  useSceneTimer(times.map((t, i) => ({ time: t, callback: () => setB(i + 1) })));
  return b;
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <motion.div className="stage" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: E }}>
      <div className="demo">Demo data · fictional</div>
      {children}
    </motion.div>
  );
}

function Cap({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="cap">
      <motion.div className="n" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>STEP {n}</motion.div>
      <div style={{ overflow: 'hidden' }}>
        <motion.h2 initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 0.55, ease: E }}>{title}</motion.h2>
      </div>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>{text}</motion.p>
    </div>
  );
}

type Cam = { x: number; y: number; s: number };
function Page({ cam, nav, children }: { cam: Cam; nav: 0 | 1; children: ReactNode }) {
  return (
    <motion.div className="cam" initial={{ x: '6vh', y: '3vh', scale: 0.96, opacity: 0 }} animate={{ x: `${cam.x}vh`, y: `${cam.y}vh`, scale: cam.s, opacity: 1 }} transition={{ duration: 0.9, ease: E }}>
      <div className="pub">
        <div className="ptop">
          <div className="br"><img src={LOGO} alt="" /><div className="bn">LCC Intersquad<span>Comp Series</span></div></div>
          <nav><span className={nav === 0 ? 'on' : ''}>Events</span><span className={nav === 1 ? 'on' : ''}>Series</span></nav>
        </div>
        <div className="pg">{children}</div>
      </div>
    </motion.div>
  );
}

const Up = ({ d = 0, children, style }: { d?: number; children: ReactNode; style?: CSSProperties }) => (
  <motion.div style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d, duration: 0.45, ease: E }}>{children}</motion.div>
);

function ResultsHead() {
  return <>
    <span className="eb">Final results</span>
    <div className="pt">{EVENT}</div>
    <div className="mut">Final results · 14/03/2026 · <a>Series progress</a></div>
  </>;
}

const SQUADS = [
  { r: 1, s: 'RavensWall', n: 18, t: 2023, a: '112.39' },
  { r: 2, s: 'HarroWall', n: 16, t: 1702, a: '106.38' },
  { r: 3, s: 'VauxWall', n: 21, t: 2140, a: '101.90' },
  { r: 4, s: 'CroyWall', n: 14, t: 1309, a: '93.50' },
];
function Squads({ shown = 4, d = 0 }: { shown?: number; d?: number }) {
  return <div>
    {SQUADS.map((q, i) => (
      <motion.div key={q.s} className="sq" style={{ borderLeftColor: SQC[q.s] }} initial={{ opacity: 0, x: -24 }} animate={{ opacity: i < shown ? 1 : 0, x: i < shown ? 0 : -24 }} transition={{ delay: d + i * 0.12, duration: 0.45, ease: E }}>
        <span className="mono" style={{ fontWeight: 700 }}>#{q.r}</span>
        <span><strong>{q.s}</strong><small>{q.n} climbers · {q.t.toLocaleString('en-GB')} pts total</small></span>
        <b className="avg" style={{ textAlign: 'right' }}>{q.a}<small className="mono" style={{ textTransform: 'uppercase' }}>avg</small></b>
      </motion.div>
    ))}
    <div className="note">Average = squad total points divided by all squad scorecards, including scores of zero. Rounded to 2 decimals for display only. Equal averages share a rank.</div>
  </div>;
}

const PODS: [string, number, [string, string, number][]][] = [
  ['U13 O', 11, [['Arlo P.', 'VauxWall', 142], ['Kit M.', 'RavensWall', 131], ['Remy D.', 'HarroWall', 118]]],
  ['U13 W+', 12, [['Nell A.', 'RavensWall', 147], ['Ivy T.', 'CroyWall', 139], ['Suki B.', 'VauxWall', 126]]],
  ['U15 O', 10, [['Felix O.', 'HarroWall', 168], ['Dara K.', 'VauxWall', 157], ['Omar S.', 'RavensWall', 149]]],
  ['U15 W+', 9, [['Maya L.', 'RavensWall', 171], ['Esme R.', 'HarroWall', 163], ['Tia W.', 'CroyWall', 150]]],
  ['U17 O', 13, [['Jonah E.', 'VauxWall', 184], ['Luca F.', 'CroyWall', 176], ['Ravi N.', 'HarroWall', 169]]],
  ['U17 W+', 14, [['Cleo H.', 'HarroWall', 189], ['Zara Q.', 'RavensWall', 181], ['Pia G.', 'VauxWall', 172]]],
];
function Podiums({ places, d = 0 }: { places: number; d?: number }) {
  return <div className="pods">
    {PODS.map(([cat, n, rows], ci) => (
      <motion.section key={cat} className="pod" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d + ci * 0.07, duration: 0.45, ease: E }}>
        <header><strong>{cat}</strong><span>{n} climbers</span></header>
        <ol>{rows.map(([nm, sq, pts], i) => (
          <motion.li key={nm} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i < places ? 1 : 0, x: i < places ? 0 : -10 }} transition={{ duration: 0.35, delay: ci * 0.05, ease: E }}>
            <span className={`pl pl${i + 1}`}>{i + 1}</span><span>{nm}<small>{sq}</small></span><span className="mono">{pts}</span>
          </motion.li>))}</ol>
      </motion.section>
    ))}
  </div>;
}

const ROWS: [string, string, string, string, number, number, number][] = [
  ['Cleo H.', 'HarroWall', 'U17', 'W+', 189, 19, 31],
  ['Jonah E.', 'VauxWall', 'U17', 'O', 184, 19, 34],
  ['Zara Q.', 'RavensWall', 'U17', 'W+', 181, 18, 29],
  ['Luca F.', 'CroyWall', 'U17', 'O', 176, 18, 36],
  ['Pia G.', 'VauxWall', 'U17', 'W+', 172, 18, 33],
  ['Maya L.', 'RavensWall', 'U15', 'W+', 171, 18, 30],
  ['Ravi N.', 'HarroWall', 'U17', 'O', 169, 17, 28],
  ['Felix O.', 'HarroWall', 'U15', 'O', 168, 17, 32],
  ['Esme R.', 'HarroWall', 'U15', 'W+', 163, 17, 27],
  ['Dara K.', 'VauxWall', 'U15', 'O', 157, 16, 35],
];

// ---------- Scenes ----------
export function SceneIntro() {
  const b = useBeats([900, 2050]);
  return (
    <Scene>
      <div className="lock">
        <div style={{ textAlign: 'center' }}>
          <motion.img src={LOGO} alt="" style={{ height: '16vh' }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: b >= 2 ? 0.9 : 1 }} transition={{ duration: 0.7, ease: E }} />
          <div style={{ overflow: 'hidden', marginTop: '4vh' }}>
            <motion.h1 style={{ font: "800 10vh/1 'Kumbh Sans'", textTransform: 'uppercase', margin: 0, letterSpacing: '-.02em' }} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease: E }}>Public <span style={{ color: 'var(--or)' }}>results</span></motion.h1>
          </div>
          <motion.p style={{ fontSize: '2.6vh', color: '#4c4c4c', margin: '2.4vh 0 0' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: b >= 1 ? 1 : 0, y: b >= 1 ? 0 : 10 }} transition={{ duration: 0.45 }}>
            Final results and series progress for the 2026 LCC Intersquad Comp Series.
          </motion.p>
        </div>
      </div>
    </Scene>
  );
}

export function SceneGate() {
  const b = useBeats([900, 1800]);
  return (
    <Scene>
      <Cap n="01" title="Before release" text="Until the organizer releases results, the public page shows only this message." />
      <Page nav={0} cam={b >= 1 ? { x: 30, y: 4, s: 1.12 } : { x: 0, y: 0, s: 1 }}>
        <Up d={0.3} style={{ marginTop: '6vh' }}>
          <div className="panel" style={{ padding: '4vh' }}>
            <div className="pt">Results not yet released</div>
            <span className="b" style={{ marginTop: '1.4vh' }}>Back to events</span>
          </div>
        </Up>
        <motion.div style={{ marginTop: '3vh', display: 'flex', gap: '1.4vh', alignItems: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 2 ? 1 : 0 }} transition={{ duration: 0.35 }}>
          <span className="ptag released">Results released</span><span className="mut">Organizer releases {EVENT}</span>
        </motion.div>
      </Page>
    </Scene>
  );
}

export function SceneSquads() {
  const b = useBeats([1500, 3300]);
  return (
    <Scene>
      <Cap n="02" title="Squad standings" text="Once released, results are public with no login. Squads rank by average score, 0–200, counting every entrant including zeros." />
      <Page nav={0} cam={b >= 2 ? { x: -40, y: -14, s: 1.28 } : b >= 1 ? { x: -8, y: -4, s: 1.08 } : { x: 0, y: 0, s: 1 }}>
        <Up d={0.1}><ResultsHead /></Up>
        <Up d={0.3}><div className="sh">Squad standings</div></Up>
        <Squads d={0.45} />
      </Page>
    </Scene>
  );
}

export function ScenePodiums() {
  const b = useBeats([700, 1150, 1600, 3300]);
  return (
    <Scene>
      <Cap n="03" title="Category podiums" text="Top three in each category: U13, U15 and U17, each split O and W+." />
      <Page nav={0} cam={b >= 4 ? { x: -6, y: -2, s: 1.12 } : { x: 0, y: 0, s: 1 }}>
        <Up d={0.05}><div className="sh" style={{ marginTop: 0 }}>Category podiums</div></Up>
        <Podiums places={Math.min(3, b)} d={0.15} />
        <Up d={0.6}><div className="sh">All climbers</div></Up>
      </Page>
    </Scene>
  );
}

export function SceneTable() {
  const b = useBeats([2600]);
  return (
    <Scene>
      <Cap n="04" title="All climbers" text="Place, climber, squad, age, gender, score, tops and attempts. 20 boulders, up to 10 points each." />
      <Page nav={0} cam={b >= 1 ? { x: -10, y: -16, s: 1.14 } : { x: 0, y: 0, s: 1 }}>
        <div className="sh" style={{ marginTop: 0 }}>All climbers</div>
        <table className="tbl">
          <thead><tr>{['Place', 'Climber', 'Squad', 'Age', 'Gender', 'Score', 'Tops', 'Attempts'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{ROWS.map((r, i) => (
            <motion.tr key={r[0]} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.35, ease: E }}>
              <td className="mono">#{i + 1}</td><td><strong>{r[0]}</strong></td><td><span style={{ borderLeft: `.4vh solid ${SQC[r[1]]}`, paddingLeft: '.8vh' }}>{r[1]}</span></td><td>{r[2]}</td><td>{r[3]}</td><td className="mono">{r[4]}</td><td>{r[5]}</td><td>{r[6]}</td>
            </motion.tr>))}</tbody>
        </table>
      </Page>
    </Scene>
  );
}

const SERIES: [string, string, string, string][] = [
  ['Round 1 · Spring 2026', '17 Jan 2026', 'released', 'Results released'],
  ['Round 2 · Spring 2026', '14 Feb 2026', 'released', 'Results released'],
  ['Round 3 · Spring 2026', '14 Mar 2026', 'released', 'Results released'],
  ['Round 4 · Spring 2026', '18 Apr 2026', 'open', 'Open for scoring'],
];
export function SceneSeries() {
  const b = useBeats([1000, 2400]);
  return (
    <Scene>
      <Cap n="05" title="Series progress" text="Each event's status and podiums, event by event. No overall series totals are calculated." />
      <Page nav={1} cam={b >= 2 ? { x: -8, y: -6, s: 1.1 } : { x: 0, y: 0, s: 1 }}>
        <Up d={0.05}><div className="pt">Series progress</div></Up>
        <Up d={0.2}><div style={{ fontSize: '1.6vh' }}><strong>3 of 4</strong> events released in 2026</div></Up>
        <div className="sbar">{SERIES.map((s, i) => <motion.span key={s[0]} className={b >= 1 ? s[2] : ''} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }} />)}</div>
        <Up d={0.5}><div className="note" style={{ marginBottom: '1.6vh' }}>Each event is scored separately. No overall series totals are calculated.</div></Up>
        {SERIES.map((s, i) => (
          <Up key={s[0]} d={0.7 + i * 0.15}>
            <div className="sev">
              <span className="stp">{String(i + 1).padStart(2, '0')}</span>
              <div style={{ flex: 1 }}>
                <h3>{s[0]}</h3><div className="mut" style={{ margin: '.2vh 0 .6vh' }}>{s[1]}</div>
                <span className={`ptag ${s[2]}`}>{s[3]}</span>
              </div>
              {s[2] === 'released'
                ? <span className="b o" style={{ alignSelf: 'center' }}>Full results <ArrowRight size={12} /></span>
                : <span className="mut" style={{ alignSelf: 'center' }}>Results will appear here once released.</span>}
            </div>
          </Up>
        ))}
      </Page>
    </Scene>
  );
}

export function SceneEnd() {
  const b = useBeats([700]);
  return (
    <Scene>
      <div className="lock">
        <div style={{ textAlign: 'center' }}>
          <motion.img src={LOGO} alt="" style={{ height: '18vh' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: E }} />
          <motion.div style={{ font: "800 4.6vh 'Kumbh Sans'", textTransform: 'uppercase', marginTop: '4vh', borderTop: '.5vh solid var(--or)', paddingTop: '2.4vh' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
            Final results <span style={{ color: 'var(--cy)' }}>·</span> Series progress
          </motion.div>
          <motion.p className="mono" style={{ fontSize: '1.8vh', color: '#6b6b6b', marginTop: '2vh' }} initial={{ opacity: 0 }} animate={{ opacity: b >= 1 ? 1 : 0 }} transition={{ duration: 0.4 }}>Demonstration uses fictional data.</motion.p>
        </div>
      </div>
    </Scene>
  );
}
