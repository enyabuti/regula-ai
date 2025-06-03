"use client";
import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaUser, FaRobot, FaPaperPlane } from 'react-icons/fa';

interface DocMeta {
  type: string;
  fileName?: string;
  url?: string;
}

interface Doc {
  id: string;
  meta: DocMeta;
  text: string;
}

interface QAEntry {
  id: string;
  question: string;
  answer: string;
  createdAt: any;
}

export default function ChatPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [chat, setChat] = useState<QAEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      const snap = await getDocs(collection(db, 'documents'));
      const docsArr: Doc[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        docsArr.push({ id: doc.id, ...data } as Doc);
      });
      setDocs(docsArr);
      if (docsArr.length > 0 && !selectedDoc) setSelectedDoc(docsArr[0].id);
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;
    const fetchChat = async () => {
      setLoading(true);
      setError('');
      try {
        const qRef = query(
          collection(db, 'qa_cache'),
          where('docId', '==', selectedDoc)
        );
        const snap = await getDocs(qRef);
        const chatArr: QAEntry[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          chatArr.push({ id: doc.id, ...data } as QAEntry);
        });
        // Sort by createdAt
        chatArr.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setChat(chatArr);
      } catch (err) {
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [selectedDoc]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, loading]);

  const handleSend = async () => {
    if (!question.trim() || !selectedDoc) return;
    setLoading(true);
    setError('');
    setChat((prev) => [
      ...prev,
      { id: 'user-' + Date.now(), question, answer: '', createdAt: { seconds: Date.now() / 1000 } },
    ]);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: selectedDoc, question }),
      });
      const data = await res.json();
      if (res.ok) {
        setChat((prev) => [
          ...prev,
          { id: 'ai-' + Date.now(), question, answer: data.answer, createdAt: { seconds: Date.now() / 1000 } },
        ]);
      } else {
        setError(data.error || 'Failed to get answer');
      }
    } catch (err) {
      setError('Failed to get answer');
    } finally {
      setLoading(false);
      setQuestion('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Regulation Q&amp;A Chatbot</h1>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Document:</label>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={selectedDoc}
          onChange={(e) => setSelectedDoc(e.target.value)}
        >
          {docs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.meta.fileName || doc.meta.url || doc.id}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-4 mb-4 border border-gray-200">
        {chat.map((entry, idx) => (
          <div key={entry.id + idx} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <FaUser className="text-blue-500" />
              <span className="font-semibold">You</span>
            </div>
            <div className="bg-white rounded p-2 mb-2 border border-gray-100 shadow-sm">
              {entry.question}
            </div>
            {entry.answer && (
              <div className="flex items-center gap-2 mb-1">
                <FaRobot className="text-green-500" />
                <span className="font-semibold">AI</span>
              </div>
            )}
            {entry.answer && (
              <div className="bg-gray-100 rounded p-2 border border-gray-200 shadow-sm">
                {entry.answer}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 animate-pulse">
            <FaRobot /> <span>AI is thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 p-2 border border-gray-300 rounded"
          type="text"
          placeholder="Ask a question about this regulation..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={handleSend}
          disabled={loading || !question.trim()}
        >
          <FaPaperPlane />
          Send
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
} 