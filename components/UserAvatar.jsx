export default function UserAvatar({ user, size = 32, className = "", rounded = "full" }) {
  const roundedClass =
    rounded === "2xl" ? "rounded-2xl" : rounded === "xl" ? "rounded-xl" : "rounded-full";

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`object-cover flex-shrink-0 ${roundedClass} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = (user?.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 font-bold ${roundedClass} ${className}`}
      style={{
        width: size,
        height: size,
        background: "var(--color-primary-light)",
        color: "var(--color-primary)",
        fontFamily: "var(--font-display)",
        fontSize: size * 0.35,
      }}
      aria-label={user?.name}
    >
      {initials || "?"}
    </div>
  );
}
