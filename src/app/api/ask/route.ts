import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { InferenceClient } from '@huggingface/inference';

export const runtime = 'nodejs';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const QA_MODEL = 'deepset/roberta-base-squad2'; // Public Q&A model with Inference API support

export async function POST(request: Request) {
  try {
    const { docId, question } = await request.json();
    if (!docId || !question) {
      return NextResponse.json({ error: 'Missing docId or question' }, { status: 400 });
    }

    // Check cache first
    const qRef = query(
      collection(db, 'qa_cache'),
      where('docId', '==', docId),
      where('question', '==', question)
    );
    const cached = await getDocs(qRef);
    if (!cached.empty) {
      const cachedAnswer = cached.docs[0].data().answer;
      return NextResponse.json({ answer: cachedAnswer, cached: true });
    }

    // Fetch document from Firestore
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const { text } = docSnap.data();
    if (!text) {
      return NextResponse.json({ error: 'No text to answer from' }, { status: 400 });
    }

    // Use HuggingFace InferenceClient for Q&A
    const client = new InferenceClient(HUGGINGFACE_API_KEY);
    const answerRes = await client.questionAnswering({
      model: QA_MODEL,
      inputs: {
        question,
        context: text,
      },
    });
    const answer = answerRes.answer || answerRes;

    // Cache answer
    await addDoc(collection(db, 'qa_cache'), {
      docId,
      question,
      answer,
      createdAt: new Date(),
    });

    return NextResponse.json({ answer, cached: false });
  } catch (error: any) {
    console.error('Q&A error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
} 