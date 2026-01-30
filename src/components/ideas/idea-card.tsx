"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeaCardProps {
  idea: {
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
  };
  hasVoted?: boolean;
  onVote?: (ideaId: string) => void;
  isVoting?: boolean;
}

export function IdeaCard({ idea, hasVoted = false, onVote, isVoting }: IdeaCardProps) {
  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVote?.(idea.id);
  };

  return (
    <Link href={`/ideas/${idea.id}`} className="block cursor-default">
      <Card className="transition-all hover:shadow-lg hover:border-primary/30 hover:bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={idea.type === "PRODUCT" ? "default" : "secondary"}>
                {idea.type === "PRODUCT" ? "Product" : "Feature"}
              </Badge>
            </div>
              <h3 className="font-semibold text-lg line-clamp-2">
                {idea.title}
              </h3>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Button
                variant={hasVoted ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-auto flex-col gap-0 px-3 py-2",
                  hasVoted && "bg-primary text-primary-foreground"
                )}
                onClick={handleVoteClick}
                disabled={isVoting}
              >
                <ChevronUp className={cn("h-5 w-5", hasVoted && "fill-current")} />
                <span className="text-sm font-bold">{idea.voteCount}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-muted-foreground text-sm line-clamp-3">{idea.description}</p>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={idea.author.image || ""} />
                <AvatarFallback className="text-xs">
                  {idea.author.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{idea.author.name}</span>
              <span className="text-xs text-muted-foreground">
                · {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
              </span>
            </div>

            {idea._count && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {idea._count.comments}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
