export type RGB = { r: number; g: number; b: number };

export type DitherMode = "none" | "floyd" | "bayer";

export const PRESET_PALETTES: Record<
  string,
  { name: string; hint: string; colors: string[] }
> = {
  gameboy: {
    name: "Game Boy",
    hint: "4 verdes",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  nes: {
    name: "NES Classic",
    hint: "20 colores",
    colors: [
      "#000000", "#fcfcfc", "#a4a7a7", "#585858", "#f83800", "#f87858",
      "#fca044", "#f8b800", "#f8d878", "#00b800", "#58d854", "#b8f8b8",
      "#0058f8", "#3cbcfc", "#6888fc", "#9878f8", "#d800cc", "#f878f8",
      "#a80020", "#7c7c7c",
    ],
  },
  pico8: {
    name: "PICO-8",
    hint: "16 colores",
    colors: [
      "#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f",
      "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436",
      "#29adff", "#83769c", "#ff77a8", "#ffccaa",
    ],
  },
  sweetie16: {
    name: "Sweetie 16",
    hint: "16 colores",
    colors: [
      "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75", "#a7f070",
      "#38b764", "#257179", "#29366f", "#3b5dc9", "#41a6f6", "#73eff7",
      "#f4f4f4", "#94b0c2", "#566c86", "#333c57",
    ],
  },
  dawnbringer: {
    name: "DawnBringer 16",
    hint: "16 colores",
    colors: [
      "#140c1c", "#442434", "#30346d", "#4e4a4e", "#854c30", "#346524",
      "#d04648", "#757161", "#597dce", "#d27d2c", "#8595a1", "#6daa2c",
      "#d2aa99", "#6dc2ca", "#dad45e", "#deeed6",
    ],
  },
  cga: {
    name: "CGA",
    hint: "16 colores",
    colors: [
      "#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa",
      "#aa5500", "#aaaaaa", "#555555", "#5555ff", "#55ff55", "#55ffff",
      "#ff5555", "#ff55ff", "#ffff55", "#ffffff",
    ],
  },
  grayscale: {
    name: "Escala de grises",
    hint: "8 tonos",
    colors: [
      "#111111", "#303030", "#505050", "#707070", "#909090", "#b0b0b0",
      "#d0d0d0", "#f4f4f4",
    ],
  },
};

export function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

type Lab = { l: number; a: number; b: number };

function rgbToLab({ r, g, b }: RGB): Lab {
  const linear = (channel: number) => {
    const v = channel / 255;
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  };
  const lr = linear(r);
  const lg = linear(g);
  const lb = linear(b);
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const pivot = (value: number) =>
    value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  const fx = pivot(x);
  const fy = pivot(y);
  const fz = pivot(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function labToRgb({ l, a, b }: Lab): RGB {
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const pivot = (value: number) => {
    const cube = value ** 3;
    return cube > 0.008856 ? cube : (value - 16 / 116) / 7.787;
  };
  const x = 0.95047 * pivot(fx);
  const y = pivot(fy);
  const z = 1.08883 * pivot(fz);
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let blue = x * 0.0557 + y * -0.204 + z * 1.057;
  const gamma = (value: number) =>
    255 * (value > 0.0031308 ? 1.055 * value ** (1 / 2.4) - 0.055 : 12.92 * value);
  r = gamma(r);
  g = gamma(g);
  blue = gamma(blue);
  return { r, g, b: blue };
}

function labDistance(a: Lab, b: Lab): number {
  return (a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;
}

export function extractSmartPalette(imageData: ImageData, colorCount: number): string[] {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  const data = imageData.data;
  const stride = Math.max(1, Math.floor(imageData.width * imageData.height / 90000));

  for (let pixel = 0; pixel < imageData.width * imageData.height; pixel += stride) {
    const i = pixel * 4;
    if (data[i + 3] < 96) continue;
    const key = (data[i] >> 3) << 10 | (data[i + 1] >> 3) << 5 | (data[i + 2] >> 3);
    const bin = bins.get(key);
    if (bin) {
      bin.count += 1;
      bin.r += data[i];
      bin.g += data[i + 1];
      bin.b += data[i + 2];
    } else {
      bins.set(key, { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  const points = Array.from(bins.values()).map((bin) => {
    const rgb = { r: bin.r / bin.count, g: bin.g / bin.count, b: bin.b / bin.count };
    return { rgb, lab: rgbToLab(rgb), weight: bin.count };
  });
  if (!points.length) return ["#000000", "#ffffff"];
  if (points.length <= colorCount) {
    return points
      .sort((a, b) => a.lab.l - b.lab.l)
      .map((point) => rgbToHex(point.rgb));
  }

  const centers: Lab[] = [];
  const dominant = points.reduce((best, point) => point.weight > best.weight ? point : best);
  centers.push({ ...dominant.lab });

  while (centers.length < colorCount) {
    let bestPoint = points[0];
    let bestScore = -1;
    for (const point of points) {
      const nearest = Math.min(...centers.map((center) => labDistance(point.lab, center)));
      const score = Math.sqrt(point.weight) * nearest;
      if (score > bestScore) {
        bestScore = score;
        bestPoint = point;
      }
    }
    centers.push({ ...bestPoint.lab });
  }

  for (let iteration = 0; iteration < 9; iteration += 1) {
    const sums = centers.map(() => ({ l: 0, a: 0, b: 0, weight: 0 }));
    for (const point of points) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = labDistance(point.lab, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const sum = sums[nearestIndex];
      sum.l += point.lab.l * point.weight;
      sum.a += point.lab.a * point.weight;
      sum.b += point.lab.b * point.weight;
      sum.weight += point.weight;
    }
    sums.forEach((sum, index) => {
      if (sum.weight > 0) {
        centers[index] = {
          l: sum.l / sum.weight,
          a: sum.a / sum.weight,
          b: sum.b / sum.weight,
        };
      }
    });
  }

  return centers
    .sort((a, b) => a.l - b.l)
    .map((center) => rgbToHex(labToRgb(center)))
    .filter((color, index, colors) => colors.indexOf(color) === index);
}

function nearestColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  let best = palette[0];
  let bestDistance = Infinity;
  for (const color of palette) {
    const redMean = (r + color.r) / 2;
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = (2 + redMean / 256) * dr * dr + 4 * dg * dg +
      (2 + (255 - redMean) / 256) * db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }
  return best;
}

export function quantizeImageData(
  source: ImageData,
  paletteHex: string[],
  mode: DitherMode,
  strength = 0.75,
): ImageData {
  if (!paletteHex.length) return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const palette = paletteHex.map(hexToRgb);
  const result = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const { width, height } = result;

  if (mode === "floyd") {
    const work = new Float32Array(result.data.length);
    for (let i = 0; i < result.data.length; i += 1) work[i] = result.data[i];
    const spread = (x: number, y: number, er: number, eg: number, eb: number, factor: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const index = (y * width + x) * 4;
      if (work[index + 3] < 96) return;
      work[index] += er * factor * strength;
      work[index + 1] += eg * factor * strength;
      work[index + 2] += eb * factor * strength;
    };
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        if (work[i + 3] < 96) continue;
        const oldR = Math.max(0, Math.min(255, work[i]));
        const oldG = Math.max(0, Math.min(255, work[i + 1]));
        const oldB = Math.max(0, Math.min(255, work[i + 2]));
        const next = nearestColor(oldR, oldG, oldB, palette);
        result.data[i] = next.r;
        result.data[i + 1] = next.g;
        result.data[i + 2] = next.b;
        spread(x + 1, y, oldR - next.r, oldG - next.g, oldB - next.b, 7 / 16);
        spread(x - 1, y + 1, oldR - next.r, oldG - next.g, oldB - next.b, 3 / 16);
        spread(x, y + 1, oldR - next.r, oldG - next.g, oldB - next.b, 5 / 16);
        spread(x + 1, y + 1, oldR - next.r, oldG - next.g, oldB - next.b, 1 / 16);
      }
    }
    return result;
  }

  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (result.data[i + 3] < 96) continue;
      const shift = mode === "bayer" ? (bayer[(y % 4) * 4 + (x % 4)] - 7.5) * 4 * strength : 0;
      const next = nearestColor(
        Math.max(0, Math.min(255, result.data[i] + shift)),
        Math.max(0, Math.min(255, result.data[i + 1] + shift)),
        Math.max(0, Math.min(255, result.data[i + 2] + shift)),
        palette,
      );
      result.data[i] = next.r;
      result.data[i + 1] = next.g;
      result.data[i + 2] = next.b;
    }
  }
  return result;
}

export function drawFittedImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: "cover" | "contain" | "stretch",
) {
  context.clearRect(0, 0, targetWidth, targetHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (fit === "stretch") {
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    return;
  }
  const scale = fit === "cover"
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  context.drawImage(image, (targetWidth - width) / 2, (targetHeight - height) / 2, width, height);
}
