import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

global.fetch = jest.fn();

function CheckoutPage() {
  const [error, setError] = React.useState(null);
  const pay = async () => {
    const res = await fetch('/api/payments/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const json = await res.json();
    if (!res.ok && json.code === 'BANNED_FROM_ORGANIZER') setError('BANNED_FROM_ORGANIZER');
  };
  return (<div><button onClick={pay}>Pay</button>{error && <span>{error}</span>}</div>);
}

test('CheckoutPage shows ban error when payment blocked', async () => {
  fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ code: 'BANNED_FROM_ORGANIZER', message: 'blocked' }) });
  render(<CheckoutPage />);
  fireEvent.click(screen.getByText('Pay'));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await screen.findByText('BANNED_FROM_ORGANIZER');
});
