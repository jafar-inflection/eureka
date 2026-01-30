import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, idea } = body;

    // Build the conversation transcript
    const transcript = messages
      .map((msg: { role: string; content: string }) => 
        `${msg.role === "user" ? "User" : "AI Coach"}: ${msg.content}`
      )
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are a product development expert. Based on the conversation below between a user and an AI coach about a product idea, create a comprehensive summary of the refined product idea as a scalable product for a broad audience.

Structure your summary with these sections:
- **Problem Statement**: What widespread problem does this product solve? Who experiences this pain point?
- **Target Market**: Who are the target users/customers? What's the potential market size or reach?
- **Proposed Solution**: What is the product and how does it work at scale?
- **Key Features**: Main features or capabilities (bullet points)
- **Differentiation**: What makes this different from existing alternatives?
- **Success Metrics**: How will success be measured? What KPIs matter?
- **Risks & Challenges**: Key risks, challenges, or open questions to address

Focus on the broader market opportunity, not just individual use cases. Be concise but thorough.`,
      messages: [
        {
          role: "user",
          content: `Original Idea Title: ${idea.title}

Original Description: ${idea.description}

Development Conversation:
${transcript}

Please create a structured summary of this refined product idea.`,
        },
      ],
    });

    const summary =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
