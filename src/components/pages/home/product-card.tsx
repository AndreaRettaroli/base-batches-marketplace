"use client";

import { sdk as farcasterSdk } from "@farcaster/miniapp-sdk";
import { EyeIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { parseUnits } from "viem";
import { ProductDialog } from "@/components/product-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MarketplaceProduct, UserProfile } from "@/types";
export const ProductCard = ({
  product,
}: {
  product: MarketplaceProduct & { seller: UserProfile };
}) => {
  const imageSrc = product.images[0] || "/images/default-image.png";

  const handleBuy = async () => {
    console.log("Buy", product);
    await farcasterSdk.actions.sendToken({
      token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
      amount: parseUnits(product.price.toString(), 6).toString(),
      recipientAddress: product.seller.walletAddress,
    });
  };

  return (
    <Card className="max-w-md select-none will-change-transform">
      <CardHeader>
        <CardTitle className="line-clamp-2 text-base">
          {product.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Image
          alt={product.title}
          className="aspect-video w-full rounded-md object-cover will-change-transform"
          height={350}
          src={imageSrc}
          width={500}
        />
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
      </CardContent>
      <CardFooter className="flex flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>
            {product.currency} {product.price}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Credenza>
            <CredenzaTrigger asChild>
              <Button variant="outline">
                <EyeIcon className="size-4" /> View
              </Button>
            </CredenzaTrigger>
            <CredenzaContent>
              <CredenzaHeader>
                <CredenzaTitle className="line-clamp-2">
                  {product.title}
                </CredenzaTitle>
              </CredenzaHeader>
              <CredenzaBody>
                <ScrollArea className="h-[300px]">
                  <ProductDialog product={product} />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CredenzaBody>
              <CredenzaFooter className="flex flex-col gap-2">
                <Button onClick={handleBuy} variant="default">
                  <ShoppingCartIcon className="size-4" /> Buy
                </Button>
                <CredenzaClose asChild>
                  <Button variant="outline">
                    <XIcon className="size-4" /> Close
                  </Button>
                </CredenzaClose>
              </CredenzaFooter>
            </CredenzaContent>
          </Credenza>
          <Button onClick={handleBuy} variant="default">
            <ShoppingCartIcon className="size-4" /> Buy
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
