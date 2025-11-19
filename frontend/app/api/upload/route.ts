import { NextRequest, NextResponse } from "next/server";

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pdf = formData.get("pdf") as File | null;
    
    if (!pdf) {
      return NextResponse.json(
        { success: false, error: "No PDF uploaded" },
        { status: 400 }
      );
    }

    const forwardForm = new FormData();
    forwardForm.append("file", pdf, pdf.name);

    // Call FastAPI
    const res = await fetch(`${PDF_SERVICE_URL}/parse-pdf`, {
      method: "POST",
      body: forwardForm,
    });

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
