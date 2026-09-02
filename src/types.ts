export type IMDStageCode = 0 | 1 | 2 | 3 | 4 | 5;

export interface IMDStageInfo {
  code: IMDStageCode;
  name: string;
  shortName: string;
  minWindKt: number;
  maxWindKt: number;
  color: string;
  bgLight: string;
  description: string;
  warningColor: string;
}

export interface ForecastPoint {
  hours: number;
  lat: number;
  lon: number;
  wind_kt: number;
  wind_kmh: number;
  pressure_hpa: number;
  heading_deg: number;
  speed_kmh: number;
  stage_code: IMDStageCode;
  stage_name: string;
  uncertainty_radius_km: number;
  landfall_risk?: string;
}

export interface ChannelThumbnails {
  ir: string;
  microwave: string;
  wind: string;
  water_vapor?: string;
}

export interface SatelliteMatrices {
  ir: number[][]; // 64x64 Kelvin (approx 190 - 290K)
  microwave: number[][]; // 64x64 Brightness / rain index
  wind: number[][]; // 64x64 Knots
  water_vapor?: number[][]; // 64x64 Moisture proxy
}

export interface CycloneEvent {
  id: string;
  name: string;
  basin: 'Bay of Bengal' | 'Arabian Sea' | 'North Indian Ocean';
  lat: number;
  lon: number;
  wind_kt: number;
  wind_kmh: number;
  pressure_hpa: number;
  heading_deg: number;
  speed_kmh: number;
  stage: IMDStageCode;
  stage_name: string;
  confidence: number;
  probabilities: Record<string, number>;
  dvorak_t_number: number;
  ci_number: number;
  eye_status: 'Pin-hole Eye' | 'Ragged Eye' | 'Cloud Filled Eye' | 'No Eye (Curved Band)';
  rmw_km: number; // Radius of Maximum Wind
  nearest_coast: {
    name: string;
    distance_km: number;
    eta_hours: number | null;
  };
  forecast: ForecastPoint[];
  channels: ChannelThumbnails;
  matrices?: SatelliteMatrices;
  features?: Record<string, number>;
  last_updated_utc: string;
}

export interface ClassificationResult {
  stage: IMDStageCode;
  stage_name: string;
  confidence: number;
  probabilities: Record<string, number>;
  dvorak_t_number: number;
  features: Record<string, number>;
}

export interface ForecastResult {
  current: {
    lat: number;
    lon: number;
    wind_kt: number;
    pressure_hpa: number;
  };
  track: ForecastPoint[];
}

export interface SimulationParams {
  seed: number;
  stage?: IMDStageCode;
  sea_surface_temp_c?: number;
  vertical_wind_shear_kt?: number;
  eye_forced?: boolean;
}

export interface AIBulletinResponse {
  bulletin_no: string;
  time_utc: string;
  system_name: string;
  classification: string;
  intensity_summary: string;
  track_outlook: string;
  landfall_warning: string;
  storm_surge_warning: string;
  fishermen_warning: string;
  action_suggested: string[];
  district_threat_levels: {
    district: string;
    state: string;
    threat: 'Extreme' | 'High' | 'Moderate' | 'Advisory';
    expected_impact: string;
  }[];
}
