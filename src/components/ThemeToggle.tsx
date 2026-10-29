import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('app-theme') : null;
    return saved ? saved === 'dark' : true; // default to the original dark aviation theme
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('app-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="theme-toggle"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
