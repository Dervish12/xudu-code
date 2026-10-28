#!/usr/bin/env bash
# Build, sign and package a xudu-code release into dist/release/<version>.
#
#   script/release.sh 1.2.0
#
# Environment:
#   XUDU_RELEASE_KEY          Ed25519 private key (ssh-keygen format) that signs every checksum file. Required; its
#                             public half is embedded in the installers.
#   XUDU_MACOS_IDENTITY       Optional "Developer ID Application: …" identity. Signs the macOS binaries with the
#                             hardened runtime.
#   XUDU_NOTARY_PROFILE       Optional notarytool keychain profile. Notarizes the signed macOS binaries.
#   XUDU_WINDOWS_SIGN         Optional command that Authenticode-signs a file, called with the .exe path as its last
#                             argument (for example a jsign or signtool invocation).
set -euo pipefail

version="${1:?usage: script/release.sh <version>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
key="${XUDU_RELEASE_KEY:?set XUDU_RELEASE_KEY to the release signing key}"
out="$root/dist/release/$version"
dist="$root/packages/cli/dist"

(cd "$root/packages/cli" && rm -rf dist && XUDU_CHANNEL=xudu XUDU_VERSION="$version" bun run script/build.ts)

if [ -n "${XUDU_MACOS_IDENTITY:-}" ]; then
  for target in darwin-arm64 darwin-x64; do
    binary="$dist/cli-$target/bin/xudu-code"
    codesign --force --options runtime --timestamp \
      --entitlements "$root/packages/cli/script/signing/entitlements.plist" \
      --sign "$XUDU_MACOS_IDENTITY" "$binary"
    if [ -n "${XUDU_NOTARY_PROFILE:-}" ]; then
      ditto -c -k --keepParent "$binary" "$binary.zip"
      xcrun notarytool submit "$binary.zip" --keychain-profile "$XUDU_NOTARY_PROFILE" --wait
      rm "$binary.zip"
    fi
  done
fi

if [ -n "${XUDU_WINDOWS_SIGN:-}" ]; then
  # shellcheck disable=SC2086
  $XUDU_WINDOWS_SIGN "$dist/cli-windows-x64/bin/xudu-code.exe"
fi

rm -rf "$out"
mkdir -p "$out"
for target in darwin-arm64 darwin-x64 linux-arm64 linux-x64; do
  tar -czf "$out/xudu-code-$target.tar.gz" -C "$dist/cli-$target/bin" xudu-code
done
(cd "$dist/cli-windows-x64/bin" && zip -q -X "$out/xudu-code-windows-x64.zip" xudu-code.exe)

cd "$out"
for archive in *.tar.gz *.zip; do
  shasum -a 256 "$archive" > "$archive.sha256"
  ssh-keygen -q -Y sign -f "$key" -n xudu-code "$archive.sha256"
done
ls -l "$out"
