import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Language = "es" | "en";

const STORAGE_KEY = "pixelia-language";

const ES_TO_EN: Record<string, string> = {
  "Pixelia Studio, inicio": "Pixelia Studio, home",
  "☕ Apoyar Pixelia": "☕ Support Pixelia",
  "Cambiar imagen": "Change image",
  "Abrir imagen": "Open image",
  "Convierte cualquier imagen, encuentra su paleta esencial y decide exactamente cuánto detalle conservar.":
    "Turn any image into pixel art, find its essential palette, and decide exactly how much detail to keep.",
  "Elegir una imagen": "Choose an image",
  "Probar con el paisaje demo": "Try the demo landscape",
  "También puedes arrastrar una imagen aquí o pegarla con": "You can also drag an image here or paste it with",
  "Vista en miniatura de la imagen original": "Thumbnail of the original image",
  "Lienzo": "Canvas",
  "Resolución de salida": "Output resolution",
  "Personalizada": "Custom",
  "Ancho": "Width",
  "Alto": "Height",
  "Mantener proporción": "Keep aspect ratio",
  "Lado mayor": "Long edge",
  "Tamaño del píxel": "Pixel size",
  "Detalle": "Detail",
  "Bloques": "Blocks",
  "Encuadre": "Fit",
  "Cubrir": "Cover",
  "Contener": "Contain",
  "Estirar": "Stretch",
  "Paleta": "Palette",
  "Fuente de color": "Color source",
  "Extraída de mi imagen": "Extracted from my image",
  "Color original · sin límite": "Original color · unlimited",
  "Paleta personalizada": "Custom palette",
  "Colores esenciales": "Essential colors",
  "Agrupa tonos parecidos y conserva los que mejor describen la imagen.":
    "Groups similar tones and keeps the colors that best describe the image.",
  "Aplicar": "Apply",
  "Restaurar": "Reset",
  "Agregar color": "Add color",
  "Copiar valores HEX": "Copy HEX values",
  "Textura": "Texture",
  "Ninguno": "None",
  "Difusión": "Diffusion",
  "Ordenado": "Ordered",
  "Intensidad": "Strength",
  "Resultado": "Result",
  "Comparar": "Compare",
  "Alejar": "Zoom out",
  "Acercar": "Zoom in",
  "Recalculando píxeles": "Recalculating pixels",
  "Antes": "Before",
  "Imagen original": "Original image",
  "Resultado en pixel art": "Pixel art result",
  "Exportar imagen": "Export image",
  "Ese archivo no parece ser una imagen": "That file doesn't appear to be an image",
  "No pude leer esa imagen": "I couldn't read that image",
  "Pega al menos dos colores en formato #RRGGBB": "Paste at least two colors in #RRGGBB format",
  "PNG exportado": "PNG exported",
  "Paleta copiada en HEX": "Palette copied as HEX",
  "Escala de grises": "Grayscale",
  "Idioma / Language": "Language / Idioma",
};

const EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(ES_TO_EN).map(([es, en]) => [en, es]),
);

function initialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    // localStorage may be unavailable in some privacy modes.
  }

  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function dynamicToEnglish(text: string): string {
  let match: RegExpMatchArray | null;

  if ((match = text.match(/^(\d+) colores activos$/))) return `${match[1]} active colors`;
  if ((match = text.match(/^(\d+) colores aplicados$/))) return `${match[1]} colors applied`;
  if ((match = text.match(/^(\d+|∞) colores$/))) return `${match[1]} colors`;
  if ((match = text.match(/^(\d+)\s*×\s*(\d+) celdas$/))) return `${match[1]} × ${match[2]} cells`;
  if ((match = text.match(/^Eliminar color (#[0-9a-fA-F]{6})$/))) return `Remove color ${match[1]}`;
  if ((match = text.match(/^(#[0-9a-fA-F]{6}) · clic para eliminar$/))) return `${match[1]} · click to remove`;
  if ((match = text.match(/^Cuadrícula efectiva: (.+?)( · ajuste seguro aplicado)?$/))) {
    return `Effective grid: ${match[1]}${match[2] ? " · safe adjustment applied" : ""}`;
  }
  if ((match = text.match(/^(.+?) · (\d+) colores$/))) return `${match[1]} · ${match[2]} colors`;
  if ((match = text.match(/^(.+?) · (\d+) verdes$/))) return `${match[1]} · ${match[2]} greens`;
  if ((match = text.match(/^(.+?) · (\d+) tonos$/))) {
    const paletteName = match[1] === "Escala de grises" ? "Grayscale" : match[1];
    return `${paletteName} · ${match[2]} shades`;
  }

  return text;
}

function dynamicToSpanish(text: string): string {
  let match: RegExpMatchArray | null;

  if ((match = text.match(/^(\d+) active colors$/))) return `${match[1]} colores activos`;
  if ((match = text.match(/^(\d+) colors applied$/))) return `${match[1]} colores aplicados`;
  if ((match = text.match(/^(\d+|∞) colors$/))) return `${match[1]} colores`;
  if ((match = text.match(/^(\d+)\s*×\s*(\d+) cells$/))) return `${match[1]} × ${match[2]} celdas`;
  if ((match = text.match(/^Remove color (#[0-9a-fA-F]{6})$/))) return `Eliminar color ${match[1]}`;
  if ((match = text.match(/^(#[0-9a-fA-F]{6}) · click to remove$/))) return `${match[1]} · clic para eliminar`;
  if ((match = text.match(/^Effective grid: (.+?)( · safe adjustment applied)?$/))) {
    return `Cuadrícula efectiva: ${match[1]}${match[2] ? " · ajuste seguro aplicado" : ""}`;
  }
  if ((match = text.match(/^(.+?) · (\d+) colors$/))) return `${match[1]} · ${match[2]} colores`;
  if ((match = text.match(/^(.+?) · (\d+) greens$/))) return `${match[1]} · ${match[2]} verdes`;
  if ((match = text.match(/^(.+?) · (\d+) shades$/))) {
    const paletteName = match[1] === "Grayscale" ? "Escala de grises" : match[1];
    return `${paletteName} · ${match[2]} tonos`;
  }

  return text;
}

function translateValue(value: string, language: Language): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const dictionary = language === "en" ? ES_TO_EN : EN_TO_ES;
  const direct = dictionary[trimmed];
  const translated =
    direct ??
    (language === "en" ? dynamicToEnglish(trimmed) : dynamicToSpanish(trimmed));

  if (translated === trimmed) return value;

  const start = value.indexOf(trimmed);
  return `${value.slice(0, start)}${translated}${value.slice(start + trimmed.length)}`;
}

function translateElementAttributes(element: Element, language: Language) {
  for (const attribute of ["alt", "title", "aria-label", "placeholder"]) {
    const value = element.getAttribute(attribute);
    if (!value) continue;
    const translated = translateValue(value, language);
    if (translated !== value) element.setAttribute(attribute, translated);
  }
}

function translateTree(root: Element, language: Language) {
  document.documentElement.lang = language;

  translateElementAttributes(root, language);

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let elementNode = elementWalker.nextNode();
  while (elementNode) {
    translateElementAttributes(elementNode as Element, language);
    elementNode = elementWalker.nextNode();
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    const current = textNode.nodeValue ?? "";
    const translated = translateValue(current, language);
    if (translated !== current) textNode.nodeValue = translated;
    textNode = textWalker.nextNode();
  }
}

export default function LanguageController() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(".topbar-actions");
    if (target) {
      setPortalTarget(target);
      return;
    }

    const finder = new MutationObserver(() => {
      const nextTarget = document.querySelector<HTMLElement>(".topbar-actions");
      if (nextTarget) {
        setPortalTarget(nextTarget);
        finder.disconnect();
      }
    });

    finder.observe(document.body, { childList: true, subtree: true });
    return () => finder.disconnect();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The language switch still works even when storage is blocked.
    }

    const root = document.querySelector<HTMLElement>(".app");
    if (!root) return;

    translateTree(root, language);

    let scheduled = false;
    let frame = 0;

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      frame = window.requestAnimationFrame(() => {
        scheduled = false;
        observer.disconnect();
        translateTree(root, language);
        observer.observe(root, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["alt", "title", "aria-label", "placeholder"],
        });
      });
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["alt", "title", "aria-label", "placeholder"],
    });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [language]);

  if (!portalTarget) return null;

  return createPortal(
    <div
      className="pixelia-language-toggle"
      role="group"
      aria-label="Idioma / Language"
      title="ES / EN"
    >
      <button
        type="button"
        className={language === "es" ? "active" : ""}
        aria-pressed={language === "es"}
        onClick={() => setLanguage("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>,
    portalTarget,
  );
}
