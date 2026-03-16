#!/bin/bash

# Test code signing configuration
# This script helps verify your signing setup

set -e

echo "🔍 Checking code signing configuration..."
echo ""

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/build/config.sh"

echo ""
echo "📋 Available Certificates:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
security find-identity -v -p codesigning
echo ""

if [ -n "$DEVELOPER_CERT" ]; then
    echo "✅ Selected Certificate:"
    echo "   $DEVELOPER_CERT"
    echo ""

    # Test signing a dummy file
    echo "🧪 Testing code signing..."
    TEST_FILE=$(mktemp)
    echo "test" > "$TEST_FILE"

    if codesign --force --sign "$DEVELOPER_CERT" "$TEST_FILE" 2>/dev/null; then
        echo "   ✅ Code signing works!"

        # Verify the signature
        if codesign --verify --verbose "$TEST_FILE" 2>/dev/null; then
            echo "   ✅ Signature verification works!"
        else
            echo "   ⚠️  Signature verification failed"
        fi
    else
        echo "   ❌ Code signing failed"
        echo "   Try using --ad-hoc flag when building"
    fi

    rm -f "$TEST_FILE"
else
    echo "⚠️  No certificate found"
    echo ""
    echo "💡 Options:"
    echo "   1. Use --ad-hoc flag when building (no certificate needed)"
    echo "   2. Install a developer certificate from Apple Developer portal"
    echo "   3. Set DEVELOPER_CERT environment variable manually"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Your certificate details:"
echo "   Certificate: ${DEVELOPER_CERT:-"(none)"}"
echo "   Bundle ID: $BUNDLE_ID"
echo "   App Name: $APP_NAME"
echo ""
echo "🚀 Ready to build:"
echo "   ./scripts/build-and-install.sh"
