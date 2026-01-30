"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Lightbulb, ThumbsUp, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalIdeas: number;
  totalVotes: number;
  totalComments: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="w-full px-4 py-8 max-w-2xl mx-auto">
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="w-full px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user?.image || ""} />
              <AvatarFallback className="text-2xl">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{session.user?.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Mail className="h-4 w-4" />
                {session.user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-6" />

          {/* Stats Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Your Contributions</h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-3 gap-4">
                <Link href="/my-ideas" className="block">
                  <div className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors">
                    <Lightbulb className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{stats.totalIdeas}</p>
                    <p className="text-xs text-muted-foreground">Ideas</p>
                  </div>
                </Link>
                <div className="rounded-lg border p-4 text-center">
                  <ThumbsUp className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{stats.totalVotes}</p>
                  <p className="text-xs text-muted-foreground">Votes Received</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <MessageCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{stats.totalComments}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            ) : null}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
