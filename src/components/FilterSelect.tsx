import { ChevronDown } from 'lucide-react';
import type { FilterSelectProps } from '../types';

export default function FilterSelect({ label, value, options, onChange, icon }: FilterSelectProps) {
    const isActive = value !== '';
    return (
        <div className="flex flex-col gap-1.5 group">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {icon}
                {label}
            </div>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`
                        w-full appearance-none rounded-lg px-3 py-2 text-xs font-semibold border outline-none transition-all cursor-pointer
                        ${isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}
                    `}
                >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Todo</option>
                    {options.map((option) => <option key={option} value={option} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">{option}</option>)}
                </select>
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <ChevronDown size={14} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
}
