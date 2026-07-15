import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Shield, CalendarDays, Menu, X, Sun, Moon, BookOpen, Eye, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  // Inicializar tema
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/plantilla', icon: Users, label: 'Plantilla' },
    { to: '/equipos', icon: Shield, label: 'Equipos' },
    { to: '/partidos', icon: CalendarDays, label: 'Partidos' },
    { to: '/sesiones', icon: BookOpen, label: 'Sesiones' },
    { to: '/scouting', icon: Eye, label: 'Scouting' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-primary text-white rounded-md shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-red-600 overflow-hidden">
            <img src="/logo.png?v=2" alt="SÉNECA C.F." className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-red-600 font-bold">S</span>'; }} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">SÉNECA C.F.</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium capitalize">Modo {role}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                isActive 
                  ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500" 
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
              )}
            >
              <item.icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Settings */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900 transition-colors"
          >
            <span className="font-medium">Modo {isDark ? 'Claro' : 'Oscuro'}</span>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10 transition-colors mt-2"
          >
            <span className="font-medium">Cerrar Sesión</span>
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}
