'use client'
import React, { useState } from 'react';
import Link from 'next/link';

export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ botName?: string; file?: string }>({});

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const validateForm = () => {
    const newErrors: { botName?: string; file?: string } = {};
    let isValid = true;

    // Validate bot name
    if (!botName.trim()) {
      newErrors.botName = 'Bot name is required';
      isValid = false;
    } else if (botName.length > 50) {
      newErrors.botName = 'Bot name must be 50 characters or less';
      isValid = false;
    }

    // Validate file
    if (!file) {
      newErrors.file = 'Please select a PDF file';
      isValid = false;
    } else if (!file.name.endsWith('.pdf')) {
      newErrors.file = 'Only PDF files are allowed';
      isValid = false;
    } else if (file.size > MAX_FILE_SIZE) {
      newErrors.file = 'File size must be less than 5MB';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Placeholder for Supabase upload (to be implemented in Day 2)
      console.log('Form submitted:', { botName, file });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create a New Bot</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="botName" className="block text-sm font-medium text-gray-700">
              Bot Name
            </label>
            <input
              type="text"
              id="botName"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bot name"
              maxLength={50}
            />
            {errors.botName && (
              <p className="mt-1 text-sm text-red-600">{errors.botName}</p>
            )}
          </div>
          <div>
            <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700">
              Upload PDF
            </label>
            <input
              type="file"
              id="pdfFile"
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Bot
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}