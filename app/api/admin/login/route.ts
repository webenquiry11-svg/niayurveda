import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  // Runtime check for critical environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not defined.');
    return NextResponse.json({ message: 'Server configuration error: Missing JWT secret.' }, { status: 500 });
  }

  await dbConnect();

  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
  }

  // Explicitly select the password field as it's hidden by default in the schema
  const admin = await Admin.findOne({ username }).select('+password');

  // Check if admin exists, if the password field was successfully retrieved,
  // and if the admin setup is complete. An incomplete setup should not allow login.
  if (!admin || !admin.password || !admin.isSetupComplete) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Now it's safe to compare the password, as admin.password is guaranteed to be a string
  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const response = NextResponse.json({ message: 'Login successful' });
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  return response;
}