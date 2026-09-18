      {/* RIVAL PLAYER NOTES MODAL */}
      {selectedRivalId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setSelectedRivalId(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-full transition-colors"
            >
              <Trash2 size={18} className="hidden" /> {/* just to import/avoid error */}
              <span className="flex items-center justify-center w-5 h-5 font-bold text-lg">×</span>
            </button>
            
            {(() => {
              const player = rivalPlayers.find(p => p.id === selectedRivalId);
              if (!player) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700">
                      {player.dorsal || '-'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">{player.nombre}</h3>
                      <p className="text-sm font-bold text-red-500">{ALL_POSITIONS.find(p => p.id === player.posicion)?.label || player.posicion || 'Sin Posición'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Desarrollo y Anotaciones</label>
                    <textarea 
                      placeholder="Escribe aquí las observaciones sobre este jugador (perfil, puntos débiles, características...)"
                      value={player.notas || ''}
                      onChange={e => updateRivalField(player.id, 'notas', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                      autoFocus
                    />
                  </div>

                  <button 
                    onClick={() => setSelectedRivalId(null)}
                    className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Guardar y Cerrar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
