const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('join/invite.js', 'utf8');
const token = '12345678-1234-4123-8123-123456789abc';
function run(pathname, hash = '', landing = true) {
  let redirect;
  const elements = { 'open-app': { hidden: true }, invalid: { hidden: true } };
  vm.runInNewContext(source, {
    window: { location: { pathname, hash, replace: value => { redirect = value; } } },
    document: { getElementById: id => landing ? elements[id] : null },
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
assert.ok(fs.readFileSync('join/index.html', 'utf8').includes('https://apps.apple.com/app/id6829111522'));
console.log('Invite fallback, invalid input, AASA and .nojekyll checks passed.');
