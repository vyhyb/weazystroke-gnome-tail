import Gio from "gi://Gio";
import GLib from "gi://GLib";

export function getWeazyStrokeConfigPath() {
  const configHome =
    GLib.getenv("XDG_CONFIG_HOME") ||
    GLib.build_filenamev([GLib.get_home_dir(), ".config"]);
  return GLib.build_filenamev([
    configHome,
    "easystroke-wayland",
    "gestures.json",
  ]);
}

function ctrlFallback(path, found, error = "") {
  return { found, valid: false, path, mode: "key", key: "ctrl", error };
}

export function readWeazyStrokeTrigger() {
  const path = getWeazyStrokeConfigPath();
  const file = Gio.File.new_for_path(path);
  if (!file.query_exists(null)) return ctrlFallback(path, false);

  try {
    const [ok, contents] = file.load_contents(null);
    if (!ok) throw new Error("could not read config");
    const config = JSON.parse(new TextDecoder("utf-8").decode(contents));
    const button = config.trigger_button;
    const modifiers = config.trigger_modifiers ?? 0;
    if (
      !Number.isInteger(button) ||
      button < 1 ||
      button > 32 ||
      !Number.isInteger(modifiers) ||
      modifiers < 0 ||
      modifiers > 15
    ) {
      throw new Error("invalid trigger settings");
    }
    return { found: true, valid: true, path, mode: "button", button, modifiers };
  } catch (error) {
    return ctrlFallback(path, true, error.message);
  }
}

export function describeTrigger(trigger) {
  if (trigger?.mode === "none") return "Always on";
  if (!trigger.found || !trigger.valid) return "Ctrl";

  const buttonNames = {
    1: "Left button",
    2: "Middle button",
    3: "Right button",
    8: "Back button",
    9: "Forward button",
  };
  const button = buttonNames[trigger.button] ?? `Button ${trigger.button}`;
  const modifiers = [];
  if (trigger.modifiers & 1) modifiers.push("Ctrl");
  if (trigger.modifiers & 2) modifiers.push("Alt");
  if (trigger.modifiers & 4) modifiers.push("Shift");
  if (trigger.modifiers & 8) modifiers.push("Super");
  return [...modifiers, button].join(" + ");
}

export function resolveTrigger(mode, inherited, ownButton, ownModifiers) {
  if (mode === "none") return { mode: "none" };
  if (mode === "own") {
    return {
      found: true,
      valid: true,
      mode: "button",
      button: ownButton,
      modifiers: ownModifiers,
    };
  }
  return inherited;
}

export function triggerStateMatches(trigger, state, buttonMasks, modifierMasks) {
  if (!trigger) return false;
  if (trigger.mode === "none") return true;
  if (trigger.mode === "key")
    return (state & modifierMasks[trigger.key === "ctrl" ? 1 : 0]) !== 0;

  const buttonMask = buttonMasks[trigger.button];
  const buttonMaskAlternatives = Array.isArray(buttonMask) ? buttonMask : [buttonMask];
  if (!buttonMaskAlternatives.some((mask) => mask !== undefined && (state & mask) !== 0))
    return false;
  return [1, 2, 4, 8].every(
    (bit) => !(trigger.modifiers & bit) || (state & modifierMasks[bit]) !== 0,
  );
}