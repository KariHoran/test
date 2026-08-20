"use client";

import UserAvatar from "./UserAvatar";

export default function MobileHeader({ user }) {
  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <span className="text-xs">✦</span>
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-bold truncate leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ReelsHub
          </p>
          <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
            @{user.instagram_username}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {user.is_demo && (
          <span className="badge badge-demo text-[10px] py-1">Демо</span>
        )}
        <UserAvatar user={user} size={32} />
      </div>
    </header>
  );
}
