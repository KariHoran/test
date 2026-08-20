"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_BUTTONS = [
  {
    id: "anna",
    name: "Анна",
    avatar: "https://i.pravatar.cc/150?img=5",
    style: "default",
  },
  {
    id: "masha",
    name: "Маша",
    avatar: "https://i.pravatar.cc/150?img=9",
    style: "default",
  },
  {
    id: "admin",
    name: "Админ",
    avatar: "https://i.pravatar.cc/150?img=3",
    style: "admin",
  },
];

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось войти");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          instagram_username: instagramUsername,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось зарегистрироваться");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoUser) {
    setDemoLoading(demoUser);
    setError("");

    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo_user: demoUser }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось войти в демо-режим");
        return;
      }

      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="card p-6 md:p-8 rounded-3xl">
      <div className="segment-control w-full mb-6">
        <button
          type="button"
          className={`tab-btn flex-1 ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Войти
        </button>
        <button
          type="button"
          className={`tab-btn flex-1 ${mode === "register" ? "active" : ""}`}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Зарегистрироваться
        </button>
      </div>

      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        {mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
      </h2>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{ background: "var(--color-coral-light)", color: "#c0392b" }}
        >
          {error}
        </div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="anna@agency.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Пароль
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm font-medium"
              style={{
                color: "var(--color-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Забыли пароль?
            </button>
          </div>

          <button
            className="btn-primary w-full justify-center text-base mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Входим…" : "Войти →"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Имя и фамилия
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="Анна Королёва"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
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
                type="text"
                placeholder="anna.lifestyle"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="anna@agency.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Пароль
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="минимум 6 символов"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            className="btn-primary w-full justify-center text-base mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Создаём аккаунт…" : "Зарегистрироваться →"}
          </button>
        </form>
      )}

      {mode === "login" && (
        <div className="mt-6 pt-6 border-t flex flex-col gap-3" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
            Быстрый вход (demo)
          </p>
          <div className="flex gap-2">
            {DEMO_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleDemoLogin(btn.id)}
                disabled={demoLoading !== null}
                className={`demo-btn ${btn.style === "admin" ? "admin" : ""}`}
                style={{ opacity: demoLoading && demoLoading !== btn.id ? 0.55 : 1 }}
              >
                <img src={btn.avatar} alt={btn.name} className="demo-btn-avatar" />
                <span>{demoLoading === btn.id ? "…" : btn.style === "admin" ? `👑 ${btn.name}` : btn.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
