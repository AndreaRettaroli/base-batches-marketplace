"use client";

import { sdk as farcasterSdk } from "@farcaster/miniapp-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { EyeIcon, ShoppingCartIcon, TrashIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { parseUnits } from "viem";
import { ProductDialog } from "@/components/product-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { MarketplaceProduct, UserProfile } from "@/types";
import { formatAvatarSrc } from "@/utils/index";

export const ProductCard = ({
  product,
  showDeleteButton = false,
}: {
  product: MarketplaceProduct & { seller: UserProfile };
  showDeleteButton?: boolean;
}) => {
  const imageSrc = product.images[0] || "/images/default-image.png";
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useApiMutation({
    url: `/api/listings?productId=${product.id}`,
    method: "DELETE",
    onSuccess: () => {
      // Invalidate the products query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      // You could add a toast notification here instead of alert
    },
  });

  const handleBuy = async () => {
    console.log("Buy", product);
    await farcasterSdk.actions.sendToken({
      token: "eip155:8453/erc20:0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
      //token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
      amount: parseUnits(product.price.toString(), 6).toString(),
      recipientAddress: product.seller.walletAddress,
    });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({});
  };

  return (
    <Card className="max-w-md select-none will-change-transform">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div
            className="cursor-pointer"
            onClick={async () => {
              if (product.seller?.farcasterFid) {
                await farcasterSdk.actions.viewProfile({
                  fid: product.seller.farcasterFid,
                });
              }
            }}
          >
            <Avatar className="size-6 cursor-pointer">
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
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="line-clamp-2 text-base">
            {product.title}
          </CardTitle>
        </div>
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
                <ScrollArea className="h-[340px]">
                  <ProductDialog product={product} />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CredenzaBody>
              <CredenzaFooter className="flex flex-col gap-2">
                {showDeleteButton ? (
                  <Dialog
                    onOpenChange={setShowDeleteDialog}
                    open={showDeleteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <TrashIcon className="size-4" /> Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this product? This
                          action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          onClick={() => setShowDeleteDialog(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={handleDelete}
                          variant="destructive"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button onClick={handleBuy} variant="default">
                    <ShoppingCartIcon className="size-4" /> Buy
                  </Button>
                )}
                <CredenzaClose asChild>
                  <Button variant="outline">
                    <XIcon className="size-4" /> Close
                  </Button>
                </CredenzaClose>
              </CredenzaFooter>
            </CredenzaContent>
          </Credenza>
          {showDeleteButton ? (
            <Dialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <TrashIcon className="size-4" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this product? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() => setShowDeleteDialog(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleBuy} variant="default">
              <ShoppingCartIcon className="size-4" /> Buy
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
