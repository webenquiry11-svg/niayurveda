import dbConnect from '../../lib/db';
import PatientRecord from '../../models/PateintRecord';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const newRecord = await PatientRecord.create(data);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error); 
    return NextResponse.json({ success: false, message: error.message || 'An unknown server error occurred' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Secure this endpoint: Only logged in admins can view records
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_in_production');

    const records = await PatientRecord.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Unauthorized or Server Error' }, { status: 500 });
  }
}