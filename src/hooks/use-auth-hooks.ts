import type { UserProfile as User } from "@/types";
import { type UseApiMutationOptions, useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";

// Auth queries
export function useAuthCheck(enabled = true) {
  const { data, isPending, isLoading, isFetched, refetch, error } =
    useApiQuery<{
      user?: User;
      status: "ok" | "nok";
      error?: string;
    }>({
      queryKey: ["auth-check"],
      url: "/api/auth/check",
      enabled,
      retry: (failureCount, error1) => {
        // Don't retry on auth failures (401/403) or after 2 attempts
        if (error1 instanceof Error && error1.message.includes("401")) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  return {
    user: data?.user,
    isAuthenticated: data?.status === "ok",
    error: error || (data?.error ? new Error(data.error) : null),
    isLoading,
    isPending,
    isFetched,
    refetch,
  };
}

// Auth mutations
export function useFarcasterSignIn(
  options?: Partial<
    UseApiMutationOptions<
      { success: boolean; error?: string; user?: User },
      { fid: number; referrerFid?: number; token: string }
    >
  >
) {
  return useApiMutation<
    { success: boolean; error?: string; user?: User },
    { fid: number; referrerFid?: number; token: string }
  >({
    url: "/api/auth/sign-in",
    method: "POST",
    body: (variables) => variables,
    ...options,
  });
}
