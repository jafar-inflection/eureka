import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total ideas submitted by user
    const totalIdeas = await prisma.idea.count({
      where: { authorId: userId },
    });

    // Get total votes received on user's ideas
    const totalVotes = await prisma.vote.count({
      where: {
        idea: {
          authorId: userId,
        },
      },
    });

    // Get total comments received on user's ideas
    const totalComments = await prisma.comment.count({
      where: {
        idea: {
          authorId: userId,
        },
      },
    });

    return NextResponse.json({
      totalIdeas,
      totalVotes,
      totalComments,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
