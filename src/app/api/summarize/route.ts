import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { InferenceClient } from '@huggingface/inference';

export const runtime = 'nodejs';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function POST(request: Request) {
  try {
    const { docId } = await request.json();
    if (!docId) {
      return NextResponse.json({ error: 'Missing docId' }, { status: 400 });
    }

    // Fetch document from Firestore
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const { text } = docSnap.data();
    if (!text) {
      return NextResponse.json({ error: 'No text to summarize' }, { status: 400 });
    }

    // Use HuggingFace InferenceClient for chat completion
    const client = new InferenceClient(HUGGINGFACE_API_KEY);
    const chatCompletion = await client.chatCompletion({
      provider: 'novita',
      model: 'deepseek-ai/DeepSeek-R1-0528',
      messages: [
        {
          role: 'user',
          content: `Summarize the following regulation. Return: A simple summary, an action checklist, risk red flags, deadline highlights. Text: ${text}`,
        },
      ],
    });

    const output = chatCompletion.choices?.[0]?.message?.content || chatCompletion.choices?.[0]?.message || chatCompletion;

    return NextResponse.json({ summary: output });
  } catch (error: any) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
} 