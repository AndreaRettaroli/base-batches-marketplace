import { UploadIcon } from "lucide-react";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { UserButton } from "@/components/pages/user-button";
import { Button } from "@/components/ui/button";

export const Navbar = ({
  handleCreateNewChat,
  setActivePage,
}: {
  handleCreateNewChat: () => void;
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
          <h1 className="font-bold text-gray-900 text-xl">Fc Marketplace</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            className="rounded-lg bg-blue-600 px-2 py-1 font-medium text-white transition-colors hover:bg-blue-700"
            onClick={handleCreateNewChat}
            type="button"
          >
            <UploadIcon className="size-4" />
            Create
          </Button>

          <UserButton setActivePage={setActivePage} />
        </div>
      </div>
      <p className="mt-1 text-gray-600">
        Upload product images to get AI-powered analysis and price comparisons
      </p>
    </div>
  </header>
);
