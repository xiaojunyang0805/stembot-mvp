"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export default function CreateBotPage() {
  const [botName, setBotName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ botName?: string; file?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
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
  setErrors({});

  try {
    if (!file) throw new Error('No file selected');
    if (!user) throw new Error('User not authenticated');

    // Generate unique file name with folder structure
    const timestamp = Date.now();
    const safeBotName = botName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${user.id}/${safeBotName}_${timestamp}.pdf`;

    console.log('Uploading file:', fileName, 'for user:', user.id);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('bots')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ File uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('bots')
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // Store metadata in database - with better error handling
    console.log('Attempting to insert into database...');
    const { data: botData, error: dbError } = await supabaseClient
      .from('bots')
      .insert({
        name: botName,
        file_name: fileName,
        file_url: urlData.publicUrl,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error details:', dbError);
      console.error('Database error code:', dbError.code);
      console.error('Database error message:', dbError.message);
      
      // Specific handling for common database errors
      if (dbError.code === '42501') {
        throw new Error('Database permissions error. Please check RLS policies for the bots table.');
      } else if (dbError.code === '23505') {
        throw new Error('Duplicate entry. A bot with this name may already exist.');
      } else if (dbError.code === '23503') {
        throw new Error('User reference error. Please try signing in again.');
      } else {
        throw new Error(`Database error: ${dbError.message}`);
      }
    }

    console.log('✅ Bot created successfully in database:', botData);

    setIsSuccess(true);
    
    // Reset form
    setBotName('');
    setFile(null);
    
    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

  } catch (error: any) {
    console.error('Error creating bot:', error);
    setErrors({ 
      file: error.message || 'Failed to create bot. Please try again.' 
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