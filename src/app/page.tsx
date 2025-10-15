import type { Metadata } from "next";
import { AppPage } from "@/components/pages";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_URL;

export function generateMetadata(): Metadata {
  const miniapp = {
    version: "next",
    imageUrl: `${appUrl}/images/default-image.png`,
    button: {
      title: "Launch App",
      action: {
        type: "launch_miniapp",
        name: "Fc Marketplace",
        url: appUrl,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#ffffff",
      },
    },
  };
  return {
    title: "Fc Marketplace",
    description: "Fc Marketplace",
    metadataBase: new URL(appUrl),
    openGraph: {
      title: "Fc Marketplace",
      description: "Fc Marketplace",
      type: "website",
      images: [
        {
          url: `${appUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Fc Marketplace",
      description: "Fc Marketplace",
      siteId: "1727435024931094528",
      creator: "@builders_garden",
      creatorId: "1727435024931094528",
      images: [`${appUrl}/images/og-image.png`],
    },
    other: {
      "fc:miniapp": JSON.stringify(miniapp),
    },
  };
}

export default function Home() {
  return <AppPage />;
}
