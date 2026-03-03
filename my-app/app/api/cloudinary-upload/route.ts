import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = 'dqt03lz3g';
const API_KEY = '379827429392976';
const API_SECRET = 'BMrFd2p9wQoYLhkTtxFq3oIdvNc';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File is required' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileStr = `data:${file.type};base64,${base64}`;

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = new URLSearchParams({ timestamp: String(timestamp) });
    const crypto = await import('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign.toString() + API_SECRET)
      .digest('hex');

    const uploadForm = new FormData();
    uploadForm.append('file', fileStr);
    uploadForm.append('api_key', API_KEY);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadForm,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: err.error?.message || 'Upload failed' },
        { status: 500 },
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      url: data.secure_url as string,
      publicId: data.public_id as string,
    });
  } catch (error) {
    console.error('[CLOUDINARY UPLOAD] error', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 },
    );
  }
}

