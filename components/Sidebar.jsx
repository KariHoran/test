"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import UserAvatar from "./UserAvatar";

const navItems = [
  { id: "dashboard", label: "Дашборд", icon: "📊", href: "/dashboard", mobileLabel: "Дашборд" },
  { id: "feed", label: "Лента", icon: "🎬", href: "/feed", mobileLabel: "Лента" },
  { id: "analytics", label: "Аналитика", icon: "📈", href: "/analytics", adminOnly: true, mobileLabel: "Аналитика" },
  { id: "settings", label: "Настройки", icon: "⚙️", href: "/settings", mobileLabel: "Ещё" },
];

function NavLinks({ user, pathname, variant }) {
  const items = navItems.filter((item) => !item.adminOnly || user.role === "admin");

  if (variant === "mobile") {
    return (
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 flex-1 mb-4">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`sidebar-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <aside className="sidebar-desktop">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <span className="text-sm">✦</span>
          </div>
          <span className="text-lg font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
            ReelPulse
          </span>
        </div>

        {user.is_demo && (
          <div className="badge badge-demo mb-4 mx-1 justify-center py-2 text-xs">
            🧪 Демо-режим
          </div>
        )}

        <NavLinks user={user} pathname={pathname} variant="desktop" />

        <div className="mt-auto">
          <div
            className="flex items-center gap-3 px-2 py-3 rounded-2xl mb-3"
            style={{ background: "var(--color-surface)" }}
          >
            <UserAvatar user={user} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
                {firstName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                @{user.instagram_username}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <NavLinks user={user} pathname={pathname} variant="mobile" />
    </>
  );
}
