import Gio from "gi://Gio";
import GLib from "gi://GLib";
import System from "system";

import {
  describeTrigger,
  getWeazyStrokeConfigPath,
  readWeazyStrokeTrigger,
  resolveTrigger,
  triggerStateMatches,
} from "../weazystrokeConfig.js";

let failed = 0;
const check = (name, condition) => {
  console.log(`  ${condition ? "ok" : "FAIL"}  ${name}`);
  if (!condition) failed++;
};

const configHome = GLib.dir_make_tmp("weazystroke-gnome-tail-XXXXXX");
GLib.setenv("XDG_CONFIG_HOME", configHome, true);

const fallback = readWeazyStrokeTrigger();
check("missing config reports not found", !fallback.found);
check("missing config uses Ctrl", describeTrigger(fallback) === "Ctrl");

const configDir = GLib.build_filenamev([configHome, "easystroke-wayland"]);
GLib.mkdir_with_parents(configDir, 0o700);
const configFile = Gio.File.new_for_path(getWeazyStrokeConfigPath());
configFile.replace_contents(
  new TextEncoder().encode(JSON.stringify({ trigger_button: 3, trigger_modifiers: 5 })),
  null,
  false,
  Gio.FileCreateFlags.NONE,
  null,
);

const configured = readWeazyStrokeTrigger();
check("valid config is detected", configured.found && configured.valid);
check(
  "button and modifiers are mapped",
  describeTrigger(configured) === "Ctrl + Shift + Right button",
);
check(
  "WeazyStroke mode inherits its trigger",
  resolveTrigger("weazystroke", configured, 1, 0) === configured,
);
const ownTrigger = resolveTrigger("own", configured, 1, 3);
check("Own mode uses its button and modifiers", describeTrigger(ownTrigger) === "Ctrl + Alt + Left button");
const noTrigger = resolveTrigger("none", configured, 1, 0);
check("No-trigger mode is described", describeTrigger(noTrigger) === "Always on");

const buttonMasks = {
  1: 1 << 8,
  2: 1 << 9,
  3: [1 << 10, 1 << 9],
  4: 1 << 11,
  5: 1 << 12,
};
const modifierMasks = { 1: 1 << 2, 2: 1 << 3, 4: 1 << 0, 8: 1 << 26 };
const rightCtrlShift = buttonMasks[3][0] | modifierMasks[1] | modifierMasks[4];
check(
  "right button with configured modifiers activates",
  triggerStateMatches(configured, rightCtrlShift, buttonMasks, modifierMasks),
);
check(
  "missing required modifier does not activate",
    !triggerStateMatches(configured, buttonMasks[3][0] | modifierMasks[1], buttonMasks, modifierMasks),
);
check(
  "observed GNOME right-button alias activates",
  triggerStateMatches(
    configured,
    buttonMasks[3][1] | modifierMasks[1] | modifierMasks[4],
    buttonMasks,
    modifierMasks,
  ),
);
check(
  "another button does not activate trigger",
  !triggerStateMatches(
    configured,
    buttonMasks[1] | modifierMasks[1] | modifierMasks[4],
    buttonMasks,
    modifierMasks,
  ),
);
check(
  "Ctrl fallback follows pointer state",
  triggerStateMatches(fallback, modifierMasks[1], buttonMasks, modifierMasks) &&
    !triggerStateMatches(fallback, 0, buttonMasks, modifierMasks),
);
check(
  "No-trigger mode matches without pointer state",
  triggerStateMatches(noTrigger, 0, buttonMasks, modifierMasks),
);
check(
  "unsupported side buttons do not activate",
  !triggerStateMatches(
    { mode: "button", button: 8, modifiers: 0 },
    rightCtrlShift,
    buttonMasks,
    modifierMasks,
  ),
);

configFile.replace_contents(
  new TextEncoder().encode("{"),
  null,
  false,
  Gio.FileCreateFlags.NONE,
  null,
);
const invalid = readWeazyStrokeTrigger();
check("invalid config is reported", invalid.found && !invalid.valid);
check("invalid config falls back to Ctrl", describeTrigger(invalid) === "Ctrl");

configFile.delete(null);
GLib.rmdir(configDir);
GLib.rmdir(configHome);

console.log(failed === 0 ? "\nCONFIG TEST PASS" : `\n${failed} FAILED`);
System.exit(failed === 0 ? 0 : 1);