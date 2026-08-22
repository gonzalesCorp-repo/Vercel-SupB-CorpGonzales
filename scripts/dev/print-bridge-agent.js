/**
 * ==============================================================================
 * VAIKUNTHA THERMAL PRINT BRIDGE AGENT (LAN / TCP 9100)
 * ==============================================================================
 * Micro-agente local para recepción de trabajos de impresión en la nube vía
 * Supabase Realtime y reenvío directo por TCP Socket (Puerto 9100) a impresoras
 * térmicas Wi-Fi / Ethernet en la red local.
 *
 * USO:
 *   node scripts/dev/print-bridge-agent.js [SEDE_ID] [DEFAULT_PRINTER_IP]
 *
 * EJEMPLO:
 *   node scripts/dev/print-bridge-agent.js d954b259-69a0-4546-9156-2f6ad392853f 192.168.1.200
 */

const net = require('net');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existe
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpljnvfeywtdyubzjhge.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SEDE_ID = process.argv[2] || process.env.VAIKUNTHA_SEDE_ID || 'd954b259-69a0-4546-9156-2f6ad392853f';
const DEFAULT_IP = process.argv[3] || '192.168.1.200';
const DEFAULT_PORT = 9100;

console.log('====================================================');
console.log('🚀 VAIKUNTHA THERMAL PRINT BRIDGE AGENT INICIADO');
console.log(`📍 Sede Monitoreada: ${SEDE_ID}`);
console.log(`🖨️ IP Impresora Predeterminada: ${DEFAULT_IP}:${DEFAULT_PORT}`);
console.log('====================================================');

if (!SUPABASE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function enviarBytesAImpresoraLan(ip, puerto, buffer) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(8000);

    console.log(`[${new Date().toLocaleTimeString()}] 📡 Conectando a ${ip}:${puerto}...`);

    socket.connect(puerto, ip, () => {
      console.log(`[${new Date().toLocaleTimeString()}] 🖨️ Enviando ${buffer.length} bytes ESC/POS...`);
      socket.write(buffer, () => {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Impresión despachada con éxito.`);
        socket.end();
        resolve(true);
      });
    });

    socket.on('timeout', () => {
      console.error(`[${new Date().toLocaleTimeString()}] ⚠️ Timeout al conectar con la impresora ${ip}:${puerto}`);
      socket.destroy();
      reject(new Error('Timeout de conexión'));
    });

    socket.on('error', (err) => {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Error TCP: ${err.message}`);
      socket.destroy();
      reject(err);
    });
  });
}

// Suscribirse a los eventos de impresión de la sede
const channelName = `realtime-print-${SEDE_ID}`;
const channel = supabase.channel(channelName);

channel
  .on('broadcast', { event: 'NUEVA_IMPRESION' }, async ({ payload }) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔔 Nueva orden de impresión recibida:`, payload.tipo_ticket);

    if (!payload.payload_base64) {
      console.warn('⚠️ Payload no contiene payload_base64');
      return;
    }

    const ip = payload.ip_destino || DEFAULT_IP;
    const puerto = payload.puerto_destino || DEFAULT_PORT;
    const buffer = Buffer.from(payload.payload_base64, 'base64');

    try {
      await enviarBytesAImpresoraLan(ip, puerto, buffer);
    } catch (e) {
      console.error('❌ Falló el envío TCP a la impresora:', e.message);
    }
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`🟢 Suscrito al canal Supabase Realtime: [${channelName}]`);
      console.log('👂 Esperando órdenes de impresión desde el SaaS...\n');
    }
  });

// Manejo seguro de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando agente de impresión...');
  supabase.removeChannel(channel);
  process.exit(0);
});
