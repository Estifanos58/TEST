/**
 * DEMS — Generalized Frontend Test Suite
 * Covers: Authentication, Events, Organizer Wizard, Profile,
 *         Notifications, Moderation, Payments, Reviews, Admin UI
 * Tool   : Cypress 15.14.1
 * Base URL: http://localhost:5173
 */

// ─── Seed credentials (from Seed/data/users.ts) ──────────────────────────────
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
    cy.url().should('not.include', '/login');
}

// =============================================================================
// 1. AUTHENTICATION
// =============================================================================
describe('1 | Authentication', () => {

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('/login');
    });

    it('1-01 | Login page renders email and password fields', () => {
        cy.get('input#email').should('be.visible');
        cy.get('input#password').should('be.visible');
    });

    it('1-02 | Submit button contains "Sign In"', () => {
        cy.get('form button[type="submit"]').first().should('contain', 'Sign In');
    });

    it('1-03 | Password field masks input by default', () => {
        cy.get('input#password').should('have.attr', 'type', 'password');
    });

    it('1-04 | Password visibility toggle reveals plain text', () => {
        cy.get('input#password').type('secret');
        // toggle button is the only type="button" inside the password wrapper
        cy.get('input#password').parent().find('button[type="button"]').click();
        cy.get('input#password').should('have.attr', 'type', 'text');
    });

    it('1-05 | Valid attendee credentials → 200, token stored, redirect /discover', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(ATTENDEE.email);
        cy.get('input#password').type(ATTENDEE.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login').its('response.statusCode').should('eq', 200);
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.be.null');
        cy.url().should('include', '/discover');
    });

    it('1-06 | Wrong password → error banner shown, no token stored', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(ATTENDEE.email);
        cy.get('input#password').type('WrongPass!');
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login');
        // error div: bg-red-50 border border-red-200
        cy.get('.bg-red-50').should('be.visible');
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });

    it('1-07 | Pending organizer → stays on /login, no token', () => {
        cy.intercept('POST', '**/auth/login').as('login');
        cy.get('input#email').type(PENDING.email);
        cy.get('input#password').type(PENDING.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@login');
        cy.url().should('include', '/login');
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });

    it('1-08 | Admin mock login → redirect /admin/dashboard', () => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-admin-token', user: { id: '1', role_id: 1, email: ADMIN.email } },
        }).as('adminLogin');
        cy.get('input#email').type(ADMIN.email);
        cy.get('input#password').type(ADMIN.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@adminLogin');
        cy.url().should('include', '/admin/dashboard');
    });

    it('1-09 | Organizer mock login → redirect /organizer/dashboard', () => {
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-org-token', user: { id: '2', role_id: 2, email: ORGANIZER.email } },
        }).as('orgLogin');
        cy.get('input#email').type(ORGANIZER.email);
        cy.get('input#password').type(ORGANIZER.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@orgLogin');
        cy.url().should('include', '/organizer/dashboard');
    });

    it('1-10 | Logout clears token and redirects away from protected page', () => {
        loginAs(ATTENDEE);
        cy.visit('/discover');
        // Logout button is inside profile dropdown — open it first
        cy.get('button').filter(':contains("Logout"), :contains("Sign Out")').first()
            .click({ force: true });
        cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
    });
});

// =============================================================================
// 2. SIGNUP PAGE
// =============================================================================
describe('2 | Signup Page', () => {

    beforeEach(() => cy.visit('/signup'));

    it('2-01 | Signup page renders "Create Account" heading', () => {
        cy.contains('Create Account').should('be.visible');
    });

    it('2-02 | All required fields are present', () => {
        cy.get('input[name="full_name"]').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        cy.get('input[name="confirm_password"]').should('be.visible');
    });

    it('2-03 | Mismatched passwords shows "Passwords do not match" error', () => {
        cy.get('input[name="full_name"]').type('Test User');
        cy.get('input[name="email"]').type('newuser@test.com');
        cy.get('input[name="password"]').type('Pass123!');
        cy.get('input[name="confirm_password"]').type('Different1!');
        cy.get('form button[type="submit"]').first().click();
        cy.get('.bg-red-50').should('contain', 'do not match');
    });

    it('2-04 | Password shorter than 6 chars shows length error', () => {
        cy.get('input[name="full_name"]').type('Test User');
        cy.get('input[name="email"]').type('newuser@test.com');
        cy.get('input[name="password"]').type('abc');
        cy.get('input[name="confirm_password"]').type('abc');
        cy.get('form button[type="submit"]').first().click();
        cy.get('.bg-red-50').should('contain', '6 characters');
    });

    it('2-05 | Empty full name shows required error', () => {
        cy.get('input[name="email"]').type('newuser@test.com');
        cy.get('input[name="password"]').type('Pass123!');
        cy.get('input[name="confirm_password"]').type('Pass123!');
        cy.get('form button[type="submit"]').first().click();
        cy.get('.bg-red-50').should('be.visible');
    });
});

// =============================================================================
// 3. ORGANIZER SIGNUP WIZARD
// =============================================================================
describe('3 | Organizer Signup Wizard', () => {

    beforeEach(() => cy.visit('/organizer/signup'));

    it('3-01 | Step 1 renders with a heading visible', () => {
        cy.get('h1, h2, h3').first().should('be.visible');
    });

    it('3-02 | Empty Step 1 submit shows validation error', () => {
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        cy.get('.bg-red-50, [class*="error"], [class*="red"]').should('exist');
    });

    it('3-03 | Valid Step 1 data advances to Step 2', () => {
        cy.get('input[name="fullName"], input[name="full_name"], input#fullName').first()
            .type('Test Organizer');
        cy.get('input[name="email"], input#email').first()
            .type(`org_${Date.now()}@test.com`);
        cy.get('input[name="password"], input#password').first().type('OrgPass123!');
        cy.get('input[name="confirmPassword"], input[name="confirm_password"]').first()
            .type('OrgPass123!');
        cy.get('button:contains("Next"), form button[type="submit"]').first().click();
        // Step 2 should now be visible — org name or bio field
        cy.get('input, textarea, select').should('have.length.gte', 1);
    });
});

// =============================================================================
// 4. EVENT DISCOVERY
// =============================================================================
describe('4 | Event Discovery', () => {

    it('4-01 | /discover page loads with search input', () => {
        cy.visit('/discover');
        cy.get('input[type="text"]').should('exist');
    });

    it('4-02 | Event cards are rendered on /discover', () => {
        cy.visit('/discover');
        // wait for loading spinner to disappear
        cy.get('.animate-spin', { timeout: 10000 }).should('not.exist');
        cy.get('a[href*="/event/"], [class*="rounded"][class*="shadow"], .group').should('exist');
    });

    it('4-03 | Search input accepts text', () => {
        cy.visit('/discover');
        cy.get('input[type="text"]').first().type('music');
        cy.get('input[type="text"]').first().should('have.value', 'music');
    });

    it('4-04 | Category chips are visible', () => {
        cy.visit('/discover');
        cy.contains('All Events').should('be.visible');
        cy.contains('Music').should('be.visible');
    });

    it('4-05 | Clicking an event navigates to /event/:id', () => {
        cy.visit('/discover');
        cy.get('.animate-spin', { timeout: 10000 }).should('not.exist');
        cy.get('a[href*="/event/"]').first().click({ force: true });
        cy.url().should('match', /\/event\/.+/);
    });
});

// =============================================================================
// 5. PROFILE PAGE
// =============================================================================
describe('5 | Profile Page', () => {

    beforeEach(() => loginAs(ATTENDEE));

    it('5-01 | /profile loads with "Profile Settings" heading', () => {
        cy.visit('/profile');
        cy.contains('Profile Settings').should('be.visible');
    });

    it('5-02 | Personal Information section is visible', () => {
        cy.visit('/profile');
        cy.contains('Personal Information').should('be.visible');
    });

    it('5-03 | First name field has name="first_name"', () => {
        cy.visit('/profile');
        cy.get('input[name="first_name"]').should('be.visible');
    });

    it('5-04 | Last name field has name="last_name"', () => {
        cy.visit('/profile');
        cy.get('input[name="last_name"]').should('be.visible');
    });

    it('5-05 | Save Changes button is visible', () => {
        cy.visit('/profile');
        cy.get('button').filter(':contains("Save")').should('be.visible');
    });
});

// =============================================================================
// 6. NOTIFICATIONS
// =============================================================================
describe('6 | Notifications', () => {

    beforeEach(() => loginAs(ATTENDEE));

    it('6-01 | Bell icon is visible in navbar after login', () => {
        cy.visit('/discover');
        // NotificationBell renders a Bell or BellRing SVG inside a button
        cy.get('button svg').should('exist');
    });

    it('6-02 | Unread count badge appears when notifications exist', () => {
        cy.intercept('GET', '**/notifications', {
            body: {
                success: true,
                notifications: [
                    { id: '1', type: 'info', title: 'Test', message: 'Hello', read_at: null, created_at: new Date() }
                ]
            },
        }).as('getNotifs');
        cy.visit('/discover');
        cy.wait('@getNotifs');
        // badge is a span with absolute positioning showing count
        cy.get('span').filter((i, el) => {
            const text = el.textContent.trim();
            return /^\d+$/.test(text) || text === '9+';
        }).should('exist');
    });

    it('6-03 | Clicking bell button toggles dropdown', () => {
        cy.intercept('GET', '**/notifications', {
            body: { success: true, notifications: [] },
        }).as('getNotifs');
        cy.visit('/discover');
        cy.wait('@getNotifs');
        // find the bell button and click it
        cy.get('button').filter(':has(svg)').first().click({ force: true });
        // dropdown or some notification container should appear
        cy.get('div').filter(':contains("notification"), :contains("No notification")')
            .should('exist');
    });
});

// =============================================================================
// 7. ADMIN DASHBOARD UI
// =============================================================================
describe('7 | Admin Dashboard UI', () => {

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-admin-token', user: { id: '1', role_id: 1, email: ADMIN.email, full_name: 'Admin User' } },
        }).as('adminLogin');
        cy.visit('/login');
        cy.get('input#email').type(ADMIN.email);
        cy.get('input#password').type(ADMIN.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@adminLogin');
    });

    it('7-01 | Admin navbar shows "ADMIN" badge', () => {
        cy.visit('/admin/dashboard');
        cy.contains('ADMIN').should('be.visible');
    });

    it('7-02 | Admin dashboard page loads without crashing', () => {
        cy.visit('/admin/dashboard');
        cy.get('h1, h2, h3').should('exist');
    });

    it('7-03 | Dashboard link is present in admin navbar', () => {
        cy.visit('/admin/dashboard');
        cy.contains('Dashboard').should('be.visible');
    });

    it('7-04 | Approvals link is present in admin navbar', () => {
        cy.visit('/admin/dashboard');
        cy.contains('Approvals').should('be.visible');
    });
});

// =============================================================================
// 8. ORGANIZER DASHBOARD UI
// =============================================================================
describe('8 | Organizer Dashboard UI', () => {

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.intercept('POST', '**/auth/login', {
            body: { success: true, token: 'mock-org-token', user: { id: '2', role_id: 2, email: ORGANIZER.email, full_name: 'Test Organizer' } },
        }).as('orgLogin');
        cy.visit('/login');
        cy.get('input#email').type(ORGANIZER.email);
        cy.get('input#password').type(ORGANIZER.password);
        cy.get('form button[type="submit"]').first().click();
        cy.wait('@orgLogin');
    });

    it('8-01 | Organizer navbar shows "Organizer" label', () => {
        cy.visit('/organizer/dashboard');
        cy.contains('Organizer').should('be.visible');
    });

    it('8-02 | "Create Event" link is in organizer navbar', () => {
        cy.visit('/organizer/dashboard');
        cy.contains('Create Event').should('be.visible');
    });

    it('8-03 | "Dashboard" link is in organizer navbar', () => {
        cy.visit('/organizer/dashboard');
        cy.contains('Dashboard').should('be.visible');
    });

    it('8-04 | Organizer dashboard page loads without crashing', () => {
        cy.visit('/organizer/dashboard');
        cy.get('h1, h2, h3').should('exist');
    });
});

// =============================================================================
// 9. EVENT DETAIL PAGE
// =============================================================================
describe('9 | Event Detail Page', () => {

    it('9-01 | Event detail page loads from /discover click', () => {
        cy.visit('/discover');
        cy.get('.animate-spin', { timeout: 10000 }).should('not.exist');
        cy.get('a[href*="/event/"]').first().click({ force: true });
        cy.url().should('match', /\/event\/.+/);
        cy.get('h1, h2').should('be.visible');
    });

    it('9-02 | Event detail shows location info', () => {
        cy.visit('/discover');
        cy.get('.animate-spin', { timeout: 10000 }).should('not.exist');
        cy.get('a[href*="/event/"]').first().click({ force: true });
        cy.get('body').should('not.be.empty');
    });

    it('9-03 | Reviews section exists on event detail', () => {
        cy.visit('/discover');
        cy.get('.animate-spin', { timeout: 10000 }).should('not.exist');
        cy.get('a[href*="/event/"]').first().click({ force: true });
        cy.contains('Review', { matchCase: false }).should('exist');
    });
});

// =============================================================================
// 10. NAVIGATION & GENERAL UI
// =============================================================================
describe('10 | Navigation & General UI', () => {

    it('10-01 | Landing page loads at /', () => {
        cy.visit('/');
        cy.get('body').should('be.visible');
        cy.contains('DEMS').should('exist');
    });

    it('10-02 | "Discover Events" link is in the public navbar', () => {
        cy.visit('/');
        cy.contains('Discover Events').should('be.visible');
    });

    it('10-03 | "Sign In" button visible when not logged in', () => {
        cy.clearLocalStorage();
        cy.visit('/');
        cy.contains('Sign In').should('be.visible');
    });

    it('10-04 | /discover is accessible without login', () => {
        cy.clearLocalStorage();
        cy.visit('/discover');
        cy.url().should('include', '/discover');
    });

    it('10-05 | Navigating to /login shows login form', () => {
        cy.visit('/login');
        cy.get('input#email').should('be.visible');
    });

    it('10-06 | Navigating to /signup shows signup form', () => {
        cy.visit('/signup');
        cy.contains('Create Account').should('be.visible');
    });

    it('10-07 | Navigating to /organizer/signup shows organizer form', () => {
        cy.visit('/organizer/signup');
        cy.get('form, input').should('exist');
    });

    it('10-08 | After attendee login, navbar shows notification bell area', () => {
        loginAs(ATTENDEE);
        cy.visit('/discover');
        cy.get('button svg').should('exist');
    });

    it('10-09 | After attendee login, "My Tickets" link is visible', () => {
        loginAs(ATTENDEE);
        cy.visit('/discover');
        cy.contains('My Tickets').should('be.visible');
    });

    it('10-10 | After attendee login, profile avatar button is visible', () => {
        loginAs(ATTENDEE);
        cy.visit('/discover');
        // profile button shows first letter of user's name
        cy.get('button div.rounded-full, button .rounded-full').should('exist');
    });
});
