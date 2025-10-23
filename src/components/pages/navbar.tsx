import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { UserButton } from "@/components/pages/user-button";

export const Navbar = ({
  setActivePage,
}: {
  setActivePage: Dispatch<SetStateAction<"home" | "chat" | "profile">>;
}) => (
  <header className="flex-shrink-0 border-b bg-white shadow-sm">
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div
          className="flex cursor-pointer items-center gap-1"
          onClick={() => setActivePage("home")}
        >
          <Image
            alt="Farcaster Marketplace"
            className="rounded-xl"
            height={32}
            src="/images/icon.png"
            width={32}
          />
          <h1 className="font-bold text-gray-900 text-xl">arketplace</h1>
        </div>
        <div className="flex items-center gap-1">
          <UserButton setActivePage={setActivePage} />
        </div>
      </div>
      <p className="mt-1 text-gray-600">
        Buy and sell Products with AI-powered insights
      </p>
    </div>
  </header>
);
