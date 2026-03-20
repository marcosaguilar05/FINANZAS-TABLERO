import Papa from 'papaparse';
import type { FinancialRecord } from './types';
import { HEADER_MAP, NUMERIC_FIELDS } from './constants';

export function parseNumericValue(value: string): number {
    if (!value || value === '') return 0;
    // Colombian number format: dots as thousands separator, comma as decimal
    const cleanValue = value.toString()
        .replace(/\$/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    return parseFloat(cleanValue) || 0;
}

export function parseCSVWithPapa(csvText: string): FinancialRecord[] {
    const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
            const trimmed = header.trim();
            return HEADER_MAP[trimmed] || trimmed.replace(/\s+/g, '_');
        }
    });

    if (result.errors.length > 0) {
        console.warn('CSV parse errors:', result.errors);
    }

    return result.data.map((row: any) => {
        const record: any = {};
        Object.keys(row).forEach(key => {
            const value = row[key]?.toString().trim() || '';
            if (NUMERIC_FIELDS.includes(key)) {
                record[key] = parseNumericValue(value);
            } else {
                record[key] = value;
            }
        });

        return record as FinancialRecord;
    });
}

export function buildPeriodMatrix(
    records: FinancialRecord[],
    fieldAccessor: (item: FinancialRecord) => string
): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    records.forEach(record => {
        const rowKey = fieldAccessor(record);
        if (!matrix[rowKey]) matrix[rowKey] = {};
        const periodKey = `${(record.MES || '').toLowerCase()}-${record.AÑO}`;
        matrix[rowKey][periodKey] = (matrix[rowKey][periodKey] || 0) + (Number(record.Valor_de_operacion) || 0);
    });
    return matrix;
}

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export const formatNum = (value: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
