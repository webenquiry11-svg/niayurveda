import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import { sendMail } from '../../../lib/mailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  // Runtime check for critical environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not defined.');
    return NextResponse.json({ message: 'Server configuration error: Missing JWT secret.' }, { status: 500 });
  }

  await dbConnect();
  const body = await req.json();
  const { action } = body;

  if (action === 'send_otp') {
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const existingAdmin = await Admin.findOne({ isSetupComplete: true });
    if (existingAdmin) {
      return NextResponse.json({ message: 'An admin account has already been set up.' }, { status: 409 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Admin.findOneAndUpdate(
      { email },
      { email, otp, otpExpires, isSetupComplete: false },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    try {
      await sendMail(
        email,
        'Your Admin Setup OTP',
        `Your One-Time Password is: ${otp}`,
        `<h3>Admin Account Setup</h3><p>Your One-Time Password (OTP) is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p><p>This code will expire in 10 minutes.</p>`
      );
      console.log("Admin setup OTP sent successfully.");
      return NextResponse.json({ message: 'OTP sent to your email.' });
    } catch (error: any) {
      console.error('Email process failed:', error);
      return NextResponse.json({ message: 'Failed to send OTP email.' }, { status: 500 });
    }
  } else if (action === 'verify_and_setup') {
    const { email, otp, username, password } = body;

    if (!email || !otp || !username || !password) {
      return NextResponse.json({ message: 'Email, OTP, username, and password are required' }, { status: 400 });
    }

    const admin = await Admin.findOne({ email }).select('+otp +otpExpires');

    if (!admin || admin.isSetupComplete || admin.otp !== otp || !admin.otpExpires || admin.otpExpires < new Date()) {
      return NextResponse.json({ message: 'Invalid or expired OTP.' }, { status: 400 });
    }

    try {
      const usernameExists = await Admin.findOne({ username, isSetupComplete: true });
      if (usernameExists) {
        return NextResponse.json({ message: 'Username is already taken.' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      admin.username = username;
      admin.password = hashedPassword;
      admin.isSetupComplete = true;
      admin.otp = undefined;
      admin.otpExpires = undefined;
      await admin.save();

      const token = jwt.sign({ id: admin._id, email: admin.email, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // In Route Handlers, cookies must be set on the response object.
      const response = NextResponse.json({ success: true, message: 'Admin account created and logged in.' });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    } catch (error: any) {
      console.error('Admin setup failed:', error);
      if (error.code === 11000) {
        return NextResponse.json({ message: 'Username is already taken.' }, { status: 409 });
      }
      return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'Invalid action specified' }, { status: 400 });
  }
}