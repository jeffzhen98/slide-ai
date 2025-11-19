import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  console.log("\n=== /api/narrate CALLED ===");

  try {
    const body = await req.json();
    console.log("Input body:", body);

    if (!body || !body.text) {
      console.log("Missing text in request");
      return NextResponse.json({ success: false, error: "No text provided" });
    }

    console.log("Calling Claude…");

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Explain this slide in 3–5 sentences:\n\n${body.text}`
        }
      ]
    });

    console.log("Claude raw output:", JSON.stringify(msg, null, 2));

    // Try to extract first text block
    let narration = "";
    if (msg?.content?.length > 0) {
      const block = msg.content.find((b: any) => b.type === "text");
      if (block && block.type === "text" && "text" in block) narration = block.text;
    }

    console.log("Final narration:", narration);

    return NextResponse.json({
      success: true,
      narration,
      debug: {
        raw: msg,
      }
    });
  } catch (err: any) {
    console.log("ERROR in /api/narrate:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Server error"
    });
  }
}
