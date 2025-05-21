import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, body, from, reply_to, attachments } = await request.json();
    console.log('Received email request:', { to, subject, body, from, hasAttachments: !!attachments });

    // Build the email configuration
    const emailConfig: any = {
      from: 'Felix Tell <info@felixtell.com>',
      to: process.env.EMAIL_RECEIVE!,
      subject: subject,
      text: body || `From: ${from}\n\n${body}`,
    };

    // Add reply-to header if provided
    if (reply_to) {
      emailConfig.reply_to = reply_to;
    } else if (from) {
      emailConfig.reply_to = from;
    }

    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailConfig.attachments = attachments.map(attachment => {
        // Handle base64 content properly
        let content = attachment.content;
        // If it's a data URL (starts with data:), extract just the base64 part
        if (content.startsWith('data:')) {
          const parts = content.split(',');
          if (parts.length > 1) {
            content = parts[1];
          }
        }
        return {
          filename: attachment.filename,
          content: content,
        };
      });
    }

    // Send the email
    const { data, error } = await resend.emails.send(emailConfig);

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