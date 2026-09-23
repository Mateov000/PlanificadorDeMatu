import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let url: string = body?.url?.trim() || '';

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL requerida' }, { status: 400 });
    }

    // Convertir webcal:// a https://
    if (url.startsWith('webcal://')) {
      url = 'https://' + url.substring(9);
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'La URL debe comenzar con https://, http:// o webcal://' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlanificadorDeMatu/1.0; +https://planificador-de-matu.vercel.app)',
        Accept: 'text/calendar, text/plain, */*',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Error al obtener calendario de Google (${res.status} ${res.statusText})` },
        { status: res.status }
      );
    }

    const icsContent = await res.text();

    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json(
        { success: false, error: 'El contenido descargado no es un formato iCal/ICS válido.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, icsContent });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error de red al conectar con Google Calendar' },
      { status: 500 }
    );
  }
}
