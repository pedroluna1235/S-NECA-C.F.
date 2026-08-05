import re

with open("src/components/tareas/DiseñadorTarea.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update main tag
old_main = '<main className="flex-1 flex items-center justify-center relative overflow-hidden bg-neutral-900 p-4 pb-28">'
new_main = '<main className="flex-1 flex flex-col xl:flex-row relative overflow-hidden bg-neutral-900">\n        <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4 pb-32 xl:pb-6">'
content = content.replace(old_main, new_main)

# 2. Extract properties panel
prop_start = content.find('{/* Floating Property Panel for Selected Element */}')
dock_start = content.find('{/* Floating Bottom Toolbar (Dock) */}')

prop_panel_code = content[prop_start:dock_start]
content = content[:prop_start] + content[dock_start:]

# 3. Update properties panel classes and add close button
old_prop_div = '<div className="absolute right-6 top-6 bg-neutral-800 p-4 rounded-2xl shadow-xl border border-neutral-700 flex flex-col gap-4 min-w-[240px] z-50">'
new_prop_div = '<div className="xl:w-80 w-full bg-neutral-800 border-t xl:border-t-0 xl:border-l border-neutral-700 shadow-2xl p-4 shrink-0 overflow-y-auto max-h-[35vh] xl:max-h-none z-50 flex flex-col gap-4">'
prop_panel_code = prop_panel_code.replace(old_prop_div, new_prop_div)

old_h3 = '<h3 className="text-white text-sm font-bold uppercase tracking-wider">Propiedades</h3>'
new_h3 = """<div className="flex justify-between items-center">
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Propiedades</h3>
              <button onClick={() => setSelectedElementId(null)} className="text-neutral-400 hover:text-white xl:hidden p-1 hover:bg-neutral-700 rounded transition-colors"><X size={16}/></button>
            </div>"""
prop_panel_code = prop_panel_code.replace(old_h3, new_h3)

# 4. Insert properties panel after the Work Area div, right before </main>
# We need to close the Work Area div first
insertion = "        </div>\n\n        " + prop_panel_code + "\n      </main>"
content = content.replace("</main>", insertion)

with open("src/components/tareas/DiseñadorTarea.tsx", "w", encoding="utf-8") as f:
    f.write(content)
