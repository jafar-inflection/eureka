"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { IdeaCard } from "@/components/ideas/idea-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Plus } from "lucide-react";
import Link from "next/link";

interface Idea {
  id: string;
  title: string;
  description: string;
  type: "FEATURE" | "PRODUCT";
  status: string;
  voteCount: number;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
  _count?: {
    comments: number;
  };
}

export default function MyIdeasPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyIdeas();
    }
  }, [session?.user?.id, statusFilter]);

  const fetchMyIdeas = async () => {
    try {
      const params = new URLSearchParams();
      params.set("authorId", session!.user.id);
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      } else {
        // Include drafts for own ideas
        params.set("status", "all");
      }

      const res = await fetch(`/api/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas || []);
      setUserVotes(data.userVotes || []);
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (ideaId: string) => {
    if (!session) return;

    setVotingId(ideaId);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
      const data = await res.json();

      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId
            ? { ...idea, voteCount: idea.voteCount + (data.voted ? 1 : -1) }
            : idea
        )
      );
      setUserVotes((prev) =>
        data.voted ? [...prev, ideaId] : prev.filter((id) => id !== ideaId)
      );
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVotingId(null);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="w-full px-4 py-8 max-w-3xl mx-auto">
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="w-full px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Ideas</h1>
          <p className="text-muted-foreground">Manage your submitted ideas</p>
        </div>
        <Button asChild>
          <Link href="/submit">
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Link>
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t submitted any ideas yet. Start sharing your brilliant thoughts!
          </p>
          <Button asChild>
            <Link href="/submit">Submit Your First Idea</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              hasVoted={userVotes.includes(idea.id)}
              onVote={handleVote}
              isVoting={votingId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
