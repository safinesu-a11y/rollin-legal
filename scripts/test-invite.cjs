const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('join/invite.js', 'utf8');
const token = '12345678-1234-4123-8123-123456789abc';
function run(pathname, hash = '', landing = true, userAgent = '') {
  let redirect;
  const elements = { 'open-app': { hidden: true }, invalid: { hidden: true }, 'google-play': { hidden: false }, 'app-store': { hidden: false } };
  vm.runInNewContext(source, {
    window: { location: { pathname, hash, replace: value => { redirect = value; } } },
    document: { getElementById: id => landing ? elements[id] : null },
    navigator: { userAgent },
    URLSearchParams, encodeURIComponent,
  });
  return { redirect, elements };
}
for (const suffix of ['', '/']) {
  assert.equal(run(`/join/${token}${suffix}`, '', false).redirect, `/join/#token=${token}`);
}
const landing = run('/join/', `#token=${token}`);
assert.equal(landing.elements['open-app'].href, `rollin://join/${token}`);
assert.equal(landing.elements['open-app'].hidden, false);
for (const bad of ['', 'javascript:alert(1)', `${token}/extra`, `${token}?x=1`, '<script>']) {
  const result = run('/join/', `#token=${encodeURIComponent(bad)}`);
  assert.equal(result.elements['open-app'].hidden, true);
  assert.equal(result.elements.invalid.hidden, false);
}
for (const path of ['/missing', '/join/bad', `/join/${token}/extra`]) {
  assert.equal(run(path, '', false).redirect, undefined);
}
assert.ok(fs.readFileSync('404.html', 'utf8').includes('<script src="/join/invite.js" defer></script>'));
assert.ok(fs.existsSync('.nojekyll'));
const association = JSON.parse(fs.readFileSync('.well-known/apple-app-site-association', 'utf8'));
assert.equal(association.applinks.details[0].appID, '8WRNZTCFTU.com.rollindevelop.Rollin');
assert.deepEqual(association.applinks.details[0].paths, ['/join/*']);
const html = fs.readFileSync('join/index.html', 'utf8');
for (const [id, url] of [
  ['google-play', 'https://play.google.com/store/apps/details?id=com.rollindevelop.Rollin'],
  ['app-store', 'https://apps.apple.com/app/id6829111522'],
]) {
  const tag = html.match(new RegExp(`<a id="${id}"[^>]*>`))[0];
  assert.ok(tag.includes(`href="${url}"`));
  assert.ok(tag.includes('class="button"'));
  assert.ok(!/\bhidden\b/.test(tag), `${id} is visible without JavaScript`);
}
assert.ok(html.indexOf('id="google-play"') < html.indexOf('id="app-store"'));
assert.ok(html.includes('Google Playで入手 / Get it on Google Play'));
for (const [userAgent, googleHidden, appleHidden] of [
  ['Mozilla/5.0 (Linux; Android 15; Pixel 9)', false, true],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', true, false],
  ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', true, false],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false, false],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', false, false],
  ['', false, false],
  ['unknown', false, false],
]) {
  for (const hash of ['', `#token=${token}`]) {
    const result = run('/join/', hash, true, userAgent);
    assert.equal(result.elements['google-play'].hidden, googleHidden, userAgent);
    assert.equal(result.elements['app-store'].hidden, appleHidden, userAgent);
    assert.equal(result.redirect, undefined);
    assert.equal(result.elements['open-app'].hidden, !hash);
  }
  assert.equal(run(`/join/${token}`, '', false, userAgent).redirect, `/join/#token=${token}`);
  assert.equal(run('/missing', '', false, userAgent).redirect, undefined);
}
console.log('Invite fallback, platform store buttons, no-JavaScript visibility, invalid input, AASA and .nojekyll checks passed.');
