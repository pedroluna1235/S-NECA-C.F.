          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Disposición Táctica</label>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                <button onClick={() => setPitchViewRival('ataque')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${pitchViewRival === 'ataque' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}>Ataque</button>
                <button onClick={() => setPitchViewRival('defensa')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${pitchViewRival === 'defensa' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}>Defensa</button>
              </div>
            </div>
            
            <div className="relative w-full max-w-sm mx-auto aspect-[2/3] bg-green-600 rounded-lg overflow-hidden border-4 border-green-700 shadow-inner flex-shrink-0"
                 style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 100px)` }}>
              
              <div className="absolute inset-4 border-2 border-white/50 rounded" />
              <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/50 rounded-full" />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-white/50 border-b-0" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-white/50 border-t-0" />

              {SISTEMAS_DEF[pitchViewRival === 'ataque' ? (formData.sistema_ataque_rival as Sistema) : (formData.sistema_defensa_rival as Sistema)].map(pos => {
                const player = rivalPlayers.find(p => p.titular && p.posicion === pos.id);
                return (
                  <div 
                    key={pos.id} 
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group"
                    style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                    onClick={() => player ? setSelectedRivalId(player.id) : null}
                  >
                    <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white font-bold shadow-md text-xs ${player ? 'bg-neutral-800' : 'bg-neutral-800/50'}`}>
                      {player ? (player.dorsal || '-') : '?'}
                    </div>
                    <span className="text-[9px] font-bold text-white bg-black/60 px-1 rounded mt-0.5 truncate max-w-[50px]">
                      {player ? player.nombre.split(' ')[0] : pos.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-neutral-400 text-center mt-2">Haz clic en un jugador del campo para desarrollar sus anotaciones.</p>
          </div>
