# Instrucciones de Despliegue: Baroid Hub PWA

Esta carpeta contiene la aplicación web lista para ser distribuida como una PWA (Progressive Web App).
**Ventaja:** No requiere instalación, funciona en Android/iPhone/PC sin alertas de antivirus.

### Archivos Clave
- `index.html`: La aplicación principal.
- `manifest.json`: Configuración para que el celular la reconozca como App.
- `icon.svg`: El icono de la aplicación.
- `sw.js`: Service Worker (permite que funcione offline).

### Opción 1: Publicar en GitHub Pages (Recomendado)
Esta es la forma más profesional y fácil para que otros la usen.

1.  Crea un repositorio en GitHub (ej. `baroid-hub`).
2.  Sube el contenido de esta carpeta (`Baroid_PWA`).
3.  Ve a **Settings** > **Pages**.
4.  En **Branch**, selecciona `main` y guarda.
5.  GitHub te dará un link (ej. `https://tu-usuario.github.io/baroid-hub/`).
6.  ¡Comparte ese link!

### Opción 2: Uso Local (Solo PC)
Si necesitas abrirla en una PC sin internet o sin subirla:

1.  Asegúrate de tener Node.js instalado.
2.  En esta carpeta, abre una terminal y ejecuta:
    ```bash
    npm start
    ```
3.  Se abrirá automáticamente en tu navegador.

### Cómo Instalar en Celular
Una vez tengas el Link (Opción 1):
- **Android (Chrome):** Abre el link -> Menú (3 puntos) -> "Instalar aplicación".
- **iPhone (Safari):** Abre el link -> Botón Compartir -> "Agregar a inicio".
