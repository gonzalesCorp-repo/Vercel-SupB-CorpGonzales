'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase'; // We will use this when we wire up the real auth

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Placeholder logic for auth until Supabase Auth / Roles table is strictly defined
      // For now, any non-empty login works to test the redirect
      if (username && password) {
        // Simulate network request
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // TODO: Replace with real Supabase authentication
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email: username, // or use custom user table
        //   password,
        // })
        
        // Redirect to a placeholder dashboard/reception page
        router.push('/recepcion');
      } else {
        setError('Por favor ingresa usuario y contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 bg-opacity-95">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Gonzales Spa</h1>
          <p className="text-gray-500 mt-2">Acceso al Sistema ERP</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-900">Usuario / Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" 
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-900">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" 
              required 
            />
          </div>
          
          {error && (
            <div className="mb-4 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-3 text-center transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {!isLoading ? 'Ingresar al Sistema' : 'Verificando...'}
          </button>
        </form>
      </div>
    </div>
  );
}
