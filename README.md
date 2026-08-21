# Pixelia Studio

Aplicación web para convertir imágenes en pixel art, reducir su resolución, extraer paletas inteligentes, eliminar o agregar colores, aplicar dithering y exportar el resultado como PNG.

Todo el procesamiento de imágenes ocurre dentro del navegador. La aplicación no envía los archivos a un servidor ni utiliza una API externa.

## Ejecutar en tu computadora

Necesitas Node.js 22 o posterior.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local donde puedes abrir la aplicación.

## Crear la versión final

```bash
npm run build
```

Los archivos listos para publicar aparecerán en la carpeta `dist`.

## Subir a GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de este proyecto, incluida la carpeta `.github`.
3. En el repositorio entra a **Settings → Pages**.
4. En **Source**, selecciona **GitHub Actions**.
5. Al subir cambios a la rama `main`, el flujo incluido construirá y publicará la aplicación automáticamente.

## Funciones

- Resolución original o personalizada.
- Tamaño de píxel configurable.
- Extracción perceptual de colores mediante agrupamiento.
- Reducción manual de la paleta con reasignación automática.
- Paletas Game Boy, NES, PICO-8, Sweetie 16, DawnBringer, CGA y escala de grises.
- Paletas personalizadas mediante valores HEX.
- Dithering Floyd–Steinberg y Bayer.
- Comparación con la imagen original.
- Exportación PNG.
