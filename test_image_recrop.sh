#!/bin/bash

# Test script for dynamic image re-cropping functionality
# Tests the upload and recrop endpoints

API_URL="http://127.0.0.1:8700"
TOKEN="$(cat ~/.auth_token 2>/dev/null || echo 'test-token')"

echo "=== Testing Image Upload and Re-Crop Functionality ==="
echo ""

# Check if test image exists
TEST_IMAGE="/data2/lili_hotel/backend/public/uploads/20251120_164756_68738296.jpg"
if [ ! -f "$TEST_IMAGE" ]; then
  echo "❌ Test image not found at: $TEST_IMAGE"
  echo "   Trying to find another image..."
  TEST_IMAGE=$(find /data2/lili_hotel/backend/public/uploads -name "*.jpg" -o -name "*.jpeg" | head -1)
  if [ -z "$TEST_IMAGE" ]; then
    echo "❌ No test images found. Please upload an image first."
    exit 1
  fi
fi

echo "✓ Test image found: $TEST_IMAGE"
echo ""

# Test 1: Upload image with 1:1 aspect ratio
echo "📤 Test 1: Upload image with 1:1 aspect ratio"
UPLOAD_RESULT=$(curl -s -X POST "$API_URL/api/v1/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_IMAGE" \
  -F "aspect_ratio=1:1")

echo "Response: $UPLOAD_RESULT"
echo ""

# Extract original_filename from response
ORIGINAL_FILENAME=$(echo "$UPLOAD_RESULT" | grep -o '"original_filename":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ORIGINAL_FILENAME" ]; then
  echo "❌ Upload failed or original_filename not returned"
  exit 1
fi

echo "✓ Upload successful"
echo "  Original filename: $ORIGINAL_FILENAME"
echo ""

# Test 2: Re-crop to 1.92:1
echo "🔄 Test 2: Re-crop image to 1.92:1 aspect ratio"
RECROP_RESULT=$(curl -s -X POST "$API_URL/api/v1/upload/recrop" \
  -H "Authorization: Bearer $TOKEN" \
  -F "original_filename=$ORIGINAL_FILENAME" \
  -F "aspect_ratio=1.92:1")

echo "Response: $RECROP_RESULT"
echo ""

if echo "$RECROP_RESULT" | grep -q '"code":200'; then
  echo "✓ Re-crop to 1.92:1 successful"
else
  echo "❌ Re-crop to 1.92:1 failed"
fi
echo ""

# Test 3: Re-crop back to 1:1
echo "🔄 Test 3: Re-crop image back to 1:1 aspect ratio"
RECROP_RESULT2=$(curl -s -X POST "$API_URL/api/v1/upload/recrop" \
  -H "Authorization: Bearer $TOKEN" \
  -F "original_filename=$ORIGINAL_FILENAME" \
  -F "aspect_ratio=1:1")

echo "Response: $RECROP_RESULT2"
echo ""

if echo "$RECROP_RESULT2" | grep -q '"code":200'; then
  echo "✓ Re-crop back to 1:1 successful"
else
  echo "❌ Re-crop back to 1:1 failed"
fi
echo ""

# Verify files exist
echo "📁 Verifying uploaded files:"
CROPPED_FILE="${ORIGINAL_FILENAME/_original/}"
ORIGINAL_PATH="/data2/lili_hotel/backend/public/uploads_original/$ORIGINAL_FILENAME"
CROPPED_PATH="/data2/lili_hotel/backend/public/uploads/$CROPPED_FILE"

if [ -f "$ORIGINAL_PATH" ]; then
  echo "  ✓ Original file exists: $ORIGINAL_PATH"
  ls -lh "$ORIGINAL_PATH"
else
  echo "  ❌ Original file not found: $ORIGINAL_PATH"
fi

if [ -f "$CROPPED_PATH" ]; then
  echo "  ✓ Cropped file exists: $CROPPED_PATH"
  ls -lh "$CROPPED_PATH"
else
  echo "  ❌ Cropped file not found: $CROPPED_PATH"
fi

echo ""
echo "=== Test Complete ==="
