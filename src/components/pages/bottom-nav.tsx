"use client";

import { DollarSign, ShoppingBag } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

type BottomNavProps = {
  activePage: "home" | "chat" | "profile";
  setActivePage: Dispatch<SetStateAction<"home" | "chat" | "profile">>;
};

export const BottomNav = ({ activePage, setActivePage }: BottomNavProps) => {
  const tabs = [
    {
      id: "home" as const,
      label: "Buy",
      icon: ShoppingBag,
    },
    {
      id: "chat" as const,
      label: "Sell",
      icon: DollarSign,
    },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white shadow-lg">
      <div className="mx-auto flex max-w-7xl">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;

          return (
            <div className="flex flex-1" key={tab.id}>
              <button
                className={`flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActivePage(tab.id)}
                type="button"
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-2" : ""}`} />
                <span className="font-medium text-xs">{tab.label}</span>
              </button>
              {index < tabs.length - 1 && (
                <div className="border-gray-200 border-l" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
