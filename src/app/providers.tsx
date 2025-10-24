"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { AuthProvider } from "@/contexts/auth-context";
import { FarcasterProvider } from "@/contexts/farcaster-context";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes("4")) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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
