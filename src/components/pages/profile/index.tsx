"use client";

import { useAuth } from "@/contexts/auth-context";
import { useGetListings } from "@/hooks/use-get-listings";
import { ProductCard } from "../home/product-card";

export const ProfilePage = () => {
  const { user } = useAuth();
  const { data, isPending, isLoading } = useGetListings({
    enabled: true,
    sellerId: user?.id,
  });

  if (isPending || isLoading) {
    return <div>Loading...</div>;
  }

  console.log("User Products", user?.id, "products", data?.products);

  return (
    <div>
      <h3 className="font-bold text-xl">Hi {user?.name}!</h3>
      <h5 className="font-bold text-lg">Your Products</h5>
      {data?.products?.map((product) => (
        <li className="flex items-center gap-2" key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </div>
  );
};
