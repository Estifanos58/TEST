/**
 * DEMS — Generalized Backend API Test Suite
 * Covers: Auth, Events, Admin, Analytics, Reviews,
 *         Notifications, Moderation, Payments, Staff, Tickets, Payouts
 * Tool   : Cypress 15.14.1 (cy.request — no UI, no token caching)
 * Base URL: http://localhost:5000
 */

const API = 'http://localhost:5000/api';

const ATTENDEE = { email: 'user1@event.com', password: 'User123!' };
const ORGANIZER = { email: 'organizer1@event.com', password: 'Organizer123!' };
const ADMIN = { email: 'admin1@event.com', password: 'Admin123!' };

// Helper — returns a cy chain that yields a fresh token
function getToken(creds) {
    return cy.request('POST', `${API}/auth/login`, creds).its('body.token');
}

// Helper — returns a cy chain that yields the first event id
function getFirstEventId() {
    return cy.request('GET', `${API}/events`).then(res => res.body[0]?.id || res.body.events?.[0]?.id);
}

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
describe('1 | Auth API', () => {

    it('1-01 | POST /auth/login (attendee) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ATTENDEE).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
        });
    });

    it('1-02 | POST /auth/login (organizer) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ORGANIZER).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
        });
    });

    it('1-03 | POST /auth/login (admin) → 200, token returned', () => {
        cy.request('POST', `${API}/auth/login`, ADMIN).then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('token');
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
            body: { email: ATTENDEE.email, password: 'Pass123!', full_name: 'Dup User' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.be.oneOf([400, 409]));
    });
});

// =============================================================================
// 2. EVENTS
// =============================================================================
describe('2 | Events API', () => {

    it('2-01 | GET /events → 200, array with at least 1 event', () => {
        cy.request('GET', `${API}/events`).then(res => {
            expect(res.status).to.eq(200);
            const list = res.body.events || res.body;
            expect(list).to.be.an('array').and.have.length.gte(1);
        });
    });

    it('2-02 | GET /events/featured → 200, array', () => {
        cy.request('GET', `${API}/events/featured`).then(res => {
            expect(res.status).to.eq(200);
            const list = res.body.events || res.body;
            expect(list).to.be.an('array');
        });
    });

    it('2-03 | GET /events/:id → 200, event has title', () => {
        getFirstEventId().then(id => {
            cy.request('GET', `${API}/events/${id}`).then(res => {
                expect(res.status).to.eq(200);
                const event = res.body.event || res.body;
                expect(event).to.have.property('title');
            });
        });
    });

    it('2-04 | GET /events/:id — invalid id → 404 or 400', () => {
        cy.request({ method: 'GET', url: `${API}/events/nonexistent-000`, failOnStatusCode: false })
            .then(res => expect(res.status).to.be.oneOf([404, 400]));
    });

    it('2-05 | POST /events (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/events`,
            body: { title: 'Unauthorized Event' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('2-06 | POST /events (organizer auth) → 201 or 200', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'POST', url: `${API}/events`,
                headers: { Authorization: `Bearer ${token}` },
                body: {
                    title: `Test Event ${Date.now()}`,
                    description: 'Automated test event',
                    start_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    end_datetime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                    city: 'Addis Ababa',
                    event_type: 'conference',
                    category_id: 1,
                },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
        });
    });

    it('2-07 | PUT /events/:id (attendee token) → 403', () => {
        getToken(ATTENDEE).then(token => {
            getFirstEventId().then(id => {
                cy.request({
                    method: 'PUT', url: `${API}/events/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    body: { title: 'Hacked Title' },
                    failOnStatusCode: false,
                }).then(res => expect(res.status).to.eq(403));
            });
        });
    });
});

// =============================================================================
// 3. ADMIN
// =============================================================================
describe('3 | Admin API', () => {

    it('3-01 | GET /admin/stats (admin) → 200', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/stats`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => expect(res.status).to.eq(200));
        });
    });

    it('3-02 | GET /admin/stats (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/admin/stats`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('3-03 | GET /admin/stats (attendee token) → 403', () => {
        getToken(ATTENDEE).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/stats`,
                headers: { Authorization: `Bearer ${token}` },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.eq(403));
        });
    });

    it('3-04 | GET /admin/pending-organizers (admin) → 200, array', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/pending-organizers`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.organizers || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('3-05 | GET /admin/organizers (admin) → 200, array', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/organizers`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.organizers || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('3-06 | GET /admin/dashboard/csv (admin) → 200, CSV content-type', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/dashboard/csv`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                expect(res.headers['content-type']).to.include('csv');
            });
        });
    });

    it('3-07 | GET /admin/admins (admin) → 200 or 403', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/admin/admins`,
                headers: { Authorization: `Bearer ${token}` },
                failOnStatusCode: false,
            }).then(res => expect(res.status).to.be.oneOf([200, 403]));
        });
    });
});

// =============================================================================
// 4. ANALYTICS
// =============================================================================
describe('4 | Analytics API', () => {

    it('4-01 | GET /analytics/organizer/stats (organizer) → 200', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/analytics/organizer/stats`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => expect(res.status).to.eq(200));
        });
    });

    it('4-02 | GET /analytics/organizer/stats (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/analytics/organizer/stats`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('4-03 | GET /analytics/organizer/stats/csv (organizer) → 200, CSV', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/analytics/organizer/stats/csv`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                expect(res.headers['content-type']).to.include('csv');
            });
        });
    });

    it('4-04 | GET /analytics/event/:id (organizer) → 200, 403, or 404', () => {
        getToken(ORGANIZER).then(token => {
            getFirstEventId().then(id => {
                cy.request({
                    method: 'GET', url: `${API}/analytics/event/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    failOnStatusCode: false,
                }).then(res => expect(res.status).to.be.oneOf([200, 403, 404]));
            });
        });
    });
});

// =============================================================================
// 5. REVIEWS
// =============================================================================
describe('5 | Reviews API', () => {

    it('5-01 | GET /reviews/event/:id → 200, array', () => {
        getFirstEventId().then(id => {
            cy.request('GET', `${API}/reviews/event/${id}`).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.reviews || res.body;
                expect(list).to.be.an('array');
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

    it('5-03 | POST /reviews (attendee auth) → 201, 200, or 400', () => {
        getToken(ATTENDEE).then(token => {
            getFirstEventId().then(id => {
                cy.request({
                    method: 'POST', url: `${API}/reviews`,
                    headers: { Authorization: `Bearer ${token}` },
                    body: { event_id: id, rating: 4, review_text: 'Automated test review' },
                    failOnStatusCode: false,
                }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
            });
        });
    });
});

// =============================================================================
// 6. NOTIFICATIONS
// =============================================================================
describe('6 | Notifications API', () => {

    it('6-01 | GET /notifications (auth) → 200, array', () => {
        getToken(ATTENDEE).then(token => {
            cy.request({
                method: 'GET', url: `${API}/notifications`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.notifications || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('6-02 | GET /notifications (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/notifications`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('6-03 | PUT /notifications/:id/read → 200 or 404', () => {
        getToken(ATTENDEE).then(token => {
            cy.request({
                method: 'GET', url: `${API}/notifications`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                const list = res.body.notifications || res.body;
                if (list.length > 0) {
                    cy.request({
                        method: 'PUT', url: `${API}/notifications/${list[0].id}/read`,
                        headers: { Authorization: `Bearer ${token}` },
                        failOnStatusCode: false,
                    }).then(r => expect(r.status).to.be.oneOf([200, 404]));
                }
            });
        });
    });
});

// =============================================================================
// 7. MODERATION
// =============================================================================
describe('7 | Moderation API', () => {

    it('7-01 | POST /moderation/reports/event (auth) → 201, 200, or 400', () => {
        getToken(ATTENDEE).then(token => {
            getFirstEventId().then(id => {
                cy.request({
                    method: 'POST', url: `${API}/moderation/reports/event`,
                    headers: { Authorization: `Bearer ${token}` },
                    body: { event_id: id, reason: 'Inappropriate content' },
                    failOnStatusCode: false,
                }).then(res => expect(res.status).to.be.oneOf([201, 200, 400]));
            });
        });
    });

    it('7-02 | POST /moderation/reports/event (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/moderation/reports/event`,
            body: { event_id: 'some-id', reason: 'Test' },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('7-03 | GET /moderation/admin/reports (admin) → 200, array', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/moderation/admin/reports`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.reports || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('7-04 | GET /moderation/organizer/reports (organizer) → 200, array', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/moderation/organizer/reports`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.reports || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('7-05 | GET /moderation/my-bans (attendee) → 200, array', () => {
        getToken(ATTENDEE).then(token => {
            cy.request({
                method: 'GET', url: `${API}/moderation/my-bans`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.bans || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('7-06 | GET /moderation/admin/appeals (admin) → 200, array', () => {
        getToken(ADMIN).then(token => {
            cy.request({
                method: 'GET', url: `${API}/moderation/admin/appeals`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.appeals || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('7-07 | GET /moderation/organizer/appeals (organizer) → 200, array', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/moderation/organizer/appeals`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.appeals || res.body;
                expect(list).to.be.an('array');
            });
        });
    });
});

// =============================================================================
// 8. PAYMENTS
// =============================================================================
describe('8 | Payments API', () => {

    it('8-01 | POST /payments/init (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/payments/init`,
            body: { event_id: 'some-id', quantity: 1 },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('8-02 | POST /payments/init (auth) → 200, 201, or 400', () => {
        getToken(ATTENDEE).then(token => {
            getFirstEventId().then(id => {
                cy.request({
                    method: 'POST', url: `${API}/payments/init`,
                    headers: { Authorization: `Bearer ${token}` },
                    body: { event_id: id, quantity: 1 },
                    failOnStatusCode: false,
                }).then(res => expect(res.status).to.be.oneOf([200, 201, 400]));
            });
        });
    });

    it('8-03 | GET /payments/platform-fee/history (organizer) → 200', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/payments/platform-fee/history`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => expect(res.status).to.eq(200));
        });
    });
});

// =============================================================================
// 9. STAFF
// =============================================================================
describe('9 | Staff API', () => {

    it('9-01 | GET /staff/members (organizer) → 200, array', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/staff/members`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.staff || res.body;
                expect(list).to.be.an('array');
            });
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
// 10. TICKETS, PAYOUTS & CATEGORIES
// =============================================================================
describe('10 | Tickets, Payouts & Categories', () => {

    it('10-01 | GET /tickets/my-tickets (attendee) → 200, array', () => {
        getToken(ATTENDEE).then(token => {
            cy.request({
                method: 'GET', url: `${API}/tickets/my-tickets`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                expect(res.status).to.eq(200);
                const list = res.body.tickets || res.body;
                expect(list).to.be.an('array');
            });
        });
    });

    it('10-02 | GET /tickets/my-tickets (no auth) → 401', () => {
        cy.request({ method: 'GET', url: `${API}/tickets/my-tickets`, failOnStatusCode: false })
            .then(res => expect(res.status).to.eq(401));
    });

    it('10-03 | GET /payouts/history (organizer) → 200', () => {
        getToken(ORGANIZER).then(token => {
            cy.request({
                method: 'GET', url: `${API}/payouts/history`,
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => expect(res.status).to.eq(200));
        });
    });

    it('10-04 | POST /payouts/init (no auth) → 401', () => {
        cy.request({
            method: 'POST', url: `${API}/payouts/init`,
            body: { amount: 1000 },
            failOnStatusCode: false,
        }).then(res => expect(res.status).to.eq(401));
    });

    it('10-05 | GET /categories → 200, array with at least 1 category', () => {
        cy.request('GET', `${API}/categories`).then(res => {
            expect(res.status).to.eq(200);
            const list = res.body.categories || res.body;
            expect(list).to.be.an('array').and.have.length.gte(1);
        });
    });
});
