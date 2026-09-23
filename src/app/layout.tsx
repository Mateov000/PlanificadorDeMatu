import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import '@/styles/timegrid.css';
import React from 'react';

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'PlanificadorDeMatu | Optimizador de Vida y Auto-Scheduling',
  description: 'Sistema operativo personal y optimizador CSP bio-psico-social determinista para turnos rotativos, cursada universitaria y vida real en Mar del Plata.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
