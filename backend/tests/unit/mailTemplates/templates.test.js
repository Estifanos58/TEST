const { renderBaseTemplate, escapeHtml } = require('../../../mail_templates/baseTemplate');
const userRegistration = require('../../../mail_templates/userRegistration');

describe('mail templates (unit)', () => {
  test('escapeHtml properly escapes dangerous characters', () => {
    const raw = '<a & b>"\'';
    const escaped = escapeHtml(raw);

    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#39;');
  });

  test('renderBaseTemplate includes heading, intro and CTA', () => {
    const html = renderBaseTemplate({
      preheader: 'pre',
      heading: '<Heading>',
      intro: '<Intro>',
      bodyHtml: '<div>body</div>',
      ctaLabel: 'Click',
      ctaUrl: 'https://example.com',
      supportEmail: 'help@example.com'
    });

    expect(html).toContain('Click');
    expect(html).toContain('https://example.com');
    expect(html).toContain('&lt;Heading&gt;');
  });

  test('userRegistration template returns subject, text and html and uses payload', () => {
    const payload = { fullName: '<Test User>', discoverUrl: 'https://example.com/discover' };
    const out = userRegistration(payload);

    expect(out).toHaveProperty('subject');
    expect(out).toHaveProperty('text');
    expect(out).toHaveProperty('html');
    expect(out.subject).toMatch(/Welcome to DEMS/i);
    expect(out.text).toContain(payload.fullName.replace(/<|>/g, ''));
    expect(out.html).toContain('Explore Events');
    expect(out.html).toContain(payload.discoverUrl);
  });
});
