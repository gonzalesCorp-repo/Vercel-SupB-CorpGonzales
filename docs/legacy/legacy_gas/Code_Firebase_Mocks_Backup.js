// Code.gs

// Función principal que sirve la página web (SPA)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('ERP Gonzales Salón Spa')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Configuración de credenciales seguras mediante PropertiesService
// Nota: Esta función puede ser llamada manualmente una vez o mediante una vista de admin
function configFirebaseCredentials(clientEmail, privateKey, projectId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'FB_CLIENT_EMAIL': clientEmail,
    'FB_PRIVATE_KEY': privateKey,
    'FB_PROJECT_ID': projectId
  });
  return "Credenciales configuradas exitosamente.";
}

// Helper interno para leer las credenciales en otras funciones del servidor
function getFirebaseCredentials() {
  const props = PropertiesService.getScriptProperties();
  return {
    clientEmail: props.getProperty('FB_CLIENT_EMAIL'),
    privateKey: props.getProperty('FB_PRIVATE_KEY'),
    projectId: props.getProperty('FB_PROJECT_ID')
  };
}

// ============================================================================
// FUNCIONES EXPUESTAS AL CLIENTE (Invocadas vía google.script.run)
// ============================================================================

/**
 * Ejemplo de función base para verificar conexión.
 * Las funciones expuestas manejarán las peticiones CRUD contra Firestore.
 */
function checkServerConnection() {
  try {
    // Aquí iría la lógica de inicialización de Firestore con las credenciales
    const credentials = getFirebaseCredentials();
    
    if(!credentials.projectId) {
      throw new Error("Credenciales de Firebase no configuradas en el servidor.");
    }
    
    return {
      status: "success",
      message: "Conexión exitosa con el servidor GAS y credenciales cargadas."
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message
    };
  }
}

// ============================================================================
// FUNCIONES DEL MÓDULO DE RECEPCIÓN
// ============================================================================

/**
 * Busca clientes por DNI, Nombre o Celular
 */
function buscarCliente(query) {
  // TODO: Implementar búsqueda real en Firestore (colección 'usuarios')
  return {
    status: "success",
    data: [
      { id: "c1", nombre: "María López", celular: "999888777", dni: "12345678" }
    ]
  };
}

/**
 * Crea o actualiza un perfil de cliente
 */
function guardarCliente(datosCliente) {
  // TODO: Insertar en Firestore
  return { status: "success", message: "Cliente guardado exitosamente." };
}

/**
 * Obtiene el catálogo de servicios
 */
function obtenerServiciosDisponibles() {
  // TODO: Leer colección 'bienes' donde tipo == 'servicio'
  return {
    status: "success",
    data: [
      { id: "s1", nombre: "Corte Dama", precio: 45 },
      { id: "s2", nombre: "Tinte Completo", precio: 120 }
    ]
  };
}

/**
 * Crea una nueva OATC y la ingresa a la cola
 */
function crearOATC(datosOATC) {
  // TODO: Insertar en colección 'oatc' con estado inicial
  return { status: "success", message: "OATC #003 generada e ingresada a cola." };
}

/**
 * Obtiene las OATCs del día para el monitor de cola
 */
function obtenerMonitorCola() {
  // TODO: Consultar colección 'oatc' activas
  return {
    status: "success",
    data: [
      { oatc_id: "OATC-001", cliente: "María López", estado: "Espera", tiempo_espera: 15 },
      { oatc_id: "OATC-002", cliente: "Carla Gómez", estado: "Atencion", agente: "Ana" }
    ]
  };
}

/**
 * Procesa el pago en caja (POS)
 */
function procesarVentaCaja(datosVenta) {
  // TODO: Insertar en colección 'ventas_caja' y actualizar estado OATC
  return { status: "success", message: "Pago procesado. Ticket de venta generado." };
}
