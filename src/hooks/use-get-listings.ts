import { useApiQuery } from "@/hooks/use-api-query";
import type { MarketplaceProduct, UserProfile } from "@/types";

export const useGetListings = ({
  enabled,
  query,
  category,
  sellerId,
  excludeSellerId,
}: {
  enabled: boolean;
  query?: string;
  category?: string;
  sellerId?: string;
  excludeSellerId?: string;
}) => {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (category) {
    params.set("category", category);
  }
  if (sellerId) {
    params.set("sellerId", sellerId);
  }
  if (excludeSellerId) {
    params.set("excludeSellerId", excludeSellerId);
  }

  const url = `/api/listings${params.toString() ? `?${params.toString()}` : ""}`;

  const { data, isPending, isLoading, error } = useApiQuery<{
    status?: "ok" | "nok";
    products?: (MarketplaceProduct & { seller: UserProfile })[];
    error?: string;
  }>({
    url,
    method: "GET",
    queryKey: [
      "products",
      {
        q: query ?? null,
        category: category ?? null,
        sellerId: sellerId ?? null,
        excludeSellerId: excludeSellerId ?? null,
      },
    ],
    isProtected: true,
    enabled,
  });

  return {
    data,
    error,
    isPending,
    isLoading,
    isSuccess: data?.status === "ok",
  };
};
