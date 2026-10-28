import { useGetOrganizerActivity } from '@workspace/api-client-react';

function time(value: string | null, fallback = 'Not recorded') {
  return value ? new Date(value).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : fallback;
}

export function OrganizerActivity() {
  const query = useGetOrganizerActivity({ query: { refetchInterval: 30000 } });
  return <section className="panel" style={{ marginBottom: 24 }} data-testid="organizer-activity">
    <h2 className="sub-head">Organizer activity</h2>
    <p className="muted">Organizer accounts only. Updates every 30 seconds. Times are shown in your local timezone.</p>
    {query.isLoading ? <p>Loading activity…</p> : query.isError ? <div role="alert">
      <p>Could not load organizer activity.</p><button className="btn outline small" onClick={() => query.refetch()}>Try again</button>
    </div> : query.data && <>
      <h3>Invitations</h3>
      <p className="muted">Pending means signup has not been completed—not that the link has never been opened. The latest 100 invitations are shown.</p>
      {!query.data.invitations.length ? <p>No invitations recorded.</p> :
        <div className="table-wrap"><table><thead><tr><th>Email</th><th>Status</th><th>Accepted</th><th>Expires</th></tr></thead>
          <tbody>{query.data.invitations.map(i => <tr key={i.id}>
            <td style={{ overflowWrap: 'anywhere' }}>{i.email}</td><td>{i.status}</td>
            <td>{time(i.acceptedAt, i.status === 'accepted' ? 'Before acceptance tracking' : '—')}</td>
            <td>{time(i.expiresAt)}</td>
          </tr>)}</tbody></table></div>}
      <h3 style={{ marginTop: 24 }}>Last signed-in activity</h3>
      <p className="muted">Last successful authenticated request, including automatic refreshes. This does not mean someone is currently looking at the page. Earlier activity cannot be reconstructed.</p>
      {!query.data.organizers.length ? <p>No organizer accounts.</p> :
        <div className="table-wrap"><table><thead><tr><th>Organizer</th><th>Last seen</th></tr></thead><tbody>
          {query.data.organizers.map((o, index) => <tr key={`${o.email}-${index}`}>
            <td>{o.email || o.name}</td><td>{time(o.lastSeenAt, 'No activity recorded yet')}</td>
          </tr>)}
        </tbody></table></div>}
      <h3 style={{ marginTop: 24 }}>Recent actions</h3>
      <p className="muted">Latest 100 successful organizer changes since tracking began. Routine page refreshes are not listed.</p>
      {!query.data.actions.length ? <p>No organizer actions recorded yet.</p> :
        <div className="table-wrap"><table><thead><tr><th>Time</th><th>Organizer</th><th>Action</th><th>Record</th></tr></thead><tbody>
          {query.data.actions.map(a => <tr key={a.id}><td>{time(a.occurredAt)}</td><td>{a.actor}</td><td>{a.action}</td>
            <td>{a.targetId ? <code title={a.targetId}>{a.targetId.slice(0, 8)}</code> : '—'}</td></tr>)}
        </tbody></table></div>}
    </>}
  </section>;
}
