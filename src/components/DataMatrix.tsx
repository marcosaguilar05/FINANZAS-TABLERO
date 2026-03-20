import type { DataMatrixProps } from '../types';
import { formatNum } from '../utils';

export default function DataMatrix({ title, data, periods, activeFilter, onRowClick, maxHeight, icon, variant = 'slate' }: DataMatrixProps) {
    const rows = Object.entries(data);
    const totals: Record<string, number> = {};
    periods.forEach(period => {
        totals[period] = rows.reduce((sum, [, values]) => sum + (values[period] || 0), 0);
    });
    const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);

    const getHeaderStyle = () => {
        switch (variant) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30';
            case 'teal': return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900/30';
            case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30';
            case 'violet': return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900/30';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30';
            case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30';
            default: return 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700';
        }
    };

    const headerClass = getHeaderStyle();

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
            <div className={`border-b px-4 py-3 flex justify-between items-center shrink-0 ${headerClass} bg-opacity-50`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
                </div>
                <span className="bg-white/50 dark:bg-black/20 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200/50 dark:border-slate-700/50">{rows.length} items</span>
            </div>
            <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" style={{ maxHeight: maxHeight || '150px' }}>
                <table className="w-full text-xs text-left text-slate-600 border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <tr>
                            <th className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 min-w-[150px]">{title}</th>
                            {periods.map(period => {
                                const [mes, anio] = period.split('-');
                                return (
                                    <th key={period} className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400 border-b border-l border-slate-100 dark:border-slate-800 uppercase min-w-[100px] bg-slate-50/80 dark:bg-slate-900/80">
                                        {mes}<br /><span className="text-[9px] text-slate-400 dark:text-slate-600">{anio}</span>
                                    </th>
                                );
                            })}
                            <th className="px-4 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20 border-b border-l border-indigo-100 dark:border-indigo-900/30 min-w-[120px]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/50">
                        {rows.map(([name, vals]) => {
                            const rowTotal = periods.reduce((sum, period) => sum + (vals[period] || 0), 0);
                            const isActive = activeFilter === name;
                            return (
                                <tr
                                    key={name}
                                    className={`
                                        transition-colors cursor-pointer group border-b border-slate-50 dark:border-slate-800 last:border-0
                                        ${isActive ? 'bg-amber-50 dark:bg-amber-900/30' : 'hover:bg-indigo-600 dark:hover:bg-indigo-900/80'}
                                    `}
                                    onClick={() => onRowClick?.(name)}
                                >
                                    <td className={`px-4 py-2 font-medium truncate max-w-[180px] border-r border-transparent ${isActive ? 'text-amber-900 dark:text-amber-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-white'}`}>
                                        {name || 'SIN DATOS'}
                                    </td>
                                    {periods.map(period => {
                                        const val = vals[period];
                                        return (
                                            <td key={period} className={`px-4 py-2 text-right tabular-nums border-l border-slate-50 dark:border-slate-800 group-hover:border-indigo-500/50 ${isActive ? 'text-amber-800 dark:text-amber-200' : (val ? 'text-slate-600 dark:text-slate-400 group-hover:text-white' : 'text-slate-300 dark:text-slate-700 group-hover:text-indigo-400')}`}>
                                                {val ? formatNum(val) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className={`px-4 py-2 text-right font-bold tabular-nums border-l border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/50 ${isActive ? 'text-amber-700 dark:text-amber-300 bg-amber-100/20 dark:bg-amber-900/40' : 'text-slate-900 dark:text-slate-100 bg-slate-50/30 dark:bg-slate-800/30 group-hover:bg-transparent group-hover:text-white'}`}>
                                        {formatNum(rowTotal)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 sticky bottom-0 border-t border-slate-200 dark:border-slate-700 z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                        <tr>
                            <td className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">TOTAL</td>
                            {periods.map(period => (
                                <td key={period} className="px-4 py-2.5 text-right tabular-nums text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 border-t border-slate-200 dark:border-slate-700">
                                    {formatNum(totals[period])}
                                </td>
                            ))}
                            <td className="px-4 py-2.5 text-right bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-l border-indigo-100 dark:border-indigo-800 border-t border-indigo-200 dark:border-indigo-800">
                                {formatNum(grandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
