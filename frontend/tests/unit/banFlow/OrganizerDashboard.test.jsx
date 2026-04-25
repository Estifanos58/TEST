import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

global.fetch = jest.fn();

function OrganizerDashboard({ reportId }) {
  const [msg, setMsg] = React.useState(null);
  const resolve = async () => {
    const res = await fetch(`/api/moderation/organizer/reports/${reportId}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ban' }) });
    const json = await res.json();
    setMsg(json.success ? 'Resolved' : 'Failed');
  };
  return (<div><button onClick={resolve}>Resolve</button>{msg && <span>{msg}</span>}</div>);
}

test('OrganizerDashboard calls organizer decision API and updates UI', async () => {
  fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
  render(<OrganizerDashboard reportId="r2" />);
  fireEvent.click(screen.getByText('Resolve'));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const call = fetch.mock.calls[0];
  expect(call[0]).toContain('/api/moderation/organizer/reports/r2/decision');
  expect(call[1].body).toContain('"action":"ban"');
  await screen.findByText('Resolved');
});
