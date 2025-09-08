"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';
import { uploadPDFToStorage, saveBotToDatabase } from '@/lib/supabase-storage';
import { validatePDF, getPDFInfo } from '@/lib/pdf-utils';

// Define the expected return types for the storage and database functions
interface UploadResult {
  success: boolean;
  error?: string;
  data?: { path: string };
  publicUrl?: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
  data?: { id: string };
}

export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ botName?: string; file?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);
  const [createdFilePath, setCreatedFilePath] = useState<string | null>(null);
  const [showProcessButton, setShowProcessButton] = useState(false);
  const router = useRouter();
  const supabaseClient = createSupabaseBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/login');
          return;
        }

        if (session) {
          console.log('Session found:', session.user.email);
          setUser(session.user);
        } else {
          console.log('No session found, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabaseClient.auth]);

  const validateForm = () => {
    const newErrors: { botName?: string; file?: string } = {};
    let isValid = true;

    if (!botName.trim()) {
      newErrors.botName = 'Bot name is required';
      isValid = false;
    } else if (botName.length > 50) {
      newErrors.botName = 'Bot name must be 50 characters or less';
      isValid = false;
    }

    if (!file) {
      newErrors.file = 'Please select a PDF file';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setErrors({ ...errors, file: undefined });
    setShowProcessButton(false); // Reset button on new file
  };

  const processPDF = async (botId: string, filePath: string) => {
    try {
      setProcessingStatus('Processing PDF and generating embeddings...');
      console.log('Calling process-pdf API with:', { botId, filePath });
      
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath, botId }),
      });

      const result = await response.json();
      console.log('Process-pdf API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF');
      }

      setProcessingStatus('PDF processed successfully!');
      return result;
    } catch (error) {
      console.error('PDF processing error:', error);
      setProcessingStatus('Error: ' + (error instanceof Error ? error.message : 'Failed to process PDF'));
      throw error;
    }
  };

  const handleManualProcess = async () => {
    if (!createdBotId || !createdFilePath) {
      setProcessingStatus('Error: No bot or file available for processing');
      return;
    }

    setIsSubmitting(true);
    try {
      setProcessingStatus('Processing PDF and generating embeddings...');
      console.log('Calling process-pdf API with:', { botId: createdBotId, filePath: createdFilePath });
      await processPDF(createdBotId, createdFilePath);
      setShowProcessButton(false);
    } catch (error) {
      console.error('Manual process error:', error);
      setProcessingStatus('Error: ' + (error instanceof Error ? error.message : 'Failed to process manually'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !file || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setProcessingStatus('');

    let uploadResult: UploadResult;
    let saveResult: SaveResult = { success: false };
    let filePathFromUpload: string = '';

    try {
      console.log('Starting bot creation...');

      const pdfInfo = await getPDFInfo(file);
      const validation = await validatePDF(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log('PDF basic info:', pdfInfo);

      console.log('Uploading to Supabase Storage...');
      uploadResult = await uploadPDFToStorage(file, user, botName);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      console.log('Upload result:', uploadResult);
      filePathFromUpload = uploadResult.publicUrl?.split('/bots/')[1] || '';
      if (!filePathFromUpload) {
        throw new Error('Upload result has no valid public URL');
      }
      console.log('Extracted filePathFromUpload:', filePathFromUpload);
      setCreatedFilePath(filePathFromUpload);

      console.log('Saving to database...');
      saveResult = await saveBotToDatabase(
        botName,
        file.name,
        filePathFromUpload,
        user.id,
        pdfInfo,
        '' // Empty botId, will be updated with data.id
      );
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Save failed');
      }
      console.log('Save result:', saveResult);

      const botId = saveResult.data?.id;
      if (!botId) {
        throw new Error('Failed to get botId from save result');
      }
      setCreatedBotId(botId);
      console.log('Bot ID created:', botId);

      console.log('About to call processPDF with botId:', botId, 'filePath:', filePathFromUpload);
      setProcessingStatus('Processing PDF and generating embeddings...');
      await processPDF(botId, filePathFromUpload);

      console.log('processPDF completed successfully');

      setShowProcessButton(false);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ file: error instanceof Error ? error.message : 'Unknown error' });
      setProcessingStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      if (saveResult.success && createdBotId) {
        setShowProcessButton(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create a New Bot</h1>
        
        {user && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">Logged in as: {user.email}</p>
          </div>
        )}

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
            {file && (
              <p className="mt-1 text-sm text-gray-500">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          {processingStatus && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">{processingStatus}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Bot'
            )}
          </button>

          {showProcessButton && (
            <button
              type="button"
              onClick={handleManualProcess}
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Process PDF Manually'}
            </button>
          )}
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