import type { ReactNode } from 'react';

export interface FinancialRecord {
    Consecutivo: string;
    Fecha_de_Creacion: string;
    Responsable: string;
    Empresa: string;
    Area_operacion: string;
    Dependencia: string;
    Grupo: string;
    Rubro: string;
    Sub_rubro: string;
    Identificacion: string;
    Tercero: string;
    Concepto: string;
    Placa: string;
    Factura: string;
    Observaciones: string;
    Valor_de_la_factura: number;
    Valor_abono: number;
    Valor_de_operacion: number;
    Retencion: number;
    Otros_descuentos: number;
    Neto_a_pagar: number;
    Identificacion_del_Titular: string;
    Nombre_titular: string;
    Banco_Cta_Bancaria: string;
    Tipo_de_cuenta: string;
    Numero_de_cuenta: string;
    Convenio: string;
    Ingreso_Gasto: string;
    Forma_de_Pago: string;
    Banco_Pago: string;
    CAJA_BANCO: string;
    Caja_Menor: string;
    Legalizacion: string;
    Fecha_de_Pago: string;
    Soporte_de_Pago: string;
    Estado_de_Pago: string;
    Version: string;
    Fuente: string;
    MES: string;
    AÑO: string;
}

export interface Filters {
    año: string;
    mes: string;
    empresa: string;
    area: string;
    grupo: string;
    rubro: string;
    subrubro: string;
    dependencia: string;
}

export interface ResponsableAggregation {
    valor: number;
    terceros: Set<string>;
}

export interface ResponsableRow {
    name: string;
    global: ResponsableAggregation;
    periods: Record<string, ResponsableAggregation>;
}

export interface ResponsableMatrixData {
    rows: ResponsableRow[];
    totals: {
        global: ResponsableAggregation;
        periods: Record<string, ResponsableAggregation>;
    };
}

export interface FilterSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    icon?: ReactNode;
}

export type TableVariant = 'blue' | 'teal' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'slate';

export interface DataMatrixProps {
    title: string;
    data: Record<string, Record<string, number>>;
    periods: string[];
    activeFilter?: string;
    onRowClick?: (value: string) => void;
    maxHeight?: string;
    icon?: ReactNode;
    variant?: TableVariant;
}
