// ============================================================================
// CONTROLLER: CAJA POS
// ============================================================================

function procesarVentaCaja(datosVenta) {
  try {
    const db = new SheetDatabase();
    const newId = "TICKET-" + new Date().getTime();
    db.insert('ventas_caja', [
      newId, '', '', new Date().toLocaleString(), 'Mostrador', 
      datosVenta.cliente || 'Consumidor Final', '', 
      [], // items
      { "monto_final": datosVenta.total || 0 }, // totales
      { "metodo": datosVenta.metodo || 'Efectivo' } // documento_pago
    ]);
    return { status: "success", message: "Pago registrado." };
  } catch(e) { return { status: "error", message: e.message }; }
}
