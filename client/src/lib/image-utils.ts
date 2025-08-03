/**
 * Utility functions for handling image URLs
 */

/**
 * Gets the server URL from environment variables
 */
function getServerUrl(): string {
  const isDev = import.meta.env.DEV;
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // In development, use the provided server URL or localhost
  if (isDev) {
    return viteServerUrl || "http://localhost:3000";
  }

  // In production, use the environment variable
  if (!viteServerUrl) {
    throw new Error(
      "VITE_SERVER_URL environment variable is required for production builds",
    );
  }

  return viteServerUrl;
}

/**
 * Builds a full image URL by prefixing relative paths with the server URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns The full image URL
 */
export function buildImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already a full URL (http/https) or a blob URL, return as is
  if (imageUrl.startsWith("http") || imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // If it's a relative path, prefix with server URL
  if (imageUrl.startsWith("/")) {
    const serverUrl = getServerUrl();
    return `${serverUrl}${imageUrl}`;
  }

  // If it doesn't start with /, assume it's relative and add the prefix
  const serverUrl = getServerUrl();
  return `${serverUrl}/${imageUrl}`;
}

/**
 * Builds an image URL specifically for uploaded files
 * @param path - The relative path to the uploaded file
 * @returns The full image URL
 */
export function buildUploadUrl(path: string): string {
  if (!path) {
    throw new Error("Path is required for upload URL");
  }

  const serverUrl = getServerUrl();

  // Ensure path starts with /uploads
  if (!path.startsWith("/uploads")) {
    if (path.startsWith("uploads")) {
      path = `/${path}`;
    } else {
      path = `/uploads/${path}`;
    }
  }

  return `${serverUrl}${path}`;
}

/**
 * Checks if an image URL is a valid image source
 * @param imageUrl - The image URL to check
 * @returns True if the URL appears to be a valid image source
 */
export function isValidImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) {
    return false;
  }

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;

  // Check for blob URLs or data URLs
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:image")) {
    return true;
  }

  // Check for image extensions
  return imageExtensions.test(imageUrl);
}

/**
 * Gets a fallback image URL for when an image fails to load
 * @param type - The type of fallback image needed
 * @returns A fallback image URL or null if no fallback is available
 */
export function getFallbackImageUrl(type: "event" | "user" | "general" = "general"): string | null {
  // You can customize these fallback URLs based on your needs
  switch (type) {
    case "event":
      return "/placeholder-event.jpg"; // Relative to public folder
    case "user":
      return "/placeholder-user.jpg"; // Relative to public folder
    case "general":
    default:
      return "/placeholder.jpg"; // Relative to public folder
  }
}
