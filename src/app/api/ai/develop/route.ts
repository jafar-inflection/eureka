import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert product development coach helping employees develop product ideas that could benefit a wide audience. Your role is to help think through this idea as a scalable product for many users, not just the person submitting it.

When asking questions, focus on:
1. The broader market opportunity - who are the target users/customers at scale?
2. The problem being solved - is this a widespread pain point that many people face?
3. Market validation - how do we know others have this problem too?
4. Competitive landscape - what alternatives exist? What makes this different?
5. Business viability - how could this generate value for the company?
6. Scalability - how would this work for thousands or millions of users?

Important guidelines:
- Think of this as a product that would be built for external customers or a wide internal audience
- Avoid questions that assume the submitter is the only user (e.g., don't ask "what would YOU like it to do")
- Instead ask about target user segments, market size, user research, and broad use cases
- Help identify if this solves a real problem that many people have
- Be encouraging but also help stress-test the idea's broader appeal

Keep responses concise. Ask one or two questions at a time to keep the conversation focused.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, initialIdea } = body;

    // Build conversation history for Claude
    const conversationMessages: Anthropic.MessageParam[] = [];

    // Add initial context if this is the start
    if (messages.length === 0 && initialIdea) {
      conversationMessages.push({
        role: "user",
        content: `I have a product idea I'd like to develop. Here's my initial concept:\n\nTitle: ${initialIdea.title}\n\nDescription: ${initialIdea.description}\n\nPlease help me refine this idea by asking clarifying questions.`,
      });
    } else {
      // Add existing conversation
      for (const msg of messages) {
        conversationMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Check if we should offer to finalize
    const shouldFinalize =
      messages.length >= 4 ||
      assistantMessage.toLowerCase().includes("problem statement") ||
      assistantMessage.toLowerCase().includes("summary");

    return NextResponse.json({
      message: assistantMessage,
      shouldFinalize,
    });
  } catch (error) {
    console.error("Error in AI development:", error);
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 });
  }
}
