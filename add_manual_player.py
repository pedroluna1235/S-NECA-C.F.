import re

file_path = "src/components/sesiones/DisenadorSesion.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add a state for the new manual player input
# search for: const [saving, setSaving] = useState(false);
state_to_add = """  const [saving, setSaving] = useState(false);
  const [nuevoJugadorNombre, setNuevoJugadorNombre] = useState('');

  const addJugadorManual = () => {
    if (!nuevoJugadorNombre.trim()) return;
    setDatos(prev => ({
      ...prev,
      jugadores: [
        ...prev.jugadores,
        {
          id: Date.now().toString(),
          nombre: nuevoJugadorNombre.trim(),
          disponible: true,
          manual: true
        }
      ]
    }));
    setNuevoJugadorNombre('');
  };
"""
content = content.replace("  const [saving, setSaving] = useState(false);", state_to_add)


# Update the Jugadores Sidebar
sidebar_old = """          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {datos.jugadores.map((jugador, i) => (
              <div 
                key={jugador.id}
                onClick={() => {
                  const nuevos = [...datos.jugadores];
                  nuevos[i].disponible = !nuevos[i].disponible;
                  setDatos(d => ({ ...d, jugadores: nuevos }));
                }}
                className={`p-2 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center justify-between border ${
                  jugador.disponible 
                    ? 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-red-300' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 opacity-80'
                }`}
              >
                <span className="truncate">{i+1}. {jugador.nombre}</span>
                {!jugador.disponible && <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded text-red-800 dark:text-red-100">BAJA</span>}
              </div>
            ))}
          </div>"""

sidebar_new = """          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar mb-4">
            {datos.jugadores.map((jugador, i) => (
              <div 
                key={jugador.id}
                onClick={() => {
                  const nuevos = [...datos.jugadores];
                  nuevos[i].disponible = !nuevos[i].disponible;
                  setDatos(d => ({ ...d, jugadores: nuevos }));
                }}
                className={`p-2 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center justify-between border ${
                  jugador.disponible 
                    ? (jugador.manual ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-red-300')
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 opacity-80'
                }`}
              >
                <span className="truncate">{i+1}. {jugador.nombre}</span>
                <div className="flex items-center gap-2">
                  {jugador.manual && jugador.disponible && <span className="text-xs bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-100">EXTRA</span>}
                  {!jugador.disponible && <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded text-red-800 dark:text-red-100">BAJA</span>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Añadir Jugador Extra</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={nuevoJugadorNombre}
                onChange={e => setNuevoJugadorNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addJugadorManual()}
                placeholder="Nombre del jugador..." 
                className="flex-1 p-2 text-sm border rounded-lg bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button 
                onClick={addJugadorManual}
                disabled={!nuevoJugadorNombre.trim()}
                className="bg-neutral-900 dark:bg-white text-white dark:text-black p-2 rounded-lg disabled:opacity-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>"""

content = content.replace(sidebar_old, sidebar_new)

with open(file_path, "w") as f:
    f.write(content)

