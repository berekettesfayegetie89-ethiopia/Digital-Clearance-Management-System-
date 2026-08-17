import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Sun/Moon toggle switch. Placed in the top nav so it's reachable from every
 * dashboard, and in AuthLayout so it also works on the Login screen before
 * signing in. Persists to localStorage via ThemeContext.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-canvas hover:text-text-primary"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
