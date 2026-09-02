export type ColormapType = 'bd_curve' | 'thermal_rainbow' | 'grayscale' | 'microwave_rain' | 'wind_speed';

export function getColorForValue(val01: number, type: ColormapType): [number, number, number] {
  const v = Math.max(0, Math.min(1, val01));

  if (type === 'grayscale') {
    const c = Math.round(v * 255);
    return [c, c, c];
  }

  if (type === 'bd_curve') {
    // Standard Dvorak BD Enhancement Curve:
    // Coldest cloud tops (< 200K / v near 1.0) highlight eyewall & CDO
    // 0.00 - 0.30: Warm sea background (dark gray / black)
    // 0.30 - 0.50: Medium clouds (light gray)
    // 0.50 - 0.65: Curved convective bands (white)
    // 0.65 - 0.75: Cold CDO (-42 to -54°C, black band)
    // 0.75 - 0.85: Very cold CDO (-54 to -64°C, light gray)
    // 0.85 - 0.93: Coldest eyewall (-64 to -75°C, dark gray / medium gray)
    // 0.93 - 1.00: Extreme top (-75 to -85°C, pure white or pink)
    if (v < 0.30) {
      const g = Math.round((v / 0.30) * 80);
      return [g, g, g + 20];
    } else if (v < 0.50) {
      const t = (v - 0.30) / 0.20;
      const g = Math.round(80 + t * 140);
      return [g, g, g];
    } else if (v < 0.65) {
      return [230, 230, 235];
    } else if (v < 0.75) {
      // Black CDO band
      const t = (v - 0.65) / 0.10;
      const g = Math.round(30 + (1 - t) * 40);
      return [g, g, g];
    } else if (v < 0.85) {
      // Light Gray band
      return [180, 185, 190];
    } else if (v < 0.93) {
      // Medium Gray band
      return [120, 125, 130];
    } else {
      // White/Pink extreme eyewall
      return [255, 240, 245];
    }
  }

  if (type === 'thermal_rainbow') {
    // Blue -> Cyan -> Green -> Yellow -> Red -> White
    if (v < 0.2) {
      const t = v / 0.2;
      return [Math.round(20 + t * 20), Math.round(20 + t * 120), Math.round(100 + t * 155)];
    } else if (v < 0.4) {
      const t = (v - 0.2) / 0.2;
      return [Math.round(40), Math.round(140 + t * 100), Math.round(255 - t * 55)];
    } else if (v < 0.6) {
      const t = (v - 0.4) / 0.2;
      return [Math.round(40 + t * 200), Math.round(240), Math.round(200 - t * 180)];
    } else if (v < 0.8) {
      const t = (v - 0.6) / 0.2;
      return [Math.round(240 + t * 15), Math.round(240 - t * 140), 20];
    } else {
      const t = (v - 0.8) / 0.2;
      return [255, Math.round(100 + t * 155), Math.round(20 + t * 235)];
    }
  }

  if (type === 'microwave_rain') {
    // 89GHz rain scattering: Dark Blue -> Aqua -> Bright Yellow -> Orange -> Violent Red/Purple
    if (v < 0.25) {
      const t = v / 0.25;
      return [Math.round(10 + t * 20), Math.round(30 + t * 90), Math.round(80 + t * 120)];
    } else if (v < 0.5) {
      const t = (v - 0.25) / 0.25;
      return [Math.round(30 + t * 180), Math.round(120 + t * 120), Math.round(200 - t * 160)];
    } else if (v < 0.75) {
      const t = (v - 0.5) / 0.25;
      return [Math.round(210 + t * 45), Math.round(240 - t * 120), 40];
    } else {
      const t = (v - 0.75) / 0.25;
      return [Math.round(255 - t * 60), Math.round(120 - t * 100), Math.round(40 + t * 180)];
    }
  }

  if (type === 'wind_speed') {
    // Scatterometer: 0-15kt (navy/cyan), 15-33kt (green), 34-47kt (yellow/amber), 48-63kt (orange/red), 64kt+ (magenta/white)
    if (v < 0.25) {
      const t = v / 0.25;
      return [Math.round(15 + t * 15), Math.round(60 + t * 100), Math.round(140 + t * 60)];
    } else if (v < 0.5) {
      const t = (v - 0.25) / 0.25;
      return [Math.round(30 + t * 170), Math.round(160 + t * 70), Math.round(200 - t * 170)];
    } else if (v < 0.75) {
      const t = (v - 0.5) / 0.25;
      return [Math.round(200 + t * 55), Math.round(230 - t * 160), 30];
    } else {
      const t = (v - 0.75) / 0.25;
      return [Math.round(255 - t * 30), Math.round(70 - t * 40), Math.round(30 + t * 225)];
    }
  }

  return [128, 128, 128];
}

export function matrixToDataUri(matrix: number[][], colormap: ColormapType): string {
  const rows = matrix?.length || 0;
  const cols = matrix?.[0]?.length || 0;
  if (!rows || !cols) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%230b1f36"/></svg>';
  }

  let min = Infinity;
  let max = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = matrix[r][c];
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }
  const range = max - min || 1e-6;

  // If in browser environment with working 2D canvas context, use it for optimal speed
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(cols, rows);
        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const val01 = (matrix[r][c] - min) / range;
            const [red, green, blue] = getColorForValue(val01, colormap);
            imgData.data[idx] = red;
            imgData.data[idx + 1] = green;
            imgData.data[idx + 2] = blue;
            imgData.data[idx + 3] = 255;
            idx += 4;
          }
        }
        ctx.putImageData(imgData, 0, 0);

        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = 128;
        renderCanvas.height = 128;
        const rCtx = renderCanvas.getContext('2d');
        if (rCtx) {
          rCtx.imageSmoothingEnabled = false;
          rCtx.drawImage(canvas, 0, 0, 128, 128);
          return renderCanvas.toDataURL('image/png');
        }
        return canvas.toDataURL('image/png');
      }
    } catch {
      // Fall through to SVG renderer
    }
  }

  // Server-side (Node.js) or canvas fallback: generate SVG data URI
  let rects = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val01 = (matrix[r][c] - min) / range;
      const [red, green, blue] = getColorForValue(val01, colormap);
      const hex = '#' + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
      rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="${hex}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" width="${cols}" height="${rows}" shape-rendering="crispEdges">${rects}</svg>`;
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } else if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
