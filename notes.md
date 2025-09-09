StemBot Project Notes
Consolidated debugging and task notes for WP1 and WP2, merged from notes.txt and debug-log.md.
WP1 Task 4: Debugging
August 2025

Issue: TypeScript error: Module '"@/utils/supabase/client"' has no exported member 'User'.
Fix: Imported User from @supabase/supabase-js or updated client.ts to export types.
Outcome: Local and Vercel builds succeeded.
Lessons: Import Supabase types directly or ensure client.ts exports them; run npm run build locally before pushing.


Issue: 404 NOT_FOUND on stembot-mvp.vercel.app.
Fix: Changed Framework Preset to Next.js in Vercel.
Outcome: App loads, auth flow works online.
Lessons: Set correct Framework Preset; test default URL before custom domains; verify OAuth URLs early.


Issue: Dashboard Logout 404 caused by missing app/login/page.tsx.
Fix: Created login page with Supabase Google auth; logout redirects correctly.
Lessons: Verify Supabase OAuth setup in dashboard early.



WP2 Task 1: Dashboard Styling and Authentication
August 31, 2025

Issue: "Menu" toggle button overlaid "Your Bots" heading in mobile view (iPhone SE).
Fix: Added pt-20 to <main> for mobile, md:pt-6 for desktop.
Outcome: "Menu" button visible, toggles sidebar, "Your Bots" clear.
Lessons: Use Tailwind responsive classes (sm:, md:) and test at specific breakpoints.


Issue: "Menu" button disappeared in mobile view (≤425px); clicking hid button but sidebar didn’t show.
Fix: Moved toggle button outside <aside>, used sm:hidden, conditional positioning (top-6 left-6 when closed, bottom-4 left-4 when open), set sidebar to block when isSidebarOpen.
Outcome: Mobile view works with single-column bot list, no overlay.
Lessons: Avoid hidden with translate-x-full; use fixed positioning carefully.


Notes: Desktop polished with bg-gray-50 sidebar, p-6 bot cards, hover:scale-105. Bot list uses grid-cols-1 md:grid-cols-2 lg:grid-cols-3. Navigation ("Dashboard", "Create Bot", "Logout") functional.

September 1, 2025

Notes: Original mock bots array for restoration:const bots: Bot[] = [
  { id: 1, name: "Bot 1", created_at: "2025-09-01" },
  { id: 2, name: "Bot 2", created_at: "2025-09-02" },
  { id: 3, name: "Bot 3", created_at: "2025-09-03" },
];


Issue: Empty bot list edge case not handled.
Fix: Added conditional rendering with "No bots yet" message using Tailwind.
Outcome: Mock data restored, no issues.
Lessons: Test edge cases like empty lists early; use Tailwind for consistent styling.

September 2, 2025

Issue: Unauthenticated users access /dashboard on Vercel (https://stembot-mvp.vercel.app/dashboard) without redirecting to /login.
Fix: Planned middleware or RLS fix in WP2 Task 3 (pending testing).
Outcome: [Pending Phase 4 testing].
Lessons: Enforce auth checks in middleware; test Vercel redirects early.


Issue: Google OAuth login failed to redirect to /dashboard.
Fix: Updated middleware.ts with createSupabaseServerClient, added lib/supabase/server-client.ts and browser-client.ts, created app/auth/callback/route.ts.
Outcome: Local /dashboard redirect works post-login.
Lessons: Use async cookie methods for Next.js 15, ensure correct redirectTo.
Notes: Added lib/supabase folder and app/auth/callback/route.ts.


Notes: Updated Supabase and Google OAuth configurations for WP2 Task 1.
Supabase:
Site URL: Changed to https://stembot-mvp.vercel.app.
Redirect URLs: Added http://localhost:3000/auth/callback, https://stembot-mvp.vercel.app/auth/callback, https://stembot-mvp.vercel.app/auth/confirm; removed http://localhost:3000/dashboard, http://localhost:3000/api/auth/callback, http://stembot-mvp.vercel.app/dashboard.
Email Confirmation: Enabled in Authentication > SignIn/Providers > Supabase Auth > User Signups.
SMTP Settings: Enable Custom SMTP disabled (using Supabase Platform Email Service).


Google OAuth:
Authorized JavaScript Origins: Kept http://localhost:3000, https://stembot-mvp.vercel.app; removed http://stembot.supabase.co.
Authorized Redirect URIs: Added http://localhost:3000/auth/callback, https://stembot-mvp.vercel.app/auth/callback, https://stembot-mvp.vercel.app/auth/confirm; removed http://localhost:3000/dashboard, https://stembot-mvp.vercel.app/dashboard, http://localhost:3000/api/auth/callback, https://lbezfsimdogrudqvkczx.supabase.co/auth/v1/callback.


September 2, 2025
Phase 4 testing, Step 4.1 - Local Login Test
Test: Google OAuth login at `http://localhost:3000/login` with test account.
Outcome: Redirected to /verify.

Issue: Logout button flashes login page, doesn’t redirect properly.
Test: Clicked "Logout" on `/dashboard` after login with verified account.
Fix: Updated app/dashboard/page.tsx, Added client component.
Outcome: Redirects to `/login` without flashing.

Phase 4, Step 4.2 - Local Dashboard Access Test
Test: Access `http://localhost:3000/dashboard` unauthenticated and unverified in incognito tab.
Outcome: Unauthenticated redirects to `/login`, unverified redirects to `/verify`.
Notes: Used testuser2@gmail.com for unverified test, checked middleware logs.

Phase 4, Step 4.4 - Vercel Deployment Fix (no-explicit-any and CookieMethodsServer)**
Issue: Build failed due to @typescript-eslint/no-explicit-any in server-client.ts, deprecated CookieMethodsServerDeprecated.
Fix: App/lib/supabase/server-client.ts: Simple interface that matches Next.js requirements. interface CookieOptions {}, export const createSupabaseServerClient = async () => {const cookieStore = await cookies...};
Outcome: Successful Vercel deployment, main page loads correctly.
Notes: Since createSupabaseServerClient() is now an async function (returns a Promise), add await for route.ts, middleware.ts. 

Issue:Logout problem: https://stembot-mvp.vercel.app/ redirect to dashboard directly. Logout cannot work. While http://localhost:3000/login works well, the logout in dashboard does not work. The main page http://localhost:3000 works well, including funtional logout. 
Fix: The problem is in app/login/page.ts: checkSession function. It has a setTimeout that delays the session check, but this can cause race conditions and unexpected behavior. setTimeout is removed. 
Outcome: New UI for login and the logout is successful now.

Issue: http://localhost:3000 (root page) direct to dashboard directly. Logout doesn't work. 
Problem: Middleware.ts: Using getSession() which reads from storage (cookies) without verification
Fix:  Middleware.ts: Using getUser() which verifies authenticity with Supabase Auth server
Outcome: Secure authentication flow without the security warning

September 3, 2025
Issue: Uploading spinner cannot properly exeucate uploading. 
Fix: set Supabase Storage Policies - Proper Database RLS Policies - Proper policies for the bots table
Outcome: PDF files now upload successfully to Supabase Storage.The file can be viewed and operated in supabase bots bucket. 

Issue: comiple failure occurs for vercel deployment. 
Fix: Replaced any with proper TypeScript types: User type from @supabase/supabase-js instead of any; error: unknown instead of error: any in catch blocks; Proper error type checking with instanceof Error.
Outcome: Compile successfully on Vercel (no any types)

*WP2 outcome reminder: Used placeholder in getPDFInfo to avoid pdfjs-dist setup issues; need to implement full parsing in WP3. 

Improvment: 
1. In dashboard/page.tsx: Replace mock data with real fetch. 
2. Display bots in cards/list: Show name, created_at, and add "View Bot" button linking to /bot/[id] viadynamic route by creating placeholder app/bot/[id]/page.tsx. 

September 4, 2025
Work Package 3: Task 1 - Setup AI Vector Database and Install Dependencies 
Objective: Set up Pinecone vector database, install LangChain dependencies, and configure OpenAI API key for the StemBot MVP project.

Tasks Completed
Pinecone Setup:
1. Created `stembot-vectors` index in Pinecone (dimension: 1536, metric: cosine, serverless, AWS us-east-1).
2. Added `PINECONE_API_KEY` to `.env.local` and verified in Pinecone dashboard.
3. Created `lib/pinecone.ts` to initialize Pinecone client and export `pineconeIndex`.

September 6, 2025
WP3_Task2: PDF parsing and embedding generation.
Objective: Implement PDF parsing from Supabase storage, text extraction, OpenAI embedding generation, and Pinecone vector storage
check: http://localhost:3000/api/process-pdf
Expected: {"message":"PDF processing API is running","usage":"Send a POST request with { \"filePath\": \"your-file.pdf\" }"}
##Test command in command prompt:
curl -X POST http://localhost:3000/api/process-pdf \ -H "Content-Type: application/json" \ -d "{\"filePath\": \"dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757108708629.pdf\"}"
Terminal output: Processing PDF request received
File path: dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757108708629.pdf
Fetching PDF from Supabase...
Converting Blob to ArrayBuffer...
ArrayBuffer size: 261017
Parsing PDF...
PDF parsed successfully, text length: 16103
Splitting text into chunks...
Number of chunks: 5
Generating embeddings...
Initializing PineconeStore...
Storing embeddings in Pinecone...
Unhandled error: [Error [InsufficientQuotaError]: 429 You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.
Troubleshooting URL: https://js.langchain.com/docs/troubleshooting/errors/MODEL_RATE_LIMIT/
]

Challenges and cause
1. PDF Parsing Library Issues
Problem: Multiple library failures and compatibility issues
pdfjs-dist: Canvas dependency errors and worker module resolution issues
pdf-parse: Test file access errors during build process
pdf2json: Text extraction returning empty results (0 characters)
Root Cause:
Server vs client environment mismatches
Missing native dependencies (canvas, GTK libraries)
Library-specific build-time file access issues
2. Environment Configuration Problems
Canvas installation failures on Windows
Module resolution errors in Next.js/Turbopack
TypeScript declaration issues for untyped libraries
3. OpenAI API Limitations
Rate limiting and quota exceeded errors (429 InsufficientQuotaError)
Billing and usage plan restrictions

Key Configuration Fixes
Worker Import Correction: Used pdfjs-dist/build/pdf.worker.entry instead of CDN
TypeScript Declarations: Created custom .d.ts files for untyped modules
Next.js Config: Added webpack aliases to avoid canvas dependency
Supabase Path Handling: Corrected file path structure with folder prefixes

Outcome: 
1. Supabase Integration: Successful PDF download from storage buckets
2. PDF Text Extraction: 16,103 characters extracted from test PDF
3. Text Chunking: 5 valid chunks created from extracted text
4. Embedding Initialization: OpenAI embeddings client configured correctly
5. Pinecone Integration: Connection established to stembot-vectors index

September 7, 2025
Switching Openai API to Hugging Face API, then tested successfully. 
File: "IOT Based Environment Monitoring System Using ESP32.pdf" (renamed to Stem_project_01_1757108708629.pdf)
Details: 5 pages, 261,017 bytes, 16,103 characters.

Embedding: Generated 768-dimensional vectors using sentence-transformers/all-mpnet-base-v2 via Hugging Face Inference API, resolving an initial authentication error with a new API key.

Storage: Stored embeddings in the stembot-vectros-hf Pinecone index (768 dim, cosine, serverless, aws us-east-1) under the pdf-embeddings namespace, fixing a 404 error due to a name typo (stembot-vectors-hf vs. stembot-vectros-hf).

Processing Time: ~5-10 seconds (including network calls).
Capacity: Fits within Pinecone’s free-tier ~100k vector limit.

September 8, 2025
WP3_Task3: Test Embedding Retrieval and Supabase Integration
Task3.1: Implement Retrieval Logic by adding "app/api/retrieve-embeddings/route.ts"
Test: Run "npm run dev", use curl:
curl -X POST http://localhost:3000/api/retrieve-embeddings -H "Content-Type: application/json" -d "{\"query\": \"ESP32 temperature sensor\", \"botId\": \"01927fdc-0f78-499f-8178-1edea3de426c\"}"

Test with score threshold
curl -X POST http://localhost:3000/api/retrieve-embeddings -H "Content-Type: application/json" -d "{\"query\": \"ESP32 temperature sensor\", \"botId\": \"01927fdc-0f78-499f-8178-1edea3de426c\", \"topK\": 10, \"scoreThreshold\": 0.6}"

Task3.2: Save and Fetch Metadata in Supabase
Task3.3: End-to-End testing
Task3.4: Integrate into Bot creation flow

Test the PDF processing (will be integrated to create-bot flow)
curl -X POST http://localhost:3000/api/process-pdf \ -H "Content-Type: application/json" \ -d "{\"filePath\": \"dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757319433425.pdf\", \"botId\": \"01927fdc-0f78-499f-8178-1edea3de426c\"}"

Test outcome:The bot creation process works fine until the PDF processing step. The curl test shows that your PDF processing API is working correctly. The issue is in the frontend automatic processing. 

With updated api/process-pdf route, api/retrieve-embeddings route, create-bot/page.tsx, we hope to combine all tasks 3.2/3.3/3.4. 
Resolved end-to-end flow issues after debugging create-bot/page.tsx, supabase-storage.ts, and /api/process-pdf/route.ts. Automatic PDF processing now triggers upload, parsing, storing, and embedding. Verified with botId 8e6e32d7-30c6-45ed-833c-f33314dcf909 and storage path dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757332035825.pdf."
The test is successful.
Output: 
Getting basic PDF info...
page.tsx:164 PDF basic info: {pageCount: 1, firstPageText: 'PDF content will be processed for AI embeddings in WP3', metadata: {…}}
page.tsx:173 Uploading to Supabase Storage...
page.tsx:176 Upload result: {success: true, data: {…}, publicUrl: 'https://lbezfsimdogrudqvkczx.supabase.co/storage/v…85-0972e1c9f4f6/Stem_project_01_1757332035825.pdf'}
page.tsx:187 Extracted storage path: dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757332035825.pdf
page.tsx:190 Saving to database...
page.tsx:200 Save result: {success: true, data: {…}}
page.tsx:238 Bot created successfully! Attempting to process PDF...
page.tsx:239 Bot ID: 8e6e32d7-30c6-45ed-833c-f33314dcf909 File path: dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757332035825.pdf
page.tsx:243 Starting automatic PDF processing...
page.tsx:107 Calling process-pdf API with: {botId: '8e6e32d7-30c6-45ed-833c-f33314dcf909', filePath: 'dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757332035825.pdf'}
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 2078ms
page.tsx:121 Process-pdf API response: {message: 'PDF processed and embeddings stored', details: {…}}
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 321ms

Supabase bot table:
{"idx":0,"id":"ea490dea-47df-42d2-97a7-3625087436a9","name":"Stem_project_01","file_name":"IOT Based Environment Monitoring System Using ESP32.pdf","file_url":"dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757334941152.pdf","user_id":"dd906b46-0f8e-4413-9e85-0972e1c9f4f6","created_at":"2025-09-08 12:35:42.400663+00","updated_at":"2025-09-08 12:35:42.400663+00","page_count":1,"file_size":null,"parsed_at":"2025-09-08 12:35:41.648+00","first_page_text":"PDF content will be processed for AI embeddings in WP3","pinecone_namespace":"bot-1757334941647","metadata":"{\"uploadDate\": \"2025-09-08T12:35:41.648Z\", \"originalFileName\": \"IOT Based Environment Monitoring System Using ESP32.pdf\"}"}

curl -X POST http://localhost:3000/api/process-pdf -H "Content-Type: application/json" -d "{\"filePath\": \"dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757334941152.pdf\", \"botId\": \"ea490dea-47df-42d2-97a7-3625087436a9\"}"
Outcome: {"message":"PDF processed and embeddings stored","details":{"chunks":5,"embeddingModel":"all-mpnet-base-v2","namespace":"bot-ea490dea-47df-42d2-97a7-3625087436a9","botId":"ea490dea-47df-42d2-97a7-3625087436a9"}}

WP3_summary
Work Package 3: AI Integration & Bot Creation
Achievements:
Set up a Pinecone index (stembot-vectors, dimension 768 for all-mpnet-base-v2) and installed dependencies (LangChain, pdfjs-dist, etc.).
Implemented embedding generation using HuggingFace’s all-mpnet-base-v2 model, processing PDFs into 5 chunks for botId: ea490dea-47df-42d2-97a7-3625087436a9.
Integrated Supabase for bot metadata storage, with pinecone_namespace correctly set to bot-ea490dea-47df-42d2-97a7-3625087436a9.
Developed retrieval logic in /api/retrieve-embeddings, successfully tested with a sample query.
Debugged and resolved namespace mismatches, ensuring scalability by switching to HuggingFace to avoid OpenAI limits.
Output: AI-powered bot creation with embeddings functional, tested locally and ready for Vercel deployment.
Reflection: Learned LangChain integration, vector similarity in Pinecone, and handled embedding errors. Notes updated for WP4.

After vercel deployment, test at the live endpoint.
curl -X POST https://stembot-mvp.vercel.app/api/process-pdf -H "Content-Type: application/json" -d "{\"filePath\": \"dd906b46-0f8e-4413-9e85-0972e1c9f4f6/Stem_project_01_1757334941152.pdf\", \"botId\": \"ea490dea-47df-42d2-97a7-3625087436a9\"}"
Outcome: Deployed to Vercel at https://stembot-mvp.vercel.app with successful live endpoint test on 2025-09-08, processing 17 chunks for botId ea490dea-47df-42d2-97a7-3625087436a9.

