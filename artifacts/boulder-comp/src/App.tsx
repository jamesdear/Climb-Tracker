import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import { Activity, ArrowRight, Check, Copy, ExternalLink, Mountain, Plus, Trophy, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useListOpenEvents, useGetPublicEvent, useCreateScorecard, useGetScorecard, useGetScorecardHistory,
  useGetPublicResults, useSaveAccountProfile, useGetMyAccount, useListAdminEvents, useCreateEvent, useUpdateEvent,
  useUpdateEventStatus, useGetEventMonitor, useListEventScorecards, useGetAdminScorecard, useReleaseEventResults,
  useListAdminUsers, useUpdateAccountRole, useListMyScorecards,
  getListOpenEventsQueryKey, getGetPublicEventQueryKey, getGetScorecardQueryKey, getGetScorecardHistoryQueryKey,
  getGetPublicResultsQueryKey, getGetMyAccountQueryKey, getListAdminEventsQueryKey, getGetEventMonitorQueryKey,
  getListEventScorecardsQueryKey, getGetAdminScorecardQueryKey, getListAdminUsersQueryKey, getListMyScorecardsQueryKey, getGetSeriesProgressQueryKey,
} from '@workspace/api-client-react';
import type { EventInput, BoulderState, AttemptRecord, AttemptLogResult } from '@workspace/api-client-react';
import { BoulderControls } from './components/BoulderControls';
import { Logo, Shell, Status, Busy, Failure } from './components/layout';
import { SquadStandings, CategoryPodiums, UncategorizedNote, genderLabel } from './components/Standings';
import { SeriesPage } from './pages/Series';
import { bracketFor, bracketLabel, eventYear } from './lib/age';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 8_000 } } });
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
const appearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/lcc-logo.svg` },
  variables: {
    colorPrimary: '#383838', colorForeground: '#1d1d1b', colorMutedForeground: '#6b6b6b',
    colorDanger: '#cc2c24', colorBackground: '#fdfcfa', colorInput: '#fdfcfa',
    colorInputForeground: '#1d1d1b', colorNeutral: '#d9d6d0',
    fontFamily: "'Kumbh Sans', 'Neue Kabel', sans-serif", borderRadius: '2px',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fdfcfa] rounded-none border-t-4 border-[#F6A017] w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1d1d1b] font-bold', headerSubtitle: 'text-[#6b6b6b]', socialButtonsBlockButtonText: 'text-[#1d1d1b]',
    formFieldLabel: 'text-[#383838]', footerActionLink: 'text-[#009DDC]', footerActionText: 'text-[#6b6b6b]',
    dividerText: 'text-[#6b6b6b]', identityPreviewEditButton: 'text-[#009DDC]', formFieldSuccessText: 'text-[#047732]',
    alertText: 'text-[#cc2c24]', logoBox: 'mb-2', logoImage: 'max-h-14', socialButtonsBlockButton: 'border-[#d9d6d0]',
    formButtonPrimary: 'bg-[#383838] hover:bg-[#F6A017] rounded-none uppercase tracking-wider', formFieldInput: 'bg-[#fdfcfa] border-[#d9d6d0]',
    footerAction: 'text-[#6b6b6b]', dividerLine: 'bg-[#e4e1db]', alert: 'bg-[#fbe9e7]', otpCodeFieldInput: 'border-[#d9d6d0]',
    formFieldRow: 'gap-2', main: 'gap-4',
  },
};

function AccountSync() {
  const { user, isLoaded } = useUser(); const account = useGetMyAccount({ query: { queryKey: getGetMyAccountQueryKey(), enabled: !!user && isLoaded } });
  const save = useSaveAccountProfile(); const profile = account.data;
  useEffect(() => { if (user && isLoaded && !profile && !account.isLoading && !save.isPending && !save.isSuccess && !save.isError) save.mutate({ data: { email: user.primaryEmailAddress?.emailAddress ?? '', displayName: user.fullName || user.username || 'Climber' } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMyAccountQueryKey() }) }); }, [user, isLoaded, profile, account.isLoading, save.isPending, save.isSuccess, save.isError]);
  return null;
}
function Home() {
  const q = useListOpenEvents({ query: { queryKey: getListOpenEventsQueryKey(), refetchInterval: 30000 } });
  return <Shell><main>
    <h1 className="home-title">LCC Intersquad Comp Series</h1>
    <section id="events"><div className="section-head"><div><h2>Open events</h2></div></div>
      {q.isLoading ? <div className="event-grid">{[0,1].map(i=><div className="event-card" key={i}><div className="skeleton" style={{height:80,width:'100%'}}/></div>)}</div> : q.isError ? <Failure retry={()=>q.refetch()}/> : (q.data?.length ?? 0)===0 ? <div className="empty" data-testid="empty-open-events"><Mountain size={28}/><p>No events are open for scoring.</p></div> : <div className="event-grid">{q.data?.map((event,i)=><article className="event-card" key={event.id} data-testid={`card-event-${event.id}`}><div><Status value={event.status}/><h3 data-testid={`text-event-name-${event.id}`}>{event.name}</h3><p>{event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}) : 'Date to be announced'} · 20 boulders · 4 attempts</p></div><Link className="btn small" href={`/event/${event.id}`} data-testid={`link-register-${event.id}`}>Open scorecard <ArrowRight size={15}/></Link></article>)}</div>}
    </section>
    </main></Shell>;
}
function Register({eventId}:{eventId:string}) {
  const q=useGetPublicEvent(eventId,{query:{queryKey:getGetPublicEventQueryKey(eventId)}}); const create=useCreateScorecard(); const [,go]=useLocation();
  const [name,setName]=useState(''),[squad,setSquad]=useState('RavensWall'),[isClimber,setIsClimber]=useState(true),[logger,setLogger]=useState(''),[email,setEmail]=useState(''),[terms,setTerms]=useState(false),[birth,setBirth]=useState(''),[gender,setGender]=useState<''|'O'|'W+'>('');
  if(q.isLoading)return <Shell><Busy/></Shell>;
  const event=q.data;
  const year=event?eventYear(event):new Date().getFullYear();
  const birthNum=/^\d{4}$/.test(birth)?Number(birth):NaN;
  const bracket=Number.isNaN(birthNum)?null:bracketFor(birthNum,year);
  return <Shell><main className="page">{q.isError||!event?<Failure retry={()=>q.refetch()}/>:<><span className="eyebrow">Scorecard details</span><h1 className="page-title">{event.name}</h1><p className="muted">{event.eventDate?new Date(event.eventDate).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}):'Date to be announced'} · 20 boulders · four attempts each</p><div className="panel" style={{maxWidth:760,marginTop:25}}><form className="form-grid" onSubmit={e=>{e.preventDefault();if(!terms||!bracket||!gender)return;create.mutate({eventId,data:{climberName:name.trim(),birthYear:birthNum,gender,squad:squad as 'RavensWall'|'HarroWall'|'VauxWall'|'CroyWall',isClimber,loggerName:isClimber?undefined:logger.trim(),email:email.trim()||undefined,acceptedTerms:true}},{onSuccess:s=>{queryClient.invalidateQueries({queryKey:getGetPublicEventQueryKey(eventId)});go(`/scorecard/${s.id}`)}})}} data-testid="form-registration">
      <div className="field full"><label htmlFor="climber">Climber name</label><input id="climber" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Name on the scorecard" data-testid="input-climber-name"/></div>
      <div className="field">
        <label htmlFor="birth-year">Year of birth</label>
        <input id="birth-year" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" value={birth} onChange={e=>setBirth(e.target.value.replace(/\D/g,''))} placeholder="YYYY" aria-describedby="birth-help" data-testid="input-birth-year"/>
        <span id="birth-help" className={`field-help ${birth.length===4&&!bracket?'bad':''}`} data-testid="text-derived-bracket">
          {birth.length<4?`Age at 31 December ${year}`:bracket?`${bracket} · age ${year-birthNum} at 31 December ${year}`:`Not eligible: age at 31 December ${year} must be under 17`}
        </span>
      </div>
      <div className="field">
        <label htmlFor="gender">Gender category</label>
        <select id="gender" required value={gender} onChange={e=>setGender(e.target.value as ''|'O'|'W+')} data-testid="select-gender">
          <option value="" disabled>Choose a category</option>
          <option value="O">O</option>
          <option value="W+">W+</option>
        </select>
      </div>
      <div className="field"><label htmlFor="squad">Home wall</label><select id="squad" value={squad} onChange={e=>setSquad(e.target.value)} data-testid="select-squad">{['RavensWall','HarroWall','VauxWall','CroyWall'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      <div className="field"><label htmlFor="email">Email <span className="muted">(optional)</span></label><input id="email" type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="For attempt confirmations" data-testid="input-email"/></div>
      <label className="checkrow field full"><input type="checkbox" checked={isClimber} onChange={e=>setIsClimber(e.target.checked)} data-testid="checkbox-is-climber"/><span>I am the climber and will log my own results.</span></label>
      {!isClimber&&<div className="field full"><label htmlFor="logger">Supervisor name</label><input id="logger" required maxLength={120} value={logger} onChange={e=>setLogger(e.target.value)} placeholder="Supervisor name" data-testid="input-logger-name"/></div>}
      <label className="checkrow field full"><input type="checkbox" required checked={terms} onChange={e=>setTerms(e.target.checked)} data-testid="checkbox-terms"/><span>I accept the event terms and privacy statement, including how my scorecard information is used.</span></label>
      <details className="privacy-note field full"><summary>Read event terms and privacy statement</summary><p>Follow the venue’s safety requirements and the organizers’ instructions while climbing. Your climber name, squad, scorecard, and attempt history are visible to event organizers. Final standings become public only after the organizers release them. If you provide an email address, it is used to send scorecard update confirmations. The score and correction history is retained as part of the event record.</p></details>
      <div className="field full"><button className="btn coral" disabled={create.isPending||!bracket||!gender} data-testid="button-submit-registration">{create.isPending?'Creating scorecard…':'Create scorecard'} <ArrowRight size={16}/></button>{create.isError&&<p className="muted" role="alert" data-testid="registration-error">Could not create scorecard. Please try again.</p>}</div>
    </form></div></>}</main></Shell>;
}

function BoulderGrid({boulders,onSelect,prefix}:{boulders:BoulderState[];onSelect:(n:number)=>void;prefix:string}) {
  return (
    <div className="boulder-grid">
      {boulders.map(b=>(
        <button
          type="button"
          className={`boulder ${b.completed?'done':b.attempts>0?'tried':''}`}
          key={b.boulderNumber}
          onClick={()=>onSelect(b.boulderNumber)}
          aria-label={`Boulder ${b.boulderNumber}, ${b.attempts} attempts${b.completed?', completed':''}`}
          data-testid={`${prefix}-${b.boulderNumber}`}
        >
          <span className="boulder-num">{String(b.boulderNumber).padStart(2,'0')}</span>
          <span className="boulder-meta" data-testid={`text-attempts-${b.boulderNumber}`}>
            {b.completed&&<Check size={13}/>} {b.attempts}/4
          </span>
          <span className="boulder-points" data-testid={`text-points-${b.boulderNumber}`}>{b.points} pts</span>
        </button>
      ))}
    </div>
  );
}

function Scorecard({scorecardId}:{scorecardId:string}) {
  const q=useGetScorecard(scorecardId,{query:{queryKey:getGetScorecardQueryKey(scorecardId),refetchInterval:5000}});
  const history=useGetScorecardHistory(scorecardId,{query:{queryKey:getGetScorecardHistoryQueryKey(scorecardId),refetchInterval:10000}});
  const [selected,setSelected]=useState<number|null>(null);
  const [notice,setNotice]=useState('');
  const card=q.data;
  const active=card?.boulders.find(b=>b.boulderNumber===selected)??null;
  const refresh=()=>Promise.all([
    queryClient.invalidateQueries({queryKey:getGetScorecardQueryKey(scorecardId)}),
    queryClient.invalidateQueries({queryKey:getGetScorecardHistoryQueryKey(scorecardId)}),
    queryClient.invalidateQueries({queryKey:getGetSeriesProgressQueryKey()}),
    ...(card?[
      queryClient.invalidateQueries({queryKey:getGetEventMonitorQueryKey(card.eventId)}),
      queryClient.invalidateQueries({queryKey:getListEventScorecardsQueryKey(card.eventId)}),
      queryClient.invalidateQueries({queryKey:getGetPublicResultsQueryKey(card.eventId)}),
    ]:[]),
  ]);
  const onSaved=(r:AttemptLogResult)=>setNotice(
    r.emailStatus==='sent'?'Saved. Confirmation email sent.'
    :r.emailStatus==='not_configured'?'Saved. Email confirmations are not configured.'
    :r.emailStatus==='failed'?'Saved, but the email could not be sent.'
    :'Saved.'
  );
  if(q.isLoading)return <Shell><Busy label="Loading scorecard"/></Shell>;
  return <Shell><main className="page">{q.isError||!card?<Failure retry={()=>q.refetch()}/>:<>
    <span className="eyebrow">{card.eventName}</span>
    <h1 className="page-title">{card.climberName}</h1>
    <p className="muted" data-testid="text-scorecard-meta">
      {card.squad} · <span data-testid="text-age-bracket">{bracketLabel(card.ageBracket)}</span> · <span data-testid="text-gender">{genderLabel(card.gender)}</span>
      {card.loggerName&&<> · Supervisor: {card.loggerName}</>}
    </p>
    <div className="score-head">
      <div><span className="score-sub">TOTAL</span><div className="score-big" data-testid="text-score-total">{card.totalPoints.toLocaleString()} <span className="score-sub">PTS</span></div></div>
      <div style={{textAlign:'right'}}><span className="score-sub">COMPLETED</span><div className="score-big" style={{fontSize:30}} data-testid="text-score-tops">{card.completedCount}<span className="score-sub"> / 20</span></div></div>
    </div>
    {notice&&<div className="save-notice" role="status" data-testid="status-save-notice">{notice}</div>}
    {card.eventStatus!=='open'&&<div className="panel" style={{marginBottom:18}} data-testid="status-event-closed">This event is {card.eventStatus}. Results are read-only.</div>}
    <p className="muted" style={{marginBottom:10}}>Select a boulder number.</p>
    <BoulderGrid boulders={card.boulders} onSelect={n=>{setNotice('');setSelected(n)}} prefix="boulder"/>
    <div style={{marginTop:36}}><h2 className="display" style={{fontSize:22}}>Scorecard history</h2><p className="muted">Changes are added as new records. Previous results are kept.</p>{history.isLoading?<div className="panel">Loading history…</div>:history.isError?<Failure retry={()=>history.refetch()}/>:!history.data?.length?<div className="empty" data-testid="empty-history">No results logged yet.</div>:<HistoryList records={history.data}/>}</div>
  </>}</main>
  {active&&card&&<BoulderControls scorecardId={scorecardId} boulder={active} readOnly={card.eventStatus!=='open'} onClose={()=>setSelected(null)} refresh={refresh} onSaved={onSaved}/>}
  </Shell>;
}

function HistoryList({records}:{records:AttemptRecord[]}) { return <div className="history" data-testid="list-scorecard-history">{records.map(r=><div className="history-item" key={r.id} data-testid={`history-record-${r.id}`}><strong>Boulder {r.boulderNumber} · {r.completed?'topped':'attempted'}</strong><p className="muted" style={{margin:'5px 0'}}>{r.attempts} {r.attempts===1?'attempt':'attempts'} · {r.actorName} ({r.actorRole})</p><span className="mono" style={{fontSize:10,color:'#6b6b6b'}}>{new Date(r.createdAt).toLocaleString()}</span>{r.previousRecordId&&<span className="muted"> · correction</span>}</div>)}</div>;}

function Results({eventId}:{eventId:string}) {
 const q=useGetPublicResults(eventId,{query:{queryKey:getGetPublicResultsQueryKey(eventId),refetchInterval:10000}});
 return <Shell><main className="page">{q.isLoading?<Busy label="Checking final results"/>:q.isError||!q.data||!q.data.event.resultsReleased?<div className="panel" data-testid="results-unreleased"><h1 className="page-title">Results not yet released</h1><Link className="btn" href="/" data-testid="link-back-events">Back to events</Link></div>:<><span className="eyebrow">Final results</span><h1 className="page-title">{q.data.event.name}</h1><p className="muted">Final results · {q.data.event.eventDate?new Date(q.data.event.eventDate).toLocaleDateString():''} · <Link href="/series" data-testid="link-results-series">Series progress</Link></p>
    <UncategorizedNote count={q.data.uncategorizedCount}/>
    <h2 className="sub-head">Squad standings</h2>
    <SquadStandings squads={q.data.squads}/>
    <h2 className="sub-head">Category podiums</h2>
    <CategoryPodiums podiums={q.data.podiums}/>
    <h2 className="sub-head">All climbers</h2>
    <div className="table-wrap"><table><thead><tr><th>Place</th><th>Climber</th><th>Squad</th><th>Age</th><th>Gender</th><th>Score</th><th>Tops</th><th>Attempts</th></tr></thead><tbody>{q.data.results.map(r=><tr key={`${r.rank}-${r.climberName}`} data-testid={`row-result-${r.rank}`}><td className="mono">#{r.rank}</td><td><strong>{r.climberName}</strong></td><td>{r.squad}</td><td>{bracketLabel(r.ageBracket)}</td><td>{genderLabel(r.gender)}</td><td className="mono">{r.totalPoints.toLocaleString()}</td><td>{r.completedCount}</td><td>{r.attemptCount}</td></tr>)}</tbody></table></div></>}</main></Shell>;
}

function MyScorecards() {
  const { isSignedIn, isLoaded } = useUser();
  const account = useGetMyAccount({ query: { queryKey: getGetMyAccountQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const cards = useListMyScorecards({ query: { queryKey: getListMyScorecardsQueryKey(), enabled: isLoaded && !!isSignedIn, refetchInterval: 30000 } });
  if (!isLoaded) return <Shell><Busy label="Checking your account"/></Shell>;
  if (!isSignedIn) return <Shell><main className="page"><div className="panel"><span className="eyebrow">Your competition history</span><h1 className="page-title">Sign in to see your scorecards.</h1><p className="muted">Sign in with the email address used on the scorecard. Scorecards linked to that address appear here.</p><Link className="btn coral" href="/sign-in" data-testid="link-scorecards-signin">Sign in</Link></div></main></Shell>;
  return <Shell><main className="page"><div className="section-head"><div><h1 className="page-title">My scorecards</h1></div>{account.data?.role==='admin'&&<Link className="btn outline" href="/admin" data-testid="link-organizer-dashboard">Organizer dashboard <ArrowRight size={15}/></Link>}</div>{cards.isLoading?<div className="panel">Finding scorecards linked to your account…</div>:cards.isError?<Failure retry={()=>cards.refetch()}/>:!cards.data?.length?<div className="empty" data-testid="empty-my-scorecards"><Mountain size={28}/><p>No scorecards are linked to this email address.</p><Link className="btn" href="/" data-testid="link-browse-events">Open events</Link></div>:<div className="event-grid">{cards.data.map(card=><article className="event-card" key={card.id} data-testid={`card-my-scorecard-${card.id}`}><div><Status value={card.eventStatus}/><h3>{card.eventName}</h3><p>{card.climberName} · {card.squad} · {bracketLabel(card.ageBracket)} · {genderLabel(card.gender)}</p><div className="score-sub">{card.totalPoints} points · {card.completedCount} completed</div></div><div className="tool-row"><Link className="btn small" href={`/scorecard/${card.id}`} data-testid={`link-open-scorecard-${card.id}`}>Open scorecard <ArrowRight size={14}/></Link><Link className="btn outline small" href={`/results/${card.eventId}`} data-testid={`link-scorecard-results-${card.id}`}>Results</Link></div></article>)}</div>}</main></Shell>;
}

function AdminGuard({children}:{children:ReactNode}) {
 const {isSignedIn,isLoaded}=useUser();const account=useGetMyAccount({query:{queryKey:getGetMyAccountQueryKey(),enabled:!!isSignedIn&&isLoaded}});
 if(!isLoaded||isSignedIn&&account.isLoading)return <div className="shell"><div className="wrap"><Busy label="Checking organizer access"/></div></div>;
 if(!isSignedIn)return <Shell><div className="page panel"><span className="eyebrow">Organizer access</span><h1 className="page-title">Sign in to continue.</h1><p className="muted">Event controls are reserved for LCC Intersquad Comp Series organizers.</p><Link href="/sign-in" className="btn">Sign in</Link></div></Shell>;
 if(account.data?.role!=='admin')return <Shell><div className="page panel"><span className="eyebrow">Not an organizer account</span><h1 className="page-title">This area is for event admins.</h1><p className="muted">Your competitor scorecards remain available from their direct links.</p><Link href="/" className="btn">Back to events</Link></div></Shell>;
 return <>{children}</>;
}
function AdminLayout({children,title}:{children:ReactNode,title:string}) {
 const {user}=useUser();const {signOut}=useClerk();
 return <div className="admin-shell"><aside className="admin-side"><Logo/><Link href="/admin" className="side-link" data-testid="link-admin-events"><Activity size={16} style={{verticalAlign:'middle',marginRight:8}}/>Events</Link><Link href="/admin/users" className="side-link" data-testid="link-admin-users"><Users size={16} style={{verticalAlign:'middle',marginRight:8}}/>Accounts</Link><Link href="/series" className="side-link" data-testid="link-admin-series"><Trophy size={16} style={{verticalAlign:'middle',marginRight:8}}/>Series</Link><div style={{marginTop:'auto',borderTop:'1px solid #ffffff22',paddingTop:16,fontSize:12,color:'#d0d0d0'}}>{user?.fullName||user?.username}<button className="side-link" onClick={()=>signOut({redirectUrl:basePath||'/'})} data-testid="button-admin-signout">Sign out</button></div></aside><main className="admin-main"><div className="admin-top"><h1>{title}</h1><Link href="/" className="btn outline small" data-testid="link-public-site">Public site <ExternalLink size={14}/></Link></div>{children}</main></div>;
}
function AdminHome() {
 const q=useListAdminEvents({query:{queryKey:getListAdminEventsQueryKey()}});const create=useCreateEvent();const [show,setShow]=useState(false);const [name,setName]=useState('');const [date,setDate]=useState('');const [points,setPoints]=useState([10,7,4,1]);
 const save=(e:FormEvent)=>{e.preventDefault();const data:EventInput={name:name.trim(),eventDate:date||null,pointsByAttempts:points.map(Number)};create.mutate({data},{onSuccess:()=>{queryClient.invalidateQueries({queryKey:getListAdminEventsQueryKey()});setShow(false);setName('')}})};
 return <AdminGuard><AdminLayout title="Event overview"><div className="tool-row" style={{justifyContent:'space-between',marginBottom:18}}><div><span className="eyebrow">Events</span></div><button className="btn coral" onClick={()=>setShow(!show)} data-testid="button-new-event"><Plus size={16}/> New event</button></div>
 {show&&<form className="panel form-grid" onSubmit={save} style={{marginBottom:20}} data-testid="form-create-event"><div className="field full"><label>Event name</label><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} data-testid="input-event-name"/></div><div className="field"><label>Event date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} data-testid="input-event-date"/></div><div className="field full"><label>Points by attempts · 1 / 2 / 3 / 4</label><div className="tool-row">{points.map((p,i)=><input key={i} aria-label={`Points for attempt ${i+1}`} type="number" min="0" value={p} onChange={e=>setPoints(points.map((n,j)=>j===i?Number(e.target.value):n))} style={{width:85}} data-testid={`input-points-${i+1}`}/>)}</div></div><div className="field full tool-row"><button className="btn" disabled={create.isPending} data-testid="button-save-event">Create draft</button><button className="btn outline" type="button" onClick={()=>setShow(false)} data-testid="button-cancel-event">Cancel</button>{create.isError&&<span role="alert">Event could not be created.</span>}</div></form>}
 {q.isLoading?<div className="panel">Loading your events…</div>:q.isError?<Failure retry={()=>q.refetch()}/>:!q.data?.length?<div className="empty" data-testid="empty-admin-events">No events yet.</div>:<div className="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Boulders</th><th>Controls</th></tr></thead><tbody>{q.data.map(e=><tr key={e.id} data-testid={`row-admin-event-${e.id}`}><td><strong>{e.name}</strong></td><td>{e.eventDate?new Date(e.eventDate).toLocaleDateString():'Date TBD'}</td><td><Status value={e.status}/></td><td>{e.boulderCount}</td><td><Link className="btn small" href={`/admin/events/${e.id}`} data-testid={`link-manage-event-${e.id}`}>Manage <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>}</AdminLayout></AdminGuard>;
}
function AdminEvent({eventId}:{eventId:string}) {
 const q=useGetEventMonitor(eventId,{query:{queryKey:getGetEventMonitorQueryKey(eventId),refetchInterval:5000}});const cards=useListEventScorecards(eventId,{query:{queryKey:getListEventScorecardsQueryKey(eventId),refetchInterval:10000}});const status=useUpdateEventStatus();const release=useReleaseEventResults();const update=useUpdateEvent();const [editing,setEditing]=useState(false);const [name,setName]=useState('');const [date,setDate]=useState('');const [pts,setPts]=useState<number[]>([]);const [copied,setCopied]=useState(false);const scorecardUrl=`${window.location.origin}${basePath}/event/${eventId}`;const copyScorecardUrl=()=>{void navigator.clipboard.writeText(scorecardUrl).then(()=>{setCopied(true);window.setTimeout(()=>setCopied(false),1800)})};
 useEffect(()=>{if(q.data){setName(q.data.event.name);setDate(q.data.event.eventDate?new Date(q.data.event.eventDate).toISOString().slice(0,10):'');setPts(q.data.event.pointsByAttempts)}},[q.data?.event.id]);
 const ev=q.data?.event;
 return <AdminGuard><AdminLayout title={ev?.name||'Event control'}>
 {q.isLoading ? <div className="panel">Loading live monitor…</div> : q.isError || !q.data ? <Failure retry={()=>q.refetch()}/> : <>
  <span className="eyebrow">Event monitor</span>
  <div className="stat-row">
   <div className="stat"><span>REGISTERED CLIMBERS</span><strong>{q.data.scorecardCount}</strong></div>
   <div className="stat"><span>LOGGED ATTEMPTS</span><strong>{q.data.totalAttempts}</strong></div>
   <div className="stat"><span>EVENT STATUS</span><Status value={ev!.status}/></div>
  </div>
  <div className="panel" style={{marginBottom:18}}>
   <div className="qr-panel">
    <div><span className="eyebrow">Event scorecard QR</span><p className="muted">Opens scorecard setup for this event while it is open. No account needed.</p><a className="qr-url" href={scorecardUrl}>{scorecardUrl}</a><button className="btn outline small" onClick={copyScorecardUrl}><Copy size={14}/>{copied?'Copied':'Copy event link'}</button></div>
    <QRCodeSVG value={scorecardUrl} size={144} marginSize={4} level="H"/>
   </div>
   <div className="tool-row">
    <button className="btn small" disabled={status.isPending||ev!.resultsReleased} onClick={()=>status.mutate({eventId,data:{status:ev!.status==='open'?'closed':'open'}},{onSuccess:()=>queryClient.invalidateQueries()})}>{ev!.status==='open'?'Close event':'Open event'}</button>
    <button className="btn outline small" disabled={ev!.resultsReleased} onClick={()=>setEditing(!editing)}>Edit setup</button>
    <button className="btn coral small" disabled={ev!.resultsReleased||ev!.status!=='closed'||release.isPending} onClick={()=>{if(window.confirm('Release these results publicly? Competitor scoring stays closed. Admin corrections will update the public results.'))release.mutate({eventId},{onSuccess:()=>queryClient.invalidateQueries()})}}>{ev!.resultsReleased?'Results released':'Release final results'}</button>
    <Link href={`/results/${eventId}`} className="btn outline small">View public results</Link>
   </div>
   {(status.isError||release.isError||update.isError)&&<p role="alert">The change could not be saved. Please retry.</p>}
   {editing&&<div className="form-grid" style={{marginTop:17}}>
    <div className="field full"><label htmlFor="edit-event-name">Event name</label><input id="edit-event-name" value={name} onChange={e=>setName(e.target.value)}/></div>
    <div className="field"><label htmlFor="edit-event-date">Event date</label><input id="edit-event-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
    <div className="field full"><label>Points by attempts</label><div className="tool-row">
     {pts.map((n,i)=><input key={i} aria-label={`Points for attempt ${i+1}`} type="number" min="0" value={n} onChange={e=>setPts(pts.map((v,j)=>i===j?Number(e.target.value):v))} style={{width:75}}/>)}
    </div></div>
   </div>}
  </div>
  {editing&&<div className="tool-row" style={{marginBottom:18}}><button className="btn small" disabled={update.isPending} onClick={()=>update.mutate({eventId,data:{name,eventDate:date||null,pointsByAttempts:pts}},{onSuccess:()=>{queryClient.invalidateQueries({queryKey:getGetEventMonitorQueryKey(eventId)});queryClient.invalidateQueries({queryKey:getListAdminEventsQueryKey()});queryClient.invalidateQueries({queryKey:getGetPublicEventQueryKey(eventId)});queryClient.invalidateQueries({queryKey:getListEventScorecardsQueryKey(eventId)});setEditing(false)}})} data-testid="button-save-event-edits">Save setup</button><button className="btn outline small" onClick={()=>setEditing(false)}>Cancel</button></div>}
  <div className="section-head"><div><span className="eyebrow">{ev!.resultsReleased?'Published results':'Live, not public'}</span><h2>Squad standings</h2></div></div>
  <SquadStandings squads={q.data.squads}/>
  <div className="section-head"><div><span className="eyebrow">Scorecards</span><h2>Standings</h2></div><span className="muted">Refreshes automatically</span></div>{cards.isLoading?<div className="panel">Updating scorecards…</div>:cards.isError?<Failure retry={()=>cards.refetch()}/>:!cards.data?.length?<div className="empty">No scorecards yet.</div>:<div className="table-wrap"><table><thead><tr><th>Climber</th><th>Squad</th><th>Age</th><th>Gender</th><th>Score</th><th>Tops</th><th>Attempts</th><th></th></tr></thead><tbody>{[...cards.data].sort((a,b)=>b.totalPoints-a.totalPoints).map(c=><tr key={c.id} data-testid={`row-live-card-${c.id}`}><td><strong>{c.climberName}</strong></td><td>{c.squad}</td><td>{bracketLabel(c.ageBracket)}</td><td>{genderLabel(c.gender)}</td><td className="mono">{c.totalPoints}</td><td>{c.completedCount}</td><td>{c.attemptCount}</td><td><Link className="btn small" href={`/admin/scorecards/${c.id}`} data-testid={`link-inspect-card-${c.id}`}>Inspect</Link></td></tr>)}</tbody></table></div>}</>}</AdminLayout></AdminGuard>;
}
function AdminCard({scorecardId}:{scorecardId:string}) {
  const q=useGetAdminScorecard(scorecardId,{query:{queryKey:getGetAdminScorecardQueryKey(scorecardId)}});
  const [selected,setSelected]=useState<number|null>(null);
  const card=q.data?.scorecard;
  const active=card?.boulders.find(b=>b.boulderNumber===selected)??null;
  const refresh=()=>Promise.all([
    queryClient.invalidateQueries({queryKey:getGetAdminScorecardQueryKey(scorecardId)}),
    queryClient.invalidateQueries({queryKey:getGetScorecardQueryKey(scorecardId)}),
    queryClient.invalidateQueries({queryKey:getGetScorecardHistoryQueryKey(scorecardId)}),
    queryClient.invalidateQueries({queryKey:getGetSeriesProgressQueryKey()}),
    ...(card?[
      queryClient.invalidateQueries({queryKey:getGetEventMonitorQueryKey(card.eventId)}),
      queryClient.invalidateQueries({queryKey:getListEventScorecardsQueryKey(card.eventId)}),
      queryClient.invalidateQueries({queryKey:getGetPublicResultsQueryKey(card.eventId)}),
    ]:[]),
  ]);
  return <AdminGuard><AdminLayout title="Scorecard inspection">
    {q.isLoading?<div className="panel">Loading scorecard…</div>:q.isError||!card?<Failure retry={()=>q.refetch()}/>:<>
      <span className="eyebrow">Organizer corrections</span>
      {card.eventStatus==='closed'&&<p className="muted">Scoring is closed for competitors. Admin corrections remain available and update any published results.</p>}
      <h2 className="display" style={{fontSize:26}}>{card.climberName} · {card.totalPoints} pts</h2>
      <p className="muted">
        {card.eventName} · {card.squad} · <span data-testid="text-admin-age-bracket">{bracketLabel(card.ageBracket)}</span> · <span data-testid="text-admin-gender">{genderLabel(card.gender)}</span>
        {card.birthYear!=null&&<> · born {card.birthYear}</>}
        {card.loggerName&&<> · Supervisor: {card.loggerName}</>}
      </p>
      <div style={{marginTop:18}}><BoulderGrid boulders={card.boulders} onSelect={setSelected} prefix="button-admin-revise"/></div>
      <h2 className="display" style={{fontSize:22,marginTop:32}}>Correction history</h2>
      {q.data?.history.length?<HistoryList records={q.data.history}/>:<div className="empty">No score changes recorded yet.</div>}
    </>}
  </AdminLayout>
  {active&&<BoulderControls scorecardId={scorecardId} boulder={active} readOnly={false} correctionMode onClose={()=>setSelected(null)} refresh={refresh}/>}
  </AdminGuard>;
}

function AdminUsers() {
 const q=useListAdminUsers({query:{queryKey:getListAdminUsersQueryKey()}});const change=useUpdateAccountRole();
 return <AdminGuard><AdminLayout title="Accounts & roles"><p className="muted">Assign organizer access.</p>{q.isLoading?<div className="panel">Loading account list…</div>:q.isError?<Failure retry={()=>q.refetch()}/>:<div className="table-wrap" style={{marginTop:20}}><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th></tr></thead><tbody>{q.data?.map(u=><tr key={u.clerkUserId} data-testid={`row-account-${u.clerkUserId}`}><td><strong>{u.displayName}</strong></td><td>{u.email||'—'}</td><td><span className="mono">{u.role}</span></td><td><button className={`btn small ${u.role==='admin'?'outline':''}`} disabled={change.isPending} onClick={()=>change.mutate({clerkUserId:u.clerkUserId,data:{role:u.role==='admin'?'competitor':'admin'}},{onSuccess:()=>{queryClient.invalidateQueries({queryKey:getListAdminUsersQueryKey()});queryClient.invalidateQueries({queryKey:getGetMyAccountQueryKey()})}})} data-testid={`button-role-${u.clerkUserId}`}>{u.role==='admin'?'Remove organizer':'Make organizer'}</button></td></tr>)}</tbody></table></div>}</AdminLayout></AdminGuard>;
}
function ClerkQueryClientCacheInvalidator() {
 const { addListener } = useClerk(); const client = useQueryClient(); const previous = useRef<string|null|undefined>(undefined);
 useEffect(()=>{const off=addListener(({user})=>{const id=user?.id??null;if(previous.current!==undefined&&previous.current!==id)client.clear();previous.current=id;});return off;},[addListener,client]);
 return null;
}
function HomeRedirect(){return <Home/>}
function SignInPage(){return <div className="shell" style={{display:'grid',placeItems:'center',padding:20}}><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}/></div>}
function SignUpPage(){return <div className="shell" style={{display:'grid',placeItems:'center',padding:20}}><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`}/></div>}
function ClerkRoutes(){
 const [,setLocation]=useLocation();
 return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{signIn:{start:{title:'Welcome back',subtitle:'Sign in to LCC Intersquad Comp Series'}},signUp:{start:{title:'Create an account',subtitle:'Use the email address on your scorecard'}}}} routerPush={to=>setLocation(stripBase(to))} routerReplace={to=>setLocation(stripBase(to),{replace:true})}>
   <QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator/><AccountSync/><Switch>
    <Route path="/" component={HomeRedirect}/><Route path="/sign-in/*?" component={SignInPage}/><Route path="/sign-up/*?" component={SignUpPage}/><Route path="/my-scorecards" component={MyScorecards}/><Route path="/series" component={SeriesPage}/>
    <Route path="/event/:eventId">{params=><Register eventId={params.eventId}/>}</Route><Route path="/scorecard/:scorecardId">{params=><Scorecard scorecardId={params.scorecardId}/>}</Route><Route path="/results/:eventId">{params=><Results eventId={params.eventId}/>}</Route>
    <Route path="/admin" component={AdminHome}/><Route path="/admin/events/:eventId">{params=><AdminEvent eventId={params.eventId}/>}</Route><Route path="/admin/scorecards/:scorecardId">{params=><AdminCard scorecardId={params.scorecardId}/>}</Route><Route path="/admin/users" component={AdminUsers}/>
    <Route><Shell><main className="page"><div className="panel"><h1 className="page-title">Page not found</h1><Link href="/" className="btn">Back to events</Link></div></main></Shell></Route>
   </Switch></QueryClientProvider>
 </ClerkProvider>;
}
function App() { if(!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file'); return <WouterRouter base={basePath}><ClerkRoutes/></WouterRouter>; }
export default App;
