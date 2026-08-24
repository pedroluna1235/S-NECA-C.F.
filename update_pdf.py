import re

file_path = "src/components/sesiones/PlantillaPDFSesion.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the style assignment for jugador in PDF
old_style = """                    style={
                      !jugador.disponible 
                        ? { ...styles.borderBlack, ...styles.bgRed, ...styles.textRed }
                        : { ...styles.borderBlack, ...styles.bgWhite }
                    }"""

new_style = """                    style={
                      !jugador.disponible 
                        ? { ...styles.borderBlack, ...styles.bgRed, ...styles.textRed }
                        : { ...styles.borderBlack, ...styles.bgWhite, ...(jugador.manual ? { color: '#2563eb' } : {}) }
                    }"""

content = content.replace(old_style, new_style)

with open(file_path, "w") as f:
    f.write(content)
