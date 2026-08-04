import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

// Configuración de la API Route con Vercel AI Gateway / Vercel AI SDK
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `
Eres V.AI, el asistente inteligente y Copiloto operativo de Corporación Gonzales (Vaikuntha ERP).
Tu rol es ayudar a administradores, recepcionistas y operarios de piso con:
1. Recomendar servicios o combinaciones de insumos de laboratorio según las OATC activas.
2. Responder dudas operativas sobre el control de asistencia WFM, turnos y comisiones.
3. Brindar sugerencias de atención al cliente y optimización de tiempos en sucursal.

Información del contexto actual en vivo:
- Sede Activa: ${context?.sedeNombre || 'General'}
- Usuario / Rol: ${context?.userRol || 'OPERARIO'}

Responde de forma concisa, profesional, empática y orientada a la eficiencia operativa.
`;

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error en Vercel AI Gateway Route:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
