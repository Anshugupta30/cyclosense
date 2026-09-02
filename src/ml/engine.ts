import {
  CycloneEvent,
  ForecastPoint,
  IMDStageCode,
  IMDStageInfo,
  SatelliteMatrices,
  SimulationParams,
  ClassificationResult,
  ForecastResult,
} from '../types';
import { matrixToDataUri } from './colormaps';

export const IMD_STAGES: Record<IMDStageCode, IMDStageInfo> = {
  0: {
    code: 0,
    name: 'No System / Disorganized Convection',
    shortName: 'No System',
    minWindKt: 0,
    maxWindKt: 16,
    color: '#64748B', // slate
    bgLight: '#F1F5F9',
    description: 'Low-pressure area / unorganized convective cloud cluster without closed isobaric circulation.',
    warningColor: '#94A3B8',
  },
  1: {
    code: 1,
    name: 'Depression (D)',
    shortName: 'Depression',
    minWindKt: 17,
    maxWindKt: 27,
    color: '#0284C7', // sky
    bgLight: '#E0F2FE',
    description: 'Well-marked low pressure area with 1-2 closed isobars. Wind speed 17-27 kt (31-49 km/h).',
    warningColor: '#38BDF8',
  },
  2: {
    code: 2,
    name: 'Deep Depression (DD)',
    shortName: 'Deep Depression',
    minWindKt: 28,
    maxWindKt: 33,
    color: '#0D9488', // teal
    bgLight: '#CCFBF1',
    description: 'Developing vortex with 3 closed isobars and organized banding. Wind speed 28-33 kt (50-61 km/h).',
    warningColor: '#2DD4BF',
  },
  3: {
    code: 3,
    name: 'Cyclonic Storm (CS)',
    shortName: 'Cyclonic Storm',
    minWindKt: 34,
    maxWindKt: 47,
    color: '#D97706', // amber
    bgLight: '#FEF3C7',
    description: 'Named tropical cyclone with gale-force winds. Wind speed 34-47 kt (62-88 km/h). Coastal alerts issued.',
    warningColor: '#FBBF24',
  },
  4: {
    code: 4,
    name: 'Severe Cyclonic Storm (SCS)',
    shortName: 'Severe CS',
    minWindKt: 48,
    maxWindKt: 63,
    color: '#EA580C', // orange
    bgLight: '#FFEDD5',
    description: 'Storm force winds with heavy eyewall organization. Wind speed 48-63 kt (89-117 km/h). High destructive potential.',
    warningColor: '#FB923C',
  },
  5: {
    code: 5,
    name: 'Very Severe Cyclonic Storm (VSCS)',
    shortName: 'Very Severe CS',
    minWindKt: 64,
    maxWindKt: 115,
    color: '#DC2626', // red
    bgLight: '#FEE2E2',
    description: 'Hurricane-intensity system with distinct warm eye. Wind speed 64+ kt (118+ km/h). Widespread catastrophic surge threat.',
    warningColor: '#F87171',
  },
};

export const STAGE_NAMES = [
  'No System',
  'Depression',
  'Deep Depression',
  'Cyclonic Storm',
  'Severe Cyclonic Storm',
  'Very Severe Cyclonic Storm',
];

const GRID = 64;

// Linear Congruential / Mulberry32 Pseudo-RNG for reproducible demo seeds
export function createRng(seed: number) {
  let s = seed >>> 0;
  return {
    next: () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    uniform: (min: number, max: number) => {
      let val = (s = (s + 0x6d2b79f5) | 0);
      let t = Math.imul(val ^ (val >>> 15), 1 | val);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const u = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return min + u * (max - min);
    },
    normal: (mean = 0, std = 1) => {
      // Box-Muller transform
      const u1 = Math.max(1e-6, ((s = (s + 0x6d2b79f5) | 0) >>> 0) / 4294967296);
      const u2 = ((s = (s + 0x6d2b79f5) | 0) >>> 0) / 4294967296;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + z0 * std;
    },
    integers: (min: number, max: number) => {
      const u = ((s = (s + 0x6d2b79f5) | 0) >>> 0) / 4294967296;
      return Math.floor(min + u * (max - min));
    },
  };
}

export function windSpeedForStage(stage: IMDStageCode, rng: ReturnType<typeof createRng>): number {
  const bands: Record<IMDStageCode, [number, number]> = {
    0: [8, 16],
    1: [18, 27],
    2: [28, 33],
    3: [35, 47],
    4: [49, 63],
    5: [65, 110],
  };
  const [lo, hi] = bands[stage];
  return rng.uniform(lo, hi);
}

export function pressureForWind(windKt: number): number {
  // IMD Mishra-Gupta / Dvorak empirical formula for North Indian Ocean
  // P_c = 1010 - 0.5 * (V_max / 10)^2 approx
  const drop = 0.5 * Math.pow(windKt / 10, 2.05);
  return Math.round(1012 - drop);
}

// Generate 64x64 Matrices
export function generateSatelliteChannels(
  stage: IMDStageCode,
  windKt: number,
  rng: ReturnType<typeof createRng>,
  forceEye = false
): SatelliteMatrices {
  const ir: number[][] = [];
  const mw: number[][] = [];
  const wind: number[][] = [];
  const wv: number[][] = [];

  const cx = 32;
  const cy = 32;
  const eyeVisible = forceEye || (stage >= 4 && rng.next() < 0.85);
  const intensity = Math.min(1.0, Math.max(0.1, windKt / 110.0));
  const spiralTightness = rng.uniform(2.2, 3.4);
  const nArms = rng.integers(2, 4);

  for (let y = 0; y < GRID; y++) {
    const irRow: number[] = [];
    const mwRow: number[] = [];
    const windRow: number[] = [];
    const wvRow: number[] = [];

    for (let x = 0; x < GRID; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);

      // --- IR Channel (Brightness Temp in K: warm ~285K sea, cold ~200K convective cloud tops) ---
      let baseIr = 282 - 30 * rng.next();
      if (stage === 0) {
        // Disorganized blobs
        let blobSum = 0;
        for (let b = 0; b < 4; b++) {
          const bx = 18 + ((b * 13) % 28);
          const by = 16 + ((b * 17) % 30);
          const br = 6;
          const distB = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
          blobSum += Math.exp(-(distB ** 2) / (2 * br * br)) * 25;
        }
        baseIr -= blobSum;
      } else {
        const spiral = Math.cos(nArms * theta - r / spiralTightness);
        const cloudShield = Math.exp(-r / (14 + 10 * intensity));
        const coldness = (0.5 + 0.5 * spiral) * cloudShield;
        baseIr -= coldness * (58 * intensity);

        if (eyeVisible) {
          const eyeRadius = Math.max(2.0, 6.0 - 4.5 * intensity);
          const eye = Math.exp(-(r * r) / (2 * eyeRadius * eyeRadius));
          baseIr += eye * (32 * intensity); // warm eye in center
        }
      }
      baseIr += rng.normal(0, 2.5);
      const finalIr = Math.max(190, Math.min(295, baseIr));
      irRow.push(finalIr);

      // --- Microwave 89GHz Channel (Ice Scattering / Heavy Rain Bands) ---
      let mwVal = 260 - 0.85 * (282 - finalIr);
      if (stage > 0) {
        const banding = Math.sin(3 * theta + r / 4.8) * 4.5 * (stage / 5);
        mwVal += banding;
      }
      mwVal += rng.normal(0, 4);
      mwRow.push(Math.max(180, Math.min(285, mwVal)));

      // --- Scatterometer Surface Wind Field (knots) ---
      let windVal = 0;
      if (stage === 0) {
        windVal = rng.uniform(6, 16) + rng.normal(0, 2);
      } else {
        // Modified Rankine Vortex profile
        const rmw = Math.max(3.5, 11 - 7 * (windKt / 110));
        let profile = 0;
        if (r <= rmw) {
          profile = windKt * (r / rmw);
        } else {
          profile = windKt * Math.pow(rmw / Math.max(r, 0.1), 0.62);
        }
        // Asymmetric wind swath (stronger on forward-right quadrant)
        const asymmetry = 1.0 + 0.18 * Math.cos(theta - 0.5);
        profile *= asymmetry;
        profile += rng.normal(0, 2.5);
        windVal = Math.max(0, profile);
      }
      windRow.push(windVal);

      // --- Water Vapor 6.7µm ---
      const wvVal = finalIr * 0.92 + 15 + Math.sin(r / 6) * 3 + rng.normal(0, 1.5);
      wvRow.push(wvVal);
    }
    ir.push(irRow);
    mw.push(mwRow);
    wind.push(windRow);
    wv.push(wvRow);
  }

  return { ir, microwave: mw, wind, water_vapor: wv };
}

// Extract Dvorak & ML Features
export function extractFeatures(matrices: SatelliteMatrices): Record<string, number> {
  const { ir, microwave, wind } = matrices;
  const size = ir.length;
  const cx = size / 2;
  const cy = size / 2;

  let irSum = 0, mwSum = 0, windSum = 0;
  let irMin = Infinity, irMax = -Infinity;
  let windMax = -Infinity;

  const nBins = 8;
  const radialBins: number[] = Array(nBins).fill(0);
  const radialCounts: number[] = Array(nBins).fill(0);
  const maxR = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const vIr = ir[y][x];
      const vMw = microwave[y][x];
      const vWind = wind[y][x];

      irSum += vIr;
      mwSum += vMw;
      windSum += vWind;

      if (vIr < irMin) irMin = vIr;
      if (vIr > irMax) irMax = vIr;
      if (vWind > windMax) windMax = vWind;

      const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const binIdx = Math.min(nBins - 1, Math.floor((r / maxR) * nBins));
      radialBins[binIdx] += vIr;
      radialCounts[binIdx]++;
    }
  }

  const total = size * size;
  const irMean = irSum / total;
  const mwMean = mwSum / total;
  const windMean = windSum / total;

  // Center vs Edge Contrast (Eye vs Cloud Wall signature)
  const centerMean = radialCounts[0] ? radialBins[0] / radialCounts[0] : irMean;
  const edgeMean = radialCounts[nBins - 1] ? radialBins[nBins - 1] / radialCounts[nBins - 1] : irMean;
  const centerEdgeContrast = centerMean - edgeMean;

  // 180° Rotational Symmetry (vortex organization)
  let symSum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const rotY = size - 1 - y;
      const rotX = size - 1 - x;
      const diff = Math.abs(ir[y][x] - ir[rotY][rotX]);
      symSum += diff;
    }
  }
  const symmetryScore = Math.max(0, 1 - (symSum / total) / 45);

  // Gradient energy (eyewall sharpness)
  let gradSum = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const gx = ir[y][x + 1] - ir[y][x - 1];
      const gy = ir[y + 1][x] - ir[y - 1][x];
      gradSum += Math.sqrt(gx * gx + gy * gy);
    }
  }
  const gradientEnergy = gradSum / ((size - 2) * (size - 2));

  // Eyewall Core Wind mean
  let centerWindSum = 0;
  let centerWindCount = 0;
  for (let y = 24; y < 40; y++) {
    for (let x = 24; x < 40; x++) {
      centerWindSum += wind[y][x];
      centerWindCount++;
    }
  }
  const centerWindMean = centerWindSum / centerWindCount;

  return {
    ir_mean: Math.round(irMean * 10) / 10,
    ir_min: Math.round(irMin * 10) / 10,
    ir_max: Math.round(irMax * 10) / 10,
    mw_mean: Math.round(mwMean * 10) / 10,
    wind_max: Math.round(windMax * 10) / 10,
    wind_mean: Math.round(windMean * 10) / 10,
    wind_center_mean: Math.round(centerWindMean * 10) / 10,
    symmetry_score: Math.round(symmetryScore * 1000) / 1000,
    gradient_energy: Math.round(gradientEnergy * 10) / 10,
    center_edge_contrast: Math.round(centerEdgeContrast * 10) / 10,
  };
}

// Ensemble Random Forest / Stage Classifier
export function classifySatelliteSystem(matrices: SatelliteMatrices): ClassificationResult {
  const feats = extractFeatures(matrices);
  const wMax = feats.wind_max;
  const sym = feats.symmetry_score;
  const grad = feats.gradient_energy;
  const contrast = feats.center_edge_contrast;

  // Multi-cue scoring across 6 stages
  const rawScores = [0, 0, 0, 0, 0, 0];

  // Stage 0: Disorganized
  rawScores[0] = Math.max(0, (20 - wMax) * 1.8 + (0.45 - sym) * 20);

  // Stage 1: Depression (17-27 kt)
  rawScores[1] = Math.max(0, 15 - Math.abs(wMax - 22) * 1.5 + (sym - 0.4) * 10);

  // Stage 2: Deep Depression (28-33 kt)
  rawScores[2] = Math.max(0, 18 - Math.abs(wMax - 30.5) * 1.6 + (sym - 0.55) * 12);

  // Stage 3: Cyclonic Storm (34-47 kt)
  rawScores[3] = Math.max(0, 20 - Math.abs(wMax - 41) * 1.2 + (sym - 0.65) * 15 + grad * 0.5);

  // Stage 4: Severe Cyclonic Storm (48-63 kt)
  rawScores[4] = Math.max(0, 22 - Math.abs(wMax - 55) * 1.1 + (sym - 0.75) * 18 + grad * 0.8);

  // Stage 5: Very Severe Cyclonic Storm (64+ kt)
  rawScores[5] = Math.max(0, (wMax - 58) * 1.5 + (sym - 0.78) * 22 + grad * 1.2 + Math.max(0, contrast - 5) * 1.5);

  // Softmax normalization
  const expScores = rawScores.map((s) => Math.exp(s / 4.5));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map((e) => e / sumExp);

  let predictedStage: IMDStageCode = 0;
  let maxP = -1;
  for (let i = 0; i < 6; i++) {
    if (probs[i] > maxP) {
      maxP = probs[i];
      predictedStage = i as IMDStageCode;
    }
  }

  // Dvorak T-Number estimation (T1.0 to T7.5)
  let dvorakT = 1.0;
  if (wMax < 25) dvorakT = 1.0 + (wMax / 25) * 0.5;
  else if (wMax < 35) dvorakT = 1.5 + ((wMax - 25) / 10) * 0.8;
  else if (wMax < 48) dvorakT = 2.5 + ((wMax - 35) / 13) * 0.8;
  else if (wMax < 64) dvorakT = 3.5 + ((wMax - 48) / 16) * 1.0;
  else dvorakT = Math.min(7.5, 4.5 + ((wMax - 64) / 45) * 2.5);

  const probDict: Record<string, number> = {};
  STAGE_NAMES.forEach((name, idx) => {
    probDict[name] = Math.round(probs[idx] * 1000) / 1000;
  });

  return {
    stage: predictedStage,
    stage_name: IMD_STAGES[predictedStage].name,
    confidence: Math.round(maxP * 1000) / 1000,
    probabilities: probDict,
    dvorak_t_number: Math.round(dvorakT * 10) / 10,
    features: feats,
  };
}

// 72h Physics Trajectory & Intensity Forecaster
export function forecastTrajectory(
  lat: number,
  lon: number,
  windKt: number,
  headingDeg: number,
  speedKmh: number,
  stage: IMDStageCode
): ForecastResult {
  const track: ForecastPoint[] = [];
  const hours = [24, 48, 72];

  // Intensity trend (cyclones over warm Bay of Bengal / Arabian Sea intensify early then level off)
  const intensRate = stage < 4 ? 0.35 : -0.28;

  hours.forEach((h) => {
    // Distance traveled
    const distKm = speedKmh * h;
    // Curved trajectory (Beta drift + Coriolis effect pulls tropical cyclones slightly north/northwest)
    const curveOffset = (h / 72) * 8.0; // degree curvature
    const effectiveHeading = (headingDeg + curveOffset) % 360;
    const rad = (effectiveHeading * Math.PI) / 180;

    const dlat = (distKm / 111.0) * Math.cos(rad);
    const dlon = (distKm / (111.0 * Math.cos((lat * Math.PI) / 180))) * Math.sin(rad);

    const fLat = Math.round((lat + dlat) * 1000) / 1000;
    const fLon = Math.round((lon + dlon) * 1000) / 1000;

    // Wind prediction with hour-scaled variance
    const deltaWind = intensRate * h;
    const fWindKt = Math.max(12, Math.min(135, Math.round(windKt + deltaWind)));
    const fWindKmh = Math.round(fWindKt * 1.852);
    const fPressure = pressureForWind(fWindKt);

    // Determine projected stage
    let fStage: IMDStageCode = 0;
    if (fWindKt >= 64) fStage = 5;
    else if (fWindKt >= 48) fStage = 4;
    else if (fWindKt >= 34) fStage = 3;
    else if (fWindKt >= 28) fStage = 2;
    else if (fWindKt >= 17) fStage = 1;

    // Uncertainty Cone Radius (IMD standard: ~60km at 24h, ~120km at 48h, ~180km at 72h)
    const uncertaintyRadius = Math.round(55 + (h / 72) * 135);

    // Landfall risk flag if approaching coasts
    let landfallRisk = undefined;
    if (fLat > 16 && fLon < 87 && fLon > 81) landfallRisk = 'Approaching Odisha / Andhra Pradesh Coast';
    else if (fLat > 20 && fLon > 87) landfallRisk = 'Approaching West Bengal / Bangladesh Coast';
    else if (fLat > 18 && fLon < 73) landfallRisk = 'Approaching Gujarat / Saurashtra Coast';

    track.push({
      hours: h,
      lat: fLat,
      lon: fLon,
      wind_kt: fWindKt,
      wind_kmh: fWindKmh,
      pressure_hpa: fPressure,
      heading_deg: Math.round(effectiveHeading),
      speed_kmh: Math.round(speedKmh),
      stage_code: fStage,
      stage_name: IMD_STAGES[fStage].shortName,
      uncertainty_radius_km: uncertaintyRadius,
      landfall_risk: landfallRisk,
    });
  });

  return {
    current: {
      lat,
      lon,
      wind_kt: windKt,
      pressure_hpa: pressureForWind(windKt),
    },
    track,
  };
}

// Distance to nearest Indian / regional coastline
export function calculateNearestCoast(lat: number, lon: number): { name: string; distance_km: number; eta_hours: number | null } {
  const COASTS = [
    { name: 'Puri, Odisha', lat: 19.81, lon: 85.83 },
    { name: 'Paradip, Odisha', lat: 20.31, lon: 86.61 },
    { name: 'Visakhapatnam, Andhra Pradesh', lat: 17.68, lon: 83.21 },
    { name: 'Chennai, Tamil Nadu', lat: 13.08, lon: 80.27 },
    { name: 'Digha / Sagar Island, West Bengal', lat: 21.62, lon: 87.52 },
    { name: 'Khepupara, Bangladesh', lat: 21.98, lon: 89.83 },
    { name: 'Veraval, Gujarat', lat: 20.90, lon: 70.36 },
    { name: 'Mumbai, Maharashtra', lat: 18.92, lon: 72.83 },
    { name: 'Cox\'s Bazar, Bangladesh', lat: 21.42, lon: 91.97 },
    { name: 'Sittwe, Myanmar', lat: 20.15, lon: 92.90 },
  ];

  let best = COASTS[0];
  let minDistance = Infinity;

  COASTS.forEach((c) => {
    const dLat = (c.lat - lat) * 111.0;
    const dLon = (c.lon - lon) * 111.0 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minDistance) {
      minDistance = dist;
      best = c;
    }
  });

  const distRounded = Math.round(minDistance);
  // Assume forward speed ~ 15 km/h
  const eta = distRounded > 0 ? Math.round((distRounded / 16) * 10) / 10 : null;

  return {
    name: best.name,
    distance_km: distRounded,
    eta_hours: eta,
  };
}

// Generate a complete standalone Cyclone Event
export function generateCycloneEvent(
  id: string,
  name: string,
  params: SimulationParams
): CycloneEvent {
  const rng = createRng(params.seed);
  const stage = params.stage !== undefined ? params.stage : (rng.integers(1, 6) as IMDStageCode);
  const windKt = Math.round(windSpeedForStage(stage, rng));
  const windKmh = Math.round(windKt * 1.852);
  const pressure = pressureForWind(windKt);

  // Position in North Indian Ocean (Arabian Sea or Bay of Bengal)
  const isBayOfBengal = rng.next() > 0.35;
  const lat = isBayOfBengal ? rng.uniform(10.5, 18.5) : rng.uniform(12.0, 19.5);
  const lon = isBayOfBengal ? rng.uniform(83.0, 92.5) : rng.uniform(64.5, 71.5);
  const basin = isBayOfBengal ? 'Bay of Bengal' : 'Arabian Sea';

  // Heading broadly NW-N-NE moving systems
  const headingDeg = isBayOfBengal ? rng.uniform(300, 360) : rng.uniform(330, 380) % 360;
  const speedKmh = Math.round(stage > 0 ? rng.uniform(10, 22) : rng.uniform(5, 10));

  // Generate satellite channels
  const matrices = generateSatelliteChannels(stage, windKt, rng, params.eye_forced);
  const classification = classifySatelliteSystem(matrices);
  const forecastRes = forecastTrajectory(lat, lon, windKt, headingDeg, speedKmh, stage);
  const coast = calculateNearestCoast(lat, lon);

  // Eye status
  let eyeStatus: CycloneEvent['eye_status'] = 'No Eye (Curved Band)';
  if (stage >= 5) eyeStatus = 'Pin-hole Eye';
  else if (stage === 4) eyeStatus = 'Ragged Eye';
  else if (stage === 3) eyeStatus = 'Cloud Filled Eye';

  // Thumbnails using default colorings
  const channels: CycloneEvent['channels'] = {
    ir: matrixToDataUri(matrices.ir, 'bd_curve'),
    microwave: matrixToDataUri(matrices.microwave, 'microwave_rain'),
    wind: matrixToDataUri(matrices.wind, 'wind_speed'),
    water_vapor: matrixToDataUri(matrices.water_vapor || matrices.ir, 'thermal_rainbow'),
  };

  return {
    id,
    name,
    basin,
    lat: Math.round(lat * 1000) / 1000,
    lon: Math.round(lon * 1000) / 1000,
    wind_kt: windKt,
    wind_kmh: windKmh,
    pressure_hpa: pressure,
    heading_deg: Math.round(headingDeg),
    speed_kmh: speedKmh,
    stage: classification.stage,
    stage_name: classification.stage_name,
    confidence: classification.confidence,
    probabilities: classification.probabilities,
    dvorak_t_number: classification.dvorak_t_number,
    ci_number: classification.dvorak_t_number,
    eye_status: eyeStatus,
    rmw_km: Math.round(Math.max(15, 55 - (windKt / 110) * 35)),
    nearest_coast: coast,
    forecast: forecastRes.track,
    channels,
    matrices,
    features: classification.features,
    last_updated_utc: new Date().toISOString(),
  };
}

// Built-in Demo Cyclone Systems (Historic & Active Indian Ocean Systems)
export function getInitialDemoEvents(): CycloneEvent[] {
  const seedList = [
    { name: 'Dana', seed: 4092, stage: 4 as IMDStageCode }, // Severe Cyclonic Storm
    { name: 'Remal', seed: 1823, stage: 5 as IMDStageCode }, // Very Severe CS
    { name: 'Fengal', seed: 5931, stage: 3 as IMDStageCode }, // Cyclonic Storm
    { name: 'Mocha', seed: 8842, stage: 5 as IMDStageCode }, // Extreme/VSCS
    { name: 'Biparjoy', seed: 3120, stage: 4 as IMDStageCode }, // Severe CS Arabian Sea
    { name: 'Asani', seed: 7419, stage: 2 as IMDStageCode }, // Deep Depression
  ];

  return seedList.map((item, idx) =>
    generateCycloneEvent(`evt-${idx + 1}`, item.name, {
      seed: item.seed,
      stage: item.stage,
    })
  );
}
