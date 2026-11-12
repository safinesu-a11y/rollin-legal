(() => {
  'use strict';
  // Invite tokens use the same UUID format as the app's join screen.
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  const match = window.location.pathname.match(new RegExp(`^/join/(${uuid})/?$`, 'i'));
  if (match) {
    // GitHub Pages serves 404.html for dynamic paths. Move to a real page,
    // keeping the token in the fragment so it is not sent in a second request.
    window.location.replace(`/join/#token=${encodeURIComponent(match[1])}`);
    return;
  }
  const userAgent = navigator.userAgent;
  const googlePlay = document.getElementById('google-play');
  const appStore = document.getElementById('app-store');
  if (googlePlay) googlePlay.hidden = !/Android/i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);
  if (appStore) appStore.hidden = /Android/i.test(userAgent);
  const button = document.getElementById('open-app');
  if (!button) return;
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (token && new RegExp(`^${uuid}$`, 'i').test(token)) {
    button.href = `rollin://join/${encodeURIComponent(token)}`;
    button.hidden = false;
  } else {
    document.getElementById('invalid').hidden = false;
  }
})();
