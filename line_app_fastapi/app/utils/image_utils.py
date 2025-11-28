"""
Image Handling Utilities

Provides async functions for handling base64 images and generating image URLs.
"""

import re
import base64
import hashlib
import os
from typing import Tuple, Optional
import aiofiles
import logging

from app.config import ASSET_LOCAL_DIR, ASSET_ROUTE_PREFIX, PUBLIC_BASE

logger = logging.getLogger(__name__)

# Regular expression for parsing data URI scheme
_data_uri_re = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

# Ensure asset directory exists
os.makedirs(ASSET_LOCAL_DIR, exist_ok=True)


async def save_base64_image(base64_str: str) -> Tuple[str, str]:
    """
    Save a base64-encoded image to disk and return its URLs.

    Args:
        base64_str: Base64-encoded image string,
                   optionally with data URI scheme (data:image/jpeg;base64,...)

    Returns:
        Tuple of (public_url, relative_path)
        - public_url: Full public URL (PUBLIC_BASE + relative_path)
        - relative_path: Path relative to web root (e.g., /uploads/abc123.jpg)

    Example:
        >>> url, path = await save_base64_image("data:image/jpeg;base64,/9j/4AAQ...")
        >>> print(url)
        'https://example.com/uploads/abc123def456.jpg'
        >>> print(path)
        '/uploads/abc123def456.jpg'
    """
    # Parse data URI to extract MIME type and base64 data
    m = _data_uri_re.match(base64_str.strip())
    if m:
        mime, b64 = m.group(1), m.group(2)
        # Map MIME types to file extensions
        exts = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif"
        }
        ext = exts.get(mime, "png")
    else:
        # No data URI, assume raw base64 PNG
        b64 = base64_str.strip()
        ext = "png"

    # Decode base64 to binary
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        # Fallback: add padding if needed
        raw = base64.b64decode(b64 + "===")

    # Generate SHA-256 hash for deduplication (use first 24 chars)
    h = hashlib.sha256(raw).hexdigest()[:24]
    filename = f"{h}.{ext}"

    # Construct file paths
    rel = f"{ASSET_ROUTE_PREFIX}/{filename}"
    abs_path = os.path.join(ASSET_LOCAL_DIR, filename)

    # Save file asynchronously
    try:
        async with aiofiles.open(abs_path, "wb") as f:
            await f.write(raw)
        logger.info(f"Saved image: {filename} ({len(raw)} bytes)")
    except Exception as e:
        logger.error(f"Failed to save image {filename}: {e}")
        raise

    # Generate public URL
    public_url = f"{PUBLIC_BASE}{rel}"

    return public_url, rel


def image_url_from_item(item: dict) -> Optional[str]:
    """
    Extract and process image URL from item dictionary.

    Handles three scenarios:
    1. item["image_base64"] exists → save and return URL
    2. item["image_url"] exists and is HTTP URL → return as-is
    3. item["image_url"] exists and is relative → prepend PUBLIC_BASE

    Args:
        item: Dictionary containing image_base64 or image_url field

    Returns:
        Public image URL, or None if no image found

    Note:
        This is a sync wrapper that calls async save_base64_image.
        For use in async contexts, consider calling save_base64_image directly.
    """
    import asyncio

    # Handle base64 image
    if item.get("image_base64"):
        try:
            # Run async function in sync context
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If already in async context, this won't work
                # Caller should use await save_base64_image() directly
                logger.warning("image_url_from_item called from async context - use save_base64_image directly")
                return None
            url, _ = loop.run_until_complete(save_base64_image(item["image_base64"]))
            return url
        except Exception as e:
            logger.error(f"Failed to process base64 image: {e}")
            return None

    # Handle URL string
    path = item.get("image_url")
    if not path:
        return None

    # Return HTTP(S) URLs as-is
    if path.startswith("http"):
        return path

    # Prepend PUBLIC_BASE to relative URLs
    return f"{PUBLIC_BASE}{path}"


async def image_url_from_item_async(item: dict) -> Optional[str]:
    """
    Async version of image_url_from_item.

    Extracts and processes image URL from item dictionary in async context.

    Args:
        item: Dictionary containing image_base64 or image_url field

    Returns:
        Public image URL, or None if no image found
    """
    # Handle base64 image
    if item.get("image_base64"):
        try:
            url, _ = await save_base64_image(item["image_base64"])
            return url
        except Exception as e:
            logger.error(f"Failed to process base64 image: {e}")
            return None

    # Handle URL string
    path = item.get("image_url")
    if not path:
        return None

    # Return HTTP(S) URLs as-is
    if path.startswith("http"):
        return path

    # Prepend PUBLIC_BASE to relative URLs
    return f"{PUBLIC_BASE}{path}"
