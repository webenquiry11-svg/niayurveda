import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Admin from '../../../models/Admin';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  await dbConnect();

  const adminCount = await Admin.countDocuments();
  const hasAdmin = adminCount > 0;

  const token = req.cookies.get('admin_token')?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      isAuthenticated = true;
    } catch (err) {
      // invalid token
    }
  }

  return NextResponse.json({ hasAdmin, isAuthenticated });
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
  return response;
}