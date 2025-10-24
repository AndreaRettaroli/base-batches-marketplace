"use client";

import { sdk as farcasterSdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceProduct, UserProfile } from "@/types";
import { formatAvatarSrc } from "@/utils/index";

export function ProductDialog({
  product,
}: {
  product: MarketplaceProduct & { seller: UserProfile };
}) {
  const imageSrc = useMemo(
    () => product.images[0] || "/images/default-image.png",
    [product.images]
  );

  return (
    <div className="grid gap-1 md:grid-cols-[1fr_1fr]">
      <Image
        alt={product.title}
        className="aspect-video w-full rounded-md object-cover"
        height={420}
        src={imageSrc}
        width={640}
      />
      <span>
        {product.currency} {product.price}
      </span>
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={async () => {
          if (product.seller?.farcasterFid) {
            await farcasterSdk.actions.viewProfile({
              fid: product.seller.farcasterFid,
            });
          }
        }}
      >
        <Avatar>
          <AvatarImage
            alt={product.seller?.name || "Seller"}
            src={
              product.seller?.avatar
                ? formatAvatarSrc(product.seller.avatar)
                : "/images/default-image.png"
            }
          />
          <AvatarFallback>
            {(product.seller?.name || "?")
              .trim()
              .split(/\s+/g)
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-tight">
            {product.seller?.name || "Unknown"}
          </span>
        </div>
      </div>
      {product.tags?.length > 0 && (
        <div
          className="scrollbar-hide my-2 flex max-w-xs flex-row items-center justify-start gap-2 overflow-scroll text-center"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overflow: "overlay",
          }}
        >
          {product.tags.map((tag) => (
            <Badge
              className="whitespace-nowrap rounded-[50px] bg-background text-sm"
              key={tag}
              variant="outline"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="space-y-2 text-sm">
        {product.brand && (
          <div>
            <span className="text-muted-foreground">Brand: </span>
            <span>{product.brand ?? "—"}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Category: </span>
          <span>{product.category}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Condition: </span>
          <span>{product.condition}</span>
        </div>
        <span className="text-muted-foreground">Description: </span>
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}
