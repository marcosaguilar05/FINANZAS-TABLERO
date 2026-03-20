import { useMemo, Fragment } from 'react';
import type { FinancialRecord, ResponsableAggregation, ResponsableRow, ResponsableMatrixData } from '../types';
import { formatCurrency } from '../utils';

export default function ResponsableMatrix({ data, periods, variant = 'slate', title }: { data: FinancialRecord[], periods: string[], variant?: 'emerald' | 'slate' | 'blue' | 'indigo' | 'violet' | 'amber' | 'teal', title?: string }) {
    // ... useMemo block remains unchanged ...
    const matrix: ResponsableMatrixData = useMemo(() => {
        const rows: Record<string, ResponsableRow> = {};
        const totals = {
            global: { valor: 0, terceros: new Set<string>() },
            periods: {} as Record<string, ResponsableAggregation>
        };

        periods.forEach(period => {
            totals.periods[period] = { valor: 0, terceros: new Set<string>() };
        });

        data.forEach(item => {
            const responsable = item.Responsable || 'SIN RESPONSABLE';
            const mes = (item.MES || '').toLowerCase();
            const anio = (item.AÑO || '').toString();
            const periodKey = `${mes}-${anio}`;
            const valor = Number(item.Valor_de_operacion) || 0;

            if (!rows[responsable]) {
                rows[responsable] = {
                    name: responsable,
                    global: { valor: 0, terceros: new Set<string>() },
                    periods: {}
                };
            }

            rows[responsable].global.valor += valor;
            if (item.Tercero) rows[responsable].global.terceros.add(item.Tercero);

            totals.global.valor += valor;
            if (item.Tercero) totals.global.terceros.add(item.Tercero);

            if (periods.includes(periodKey)) {
                if (!rows[responsable].periods[periodKey]) {
                    rows[responsable].periods[periodKey] = { valor: 0, terceros: new Set<string>() };
                }
                rows[responsable].periods[periodKey].valor += valor;
                if (item.Tercero) rows[responsable].periods[periodKey].terceros.add(item.Tercero);

                totals.periods[periodKey].valor += valor;
                if (item.Tercero) totals.periods[periodKey].terceros.add(item.Tercero);
            }
        });

        const sortedRows = Object.values(rows)
            .sort((a, b) => b.global.valor - a.global.valor);

        return { rows: sortedRows, totals };
    }, [data, periods]);

    const renderTercerosCell = (tercerosSet: Set<string> | undefined) => {
        if (!tercerosSet) return '-';
        const terceros = Array.from(tercerosSet);
        if (terceros.length === 0) return '-';

        const display = terceros.slice(0, 2).join(', ');
        const remaining = terceros.length - 2;
        const text = remaining > 0 ? `${display} (+${remaining})` : display;

        return (
            <span className="truncate block max-w-[150px]" title={terceros.join('\n')}>
                {text}
            </span>
        );
    };

    const getHeaderStyle = () => {
        switch (variant) {
            case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30';
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30';
            default: return 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700';
        }
    };

    const headerClass = getHeaderStyle();

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-8 transition-colors duration-300">
            <div className={`border-b px-5 py-3 flex justify-between items-center ${headerClass} bg-opacity-50`}>
                <h3 className="text-xs font-bold uppercase tracking-widest">{title || 'Comparativo por Responsable'}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-800 dark:text-slate-200 border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-900 z-20 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_4px_rgba(0,0,0,0.02)] min-w-[220px]" rowSpan={2}>
                                Responsable
                            </th>
                            <th className="px-4 py-2 font-bold bg-slate-100/50 dark:bg-slate-800/50 text-center border-b border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider" colSpan={2}>
                                Total General
                            </th>
                            {periods.map(period => {
                                const [mes, anio] = period.split('-');
                                return (
                                    <th key={period} className="px-4 py-2 font-semibold text-center border-b border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase" colSpan={2}>
                                        {mes} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">{anio}</span>
                                    </th>
                                );
                            })}
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-3 py-2 font-medium text-center text-slate-500 dark:text-slate-400 text-[10px] border-r border-slate-200 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10">Valor</th>
                            <th className="px-3 py-2 font-medium text-center text-slate-400 dark:text-slate-500 text-[10px] border-r border-slate-200 dark:border-slate-800">Tercero</th>

                            {periods.map(period => (
                                <Fragment key={period}>
                                    <th className="px-3 py-2 font-medium text-center text-slate-500 dark:text-slate-400 text-[10px] border-r border-slate-100 dark:border-slate-800 bg-indigo-50/10 dark:bg-indigo-900/5">Valor</th>
                                    <th className="px-3 py-2 font-medium text-center text-slate-400 dark:text-slate-500 text-[10px] border-r border-slate-100 dark:border-slate-800">Tercero</th>
                                </Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {matrix.rows.map((row: ResponsableRow, index: number) => (
                            <tr key={row.name} className={`
                        group hover:bg-indigo-600 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                    `}>
                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 group-hover:text-white sticky left-0 z-10 bg-inherit group-hover:bg-indigo-600 dark:group-hover:bg-indigo-900/60 border-r border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 shadow-[2px_0_4px_rgba(0,0,0,0.02)] whitespace-nowrap">
                                    {row.name}
                                </td>

                                {/* Datos Globales */}
                                <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100 group-hover:text-white border-r border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 tabular-nums bg-orange-50/10 dark:bg-orange-900/10 group-hover:bg-transparent">
                                    {formatCurrency(row.global.valor)}
                                </td>
                                <td className="px-3 py-2 text-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-200 border-r border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 text-[10px]">
                                    {renderTercerosCell(row.global.terceros)}
                                </td>

                                {periods.map(period => {
                                    const periodData = row.periods[period] || { valor: 0, terceros: new Set<string>() };
                                    const hasValue = periodData.valor > 0;
                                    return (
                                        <Fragment key={period}>
                                            <td className={`px-3 py-2 text-right font-medium border-r border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 tabular-nums ${hasValue ? 'text-slate-700 dark:text-slate-300 group-hover:text-white' : 'text-slate-200 dark:text-slate-700 group-hover:text-indigo-400'}`}>
                                                {hasValue ? formatCurrency(periodData.valor) : '-'}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 text-[10px] ${hasValue ? 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-200' : 'text-slate-200 dark:text-slate-800 group-hover:text-indigo-400/50'}`}>
                                                {renderTercerosCell(periodData.terceros)}
                                            </td>
                                        </Fragment>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border-t-2 border-slate-200 dark:border-slate-700 shadow-sm">
                            <td className="px-4 py-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">TOTALES</td>

                            <td className="px-3 py-3 text-right text-indigo-700 dark:text-indigo-400 border-r border-slate-300 dark:border-slate-600">
                                {formatCurrency(matrix.totals.global.valor)}
                            </td>
                            <td className="px-3 py-3 text-center text-[10px] text-slate-500 dark:text-slate-500 border-r border-slate-300 dark:border-slate-600">
                                {matrix.totals.global.terceros.size}
                            </td>

                            {periods.map(period => (
                                <Fragment key={period}>
                                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                                        {formatCurrency(matrix.totals.periods[period].valor)}
                                    </td>
                                    <td className="px-3 py-3 text-center text-[10px] text-slate-400 dark:text-slate-600 border-r border-slate-200 dark:border-slate-700">
                                        {matrix.totals.periods[period].terceros.size}
                                    </td>
                                </Fragment>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
