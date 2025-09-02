"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ botName?: string; file?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    } else if (!file.name.toLowerCase().endsWith('.pdf')) {
      newErrors.file = 'Only PDF files are allowed';
      isValid = false;
    } else if (file.size > MAX_FILE_SIZE) {
      newErrors.file = 'File size must be less than 5MB';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Placeholder for Supabase upload (to be implemented in Day 2)
      console.log('Form submitted:', { botName, file });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      setBotName('');
      setFile(null);
    } catch (error) {
      console.error('Error creating bot:', error);
      setErrors({ file: 'Failed to create bot. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Clear file error when a new file is selected
    if (selectedFile && errors.file) {
      setErrors({ ...errors, file: undefined });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Bot Created Successfully!</h2>
          <p className="mt-2 text-gray-600">Your bot has been created and is ready to use.</p>
          <div className="mt-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              aria-invalid={errors.botName ? "true" : "false"}
              aria-describedby={errors.botName ? "botName-error" : undefined}
            />
            {errors.botName && (
              <p id="botName-error" className="mt-1 text-sm text-red-600">{errors.botName}</p>
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
              aria-invalid={errors.file ? "true" : "false"}
              aria-describedby={errors.file ? "file-error" : undefined}
            />
            {errors.file && (
              <p id="file-error" className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
            {file && (
              <p className="mt-1 text-sm text-gray-500">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Bot'
            )}
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