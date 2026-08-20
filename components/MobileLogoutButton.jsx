"use client";

export default function MobileLogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      className="btn-ghost w-full justify-center py-3 rounded-2xl border md:hidden"
      style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      onClick={handleLogout}
    >
      🚪 Выйти из аккаунта
    </button>
  );
}
