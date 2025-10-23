"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useGetListings } from "@/hooks/use-get-listings";
import { ProductCard } from "../home/product-card";

interface ProfilePageProps {
  onCreateNewChat?: () => void;
}

export const ProfilePage = ({ onCreateNewChat }: ProfilePageProps) => {
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
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-xl">Hi {user?.name}!</h3>
        <h5 className="font-bold text-lg">Your Products</h5>
      </div>

      {data?.products && data.products.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showDeleteButton={true}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4 py-12 text-center">
          <div className="text-gray-500 text-lg">No products for sale</div>
          <p className="text-gray-400">Start by selling your first products!</p>
          <Button onClick={onCreateNewChat}>Create your first product</Button>
        </div>
      )}
    </div>
  );
};
