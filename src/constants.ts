const GOOGLE_SHEET_ID = '1kFPO923TRDPK_AzEXQpeGepZ8H88zkN1ga6XR3bavjc';
const SHEET_GID = '1095423363';

export const CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

export const MESES_ORDEN = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const HEADER_MAP: Record<string, string> = {
    'Consecutivo': 'Consecutivo',
    'Fecha de Creacion': 'Fecha_de_Creacion',
    'Responsable': 'Responsable',
    'Empresa': 'Empresa',
    'Area_operacion': 'Area_operacion',
    'Dependencia': 'Dependencia',
    'Grupo': 'Grupo',
    'Rubro': 'Rubro',
    'Sub_rubro': 'Sub_rubro',
    'Identificacion': 'Identificacion',
    'Tercero': 'Tercero',
    'Concepto': 'Concepto',
    'Placa': 'Placa',
    'Factura': 'Factura',
    'Observaciones': 'Observaciones',
    'Valor_de_la_factura': 'Valor_de_la_factura',
    'Valor_abono': 'Valor_abono',
    'Valor_de_operacion': 'Valor_de_operacion',
    'Retencion': 'Retencion',
    'Otros_descuentos': 'Otros_descuentos',
    'Neto_a_pagar': 'Neto_a_pagar',
    'Identificacion del Titular': 'Identificacion_del_Titular',
    'Nombre_titular': 'Nombre_titular',
    'Banco_Cta_Bancaria': 'Banco_Cta_Bancaria',
    'Tipo_de_cuenta': 'Tipo_de_cuenta',
    'Numero_de_cuenta': 'Numero_de_cuenta',
    'Convenio': 'Convenio',
    'Ingreso_Gasto': 'Ingreso_Gasto',
    'Forma_de_Pago': 'Forma_de_Pago',
    'Banco_Pago': 'Banco_Pago',
    'CAJA_BANCO': 'CAJA_BANCO',
    'Caja_Menor': 'Caja_Menor',
    'Legalizacion': 'Legalizacion',
    'Fecha_de_Pago': 'Fecha_de_Pago',
    'Soporte_de_Pago': 'Soporte_de_Pago',
    'Estado_de_Pago': 'Estado_de_Pago',
    'Version': 'Version',
    'Fuente': 'Fuente',
    'MES': 'MES',
    'AÑO': 'AÑO',
    'Año': 'AÑO',
};

export const NUMERIC_FIELDS = [
    'Valor_de_la_factura',
    'Valor_abono',
    'Valor_de_operacion',
    'Retencion',
    'Otros_descuentos',
    'Neto_a_pagar'
];

export const CHART_TOOLTIP_STYLE = {
    cursor: { fill: '#f8fafc' },
    contentStyle: {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        color: '#1e293b',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '8px 12px'
    },
    itemStyle: { color: '#1e293b' },
    labelStyle: { color: '#64748b', fontWeight: 600, marginBottom: '4px' }
};
