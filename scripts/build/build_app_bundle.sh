#!/bin/bash

# MD Viewer App Bundle Builder
# Creates a distributable .app bundle
#
# Usage:
#   ./build_app_bundle.sh [options]
#
# Options:
#   --install      Install to /Applications (overwrites existing)
#   --skip-dmg     Skip DMG creation (faster build)
#   --ad-hoc       Use ad-hoc signing instead of developer certificate
#   --help         Show this help message

set -e

# Parse arguments
INSTALL_TO_APPLICATIONS=false
SKIP_DMG=false
USE_ADHOC_SIGN=false

for arg in "$@"; do
    case $arg in
        --install)
            INSTALL_TO_APPLICATIONS=true
            ;;
        --skip-dmg)
            SKIP_DMG=true
            ;;
        --ad-hoc)
            USE_ADHOC_SIGN=true
            ;;
        --help)
            cat << 'EOF'
MD Viewer App Bundle Builder

Usage:
  ./build_app_bundle.sh [options]

Options:
  --install      Install to /Applications (overwrites existing)
  --skip-dmg     Skip DMG creation (faster build)
  --ad-hoc       Use ad-hoc signing instead of developer certificate
  --help         Show this help message

Examples:
  ./build_app_bundle.sh                           # Build with DMG
  ./build_app_bundle.sh --install --skip-dmg      # Fast local install
  ./build_app_bundle.sh --ad-hoc                  # Use ad-hoc signing
EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Load local overrides if exists (not tracked in git)
if [ -f "$SCRIPT_DIR/config.local.sh" ]; then
    source "$SCRIPT_DIR/config.local.sh"
fi

echo "🔨 Building $APP_NAME.app..."
echo ""

# Derived paths
APP_BUNDLE="$DIST_DIR/$APP_NAME.app"
SERVER_DIR="dist-server/server"

# 0. Check prerequisites
echo "🔍 Step 0: Checking prerequisites..."
if [ ! -d "$SERVER_DIR" ]; then
    echo "  ❌ server/ not found at $SERVER_DIR"
    echo "  Please run: ./scripts/build-server-for-xcode.sh"
    exit 1
fi
echo "  ✓ server/ found"

# 1. Build in release mode
echo ""
echo "📦 Step 1: Building in release mode..."
swift build -c release
echo "  ✓ Build complete"

# 2. Create app bundle structure
echo ""
echo "📂 Step 2: Creating app bundle structure..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# 3. Copy executable
echo ""
echo "📋 Step 3: Copying executable..."
cp "$BUILD_DIR/$EXECUTABLE_NAME" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
echo "  ✓ Copied executable"

# 4. Copy server source
echo ""
echo "🚀 Step 4: Copying server source..."
cp -R "$SERVER_DIR" "$APP_BUNDLE/Contents/Resources/"
# 复制模型（可选）
if [ -d "dist-server/models" ]; then
    cp -R "dist-server/models" "$APP_BUNDLE/Contents/Resources/"
    echo "  ✓ Copied models"
fi
echo "  ✓ Copied server/"

# 5. Copy icon (if exists)
echo ""
echo "🎨 Step 5: Copying app icon..."
if [ -f "Resources/AppIcon.icns" ]; then
    cp "Resources/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/"
    echo "  ✓ Copied AppIcon.icns"
else
    echo "  ⚠️  AppIcon.icns not found (optional)"
fi

# 6. Create Info.plist
echo ""
echo "📄 Step 6: Creating Info.plist..."
cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>$APP_NAME</string>
	<key>CFBundleExecutable</key>
	<string>$APP_NAME</string>
	<key>CFBundleIdentifier</key>
	<string>$BUNDLE_ID</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$APP_NAME</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$VERSION</string>
	<key>CFBundleVersion</key>
	<string>$BUILD_NUMBER</string>
	<key>LSMinimumSystemVersion</key>
	<string>13.0</string>
	<key>NSHumanReadableCopyright</key>
	<string>$COPYRIGHT_TEXT</string>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
	<key>LSUIElement</key>
	<false/>
	<key>LSBackgroundOnly</key>
	<false/>
	<key>CFBundleIconFile</key>
	<string>AppIcon</string>
	<key>NSHighResolutionCapable</key>
	<true/>
	<key>CFBundleDocumentTypes</key>
	<array>
		<dict>
			<key>CFBundleTypeName</key>
			<string>Markdown Document</string>
			<key>CFBundleTypeRole</key>
			<string>Viewer</string>
			<key>LSHandlerRank</key>
			<string>Alternate</string>
			<key>LSItemContentTypes</key>
			<array>
				<string>net.daringfireball.markdown</string>
				<string>public.plain-text</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
EOF
echo "  ✓ Created Info.plist"

# 7. Code sign
echo ""
echo "✍️  Step 7: Code signing..."
if [ "$USE_ADHOC_SIGN" = true ]; then
    echo "  Using ad-hoc signing..."
    codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || echo "  ⚠️  Code signing failed (non-critical)"
else
    # Check if developer certificate exists
    if [ -n "$DEVELOPER_CERT" ] && security find-identity -v -p codesigning | grep -q "$DEVELOPER_CERT"; then
        echo "  Using Apple Development certificate..."
        codesign --force --deep --sign "$DEVELOPER_CERT" "$APP_BUNDLE" 2>/dev/null || {
            echo "  ⚠️  Developer certificate signing failed, falling back to ad-hoc"
            codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || echo "  ⚠️  Code signing failed"
        }
    else
        echo "  ⚠️  Developer certificate not found, using ad-hoc signing"
        codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || echo "  ⚠️  Code signing failed"
    fi
fi
echo "  ✓ Code signing complete"

# 8. Create DMG (optional)
if [ "$SKIP_DMG" = false ]; then
    echo ""
    echo "💿 Step 8: Creating DMG..."
    DMG_NAME="$DIST_DIR/MD-Viewer-$VERSION.dmg"
    rm -f "$DMG_NAME"

    # Create temporary directory for DMG contents
    DMG_TEMP="$DIST_DIR/dmg_temp"
    rm -rf "$DMG_TEMP"
    mkdir -p "$DMG_TEMP"

    # Copy app to temp directory
    cp -R "$APP_BUNDLE" "$DMG_TEMP/"

    # Create Applications symlink
    ln -s /Applications "$DMG_TEMP/Applications"

    # Create DMG
    hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_TEMP" -ov -format UDZO "$DMG_NAME" > /dev/null 2>&1
    rm -rf "$DMG_TEMP"

    if [ -f "$DMG_NAME" ]; then
        echo "  ✓ Created DMG"
    else
        echo "  ⚠️  DMG creation failed"
    fi
else
    echo ""
    echo "💿 Step 8: Skipping DMG creation (--skip-dmg)"
fi

# 9. Install to /Applications (optional)
if [ "$INSTALL_TO_APPLICATIONS" = true ]; then
    echo ""
    echo "📥 Step 9: Installing to /Applications..."

    # Kill running app and its server processes
    echo "  Stopping running instances..."
    pkill -x "$APP_NAME" 2>/dev/null || true
    pkill -f "server/src/server.ts --internal-server-mode" 2>/dev/null || true
    sleep 2

    # Remove old version
    if [ -d "/Applications/$APP_NAME.app" ]; then
        echo "  Removing old version..."
        rm -rf "/Applications/$APP_NAME.app"
    fi

    # Copy new version
    echo "  Copying to /Applications..."
    cp -R "$APP_BUNDLE" "/Applications/"

    echo "  ✓ Installed to /Applications/$APP_NAME.app"
    echo ""
    echo "🚀 Launch with: open -a '$APP_NAME'"
fi

# 10. Summary
echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Output files:"
echo "  App Bundle: $APP_BUNDLE"
if [ "$SKIP_DMG" = false ] && [ -f "$DMG_NAME" ]; then
    echo "  DMG:        $DMG_NAME"
fi
if [ "$INSTALL_TO_APPLICATIONS" = true ]; then
    echo "  Installed:  /Applications/$APP_NAME.app"
fi
echo ""
if [ "$INSTALL_TO_APPLICATIONS" = false ]; then
    echo "📋 Next steps:"
    echo "  1. Install: ./scripts/build/build_app_bundle.sh --install"
    echo "  2. Test: open '$APP_BUNDLE'"
    echo "  3. Distribute: Share the .app or .dmg file"
else
    echo "📋 Next steps:"
    echo "  1. Launch: open -a '$APP_NAME'"
    echo "  2. Or click the app in /Applications"
fi
echo ""
if [ "$USE_ADHOC_SIGN" = true ]; then
    echo "⚠️  Signing: Ad-hoc (permissions will reset on reinstall)"
else
    echo "✅ Signing: Apple Development certificate (permissions preserved)"
fi
echo ""
echo "💡 Quick commands:"
echo "  Fast rebuild + install:  ./scripts/build/build_app_bundle.sh --install --skip-dmg"
echo "  Show help:               ./scripts/build/build_app_bundle.sh --help"
echo ""
echo "🎉 Done!"
