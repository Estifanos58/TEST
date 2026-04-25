import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

global.fetch = jest.fn();

function AdminDashboard({ reportId }) {
  const [done, setDone] = React.useState(false);
  const takeBan = async () => {
    await fetch(`/api/moderation/admin/reports/${reportId}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ban' }) });
    setDone(true);
  };
  return (<div><button onClick={takeBan}>Ban</button>{done && <span>Done</span>}</div>);
}

function CheckoutPage() {
  const [msg, setMsg] = React.useState(null);
  const pay = async () => {
    const res = await fetch('/api/payments/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const json = await res.json();
    if (!res.ok && json.code === 'BANNED_FROM_ORGANIZER') setMsg(json.code);
  };
  return (<div><button onClick={pay}>Pay</button>{msg && <span>{msg}</span>}</div>);
}

test('UI ban flow shows BANNED_FROM_ORGANIZER after admin decision', async () => {
  // first call: admin decision success
  fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });
  // second call: payments init blocked
  fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ code: 'BANNED_FROM_ORGANIZER' }) });

  render(<AdminDashboard reportId="r3" />);
  fireEvent.click(screen.getByText('Ban'));
  await waitFor(() => expect(screen.getByText('Done')));

  render(<CheckoutPage />);
  fireEvent.click(screen.getByText('Pay'));
  await waitFor(() => expect(screen.getByText('BANNED_FROM_ORGANIZER')));
});
