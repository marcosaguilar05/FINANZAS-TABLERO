import { ExternalLink } from 'lucide-react';
import type { FinancialRecord } from '../types';
import { formatCurrency } from '../utils';

interface TransactionsTableProps {
    data: FinancialRecord[];
    variant?: 'emerald' | 'slate' | 'blue' | 'indigo' | 'violet' | 'amber' | 'teal';
}

export default function TransactionsTable({ data, variant = 'slate' }: TransactionsTableProps) {
    const getHeaderStyle = () => {
        switch (variant) {
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30';
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30';
            case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30';
            case 'violet': return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900/30';
            case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30';
            case 'teal': return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900/30';
            default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700';
        }
    };

    const headerClass = getHeaderStyle();

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors duration-300">
            <div className={`border-b px-5 py-3 ${headerClass} bg-opacity-50`}>
                <h3 className="text-xs font-bold uppercase tracking-widest">Últimas Transacciones</h3>
            </div>
            <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm font-semibold text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">ID</th>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Fecha</th>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Área</th>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Dependencia</th>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Tercero</th>
                            <th className="px-4 py-3 font-medium bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Concepto</th>
                            <th className="px-4 py-3 font-medium text-center bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Soporte</th>
                            <th className="px-4 py-3 font-medium text-right bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.slice(0, 100).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{row.Consecutivo}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{row.Fecha_de_Pago}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{row.Area_operacion}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{row.Dependencia}</td>
                                <td className="px-4 py-2.5 truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-300" title={row.Tercero}>{row.Tercero}</td>
                                <td className="px-4 py-2.5 truncate max-w-[240px] text-slate-600 dark:text-slate-400" title={row.Concepto}>{row.Concepto}</td>
                                <td className="px-4 py-2.5 text-center">
                                    {row.Factura && (row.Factura.startsWith('http') || row.Factura.startsWith('www')) ? (
                                        <a
                                            href={row.Factura}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                            title="Ver Factura"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight tabular-nums bg-slate-50 dark:bg-slate-800/30 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                                    {formatCurrency(row.Valor_de_operacion)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
