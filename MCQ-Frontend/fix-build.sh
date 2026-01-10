#!/bin/bash

# Script to fix CMake build errors by cleaning and regenerating codegen

echo "🧹 Cleaning build directories..."
cd "$(dirname "$0")"

# Clean Android build directories
rm -rf android/app/.cxx
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/build

# Clean node_modules codegen (if any)
find node_modules -type d -name "codegen" -exec rm -rf {} + 2>/dev/null || true

echo "📦 Regenerating codegen..."
# Run Expo prebuild to regenerate native code
npx expo prebuild --clean --platform android

echo "🔨 Building Android app..."
npx expo run:android

echo "✅ Done! If you still see errors, try:"
echo "   1. cd android && ./gradlew clean && cd .."
echo "   2. npx expo run:android"
