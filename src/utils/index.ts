import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names
 * @param inputs - Class names to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format the avatar src for imagedelivery.net images to reasonable avatar sizes
 *
 * @docs https://developers.cloudflare.com/images/transform-images/transform-via-url/#options
 *
 * @param avatarUrl - The url of the avatar
 * @returns The formatted avatar src
 */
export const formatAvatarSrc = (avatarUrl: string) => {
  let avatarSrc = avatarUrl;
  if (avatarSrc.startsWith("https://imagedelivery.net")) {
    const defaultAvatar = "/anim=false,fit=contain,f=auto,w=512";
    if (avatarSrc.endsWith("/rectcrop3")) {
      avatarSrc = avatarSrc.replace("/rectcrop3", defaultAvatar);
    } else if (avatarSrc.endsWith("/original")) {
      avatarSrc = avatarSrc.replace("/original", defaultAvatar);
    } else if (avatarSrc.endsWith("/public")) {
      avatarSrc = avatarSrc.replace("/public", defaultAvatar);
    }
  }
  return avatarSrc;
};
