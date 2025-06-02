"use client";
import React, { useState } from 'react';

const INPUT_TYPES = [
  { label: 'PDF Upload', value: 'pdf' },
  { label: 'Paste Text', value: 'text' },
  { label: 'Provide URL', value: 'url' },
];

export default function UploadPage() {
  const [inputType, setInputType] = useState('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setMessage('');
    setError('');
    const formData = new FormData();
    formData.append('inputType', inputType);
    if (inputType === 'pdf') {
      if (!file) {
        setError('Please select a PDF file to upload.');
        return;
      }
      formData.append('file', file);
    } else if (inputType === 'text') {
      if (!rawText.trim()) {
        setError('Please paste some text.');
        return;
      }
      formData.append('rawText', rawText);
    } else if (inputType === 'url') {
      if (!url.trim()) {
        setError('Please provide a URL.');
        return;
      }
      formData.append('url', url);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setError('');
      } else {
        setError(data.error);
        setMessage('');
      }
    } catch (err) {
      setError('An error occurred while uploading.');
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Document</h1>
      <div className="w-full max-w-md p-4 border border-gray-300 rounded-lg">
        <div className="mb-4 flex gap-2">
          {INPUT_TYPES.map((type) => (
            <button
              key={type.value}
              className={`px-3 py-1 rounded border ${inputType === type.value ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border-blue-500'}`}
              onClick={() => setInputType(type.value)}
              type="button"
            >
              {type.label}
            </button>
          ))}
        </div>
        {inputType === 'pdf' && (
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full p-2 border border-gray-300 rounded" />
        )}
        {inputType === 'text' && (
          <textarea
            className="w-full p-2 border border-gray-300 rounded min-h-[120px]"
            placeholder="Paste your text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        )}
        {inputType === 'url' && (
          <input
            type="url"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter a document URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
        <button onClick={handleUpload} className="mt-4 w-full bg-blue-500 text-white p-2 rounded">Upload</button>
        {message && <p className="mt-2 text-green-500">{message}</p>}
        {error && <p className="mt-2 text-red-500">{error}</p>}
      </div>
    </div>
  );
} 