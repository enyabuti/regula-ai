"use client";
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaListAlt, FaRegStickyNote } from 'react-icons/fa';

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

function parseSections(markdown: string) {
  const sections = {
    summary: '',
    checklist: '',
    risks: '',
    deadlines: '',
    other: ''
  };
  const regex = /### Simple Summary([\s\S]*?)### Action Checklist([\s\S]*?)### Risk Red Flags([\s\S]*?)### Deadline Highlights([\s\S]*)/;
  const match = markdown.match(regex);
  if (match) {
    sections.summary = match[1]?.trim() || '';
    sections.checklist = match[2]?.trim() || '';
    sections.risks = match[3]?.trim() || '';
    sections.deadlines = match[4]?.trim() || '';
  } else {
    sections.other = markdown;
  }
  return sections;
}

export default function SummaryPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'documents'));
        const docsArr: Doc[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          docsArr.push({ id: doc.id, ...data } as Doc);
        });
        setDocs(docsArr);
      } catch (err) {
        setError('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleSummarize = async (docId: string) => {
    setSelectedId(docId);
    setSummary(null);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || 'Summarization failed');
      }
    } catch (err) {
      setError('Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Summarize a Document</h1>
      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul className="mb-6">
        {docs.map((doc) => (
          <li key={doc.id} className="mb-2 flex items-center gap-2">
            <span className="font-mono text-sm">{doc.meta.fileName || doc.meta.url || doc.id}</span>
            <button
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onClick={() => handleSummarize(doc.id)}
              disabled={loading && selectedId === doc.id}
            >
              Summarize
            </button>
          </li>
        ))}
      </ul>
      {summary && (() => {
        const { summary: s, checklist, risks, deadlines, other } = parseSections(summary);
        const markdownComponents = {
          h3: (props: any) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          ul: (props: any) => <ul className="list-disc ml-6 mb-2" {...props} />,
          ol: (props: any) => <ol className="list-decimal ml-6 mb-2" {...props} />,
          li: (props: any) => <li className="mb-1" {...props} />,
          p: (props: any) => <p className="mb-2" {...props} />,
        };
        return (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-100">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
              <FaRegStickyNote className="text-blue-500" /> Summary Result
            </h2>
            {s && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold">
                  <FaListAlt /> Simple Summary
                </div>
                <ReactMarkdown components={markdownComponents}>{s}</ReactMarkdown>
              </div>
            )}
            {checklist && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-green-600 font-semibold">
                  <FaCheckCircle /> Action Checklist
                </div>
                <ReactMarkdown components={markdownComponents}>{checklist}</ReactMarkdown>
              </div>
            )}
            {risks && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-red-600 font-semibold">
                  <FaExclamationTriangle /> Risk Red Flags
                </div>
                <ReactMarkdown components={markdownComponents}>{risks}</ReactMarkdown>
              </div>
            )}
            {deadlines && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-yellow-600 font-semibold">
                  <FaClock /> Deadline Highlights
                </div>
                <ReactMarkdown components={markdownComponents}>{deadlines}</ReactMarkdown>
              </div>
            )}
            {other && (
              <div>
                <ReactMarkdown components={markdownComponents}>{other}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
} 