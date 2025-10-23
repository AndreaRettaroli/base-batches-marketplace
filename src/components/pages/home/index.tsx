"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useGetListings } from "@/hooks/use-get-listings";
import { ProductCard } from "./product-card";

export const HomePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isPending, isLoading } = useGetListings({
    enabled: true,
    excludeSellerId: user?.id, // Exclude current user's products
    query: debouncedQuery, // Pass debounced search query
  });

  console.log("Products", data?.products);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 text-sm"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by title, description, or tags..."
          value={searchQuery}
        />
      </div>

      {/* Search indicator */}
      {debouncedQuery && (
        <div className="text-muted-foreground text-sm">
          Showing results for "{debouncedQuery}"
        </div>
      )}

      {/* Loading state */}
      {isPending || isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Products List */}
          {data?.products && data.products.length > 0 ? (
            <ul className="space-y-4">
              {data.products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {debouncedQuery ? (
                <>
                  <p>No products found for "{debouncedQuery}"</p>
                  <p className="mt-2 text-sm">Try a different search term</p>
                </>
              ) : (
                <p>No products available</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
