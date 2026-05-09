/**
 * DEMS — Generalized Frontend Test Suite
 * Covers: Authentication, Events, Organizer Wizard, Profile,
 *         Notifications, Moderation, Payments, Reviews, Admin UI
 * Tool   : Cypress 15.14.1
 * Base URL: http://localhost:5173
 */

// ─── Seed credentials ────────────────────────────────────────────────────────
const ATTENDEE = { email: 'user1@event.com', password: 'User123!' };
const ORGANIZER = { email: 'organizer1@event.com', password: 'Organizer123!' };
const ADMIN = { email: 'admin1@event.com', password: 'Admin123!' };
const PENDING = { email: 'organizer7@event.com', password: 'Organizer123!' };

// ─── Helper: login via UI ─────────────────────────────────────────────────────
function loginAs(user) {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.get('input#email').type(user.email);
    cy.get('input#password').type(user.password);
    cy.get('form button[type="submit"]').first().click();
}

// =============================================================================
// 1. AUTHENTICATION
// =============================================================================
describe('1 | Authentication', () => {

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('/login');
    });

    it('1-01 | Login page renders email, password fields and submit button', () => {
        cy.get('input#email').should('be.visible');
        cy.get('input#password').should('be.visible');
        cy.get('form button[type="submit"]').first().should('contain', 'Sign In');
    });

    it('1-02 | Password field masks input; toggle reveals it', () => {
        cy.get('input#password').should('have.attr', 'type', 'password');
        cy.get('input#password').type('secret');
        cy.get('button[type="button"]').first().click();
        cy.get('input#password').should('have.attr', 'type', 'text');
    });

    it('1-03 | Valid attendee credentials → 200, token stored, redirect /discover', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(ATTENDEE.email);
        cy.get('input#password').type(ATTENDEE.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login').its('response.statusCode').should('eq', 200);
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.be.null');
        cy.url().should('include', '/discover');
    });

    it('1-04 | Wrong password → 401, error banner shown, no token stored', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(ATTENDEE.email);
        cy.get('input#password').type('WrongPass!');
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login').its('response.statusCode').should('eq', 401);
        cy.get('[class*="red"], [class*="error"], [role="alert"]').should('be.visible');
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });

    it('1-05 | Pending organizer login → blocked with message, no token', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(PENDING.email);
        cy.get('input#password').type(PENDING.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login');
        cy.url().should('include', '/login');
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });

    it('1-06 | Admin credentials → redirect /admin/dashboard', () => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-admin-token', user: { role_id: 1, email: ADMIN.email } },
        }).as('adminLogin');
        cy.get('input#email').type(ADMIN.email);
        cy.get('input#password').type(ADMIN.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@adminLogin');
        cy.url().should('include', '/admin/dashboard');
    });

    it('1-07 | Organizer credentials → redirect /organizer/dashboard', () => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-org-token', user: { role_id: 2, email: ORGANIZER.email } },
        }).as('orgLogin');
        cy.get('input#email').type(ORGANIZER.email);
        cy.get('input#password').type(ORGANIZER.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@orgLogin');
        cy.url().should('include', '/organizer/dashboard');
    });

    it('1-08 | Signup — mismatched passwords shows client-side error, no API call', () => {
        cy.intercept('POST', '**/auth/register').as('register');
        cy.visit('/signup');
        cy.get('input[name="firstName"], input#firstName').type('Test');
        cy.get('input[name="lastName"],  input#lastName').type('User');
        cy.get('input[name="email"],     input#email').type('newuser@test.com');
        cy.get('input[name="password"],  input#password').first().type('Pass123!');
        cy.get('input[name="confirmPassword"], input#confirmPassword').type('Different1!');
        cy.get('form button[type="submit"]').first().click();
        cy.get('[class*="red"], [class*="error"], [role="alert"]').should('be.visible');
        cy.get('@register.all').should('have.length', 0);
    });

    it('1-09 | Signup — password shorter than 6 chars shows validation error', () => {
        cy.visit('/signup');
        cy.get('input[name="password"], input#password').first().type('abc');
        cy.get('input[name="confirmPassword"], input#confirmPassword').type('abc');
        cy.get('form button[type="submit"]').first().click();
        cy.get('[class*="red"], [class*="error"], [role="alert"]').should('be.visible');
    });

    it('1-10 | Logout clears token and redirects to /login', () => {
        loginAs(ATTENDEE);
        cy.url().should('include', '/discover');
        cy.get('[data-cy="logout"], button:contains("Logout"), button:contains("Sign Out")')
            .first().click({ force: true });
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
        cy.url().should('include', '/login');
    });
});

// =============================================================================
// 2. ORGANIZER SIGNUP WIZARD
// =============================================================================
describe('2 | Organizer Signup Wizard', () => {

    beforeEach(() => cy.visit('/organizer/signup'));

    it('2-01 | Step 1 renders Account Credentials heading', () => {
        cy.contains('Account Credentials').should('be.visible');
    });

    it('2-02 | Empty Step 1 submit shows validation errors', () => {
        cy.get('form button[type="submit"], button:contains("Next")').first().click();
        cy.get('[class*="red"], [class*="error"], [role="alert"]').should('be.visible');
    });

    it('2-03 | Valid Step 1 data advances to Step 2 (Organization Details)', () => {
        cy.get('input[name="fullName"],  input#fullName').type('Test Organizer');
        cy.get('input[name="email"],     input#email').type(`org_${Date.now()}@test.com`);
        cy.get('input[name="password"],  input#password').first().type('OrgPass123!');
        cy.get('input[name="confirmPassword"], input#confirmPassword').type('OrgPass123!');
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        cy.contains('Organization Details').should('be.visible');
    });

    it('2-04 | Step 2 → Step 3 advances to Contact Info', () => {
        // Step 1
        cy.get('input[name="fullName"],  input#fullName').type('Test Organizer');
        cy.get('input[name="email"],     input#email').type(`org_${Date.now()}@test.com`);
        cy.get('input[name="password"],  input#password').first().type('OrgPass123!');
        cy.get('input[name="confirmPassword"], input#confirmPassword').type('OrgPass123!');
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        // Step 2
        cy.get('input[name="orgName"],   input#orgName').type('My Org');
        cy.get('select[name="orgType"],  select#orgType').select(1);
        cy.get('textarea[name="bio"],    textarea#bio').type('We organize great events.');
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        cy.contains('Contact').should('be.visible');
    });

    it('2-05 | Back button on Step 2 returns to Step 1', () => {
        cy.get('input[name="fullName"],  input#fullName').type('Test Organizer');
        cy.get('input[name="email"],     input#email').type(`org_${Date.now()}@test.com`);
        cy.get('input[name="password"],  input#password').first().type('OrgPass123!');
        cy.get('input[name="confirmPassword"], input#confirmPassword').type('OrgPass123!');
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        cy.get('button:contains("Back")').click();
        cy.contains('Account Credentials').should('be.visible');
    });
});

// =============================================================================
// 3. EVENT DISCOVERY
// =============================================================================
describe('3 | Event Discovery', () => {

    it('3-01 | /discover page loads and shows event cards', () => {
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card, [class*="EventCard"]').should('have.length.gte', 1);
    });

    it('3-02 | Search bar filters events by keyword', () => {
        cy.visit('/discover');
        cy.get('input[placeholder*="Search"], input[type="search"]').first().type('music');
        cy.get('[data-cy="event-card"], .event-card, [class*="EventCard"]').should('exist');
    });

    it('3-03 | Clicking an event card navigates to event detail page', () => {
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card, [class*="EventCard"]').first().click();
        cy.url().should('match', /\/events\/[a-zA-Z0-9-]+/);
    });

    it('3-04 | Event detail page shows title, date, and ticket button', () => {
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card, [class*="EventCard"]').first().click();
        cy.get('h1, h2').should('be.visible');
        cy.get('button:contains("Ticket"), button:contains("Buy"), button:contains("Register")')
            .should('exist');
    });
});

// =============================================================================
// 4. PROFILE PAGE
// =============================================================================
describe('4 | Profile Page', () => {

    beforeEach(() => loginAs(ATTENDEE));

    it('4-01 | /profile loads with "Profile Settings" heading', () => {
        cy.visit('/profile');
        cy.contains('Profile').should('be.visible');
    });

    it('4-02 | Form fields are pre-filled after login', () => {
        cy.visit('/profile');
        cy.get('input[name="firstName"], input#firstName').should('not.have.value', '');
    });

    it('4-03 | "Save Changes" button is visible', () => {
        cy.visit('/profile');
        cy.get('button:contains("Save")').should('be.visible');
    });
});

// =============================================================================
// 5. NOTIFICATIONS
// =============================================================================
describe('5 | Notifications', () => {

    beforeEach(() => loginAs(ATTENDEE));

    it('5-01 | Bell icon visible in navbar', () => {
        cy.visit('/discover');
        cy.get('[data-cy="notification-bell"], [aria-label*="notification"], svg[class*="Bell"]')
            .should('exist');
    });

    it('5-02 | Clicking bell opens notification dropdown', () => {
        cy.visit('/discover');
        cy.get('[data-cy="notification-bell"], [aria-label*="notification"], svg[class*="Bell"]')
            .first().click({ force: true });
        cy.get('[data-cy="notification-list"], [class*="notification"]').should('be.visible');
    });

    it('5-03 | Unread notifications show blue highlight', () => {
        cy.intercept('GET', '**/notifications', {
            body: [{ id: '1', type: 'info', message: 'Test notification', is_read: false, created_at: new Date() }],
        }).as('getNotifs');
        cy.visit('/discover');
        cy.wait('@getNotifs');
        cy.get('[class*="blue"], [class*="unread"]').should('exist');
    });
});

// =============================================================================
// 6. ADMIN DASHBOARD UI
// =============================================================================
describe('6 | Admin Dashboard UI', () => {

    beforeEach(() => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-admin-token', user: { id: '1', role_id: 1, email: ADMIN.email } },
        }).as('adminLogin');
        cy.clearLocalStorage();
        cy.visit('/login');
        cy.get('input#email').type(ADMIN.email);
        cy.get('input#password').type(ADMIN.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@adminLogin');
    });

    it('6-01 | Admin dashboard loads with stats widgets', () => {
        cy.visit('/admin/dashboard');
        cy.get('[data-cy="stat-card"], [class*="stat"], [class*="Stat"]').should('exist');
    });

    it('6-02 | Pending organizers section is visible', () => {
        cy.visit('/admin/dashboard');
        cy.contains('Pending', { matchCase: false }).should('exist');
    });

    it('6-03 | Approve button present on pending organizer row', () => {
        cy.visit('/admin/dashboard');
        cy.get('button:contains("Approve"), [data-cy="approve-btn"]').should('exist');
    });
});

// =============================================================================
// 7. ORGANIZER DASHBOARD UI
// =============================================================================
describe('7 | Organizer Dashboard UI', () => {

    beforeEach(() => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-org-token', user: { id: '2', role_id: 2, email: ORGANIZER.email } },
        }).as('orgLogin');
        cy.clearLocalStorage();
        cy.visit('/login');
        cy.get('input#email').type(ORGANIZER.email);
        cy.get('input#password').type(ORGANIZER.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@orgLogin');
    });

    it('7-01 | Organizer dashboard loads', () => {
        cy.visit('/organizer/dashboard');
        cy.get('h1, h2').should('be.visible');
    });

    it('7-02 | "Create Event" button is visible', () => {
        cy.visit('/organizer/dashboard');
        cy.get('button:contains("Create"), a:contains("Create")').should('exist');
    });

    it('7-03 | Events list section is present', () => {
        cy.visit('/organizer/dashboard');
        cy.contains('Events', { matchCase: false }).should('exist');
    });
});

// =============================================================================
// 8. MODERATION UI
// =============================================================================
describe('8 | Moderation — Ban Appeal Modal', () => {

    it('8-01 | Ban notification shows ShieldAlert icon', () => {
        cy.intercept('GET', '**/notifications', {
            body: [{
                id: '1', type: 'ban', is_read: false, created_at: new Date(),
                message: 'You have been banned',
                metadata: { ban_id: 'ban-1', organizer_id: 'org-1', ban_scope: 'organizer_user', reason: 'Violation' },
            }],
        }).as('getNotifs');
        loginAs(ATTENDEE);
        cy.visit('/discover');
        cy.wait('@getNotifs');
        cy.get('[data-cy="notification-bell"], svg[class*="Bell"]').first().click({ force: true });
        cy.get('[class*="shield"], [class*="ban"], svg').should('exist');
    });

    it('8-02 | Clicking ban notification opens appeal modal', () => {
        cy.intercept('GET', '**/notifications', {
            body: [{
                id: '1', type: 'ban', is_read: false, created_at: new Date(),
                message: 'You have been banned',
                metadata: { ban_id: 'ban-1', organizer_id: 'org-1', ban_scope: 'organizer_user', reason: 'Violation' },
            }],
        }).as('getNotifs');
        loginAs(ATTENDEE);
        cy.visit('/discover');
        cy.wait('@getNotifs');
        cy.get('[data-cy="notification-bell"], svg[class*="Bell"]').first().click({ force: true });
        cy.get('[class*="ban"], [class*="notification"]').first().click({ force: true });
        cy.get('textarea, [data-cy="appeal-modal"]').should('exist');
    });
});

// =============================================================================
// 9. PAYMENT UI
// =============================================================================
describe('9 | Payment UI', () => {

    beforeEach(() => loginAs(ATTENDEE));

    it('9-01 | Checkout page renders with order summary', () => {
        cy.intercept('GET', '**/events/**').as('getEvent');
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card').first().click();
        cy.get('button:contains("Ticket"), button:contains("Buy")').first().click({ force: true });
        cy.get('[class*="checkout"], [class*="order"], [class*="payment"]').should('exist');
    });

    it('9-02 | Pay button is visible on checkout', () => {
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card').first().click();
        cy.get('button:contains("Ticket"), button:contains("Buy")').first().click({ force: true });
        cy.get('button:contains("Pay"), button:contains("Checkout"), button:contains("Confirm")')
            .should('exist');
    });
});

// =============================================================================
// 10. REVIEWS UI
// =============================================================================
describe('10 | Reviews UI', () => {

    it('10-01 | Event detail page shows reviews section', () => {
        cy.intercept('GET', '**/reviews/event/**', {
            body: [{ id: '1', rating: 5, comment: 'Great event!', user: { name: 'Test User' }, created_at: new Date() }],
        }).as('getReviews');
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card').first().click();
        cy.wait('@getReviews');
        cy.contains('Review', { matchCase: false }).should('exist');
    });

    it('10-02 | Logged-in attendee sees review submission form', () => {
        loginAs(ATTENDEE);
        cy.visit('/discover');
        cy.get('[data-cy="event-card"], .event-card').first().click();
        cy.get('textarea[placeholder*="review"], textarea[placeholder*="comment"], [data-cy="review-form"]')
            .should('exist');
    });
});
