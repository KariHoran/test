import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{
        background: "linear-gradient(145deg, #EEF4FF 0%, #F0EEFF 45%, #F5F7FF 100%)",
      }}
    >
      {/* soft decorative blobs */}
      <div
        className="blob"
        style={{ width: 360, height: 360, background: "#B8BBFF", top: -100, left: -100 }}
      />
      <div
        className="blob"
        style={{ width: 280, height: 280, background: "#FFB3B3", bottom: -40, right: -80 }}
      />
      <div
        className="blob"
        style={{ width: 200, height: 200, background: "#A8EDD5", bottom: 120, left: 60 }}
      />
      <div
        className="blob"
        style={{ width: 160, height: 160, background: "#C4B5FD", top: 120, right: 80, opacity: 0.25 }}
      />

      {/* subtle radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(91,91,214,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="text-center mb-8 md:mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 shadow-md"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #7B7BE8 100%)",
              boxShadow: "0 8px 24px rgba(91, 91, 214, 0.35)",
            }}
          >
            <span className="text-2xl text-white">✦</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
            ReelsHub
          </h1>
          <p className="text-sm mt-2 leading-relaxed max-w-xs mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Аналитика Instagram Reels для вашего агентства
          </p>
        </div>

        <AuthForm />

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-subtle)" }}>
          © 2026 ReelsHub · Все права защищены
        </p>
      </div>
    </div>
  );
}
