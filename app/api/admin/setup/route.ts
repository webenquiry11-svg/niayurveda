import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await dbConnect();

  const { email, token, username, password } = await req.json();

  if (!email || !token || !username || !password) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  const admin = await Admin.findOne({ email });
  if (!admin || admin.otp !== token || admin.otpExpires < new Date()) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  admin.username = username;
  admin.password = hashedPassword;
  admin.isSetupComplete = true;
  admin.otp = undefined;
  admin.otpExpires = undefined;

  await admin.save();

  return NextResponse.json({ message: 'Admin setup complete' });
}