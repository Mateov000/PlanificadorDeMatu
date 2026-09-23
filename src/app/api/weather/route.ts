import { NextResponse } from 'next/server';
import { fetchMarDelPlataForecast } from '@/lib/weather/openMeteo';

export async function GET() {
  const forecasts = await fetchMarDelPlataForecast();
  return NextResponse.json({ forecasts });
}
