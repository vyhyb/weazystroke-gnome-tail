# WeazyStroke GNOME Tail

A GNOME Shell extension based on [Mouse Tail](https://github.com/LaneSun/mouse-tail). It draws the existing Mouse Tail trail only while the configured WeazyStroke trigger is held.

The extension was developed with the use of GitHub Copilot under supervision and locally tested. The extension is not affiliated with the upstream Mouse Tail project.

## Compatibility

The current upstream Mouse Tail code should have supported GNOME Shell 47 through 51, including GNOME 50's `Meta.CursorTracker` API. The plugin is tested on GNOME Shell 50.5 and includes the renderer locally; it does not depend on a sibling checkout at runtime.

## Trigger behavior

Choose one of three trigger modes in the [WeazyStroke](https://github.com/nine7nine/WeazyStroke) preferences page:

- **WeazyStroke** uses `trigger_button` and `trigger_modifiers` from:

```text
$XDG_CONFIG_HOME/easystroke-wayland/gestures.json
```

- **Own** uses the button and optional Ctrl/Alt/Shift/Super modifiers selected in the extension preferences.
- **No trigger** draws the fading trail whenever the pointer moves.

If `XDG_CONFIG_HOME` is unset, the extension checks `~/.config/easystroke-wayland/gestures.json`. In WeazyStroke mode, a missing or invalid file falls back to Ctrl. The preferences page reports whether the config was found and shows the active trigger.

Factory defaults use a 600 ms fade and 90% opacity. The Basic preset is fully opaque. Existing saved style choices are preserved.

The extension supports both daemon capture modes:

- **With WeazyStroke `--grab`:** The daemon suppresses the trigger button from the compositor so no context menu or accidental click occurs. When a stroke starts, the daemon emits a `StrokeActive` signal on the session D-Bus (`org.weazystroke.Daemon`, `/org/weazystroke/Daemon`). The extension listens to this signal for stroke activation while tracking pointer coordinates from Mutter. Side buttons (buttons 8 and 9) work seamlessly through this signal path.
- **Without `--grab` (polling fallback):** Trigger state is polled from Mutter's global pointer state. On the tested setup, Mutter reports a physical right-button press with `BUTTON2_MASK`; the configured right trigger accepts that mask as a compatibility fallback. Side buttons (8 and 9) cannot be detected in this polling fallback mode.

The config is read when the extension is enabled. Disable and re-enable the extension after changing WeazyStroke's trigger settings in polling mode (in `--grab` mode, D-Bus activation works automatically).

## Install

From this directory:

```bash
./install.sh
```

Or build the extension bundle manually:

```bash
./package.sh
```

On Wayland, log out and back in if GNOME Shell does not load the extension immediately. Open the extension preferences to see the config-detection status.

## GNOME notes

GNOME Shell renders the trail directly, avoiding the `wlr-layer-shell` overlay used by the WeazyStroke daemon. This extension does not replace the gesture daemon; keep WeazyStroke running for gesture recognition and actions.

## Development checks

```bash
glib-compile-schemas --strict schemas
node tests/test-style-engine.mjs
gjs -m tests/integration-test.mjs
gjs -m tests/test-weazystroke-config.mjs
./package.sh
```

The style renderer and preferences are derived from Mouse Tail and retain its GPL-3.0 license; see `LICENSE`.
```