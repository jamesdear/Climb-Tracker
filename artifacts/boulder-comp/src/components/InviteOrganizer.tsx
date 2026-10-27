import { useState } from 'react';
import { useInviteOrganizer } from '@workspace/api-client-react';

export function InviteOrganizer() {
  const [email, setEmail] = useState('');
  const invite = useInviteOrganizer();
  const error = invite.error as { data?: { error?: string } } | null;
  return <section className="panel" style={{ marginBottom: 24 }}>
    <h2 className="sub-head">Invite organizer by email</h2>
    <p className="muted">For a new account. They’ll receive a seven-day invitation and get organizer access after signing up with the verified invited email. For an existing account, use Make organizer below.</p>
    <form onSubmit={e => {
      e.preventDefault();
      invite.mutate({ data: { email: email.trim() } }, { onSuccess: () => setEmail('') });
    }}>
      <div className="field">
        <label htmlFor="organizer-email">Email address</label>
        <input id="organizer-email" data-testid="input-organizer-email" type="email" required maxLength={254}
          value={email} disabled={invite.isPending} onChange={e => { setEmail(e.target.value); invite.reset(); }} />
      </div>
      <button className="btn" style={{ marginTop: 12 }} disabled={invite.isPending} data-testid="button-invite-organizer">
        {invite.isPending ? 'Sending invitation…' : 'Send organizer invitation'}
      </button>
      {invite.isSuccess && <p role="status">{invite.data.message}</p>}
      {invite.isError && <p role="alert" className="form-error">{error?.data?.error || 'Could not send the invitation. Please try again.'}</p>}
    </form>
  </section>;
}
