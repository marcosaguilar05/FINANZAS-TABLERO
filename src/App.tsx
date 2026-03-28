import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, X, AlertTriangle, Filter, FileText, Calendar, Search, Calculator } from 'lucide-react';
import ReportView from './ReportView';
import RellenoPlantaView from './components/RellenoPlantaView';
import type { FinancialRecord, Filters } from './types';
import { CSV_URL, MESES_ORDEN, CHART_TOOLTIP_STYLE } from './constants';
import { parseCSVWithPapa, buildPeriodMatrix, formatCurrency } from './utils';
import FilterSelect from './components/FilterSelect';
import DataMatrix from './components/DataMatrix';
import ResponsableMatrix from './components/ResponsableMatrix';
import TransactionsTable from './components/TransactionsTable';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';

export default function App() {
    const [data, setData] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({ año: '', mes: '', empresa: '', area: '', grupo: '', rubro: '', subrubro: '', dependencia: '' });
    const [view, setView] = useState<'dashboard' | 'report' | 'relleno'>('dashboard');
    const { theme } = useTheme();

    const chartTheme = {
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        grid: theme === 'dark' ? '#334155' : '#f1f5f9',
        tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
        tooltipText: theme === 'dark' ? '#f8fafc' : '#1e293b'
    };

    useEffect(() => { fetchSheetData(); }, []);

    const fetchSheetData = async () => {
        setLoading(true);
        setError(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const response = await fetch(CSV_URL, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

            const csvText = await response.text();

            if (csvText.trim().toLowerCase().startsWith('<!doctype html') || csvText.includes('<html')) {
                throw new Error('La URL devolvió HTML en lugar de CSV. Verifica que el Google Sheet esté "Publicado en la web" (Archivo > Compartir > Publicar en la web > CSV).');
            }

            const records = parseCSVWithPapa(csvText);
            if (records.length === 0) throw new Error('No se encontraron registros en el archivo CSV.');

            setData(records);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (err.name === 'AbortError') {
                setError('La solicitud tardó demasiado. Verifica tu conexión a internet.');
            } else {
                setError(`Error de conexión: ${err.message}`);
            }
        } finally {
            setLoading(false);
            clearTimeout(timeoutId);
        }
    };

    const clearFilters = () => setFilters({ año: '', mes: '', empresa: '', area: '', grupo: '', rubro: '', subrubro: '', dependencia: '' });

    const handleChartClick = (field: keyof Filters, value: string) => {
        setFilters((prev: Filters) => ({ ...prev, [field]: prev[field] === value ? '' : value }));
    };

    const filteredData = useMemo(() => {
        const filtered = data.filter(item => {
            return (!filters.año || item.AÑO === filters.año)
                && (!filters.mes || (item.MES || '').toLowerCase() === filters.mes.toLowerCase())
                && (!filters.empresa || item.Empresa === filters.empresa)
                && (!filters.area || item.Area_operacion === filters.area)
                && (!filters.grupo || item.Grupo === filters.grupo)
                && (!filters.rubro || item.Rubro === filters.rubro)
                && (!filters.subrubro || item.Sub_rubro === filters.subrubro)
                && (!filters.dependencia || item.Dependencia === filters.dependencia);
        });

        return filtered.sort((a, b) => {
            const dateA = a.Fecha_de_Pago ? new Date(a.Fecha_de_Pago).getTime() : 0;
            const dateB = b.Fecha_de_Pago ? new Date(b.Fecha_de_Pago).getTime() : 0;
            return dateB - dateA;
        });
    }, [data, filters]);

    const options = useMemo(() => ({
        años: [...new Set(data.map(record => record.AÑO))].filter(Boolean).sort((a, b) => Number(b) - Number(a)),
        meses: [...new Set(filteredData.map(record => record.MES))].filter(Boolean).sort((a, b) => MESES_ORDEN.indexOf(a.toLowerCase()) - MESES_ORDEN.indexOf(b.toLowerCase())),
        empresas: [...new Set(filteredData.map(record => record.Empresa))].filter(Boolean).sort(),
        areas: [...new Set(filteredData.map(record => record.Area_operacion))].filter(Boolean).sort(),
        grupos: [...new Set(filteredData.map(record => record.Grupo))].filter(Boolean).sort(),
        rubros: [...new Set(filteredData.map(record => record.Rubro))].filter(Boolean).sort(),
        subrubros: [...new Set(filteredData.map(record => record.Sub_rubro))].filter(Boolean).sort(),
        dependencias: [...new Set(filteredData.map(record => record.Dependencia))].filter(Boolean).sort(),
    }), [data, filteredData]);

    const totalOperacion = useMemo(() =>
        filteredData.reduce((sum, item) => sum + (Number(item.Valor_de_operacion) || 0), 0),
        [filteredData]
    );

    const activePeriods = useMemo(() => {
        const uniquePeriods = new Set<string>();
        filteredData.forEach(record => {
            if (record.MES && record.AÑO) {
                const mes = record.MES.toLowerCase();
                uniquePeriods.add(`${mes}-${record.AÑO}`);
            }
        });

        return Array.from(uniquePeriods).sort((a, b) => {
            const [mesA, anioA] = a.split('-');
            const [mesB, anioB] = b.split('-');

            const yearA = Number(anioA);
            const yearB = Number(anioB);

            if (yearA !== yearB) return yearA - yearB;
            return MESES_ORDEN.indexOf(mesA) - MESES_ORDEN.indexOf(mesB);
        });
    }, [filteredData]);

    const matrizEmpresa = useMemo(() => buildPeriodMatrix(filteredData, record => record.Empresa), [filteredData]);
    const matrizGrupo = useMemo(() => buildPeriodMatrix(filteredData, record => record.Grupo), [filteredData]);
    const matrizRubro = useMemo(() => buildPeriodMatrix(filteredData, record => record.Rubro), [filteredData]);
    const matrizSubRubro = useMemo(() => buildPeriodMatrix(filteredData, record => record.Sub_rubro), [filteredData]);

    const chartDependencia = useMemo(() => {
        const aggregation: Record<string, number> = {};
        filteredData.forEach(record => {
            aggregation[record.Dependencia] = (aggregation[record.Dependencia] || 0) + (Number(record.Valor_de_operacion) || 0);
        });
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const chartMes = useMemo(() => {
        const aggregation: Record<string, { value: number; mes: string; anio: string }> = {};

        filteredData.forEach(record => {
            const mes = (record.MES || '').toLowerCase();
            const anio = (record.AÑO || '').toString();
            if (!mes) return;

            const key = `${mes}-${anio}`;
            if (!aggregation[key]) {
                aggregation[key] = { value: 0, mes, anio };
            }
            aggregation[key].value += (Number(record.Valor_de_operacion) || 0);
        });

        return Object.values(aggregation)
            .sort((a, b) => {
                const yearDiff = (Number(a.anio) || 0) - (Number(b.anio) || 0);
                if (yearDiff !== 0) return yearDiff;
                return MESES_ORDEN.indexOf(a.mes) - MESES_ORDEN.indexOf(b.mes);
            })
            .map(entry => ({
                name: `${entry.mes.toUpperCase()} ${entry.anio}`,
                value: entry.value,
                rawMes: entry.mes
            }));
    }, [filteredData]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 flex-col gap-4 font-sans transition-colors duration-300">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
            <p className="font-medium text-sm">Sincronizando datos...</p>
        </div>
    );

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 flex-col gap-6 p-8 text-center font-sans transition-colors duration-300">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-lg font-bold dark:text-white">Error de conexión</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">{error}</p>
            </div>
            <button
                onClick={fetchSheetData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm ring-1 ring-indigo-700/10"
            >
                <RefreshCw size={16} /> Reintentar
            </button>
        </div>
    );

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    if (view === 'report') {
        return <ReportView data={data} onBack={() => setView('dashboard')} />;
    }

    if (view === 'relleno') {
        return <RellenoPlantaView data={filteredData} filters={filters} onBack={() => setView('dashboard')} />;
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-indigo-200 dark:shadow-none shadow-lg">
                        <span className="text-white font-bold text-lg tracking-tight">$</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase leading-tight">
                            Tablero de Costos
                        </h1>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Panel de Control Financiero &bull; {filters.año || 'Histórico Completo'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Total Operación</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">{formatCurrency(totalOperacion)}</span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    <div className="flex gap-2 items-center">
                        <ThemeToggle />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
                            {filteredData.length} registros
                        </span>

                        <button
                            onClick={fetchSheetData}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
                            title="Actualizar datos"
                        >
                            <RefreshCw size={18} strokeWidth={2} />
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/50 transition-colors"
                            >
                                <X size={14} className="group-hover:rotate-90 transition-transform" />
                                Limpiar Filtros
                            </button>
                        )}

                        <button
                            onClick={() => setView('report')}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border border-slate-200 dark:border-slate-700"
                        >
                            <FileText size={14} />
                            Reporte Detallado
                        </button>

                        <button
                            onClick={() => setView('relleno')}
                            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border border-slate-900 dark:border-slate-700"
                        >
                            <Calculator size={14} />
                            Relleno y Planta
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-6 mt-6 mb-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Filter size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Filtros Globales</span>
                </div>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-4">
                    <FilterSelect label="Año" icon={<Calendar size={10} />} value={filters.año} options={options.años} onChange={(v: string) => setFilters({ ...filters, año: v })} />
                    <FilterSelect label="Mes" icon={<Calendar size={10} />} value={filters.mes} options={options.meses} onChange={(v: string) => setFilters({ ...filters, mes: v })} />
                    <FilterSelect label="Empresa" value={filters.empresa} options={options.empresas} onChange={(v: string) => setFilters({ ...filters, empresa: v })} />
                    <FilterSelect label="Área Op." value={filters.area} options={options.areas} onChange={(v: string) => setFilters({ ...filters, area: v })} />
                    <FilterSelect label="Dependencia" value={filters.dependencia} options={options.dependencias} onChange={(v: string) => setFilters({ ...filters, dependencia: v })} />
                    <FilterSelect label="Grupo" value={filters.grupo} options={options.grupos} onChange={(v: string) => setFilters({ ...filters, grupo: v })} />
                    <FilterSelect label="Rubro" value={filters.rubro} options={options.rubros} onChange={(v: string) => setFilters({ ...filters, rubro: v })} />
                    <FilterSelect label="Sub Rubro" value={filters.subrubro} options={options.subrubros} onChange={(v: string) => setFilters({ ...filters, subrubro: v })} />
                </div>
            </div>

            <main className="flex-1 overflow-auto px-6 pb-6 space-y-6">
                <DataMatrix
                    title="Empresa"
                    icon={<Search size={14} className="text-blue-500" />}
                    data={matrizEmpresa}
                    periods={activePeriods}
                    activeFilter={filters.empresa}
                    onRowClick={(v) => handleChartClick('empresa', v)}
                    maxHeight="240px"
                    variant="blue"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-5 flex flex-col h-[280px] transition-colors duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Distribución por Dependencia</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Valor total acumulado</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartDependencia} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={true} vertical={true} className="dark:opacity-30" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={110}
                                        tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ ...CHART_TOOLTIP_STYLE.contentStyle, backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, color: chartTheme.tooltipText }}
                                        itemStyle={{ ...CHART_TOOLTIP_STYLE.itemStyle, color: chartTheme.tooltipText }}
                                        formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                        onClick={(d) => handleChartClick('dependencia', String(d.name || ''))}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {chartDependencia.map((entry, i) => (
                                            <Cell key={i} fill={filters.dependencia === entry.name ? '#f59f0b' : (theme === 'dark' ? '#6366f1' : '#282bd8')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-5 flex flex-col h-[280px] transition-colors duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Evolución Mensual</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tendencia de costos en el tiempo</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartMes} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} className="dark:opacity-30" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: chartTheme.text }}
                                        tickLine={false}
                                        axisLine={{ stroke: chartTheme.grid }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ ...CHART_TOOLTIP_STYLE.contentStyle, backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, color: chartTheme.tooltipText }}
                                        itemStyle={{ ...CHART_TOOLTIP_STYLE.itemStyle, color: chartTheme.tooltipText }}
                                        formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        onClick={(d: any) => handleChartClick('mes', d.rawMes || '')}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {chartMes.map((entry: any, i) => (
                                            <Cell key={i} fill={filters.mes.toLowerCase() === (entry.rawMes || '').toLowerCase() ? '#f59e0b' : (theme === 'dark' ? '#3b82f6' : '#3b82f6')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DataMatrix title="Grupo" data={matrizGrupo} periods={activePeriods} activeFilter={filters.grupo} onRowClick={(v) => handleChartClick('grupo', v)} maxHeight="200px" variant="teal" />
                    <DataMatrix title="Rubro" data={matrizRubro} periods={activePeriods} activeFilter={filters.rubro} onRowClick={(v) => handleChartClick('rubro', v)} maxHeight="200px" variant="indigo" />
                </div>

                <DataMatrix title="Sub Rubro" data={matrizSubRubro} periods={activePeriods} activeFilter={filters.subrubro} onRowClick={(v) => handleChartClick('subrubro', v)} maxHeight="200px" variant="violet" />

                <TransactionsTable data={filteredData} variant="emerald" />

                <ResponsableMatrix data={filteredData} periods={activePeriods} variant="amber" />
            </main>
        </div>
    );
}
