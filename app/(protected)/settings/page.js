import { redirect } from "next/navigation";
import MobileLogoutButton from "@/components/MobileLogoutButton";
import UserAvatar from "@/components/UserAvatar";
import { getSession } from "@/lib/auth.js";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="page-shell flex flex-col gap-5 md:gap-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="page-title">Настройки аккаунта</h1>
        <p className="page-subtitle">Управляйте профилем и уведомлениями</p>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-base font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
          Профиль
        </h2>
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <UserAvatar user={user} size={80} rounded="2xl" className="shadow-sm" />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs text-white"
              style={{
                background: "var(--color-primary)",
                border: "2px solid #fff",
                cursor: "pointer",
              }}
            >
              ✎
            </button>
          </div>
          <div>
            <p className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {user.name}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              @{user.instagram_username}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge badge-blue">
                {user.role === "admin" ? "👑 Администратор" : "📸 Блогер"}
              </span>
              {user.is_demo && <span className="badge badge-demo">🧪 Демо-режим</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              Имя и фамилия
            </label>
            <input className="input-field" defaultValue={user.name} placeholder="Анна Королёва" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              Ник в Instagram
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                @
              </span>
              <input
                className="input-field"
                style={{ paddingLeft: 30 }}
                defaultValue={user.instagram_username}
                placeholder="anna.lifestyle"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              defaultValue={user.email}
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-base font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
          Уведомления
        </h2>
        <div className="flex flex-col">
          {[
            {
              label: "Уведомления об обновлении просмотров",
              sub: "Когда данные по ролику обновляются",
              on: true,
            },
            {
              label: "Еженедельный отчёт",
              sub: "Итоги недели на email каждый понедельник",
              on: false,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {item.sub}
                </p>
              </div>
              <button
                type="button"
                className={`toggle ${item.on ? "on" : ""}`}
                aria-label={item.label}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-primary self-start">
        Сохранить изменения
      </button>

      <MobileLogoutButton />
    </div>
  );
}
