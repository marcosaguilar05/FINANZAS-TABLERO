import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileSpreadsheet } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

interface FinancialRecord {
    Consecutivo: string;
    Empresa: string;
    Area_operacion: string;
    Dependencia: string;
    Grupo: string;
    Rubro: string;
    Sub_rubro: string;
    Placa: string;
    Valor_de_operacion: number;
    MES: string;
    AÑO: string;
    [key: string]: any;
}

interface ReportFilters {
    año: string;
    mes: string;
    mesComparativo: string;
    empresa: string;
    area: string;
}

interface ReportViewProps {
    data: FinancialRecord[];
    onBack: () => void;
}

interface TreeNode {
    name: string;
    count: number;
    total: number;
    countComp: number;
    totalComp: number;
    level: number;
    children: TreeNode[];
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const MESES_ORDEN = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const LEVELS = ['Dependencia', 'Grupo', 'Rubro', 'Sub_rubro', 'Placa'];
const DEFAULTS = ['SIN DEPENDENCIA', 'SIN GRUPO', 'SIN RUBRO', 'SIN SUB RUBRO', 'NO APLICA'];

// Helper para agrupar datos por un campo
const groupData = (items: FinancialRecord[], field: string, defaultValue: string) => {
    const map: Record<string, FinancialRecord[]> = {};
    
    const gruposEspeciales = [
        'NOMINA Y RECURSOS HUMANOS OPERATIVO',
        'NOMINA Y RECURSOS HUMANOS - ADMINISTRATIVO',
        'NOMINA Y RECURSOS HUMANOS - COMERCIAL',
        'GASTOS DE PERSONAL- TRANSPORTES'
    ].map(g => g.trim().toUpperCase());

    items.forEach(i => {
        let key = i[field] || defaultValue;

        if (field === 'Placa' && i.Grupo) {
            const grupoStr = String(i.Grupo).trim().toUpperCase();
            if (gruposEspeciales.includes(grupoStr)) {
                key = i.Tercero || defaultValue;
            }
        }

        if (!map[key]) map[key] = [];
        map[key].push(i);
    });
    return map;
};

// Función recursiva para construir la jerarquía combinando ambos datasets
function buildHierarchy(itemsA: FinancialRecord[], itemsB: FinancialRecord[], level: number): TreeNode[] {
    if (level >= LEVELS.length) return [];

    const field = LEVELS[level];
    const defaultValue = DEFAULTS[level];

    const groupA = groupData(itemsA, field, defaultValue);
    const groupB = groupData(itemsB, field, defaultValue);

    // Obtener todas las claves únicas de ambos datasets
    const allKeys = new Set([...Object.keys(groupA), ...Object.keys(groupB)]);

    // Ordenar claves
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
        if (level === 0) return compareDependencias(a, b);
        return a.localeCompare(b);
    });

    return sortedKeys
        .filter(key => !(level === 4 && String(key).trim().toUpperCase() === 'NO APLICA'))
        .map(key => {
        const childrenA = groupA[key] || [];
        const childrenB = groupB[key] || [];

        const totalA = childrenA.reduce((s, i) => s + (Number(i.Valor_de_operacion) || 0), 0);
        const totalB = childrenB.reduce((s, i) => s + (Number(i.Valor_de_operacion) || 0), 0);

        return {
            name: key,
            count: childrenA.length,
            total: totalA,
            countComp: childrenB.length,
            totalComp: totalB,
            level: level,
            children: buildHierarchy(childrenA, childrenB, level + 1)
        };
    });
}

const ORDEN_DEPENDENCIAS = ['OPERATIVO', 'TRANSPORTES', 'ADMINISTRATIVO', 'COMERCIAL', 'INVERSIONES', 'INVERSION'];

// Función de comparación para dependencias
const compareDependencias = (a: string, b: string) => {
    const indexA = ORDEN_DEPENDENCIAS.indexOf(a.toUpperCase());
    const indexB = ORDEN_DEPENDENCIAS.indexOf(b.toUpperCase());

    // Ambos están en la lista
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // Solo A está en la lista -> va antes
    if (indexA !== -1) return -1;
    // Solo B está en la lista -> va antes
    if (indexB !== -1) return 1;

    // Ninguno está en la lista -> alfabético
    return a.localeCompare(b);
};

export default function ReportView({ data, onBack }: ReportViewProps) {
    const [filters, setFilters] = useState<ReportFilters>({ año: '', mes: '', mesComparativo: '', empresa: '', area: '' });
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Opciones de filtros basadas en datos completos
    const options = useMemo(() => ({
        años: [...new Set(data.map(d => d.AÑO))].filter(Boolean).sort((a, b) => Number(b) - Number(a)),
        meses: [...new Set(data.map(d => d.MES))].filter(Boolean).sort((a, b) => MESES_ORDEN.indexOf(a.toLowerCase()) - MESES_ORDEN.indexOf(b.toLowerCase())),
        empresas: [...new Set(data.map(d => d.Empresa))].filter(Boolean).sort(),
        areas: [...new Set(data.map(d => d.Area_operacion))].filter(Boolean).sort(),
    }), [data]);

    // Datos filtrados mes principal
    const filteredData = useMemo(() => {
        return data.filter(item => {
            return (!filters.año || item.AÑO === filters.año)
                && (!filters.mes || (item.MES || '').toLowerCase() === filters.mes.toLowerCase())
                && (!filters.empresa || item.Empresa === filters.empresa)
                && (!filters.area || item.Area_operacion === filters.area);
        });
    }, [data, filters.año, filters.mes, filters.empresa, filters.area]);

    // Datos filtrados mes comparativo
    const compData = useMemo(() => {
        if (!filters.mesComparativo) return [];
        return data.filter(item => {
            return (!filters.año || item.AÑO === filters.año)
                && (item.MES || '').toLowerCase() === filters.mesComparativo.toLowerCase()
                && (!filters.empresa || item.Empresa === filters.empresa)
                && (!filters.area || item.Area_operacion === filters.area);
        });
    }, [data, filters.año, filters.mesComparativo, filters.empresa, filters.area]);

    const hasComparison = filters.mesComparativo !== '';

    // Construir árbol jerárquico unificado
    const reportTree = useMemo(() => {
        return buildHierarchy(filteredData, compData, 0);
    }, [filteredData, compData]);

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpanded(newExpanded);
    };

    const expandAll = () => {
        const allPaths = new Set<string>();
        const traverse = (nodes: TreeNode[], prefix: string) => {
            nodes.forEach((node, idx) => {
                const path = `${prefix}/${idx}`;
                if (node.children.length > 0) {
                    allPaths.add(path);
                    traverse(node.children, path);
                }
            });
        };
        traverse(reportTree, '');
        setExpanded(allPaths);
    };

    const collapseAll = () => setExpanded(new Set());

    // Colores por nivel para Excel
    const LEVEL_STYLES: Record<number, { fill: string; fontColor: string; bold: boolean; borderColor: string }> = {
        0: { fill: '1E4976', fontColor: 'FFFFFF', bold: true, borderColor: '1E4976' },  // Dependencia - Azul oscuro
        1: { fill: '3B82F6', fontColor: 'FFFFFF', bold: true, borderColor: '3B82F6' },  // Grupo - Azul medio
        2: { fill: '93C5FD', fontColor: '1E3A5F', bold: true, borderColor: '93C5FD' },  // Rubro - Azul claro
        3: { fill: 'DBEAFE', fontColor: '1E3A5F', bold: false, borderColor: 'DBEAFE' }, // SubRubro - Azul muy claro
        4: { fill: 'F3F4F6', fontColor: '374151', bold: false, borderColor: 'E5E7EB' }, // Placa - Gris claro
    };

    // Crear celda con estilo
    const createCell = (value: any, level: number, isNumeric: boolean = false, colIndex: number = 0) => {
        const style = level === -1
            ? { fill: '0F2744', fontColor: 'FFFFFF', bold: true, borderColor: '0F2744' }
            : LEVEL_STYLES[level] || LEVEL_STYLES[4];

        const cellStyle = {
            fill: { patternType: 'solid', fgColor: { rgb: style.fill } },
            font: {
                bold: style.bold,
                color: { rgb: style.fontColor },
                sz: level === -1 ? 11 : (level === 0 ? 12 : level === 1 ? 11 : 10),
                name: 'Calibri'
            },
            alignment: {
                horizontal: colIndex === 0 ? 'left' : (level === -1 ? 'center' : 'right'),
                vertical: 'center'
            },
            border: {
                top: { style: 'thin', color: { rgb: style.borderColor } },
                bottom: { style: 'thin', color: { rgb: style.borderColor } },
                left: { style: 'thin', color: { rgb: style.borderColor } },
                right: { style: 'thin', color: { rgb: style.borderColor } }
            }
        };

        if (isNumeric && typeof value === 'number') {
            return { v: value, t: 'n', s: cellStyle, z: '"$"#,##0' };
        } else if (typeof value === 'number') {
            return { v: value, t: 'n', s: cellStyle };
        } else {
            return { v: String(value), t: 's', s: cellStyle };
        }
    };

    // Exportar a Excel con formato completo
    const exportToExcel = () => {
        // Crear worksheet manualmente
        const ws: any = {};
        let rowIndex = 0;

        // Headers
        // Headers
        const headers = hasComparison
            ? ['DETALLE', 'CANT', `COSTO ${filters.mes?.toUpperCase() || 'MES'}`, 'CANT COMP', `COSTO ${filters.mesComparativo?.toUpperCase()}`]
            : ['DETALLE', 'CANT', 'COSTO'];

        // --- SECCIÓN DE RESUMEN (NUEVO) ---
        // 1. Encabezado del Resumen
        headers.forEach((header, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            // Estilo específico para el encabezado del resumen (ej. Verde oscuro o similar al dashboard)
            const style = { fill: '27AE60', fontColor: 'FFFFFF', bold: true, borderColor: '27AE60' };
            const cellStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: style.fill } },
                font: { bold: true, color: { rgb: style.fontColor }, sz: 12, name: 'Calibri' },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: style.borderColor } },
                    bottom: { style: 'thin', color: { rgb: style.borderColor } },
                    left: { style: 'thin', color: { rgb: style.borderColor } },
                    right: { style: 'thin', color: { rgb: style.borderColor } }
                }
            };
            ws[cellRef] = { v: header, t: 's', s: cellStyle };
        });
        rowIndex++;

        // 2. Filas del Resumen (Iterar solo nivel 0 - Dependencias)
        reportTree.forEach(node => {
            const colCount = hasComparison ? 5 : 3;
            for (let colIndex = 0; colIndex < colCount; colIndex++) {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                let value: any;
                let isNumeric = false;

                // Estilo para las filas de resumen (Negrita, fondo suave)
                const style = { fill: 'E8F5E9', fontColor: '2C3E50', bold: true, borderColor: 'A5D6A7' };
                const cellStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: style.fill } },
                    font: { bold: true, color: { rgb: style.fontColor }, sz: 11, name: 'Calibri' },
                    alignment: { horizontal: colIndex === 0 ? 'left' : 'right', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: style.borderColor } },
                        bottom: { style: 'thin', color: { rgb: style.borderColor } },
                        left: { style: 'thin', color: { rgb: style.borderColor } },
                        right: { style: 'thin', color: { rgb: style.borderColor } }
                    }
                };

                if (colIndex === 0) value = `▼ ${node.name}`; // Agregamos el ícono como pidió el usuario
                else if (colIndex === 1) value = node.count;
                else if (colIndex === 2) { value = node.total; isNumeric = true; }
                else if (colIndex === 3) value = node.countComp;
                else if (colIndex === 4) { value = node.totalComp; isNumeric = true; }

                if (isNumeric) {
                    ws[cellRef] = { v: value, t: 'n', s: cellStyle, z: '"$"#,##0' };
                } else {
                    ws[cellRef] = { v: String(value), t: 's', s: cellStyle };
                }
            }
            rowIndex++;
        });

        // 3. Separador
        rowIndex += 2;

        // --- FIN SECCIÓN RESUMEN ---

        // Repetimos Headers para la tabla detallada (Lo de siempre)
        headers.forEach((header, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            ws[cellRef] = createCell(header, -1, false, colIndex);
        });
        rowIndex++;

        // Datos del árbol
        const traverse = (nodes: TreeNode[], indent: number) => {
            nodes.forEach(node => {
                const prefix = '    '.repeat(indent);
                const colCount = hasComparison ? 5 : 3;

                for (let colIndex = 0; colIndex < colCount; colIndex++) {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    let value: any;
                    let isNumeric = false;

                    if (colIndex === 0) {
                        value = `${prefix}${node.name}`;
                    } else if (colIndex === 1) {
                        value = node.level === 3 ? node.count : '';
                    } else if (colIndex === 2) {
                        value = node.total;
                        isNumeric = true;
                    } else if (colIndex === 3) {
                        value = node.level === 3 ? node.countComp : '';
                    } else if (colIndex === 4) {
                        value = node.totalComp;
                        isNumeric = true;
                    }

                    ws[cellRef] = createCell(value, node.level, isNumeric, colIndex);
                }

                rowIndex++;

                if (node.children.length > 0) {
                    traverse(node.children, indent + 1);
                }
            });
        };

        traverse(reportTree, 0);

        // Establecer rango
        const colCount = hasComparison ? 5 : 3;
        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIndex - 1, c: colCount - 1 } });

        // Ajustar anchos de columna
        ws['!cols'] = hasComparison
            ? [{ wch: 65 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 18 }]
            : [{ wch: 65 }, { wch: 8 }, { wch: 18 }];

        // Altura de filas
        const rowHeights: any[] = [];
        for (let i = 0; i < rowIndex; i++) {
            rowHeights.push({ hpt: 20 });
        }
        ws['!rows'] = rowHeights;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const compLabel = hasComparison ? `_vs_${filters.mesComparativo}` : '';
        const fileName = `Reporte_${filters.mes || 'TODOS'}${compLabel}_${filters.empresa || 'TODAS'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);
    };

    const renderTree = (nodes: TreeNode[], parentPath: string = '') => {
        return nodes.map((node, idx) => {
            const path = `${parentPath}/${idx}`;
            const isExpanded = expanded.has(path);
            const hasChildren = node.children.length > 0;

            const levelStyles: Record<number, { bg: string; text: string; font: string; icon: string; indent: string }> = {
                0: { bg: 'bg-gradient-to-r from-[#4f7cac] to-[#2c5282] dark:from-blue-900 dark:to-slate-900', text: 'text-white', font: 'font-bold text-sm', icon: '▼', indent: 'pl-0' },
                1: { bg: 'bg-[#dce4ed] dark:bg-slate-800', text: 'text-[#2c3e50] dark:text-slate-200', font: 'font-bold text-xs', icon: '▸', indent: 'pl-4' },
                2: { bg: 'bg-[#f4f7fa] dark:bg-slate-800/50', text: 'text-[#2c3e50] dark:text-slate-300', font: 'font-semibold text-xs', icon: '•', indent: 'pl-8' },
                3: { bg: 'bg-[#fafbfc] dark:bg-slate-900', text: 'text-[#4a5568] dark:text-slate-400', font: 'font-medium text-xs', icon: '', indent: 'pl-12' },
                4: { bg: 'bg-white dark:bg-slate-950', text: 'text-[#6b7c93] dark:text-slate-500', font: 'font-normal text-[11px]', icon: '', indent: 'pl-16' },
            };

            const style = levelStyles[node.level] || levelStyles[4];

            return (
                <div key={path}>
                    <div
                        className={`flex items-center justify-between py-2 px-4 ${style.bg} ${style.text} ${style.indent} ${hasChildren ? 'cursor-pointer hover:opacity-90' : ''} transition-all`}
                        onClick={() => hasChildren && toggleExpand(path)}
                    >
                        <div className={`flex items-center gap-2 ${style.font} flex-1`}>
                            {hasChildren && (
                                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            )}
                            {!hasChildren && node.level < 4 && <span className="w-[14px]" />}
                            <span>{style.icon && `${style.icon} `}{node.name}</span>
                        </div>
                        <div className="flex items-center">
                            {/* Mes Principal */}
                            {node.level === 3 && <span className="text-xs w-14 text-center">{node.count}</span>}
                            {node.level < 3 && <span className="w-14" />}
                            <span className={`${style.font} w-28 text-right tabular-nums`}>{formatCurrency(node.total)}</span>

                            {/* Mes Comparativo */}
                            {hasComparison && (
                                <>
                                    <span className="w-4" />
                                    {node.level === 3 && <span className="text-xs w-14 text-center text-[#e67e22]">{node.countComp}</span>}
                                    {node.level < 3 && <span className="w-14" />}
                                    <span className={`${style.font} w-28 text-right tabular-nums text-[#e67e22]`}>{formatCurrency(node.totalComp)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {hasChildren && isExpanded && renderTree(node.children, path)}
                </div>
            );
        });
    };

    const totalGeneral = reportTree.reduce((s, n) => s + n.total, 0);
    const totalComp = reportTree.reduce((s, n) => s + n.totalComp, 0);

    return (
        <div className="h-screen flex flex-col bg-[#e8eef5] dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-300">
            {/* HEADER NEUMORPHISM */}
            <header className="bg-[#e8eef5] dark:bg-slate-900 px-6 py-3 flex justify-between items-center shrink-0 shadow-[0_4px_15px_rgba(166,180,200,0.4)] dark:shadow-none dark:border-b dark:border-slate-800 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-xl bg-[#e8eef5] dark:bg-slate-800 text-[#4f7cac] dark:text-blue-400 font-bold text-xs hover:text-[#2c5282] dark:hover:text-blue-300 transition-all shadow-[4px_4px_8px_#c5cdd8,-4px_-4px_8px_#ffffff] dark:shadow-none dark:border dark:border-slate-700"
                    >
                        ← Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#27ae60] to-[#2ecc71] flex items-center justify-center shadow-[4px_4px_8px_#c5cdd8,-4px_-4px_8px_#ffffff] dark:shadow-none dark:opacity-90">
                            <FileSpreadsheet size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-[#2c3e50] dark:text-slate-100 tracking-tight">
                                REPORTE DETALLADO
                            </h1>
                            <span className="text-[10px] text-[#6b7c93] dark:text-slate-400 font-medium">Análisis de Costos por Jerarquía</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-[#e8eef5] dark:bg-slate-800 text-right shadow-[inset_4px_4px_8px_#c5cdd8,inset_-4px_-4px_8px_#ffffff] dark:shadow-none dark:border dark:border-slate-700/50">
                        <div className="text-xl font-black text-[#27ae60] dark:text-emerald-400 tabular-nums">{formatCurrency(totalGeneral)}</div>
                        {hasComparison && <div className="text-sm font-bold text-[#e67e22] dark:text-amber-400">{formatCurrency(totalComp)}</div>}
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="bg-gradient-to-r from-[#27ae60] to-[#2ecc71] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs transition-all hover:shadow-lg shadow-[4px_4px_8px_#c5cdd8,-4px_-4px_8px_#ffffff] dark:shadow-none dark:hover:opacity-90"
                    >
                        <FileSpreadsheet size={14} /> Exportar Excel
                    </button>
                </div>
            </header>

            {/* FILTROS NEUMORPHISM */}
            <div className="mx-4 mt-3 mb-2 p-4 rounded-2xl bg-[#e8eef5] dark:bg-slate-900 shadow-[inset_3px_3px_6px_#c5cdd8,inset_-3px_-3px_6px_#ffffff] dark:shadow-none dark:border dark:border-slate-800 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[100px]">
                        <label className="block text-[9px] font-bold text-[#4f7cac] dark:text-blue-400 uppercase mb-1">AÑO</label>
                        <select
                            value={filters.año}
                            onChange={(e) => setFilters({ ...filters, año: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-[#2c3e50] dark:text-slate-200 bg-[#f4f7fa] dark:bg-slate-800 outline-none shadow-[inset_2px_2px_4px_#c5cdd8,inset_-2px_-2px_4px_#ffffff] dark:shadow-none dark:border dark:border-slate-700"
                        >
                            <option value="">Todos</option>
                            {options.años.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[140px]">
                        <label className="block text-[9px] font-bold text-[#4f7cac] dark:text-blue-400 uppercase mb-1">MES PRINCIPAL</label>
                        <select
                            value={filters.mes}
                            onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-[#2c3e50] dark:text-slate-200 bg-[#f4f7fa] dark:bg-slate-800 outline-none shadow-[inset_2px_2px_4px_#c5cdd8,inset_-2px_-2px_4px_#ffffff] dark:shadow-none dark:border dark:border-slate-700"
                        >
                            <option value="">Todos</option>
                            {options.meses.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[140px]">
                        <label className="block text-[9px] font-bold text-[#e67e22] dark:text-amber-400 uppercase mb-1">MES COMPARATIVO</label>
                        <select
                            value={filters.mesComparativo}
                            onChange={(e) => setFilters({ ...filters, mesComparativo: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-[#e67e22] dark:text-amber-400 bg-[#fef3c7] dark:bg-amber-900/30 outline-none shadow-[inset_2px_2px_4px_#f59e0b33,inset_-2px_-2px_4px_#ffffff] dark:shadow-none dark:border dark:border-amber-900/50"
                        >
                            <option value="">Sin comparar</option>
                            {options.meses.filter(m => m !== filters.mes).map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[160px]">
                        <label className="block text-[9px] font-bold text-[#4f7cac] dark:text-blue-400 uppercase mb-1">EMPRESA</label>
                        <select
                            value={filters.empresa}
                            onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-[#2c3e50] dark:text-slate-200 bg-[#f4f7fa] dark:bg-slate-800 outline-none shadow-[inset_2px_2px_4px_#c5cdd8,inset_-2px_-2px_4px_#ffffff] dark:shadow-none dark:border dark:border-slate-700"
                        >
                            <option value="">Todas</option>
                            {options.empresas.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[160px]">
                        <label className="block text-[9px] font-bold text-[#4f7cac] dark:text-blue-400 uppercase mb-1">ÁREA OPERACIÓN</label>
                        <select
                            value={filters.area}
                            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-[#2c3e50] dark:text-slate-200 bg-[#f4f7fa] dark:bg-slate-800 outline-none shadow-[inset_2px_2px_4px_#c5cdd8,inset_-2px_-2px_4px_#ffffff] dark:shadow-none dark:border dark:border-slate-700"
                        >
                            <option value="">Todas</option>
                            {options.areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2 pb-0.5">
                        <button onClick={expandAll} className="bg-gradient-to-r from-[#4f7cac] to-[#2c5282] dark:from-blue-600 dark:to-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[3px_3px_6px_#c5cdd8,-3px_-3px_6px_#ffffff] dark:shadow-none dark:border dark:border-blue-700 dark:hover:bg-blue-700">
                            Expandir
                        </button>
                        <button onClick={collapseAll} className="bg-[#e8eef5] dark:bg-slate-800 text-[#6b7c93] dark:text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[3px_3px_6px_#c5cdd8,-3px_-3px_6px_#ffffff] dark:shadow-none dark:border dark:border-slate-700 dark:hover:text-slate-300">
                            Colapsar
                        </button>
                    </div>
                </div>
            </div>

            {/* ENCABEZADO DE TABLA */}
            <div className="mx-4 bg-gradient-to-r from-[#4f7cac] to-[#2c5282] dark:from-blue-900 dark:to-slate-900 px-4 py-2.5 flex items-center justify-between text-white/90 text-xs font-bold rounded-t-xl transition-colors">
                <span className="flex-1">DETALLE</span>
                <div className="flex items-center">
                    <span className="w-14 text-center">CANT</span>
                    <span className="w-28 text-right">{filters.mes ? `COSTO ${filters.mes.toUpperCase()}` : 'COSTO MES'}</span>
                    {hasComparison && (
                        <>
                            <span className="w-4" />
                            <span className="w-14 text-center text-[#fcd34d]">CANT</span>
                            <span className="w-28 text-right text-[#fcd34d]">COSTO {filters.mesComparativo.toUpperCase()}</span>
                        </>
                    )}
                </div>
            </div>

            {/* CONTENIDO DEL REPORTE */}
            <main className="flex-1 mx-4 overflow-auto bg-[#fafbfc] dark:bg-slate-950 rounded-b-xl shadow-[inset_2px_2px_6px_#c5cdd8,inset_-2px_-2px_6px_#ffffff] dark:shadow-none dark:border-x dark:border-b dark:border-slate-800 transition-colors">
                {reportTree.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[#6b7c93] dark:text-slate-500">
                        No hay datos para mostrar con los filtros seleccionados
                    </div>
                ) : (
                    renderTree(reportTree)
                )}
            </main>

            {/* FOOTER CON TOTAL */}
            <footer className="bg-[#e8eef5] dark:bg-slate-900 px-6 py-3 flex justify-between items-center shrink-0 shadow-[0_-4px_15px_rgba(166,180,200,0.3)] dark:shadow-none dark:border-t dark:border-slate-800 transition-colors">
                <span className="text-xs text-[#6b7c93] dark:text-slate-500 font-medium">{filteredData.length} registros</span>
                <div className="flex items-center gap-6">
                    <div className="text-right px-4 py-2 rounded-xl bg-[#e8eef5] dark:bg-slate-800 shadow-[inset_3px_3px_6px_#c5cdd8,inset_-3px_-3px_6px_#ffffff] dark:shadow-none dark:border dark:border-slate-700">
                        <span className="text-xs text-[#6b7c93] dark:text-slate-400 mr-2">TOTAL {filters.mes?.toUpperCase() || 'GENERAL'}:</span>
                        <span className="text-lg font-black text-[#27ae60] dark:text-emerald-400">{formatCurrency(totalGeneral)}</span>
                    </div>
                    {hasComparison && (
                        <div className="text-right px-4 py-2 rounded-xl bg-[#fef3c7] dark:bg-amber-900/20 shadow-[inset_3px_3px_6px_#f59e0b33,inset_-3px_-3px_6px_#ffffff] dark:shadow-none dark:border dark:border-amber-900/50">
                            <span className="text-xs text-[#d97706] dark:text-amber-500 mr-2">TOTAL {filters.mesComparativo.toUpperCase()}:</span>
                            <span className="text-lg font-black text-[#e67e22] dark:text-amber-400">{formatCurrency(totalComp)}</span>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}
