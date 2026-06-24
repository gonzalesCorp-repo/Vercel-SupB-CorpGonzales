-- 1. Modificar OATC para incluir estado de pago
ALTER TABLE oatc
ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente', 'Pagado', 'Anulado'));

-- 2. Tabla Facturas (Ventas de Caja)
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oatc_id UUID REFERENCES oatc(id),
    cliente_nombre TEXT NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Yape', 'Plin', 'Transferencia')),
    detalles JSONB, -- Opcional, para guardar copia inmutable del carrito
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
