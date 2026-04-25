export const sampleEvent = {
  id: 'evt-1',
  title: 'Test Event',
  start_datetime: '2023-01-01T00:00:00Z',
  end_datetime: '2023-02-01T00:00:00Z',
  city: 'Addis Ababa',
  status: 'published',
  ticket_types: [
    { name: 'General', capacity: 10, remaining_quantity: 7, price: 100 },
  ],
};

export const sampleAnalytics = {
  total_views: 123,
  total_tickets_sold: 3,
  total_revenue: 300,
  check_in_rate: 80,
  average_rating: 4.5,
  ticket_distribution: [
    { name: 'General', price: 100, value: 3, revenue: 300, capacity: 10 },
  ],
  daily_sales: [
    { date: '2023-01-01', sales: 1, revenue: 100 },
    { date: '2023-01-02', sales: 2, revenue: 200 },
  ],
  hourly_checkins: [
    { hour: '09', count: 1 },
    { hour: '10', count: 2 },
  ],
  recent_reviews: [
    { id: 'r1', user: 'Alice', rating: 5, comment: 'Great', date: '2023-01-02' },
  ],
};
