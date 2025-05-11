import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, body, from } = await request.json();
    console.log('Received email request:', { to, subject, body, from });

    const { data, error } = await resend.emails.send({
      from: 'Felixtell <onboarding@resend.dev>',
      to: process.env.EMAIL_RECEIVE!,
      subject: subject,
      text: `From: ${from}\n\n${body}`,
      replyTo: from
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 