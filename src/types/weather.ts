export interface WeatherForecast {
  timestamp: string; // ISO 8601
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationProbability: number; // 0 - 100%
  rainMm: number;
  windSpeedKmh: number;
  windDirectionDegrees: number; // ~135° = Sudeste (SE)
  windGustsKmh: number;
  isSoutheastStorm: boolean;    // Flag crítico: Viento SE > 35 km/h
  comfortScore: number;         // 0 - 100 (Índice de confort al aire libre en Mar del Plata)
}

export interface WeatherCondition {
  timestamp: string;
  isOutdoorFeasible: boolean;
  comfortScore: number;
  recommendation: 'outdoor_prime' | 'outdoor_acceptable' | 'indoor_heavy_study_optimal';
}
