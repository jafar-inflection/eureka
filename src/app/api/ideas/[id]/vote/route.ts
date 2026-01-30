import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/ideas/[id]/vote - Toggle vote on an idea
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ideaId } = await params;
    const userId = session.user.id;

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId,
        },
      },
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.vote.delete({
          where: { id: existingVote.id },
        }),
        prisma.idea.update({
          where: { id: ideaId },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ voted: false, message: "Vote removed" });
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.vote.create({
          data: {
            userId,
            ideaId,
          },
        }),
        prisma.idea.update({
          where: { id: ideaId },
          data: { voteCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ voted: true, message: "Vote added" });
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json({ error: "Failed to toggle vote" }, { status: 500 });
  }
}
