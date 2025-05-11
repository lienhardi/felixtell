import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
// import authOptions from '../auth/authOptions'; // Nur falls benötigt

export async function POST(request: Request) {
  try {
    const { to, subject, body, from } = await request.json();
    console.log('Received email request:', { to, subject, body, from });

    // E-Mail-Transporter konfigurieren
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // E-Mail senden
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVE,
      subject: subject,
      text: `From: ${from}\n\n${body}`,
      replyTo: from
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 