"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { formatAvatarSrc } from "@/utils/index";

const NAME_SPLIT_REGEX = /\s+/g;

export const UserButton = ({
  setActivePage,
}: {
  setActivePage: (page: "home" | "chat" | "profile") => void;
}) => {
  const { user, isAuthenticated, isLoading, isSigningIn, signInWithFarcaster } =
    useAuth();
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const handleConnect = useCallback(async () => {
    if (isLoading || isSigningIn) {
      return;
    }
    await signInWithFarcaster();
  }, [isLoading, isSigningIn, signInWithFarcaster]);

  const handleCopyAddress = useCallback(async () => {
    if (!address) {
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op: clipboard may be unavailable
    }
  }, [address]);

  const initials =
    (user?.name || "")
      .trim()
      .split(NAME_SPLIT_REGEX)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  alt={user?.name || "User"}
                  src={
                    user?.avatar
                      ? formatAvatarSrc(user.avatar)
                      : "/images/default-image.png"
                  }
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <span>{isLoading || isSigningIn ? "…" : "Connect Farcaster"}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isAuthenticated ? (
          <>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar>
                <AvatarImage
                  alt={user?.name || "User"}
                  src={
                    user?.avatar
                      ? formatAvatarSrc(user.avatar)
                      : "/images/default-image.png"
                  }
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm leading-tight">
                  {user?.name}
                </p>
                {user?.farcasterFid ? (
                  <p className="truncate text-muted-foreground text-xs leading-tight">
                    FID #{user.farcasterFid}
                  </p>
                ) : null}
              </div>
            </div>
            <DropdownMenuSeparator />
            {address ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      handleCopyAddress();
                    }}
                  >
                    <span className="truncate font-mono">
                      {copied
                        ? "Copied!"
                        : `${address.slice(0, 6)}...${address.slice(-4)}`}
                    </span>
                    {copied ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onClick={() => setActivePage("profile")}>
              View profile
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Sign in</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => {
                handleConnect();
              }}
            >
              {isLoading || isSigningIn ? "…" : "Login"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
