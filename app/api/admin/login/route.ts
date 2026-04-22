import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  await dbConnect();

  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
  }

  const admin = await Admin.findOne({ username });
  if (!admin || !admin.isSetupComplete) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET!, { expiresIn: '7d' });

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