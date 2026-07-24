import dbConnect from '../../lib/db';
import PatientRecord from '../../models/PateintRecord';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import JSZip from 'jszip';

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
  // Runtime check for critical environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not defined.');
    return NextResponse.json({ message: 'Server configuration error: Missing JWT secret.' }, { status: 500 });
  }

  try {
    // Secure this endpoint: Only logged in admins can view records
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError);
      // Return a 401 for any JWT error (e.g., expired, invalid signature)
      return NextResponse.json({ success: false, message: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Handle ZIP download action
    if (action === 'download_zip' && id) {
      const record = await PatientRecord.findById(id);
      if (!record || !record.imageUrls || record.imageUrls.length === 0) {
        return NextResponse.json({ message: 'No images found for this patient' }, { status: 404 });
      }

      const zip = new JSZip();
      const imagePromises = record.imageUrls.map(async (url: string, index: number) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
          const arrayBuffer = await response.arrayBuffer();
          const fileExtension = url.split('.').pop()?.split('?')[0] || 'jpg';
          zip.file(`image_${index + 1}.${fileExtension}`, arrayBuffer);
        } catch (fetchError) {
          console.error(`Could not fetch image from ${url}:`, fetchError);
          zip.file(`error_fetching_image_${index + 1}.txt`, `Failed to download image from: ${url}`);
        }
      });

      await Promise.all(imagePromises);

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const patientName = record.basicInfo?.name?.replace(/\s+/g, '_') || 'Patient';

      return new NextResponse(zipContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${patientName}_Images.zip"`,
        },
      });
    }

    // Default action: fetch all records for the dashboard
    try {
      const records = await PatientRecord.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: records });
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Server error while fetching records' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Unauthorized or Server Error' }, { status: 500 });
  }
}