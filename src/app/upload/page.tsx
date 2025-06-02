import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

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
      setError('An error occurred while uploading the file.');
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Document</h1>
      <div className="w-full max-w-md p-4 border border-gray-300 rounded-lg">
        <input type="file" onChange={handleFileChange} className="w-full p-2 border border-gray-300 rounded" />
        <button onClick={handleUpload} className="mt-4 w-full bg-blue-500 text-white p-2 rounded">Upload</button>
        {message && <p className="mt-2 text-green-500">{message}</p>}
        {error && <p className="mt-2 text-red-500">{error}</p>}
      </div>
    </div>
  );
} 