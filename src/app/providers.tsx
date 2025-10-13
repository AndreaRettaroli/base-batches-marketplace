"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { AuthProvider } from "@/contexts/auth-context";
import { FarcasterProvider } from "@/contexts/farcaster-context";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function Providers({
  children,
  cookie,
}: {
  children: React.ReactNode;
  cookie?: string;
}) {
  const initialState = cookieToInitialState(wagmiConfig, cookie);
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider addMiniAppOnLoad={true}>
          <AuthProvider>{children}</AuthProvider>
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
