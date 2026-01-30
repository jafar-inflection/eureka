import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/comments/[id]/reactions - Toggle a reaction on a comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if user already has this reaction
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId_emoji: {
          userId,
          commentId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ added: false, emoji });
    } else {
      // Add reaction
      await prisma.commentReaction.create({
        data: {
          emoji,
          userId,
          commentId,
        },
      });
      return NextResponse.json({ added: true, emoji });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
