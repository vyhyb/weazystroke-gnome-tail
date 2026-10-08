# WeazyStroke GNOME Tail: Agent Context

## Purpose

This is a GNOME Shell extension derived from the `LaneSun/mouse-tail` renderer. It draws a cursor trail on GNOME Shell's UI layer while the WeazyStroke trigger is held. It is a companion to the WeazyStroke daemon, not a replacement for it.

This folder is intended to become a standalone repository later. Runtime files are included here; the sibling `_mouse-tail` checkout is for upstream reference only and is not a runtime dependency. Do not move this folder or initialize a separate Git repository unless the user asks.

## Compatibility and Rendering

- Current development target: GNOME Shell 50.5 on Wayland.
- `metadata.json` currently declares Shell 47 through 51.
- Add the overlay actor to `Main.uiGroup`, not directly to `global.stage`; use `Main.uiGroup` for stacking and cleanup too.
- Use `global.get_pointer()` to poll `[x, y, modifierMask]`. In this environment, `Meta.CursorTracker.get_pointer()` did not provide usable behavior for the trail.
- The trail is rendered by `St.DrawingArea` and `trailRender.js`.
- Keep the renderer non-reactive so normal pointer interaction passes through.

## WeazyStroke Trigger

- Trigger mode is stored in GSettings as `trigger-mode`: `weazystroke` (default), `own`, or `none`.
- In WeazyStroke mode, read `trigger_button` and `trigger_modifiers` from `${XDG_CONFIG_HOME:-~/.config}/easystroke-wayland/gestures.json` via `weazystrokeConfig.js`.
- If that file is missing or invalid in WeazyStroke mode, use Ctrl as the fallback trigger.
- Own mode uses GSettings `own-trigger-button` (supported choices 1–3) and `own-trigger-modifiers` (bitmask).
- No-trigger mode samples and draws on every pointer movement.
- Modifier bits are Ctrl=1, Alt=2, Shift=4, Super=8.
- GNOME's global pointer mask exposes button masks 1 through 5. This machine reports a physical right-button event (`BTN_RIGHT`) as `BUTTON2_MASK`; the matcher therefore accepts either `BUTTON3_MASK` or `BUTTON2_MASK` for WeazyStroke button 3. This can also make middle-click activate the trail on affected systems.
- WeazyStroke side buttons 8 and 9 are not supported by the current GNOME pointer-mask implementation.
- Preferences show whether the config was found/valid and the effective trigger. Config is read when the extension is enabled; disable and re-enable after changing trigger settings.

## Defaults

Factory defaults are a 600 ms fade, 8 px line width, and 0.9 opacity. The Basic preset is fully opaque. Existing saved style choices are preserved and may override factory defaults.

## Development Checks

Run from this directory:

```bash
glib-compile-schemas --strict schemas
node tests/test-style-engine.mjs
gjs -m tests/integration-test.mjs
gjs -m tests/test-weazystroke-config.mjs
node --input-type=module --check < extension.js
node --input-type=module --check < prefs.js
node --input-type=module --check < weazystrokeConfig.js
bash -n install.sh package.sh
./package.sh
```

`package.sh` uses `gnome-extensions pack` and explicitly includes imported modules as extra sources.

## Install and Test

`./install.sh` builds, installs, and enables the extension per-user. Check it with:

```bash
gnome-extensions info weazystroke-gnome-tail@vyhyb.github.io
```

On Wayland, a newly installed UUID may not be discovered until logout/login. For trigger testing, keep the WeazyStroke daemon running, hold the configured trigger while moving the pointer, and check the History tab/file if the trail stays invisible.

## Upstream and Licensing

The current upstream Mouse Tail project is `https://github.com/LaneSun/mouse-tail`; inspect `_mouse-tail` for reference only. This extension retains Mouse Tail's GPL-3.0 license. `Hati Cursor Highlighter` and `JiggleWiggle` are useful references for GNOME-native rendering and pointer polling; prefer their public APIs and patterns over adding stage event handlers for app-window clicks.
