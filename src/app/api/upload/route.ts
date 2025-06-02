import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inputType = formData.get('inputType');
    let extractedText = '';
    let meta: any = {};

    if (inputType === 'pdf') {
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      // TODO: Parse PDF text in a background job or external function
      extractedText = '[PDF text extraction not available in this environment]';
      meta = { type: 'pdf', fileName: file.name };
    } else if (inputType === 'text') {
      const rawText = formData.get('rawText');
      if (!rawText || typeof rawText !== 'string') {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 });
      }
      extractedText = rawText;
      meta = { type: 'text' };
    } else if (inputType === 'url') {
      const url = formData.get('url');
      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }
      // For MVP, just store the URL and let later processing fetch and parse it
      extractedText = '';
      meta = { type: 'url', url };
    } else {
      return NextResponse.json({ error: 'Invalid input type' }, { status: 400 });
    }

    // Store in Firestore
    await addDoc(collection(db, 'documents'), {
      text: extractedText,
      meta,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ message: 'Document uploaded and stored successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
} 