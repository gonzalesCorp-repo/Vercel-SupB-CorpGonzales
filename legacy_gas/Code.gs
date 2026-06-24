// Code.gs

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index').evaluate()
      .setTitle('ERP Gonzales Salón Spa')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Helper para inyectar scripts y vistas en el HTML principal
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

// ============================================================================
// PARADIGMA ORIENTADO A OBJETOS: CAPA DE ACCESO A DATOS (DAO)
// ============================================================================

/**
 * Clase que encapsula la lógica de conexión y operaciones CRUD con Google Sheets.
 * Esto hace el código más limpio, mantenible y facilita la futura migración a Firebase.
 */
class SheetDatabase {
  constructor() {
    const ssId = PropertiesService.getScriptProperties().getProperty('DB_SHEET_ID');
    if (!ssId) throw new Error("Base de datos no inicializada. Ejecute inicializarBaseDatosSheets().");
    this.ss = SpreadsheetApp.openById(ssId);
  }

  // Obtiene todos los registros de una colección parseando los JSON simulando NoSQL
  findAll(collectionName) {
    const sheet = this.ss.getSheetByName(collectionName);
    if (!sheet) throw new Error("Colección no encontrada: " + collectionName);
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Vacío o solo cabeceras
    
    const keys = data[0];
    const results = [];
    
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      let obj = {};
      for (let j = 0; j < keys.length; j++) {
        let val = row[j];
        if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
          try { val = JSON.parse(val); } catch(e) {}
        }
        obj[keys[j]] = val;
      }
      results.push(obj);
    }
    return results;
  }

  // Inserta un nuevo registro en la colección convirtiendo Objetos a Strings (JSON)
  insert(collectionName, rowArray) {
    const sheet = this.ss.getSheetByName(collectionName);
    if (!sheet) throw new Error("Colección no existe.");
    // Convierte objetos/arrays a strings JSON
    const processedRow = rowArray.map(item => {
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item);
      }
      return item;
    });
    sheet.appendRow(processedRow);
    return true;
  }

  insertMany(collectionName, rowsArray) {
    const sheet = this.ss.getSheetByName(collectionName);
    if (!sheet) throw new Error("Colección no existe.");
    if (!rowsArray || rowsArray.length === 0) return true;
    const processedRows = rowsArray.map(row => 
      row.map(item => (typeof item === 'object' && item !== null) ? JSON.stringify(item) : item)
    );
    sheet.getRange(sheet.getLastRow() + 1, 1, processedRows.length, processedRows[0].length).setValues(processedRows);
    return true;
  }

  update(collectionName, queryFn, newRowArray) {
    const sheet = this.ss.getSheetByName(collectionName);
    if (!sheet) return false;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (queryFn(data[i])) {
        const processedRow = newRowArray.map(item => {
          if (typeof item === 'object' && item !== null) {
            return JSON.stringify(item);
          }
          return item;
        });
        sheet.getRange(i + 1, 1, 1, processedRow.length).setValues([processedRow]);
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// INICIALIZACIÓN Y CONFIGURACIÓN (Ejecutar desde el editor)
// ============================================================================

function _getOrCreateDb() {
  const ssId = PropertiesService.getScriptProperties().getProperty('DB_SHEET_ID');
  let ss;
  if (ssId) {
    try { ss = SpreadsheetApp.openById(ssId); } catch(e) {}
  }
  if (!ss) {
    ss = SpreadsheetApp.create("DB Temporal - ERP Gonzales");
    PropertiesService.getScriptProperties().setProperty('DB_SHEET_ID', ss.getId());
  }
  // Eliminar la "Hoja 1" predeterminada si existe
  const hoja1 = ss.getSheetByName("Hoja 1");
  if (hoja1 && ss.getSheets().length > 1) ss.deleteSheet(hoja1);
  return ss;
}

function _prepararHoja(ss, nombre, cabeceras) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
  } else {
    hoja.clear();
  }
  hoja.appendRow(cabeceras);
  return hoja;
}

function inicializarBaseDatosSheetsTodo() {
  inicializarBaseDatosSheetsUsuarios();
  inicializarBaseDatosSheetsBienes();
  inicializarBaseDatosSheetsOATC();
  inicializarBaseDatosSheetsVentasCaja();
  inicializarBaseDatosSheetsTiposArea();
  inicializarBaseDatosSheetsWFM();
  inicializarBaseDatosSheetsAgenda();
  inicializarBaseDatosSheetsRecepcion();
  return "Todas las colecciones han sido inicializadas.";
}

function inicializarBaseDatosSheetsUsuarios() {
  _prepararHoja(_getOrCreateDb(), 'usuarios', ['usuario_id', 'dni', 'nombre', 'apellido', 'celular', 'email', 'fecha_nacimiento', 'genero', 'login', 'roles', 'perfil_agente', 'perfil_cliente']);
  return "Colección 'usuarios' inicializada.";
}

function inicializarBaseDatosSheetsBienes() {
  _prepararHoja(_getOrCreateDb(), 'bienes', ['bien_id', 'tipo_bien', 'nombre', 'categoria', 'precio_venta', 'atributos_producto', 'atributos_servicio']);
  return "Colección 'bienes' inicializada.";
}

function inicializarBaseDatosSheetsRecepcion() {
  _prepararHoja(_getOrCreateDb(), 'recepcion_cola', ['agente_id', 'estado', 'timestamp', 'posicion', 'nombre']);
  _prepararHoja(_getOrCreateDb(), 'recepcion_estados', ['estado_id', 'nombre', 'color', 'es_pausa']);
  return "Colecciones de Recepción inicializadas.";
}

function inicializarBaseDatosSheetsOATC() {
  _prepararHoja(_getOrCreateDb(), 'oatc', ['oatc_id', 'correlativo', 'fecha', 'tipo_oatc', 'prioridad', 'estado_proceso', 'cliente', 'agente_asignado', 'estaciones_ocupadas', 'linea_tiempo_trazabilidad', 'tiempo_exposicion_manual_minutos', 'alertas_calidad']);
  return "Colección 'oatc' inicializada.";
}

function inicializarBaseDatosSheetsVentasCaja() {
  _prepararHoja(_getOrCreateDb(), 'ventas_caja', ['venta_id', 'ticket_id', 'oatc_id', 'fecha_transaccion', 'canal_venta', 'cliente_id', 'agente_id', 'items_vendidos', 'totales', 'documento_pago']);
  return "Colección 'ventas_caja' inicializada.";
}

function inicializarBaseDatosSheetsTiposArea() {
  _prepararHoja(_getOrCreateDb(), 'wfm_tipos_area', ['tipo_id', 'nombre_tipo', 'icono_referencial']);
  return "Colección 'wfm_tipos_area' inicializada.";
}

function inicializarBaseDatosSheetsWFM() {
  _prepararHoja(_getOrCreateDb(), 'wfm_areas', ['salon_id', 'nombre_salon', 'zonas_fisicas']);
  return "Colección 'wfm_areas' inicializada.";
}

function inicializarBaseDatosSheetsAgenda() {
  _prepararHoja(_getOrCreateDb(), 'agenda', ['evento_id', 'fecha', 'hora_inicio', 'hora_fin', 'tipo_evento', 'cliente_id', 'cliente_nombre', 'agente_id', 'estado', 'notas_internas']);
  return "Colección 'agenda' inicializada.";
}

function crearUsuariosDePrueba() {
  try {
    const db = new SheetDatabase();
    
    // Función helper para no repetir columnas vacías
    const insertarUsr = (id, nombre, user, pass, rolArr) => {
      db.insert('usuarios', [
        id, '0', nombre, '', '999999999', '', '', '',
        { "username": user, "password_hash": pass, "estado": "activo" }, // login (Objeto)
        rolArr, // roles (Array)
        { "salon": "Miraflores" }, // perfil_agente (Objeto)
        {} // perfil_cliente
      ]);
    };

    insertarUsr('admin_01', 'Administrador Principal', 'admin', '123456', ['admin']);
    insertarUsr('recepcion_01', 'Recepcion Generico', 'recepcion', '111111', ['recepcion']);
    insertarUsr('caja_01', 'Caja Generico', 'caja', '222222', ['caja']);
    insertarUsr('operaciones_01', 'Operaciones Generico', 'operaciones', '333333', ['operaciones']);
    insertarUsr('despacho_01', 'Despacho Generico', 'despacho', '444444', ['despacho']);
    insertarUsr('dev_01', 'Cristian', 'Cristian', '301093', ['desarrollo']);

    Logger.log("6 Usuarios creados exitosamente en formato NoSQL.");
  } catch (error) {
    Logger.log("Error al crear usuarios: " + error.message);
  }
}

function poblarDatosPruebaWFM() {
  try {
    const db = new SheetDatabase();
    db.insert('wfm_areas', [
      'salon_01', 'Sede Miraflores', 
      [
        { "zona_id": "z_tocador_normal", "tipo": "Tocador Estilismo", "nombre": "Tocadores Estilismo", "cantidad": 6 },
        { "zona_id": "z_tocador_quimicos", "tipo": "Tocador Químico", "nombre": "Tocadores Químicos", "cantidad": 2 },
        { "zona_id": "z_tocador_maquillaje", "tipo": "Tocador Maquillaje", "nombre": "Módulo de Maquillaje", "cantidad": 2 },
        { "zona_id": "z_silla_manos", "tipo": "Silla Manos", "nombre": "Área de Manos", "cantidad": 4 },
        { "zona_id": "z_sillon_pies", "tipo": "Sillón Pies", "nombre": "Área de Pies", "cantidad": 3 },
        { "zona_id": "z_cabina_masajes", "tipo": "Cabina", "nombre": "Cabina Masajes", "cantidad": 1, "especialidad": "masajes" },
        { "zona_id": "z_espera", "tipo": "Sala Espera", "nombre": "Sala de Espera", "cantidad": 10 }
      ]
    ]);
    Logger.log("Salón modelo creado en wfm_areas.");
  } catch (error) {
    Logger.log("Error poblando WFM: " + error.message);
  }
}

function poblarDatosPruebaTiposArea() {
  try {
    const db = new SheetDatabase();
    db.insert('wfm_tipos_area', ['tipo_1', 'Tocador Estilismo', 'espejo']);
    db.insert('wfm_tipos_area', ['tipo_2', 'Tocador Químico', 'gota']);
    db.insert('wfm_tipos_area', ['tipo_3', 'Tocador Maquillaje', 'espejo']);
    db.insert('wfm_tipos_area', ['tipo_4', 'Silla Manos', 'silla']);
    db.insert('wfm_tipos_area', ['tipo_5', 'Sillón Pies', 'sillon']);
    db.insert('wfm_tipos_area', ['tipo_6', 'Cabina', 'camilla']);
    db.insert('wfm_tipos_area', ['tipo_7', 'Sala Espera', 'silla']);
    Logger.log("Tipos de área de prueba creados.");
  } catch (error) {
    Logger.log("Error poblando tipos WFM: " + error.message);
  }
}

function poblarDatosPruebaBienes() {
  try {
    const db = new SheetDatabase();
    // Servicio 1
    db.insert('bienes', [
      'srv_01', 'servicio', 'Laceado Brasileño', 'Peluqueria', 150.00, 
      {}, // prod
      { "duracion_minutos": 120, "requiere_zona": "tocador", "requiere_ventilacion": true, "tiempo_espera_con_producto_minutos": 40 }
    ]);
    // Servicio 2
    db.insert('bienes', [
      'srv_02', 'servicio', 'Manicure Gel', 'Manos', 45.00, 
      {}, 
      { "duracion_minutos": 45, "requiere_zona": "silla_manos", "requiere_ventilacion": false, "tiempo_espera_con_producto_minutos": 0 }
    ]);
    // Servicio 3
    db.insert('bienes', [
      'srv_03', 'servicio', 'Corte de Cabello Mujer', 'Peluqueria', 60.00, 
      {}, 
      { "duracion_minutos": 45, "requiere_zona": "tocador", "requiere_ventilacion": false, "tiempo_espera_con_producto_minutos": 0 }
    ]);
    // Insumo
    db.insert('bienes', [
      'ins_01', 'insumo', 'Tinte Profesional 60ml', 'Coloracion', 0.00, 
      { "unidad_medida": "ml", "volumen_total": 60, "stock_minimo": 5 }, 
      {}
    ]);
    Logger.log("Bienes de prueba creados.");
  } catch (error) {
    Logger.log("Error poblando Bienes: " + error.message);
  }
}

// ============================================================================
// FUNCIONES DE REPARACIÓN (MANTENIMIENTO)
// ============================================================================

function repararCabecerasUsuarios() {
  try {
    const db = new SheetDatabase();
    const sheet = db.ss.getSheetByName('usuarios');
    const range = sheet.getRange(1, 1, 1, 9);
    range.setValues([['usuario_id', 'dni', 'nombre', 'celular', 'origen_captacion', 'notas', 'username', 'password', 'rol']]);
    Logger.log("Cabeceras de 'usuarios' reparadas con éxito.");
  } catch (error) {
    Logger.log("Error al reparar cabeceras: " + error.message);
  }
}


// ============================================================================
// ENDPOINTS PARA EL CLIENTE (google.script.run)
// ============================================================================

/**
 * Valida las credenciales de acceso del usuario
 */
    function validarLogin(username, password) {
  try {
    const db = new SheetDatabase();
    const usuarios = db.findAll('usuarios');
    
    const user = usuarios.find(u => {
      // Como login es un objeto anidado simulando NoSQL, validamos que exista
      if (!u.login) return false;
      return String(u.login.username).trim() === String(username).trim() && 
             String(u.login.password_hash).trim() === String(password).trim()
    });
    
    if (user) {
      return { 
        status: "success", 
        // Pasamos el array de roles que fue decodificado automáticamente
        data: { id: user.usuario_id, nombre: user.nombre, rol: user.roles } 
      };
    } else {
      // Enviamos un debug extra para ver qué leyó Sheets realmente
      const leido = usuarios.map(u => ({ u: u.login?.username, p: u.login?.password_hash }));
      return { status: "error", message: "Credenciales incorrectas", debug: leido };
    }
  } catch(e) { return { status: "error", message: e.message }; }
}

// ============================================================================
// LOS ENDPOINTS DE CADA MÓDULO HAN SIDO EXTRAÍDOS A SUS RESPECTIVOS ARCHIVOS
// (EJ: Controller_Recepcion.gs, Controller_Caja.gs, etc.)
// ============================================================================
