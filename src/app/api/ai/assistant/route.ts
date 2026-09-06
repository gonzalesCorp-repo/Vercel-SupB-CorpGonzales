import { streamText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';
import { generateCopilotSystemPrompt } from '@/lib/ai/system-manifest';
import { createCopilotTools } from '@/lib/ai/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 0. Proteger con sesión activa de Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return new Response(
        JSON.stringify({
          error: 'No autorizado. Se requiere sesión activa para interactuar con V.AI Copilot.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages, context } = await req.json();

    // 1. Generar System Prompt dinámico desde el Manifiesto Canónico
    const systemPrompt = generateCopilotSystemPrompt({
      sedeNombre: context?.sedeNombre,
      userRol: context?.userRol,
      userEmail: user.email || undefined,
    });

    // 2. Instanciar herramientas con el cliente de Supabase autenticado (RLS)
    const tools = createCopilotTools(supabase, context?.sedeId);

    // 3. Ejecutar streaming multi-paso (soporta Tool Calling y respuesta final con stopWhen)
    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(5),
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error en Vercel AI Gateway / Copilot Route:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Error interno en el motor de inferencia del Copilot.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
