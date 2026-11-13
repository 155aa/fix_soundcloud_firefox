// ==UserScript==
// @name         SoundCloud DRM replay fix for Firefox
// @namespace    https://github.com/155aa
// @version      1.0.0
// @description  Fixes DRM-protected SoundCloud tracks failing to play after initial play on Firefox for Windows
// @license      MIT
// @match        https://soundcloud.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(() => {
  const createMK = MediaKeySystemAccess.prototype.createMediaKeys;
  const setMK = HTMLMediaElement.prototype.setMediaKeys;
  const mkCreateSession = MediaKeys.prototype.createSession;
  const mkSetCert = MediaKeys.prototype.setServerCertificate;
  const accessOf = new WeakMap(); // MediaKeys -> access object that made it
  const target = new WeakMap();   // hls.js's MediaKeys -> MediaKeys actually bound to the current element

  MediaKeySystemAccess.prototype.createMediaKeys = function () {
    return createMK.call(this).then(mk => {
      accessOf.set(mk, this);
      mk.createSession = (...a) => mkCreateSession.apply(target.get(mk) || mk, a);
      mk.setServerCertificate = (...a) => mkSetCert.apply(target.get(mk) || mk, a);
      return mk;
    });
  };

  HTMLMediaElement.prototype.setMediaKeys = async function (keys) {
    if (keys === null) {
      return setMK.call(this, null).catch(e => console.warn('[sc-fix] detach refused (ignored):', e.message));
    }
    try {
      await setMK.call(this, keys);   // normal case: works, no redirect
      target.delete(keys);
    } catch (e) {
      if (!accessOf.has(keys)) throw e;
      // keys are stuck on another element: give this element its own keys (reuse if it already has some)
      let own = this.mediaKeys;
      if (!own) {
        own = await createMK.call(accessOf.get(keys));
        await setMK.call(this, own);
      }
      target.set(keys, own);
      console.warn('[sc-fix] using separate MediaKeys for this element');
    }
  };
})();
