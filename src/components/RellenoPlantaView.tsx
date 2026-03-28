import { useState, useMemo } from 'react';
import { ChevronLeft, FileSpreadsheet, Calculator, User, Clock, DollarSign, Info, Calendar } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import type { FinancialRecord, Filters } from '../types';
import { formatCurrency, formatNum } from '../utils';

interface RellenoPlantaViewProps {
    data: FinancialRecord[];
    filters: Filters;
    onBack: () => void;
}

// Función para extraer horas del texto de observaciones o calcularlas del valor
const getHorasReportadas = (record: FinancialRecord): number => {
    const obs = record.Observaciones || '';
    const valor = Number(record.Valor_de_operacion) || 0;

    // 1. Intentar Regex para "Horas reportadas: 7.5"
    const match = obs.match(/Horas reportadas:\s*(\d+[.,]?\d*)/i);
    if (match) {
        return parseFloat(match[1].replace(',', '.'));
    }

    // 2. Fallback: Valor / 65000 (según muestra: 487500 / 65000 = 7.5)
    return valor / 65000;
};

export default function RellenoPlantaView({ data, filters, onBack }: RellenoPlantaViewProps) {
    const [horasMesBase, setHorasMesBase] = useState<number>(220);
    const [sueldoConductor, setSueldoConductor] = useState<number>(5255141);
    const [selectedTercero, setSelectedTercero] = useState<string>('');

    // Obtener lista de terceros disponibles en los datos filtrados por mes/año
    const conductoresDisponibles = useMemo(() => {
        const unique = new Set<string>();
        data.filter(r => r.Consecutivo === 'MANO-MAQUI-01').forEach(r => {
            if (r.Tercero) unique.add(r.Tercero);
        });
        return Array.from(unique).sort();
    }, [data]);

    // 1. Filtrar registros por Consecutivo y Conductor Seleccionado
    const relevantRecords = useMemo(() => {
        if (!selectedTercero) return [];
        
        return data
            .filter(r => 
                r.Consecutivo === 'MANO-MAQUI-01' && 
                r.Tercero === selectedTercero
            )
            .map(r => ({
                ...r,
                extractedHours: getHorasReportadas(r)
            }))
            .filter(r => r.extractedHours > 0);
    }, [data, selectedTercero]);

    // 2. Procesar datos para la tabla (Agrupados por ACTIVIDAD / CONCEPTO)
    const processedData = useMemo(() => {
        if (relevantRecords.length === 0) return [];

        // Agrupación por Actividad (Concepto)
        const groupMap: Record<string, {
            totalHoras: number,
            placas: Set<string>,
            fechas: Set<string>,
            empresa: string,
            area: string
        }> = {};

        relevantRecords.forEach(r => {
            const act = r.Concepto || 'SIN ACTIVIDAD';
            if (!groupMap[act]) {
                groupMap[act] = {
                    totalHoras: 0,
                    placas: new Set(),
                    fechas: new Set(),
                    empresa: r.Empresa,
                    area: r.Area_operacion
                };
            }
            groupMap[act].totalHoras += r.extractedHours;
            if (r.Placa) groupMap[act].placas.add(r.Placa);
            if (r.Fecha_de_Creacion) groupMap[act].fechas.add(r.Fecha_de_Creacion);
        });

        const totalHorasMaquinaTotal = relevantRecords.reduce((sum, r) => sum + r.extractedHours, 0); // Factor B
        const tarifaHora = sueldoConductor / horasMesBase; // Formula A

        return Object.entries(groupMap).map(([actividad, meta]) => {
            const horasLaboradas = meta.totalHoras; // Horas H (Suma del Grupo)
            const porcentajeDistribucion = horasLaboradas / totalHorasMaquinaTotal; // Formula D
            const horasSinMaquina = (horasMesBase - totalHorasMaquinaTotal) * porcentajeDistribucion; // Formula E
            const totalHorasF = horasLaboradas + horasSinMaquina; // Formula F
            const costoMO = totalHorasF * tarifaHora; // Formula G

            return {
                responsable: selectedTercero,
                actividad,
                empresa: meta.empresa,
                area: meta.area,
                placas: Array.from(meta.placas).join(', '),
                fechas: Array.from(meta.fechas).sort().join(' / '),
                horasLaboradas,
                totalHorasMaquina: totalHorasMaquinaTotal, // Factor B (Glogal para el operario)
                porcentajeDistribucion, // Factor D
                horasSinMaquina, // Factor E
                totalHoras: totalHorasF, // Factor F
                costoMO // Factor G
            };
        });
    }, [relevantRecords, horasMesBase, sueldoConductor, selectedTercero]);

    const exportToExcel = () => {
        if (processedData.length === 0) return;

        const ws: any = {};
        const headers = [
            'Conductor', 'Actividad', 'Detalles Equipo', 'Horas Máq (H)', 'Total Mes Máq (B)', '% Dist (D)', 'Horas Dist (E)', 'Total Horas (F)', 
            'Valor Final (G)', 'Fechas Incluidas'
        ];
        
        let rowIndex = 0;

        const headerStyle = {
            fill: { patternType: 'solid', fgColor: { rgb: '1E4976' } },
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
            alignment: { horizontal: 'center' },
            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        };

        headers.forEach((h, i) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: i });
            ws[cellRef] = { v: h, t: 's', s: headerStyle };
        });
        rowIndex++;

        processedData.forEach(row => {
            const rowData = [
                row.responsable, row.actividad, row.placas,
                row.horasLaboradas, row.totalHorasMaquina, row.porcentajeDistribucion, row.horasSinMaquina, row.totalHoras,
                row.costoMO, row.fechas
            ];

            rowData.forEach((val, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                const isNumeric = typeof val === 'number';
                const isCurrency = colIndex === 8;
                const isPercent = colIndex === 5;
                
                ws[cellRef] = { 
                    v: val, 
                    t: isNumeric ? 'n' : 's',
                    z: isCurrency ? '"$"#,##0' : (isPercent ? '0.00%' : '0.00'),
                    s: {
                        alignment: { horizontal: isNumeric ? 'right' : 'left', vertical: 'center' },
                        border: { bottom: { style: 'thin', color: { rgb: 'E5E7EB' } } }
                    }
                };
            });
            rowIndex++;
        });

        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIndex - 1, c: headers.length - 1 } });
        ws['!cols'] = [
            { wch: 25 }, { wch: 25 }, { wch: 20 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
            { wch: 18 }, { wch: 40 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relleno Consolidado');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf]), `Consolidado_${selectedTercero}_${filters.mes}_${filters.año}.xlsx`);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 shrink-0 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors border border-transparent hover:border-slate-200"
                            title="Volver"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    CONSOLIDADO <span className="text-indigo-600 dark:text-indigo-400">|</span> RELLENO Y PLANTA
                                </h1>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    <Calendar size={10} className="text-indigo-500" />
                                    <span>{filters.año || '----'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{filters.mes || 'TODO EL AÑO'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-[200px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">Seleccionar Conductor</label>
                            <select
                                value={selectedTercero}
                                onChange={(e) => setSelectedTercero(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">--- ELIJA UN TRABAJADOR ---</option>
                                {conductoresDisponibles.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                            <div className="flex flex-col px-3 border-r border-slate-200 dark:border-slate-700">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Horas Mes</label>
                                <input 
                                    type="number" 
                                    value={horasMesBase} 
                                    onChange={(e) => setHorasMesBase(Number(e.target.value))}
                                    className="bg-transparent text-sm font-black text-slate-800 dark:text-slate-100 outline-none w-14"
                                />
                            </div>
                            <div className="flex flex-col px-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Sueldo Base</label>
                                <input 
                                    type="number" 
                                    value={sueldoConductor} 
                                    onChange={(e) => setSueldoConductor(Number(e.target.value))}
                                    className="bg-transparent text-sm font-black text-slate-800 dark:text-slate-100 outline-none w-24"
                                />
                            </div>
                        </div>

                        <button
                            onClick={exportToExcel}
                            disabled={!selectedTercero}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 ${
                                !selectedTercero 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900'
                            }`}
                        >
                            <FileSpreadsheet size={14} />
                            Exportar Consolidado
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 space-y-6">
                {!selectedTercero ? (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <User size={32} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Generación de Reporte Consolidado</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Selecciona un trabajador para ver sus actividades agrupadas por concepto y el cálculo redistribuido de su nómina operativa.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : processedData.length === 0 ? (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <div className="text-center space-y-3">
                            <Info size={32} className="mx-auto text-amber-500" />
                            <p className="text-slate-500 font-medium">No se hallaron registros para este conductor en el periodo seleccionado.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-mono">
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Actividad Agrupada (Concepto)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Equipos Utilizados</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Tot (H)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Mes (B)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">% Dist (D)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">H-Dist (E)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Suma F (H+E)</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Valor Liquidado (G)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {processedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{row.actividad}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 line-clamp-1 italic">{row.area}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter" title={row.placas}>{row.placas || 'N/A'}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center tabular-nums text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">{formatNum(row.horasLaboradas)}</td>
                                                <td className="px-4 py-4 text-center tabular-nums text-xs font-medium text-slate-400">{formatNum(row.totalHorasMaquina)}</td>
                                                <td className="px-4 py-4 text-center tabular-nums text-xs font-bold text-indigo-600 dark:text-indigo-400">{(row.porcentajeDistribucion * 100).toFixed(2)}%</td>
                                                <td className="px-4 py-4 text-center tabular-nums text-xs font-medium text-slate-500">{formatNum(row.horasSinMaquina)}</td>
                                                <td className="px-4 py-4 text-center tabular-nums text-xs font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/20">{formatNum(row.totalHoras)}</td>
                                                <td className="px-4 py-4 text-right tabular-nums text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(row.costoMO)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 overflow-hidden">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trabajador</span>
                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {selectedTercero}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Horas Mes (B)</span>
                                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {formatNum(processedData.reduce((s, r) => s + r.horasLaboradas, 0))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 border-l-4 border-l-emerald-500">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Nómina Liquidada</span>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatCurrency(processedData.reduce((s, r) => s + r.costoMO, 0))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 border-l-4 border-l-indigo-500">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest">Categorías</span>
                                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                    {processedData.length}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
