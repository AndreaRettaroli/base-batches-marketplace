/** biome-ignore-all lint/suspicious/noExplicitAny: need here */
import {
  type ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import type { NextRequest } from "next/server";
import { fetchUserFromNeynar } from "@/lib/neynar";
import { DatabaseService } from "@/services/database.service";
import { formatAvatarSrc } from "@/utils";
import { sendFarcasterNotification } from "@/utils/farcaster";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  console.log("[webhook/farcaster] requestJson", requestJson);

  let data: any;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      default:
        throw new Error("Unknown farcaster webhook event");
    }
  }

  console.log("[webhook/farcaster] parsed event data", data);
  const fid = data.fid;
  const event = data.event;
  let dbUser = await DatabaseService.getUserByFarcasterFid(fid);
  if (!dbUser) {
    const userFromNeynar = await fetchUserFromNeynar(fid.toString());
    if (!userFromNeynar) {
      console.error("FID not found in Neynar", fid);
      throw new Error("Farcaster user not found in Neynar");
    }
    const walletAddress = userFromNeynar.verified_addresses.primary.eth_address;
    if (!walletAddress) {
      console.error("Wallet address not found in Neynar", fid);
      throw new Error("Wallet address not found in Neynar");
    }
    dbUser = await DatabaseService.createFarcasterUser({
      walletAddress,
      farcasterFid: fid,
      farcasterNotificationDetails: undefined,
      email: `${fid}@farcaster.emails`,
      name: userFromNeynar.username,
      avatar: userFromNeynar.pfp_url
        ? formatAvatarSrc(userFromNeynar.pfp_url)
        : undefined,
    });
  }
  if (!dbUser) {
    throw new Error("Failed to create user");
  }

  switch (event.event) {
    case "miniapp_added":
      if (event.notificationDetails) {
        await DatabaseService.updateUserFarcasterDetails(
          fid,
          event.notificationDetails
        );
        await sendFarcasterNotification({
          fid,
          title: "Welcome to Marketplace!",
          body: "Hello from Marketplace!",
          notificationDetails: event.notificationDetails,
        });
      } else {
        await DatabaseService.deleteUserFarcasterDetails(fid);
      }

      break;
    case "miniapp_removed": {
      console.log("[webhook/farcaster] miniapp_removed", event);
      await DatabaseService.deleteUserFarcasterDetails(fid);
      break;
    }
    case "notifications_enabled": {
      console.log("[webhook/farcaster] notifications_enabled", event);
      await DatabaseService.updateUserFarcasterDetails(
        fid,
        event.notificationDetails
      );
      await sendFarcasterNotification({
        fid,
        title: "Ding ding dong",
        body: "Thank you for enabling notifications for Marketplace!",
        notificationDetails: event.notificationDetails,
      });
      break;
    }
    case "notifications_disabled": {
      console.log("[webhook/farcaster] notifications_disabled", event);
      await DatabaseService.deleteUserFarcasterDetails(fid);
      break;
    }
    default:
      throw new Error("Unknown farcaster webhook event");
  }

  return Response.json({ success: true });
}
