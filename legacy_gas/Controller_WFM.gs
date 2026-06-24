// ============================================================================
// CONTROLLER: WFM & CAPACIDAD
// ============================================================================

function obtenerDatosSalon(salonId = 'salon_01') {
  try {
    const db = new SheetDatabase();
    const salones = db.findAll('wfm_areas');
    const salon = salones.find(s => s.salon_id === salonId);
    if(salon) {
      return { status: "success", data: salon };
    }
    return { status: "error", message: "Salón no encontrado" };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerTiposArea() {
  try {
    const db = new SheetDatabase();
    const tipos = db.findAll('wfm_tipos_area');
    return { status: "success", data: tipos };
  } catch(e) { return { status: "error", message: e.message }; }
}

function guardarTipoArea(tipo) {
  try {
    const db = new SheetDatabase();
    // Simulate updating or inserting. Currently we only have insert via `insert`.
    // In a real scenario we'd find and update the row. For MVP:
    // Generate an ID if new
    if(!tipo.tipo_id) tipo.tipo_id = 'tipo_' + new Date().getTime();
    db.insert('wfm_tipos_area', [tipo.tipo_id, tipo.nombre_tipo, tipo.icono_referencial]);
    return { status: "success", message: "Tipo guardado exitosamente." };
  } catch(e) { return { status: "error", message: e.message }; }
}
