import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon size={18} strokeWidth={2} />
            ) : (
                <Sun size={18} strokeWidth={2} />
            )}
        </button>
    );
}
