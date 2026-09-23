import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateIcsCalendar } from '@/lib/calendar/icsGenerator';
import { Event } from '@/types/event';
import { initialEvents } from '@/lib/store/scheduleStore';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 8) {
    return new NextResponse('Token de suscripción no válido (longitud mínima 8 caracteres).', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let eventsToFeed: Event[] = [];

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('mock.supabase.co')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 1. Verificar token en calendar_sync_tokens
      const { data: tokenRecord } = await supabase
        .from('calendar_sync_tokens')
        .select('user_id, is_active')
        .eq('token', token)
        .maybeSingle();

      if (tokenRecord && tokenRecord.is_active && tokenRecord.user_id) {
        // 2. Recuperar eventos activos del usuario
        const { data: dbEvents, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', tokenRecord.user_id);

        if (!error && dbEvents && dbEvents.length > 0) {
          eventsToFeed = dbEvents.map((r: any) => ({
            id: r.id,
            title: r.title,
            startTime: r.start_time ? new Date(r.start_time) : undefined,
            endTime: r.end_time ? new Date(r.end_time) : undefined,
            durationMinutes: r.duration_minutes || 60,
            isLocked: r.is_locked,
            isFloating: r.is_floating,
            isSensitive: r.is_sensitive,
            displayAlias: r.display_alias,
            isScheduleDisruptor: r.is_schedule_disruptor,
            cognitiveLoad: r.cognitive_load ?? 0,
            physicalLoad: r.physical_load ?? 0,
            energyDrain: r.energy_drain || 'normal',
            location: r.location || 'Casa',
          }));
        }
      }
    } catch (err) {
      console.warn('Error conectando con Supabase para el feed iCal, usando fallback:', err);
    }
  }

  // Fallback para tokens válidos de prueba / local
  if (eventsToFeed.length === 0) {
    eventsToFeed = initialEvents;
  }

  // generateIcsCalendar aplica automáticamente applyPrivacyShield sobre eventos sensibles
  const icsContent = generateIcsCalendar(eventsToFeed, 'PlanificadorDeMatu (Live Feed)');

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="planificador-matu-feed.ics"',
      'Cache-Control': 'public, max-age=900', // 15 minutos de caché
    },
  });
}
