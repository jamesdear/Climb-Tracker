import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const B = import.meta.env.BASE_URL;
const E = [0.22, 1, 0.36, 1] as const;

function useSteps(times: number[]) {
  const [s, setS] = useState(0);
  useSceneTimer(times.map((t, i) => ({ time: t, callback: () => setS(i + 1) })));
  return s;
}

function Shell({ children }: { children: ReactNode }) {
  return <motion.section className="absolute inset-0" style={{ background: '#f3f0ea' }}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>{children}</motion.section>;
}

function Caption({ n, title, line, right }: { n: string; title: string; line: string; right?: boolean }) {
  return <div className="cap" style={right ? { left: 'auto', right: '6vw' } : undefined}>
    <motion.div className="n" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>STEP {n}</motion.div>
    <motion.h1 initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.7, ease: E, delay: 0.15 }}>{title}</motion.h1>
    <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>{line}</motion.p>
  </div>;
}

function Phone({ x, children }: { x: string; children: ReactNode }) {
  return <motion.div className="phone" style={{ left: x, top: '6vh' }} initial={{ y: '4vh', opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: E }}>
    <div className="screen">{children}</div>
  </motion.div>;
}

function Top() {
  return <div className="ptop"><img src={`${B}images/lcc-logo.svg`} alt="" /><span>Intersquad<br /><span style={{ color: '#009DDC', border: 0, padding: 0 }}>Comp Series</span></span></div>;
}

function Tap({ x, y, k }: { x: string; y: string; k: number }) {
  return <motion.div key={k} className="tap" style={{ left: x, top: y }} initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.6 }} />;
}

const QR_BITS = Array.from({ length: 21 * 21 }, (_, i) => {
  const r = Math.floor(i / 21), c = i % 21;
  const f = (a: number, b: number) => r >= a && r < a + 7 && c >= b && c < b + 7;
  if (f(0, 0) || f(0, 14) || f(14, 0)) {
    const rr = r % 7 === r ? r : r - 14, cc = c < 7 ? c : c - 14;
    const R = r < 7 ? r : r - 14;
    void rr;
    return R === 0 || R === 6 || cc === 0 || cc === 6 || (R >= 2 && R <= 4 && cc >= 2 && cc <= 4);
  }
  return ((r * 7 + c * 13 + r * c) % 5) < 2;
});
function QR({ size }: { size: string }) {
  return <div style={{ width: size, height: size, display: 'grid', gridTemplateColumns: 'repeat(21,1fr)', background: '#fff', padding: '4%' }}>
    {QR_BITS.map((b, i) => <div key={i} style={{ background: b ? '#1d1d1b' : 'transparent' }} />)}
  </div>;
}

/* 1 — QR scan (illustrated) */
export function SceneQR() {
  const s = useSteps([900, 1900, 2900, 3700]);
  return <Shell>
    <motion.div style={{ position: 'absolute', left: '9vw', top: '12vh', width: '34vw', height: '76vh', background: '#fdfcfa', borderTop: '1.2vh solid #F6A017', padding: '4vh', boxSizing: 'border-box', boxShadow: '0 2vh 5vh #0002' }}
      initial={{ rotate: -3, scale: 1.08, opacity: 0 }} animate={{ rotate: -1.5, scale: 1, opacity: 1 }} transition={{ duration: 0.8, ease: E }}>
      <img src={`${B}images/lcc-logo.svg`} style={{ height: '8vh' }} alt="" />
      <div className="eb" style={{ fontSize: '1.8vh', marginTop: '3vh' }}>Event scorecard QR</div>
      <div style={{ font: "800 4.2vh/1.05 'Kumbh Sans'", textTransform: 'uppercase', margin: '1vh 0 3vh' }}>Intersquad Comp<br />Round 2</div>
      <QR size="34vh" />
    </motion.div>
    <Caption n="01" title="Scan the event QR" line="Opens the scorecard. No sign-in." right />
    <motion.div className="phone" style={{ left: '30vw', top: '10vh', width: '30vh', height: '60vh' }}
      initial={{ y: '95vh', rotate: 8 }} animate={{ y: s >= 1 ? 0 : '95vh', rotate: s >= 1 ? -4 : 8 }} transition={{ duration: 0.8, ease: E }}>
      <div className="screen" style={{ background: '#1b1b1b', display: 'grid', placeItems: 'center' }}>
        <div style={{ position: 'relative', width: '20vh', height: '20vh', opacity: 0.85 }}>
          <QR size="20vh" />
          <motion.div style={{ position: 'absolute', inset: '-1.5vh', border: '.5vh solid #F6A017' }} animate={{ scale: s >= 2 ? 1 : 1.2, opacity: s >= 2 ? 1 : 0.4 }} />
          {s >= 1 && s < 3 && <motion.div style={{ position: 'absolute', left: 0, right: 0, height: '.4vh', background: '#009DDC' }} initial={{ top: 0 }} animate={{ top: '20vh' }} transition={{ duration: 0.8, repeat: 2, repeatType: 'reverse' }} />}
        </div>
        <AnimatePresence>{s >= 3 && <motion.div style={{ position: 'absolute', bottom: '6vh', left: '2vh', right: '2vh', background: '#fdfcfa', padding: '1.4vh', fontSize: '1.4vh', fontWeight: 700 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <span className="mono" style={{ fontSize: '1.1vh', color: '#009DDC' }}>…/event/b76a7cf7</span><br />Open scorecard setup
        </motion.div>}</AnimatePresence>
      </div>
    </motion.div>
    <div style={{ position: 'absolute', right: '6vw', bottom: '8vh', fontSize: '1.8vh', color: '#888' }} className="mono">Illustration · fictional details</div>
  </Shell>;
}

/* 2 — Scorecard details */
const TYPE = (txt: string, s: number, from: number) => txt.slice(0, Math.max(0, Math.min(txt.length, (s - from) * 6)));
export function SceneSetup() {
  const s = useSteps(Array.from({ length: 34 }, (_, i) => 400 + i * 190));
  const field = (on: boolean) => `inp ${on ? 'on' : ''}`;
  const name = TYPE('Maya Okafor', s, 1);
  const supervisor = s >= 14;
  return <Shell>
    <Caption n="02" title="Scorecard details" line="Climbers are already invited. Fill in the card once, then score." />
    <Phone x="56vw">
      <Top />
      <motion.div style={{ padding: '1.6vh 2vh' }} animate={{ y: s >= 20 ? '-16vh' : 0 }} transition={{ duration: 0.6, ease: E }}>
        <span className="eb">Scorecard details</span>
        <div style={{ font: "600 2.8vh/1.05 'Kumbh Sans'", letterSpacing: '-.04em', margin: '.6vh 0' }}>Intersquad Comp · Round 2</div>
        <div className="note">20 boulders · four attempts each</div>
        <div className="fld"><label>Climber name</label><div className={field(s >= 1 && s < 4)}>{name || <span style={{ color: '#aaa' }}>Name on the scorecard</span>}</div></div>
        <div className="fld"><label>Year of birth</label><div className={field(s >= 4 && s < 7)}>{TYPE('2013', s, 4) || <span style={{ color: '#aaa' }}>YYYY</span>}</div>
          <div className="help">{s >= 6 ? <b style={{ color: '#047732' }}>Under 15 · age 13 at 31 December 2026</b> : 'Age at 31 December 2026'}</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vh' }}>
          <div className="fld"><label>Gender category</label><div className={field(s >= 8 && s < 10)}>{s >= 9 ? 'W+' : <span style={{ color: '#aaa' }}>Choose</span>}</div></div>
          <div className="fld"><label>Home wall</label><div className={field(s >= 10 && s < 12)}>{s >= 11 ? 'Vaux Wall' : 'Ravens Wall'}</div></div>
        </div>
        <div className="chk"><div className={`box ${supervisor ? '' : 'on'}`}>✓</div><span>I am the climber and will log my own results.</span></div>
        {supervisor && <motion.div className="fld" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}><label>Supervisor name</label><div className={field(s < 18)}>{TYPE('Sam Okafor', s, 15)}</div></motion.div>}
        <div className="fld"><label>Email <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label><div className={field(s >= 20 && s < 25)}>{TYPE('sam@example.com', s, 21) || <span style={{ color: '#aaa' }}>For attempt confirmations</span>}</div></div>
        <div className="chk"><div className={`box ${s >= 26 ? 'on' : ''}`}>✓</div><span>I accept the event terms and privacy statement, including how my scorecard information is used.</span></div>
        <motion.div className="btnp" animate={{ scale: s === 30 ? 0.95 : 1, opacity: s >= 26 ? 1 : 0.45 }}>{s >= 30 ? 'Creating scorecard…' : 'Create scorecard →'}</motion.div>
      </motion.div>
    </Phone>
  </Shell>;
}

type Bd = { a: number; done: boolean };
function boulders(seven: Bd) { return Array.from({ length: 20 }, (_, i) => (i === 6 ? seven : { a: 0, done: false })); }
const PTS = [0, 10, 7, 4, 1];
function Card({ seven, tapped, total, history }: { seven: Bd; tapped?: boolean; total: number; history?: ReactNode }) {
  return <div style={{ padding: '1.4vh 2vh' }}>
    <span className="eb">Intersquad Comp · Round 2</span>
    <div style={{ font: "600 3.4vh 'Kumbh Sans'", letterSpacing: '-.05em', margin: '.4vh 0' }}>Maya Okafor</div>
    <div className="note" style={{ marginTop: 0 }}>Vaux Wall · Under 15 · W+ · Supervisor: Sam Okafor</div>
    <div className="shead"><div><div className="sub">TOTAL</div><div className="big">{total} <span className="sub">PTS</span></div></div>
      <div style={{ textAlign: 'right' }}><div className="sub">COMPLETED</div><div className="big" style={{ fontSize: '2.8vh' }}>{seven.done ? 1 : 0}<span className="sub"> / 20</span></div></div></div>
    {history ?? <><div className="note" style={{ marginBottom: '.8vh' }}>Select a boulder number.</div>
    <div className="grid">{boulders(seven).map((b, i) => <div key={i} className={`bd ${b.done ? 'done' : b.a ? 'tried' : ''}`} style={i === 6 && tapped ? { outline: '.35vh solid #009DDC' } : undefined}>
      <b>{String(i + 1).padStart(2, '0')}</b><i>{b.done ? '✓ ' : ''}{b.a}/4</i><small>{b.done ? PTS[b.a] : 0} pts</small></div>)}</div></>}
  </div>;
}

/* 3 — Pick a boulder */
export function SceneCard() {
  const s = useSteps([2600, 3300]);
  return <Shell>
    <Phone x="12vw"><Top /><Card seven={{ a: 0, done: false }} tapped={s >= 1} total={0} />
      <AnimatePresence>{s >= 1 && <Tap x="80%" y="57%" k={1} />}</AnimatePresence>
    </Phone>
    <Caption n="03" title="Pick a boulder number" line="All 20 boulders on one screen. Tap the one you just tried." right />
  </Shell>;
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return <>
    <div style={{ position: 'absolute', inset: 0, background: '#14251dcc' }} />
    <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.45, ease: E }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><span className="eb">{title}</span><div style={{ font: "800 3vh 'Kumbh Sans'", textTransform: 'uppercase' }}>Boulder 07</div></div>
        <div style={{ width: '4.6vh', height: '4.6vh', border: '1px solid #d9d6d0', display: 'grid', placeItems: 'center', fontSize: '2vh' }}>✕</div>
      </div>
      {children}
    </motion.div>
  </>;
}

/* 4 — Failed attempts */
export function SceneFailed() {
  const s = useSteps([1400, 1700, 2700, 3000]);
  const a = s >= 3 ? 2 : s >= 1 ? 1 : 0;
  return <Shell>
    <Caption n="04" title="Failed attempts save as you tap" line="Each + or − saves straight away." />
    <Phone x="56vw"><Top /><Card seven={{ a, done: false }} total={0} />
      <Sheet title="Not completed">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2vh 0', borderBottom: '1px solid #e4e1db', fontSize: '1.4vh' }}><b>0 pts</b><span>{a} {a === 1 ? 'attempt' : 'attempts'}</span></div>
        <span className="clab">Completed</span>
        <div className="track"><span className="tlab">Slide to mark completed</span><div className="thumb">›</div></div>
        <span className="clab">Failed attempts</span>
        <div className="spin"><div className={a === 0 ? 'dis' : ''}>−</div><motion.output key={a} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>{a}</motion.output><div>+</div></div>
        <div className="note">Each change saves immediately. Use minus to correct a mistake.</div>
        <div style={{ height: '3.4vh', marginTop: '1vh' }}>{(s === 2 || s >= 4) && <motion.div className="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Saved.</motion.div>}</div>
      </Sheet>
      <AnimatePresence>{(s === 1 || s === 3) && <Tap x="84%" y="76%" k={s} />}</AnimatePresence>
    </Phone>
  </Shell>;
}

/* 5 — Slide to complete and confirm */
export function SceneComplete() {
  const s = useSteps([700, 1700, 2900, 3700, 4500]);
  const confirm = s >= 2 && s < 4;
  const saved = s >= 4;
  return <Shell>
    <Phone x="12vw"><Top /><Card seven={saved ? { a: 3, done: true } : { a: 2, done: false }} total={saved ? 4 : 0} />
      {s < 5 && <Sheet title={saved ? 'Completed' : 'Not completed'}>
        {!confirm ? <>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2vh 0', borderBottom: '1px solid #e4e1db', fontSize: '1.4vh' }}><b>{saved ? 4 : 0} pts</b><span>{saved ? '3 attempts · completed' : '2 attempts'}</span></div>
          <span className="clab">Completed</span>
          <div className={`track ${saved ? 'on' : ''}`}><span className="tlab">{saved ? 'Completed · slide back to undo' : 'Slide to mark completed'}</span>
            <motion.div className="thumb" style={saved ? { background: '#047732' } : undefined} animate={{ x: s >= 1 ? '29vh' : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>{saved ? '✓' : '›'}</motion.div></div>
          <span className="clab">Failed attempts</span>
          <div className="spin"><div>−</div><output>2</output><div>+</div></div>
        </> : <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '1.6vh', margin: '2vh 0 .6vh' }}>Total attempts including the completing attempt</p>
          <div className="spin"><div>−</div><output>3</output><div>+</div></div>
          <div className="note">Saved as completed only when you confirm.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1vh' }}><div className="btnp btno">Cancel</div><motion.div className="btnp" animate={{ scale: s === 3 ? 0.94 : 1 }}>Confirm completed</motion.div></div>
        </motion.div>}
      </Sheet>}
      <AnimatePresence>{s === 1 && <motion.div className="tap" style={{ top: '64%', left: '14%' }} animate={{ left: '80%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} />}{s === 3 && <Tap x="66%" y="86%" k={3} />}</AnimatePresence>
      <AnimatePresence>{s >= 4 && <motion.div className="saved" style={{ position: 'absolute', top: '11vh', left: '2vh', right: '2vh' }} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>Saved. Boulder 07 · 3 attempts · 4 pts</motion.div>}</AnimatePresence>
    </Phone>
    <Caption n="05" title="Slide to complete" line="Then confirm the total attempts, including the one that topped it. Cancel saves nothing." right />
  </Shell>;
}

/* 6 — Correction with history */
export function SceneCorrect() {
  const s = useSteps([900, 1900, 2700, 3500]);
  const fixed = s >= 3;
  const hist = s >= 4;
  const Item = ({ t, sub, c }: { t: string; sub: string; c?: boolean }) => <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'relative', paddingBottom: '1.6vh' }}>
    <div style={{ position: 'absolute', left: '-2.4vh', top: '.4vh', width: '1vh', height: '1vh', borderRadius: '50%', background: '#F6A017' }} />
    <b style={{ fontSize: '1.5vh' }}>{t}</b><div className="note" style={{ marginTop: '.3vh' }}>{sub}{c && <> · <b style={{ color: '#009DDC' }}>correction</b></>}</div></motion.div>;
  return <Shell>
    <Caption n="06" title="Corrections keep the history" line="Change attempts on a completed boulder. Earlier records stay on the card." />
    <Phone x="56vw"><Top />
      <Card seven={{ a: fixed ? 2 : 3, done: true }} total={fixed ? 7 : 4} history={hist ? <div>
        <div style={{ font: "800 2.2vh 'Kumbh Sans'" }}>Scorecard history</div>
        <div className="note">Changes are added as new records. Previous results are kept.</div>
        <div style={{ borderLeft: '.25vh solid #d7dfd3', margin: '1.4vh 0 0 .8vh', paddingLeft: '2vh' }}>
          <Item t="Boulder 7 · topped" sub="2 attempts · Sam Okafor (supervisor)" c />
          <Item t="Boulder 7 · topped" sub="3 attempts · Sam Okafor (supervisor)" />
          <Item t="Boulder 7 · attempted" sub="2 attempts · Sam Okafor (supervisor)" />
          <Item t="Boulder 7 · attempted" sub="1 attempt · Sam Okafor (supervisor)" />
        </div></div> : undefined} />
      {!hist && <Sheet title="Completed">
        {s < 2 ? <>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2vh 0', borderBottom: '1px solid #e4e1db', fontSize: '1.4vh' }}><b>4 pts</b><span>3 attempts · completed</span></div>
          <span className="clab">Failed attempts</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.3vh', color: '#778077' }}>Completed in 3 attempts.<motion.div className="btnp btno" style={{ margin: 0, padding: '0 1.2vh' }} animate={{ scale: s === 1 ? 0.94 : 1 }}>Change attempts</motion.div></div>
        </> : <>
          <p style={{ fontWeight: 700, fontSize: '1.6vh', margin: '2vh 0 .6vh' }}>Total attempts including the completing attempt</p>
          <div className="spin"><div>−</div><motion.output key={s >= 2 ? 2 : 3} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>2</motion.output><div>+</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1vh' }}><div className="btnp btno">Cancel</div><motion.div className="btnp" animate={{ scale: s === 3 ? 0.94 : 1 }}>{fixed ? 'Saving…' : 'Confirm completed'}</motion.div></div>
        </>}
      </Sheet>}
      <AnimatePresence>{s === 1 && <Tap x="76%" y="83%" k={1} />}{s === 2 && <Tap x="18%" y="80%" k={2} />}{s === 3 && <Tap x="66%" y="89%" k={3} />}</AnimatePresence>
    </Phone>
  </Shell>;
}

/* 7 — End lockup */
export function SceneEnd() {
  return <motion.section className="absolute inset-0" style={{ background: '#fdfcfa', display: 'grid', placeItems: 'center' }}
    initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(80% at 50% 50%)' }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: E }}>
    <div style={{ textAlign: 'center' }}>
      <motion.img src={`${B}images/lcc-logo.svg`} alt="London Climbing Centres" style={{ height: '22vh' }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: E }} />
      <motion.div style={{ font: "800 6vh 'Kumbh Sans'", textTransform: 'uppercase', marginTop: '4vh' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        Intersquad <span style={{ color: '#009DDC' }}>Comp Series</span></motion.div>
      <motion.div className="mono" style={{ fontSize: '2.4vh', marginTop: '2.5vh', color: '#383838' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        20 BOULDERS · 4 ATTEMPTS · <span style={{ color: '#F6A017' }}>10 / 7 / 4 / 1</span> PTS</motion.div>
    </div>
  </motion.section>;
}
