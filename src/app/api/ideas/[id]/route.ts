import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/ideas/[id] - Get a single idea
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Check if current user has voted
    const session = await getServerSession(authOptions);
    let hasVoted = false;

    if (session?.user?.id) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_ideaId: {
            userId: session.user.id,
            ideaId: id,
          },
        },
      });
      hasVoted = !!vote;
    }

    return NextResponse.json({ idea, hasVoted });
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 });
  }
}

// PATCH /api/ideas/[id] - Update an idea
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existingIdea = await prisma.idea.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (existingIdea.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const idea = await prisma.idea.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error updating idea:", error);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

// DELETE /api/ideas/[id] - Delete an idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingIdea = await prisma.idea.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (existingIdea.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.idea.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
