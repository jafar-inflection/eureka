"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronUp,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle,
  Pencil,
  Trash2,
  Smile,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  reactions: Reaction[];
}

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🚀", "👀"];

interface Idea {
  id: string;
  title: string;
  description: string;
  type: "FEATURE" | "PRODUCT";
  status: string;
  aiDevelopment: string | null;
  voteCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  comments: Comment[];
  _count: {
    votes: number;
    comments: number;
  };
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const justSubmitted = searchParams.get("submitted") === "true";

  const [idea, setIdea] = useState<Idea | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(justSubmitted);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = session?.user?.id === idea?.author.id;

  useEffect(() => {
    fetchIdea();
    if (justSubmitted) {
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [id, justSubmitted]);

  const fetchIdea = async () => {
    try {
      const res = await fetch(`/api/ideas/${id}`);
      if (!res.ok) throw new Error("Failed to fetch idea");
      const data = await res.json();
      setIdea(data.idea);
      setHasVoted(data.hasVoted);
      setEditForm({ title: data.idea.title, description: data.idea.description });
    } catch (error) {
      console.error("Failed to fetch idea:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!session || voting) return;

    setVoting(true);
    try {
      const res = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
      const data = await res.json();

      setIdea((prev) =>
        prev
          ? { ...prev, voteCount: prev.voteCount + (data.voted ? 1 : -1) }
          : null
      );
      setHasVoted(data.voted);
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const comment = await res.json();
      setIdea((prev) =>
        prev ? { ...prev, comments: [comment, ...prev.comments] } : null
      );
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!session) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (!res.ok) throw new Error("Failed to toggle reaction");

      const data = await res.json();
      
      // Update local state
      setIdea((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: prev.comments.map((comment) => {
            if (comment.id !== commentId) return comment;
            
            if (data.added) {
              // Add reaction
              return {
                ...comment,
                reactions: [
                  ...comment.reactions,
                  { id: Date.now().toString(), emoji, userId: session.user.id, user: { id: session.user.id, name: session.user.name || null } },
                ],
              };
            } else {
              // Remove reaction
              return {
                ...comment,
                reactions: comment.reactions.filter(
                  (r) => !(r.emoji === emoji && r.userId === session.user.id)
                ),
              };
            }
          }),
        };
      });
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update idea");

      const updated = await res.json();
      setIdea((prev) => prev ? { ...prev, ...updated } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update idea:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed to delete idea");

      router.push("/");
    } catch (error) {
      console.error("Failed to delete idea:", error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-8 max-w-3xl mx-auto">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="w-full px-4 py-16 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Idea not found</h1>
        <p className="text-muted-foreground mb-4">
          This idea may have been deleted or doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all ideas
      </Link>

      {showSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Idea submitted successfully!</p>
            <p className="text-sm text-green-700">
              Your idea is now visible to the team for voting and feedback.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={idea.type === "PRODUCT" ? "default" : "secondary"}>
                  {idea.type === "PRODUCT" ? "Product" : "Feature"}
                </Badge>
              </div>
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Idea title"
                />
              ) : (
                <h1 className="text-2xl font-bold">{idea.title}</h1>
              )}
            </div>

            <Button
              variant={hasVoted ? "default" : "outline"}
              size="lg"
              className={cn(
                "h-auto flex-col gap-0 px-4 py-3",
                hasVoted && "bg-primary text-primary-foreground"
              )}
              onClick={handleVote}
              disabled={voting || !session}
            >
              <ChevronUp className={cn("h-6 w-6", hasVoted && "fill-current")} />
              <span className="text-lg font-bold">{idea.voteCount}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={idea.author.image || ""} />
                <AvatarFallback>
                  {idea.author.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="font-medium">{idea.author.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {isAuthor && !isEditing && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={6}
                placeholder="Describe your idea..."
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditForm({ title: idea.title, description: idea.description });
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}

          {idea.aiDevelopment && !isEditing && (
            <div className="border-t pt-6">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI-Developed Summary
              </h2>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <div className="whitespace-pre-wrap text-sm">{idea.aiDevelopment}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="mt-8" id="comments">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({idea.comments.length})
        </h2>

        {session && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <form onSubmit={handleComment} className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts on this idea..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submittingComment}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {idea.comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {idea.comments.map((comment) => {
              // Group reactions by emoji
              const reactionCounts = comment.reactions.reduce((acc, r) => {
                acc[r.emoji] = acc[r.emoji] || { count: 0, users: [], hasUserReacted: false };
                acc[r.emoji].count++;
                acc[r.emoji].users.push(r.user.name || "Someone");
                if (r.userId === session?.user?.id) {
                  acc[r.emoji].hasUserReacted = true;
                }
                return acc;
              }, {} as Record<string, { count: number; users: string[]; hasUserReacted: boolean }>);

              return (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.image || ""} />
                        <AvatarFallback>
                          {comment.user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                        
                        {/* Reactions */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Existing reactions */}
                          {Object.entries(reactionCounts).map(([emoji, data]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(comment.id, emoji)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                                data.hasUserReacted
                                  ? "bg-primary/10 border border-primary/30"
                                  : "bg-muted hover:bg-muted/80 border border-transparent"
                              )}
                              title={data.users.join(", ")}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{data.count}</span>
                            </button>
                          ))}
                          
                          {/* Add reaction button */}
                          {session && (
                            <div className="relative group">
                              <button className="p-1 rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors">
                                <Smile className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full left-0 hidden group-hover:block z-10 pb-1">
                                <div className="flex bg-background border rounded-lg shadow-lg p-1 gap-1">
                                  {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(comment.id, emoji)}
                                      className="p-1 hover:bg-muted rounded transition-colors text-base"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Idea</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this idea? This action cannot be undone.
              All votes and comments will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
