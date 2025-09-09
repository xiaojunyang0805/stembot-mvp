// ./app/api/tutoring/route.ts
import { NextRequest, NextResponse } from "next/server";
import initializeTutoringChain from "@/lib/tutoringChain";

export async function POST(req: NextRequest) {
  try {
    const { input, userId } = await req.json();
    
    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    const { chain } = await initializeTutoringChain();
    
    const response = await chain.call({
      input,
    });

    return NextResponse.json({ 
      response: response.response,
      userId 
    });
  } catch (error) {
    console.error("Tutoring API error:", error);
    
    // Properly handle the unknown error type
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}