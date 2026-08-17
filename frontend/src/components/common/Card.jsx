export default function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-card ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
