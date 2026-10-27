import { useState } from 'react';
import { useInviteOrganizer } from '@workspace/api-client-react';

export function InviteOrganizer() {
  const [email, setEmail] = useState('');
  const [delivery, setDelivery] = useState<'manual' | 'email'>('manual');
  const [copyMessage, setCopyMessage] = useState('');
  const invite = useInviteOrganizer();
  const error = invite.error as { data?: { error?: string } } | null;
  return <section className="panel" style={{ marginBottom: 24 }}>
    <h2 className="sub-head">Invite organizer</h2>
    <p className="muted">Create a link for a new organizer and send it privately. It grants organizer access when they create their account. For an existing account, use Make organizer below.</p>
    <form onSubmit={e => {
      e.preventDefault();
      setCopyMessage('');
      invite.mutate({ data: { email: email.trim(), delivery } });
    }}>
      <div className="field">
        <label htmlFor="organizer-email">Email address</label>
        <input id="organizer-email" data-testid="input-organizer-email" type="email" required maxLength={254}
          value={email} disabled={invite.isPending} onChange={e => { setEmail(e.target.value); invite.reset(); setCopyMessage(''); }} />
      </div>
      <div className="field">
        <label htmlFor="invitation-delivery">Delivery</label>
        <select id="invitation-delivery" value={delivery} disabled={invite.isPending}
          onChange={e => { setDelivery(e.target.value as 'manual' | 'email'); invite.reset(); setCopyMessage(''); }}>
          <option value="manual">Copy a link — no email sent</option>
          <option value="email">Send by email</option>
        </select>
      </div>
      <button className="btn" style={{ marginTop: 12 }} disabled={invite.isPending} data-testid="button-invite-organizer">
        {invite.isPending ? 'Creating invitation…' : delivery === 'manual' ? 'Create invitation link' : 'Send organizer invitation'}
      </button>
      {invite.isSuccess && <p role="status">{invite.data.message}</p>}
      {invite.data?.invitationUrl && <div style={{ marginTop: 16 }}>
        <p>One use only. Anyone with this link can accept the invitation. Send it only to the intended organizer. Copy it before leaving this page.</p>
        <label htmlFor="organizer-invitation-link">Private invitation link</label>
        <input id="organizer-invitation-link" data-testid="organizer-invitation-link" readOnly
          value={invite.data.invitationUrl} onFocus={e => e.target.select()} style={{ width: '100%' }} />
        <button type="button" className="btn outline" style={{ marginTop: 12 }} onClick={async () => {
          try {
            await navigator.clipboard.writeText(invite.data!.invitationUrl!);
            setCopyMessage('Link copied.');
          } catch { setCopyMessage('Could not copy automatically. Select and copy the link above.'); }
        }}>Copy invitation link</button>
        {copyMessage && <p role="status">{copyMessage}</p>}
      </div>}
      {invite.isError && <p role="alert" className="form-error">{error?.data?.error || 'Could not send the invitation. Please try again.'}</p>}
    </form>
  </section>;
}
