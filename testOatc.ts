// Mock for the store
const useAppStoreMock = {
  getState: () => ({
    sedeActiva: { id: 'test-sede-id' }
  })
};

// We need to inject the mock before importing `recepcion.ts` or we can just run it in a way that the store has a value.
// But we cannot easily mock an ES module import from a script like this unless we use a testing framework or proxy.

// Let's just create a basic script that initializes the store then calls it.
// Actually `zustand` can run in Node.
import { useAppStore } from './src/store/useAppStore';
import { crearOatc } from './src/services/recepcion';
import { supabase } from './src/lib/supabase';

async function run() {
  console.log("Iniciando test de crearOatc...");
  
  // 1. Iniciar sesión para RLS
  const email = 'reception@test.com'; // O cualquier usuario válido de la DB
  const password = 'password123';
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email, password
  });
  
  if (authError) {
    console.error("Error Auth:", authError.message);
    // Intentaremos de todos modos, a ver si pasa
  } else {
    console.log("Usuario autenticado:", authData.user?.email);
  }

  // 2. Mock state in Zustand store
  useAppStore.setState({
    sedeActiva: {
      id: 'd9b35bc5-824c-47e2-8958-8120b6070a7d', // ID válido si lo hay, o uno inventado
      nombre: 'Sede Test',
      direccion: 'Test',
      empresa_id: 'test'
    }
  });
  
  console.log("Estado de Sede configurado:", useAppStore.getState().sedeActiva);

  // 3. Llamar a crearOatc
  try {
    const data = await crearOatc(
      null, // clienteId
      'Cliente Test', // clienteNombre
      null, // agenteId
      'Agente General', // agenteNombre
      [{ id: 's1', nombre: 'Corte', precio_venta: 35 }], // puntoPartida
      'cliente' // tipoDemanda
    );
    console.log("Resultado de crearOatc:", data);
  } catch (error) {
    console.error("Excepción capturada al crear OATC:", error.message || error);
  }
}

run();
