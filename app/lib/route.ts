import { transporter } from '@/app/lib/mailer';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('API: Attempting to verify SMTP connection...');
    
    // The verify method logs in to the SMTP server and checks if it's ready to send messages.
    // It does not send an actual email.
    await transporter.verify();

    console.log('API: SMTP connection verified successfully.');
    return NextResponse.json({ success: true, message: 'SMTP connection successful!' });

  } catch (error: any) {
    console.error('API: SMTP connection verification failed.', error);
    return NextResponse.json(
      { success: false, message: 'SMTP connection failed.', error: error.message },
      { status: 500 }
    );
  }
}