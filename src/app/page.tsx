"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { IdeaCard } from "@/components/ideas/idea-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Clock } from "lucide-react";
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

export default function HomePage() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("votes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const firstName = session?.user?.name?.split(" ")[0] || "";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchIdeas = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("sort", sortBy);
      if (debouncedSearch) params.set("search", debouncedSearch);

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

  // Fetch on filter/sort/search changes
  useEffect(() => {
    setLoading(true);
    fetchIdeas();
  }, [typeFilter, sortBy, debouncedSearch]);

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

  return (
    <div className="w-full px-4 py-12 max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12 flex flex-col items-center text-center">
        {session ? (
          <div className="w-full rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 py-16 px-10 flex flex-col items-center">
            <h1 className="text-3xl font-semibold tracking-tight mb-8">
              What should we build next, {firstName}?
            </h1>
            <Button asChild size="lg" className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              <Link href="/submit">Submit your idea</Link>
            </Button>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 p-10 flex flex-col items-center">
            <h1 className="text-4xl font-semibold tracking-tight mb-4">
              Welcome to Eureka
            </h1>
            <p className="text-muted-foreground">
              Sign in to submit and vote on ideas
            </p>
          </div>
        )}
      </div>

      {/* Ideas Section */}
      <>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-medium text-muted-foreground">Or see what the team is dreaming up</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Tabs value={typeFilter} onValueChange={setTypeFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="feature">Features</TabsTrigger>
                <TabsTrigger value="product">Products</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={sortBy} onValueChange={setSortBy}>
              <TabsList>
                <TabsTrigger value="votes" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Top
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-1">
                  <Clock className="h-3 w-3" />
                  New
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Ideas List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : ideas.length > 0 ? (
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                hasVoted={userVotes.includes(idea.id)}
                onVote={session ? handleVote : undefined}
                isVoting={votingId === idea.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No ideas found</p>
          </div>
        )}
      </>
    </div>
  );
}
