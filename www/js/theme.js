// Theme of the web pages: "auto" follows the light/dark setting of the system,
// "light" and "dark" override it. The choice is stored per browser and shared
// by all pages (including the pages in the iframe of the home page).
// Load it in <head>, before the page is drawn, to avoid a flash of the
// wrong theme.
(function() {
	var KEY = 'adsb-box-theme';
	var THEMES = ['auto', 'light', 'dark'];
	var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

	function get() {
		var t = null;
		try { t = window.localStorage.getItem(KEY); } catch (e) { /* storage disabled */ }
		return THEMES.indexOf(t) >= 0 ? t : 'auto';
	}

	// the theme in use: "light" or "dark"
	function effective() {
		var t = get();
		if (t !== 'auto') return t;
		return media && media.matches ? 'dark' : 'light';
	}

	function apply() {
		var t = get();
		// Bulma 1.0 follows prefers-color-scheme unless data-theme is set
		if (t === 'auto') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', t);
		}
		document.dispatchEvent(new CustomEvent('adsb-themechange', { detail: { theme: t, effective: effective() } }));
	}

	function set(t) {
		if (THEMES.indexOf(t) < 0) return;
		try { window.localStorage.setItem(KEY, t); } catch (e) { /* storage disabled */ }
		apply();
	}

	// another page (e.g. the home page around an iframe) changed the theme
	window.addEventListener('storage', function(e) {
		if (e.key === KEY) apply();
	});
	// the system setting changed
	if (media) {
		var onChange = function() { if (get() === 'auto') apply(); };
		if (media.addEventListener) media.addEventListener('change', onChange);
		else if (media.addListener) media.addListener(onChange);
	}

	window.adsbTheme = { get: get, set: set, effective: effective, THEMES: THEMES };
	apply();
})();
