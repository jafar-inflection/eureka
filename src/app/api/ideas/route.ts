import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/ideas - Get all ideas with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "votes"; // votes, recent
    const search = searchParams.get("search");
    const authorId = searchParams.get("authorId");

    const where: Record<string, unknown> = {};

    if (type && type !== "all") {
      where.type = type.toUpperCase();
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    } else {
      // By default, only show submitted ideas (not drafts)
      where.status = { not: "DRAFT" };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "recent" ? { createdAt: "desc" as const } : { voteCount: "desc" as const };

    const ideas = await prisma.idea.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Get user's votes if authenticated
    const session = await getServerSession(authOptions);
    let userVotes: string[] = [];

    if (session?.user?.id) {
      const votes = await prisma.vote.findMany({
        where: {
          userId: session.user.id,
          ideaId: { in: ideas.map((i) => i.id) },
        },
        select: { ideaId: true },
      });
      userVotes = votes.map((v) => v.ideaId);
    }

    return NextResponse.json({ ideas, userVotes });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

// POST /api/ideas - Create a new idea
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, product, aiDevelopment, status = "SUBMITTED" } = body;

    if (!title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        type: type.toUpperCase(),
        product,
        aiDevelopment,
        status,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
