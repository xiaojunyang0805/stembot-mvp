"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';
import { uploadPDFToStorage, saveBotToDatabase } from '@/lib/supabase-storage';
import { validatePDF, getPDFInfo } from '@/lib/pdf-utils';


export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ botName?: string; file?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

// Update the handleSubmit function to use simple validation:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;
  if (!file || !user) return;

  setIsSubmitting(true);
  setErrors({});

  try {
    // Validate PDF file with simple validation
    const validation = await validatePDF(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get basic PDF info (without heavy parsing)
    console.log('Getting basic PDF info...');
    const pdfInfo = await getPDFInfo(file);
    console.log('PDF basic info:', pdfInfo);

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const uploadResult = await uploadPDFToStorage(file, user, botName);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Save to database
    console.log('Saving to database...');
    const saveResult = await saveBotToDatabase(
      botName,
      uploadResult.data?.path || '',
      uploadResult.publicUrl || '',
      user.id,
      pdfInfo
    );

    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    console.log('Bot created successfully!');
    setIsSuccess(true);
    
    // Reset form
    setBotName('');
    setFile(null);
    
    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

  } catch (error: unknown) {
    console.error('Error creating bot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create bot. Please try again.';
    setErrors({ 
      file: errorMessage
    });
    setIsSuccess(false);
  } finally {
    setIsSubmitting(false);
  }
 };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile && errors.file) {
      setErrors({ ...errors, file: undefined });
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

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
          <p className="mt-1 text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  //async function handleCreateBot(file: File) {
    //try {
     // const filePath = `bots/${file.name}`;
      //const { error } = await supabase.storage.from('bots').upload(filePath, file);
      //if (error) throw error;
     // console.log('Uploaded file path:', filePath);
     // return filePath;
    //} catch (error) {
    //console.error('Error uploading PDF:', error);
    //}
  //}
  
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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