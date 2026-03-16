#!/bin/bash

# Build Configuration
# This file contains project-specific settings

# App Information
export APP_NAME="MD Viewer"
export BUNDLE_ID="com.huanghao.MDViewer"
export EXECUTABLE_NAME="MDViewer"
export COPYRIGHT_TEXT="Copyright © 2026 Huang Hao. All rights reserved."

# Build Directories
export BUILD_DIR=".build/release"
export DIST_DIR="dist"

# Version
export VERSION="1.0.0"
export BUILD_NUMBER="1"

# Developer Certificate (auto-detected)
# The script will automatically find your first Apple Development certificate
# You can override by setting DEVELOPER_CERT environment variable
if [ -z "$DEVELOPER_CERT" ]; then
    # Try to find Apple Development certificate
    DEVELOPER_CERT=$(security find-identity -v -p codesigning | grep "Apple Development" | head -1 | sed -E 's/.*"(.*)"/\1/')

    # If not found, try Developer ID Application (for distribution)
    if [ -z "$DEVELOPER_CERT" ]; then
        DEVELOPER_CERT=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | sed -E 's/.*"(.*)"/\1/')
    fi

    export DEVELOPER_CERT
fi

# Log the certificate being used
if [ -n "$DEVELOPER_CERT" ]; then
    echo "📝 Using certificate: $DEVELOPER_CERT"
else
    echo "⚠️  No developer certificate found, will use ad-hoc signing"
fi
