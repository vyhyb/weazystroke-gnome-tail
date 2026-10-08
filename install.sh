#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UUID="weazystroke-gnome-tail@weazystroke"

"$SCRIPT_DIR/package.sh"
gnome-extensions install --force "$SCRIPT_DIR/$UUID.shell-extension.zip"
if gnome-extensions info "$UUID" >/dev/null 2>&1; then
	gnome-extensions enable "$UUID"
	printf 'Installed and enabled %s.\n' "$UUID"
else
	printf 'Installed %s. Log out and back in, then run: gnome-extensions enable %s\n' \
		"$UUID" "$UUID"
fi
