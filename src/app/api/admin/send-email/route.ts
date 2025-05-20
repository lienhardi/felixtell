import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, body, html } = await request.json();
    console.log('Admin sending email:', { to, subject });

    // Validierung
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Alle Felder müssen ausgefüllt sein' },
        { status: 400 }
      );
    }

    // E-Mail-Konfiguration mit optionalem HTML-Body
    const emailConfig: any = {
      from: 'Felix Tell <info@felixtell.com>',
      to: to,
      subject: subject,
      text: body,
    };

    // Wenn HTML vorhanden ist, füge es hinzu
    if (html) {
      emailConfig.html = html;
    }

    // E-Mail senden
    const { data, error } = await resend.emails.send(emailConfig);

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Fehler beim Senden der E-Mail', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error processing admin email request:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail', details: error?.message || 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
} 