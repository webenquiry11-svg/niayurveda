import dbConnect from '../../lib/db';
import PatientRecord from '../../models/PateintRecord';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newRecord = await PatientRecord.create(body);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      // Mongoose validation error object has an 'errors' property
      for (const field in (error as any).errors) {
        validationErrors[field] = (error as any).errors[field].message;
      }
      return NextResponse.json({ success: false, message: 'Validation failed.', errors: validationErrors }, { status: 400 });
    }

    // Log the actual error for server-side debugging
    console.error('API Error:', error); 
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'An unknown server error occurred' }, { status: 500 });
  }
}