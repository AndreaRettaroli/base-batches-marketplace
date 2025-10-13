import { sdk as miniappSdk } from "@farcaster/miniapp-sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useFarcaster } from "@/contexts/farcaster-context";
import { useAuthCheck, useFarcasterSignIn } from "@/hooks/use-auth-hooks";
import type { UserProfile as User } from "@/types";

interface AuthContextType {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  setError: (error: Error | null) => void;

  // Loading states
  isSigningIn: boolean;
  isSignedIn: boolean;

  // Utils
  refetchUser: () => Promise<void>;
  signInWithFarcaster: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Miniapp context
  const {
    context: miniAppContext,
    isMiniAppReady,
    isInMiniApp,
  } = useFarcaster();

  // Local state
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasTriedInitialAuth, setHasTriedInitialAuth] = useState(false);

  // Single user query - this is the only place we fetch user data
  // Always try to fetch on load to check for existing valid token
  const {
    user: authUser,
    refetch: refetchUser,
    isLoading: isFetchingUser,
    isFetched: isFetchedAuthUser,
    error: userError,
  } = useAuthCheck(); // Always fetch to check for existing token

  // Farcaster sign-in mutation
  const { mutate: farcasterSignIn } = useFarcasterSignIn({
    onSuccess: (data) => {
      console.log("Farcaster sign-in success:", data);
      if (data.success && data.user) {
        setIsSigningIn(false);
        setIsSignedIn(true);
        setError(null);
        setUser(data.user);
      }
    },
    onError: (error1: Error) => {
      console.error("Farcaster sign-in error:", error1);
      setError(error1);
      setIsSigningIn(false);
      setIsSignedIn(false);
    },
  });

  // Sign in with Farcaster (miniapp)
  const signInWithFarcaster = useCallback(async () => {
    if (!miniAppContext) {
      throw new Error("Not in mini app");
    }

    try {
      setIsSigningIn(true);
      setError(null);

      const referrerFid =
        miniAppContext.location?.type === "cast_embed"
          ? miniAppContext.location.cast.author.fid
          : undefined;

      const result = await miniappSdk.quickAuth.getToken();

      if (!result) {
        throw new Error("No token from SIWF Quick Auth");
      }

      farcasterSignIn({
        token: result.token,
        fid: miniAppContext.user.fid,
        referrerFid,
      });
    } catch (err) {
      console.error("Farcaster sign-in error:", err);
      setError(
        err instanceof Error ? err : new Error("Farcaster sign-in failed")
      );
      setIsSigningIn(false);
    }
  }, [miniAppContext, farcasterSignIn]);

  // Auto sign-in logic (production / normal flow) -----------------------------------------------
  useEffect(() => {
    // If we're in a miniapp, wait for it to be ready
    if (isInMiniApp && !isMiniAppReady) {
      return;
    }

    // check user auth first
    if (!isFetchedAuthUser) {
      return;
    }

    // If we have a user from the initial fetch, determine the auth method
    if (authUser) {
      setIsSignedIn(true);
      setUser(authUser);

      // For wallet users, validate that the current wallet matches the token
      if (authUser.farcasterFid) {
        setHasTriedInitialAuth(true);
        return;
      }
    }

    // If we failed to fetch user (no valid token), mark that we've tried initial auth
    if (userError && !hasTriedInitialAuth) {
      setHasTriedInitialAuth(true);
    }

    // If the initial fetch completed without an error or user, we have still tried
    if (!(userError || authUser || hasTriedInitialAuth)) {
      setHasTriedInitialAuth(true);
    }

    // Only proceed with sign-in flows after we've tried the initial auth check
    if (!hasTriedInitialAuth || isSigningIn) {
      return;
    }

    // Auto sign-in with Farcaster if in miniapp and not authenticated
    if (isInMiniApp && miniAppContext && !authUser) {
      signInWithFarcaster();
    }
  }, [
    authUser,
    userError,
    hasTriedInitialAuth,
    isInMiniApp,
    isMiniAppReady,
    isFetchedAuthUser,
    miniAppContext,
    isSigningIn,
    signInWithFarcaster,
  ]);
  // NOTE: logoutMutation intentionally excluded to prevent infinite loops

  // Auto sign-in with wallet when wallet is connected
  useEffect(() => {
    // If we're in a miniapp, wait for it to be ready
    if (isInMiniApp && !isMiniAppReady) {
      return;
    }

    // Only proceed with wallet sign-in after we've tried initial auth check
    if (!hasTriedInitialAuth || isSigningIn) {
      return;
    }
  }, [hasTriedInitialAuth, isInMiniApp, isMiniAppReady, isSigningIn]);
  // NOTE: logoutMutation intentionally excluded to prevent infinite loops

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading:
      (isInMiniApp && !isMiniAppReady) || // Wait for miniapp to be ready if we're in one
      isFetchingUser ||
      isSigningIn ||
      !(hasTriedInitialAuth || userError),
    error: error || userError,
    setError,
    isSigningIn,
    isSignedIn,
    refetchUser: async () => {
      await refetchUser();
    },
    signInWithFarcaster,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
