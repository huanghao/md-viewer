#!/bin/bash

# Create App Icon from SVG
# Converts the favicon SVG to .icns format for macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESOURCES_DIR="$PROJECT_ROOT/Resources"
OUTPUT_ICNS="$RESOURCES_DIR/AppIcon.icns"

echo "🎨 Creating App Icon..."
echo ""

# Create temporary directory for icon generation
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Create SVG file
cat > "$TEMP_DIR/icon.svg" << 'EOF'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="512" fill="#3b82f6"/>
  <path d="M 288 352 L 288 672 L 352 672 L 352 464 L 512 624 L 672 464 L 672 672 L 736 672 L 736 352 L 512 592 Z" fill="white"/>
</svg>
EOF

echo "1️⃣  Created SVG icon"

# Check if we have iconutil (macOS built-in)
if ! command -v iconutil &> /dev/null; then
    echo "❌ iconutil not found (required on macOS)"
    exit 1
fi

# Create iconset directory
ICONSET_DIR="$TEMP_DIR/AppIcon.iconset"
mkdir -p "$ICONSET_DIR"

echo "2️⃣  Generating icon sizes..."

# Check if we have sips (macOS built-in) or ImageMagick
if command -v sips &> /dev/null; then
    # Use sips (built-in on macOS)
    CONVERTER="sips"
    echo "   Using sips (macOS built-in)"
elif command -v convert &> /dev/null; then
    # Use ImageMagick
    CONVERTER="imagemagick"
    echo "   Using ImageMagick"
else
    echo "❌ No image converter found"
    echo "   Please install ImageMagick: brew install imagemagick"
    exit 1
fi

# Function to convert SVG to PNG
convert_svg_to_png() {
    local size=$1
    local output=$2

    if [ "$CONVERTER" = "sips" ]; then
        # sips doesn't support SVG directly, need to use qlmanage or rsvg-convert
        if command -v rsvg-convert &> /dev/null; then
            rsvg-convert -w $size -h $size "$TEMP_DIR/icon.svg" -o "$output"
        else
            echo "   ⚠️  rsvg-convert not found, trying alternative method..."
            # Alternative: use qlmanage to convert SVG to PNG
            qlmanage -t -s $size -o "$TEMP_DIR" "$TEMP_DIR/icon.svg" &> /dev/null
            mv "$TEMP_DIR/icon.svg.png" "$output" 2>/dev/null || {
                echo "   ❌ Failed to convert SVG"
                return 1
            }
        fi
    else
        # Use ImageMagick
        convert -background none -resize ${size}x${size} "$TEMP_DIR/icon.svg" "$output"
    fi
}

# Generate all required sizes
sizes=(
    "16:icon_16x16.png"
    "32:icon_16x16@2x.png"
    "32:icon_32x32.png"
    "64:icon_32x32@2x.png"
    "128:icon_128x128.png"
    "256:icon_128x128@2x.png"
    "256:icon_256x256.png"
    "512:icon_256x256@2x.png"
    "512:icon_512x512.png"
    "1024:icon_512x512@2x.png"
)

for size_spec in "${sizes[@]}"; do
    size="${size_spec%%:*}"
    filename="${size_spec##*:}"
    echo "   Generating ${filename} (${size}x${size})..."
    convert_svg_to_png $size "$ICONSET_DIR/$filename"
done

echo "3️⃣  Creating .icns file..."

# Convert iconset to icns
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICNS"

if [ -f "$OUTPUT_ICNS" ]; then
    echo "   ✅ Created $OUTPUT_ICNS"
    echo ""
    echo "✅ App Icon created successfully!"
    ls -lh "$OUTPUT_ICNS"
else
    echo "   ❌ Failed to create .icns file"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "   1. Rebuild the app: ./scripts/build/build_app_bundle.sh --install --skip-dmg"
echo "   2. The icon will be automatically included"
