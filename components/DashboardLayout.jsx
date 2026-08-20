"use client";

import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

export default function DashboardLayout({ user, children }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader user={user} />
        <main
          className="flex-1 overflow-y-auto min-w-0"
          style={{ background: "var(--color-background)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
