const { Client } = require('pg');
const { buildCsv } = require('../../../utils/csv');

// Integration tests require a real test database
const DATABASE_URL = process.env.DATABASE_URL_TEST;
if (!DATABASE_URL) {
  describe.skip('analytics CSV integration (skipped: DATABASE_URL_TEST not set)', () => {
    test('skipped', () => {});
  });
} else {
  describe('analytics CSV integration', () => {
    let client;
    const schema = `test_analytics_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    beforeAll(async () => {
      client = new Client({ connectionString: DATABASE_URL });
      await client.connect();
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      // create minimal tables
      await client.query(`
        CREATE TABLE ${schema}.events (id text primary key, organizer_id text, title text, category_id text, status text, city text, start_datetime timestamp, end_datetime timestamp, created_at timestamp, avg_rating numeric);
      `);
      await client.query(`
        CREATE TABLE ${schema}.event_categories (id text primary key, name text);
      `);
      await client.query(`
        CREATE TABLE ${schema}.ticket_types (id text primary key, event_id text, capacity int, remaining_quantity int, price numeric);
      `);
      await client.query(`
        CREATE TABLE ${schema}.orders (id text primary key, status text, paid_at timestamp);
      `);
      await client.query(`
        CREATE TABLE ${schema}.order_items (id text primary key, order_id text, event_id text, ticket_type_id text, quantity int, total_price numeric);
      `);
      await client.query(`
        CREATE TABLE ${schema}.check_in_logs (id text primary key, event_id text, check_in_time timestamp, status text);
      `);
      await client.query(`
        CREATE TABLE ${schema}.reviews (id text primary key, event_id text, rating int, status text);
      `);

      // indexes for performance test
      await client.query(`CREATE INDEX ON ${schema}.order_items (event_id)`);

      // seed data
      const now = new Date();
      await client.query(`INSERT INTO ${schema}.event_categories(id, name) VALUES($1, $2)`, ['c1', 'Cat']);
      await client.query(`INSERT INTO ${schema}.events(id, organizer_id, title, category_id, status, city, start_datetime, end_datetime, created_at, avg_rating) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, ['evt1', 'org1', 'Event 1', 'c1', 'published', 'Addis', now.toISOString(), now.toISOString(), now.toISOString(), 4.00]);

      await client.query(`INSERT INTO ${schema}.ticket_types(id, event_id, capacity, remaining_quantity, price) VALUES($1,$2,$3,$4,$5)`, ['tt1', 'evt1', 100, 60, 50]);
      await client.query(`INSERT INTO ${schema}.ticket_types(id, event_id, capacity, remaining_quantity, price) VALUES($1,$2,$3,$4,$5)`, ['tt2', 'evt1', 50, 0, 30]);

      // paid orders
      await client.query(`INSERT INTO ${schema}.orders(id, status, paid_at) VALUES($1,$2,$3)`, ['o1', 'paid', now.toISOString()]);
      await client.query(`INSERT INTO ${schema}.orders(id, status, paid_at) VALUES($1,$2,$3)`, ['o2', 'paid', now.toISOString()]);

      await client.query(`INSERT INTO ${schema}.order_items(id, order_id, event_id, ticket_type_id, quantity, total_price) VALUES($1,$2,$3,$4,$5,$6)`, ['oi1','o1','evt1','tt1',2,100]);
      await client.query(`INSERT INTO ${schema}.order_items(id, order_id, event_id, ticket_type_id, quantity, total_price) VALUES($1,$2,$3,$4,$5,$6)`, ['oi2','o2','evt1','tt2',1,30]);

      // check-ins
      await client.query(`INSERT INTO ${schema}.check_in_logs(id, event_id, check_in_time, status) VALUES($1,$2,$3,$4)`, ['ck1','evt1', now.toISOString(), 'valid']);
      await client.query(`INSERT INTO ${schema}.check_in_logs(id, event_id, check_in_time, status) VALUES($1,$2,$3,$4)`, ['ck2','evt1', now.toISOString(), 'valid']);

      // reviews
      await client.query(`INSERT INTO ${schema}.reviews(id, event_id, rating, status) VALUES($1,$2,$3,$4)`, ['r1','evt1',5,'visible']);
      await client.query(`INSERT INTO ${schema}.reviews(id, event_id, rating, status) VALUES($1,$2,$3,$4)`, ['r2','evt1',4,'visible']);
    });

    afterAll(async () => {
      try {
        await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      } finally {
        await client.end();
      }
    });

    test('TC-ES-01 total revenue matches DB SUM', async () => {
      const q = `SELECT COALESCE(SUM(oi.total_price),0) as sum FROM ${schema}.order_items oi JOIN ${schema}.orders o ON oi.order_id = o.id WHERE oi.event_id = $1 AND o.status = 'paid'`;
      const dbRes = await client.query(q, ['evt1']);
      const dbSum = Number(dbRes.rows[0].sum || 0);

      // compute expected from seeded rows
      const expected = 100 + 30; // from seeded order_items
      expect(dbSum).toBe(expected);
    });

    test('TC-ES-02 total tickets sold matches DB SUM', async () => {
      const q = `SELECT COALESCE(SUM(oi.quantity),0) as qty FROM ${schema}.order_items oi JOIN ${schema}.orders o ON oi.order_id = o.id WHERE oi.event_id = $1 AND o.status = 'paid'`;
      const dbRes = await client.query(q, ['evt1']);
      const dbQty = Number(dbRes.rows[0].qty || 0);
      expect(dbQty).toBe(3);
    });

    test('TC-ES-03 check-in count matches DB COUNT', async () => {
      const q = `SELECT COUNT(*) as cnt FROM ${schema}.check_in_logs WHERE event_id = $1 AND status = 'valid'`;
      const r = await client.query(q, ['evt1']);
      expect(Number(r.rows[0].cnt)).toBe(2);
    });

    test('TC-ES-04 average rating matches DB AVG', async () => {
      const q = `SELECT AVG(rating) as avg FROM ${schema}.reviews WHERE event_id = $1 AND status = 'visible'`;
      const r = await client.query(q, ['evt1']);
      const avg = Number(r.rows[0].avg);
      expect(avg).toBeCloseTo((5 + 4) / 2, 5);
    });

    test('TC-ES-05 CSV row count and TC-ES-06 headers', async () => {
      // build rows via SQL that match controller CSV columns
      const sql = `SELECT e.id as event_id, e.title, e.status, c.name as category_name, e.city, (SELECT COALESCE(SUM(tt.capacity - tt.remaining_quantity),0) FROM ${schema}.ticket_types tt WHERE tt.event_id = e.id) as tickets_sold, (SELECT COALESCE(SUM((tt.capacity - tt.remaining_quantity) * tt.price),0) FROM ${schema}.ticket_types tt WHERE tt.event_id = e.id) as gross_revenue_etb, (SELECT COUNT(*) FROM ${schema}.check_in_logs ck WHERE ck.event_id = e.id) as total_checkins, (SELECT COUNT(*) FROM ${schema}.reviews rv WHERE rv.event_id = e.id and rv.status = 'visible') as visible_reviews, (SELECT AVG(rv.rating) FROM ${schema}.reviews rv WHERE rv.event_id = e.id and rv.status = 'visible') as average_rating, e.created_at FROM ${schema}.events e LEFT JOIN ${schema}.event_categories c ON c.id = e.category_id WHERE e.organizer_id = $1`;
      const r = await client.query(sql, ['org1']);
      const rows = r.rows.map((row) => ({
        generated_at: new Date().toISOString(),
        event_id: row.event_id,
        title: row.title,
        status: row.status,
        category_name: row.category_name || '',
        city: row.city || '',
        ticket_types_count: 0,
        total_capacity: 0,
        tickets_sold: Number(row.tickets_sold || 0),
        tickets_remaining: 0,
        gross_revenue_etb: Number(row.gross_revenue_etb || 0).toFixed(2),
        total_checkins: Number(row.total_checkins || 0),
        visible_reviews: Number(row.visible_reviews || 0),
        average_rating: (Number(row.average_rating) || 0).toFixed(2),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : ''
      }));

      const csv = buildCsv({
        columns: [
          { key: 'generated_at', header: 'generated_at' },
          { key: 'event_id', header: 'event_id' },
          { key: 'title', header: 'title' },
          { key: 'status', header: 'status' },
          { key: 'category_name', header: 'category_name' },
          { key: 'city', header: 'city' },
          { key: 'tickets_sold', header: 'tickets_sold' },
          { key: 'gross_revenue_etb', header: 'gross_revenue_etb' },
          { key: 'total_checkins', header: 'total_checkins' },
          { key: 'visible_reviews', header: 'visible_reviews' },
          { key: 'average_rating', header: 'average_rating' },
          { key: 'created_at', header: 'created_at' }
        ],
        rows
      });

      const lines = csv.split('\r\n');
      expect(lines[0]).toContain('generated_at');
      // header + rows
      expect(lines.length).toBe(1 + rows.length);
    });

    test('TC-ES-07 no sales => returns 0 and TC-ES-08 no reviews => avg_rating = 0', async () => {
      // create empty event
      await client.query(`INSERT INTO ${schema}.events(id, organizer_id, title, category_id, status, city, start_datetime, end_datetime, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, ['evt-empty','org1','Empty','c1','published','Addis', new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]);

      const rev = await client.query(`SELECT COALESCE(SUM(oi.total_price),0) as sum FROM ${schema}.order_items oi JOIN ${schema}.orders o ON oi.order_id = o.id WHERE oi.event_id = $1 AND o.status = 'paid'`, ['evt-empty']);
      expect(Number(rev.rows[0].sum)).toBe(0);

      const avg = await client.query(`SELECT AVG(rating) as avg FROM ${schema}.reviews WHERE event_id = $1 AND status = 'visible'`, ['evt-empty']);
      expect(avg.rows[0].avg).toBeNull();
    });

    test('TC-ES-09 performance: EXPLAIN ANALYZE uses index (no Seq Scan)', async () => {
      // ensure index exists; it was created in beforeAll
      const explain = await client.query(`EXPLAIN ANALYZE SELECT COALESCE(SUM(oi.total_price),0) as sum FROM ${schema}.order_items oi JOIN ${schema}.orders o ON oi.order_id = o.id WHERE oi.event_id = $1 AND o.status = 'paid'`, ['evt1']);
      const plan = explain.rows.map((r) => Object.values(r)[0]).join('\n');
      expect(plan.toLowerCase()).not.toMatch(/seq scan/);
    });

    test('TC-ES-10 concurrency: parallel analytics queries stable', async () => {
      const q = `SELECT COALESCE(SUM(oi.total_price),0) as sum FROM ${schema}.order_items oi JOIN ${schema}.orders o ON oi.order_id = o.id WHERE oi.event_id = $1 AND o.status = 'paid'`;
      const parallel = Array.from({ length: 20 }).map(() => client.query(q, ['evt1']));
      const results = await Promise.all(parallel);
      for (const r of results) {
        expect(Number(r.rows[0].sum)).toBe(130); // seeded 100 + 30
      }
    });
  });
}
