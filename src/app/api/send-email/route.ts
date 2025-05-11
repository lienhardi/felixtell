import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { to, subject, body, from } = await request.json();

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: process.env.EMAIL_RECEIVE }],
            reply_to: { email: from }
          }
        ],
        from: {
          email: process.env.EMAIL_USER,
          name: 'Felix Tell'
        },
        subject: subject,
        content: [
          {
            type: 'text/plain',
            value: `From: ${from}\n\n${body}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 