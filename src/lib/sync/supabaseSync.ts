import { createClient } from '@/lib/supabase/client';
import { Event } from '@/types/event';
import { ConstraintParams } from '@/types/parameters';

const LOCAL_STORAGE_EVENTS_KEY = 'planificador_matu_events_v1';
const LOCAL_STORAGE_PARAMS_KEY = 'planificador_matu_params_v1';
const LOCAL_STORAGE_TOKEN_KEY = 'planificador_matu_webcal_token_v1';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export function getLocalCachedEvents(): Event[] | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.map((e: any) => ({
      ...e,
      startTime: e.startTime ? new Date(e.startTime) : undefined,
      endTime: e.endTime ? new Date(e.endTime) : undefined,
      deadline: e.deadline ? new Date(e.deadline) : undefined,
    }));
  } catch (err) {
    console.error('Error leyendo caché local de eventos', err);
    return null;
  }
}

export function saveLocalCachedEvents(events: Event[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Error guardando caché local de eventos', err);
  }
}

export function getOrCreateWebcalToken(): string {
  const storage = getStorage();
  if (!storage) return 'matu-private-sync-token-2026';
  try {
    let token = storage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      token = `matu-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
      storage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'matu-private-sync-token-2026';
  }
}

/**
 * Sincronización Asíncrona con Supabase (Offline-first)
 */
export async function syncEventsToSupabase(events: Event[]): Promise<boolean> {
  // 1. Siempre guardar en caché local primero (resiliencia offline)
  saveLocalCachedEvents(events);

  if (typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Usuario en modo anónimo / local persistido
      return true;
    }

    // Si hay usuario autenticado, sincronizar eventos en la base de datos
    const dbEvents = events.map((e) => ({
      user_id: user.id,
      title: e.title,
      category_id: e.categoryId || null,
      start_time: e.startTime ? (e.startTime instanceof Date ? e.startTime.toISOString() : e.startTime) : null,
      end_time: e.endTime ? (e.endTime instanceof Date ? e.endTime.toISOString() : e.endTime) : null,
      duration_minutes: e.durationMinutes || 60,
      is_locked: e.isLocked || false,
      is_floating: e.isFloating || false,
      is_sensitive: e.isSensitive || false,
      display_alias: e.displayAlias || null,
      is_schedule_disruptor: e.isScheduleDisruptor || false,
      cognitive_load: e.cognitiveLoad ?? 0,
      physical_load: e.physicalLoad ?? 0,
      energy_drain: e.energyDrain || 'normal',
      location: e.location || 'Casa',
      deadline: e.deadline ? (e.deadline instanceof Date ? e.deadline.toISOString() : e.deadline) : null,
      min_block_minutes: e.minBlockMinutes ?? 90,
      max_block_minutes: e.maxBlockMinutes ?? 180,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('events').upsert(dbEvents, { onConflict: 'id' });
    if (error) {
      console.warn('Sincronización Supabase pospuesta:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error en conexión Supabase, manteniendo datos locales', err);
    return false;
  }
}
