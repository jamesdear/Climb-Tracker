import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Logo() {
  return (
    <Link href="/" className="brand" data-testid="link-home">
      <img className="brand-logo" src={`${basePath}/lcc-logo.svg`} alt="London Climbing Centres"/>
      <span className="brand-name"><span>Intersquad</span><span>Comp Series</span></span>
    </Link>
  );
}
export function Shell({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  return <div className="shell"><div className="wrap"><header className="topbar"><Logo/><nav className="navlinks"><Link href="/" data-testid="link-events">Events</Link><Link href="/series" data-testid="link-series">Series</Link>{isSignedIn?<><Link href="/my-scorecards" data-testid="link-my-scorecards">My scorecards</Link><button className="nav-button" onClick={()=>signOut({redirectUrl:basePath||'/'})} data-testid="button-signout">Sign out</button></>:<Link href="/sign-in" data-testid="link-signin">Sign in</Link>}</nav></header>{children}<footer className="footer"><span className="mono">LCC INTERSQUAD COMP SERIES</span></footer></div></div>;
}
export function Status({ value }: { value: string }) { return <span className={`status ${value}`} data-testid={`status-${value}`}>{value}</span>; }
export function Busy({ label='Loading event details' }: {label?:string}) { return <div className="page"><div className="panel"><span className="eyebrow">One moment</span><div style={{height:12}}/><div className="muted" data-testid="loading-state">{label}…</div></div></div>; }
export function Failure({ retry }: {retry:()=>void}) { return <div className="empty" data-testid="error-state"><strong>Could not load this page.</strong><p>Please try again.</p><button className="btn small" onClick={retry} data-testid="button-retry">Try again</button></div>; }
