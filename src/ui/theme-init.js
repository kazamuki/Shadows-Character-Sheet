/*
 * Sets html[data-theme] from localStorage before shadows.css loads, so the
 * page never flashes dark-then-light (or light-then-dark) on open. Must stay
 * a plain blocking <script> — no async/defer — and sit before the shadows.css
 * <link> in index.html; that ordering is the whole point (Decision 90).
 *
 * localStorage is per-origin, so this remembers a choice on this file's
 * origin only. Opened from file://, that's per-folder, same as every other
 * localStorage-backed preference this app already keeps (Decision 40).
 */
(function () {
  try {
    var stored = localStorage.getItem("shadows.theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    /* localStorage unavailable (privacy mode, etc.) — falls back to dark */
  }
})();
