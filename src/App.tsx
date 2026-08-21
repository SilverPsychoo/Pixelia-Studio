import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DitherMode,
  PRESET_PALETTES,
  drawFittedImage,
  extractSmartPalette,
  quantizeImageData,
} from "./pixel-engine";

type PaletteMode = "source" | "original" | "custom" | keyof typeof PRESET_PALETTES;
type PreviewMode = "result" | "compare" | "original";
type FitMode = "cover" | "contain" | "stretch";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("imagen");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [resolutionMode, setResolutionMode] = useState<"original" | "custom">("original");
  const [customWidth, setCustomWidth] = useState(128);
  const [customHeight, setCustomHeight] = useState(128);
  const [linked, setLinked] = useState(true);
  const [pixelSize, setPixelSize] = useState(8);
  const [fitMode, setFitMode] = useState<FitMode>("cover");
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("source");
  const [colorCount, setColorCount] = useState(12);
  const [activePalette, setActivePalette] = useState<string[]>(PRESET_PALETTES.sweetie16.colors);
  const [paletteText, setPaletteText] = useState("");
  const [paletteRevision, setPaletteRevision] = useState(0);
  const [dither, setDither] = useState<DitherMode>("none");
  const [ditherStrength, setDitherStrength] = useState(75);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("result");
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState("");
  const [renderInfo, setRenderInfo] = useState({ width: 0, height: 0, gridWidth: 0, gridHeight: 0, effectivePixel: 0, limited: false });

  const outputSize = useMemo(() => {
    if (!image) return { width: 0, height: 0, limited: false };
    let width = resolutionMode === "original" ? image.naturalWidth : clamp(customWidth, 1, 8192);
    let height = resolutionMode === "original" ? image.naturalHeight : clamp(customHeight, 1, 8192);
    let limited = false;
    const scale = Math.min(1, 8192 / width, 8192 / height, Math.sqrt(36_000_000 / (width * height)));
    if (scale < 1) {
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      limited = true;
    }
    return { width, height, limited };
  }, [image, resolutionMode, customWidth, customHeight]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  const loadBlob = useCallback((blob: Blob, name: string) => {
    if (!blob.type.startsWith("image/")) return flash("Ese archivo no parece ser una imagen");
    const url = URL.createObjectURL(blob);
    const nextImage = new Image();
    nextImage.onload = () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = url;
      setSourceUrl(url);
      setImage(nextImage);
      setImageName(name.replace(/\.[^.]+$/, "") || "pixelia");
      setCustomWidth(Math.min(8192, nextImage.naturalWidth));
      setCustomHeight(Math.min(8192, nextImage.naturalHeight));
      setResolutionMode("original");
      setPaletteMode("source");
      setPreviewMode("result");
      setZoom(1);
    };
    nextImage.onerror = () => { URL.revokeObjectURL(url); flash("No pude leer esa imagen"); };
    nextImage.src = url;
  }, [flash]);

  useEffect(() => () => { if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current); }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) loadBlob(file, file.name || "imagen-pegada.png");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadBlob]);

  const loadDemo = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 960; canvas.height = 640;
    const context = canvas.getContext("2d")!;
    const sky = context.createLinearGradient(0, 0, 0, 640);
    sky.addColorStop(0, "#101b46"); sky.addColorStop(.55, "#e05a72"); sky.addColorStop(1, "#ffc675");
    context.fillStyle = sky; context.fillRect(0, 0, 960, 640);
    context.fillStyle = "#ffe890"; context.beginPath(); context.arc(720, 180, 92, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#45295f"; context.beginPath(); context.moveTo(0, 470); context.lineTo(230, 220); context.lineTo(420, 470); context.lineTo(610, 280); context.lineTo(840, 470); context.lineTo(960, 350); context.lineTo(960, 640); context.lineTo(0, 640); context.fill();
    context.fillStyle = "#183d4c"; context.beginPath(); context.moveTo(0, 510); context.lineTo(180, 390); context.lineTo(330, 500); context.lineTo(520, 370); context.lineTo(690, 510); context.lineTo(850, 400); context.lineTo(960, 490); context.lineTo(960, 640); context.lineTo(0, 640); context.fill();
    context.fillStyle = "#14746f"; context.fillRect(0, 510, 960, 130);
    context.fillStyle = "#62c4a1"; context.beginPath(); context.moveTo(400, 510); context.lineTo(560, 510); context.lineTo(690, 640); context.lineTo(250, 640); context.fill();
    for (let x = 45; x < 930; x += 95) {
      context.fillStyle = x % 190 ? "#102f37" : "#1b4850"; context.fillRect(x, 450 + (x % 4) * 7, 12, 95);
      context.beginPath(); context.moveTo(x - 34, 490); context.lineTo(x + 6, 395); context.lineTo(x + 45, 490); context.fill();
    }
    canvas.toBlob((blob) => blob && loadBlob(blob, "paisaje-demo.png"), "image/png");
  };

  useEffect(() => {
    if (!image) return;
    if (paletteMode === "original") return setActivePalette([]);
    if (paletteMode === "custom") return;
    if (paletteMode !== "source") return setActivePalette([...PRESET_PALETTES[paletteMode].colors]);
    const scale = Math.min(1, 360 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    setActivePalette(extractSmartPalette(context.getImageData(0, 0, canvas.width, canvas.height), colorCount));
  }, [image, paletteMode, colorCount, paletteRevision]);

  useEffect(() => {
    if (!image || !outputCanvasRef.current || !outputSize.width || !outputSize.height) return;
    let cancelled = false;
    setProcessing(true);
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const { width: outputWidth, height: outputHeight } = outputSize;
      const automaticPixel = Math.max(1, Math.ceil(Math.sqrt((outputWidth * outputHeight) / 2_250_000)));
      const effectivePixel = Math.max(pixelSize, automaticPixel);
      const gridWidth = Math.max(1, Math.ceil(outputWidth / effectivePixel));
      const gridHeight = Math.max(1, Math.ceil(outputHeight / effectivePixel));
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = gridWidth; smallCanvas.height = gridHeight;
      const smallContext = smallCanvas.getContext("2d", { willReadFrequently: true })!;
      drawFittedImage(smallContext, image, image.naturalWidth, image.naturalHeight, gridWidth, gridHeight, fitMode);
      if (activePalette.length) {
        const source = smallContext.getImageData(0, 0, gridWidth, gridHeight);
        smallContext.putImageData(quantizeImageData(source, activePalette, dither, ditherStrength / 100), 0, 0);
      }
      const output = outputCanvasRef.current;
      if (!output || cancelled) return;
      output.width = outputWidth; output.height = outputHeight;
      const context = output.getContext("2d")!;
      context.imageSmoothingEnabled = false; context.clearRect(0, 0, outputWidth, outputHeight);
      context.drawImage(smallCanvas, 0, 0, outputWidth, outputHeight);
      setRenderInfo({ width: outputWidth, height: outputHeight, gridWidth, gridHeight, effectivePixel, limited: outputSize.limited || effectivePixel !== pixelSize });
      setProcessing(false);
    });
    return () => { cancelled = true; window.cancelAnimationFrame(frame); };
  }, [image, outputSize, pixelSize, fitMode, activePalette, dither, ditherStrength]);

  const updateWidth = (value: number) => {
    const width = clamp(value, 1, 8192); setCustomWidth(width);
    if (linked && image) setCustomHeight(clamp(Math.round(width / (image.naturalWidth / image.naturalHeight)), 1, 8192));
  };
  const updateHeight = (value: number) => {
    const height = clamp(value, 1, 8192); setCustomHeight(height);
    if (linked && image) setCustomWidth(clamp(Math.round(height * (image.naturalWidth / image.naturalHeight)), 1, 8192));
  };
  const setLongEdge = (value: number) => {
    if (!image) return;
    setLinked(true);
    setResolutionMode("custom");
    if (image.naturalWidth >= image.naturalHeight) {
      setCustomWidth(value);
      setCustomHeight(Math.max(1, Math.round(value * image.naturalHeight / image.naturalWidth)));
    } else {
      setCustomHeight(value);
      setCustomWidth(Math.max(1, Math.round(value * image.naturalWidth / image.naturalHeight)));
    }
  };
  const applyPaletteText = () => {
    const colors = paletteText.match(/#[0-9a-fA-F]{6}/g)?.map((color) => color.toLowerCase()) ?? [];
    const unique = Array.from(new Set(colors));
    if (unique.length < 2) return flash("Pega al menos dos colores en formato #RRGGBB");
    setActivePalette(unique.slice(0, 64));
    flash(`${Math.min(unique.length, 64)} colores aplicados`);
  };
  const resetPalette = () => {
    if (paletteMode === "source") setPaletteRevision((value) => value + 1);
    else if (paletteMode === "custom") setActivePalette(["#14213d", "#f4f2ec"]);
    else if (paletteMode !== "original") setActivePalette([...PRESET_PALETTES[paletteMode].colors]);
  };
  const download = () => {
    const canvas = outputCanvasRef.current; if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(blob);
      anchor.download = `${imageName}-pixelia-${renderInfo.width}x${renderInfo.height}.png`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000); flash("PNG exportado");
    }, "image/png");
  };
  const copyPalette = async () => {
    if (!activePalette.length) return;
    await navigator.clipboard.writeText(activePalette.join(", ")); flash("Paleta copiada en HEX");
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (file) loadBlob(file, file.name); event.target.value = "";
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault(); setIsDragging(false);
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
    if (file) loadBlob(file, file.name);
  };

  return (
    <main className="app">
      <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Pixelia Studio, inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span><b>PIXELIA</b><small>STUDIO</small></span>
        </a>
        <button className="ghost-button" onClick={() => inputRef.current?.click()}>{image ? "Cambiar imagen" : "Abrir imagen"}</button>
      </header>

      {!image ? (
        <section className={`welcome ${isDragging ? "is-dragging" : ""}`} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
          <div className="welcome-copy">
            <h1>Pixelia<br /><em>Studio</em></h1>
            <p className="lede">Convierte cualquier imagen, encuentra su paleta esencial y decide exactamente cuánto detalle conservar.</p>
            <div className="welcome-actions">
              <button className="primary-button" onClick={() => inputRef.current?.click()}>Elegir una imagen <span>↗</span></button>
              <button className="text-button" onClick={loadDemo}>Probar con el paisaje demo</button>
            </div>
            <p className="paste-tip">También puedes arrastrar una imagen aquí o pegarla con <kbd>Ctrl</kbd> + <kbd>V</kbd></p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-grid" /><div className="pixel-sun" /><div className="mountain mountain-back" /><div className="mountain mountain-front" />
            <div className="palette-orbit">{PRESET_PALETTES.sweetie16.colors.slice(0, 8).map((color) => <i key={color} style={{ background: color }} />)}</div>
          </div>
        </section>
      ) : (
        <div className="studio">
          <aside className="controls">
            <div className="source-card">
              <img src={sourceUrl} alt="Vista en miniatura de la imagen original" />
              <div><strong>{imageName}</strong><span>{image.naturalWidth} × {image.naturalHeight} px</span></div>
              <button onClick={() => inputRef.current?.click()} aria-label="Cambiar imagen">↻</button>
            </div>

            <ControlSection number="01" title="Lienzo">
              <label className="field-label">Resolución de salida</label>
              <div className="segmented two"><button className={resolutionMode === "original" ? "active" : ""} onClick={() => setResolutionMode("original")}>Original</button><button className={resolutionMode === "custom" ? "active" : ""} onClick={() => setResolutionMode("custom")}>Personalizada</button></div>
              {resolutionMode === "custom" && <div className="dimension-row">
                <label><span>Ancho</span><input type="number" min="1" max="8192" value={customWidth} onChange={(event) => updateWidth(Number(event.target.value))} /></label>
                <button className={`link-button ${linked ? "active" : ""}`} onClick={() => setLinked(!linked)} aria-label="Mantener proporción">{linked ? "⛓" : "−"}</button>
                <label><span>Alto</span><input type="number" min="1" max="8192" value={customHeight} onChange={(event) => updateHeight(Number(event.target.value))} /></label>
              </div>}
              {resolutionMode === "custom" && <div className="resolution-presets"><span>Lado mayor</span>{[32, 64, 128, 256].map((size) => <button key={size} onClick={() => setLongEdge(size)}>{size}</button>)}</div>}
              <RangeControl id="pixel-size" label="Tamaño del píxel" value={pixelSize} min={1} max={64} suffix=" px" onChange={setPixelSize} />
              <div className="range-scale"><span>Detalle</span><span>Bloques</span></div>
              <label className="field-label top-gap">Encuadre</label>
              <div className="segmented three">{(["cover", "contain", "stretch"] as FitMode[]).map((mode) => <button key={mode} className={fitMode === mode ? "active" : ""} onClick={() => setFitMode(mode)}>{{ cover: "Cubrir", contain: "Contener", stretch: "Estirar" }[mode]}</button>)}</div>
            </ControlSection>

            <ControlSection number="02" title="Paleta">
              <label className="field-label" htmlFor="palette">Fuente de color</label>
              <select id="palette" value={paletteMode} onChange={(event) => setPaletteMode(event.target.value as PaletteMode)}>
                <option value="source">Extraída de mi imagen</option><option value="original">Color original · sin límite</option>
                <option value="custom">Paleta personalizada</option>
                {Object.entries(PRESET_PALETTES).map(([key, palette]) => <option key={key} value={key}>{palette.name} · {palette.hint}</option>)}
              </select>
              {paletteMode === "source" && <><RangeControl id="color-count" label="Colores esenciales" value={colorCount} min={2} max={32} onChange={setColorCount} /><p className="helper">Agrupa tonos parecidos y conserva los que mejor describen la imagen.</p></>}
              {paletteMode === "custom" && <div className="palette-import"><input value={paletteText} onChange={(event) => setPaletteText(event.target.value)} placeholder="#14213d, #b9f227, #3559e0…" aria-label="Colores HEX de la paleta" /><button onClick={applyPaletteText}>Aplicar</button></div>}
              {paletteMode !== "original" && <>
                <div className="palette-head"><span>{activePalette.length} colores activos</span><button onClick={resetPalette}>Restaurar</button></div>
                <div className="swatches">
                  {activePalette.map((color, index) => <button key={`${color}-${index}`} className="swatch" style={{ background: color }} title={`${color} · clic para eliminar`} aria-label={`Eliminar color ${color}`} onClick={() => activePalette.length > 2 && setActivePalette(activePalette.filter((_, swatchIndex) => swatchIndex !== index))}><span>×</span></button>)}
                  <label className="add-color" title="Agregar color">+<input type="color" onChange={(event) => !activePalette.includes(event.target.value) && setActivePalette([...activePalette, event.target.value])} /></label>
                </div><button className="copy-palette" onClick={copyPalette}>Copiar valores HEX</button>
              </>}
            </ControlSection>

            <ControlSection number="03" title="Textura">
              <label className="field-label">Dithering</label>
              <div className="segmented three">{(["none", "floyd", "bayer"] as DitherMode[]).map((mode) => <button key={mode} className={dither === mode ? "active" : ""} onClick={() => setDither(mode)}>{{ none: "Ninguno", floyd: "Difusión", bayer: "Ordenado" }[mode]}</button>)}</div>
              {dither !== "none" && <RangeControl id="dither-strength" label="Intensidad" value={ditherStrength} min={10} max={100} suffix="%" onChange={setDitherStrength} />}
            </ControlSection>
          </aside>

          <section className="workspace">
            <div className="workspace-toolbar">
              <div className="view-tabs"><button className={previewMode === "result" ? "active" : ""} onClick={() => setPreviewMode("result")}>Resultado</button><button className={previewMode === "compare" ? "active" : ""} onClick={() => setPreviewMode("compare")}>Comparar</button><button className={previewMode === "original" ? "active" : ""} onClick={() => setPreviewMode("original")}>Original</button></div>
              <div className="zoom-control"><button onClick={() => setZoom(Math.max(.25, zoom - .25))} aria-label="Alejar">−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.min(3, zoom + .25))} aria-label="Acercar">+</button></div>
            </div>
            <div className={`canvas-stage mode-${previewMode}`}>
              {processing && <div className="processing"><span /> Recalculando píxeles</div>}
              {(previewMode === "original" || previewMode === "compare") && <figure className="preview-frame original-frame" style={{ transform: `scale(${previewMode === "compare" ? Math.min(1, zoom) : zoom})` }}><figcaption>Antes</figcaption><img src={sourceUrl} alt="Imagen original" /></figure>}
              <figure className={`preview-frame result-frame ${previewMode === "original" ? "hidden-preview" : ""}`} style={{ transform: `scale(${previewMode === "compare" ? Math.min(1, zoom) : zoom})` }}>{previewMode === "compare" && <figcaption>Pixelia</figcaption>}<canvas ref={outputCanvasRef} aria-label="Resultado en pixel art" /></figure>
              <div className="stage-meta"><span>{renderInfo.gridWidth} × {renderInfo.gridHeight} celdas</span><span>{activePalette.length || "∞"} colores</span></div>
            </div>
            <div className="export-bar">
              <div className="export-summary"><span>PNG</span><div><strong>{renderInfo.width} × {renderInfo.height} px</strong><small>Cuadrícula efectiva: {renderInfo.effectivePixel} px {renderInfo.limited ? "· ajuste seguro aplicado" : ""}</small></div></div>
              <button className="export-button" onClick={download}>Exportar imagen <span>↓</span></button>
            </div>
          </section>
        </div>
      )}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

function ControlSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="control-section"><h2><span>{number}</span>{title}</h2>{children}</section>;
}

function RangeControl({ id, label, value, min, max, suffix = "", onChange }: { id: string; label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return <><div className="range-heading"><label htmlFor={id}>{label}</label><output>{value}{suffix}</output></div><input id={id} className="range" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ "--range": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} /></>;
}
