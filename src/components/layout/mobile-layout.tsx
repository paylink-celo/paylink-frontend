import { Outlet } from "@tanstack/react-router";
import { BottomNavbar } from "./bottom-navbar";
import ChatDrawer from "@/components/chat-drawer";

export function MobileLayout() {
  return (
    <>
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavbar />
      <ChatDrawer />
    </>
  );
}
