import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

global.fetch = jest.fn();

function AdminDashboard({ reportId }) {
  const [done, setDone] = React.useState(false);
  const takeBan = async () => {
    const res = await fetch(`/api/moderation/admin/reports/${reportId}/decision`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ban' })
    });
    const json = await res.json();
    if (json.success) setDone(true);
  };
  return (<div><button onClick={takeBan}>Ban</button>{done && <span>Decision applied</span>}</div>);
}

test('AdminDashboard triggers correct API call and payload', async () => {
  fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
  render(<AdminDashboard reportId="r1" />);
  fireEvent.click(screen.getByText('Ban'));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const call = fetch.mock.calls[0];
  expect(call[0]).toContain('/api/moderation/admin/reports/r1/decision');
  expect(call[1].body).toContain('"action":"ban"');
  await screen.findByText('Decision applied');
});
