# SoundCloud DRM Replay Fix for Firefox
<!-- shields -->
[![Greasy Fork installs](https://img.shields.io/greasyfork/dt/605312?style=flat-square&label=Greasy%20Fork%20installs)][greasyfork_url]
[![GitHub License](https://img.shields.io/github/license/155aa/fix_soundcloud_firefox?style=flat-square)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/155aa/fix_soundcloud_firefox?style=flat-square)](https://github.com/155aa/fix_soundcloud_firefox/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/155aa/fix_soundcloud_firefox?style=flat-square)](https://github.com/155aa/fix_soundcloud_firefox/issues)
<!-- end shields -->

Fixes DRM-protected SoundCloud tracks **stalling after initial playback** in Firefox on Windows.

----
## Install

1. Install a userscript manager:
   * Firefox: [Violentmonkey][firefox_violentmonkey] or [Tampermonkey][firefox_tampermonkey]

1. Install the script:
   [![][greasyfork_icon]][greasyfork_url] or [install directly from GitHub][raw_url]

1. Reload SoundCloud.

To check it's running: the Violentmonkey icon shows a badge on soundcloud.com, and the browser console (F12) shows `[sc-fix]` messages whenever the fix kicks in.

----
## Who needs this?

| Setup | Affected? |
|---|---|
| Firefox on Windows | ✅ |
| Firefox on Linux | ❌ Not affected, script does nothing harmful but isn't needed |
| Chrome / Edge / Brave | ❌ Not affected |

Only DRM-protected tracks are affected. SoundCloud started encrypting Tracks May 2026 but screwed up the implementation, I reported the bug months ago but it remains unfixed. 

----
## How it works

SoundCloud's player is built on [hls.js](https://github.com/video-dev/hls.js). For DRM tracks, hls.js creates one Widevine `MediaKeys` object, caches it, and attaches it to whatever `<audio>` element is currently playing.

When you skip a track, SoundCloud throws away that audio element and hls.js tries to detach the keys with `setMediaKeys(null)`. **Firefox on Windows refuses** (`NotSupportedError`), which the [EME spec explicitly allows](https://www.w3.org/TR/encrypted-media/#dom-htmlmediaelement-setmediakeys). hls.js ignores the failure, so the keys stay stuck on the dead element.

When you go back, SoundCloud hands hls.js a *new* audio element, hls.js tries to attach the same cached keys, and Firefox correctly refuses again: `MediaKeys object is already bound to another HTMLMediaElement`. No keys means no decryption, so the player aborts and stalls silently.

**The fix:** the script wraps `setMediaKeys`. It always tries the normal attach first; only if Firefox refuses, it gives the new element its own `MediaKeys` and transparently routes hls.js's session calls to them. hls.js keeps thinking it's using its cached object; the element actually gets keys that aren't stuck anywhere else.

If SoundCloud or Firefox ever fix this, the normal attach succeeds and the script does nothing.

----
## FAQ

#### It still breaks for me
Open an [issue][issues] and include:
- Firefox version and OS
- The browser console output (F12 → Console) after reproducing: play a DRM track, skip, go back
- Whether you see any `[sc-fix]` lines

#### Does this bypass DRM?
No. It doesn't touch encryption, licenses, or the audio. Tracks are still decrypted by Widevine exactly as SoundCloud intends; the script only fixes how the key object gets attached to the player.

#### Is it safe?
It's ~40 lines, has no network access, no `@grant` permissions, and only runs on `soundcloud.com`.

----
### Found a bug?
File an [issue][issues] with the info listed above.

### Upstream
The root cause should really be fixed in SoundCloud's player / hls.js (handle a rejected `setMediaKeys(null)` instead of reusing the stuck `MediaKeys`). If you're a SoundCloud dev: hi can u fix this pls it's about 20 lines 😅😅😅😅😅😅

----
#### DISCLAIMER

> THE SOFTWARE AND ALL INFORMATION HERE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Not affiliated with SoundCloud or Mozilla. Licensed under [MIT](./LICENSE).


<!-- links -->
  [issues]: https://github.com/155aa/fix_soundcloud_firefox/issues
  [greasyfork_icon]: https://user-images.githubusercontent.com/3372598/166113712-1bc3d654-1342-4f1e-9845-21c3b21524b1.png

<!-- Extensions -->
  [firefox_violentmonkey]: https://addons.mozilla.org/firefox/addon/violentmonkey/
  [firefox_tampermonkey]: https://addons.mozilla.org/firefox/addon/tampermonkey/

<!-- Download links -->
  [greasyfork_url]: <https://greasyfork.org/en/scripts/605312> "Get it from Greasy Fork"
  [raw_url]: https://raw.githubusercontent.com/155aa/fix_soundcloud_firefox/refs/heads/main/soundcloud-drm-fix.user.js
