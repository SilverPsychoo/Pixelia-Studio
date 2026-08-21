# Pixelia Studio

Pixelia Studio es una aplicación web para convertir imágenes en pixel art directamente desde el navegador. Permite controlar la resolución, el tamaño de los bloques, la cantidad de colores, la paleta utilizada y el tipo de dithering antes de exportar el resultado como PNG.

No necesita backend, base de datos ni servicios externos. Todo el procesamiento ocurre en el dispositivo del usuario.

## Características

- Carga de imágenes PNG, JPEG, WebP y GIF.
- Importación mediante selector de archivos, arrastrar y soltar o pegar con `Ctrl + V`.
- Conservación de la resolución original.
- Resolución de salida personalizada de hasta 8192 píxeles por lado.
- Control independiente del tamaño visible de cada píxel.
- Ajuste de imagen mediante cubrir, contener o estirar.
- Extracción inteligente de la paleta original.
- Reducción de la cantidad de colores entre 2 y 32 tonos.
- Eliminación manual de colores con adaptación automática de la imagen.
- Incorporación de colores individuales o paletas completas mediante códigos HEX.
- Paletas Game Boy, NES Classic, PICO-8, Sweetie 16, DawnBringer 16, CGA y escala de grises.
- Dithering Floyd–Steinberg y Bayer.
- Comparación entre la imagen original y el resultado.
- Zoom de la vista previa.
- Exportación en formato PNG.
- Interfaz adaptable para computadora y dispositivos móviles.

## Privacidad

Cuando se selecciona una imagen, el navegador crea una referencia temporal al archivo y lo procesa mediante `Canvas`. La imagen:

- No se envía a un servidor.
- No se guarda en una base de datos.
- No se manda a una API.
- No requiere crear una cuenta.

La referencia temporal se libera al cambiar de imagen o cerrar la página.

## Funcionamiento del procesamiento

El proceso de conversión se realiza en varias etapas:

1. **Lectura de la imagen:** el navegador decodifica el archivo seleccionado.
2. **Resolución de salida:** se conserva el tamaño original o se utilizan las dimensiones indicadas por el usuario.
3. **Construcción de la cuadrícula:** el tamaño de píxel determina cuántas celdas formarán la imagen.
4. **Reducción de escala:** la imagen se dibuja en un lienzo pequeño utilizando interpolación de alta calidad.
5. **Cuantización de color:** cada celda se reemplaza por el color más cercano de la paleta activa.
6. **Dithering opcional:** se distribuye o alterna el error de color para simular tonos que no existen dentro de la paleta.
7. **Escalado final:** la cuadrícula se amplía sin suavizado para mantener los bordes definidos.
8. **Exportación:** el lienzo final se convierte en un archivo PNG descargable.

### Extracción inteligente de la paleta

Pixelia no se limita a elegir los colores que más se repiten. Primero agrupa tonos cercanos y después trabaja en un espacio de color perceptual para conservar colores visualmente diferentes.

El algoritmo:

1. Muestrea la imagen y genera un histograma reducido.
2. Convierte los colores de RGB a CIELAB.
3. Selecciona centros iniciales considerando frecuencia y distancia perceptual.
4. Agrupa los tonos cercanos mediante iteraciones ponderadas.
5. Ordena la paleta resultante por luminosidad.

Cuando se elimina un color de la paleta, los píxeles que lo utilizaban se reasignan automáticamente al tono restante más cercano.

### Métodos de dithering

| Método | Descripción | Uso recomendado |
| --- | --- | --- |
| Ninguno | Utiliza solamente el color más cercano de la paleta. | Sprites limpios, iconos y paletas amplias. |
| Floyd–Steinberg | Distribuye el error de cuantización hacia los píxeles vecinos. | Fotografías, degradados y paletas pequeñas. |
| Bayer | Aplica un patrón ordenado de 4 × 4. | Estética retro con textura regular. |

## Controles de la aplicación

| Control | Función |
| --- | --- |
| Resolución original | Mantiene las dimensiones del archivo de entrada. |
| Resolución personalizada | Permite indicar ancho y alto, con opción para conservar la proporción. |
| Lado mayor | Ajusta rápidamente el lado más grande a 32, 64, 128 o 256 píxeles. |
| Tamaño del píxel | Controla el tamaño de los bloques que forman el resultado. |
| Cubrir | Llena el lienzo y recorta lo que exceda sus límites. |
| Contener | Muestra la imagen completa y conserva el espacio transparente restante. |
| Estirar | Adapta la imagen exactamente al ancho y alto seleccionados. |
| Colores esenciales | Define cuántos tonos conserva la paleta extraída. |
| Paleta personalizada | Acepta una lista de colores en formato `#RRGGBB`. |
| Intensidad | Regula qué tanto influye el dithering sobre la imagen. |

## Tecnologías

- React 19
- TypeScript
- Vite
- Canvas API
- CSS responsivo

El proyecto no incluye dependencias para procesamiento de imágenes: la conversión se realiza con las funciones nativas del navegador.

### Archivos principales

- `src/App.tsx`: interfaz, estados, carga de archivos, vista previa y exportación.
- `src/pixel-engine.ts`: paletas, conversión CIELAB, extracción de colores, cuantización y dithering.
- `src/style.css`: diseño visual y adaptación responsiva.
- `public/favicon.svg`: icono de Pixelia Studio.

## Agregar una paleta predefinida

Las paletas se encuentran en `src/pixel-engine.ts`, dentro de `PRESET_PALETTES`.

```ts
miPaleta: {
  name: "Mi paleta",
  hint: "4 colores",
  colors: ["#14213d", "#3559e0", "#b9f227", "#f4f2ec"],
},
```

Al agregar una entrada válida aparecerá automáticamente en el selector de la aplicación.

## Límites de seguridad

Para evitar bloqueos o un consumo excesivo de memoria:

- La resolución máxima por lado es de 8192 píxeles.
- El lienzo final se limita aproximadamente a 36 millones de píxeles.
- La cuadrícula de procesamiento se limita aproximadamente a 2.25 millones de celdas.
- Si una imagen supera esos límites, Pixelia ajusta internamente el tamaño efectivo y lo indica en la barra de exportación.

Estos límites afectan únicamente imágenes extremadamente grandes.

## Solución de problemas

### Una imagen muy grande tarda en procesarse

Aumenta el tamaño del píxel o reduce la resolución de salida. Esto disminuye el número de celdas que necesita cuantizar el navegador.

## Compatibilidad

Pixelia utiliza Canvas, Object URLs y Clipboard API. Está pensada para versiones recientes de Chrome, Edge, Firefox, Opera y Safari.
