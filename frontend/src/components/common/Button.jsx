const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  accent: "bg-accent text-primary-dark hover:bg-accent-dark",
  secondary: "bg-secondary text-white hover:bg-secondary-light",
  outline: "border border-border bg-surface text-text-primary hover:bg-canvas",
  ghost: "text-text-primary hover:bg-canvas",
  danger: "bg-error text-white hover:bg-red-700",
  dangerOutline: "border border-error/40 text-error hover:bg-error-bg",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  disabled = false,
  full = false,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 ${
        VARIANTS[variant]
      } ${SIZES[size]} ${full ? "w-full" : ""} ${
        disabled ? "cursor-not-allowed opacity-50" : "active:scale-[0.98]"
      } ${className}`}
    >
      {Icon && iconPosition === "left" && <Icon size={16} />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={16} />}
    </button>
  );
}
