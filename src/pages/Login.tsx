import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      navigate('/plantilla', { replace: true });
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full border-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center overflow-hidden relative group">
            <img 
              src="/logo.jpg" 
              alt="Escudo SÉNECA C.F." 
              className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-red-600 font-bold text-3xl">S</span>';
              }}
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          SÉNECA C.F.
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Acceso al panel de gestión
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña maestra
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-700 bg-gray-800/50 text-white rounded-xl py-3 transition-all duration-200 placeholder-gray-500"
                  placeholder="Introduce la contraseña maestra"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/30 p-3 border border-red-500/50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      Contraseña incorrecta, inténtalo de nuevo
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors duration-200"
              >
                Entrar
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
