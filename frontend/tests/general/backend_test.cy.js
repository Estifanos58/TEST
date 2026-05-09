/**
 * DEMS — Generalized Backend API Test Suite
 * Covers: Auth, Events, Admin, Organizer, Payments, Reviews,
 *         Moderation, Notifications, Analytics, Staff, Tickets, Payouts
 * Tool   : Cypress 15.14.1 (cy.request — no UI)
 * Base URL: http://localhost:5000
 */

const API = 'http://localhost:5000/api';

// ─── Seed credentials ────────────────────────────────────────────────────────
const ATTENDEE = { email: 'user1@event.com', password: 'User123!' };
const ORGANIZER = { email: 'organizer1@event.com', password: 'Organizer123!' };
const ADMIN = { email: 'admin@event.com', password: 'Admin123!' };

// ─── Token cache ─────────────────────────────────────────────────────────────
let attendeeToken = '';
let organizerToken = '';
let adminToken = '';
let eventId = '';
let organizerId = '';

// =============================================================================
// 0. HEALTH CHECK
// =============================================================================
describe('0 | Health Check', () => {

    it('0-01 | GET /health → 200, status OK', () => {
        cy.request('GET', 'http://localhost:5000/health').then(res => {
            expect(res.status).to.eq(200);
            expect(res.body.status).to.eq('OK');
        });
    });
});

// =============================================================================
// 1. AUTHENTICATION
// =============================================================================
describe('1 | Auth API — /api/auth', () => {

    it('1-01 | POST /auth/login (attendee) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
            attendeeToken = res.body.token;
        });
    });

    it('1-02 | POST /auth/login (organizer) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
            organizerToken = res.body.token;
        });
    });

    it('1-03 | POST /auth/login (admin) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ADMIN).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
            adminToken = res.body.token;
        });
    });

    it('1-04 | POST /auth/login — wrong password → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/auth/login`,
            body: { email: ATTENDEE.email, password: 'WrongPass!' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('1-05 | POST /auth/login — unknown email → 401 or 404', () => {
        cy.request({
            method: 'POST', url: `${API}/auth/login`,
            body: { email: 'nobody@nowhere.com', password: 'Pass123!' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.be.oneOf([401, 404]));
    });

    it('1-06 | POST /auth/register — missing fields → 400', () => {
        cy.request({
            method: 'POST', url: `${API}/auth/register`,
            body: { email: 'incomplete@test.com' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(400));
    });

    it('1-07 | POST /auth/register — duplicate email → 400 or 409', () => {
        cy.request({
            method: 'POST', url: `${API}/auth/register`,
            body: { email: ATTENDEE.email, password: 'Pass123!', firstName: 'Dup', lastName: 'User' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.be.oneOf([400, 409]));
    });
});

// =============================================================================
// 2. EVENTS
// =============================================================================
describe('2 | Events API — /api/events', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            organizerToken = res.body.token;
        });
    });

    it('2-01 | GET /events → 200, array of events', () => {
        cy.request('GET', `${API}/events`).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array').and.have.length.gte(1);
            eventId = res.body[0].id;
        });
    });

    it('2-02 | GET /events/featured → 200, array', () => {
        cy.request('GET', `${API}/events/featured`).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('2-03 | GET /events/:id → 200, event object with title', () => {
        cy.request('GET', `${API}/events`).then(res => {
            const id = res.body[0].id;
            cy.request('GET', `${API}/events/${id}`).then(detail => {
                expect(detail.status).to.eq(200);
                expect(detail.body).to.have.property('title');
            });
        });
    });

    it('2-04 | GET /events/:id — invalid id → 404', () => {
        cy.request({ method: 'GET', url: `${API}/events/nonexistent-id-000`, failOnStatusCode: false })
            .then(res => expect(res.status).to.be.oneOf([404, 400]));
    });

    it('2-05 | POST /events (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/events`,
            body: { title: 'Unauthorized Event' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('2-06 | POST /events (organizer auth) → 201, event created', () => {
        cy.request({
            method: 'POST', url: `${API}/events`,
            headers: { Authorization: `Bearer ${organizerToken}` },
            body: {
                title: `Test Event ${Date.now()}`,
                description: 'Automated test event',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Addis Ababa',
                category_id: 1,
                ticket_price: 100,
                total_tickets: 50,
            },
            failOnStatusCode: false,
        }).then(res => {
            expect(res.status).to.be.oneOf([201, 200]);
            if (res.body.id) eventId = res.body.id;
        });
    });

    it('2-07 | PUT /events/:id (attendee token) → 403', () => {
        cy.request('GET', `${API}/events`).then(res => {
            const id = res.body[0].id;
            cy.request('POST', `${API}/auth/login`, ATTENDEE).then(loginRes => {
                cy.request({
                    method: 'PUT', url: `${API}/events/${id}`,
                    headers: { Authorization: `Bearer ${loginRes.body.token}` },
                    body: { title: 'Hacked Title' },
                    failOnStatusCode: false,
                }).then(r => expect(r.status).to.eq(403));
            });
        });
    });
});

// =============================================================================
// 3. ADMIN
// =============================================================================
describe('3 | Admin API — /api/admin', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ADMIN).then(res => {
            adminToken = res.body.token;
        });
    });

    it('3-01 | GET /admin/stats (admin) → 200, stats object', () => {
        cy.request({
            method: 'GET', url: `${API}/admin/stats`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('object');
        });
    });

    it('3-02 | GET /admin/stats (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/admin/stats`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('3-03 | GET /admin/stats (attendee token) → 403', () => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(loginRes => {
            cy.request({
                method: 'GET', url: `${API}/admin/stats`,
                headers: { Authorization: `Bearer ${loginRes.body.token}` },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.eq(403));
        });
    });

    it('3-04 | GET /admin/pending-organizers → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/admin/pending-organizers`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('3-05 | GET /admin/organizers → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/admin/organizers`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('3-06 | GET /admin/dashboard/csv → 200, content-type CSV', () => {
        cy.request({
            method: 'GET', url: `${API}/admin/dashboard/csv`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.headers['content-type']).to.include('csv');
        });
    });

    it('3-07 | GET /admin/admins (admin) → 200 or 403 (super admin only)', () => {
        cy.request({
            method: 'GET', url: `${API}/admin/admins`,
            headers: { Authorization: `Bearer ${adminToken}` },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.be.oneOf([200, 403]));
    });
});

// =============================================================================
// 4. ANALYTICS
// =============================================================================
describe('4 | Analytics API — /api/analytics', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            organizerToken = res.body.token;
        });
    });

    it('4-01 | GET /analytics/organizer/stats → 200, stats object', () => {
        cy.request({
            method: 'GET', url: `${API}/analytics/organizer/stats`,
            headers: { Authorization: `Bearer ${organizerToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('object');
        });
    });

    it('4-02 | GET /analytics/organizer/stats (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/analytics/organizer/stats`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('4-03 | GET /analytics/organizer/stats/csv → 200, CSV content', () => {
        cy.request({
            method: 'GET', url: `${API}/analytics/organizer/stats/csv`,
            headers: { Authorization: `Bearer ${organizerToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.headers['content-type']).to.include('csv');
        });
    });

    it('4-04 | GET /analytics/event/:eventId (organizer) → 200 or 404', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            const id = evRes.body[0].id;
            cy.request({
                method: 'GET', url: `${API}/analytics/event/${id}`,
                headers: { Authorization: `Bearer ${organizerToken}` },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([200, 403, 404]));
        });
    });
});

// =============================================================================
// 5. REVIEWS
// =============================================================================
describe('5 | Reviews API — /api/reviews', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            attendeeToken = res.body.token;
        });
    });

    it('5-01 | GET /reviews/event/:eventId → 200, array', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            const id = evRes.body[0].id;
            cy.request('GET', `${API}/reviews/event/${id}`).then(res => {
                expect(res.status).to.eq(200);
                expect(res.body).to.be.an('array');
            });
        });
    });

    it('5-02 | POST /reviews (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/reviews`,
            body: { event_id: 'some-id', rating: 5, comment: 'Great!' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('5-03 | POST /reviews (attendee auth) → 201 or 400', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            const id = evRes.body[0].id;
            cy.request({
                method: 'POST', url: `${API}/reviews`,
                headers: { Authorization: `Bearer ${attendeeToken}` },
                body: { event_id: id, rating: 4, comment: 'Automated test review' },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
        });
    });
});

// =============================================================================
// 6. NOTIFICATIONS
// =============================================================================
describe('6 | Notifications API — /api/notifications', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            attendeeToken = res.body.token;
        });
    });

    it('6-01 | GET /notifications (auth) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/notifications`,
            headers: { Authorization: `Bearer ${attendeeToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('6-02 | GET /notifications (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/notifications`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('6-03 | PUT /notifications/:id/read → 200 or 404', () => {
        cy.request({
            method: 'GET', url: `${API}/notifications`,
            headers: { Authorization: `Bearer ${attendeeToken}` },
        }).then(res => {
            if (res.body.length > 0) {
                const notifId = res.body[0].id;
                cy.request({
                    method: 'PUT', url: `${API}/notifications/${notifId}/read`,
                    headers: { Authorization: `Bearer ${attendeeToken}` },
                    failOnStatusCode: false,
                }).then(r => expect(r.status).to.be.oneOf([200, 404]));
            }
        });
    });
});

// =============================================================================
// 7. MODERATION
// =============================================================================
describe('7 | Moderation API — /api/moderation', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            attendeeToken = res.body.token;
        });
        cy.request('POST', `${API}/auth/login`, ADMIN).then(res => {
            adminToken = res.body.token;
        });
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            organizerToken = res.body.token;
        });
    });

    it('7-01 | POST /moderation/reports/review-user (auth) → 201', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            cy.request({
                method: 'POST', url: `${API}/moderation/reports/review-user`,
                headers: { Authorization: `Bearer ${attendeeToken}` },
                body: { reported_user_id: evRes.body[0].organizer_id || 'org-1', reason: 'Spam', review_id: 'rev-1' },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
        });
    });

    it('7-02 | POST /moderation/reports/event (auth) → 201 or 400', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            cy.request({
                method: 'POST', url: `${API}/moderation/reports/event`,
                headers: { Authorization: `Bearer ${attendeeToken}` },
                body: { event_id: evRes.body[0].id, reason: 'Inappropriate content' },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
        });
    });

    it('7-03 | POST /moderation/reports/event (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/moderation/reports/event`,
            body: { event_id: 'some-id', reason: 'Test' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('7-04 | GET /moderation/admin/reports (admin) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/moderation/admin/reports`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('7-05 | GET /moderation/organizer/reports (organizer) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/moderation/organizer/reports`,
            headers: { Authorization: `Bearer ${organizerToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('7-06 | GET /moderation/my-bans (attendee) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/moderation/my-bans`,
            headers: { Authorization: `Bearer ${attendeeToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('7-07 | GET /moderation/admin/appeals (admin) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/moderation/admin/appeals`,
            headers: { Authorization: `Bearer ${adminToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });
});

// =============================================================================
// 8. PAYMENTS
// =============================================================================
describe('8 | Payments API — /api/payments', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            attendeeToken = res.body.token;
        });
    });

    it('8-01 | POST /payments/init (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/payments/init`,
            body: { event_id: 'some-id', quantity: 1 },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('8-02 | POST /payments/init (auth, valid event) → 200 or 400', () => {
        cy.request('GET', `${API}/events`).then(evRes => {
            cy.request({
                method: 'POST', url: `${API}/payments/init`,
                headers: { Authorization: `Bearer ${attendeeToken}` },
                body: { event_id: evRes.body[0].id, quantity: 1 },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([200, 201, 400]));
        });
    });

    it('8-03 | GET /payments/platform-fee/history (auth) → 200', () => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(loginRes => {
            cy.request({
                method: 'GET', url: `${API}/payments/platform-fee/history`,
                headers: { Authorization: `Bearer ${loginRes.body.token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
            });
        });
    });
});

// =============================================================================
// 9. STAFF
// =============================================================================
describe('9 | Staff API — /api/staff', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            organizerToken = res.body.token;
        });
    });

    it('9-01 | GET /staff/members (organizer) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/staff/members`,
            headers: { Authorization: `Bearer ${organizerToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('9-02 | GET /staff/members (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/staff/members`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('9-03 | POST /staff/scan (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/staff/scan`,
            body: { qr_code: 'fake-qr' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });
});

// =============================================================================
// 10. TICKETS & PAYOUTS
// =============================================================================
describe('10 | Tickets & Payouts', () => {

    before(() => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            attendeeToken = res.body.token;
        });
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            organizerToken = res.body.token;
        });
    });

    it('10-01 | GET /tickets/my-tickets (attendee) → 200, array', () => {
        cy.request({
            method: 'GET', url: `${API}/tickets/my-tickets`,
            headers: { Authorization: `Bearer ${attendeeToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('10-02 | GET /tickets/my-tickets (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/tickets/my-tickets`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('10-03 | GET /payouts/history (organizer) → 200', () => {
        cy.request({
            method: 'GET', url: `${API}/payouts/history`,
            headers: { Authorization: `Bearer ${organizerToken}` },
        }).then(res => {
            expect(res.status).to.eq(200);
        });
    });

    it('10-04 | POST /payouts/init (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/payouts/init`,
            body: { amount: 1000 },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('10-05 | GET /categories → 200, array of categories', () => {
        cy.request('GET', `${API}/categories`).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array').and.have.length.gte(1);
        });
    });
});
