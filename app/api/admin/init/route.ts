import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import { sendMail, transporter } from '../../../lib/mailer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  await dbConnect();

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin && existingAdmin.isSetupComplete) {
    return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const otpExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (existingAdmin) {
    existingAdmin.otp = token;
    existingAdmin.otpExpires = otpExpires;
    await existingAdmin.save();
  } else {
    await Admin.create({ email, otp: token, otpExpires });
  }

  const setupLink = `${process.env.NEXT_PUBLIC_APP_URL}/Admin/setup?email=${encodeURIComponent(email)}&token=${token}`;

  try {
    // 1. First, verify the SMTP connection to diagnose connection issues.
    await transporter.verify();
    console.log("SMTP Connection Verified Successfully.");

    // 2. If verification is successful, proceed to send the email.
    await sendMail(
      email,
      'Admin Setup Link',
      `Click the link to set up your admin account: ${setupLink}`,
      `<p>Click the link to set up your admin account: <a href="${setupLink}">${setupLink}</a></p>`
    );
    console.log("Admin setup email sent successfully.");

    return NextResponse.json({ message: 'Setup email sent' });
  } catch (error: any) {
    console.error('Email process failed:', error);
    const errorMessage =
      error.code === 'ETIMEDOUT'
        ? 'Connection to email server timed out. This may be due to a firewall on the hosting provider. Please check your Render service plan.'
        : `Failed to send email. Error: ${error.message}`;
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}