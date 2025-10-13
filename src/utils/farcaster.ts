import type { MiniAppNotificationDetails } from "@farcaster/miniapp-core";
import {
  type SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-core";
import ky from "ky";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";
import type { SendFarcasterNotificationResult } from "@/types/farcaster.type";

/**
 * Send a notification to a Farcaster user.
 *
 * @param fid - The Farcaster user ID
 * @param title - The title of the notification
 * @param body - The body of the notification
 * @param targetUrl - The URL to redirect to when the notification is clicked (optional)
 * @param notificationDetails - The notification details of the user (required)
 * @returns The result of the notification
 */
export async function sendFarcasterNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationDetails,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
  notificationDetails?: MiniAppNotificationDetails | null;
}): Promise<SendFarcasterNotificationResult> {
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const url = notificationDetails.url;
  const tokens = [notificationDetails.token];

  const response = await ky.post(url, {
    json: {
      notificationId: uuidv4(),
      title,
      body,
      targetUrl: targetUrl ?? env.NEXT_PUBLIC_URL,
      tokens,
    } satisfies SendNotificationRequest,
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (!responseBody.success) {
      console.error(
        `Error sending notification to ${fid}: malformed response`,
        responseBody.error.errors
      );
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.invalidTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: invalid tokens`,
        responseBody.data.result.invalidTokens
      );
      return {
        state: "invalid_token",
        invalidTokens: responseBody.data.result.invalidTokens,
      };
    }

    if (responseBody.data.result.rateLimitedTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: rate limited`,
        responseBody.data.result.rateLimitedTokens
      );
      return {
        state: "rate_limit",
        rateLimitedTokens: responseBody.data.result.rateLimitedTokens,
      };
    }

    return { state: "success" };
  }

  console.error(`Error sending notification to ${fid}: ${response.status}`);
  return { state: "error", error: responseJson };
}
/**
 * Get the farcaster manifest for the mini app, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 *
 * @returns The farcaster manifest for the mini app
 * @schema https://github.com/farcasterxyz/miniapps/blob/main/packages/miniapp-core/src/schemas/manifest.ts
 * @documentation https://miniapps.farcaster.xyz/docs/guides/publishing#define-your-application-configuration
 */
export function getFarcasterManifest() {
  let miniappName = "Fc Marketplace";
  let noindex = true;
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl === "https://fc-marketplace.xyz") {
    noindex = false;
  } else if (appUrl.includes("ngrok") || appUrl.includes("tunnel")) {
    miniappName += " Local";
  }
  return {
    accountAssociation: {
      header: env.NEXT_PUBLIC_FARCASTER_HEADER,
      payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
      signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    },
    baseBuilder: {
      allowedAddresses: [env.NEXT_PUBLIC_BASE_BUILDER_ADDRESS],
    },
    miniapp: {
      version: "1",
      name: miniappName,
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/default-image.png`,
      buttonTitle: "Open",
      splashImageUrl: `${appUrl}/images/icon.png`,
      splashBackgroundColor: "#FFFFFF",
      webhookUrl: `${appUrl}/api/webhook/farcaster`, // our farcaster webhook
      // Metadata https://github.com/farcasterxyz/miniapps/discussions/191
      subtitle: "Fc Marketplace", // 30 characters, no emojis or special characters, short description under app name
      description: "Fc Marketplace", // 170 characters, no emojis or special characters, promotional message displayed on Mini App Page
      primaryCategory: "shopping", // https://github.com/farcasterxyz/miniapps/blob/main/packages/miniapp-core/src/schemas/manifest.ts
      tags: ["shop", "marketplace", "sell", "buy"], // up to 5 tags, filtering/search tags
      tagline: "Farcaster Marketplace", // 30 characters, marketing tagline should be punchy and descriptive
      ogTitle: `${miniappName}`, // 30 characters, app name + short tag, Title case, no emojis
      ogDescription: "Fc Marketplace", // 100 characters, summarize core benefits in 1-2 lines
      screenshotUrls: [
        // 1284 x 2778, visual previews of the app, max 3 screenshots
        `${appUrl}/images/default-image.png`,
      ],
      heroImageUrl: `${appUrl}/images/default-image.png`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      ogImageUrl: `${appUrl}/images/default-image.png`, // 1200 x 630px (1.91:1), promotional image, same as app hero image
      noindex,
      requiredChains: ["eip155:1", "eip155:8453"],
      requiredCapabilities: ["wallet.getEthereumProvider"],
    },
  };
}
