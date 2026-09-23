import { WeatherForecast } from '@/types/weather';

const MDP_LATITUDE = -38.0055;
const MDP_LONGITUDE = -57.5426;

/**
 * Calcula el índice de confort exterior (0 a 100) para Mar del Plata
 */
export function calculateComfortScore(
  temperature: number,
  windSpeed: number,
  windDirection: number,
  rainMm: number
): { comfortScore: number; isSoutheastStorm: boolean } {
  // Dirección Sudeste: entre 110° y 160°
  const isSoutheast = windDirection >= 110 && windDirection <= 160;
  const isHighWind = windSpeed >= 35;
  const isSoutheastStorm = isSoutheast && isHighWind;

  let score = 100;

  // Penalización severa por lluvia
  if (rainMm > 0) {
    score -= Math.min(60, rainMm * 20);
  }

  // Penalización por viento
  if (windSpeed > 20) {
    score -= (windSpeed - 20) * 1.5;
  }

  // Penalización por temporal Sudeste marítimo
  if (isSoutheastStorm) {
    score -= 40;
  }

  // Penalización por temperaturas extremas
  if (temperature < 12) {
    score -= (12 - temperature) * 3;
  } else if (temperature > 30) {
    score -= (temperature - 30) * 2;
  }

  return {
    comfortScore: Math.max(0, Math.min(100, Math.round(score))),
    isSoutheastStorm,
  };
}

/**
 * Consulta la API de Open-Meteo para Mar del Plata (Costo $0 sin API key)
 */
export async function fetchMarDelPlataForecast(): Promise<WeatherForecast[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MDP_LATITUDE}&longitude=${MDP_LONGITUDE}&hourly=temperature_2m,apparent_temperature,precipitation_probability,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m&forecast_days=7&timezone=America%2FArgentina%2FBuenos_Aires`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Error al consultar Open-Meteo');

    const data = await res.json();
    const hourly = data.hourly;
    if (!hourly || !hourly.time) return [];

    const forecasts: WeatherForecast[] = [];

    for (let i = 0; i < hourly.time.length; i++) {
      const time = hourly.time[i];
      const temp = hourly.temperature_2m[i];
      const apparentTemp = hourly.apparent_temperature[i];
      const precipProb = hourly.precipitation_probability[i];
      const rain = hourly.rain[i];
      const windSpeed = hourly.wind_speed_10m[i];
      const windDir = hourly.wind_direction_10m[i];
      const windGusts = hourly.wind_gusts_10m[i];

      const { comfortScore, isSoutheastStorm } = calculateComfortScore(temp, windSpeed, windDir, rain);

      forecasts.push({
        timestamp: time,
        temperatureC: temp,
        apparentTemperatureC: apparentTemp,
        precipitationProbability: precipProb,
        rainMm: rain,
        windSpeedKmh: windSpeed,
        windDirectionDegrees: windDir,
        windGustsKmh: windGusts,
        isSoutheastStorm,
        comfortScore,
      });
    }

    return forecasts;
  } catch (err) {
    console.error('Fallo Open-Meteo, usando fallback local', err);
    return [];
  }
}
