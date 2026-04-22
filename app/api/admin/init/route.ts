import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import { sendMail } from '../../../lib/mailer';
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

  const setupLink = `${process.env.NEXT_PUBLIC_BASE_URL}/Admin/setup?email=${encodeURIComponent(email)}&token=${token}`;

  try {
    await sendMail(
      email,
      'Admin Setup Link',
      `Click the link to set up your admin account: ${setupLink}`,
      `<p>Click the link to set up your admin account: <a href="${setupLink}">${setupLink}</a></p>`
    );

    return NextResponse.json({ message: 'Setup email sent' });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
  }
}