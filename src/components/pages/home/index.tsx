"use client";

import { useGetListings } from "@/hooks/use-get-listings";
import { ProductCard } from "./product-card";

export const HomePage = () => {
  const { data, isPending, isLoading } = useGetListings({
    enabled: true,
  });

  if (isPending || isLoading) {
    return <div>Loading...</div>;
  }

  console.log("Products", data?.products);

  return (
    <div>
      <ul>
        {data?.products?.map((product) => (
          <li className="flex items-center gap-2" key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
};
