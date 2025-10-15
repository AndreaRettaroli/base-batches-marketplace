"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceProduct } from "@/types";

export function ProductDialog({ product }: { product: MarketplaceProduct }) {
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
