// ============================================================================
// CONTROLLER: RECEPCIÓN CRM
// ============================================================================

function buscarCliente(query) {
  try {
    const db = new SheetDatabase();
    const todos = db.findAll('usuarios');
    const q = query.toLowerCase();
    const filtrados = todos.filter(c => {
      const nombre = c.nombre ? c.nombre.toString().toLowerCase() : '';
      const dni = c.dni ? c.dni.toString() : '';
      const celular = c.celular ? c.celular.toString() : '';
      return nombre.includes(q) || dni.includes(q) || celular.includes(q);
    }).slice(0, 5);
    return { status: "success", data: filtrados };
  } catch(e) { return { status: "error", message: e.message }; }
}

function guardarCliente(datosCliente) {
  try {
    const db = new SheetDatabase();
    const newId = "usr_" + new Date().getTime();
    db.insert('usuarios', [
      newId, datosCliente.dni || '', datosCliente.nombre || 'Sin Nombre', 
      '', datosCliente.celular || '', '', '', '',
      {}, // login vacio
      ['cliente'], // roles
      {}, // perfil agente
      { "origen_captacion": datosCliente.origen_captacion || '', "notas": datosCliente.notas || '' } // perfil cliente
    ]);
    return { status: "success", message: "Cliente guardado.", data: { id: newId } };
  } catch(e) { return { status: "error", message: e.message }; }
}

function crearOATC(datosOATC) {
  try {
    const db = new SheetDatabase();
    const newId = "OATC-" + new Date().getTime().toString().slice(-4);
    
    // Si no hay agente, va a lista de espera general.
    let estado = "ESPERA";
    let agenteObj = null;
    
    if (datosOATC.agente_id) {
      estado = "ASESORANDO";
      agenteObj = { "id": datosOATC.agente_id, "nombre": datosOATC.agente_nombre };
      // Actualizamos estado en la cola a ASESORANDO
      cambiarEstadoAgente(datosOATC.agente_id, "ASESORANDO");
    }

    db.insert('oatc', [
      newId, '', new Date().toLocaleString(), 'Normal', 'Alta', estado, 
      { "nombre": datosOATC.cliente_nombre || 'Desconocido', "id": datosOATC.cliente_id || '' }, 
      agenteObj,
      [], // estaciones ocupadas
      { "punto_partida": datosOATC.punto_partida || [] }, // Guardamos la "Voz del Cliente" aquí
      0, // tiempo exp
      [] // alertas
    ]);
    return { status: "success", message: "OATC generada.", data: { id: newId } };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerMonitorCola() {
  try {
    const db = new SheetDatabase();
    // Obtener todas las oatc y filtrar para no mandar miles de registros historicos
    const todos = db.findAll('oatc');
    const activos = todos.filter(o => o.estado_proceso === 'ESPERA' || o.estado_proceso === 'ASESORANDO' || o.estado_proceso === 'TRABAJANDO');
    
    // Para simplificar la vista, aplanamos un poco los objetos NoSQL al enviarlos
    const mapeados = activos.map(o => ({
      oatc_id: o.oatc_id,
      fecha: o.fecha,
      estado_proceso: o.estado_proceso,
      cliente_nombre: o.cliente ? o.cliente.nombre : 'Desconocido'
    }));
    return { status: "success", data: mapeados };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerColaAgentes() {
  try {
    const db = new SheetDatabase();
    const cola = db.findAll('recepcion_cola');
    // Para no dejarlo vacío al inicio, si no hay nadie, podríamos cargar los usuarios que sean agentes y meterlos.
    // Pero por ahora solo devolvemos la cola
    cola.sort((a, b) => parseInt(a.posicion) - parseInt(b.posicion));
    return { status: "success", data: cola };
  } catch(e) { return { status: "error", message: e.message }; }
}

function registrarAsistencia(agente_id, nombre) {
  try {
    const db = new SheetDatabase();
    
    // Validar si ya está en la cola
    const cola = db.findAll('recepcion_cola');
    const yaExiste = cola.some(a => a.agente_id === agente_id);
    if(yaExiste) return { status: "error", message: "El agente ya está en la cola." };
    
    // Obtener la posición máxima actual
    let pos = 1;
    if (cola.length > 0) {
      pos = Math.max(...cola.map(a => parseInt(a.posicion) || 0)) + 1;
    }
    
    db.insert('recepcion_cola', [agente_id, 'DISPONIBLE', new Date().getTime(), pos, nombre]);
    return { status: "success", message: "Asistencia registrada correctamente." };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerUsuariosDisponibles() {
  try {
    const db = new SheetDatabase();
    const usuarios = db.findAll('usuarios');
    const cola = db.findAll('recepcion_cola');
    
    const enColaIds = cola.map(a => a.agente_id);
    // Filtramos usuarios que no estén en la cola y que preferentemente tengan rol que permita atender
    // (Por ahora permitimos a todos los no registrados para facilitar pruebas)
    const disponibles = usuarios
        .filter(u => !enColaIds.includes(u.usuario_id))
        .map(u => ({ id: u.usuario_id, nombre: u.nombre + " " + (u.apellido || '') }));
        
    return { status: "success", data: disponibles };
  } catch(e) { return { status: "error", message: e.message }; }
}

function cambiarEstadoAgente(agente_id, nuevoEstado) {
  try {
    const db = new SheetDatabase();
    // Leemos la hoja cruda para preservar los datos completos de la fila (nombre, etc)
    const sheet = db.ss.getSheetByName('recepcion_cola');
    if(!sheet) throw new Error("Colección no encontrada.");
    const data = sheet.getDataRange().getValues();
    let rowToUpdate = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === agente_id) {
        rowToUpdate = [...data[i]]; // clonar para evitar mutar referencia
        break;
      }
    }
    
    if(!rowToUpdate) throw new Error("Agente no encontrado en la cola.");
    
    // Índice 1: estado, Índice 2: timestamp, Índice 3: posicion
    rowToUpdate[1] = nuevoEstado;
    rowToUpdate[2] = new Date().getTime();
    rowToUpdate[3] = 999; // simulando ir al final
    
    db.update('recepcion_cola', row => row[0] === agente_id, rowToUpdate); 
    return { status: "success", message: "Estado actualizado." };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerEstadosPausa() {
  try {
    const db = new SheetDatabase();
    return { status: "success", data: db.findAll('recepcion_estados') };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerServiciosDisponibles() {
  try {
    const db = new SheetDatabase();
    const servicios = db.findAll('bienes'); // Devolver todo, el frontend filtra
    return { status: "success", data: servicios };
  } catch(e) { return { status: "error", message: e.message }; }
}

function obtenerAgenda() {
  try {
    const db = new SheetDatabase();
    const eventos = db.findAll('agenda');
    return { status: "success", data: eventos };
  } catch(e) { return { status: "error", message: e.message }; }
}

function guardarEventoAgenda(evento) {
  try {
    const db = new SheetDatabase();
    const newId = "EV-" + new Date().getTime();
    db.insert('agenda', [
      newId, evento.fecha || '', evento.hora_inicio || '', evento.hora_fin || '', 
      evento.tipo_evento || 'Cita', evento.cliente_id || '', evento.cliente_nombre || 'Desconocido', 
      evento.agente_id || '', 'Programado', evento.notas_internas || ''
    ]);
    return { status: "success", message: "Evento guardado en agenda." };
  } catch(e) { return { status: "error", message: e.message }; }
}
