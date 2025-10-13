import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { basePreconf } from "viem/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseAccount } from "wagmi/connectors";
import { env } from "@/lib/env";

// Create Farcaster MiniApp-compatible wagmi config
export const wagmiConfig = createConfig({
  ssr: undefined,
  storage: createStorage({ storage: cookieStorage }),
  chains: [basePreconf],
  transports: {
    [basePreconf.id]: http(),
  },
  connectors: [
    baseAccount({
      appName: "Farcaster Marketplace",
      appLogoUrl: `${env.NEXT_PUBLIC_URL}/images/icon.png`,
    }),
    miniAppConnector(),
  ],
});
