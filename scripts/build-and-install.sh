#!/bin/bash

# MD Viewer - One-Click Build and Install
# This script builds everything from scratch and installs to /Applications

set -e

echo "🚀 MD Viewer - One-Click Build and Install"
echo "=========================================="
echo ""

# 1. Build Server binary
echo "Step 1/2: Building Server binary..."
./scripts/build-server-for-xcode.sh
echo ""

# 2. Build and install App
echo "Step 2/2: Building and installing App..."
./scripts/build/build_app_bundle.sh --install --skip-dmg
echo ""

echo "✅ All done!"
echo ""
echo "🎉 MD Viewer has been installed to /Applications"
echo "🚀 Launch with: open -a 'MD Viewer'"
