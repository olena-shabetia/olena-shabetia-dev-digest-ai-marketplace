#!/usr/bin/env bash
# Run in the CONSUMER project to move a plugin between release channels.
# Claude Code has no `plugin rollback` command: rollback is installing the same
# plugin from the pinned stable marketplace (see scripts/pin-stable.mjs).
#
#   scripts/switch-channel.sh <plugin> stable [--scope project]   roll back to the pinned release
#   scripts/switch-channel.sh <plugin> latest [--scope project]   return to the latest channel
#
# Environment overrides:
#   MARKETPLACE_REPO   GitHub owner/repo of the marketplace (required)
#   MARKETPLACE_NAME   latest-channel marketplace name (default: dev-digest-ai-marketplace)
set -euo pipefail

plugin="${1:?usage: switch-channel.sh <plugin> stable|latest [--scope project|user|local]}"
channel="${2:?usage: switch-channel.sh <plugin> stable|latest [--scope project|user|local]}"
scope="project"
[[ "${3:-}" == "--scope" ]] && scope="${4:?--scope needs a value}"

repo="${MARKETPLACE_REPO:?set MARKETPLACE_REPO=<owner>/<repo>}"
latest_mkt="${MARKETPLACE_NAME:-dev-digest-ai-marketplace}"
stable_mkt="${latest_mkt}-stable"

case "$channel" in
  stable) from="$latest_mkt"; to="$stable_mkt" ;;
  latest) from="$stable_mkt"; to="$latest_mkt" ;;
  *) echo "channel must be stable or latest" >&2; exit 2 ;;
esac

installed_version() {
  claude plugin list --json | jq -r --arg id "$plugin@$1" '.[] | select(.id == $id) | .version' | head -n1
}

echo "Before: $(installed_version "$from")${from:+ (from $from)}"

# Make sure the target marketplace is registered. Never `marketplace remove` the
# source channel: removing a marketplace also deletes its plugins' data.
if [[ "$to" == "$stable_mkt" ]]; then
  claude plugin marketplace add "${repo}#stable" --scope "$scope"
fi
claude plugin marketplace update "$to"

# Both channels ship the same plugin name, so skills would share one namespace.
# Uninstall the old copy first; --keep-data preserves ~/.claude/plugins/data/.
if claude plugin uninstall "$plugin@$from" --scope "$scope" --keep-data 2>/dev/null; then
  echo "Uninstalled $plugin@$from (data kept)"
fi

if ! claude plugin install "$plugin@$to" --scope "$scope"; then
  echo "Install from $to failed. Reinstall the previous copy with:" >&2
  echo "  claude plugin install $plugin@$from --scope $scope" >&2
  exit 1
fi

echo "After:  $(installed_version "$to") (from $to)"
claude plugin list --json | jq -r '.[] | select(.errors? and (.errors | length > 0)) | "WARNING: \(.id): \(.errors | join("; "))"'

cat <<EOF

Next:
  1. Start a new session or run /reload-plugins.
  2. Run the smoke eval for $plugin.
  3. Dependencies resolve inside the new marketplace. If old dependency copies
     remain from $from, remove them: claude plugin uninstall <dep>@$from --scope $scope --keep-data
EOF
