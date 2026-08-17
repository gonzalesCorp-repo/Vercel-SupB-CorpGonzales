import pandas as pd
import json
import math
import glob

# Helper to clean nan and strings
def clean_val(val, default=''):
    if pd.isna(val):
        return default
    if isinstance(val, str):
        return val.strip()
    return val

def main():
    bienes_data = []
    oatc_data = []
    users_data = []
    agentes_data = []
    kardex_data = []

    # 1. PROCESS ADMIN
    admin_file = 'Registros Admin.xlsx'
    if glob.glob(admin_file):
        xl_admin = pd.ExcelFile(admin_file)
        
        # Usuarios
        if 'Usuarios' in xl_admin.sheet_names:
            df_usuarios = xl_admin.parse('Usuarios')
            for _, row in df_usuarios.iterrows():
                nombre = clean_val(row.get('Nombre'))
                correo = clean_val(row.get('Correo (Gmail)'))
                rol = clean_val(row.get('Rol'))
                pin = row.get('PIN')
                if nombre:
                    user_id = 'usr_' + str(hash(nombre + correo))[-8:]
                    users_data.append([user_id, nombre, correo, rol, str(pin) if not pd.isna(pin) else ''])

        # Agentes
        if 'Agentes' in xl_admin.sheet_names:
            df_agentes = xl_admin.parse('Agentes')
            for _, row in df_agentes.iterrows():
                nombre = clean_val(row.get('Colaboradores'))
                if nombre:
                    agente_id = 'agt_' + str(hash(nombre))[-8:]
                    hr_entrada = clean_val(row.get('HR entrada'))
                    hr_salida = clean_val(row.get('HR salida'))
                    dia_descanso = clean_val(row.get('Día Descanso'))
                    especialidad = clean_val(row.get('Especialidad'))
                    estado = clean_val(row.get('Estado'), 'Activo')
                    wfm_config = {"hr_entrada": hr_entrada, "hr_salida": hr_salida, "dia_descanso": dia_descanso}
                    agentes_data.append([agente_id, nombre, especialidad, estado, wfm_config])

        # Servicios
        if 'Catalogo servicios' in xl_admin.sheet_names:
            df_servicios = xl_admin.parse('Catalogo servicios')
            for _, row in df_servicios.iterrows():
                nombre = clean_val(row.get('Descripción 1'))
                if nombre:
                    bien_id = 'srv_' + str(hash(nombre))[-8:]
                    precio = clean_val(row.get('Precio Venta Unitario Aproximado 2'), 0)
                    categoria = clean_val(row.get('Categoría 3'))
                    comision = clean_val(row.get('% Comisión'), 0)
                    attr_serv = {"categoria": categoria, "comision": comision}
                    bienes_data.append([bien_id, 'servicio', nombre, categoria, precio, {}, attr_serv])

        # Productos
        if 'Catalogo productos' in xl_admin.sheet_names:
            df_prod = xl_admin.parse('Catalogo productos')
            for _, row in df_prod.iterrows():
                sku = clean_val(row.get('SKU 1'))
                nombre = clean_val(row.get('DESCRIPCION 5'))
                if sku and nombre:
                    precio = clean_val(row.get('PRECIO UNITARIO 9'), 0)
                    costo = clean_val(row.get('COSTO UNITARIO 11'), 0)
                    stock = clean_val(row.get('STOCK 4'), 0)
                    categoria = clean_val(row.get('CATEGORIA 13'))
                    attr_prod = {"costo": costo, "stock": stock, "sku": sku}
                    bienes_data.append([sku, 'producto', nombre, categoria, precio, attr_prod, {}])

    # 2. PROCESS ERP
    erp_file = 'Registros ERP VentaRD.xlsx'
    if glob.glob(erp_file):
        xl_erp = pd.ExcelFile(erp_file)
        
        # BBDD Productos (Merge with existing)
        if 'BBDD_Productos' in xl_erp.sheet_names:
            df_bbdd = xl_erp.parse('BBDD_Productos')
            for _, row in df_bbdd.iterrows():
                sku = clean_val(row.get('SKU'))
                nombre = clean_val(row.get('Nombre'))
                if sku and nombre:
                    precio = clean_val(row.get('Precio'), 0)
                    costo = clean_val(row.get('Costo Unitario'), 0)
                    stock = clean_val(row.get('Stock Tienda'), 0)
                    # Check if exists
                    exists = next((item for item in bienes_data if item[0] == sku), None)
                    if not exists:
                        attr_prod = {"costo": costo, "stock": stock, "sku": sku, "marca": clean_val(row.get('Marca'))}
                        bienes_data.append([sku, 'producto', nombre, 'Retail', precio, attr_prod, {}])
                        
        # Kardex
        if 'Kardex_Movimientos' in xl_erp.sheet_names:
            df_kardex = xl_erp.parse('Kardex_Movimientos')
            for _, row in df_kardex.iterrows():
                k_id = clean_val(row.get('ID_MOVIMIENTO'))
                sku = clean_val(row.get('SKU'))
                if k_id and sku:
                    fecha = str(row.get('FECHA_HORA'))
                    tipo = clean_val(row.get('TIPO_MOVIMIENTO'))
                    cant = clean_val(row.get('CANTIDAD'), 0)
                    origen = clean_val(row.get('ORIGEN'))
                    destino = clean_val(row.get('DESTINO'))
                    kardex_data.append([k_id, fecha, tipo, sku, cant, origen, destino])

    # 3. PROCESS VENTAS
    ventas_file = 'Ventas 2025.xlsx'
    if glob.glob(ventas_file):
        xl_ventas = pd.ExcelFile(ventas_file)
        if 'Registro ventas caja' in xl_ventas.sheet_names:
            df_ventas = xl_ventas.parse('Registro ventas caja')
            # Group by Ticket_ID
            grouped = df_ventas.groupby('Ticket_ID')
            for ticket_id, group in grouped:
                fecha = str(group.iloc[0]['Fecha'])
                cliente_str = clean_val(group.iloc[0]['Cliente'])
                agente = clean_val(group.iloc[0]['Agente'])
                
                # Default status logic requested by user:
                estado_oatc = 'FINALIZADO'
                estado_pago = 'PAGADO'
                
                items = []
                total_efectivo = 0
                total_tarjeta = 0
                
                for _, row in group.iterrows():
                    servicio = clean_val(row.get('Servicio_Final'))
                    efectivo = clean_val(row.get('Monto_Efectivo'), 0)
                    tarjeta = clean_val(row.get('Monto Tarjeta'), 0)
                    if efectivo == '': efectivo = 0
                    if tarjeta == '': tarjeta = 0
                    total_efectivo += float(efectivo)
                    total_tarjeta += float(tarjeta)
                    items.append({"descripcion": servicio, "monto": float(efectivo) + float(tarjeta)})
                    
                total = total_efectivo + total_tarjeta
                pagos = []
                if total_efectivo > 0: pagos.append({"metodo": "efectivo", "monto": total_efectivo})
                if total_tarjeta > 0: pagos.append({"metodo": "tarjeta", "monto": total_tarjeta})
                
                oatc_data.append([
                    str(ticket_id),
                    fecha,
                    cliente_str,
                    agente,
                    estado_oatc,
                    estado_pago,
                    items,
                    pagos,
                    total
                ])

    # GENERATE Data_Migration.gs
    gs_code = f"""// AUTO-GENERATED BY MIGRATION SCRIPT
const migrationData_Usuarios = {json.dumps(users_data, ensure_ascii=False, indent=2)};
const migrationData_Agentes = {json.dumps(agentes_data, ensure_ascii=False, indent=2)};
const migrationData_Bienes = {json.dumps(bienes_data, ensure_ascii=False, indent=2)};
const migrationData_OATC = {json.dumps(oatc_data, ensure_ascii=False, indent=2)};

function ejecutarMigracionMasiva() {{
  try {{
    const db = new SheetDatabase();
    
    // Insertar Usuarios
    if (migrationData_Usuarios.length > 0) {{
      db.insertMany('usuarios', migrationData_Usuarios);
      Logger.log("Usuarios migrados: " + migrationData_Usuarios.length);
    }}
    
    // Insertar Bienes
    if (migrationData_Bienes.length > 0) {{
      db.insertMany('bienes', migrationData_Bienes);
      Logger.log("Bienes migrados: " + migrationData_Bienes.length);
    }}
    
    // Insertar OATC (Tickets Históricos)
    if (migrationData_OATC.length > 0) {{
      db.insertMany('oatc', migrationData_OATC);
      Logger.log("OATC (Tickets) migrados: " + migrationData_OATC.length);
    }}
    
    return "Migración completada exitosamente. Revisa el registro de ejecuciones.";
  }} catch(e) {{
    Logger.log("Error en migración: " + e.message);
    return "Error en migración: " + e.message;
  }}
}}
"""
    with open('Data_Migration.gs', 'w', encoding='utf-8') as f:
        f.write(gs_code)
    
    print(f"Generated Data_Migration.gs with {len(bienes_data)} bienes and {len(oatc_data)} tickets.")

if __name__ == '__main__':
    main()
