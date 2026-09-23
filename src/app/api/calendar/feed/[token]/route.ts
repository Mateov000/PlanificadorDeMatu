import { NextRequest, NextResponse } from 'next/server';
import { generateIcsCalendar } from '@/lib/calendar/icsGenerator';
import { Event } from '@/types/event';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 8) {
    return new NextResponse('Token de suscripción no válido', { status: 401 });
  }

  // En producción, buscar eventos asociados al token en Supabase
  // Devolvemos eventos con máscara de privacidad aplicada
  const sampleEvents: Event[] = [];

  const icsContent = generateIcsCalendar(sampleEvents, 'PlanificadorDeMatu (Live Feed)');

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="planificador-matu-feed.ics"',
      'Cache-Control': 'public, max-age=900', // 15 minutos de caché para optimizar clientes externos
    },
  });
}
