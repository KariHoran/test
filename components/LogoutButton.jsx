"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button type="button" className="sidebar-item" onClick={handleLogout}>
      <span className="text-base flex-shrink-0">🚪</span>
      <span>Выйти</span>
    </button>
  );
}
