"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Rocket, ArrowLeft, Loader2, Send, Sparkles, Check, SkipForward } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Step = "initial" | "workshop" | "review";

export default function SubmitProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("initial");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initial idea
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  // AI Workshop
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [aiDevelopment, setAiDevelopment] = useState("");

  // Refs for auto-scroll and auto-focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus textarea after loading completes
  useEffect(() => {
    if (!loading && step === "workshop") {
      textareaRef.current?.focus();
    }
  }, [loading, step]);

  if (status === "loading") {
    return (
      <div className="w-full px-4 py-16 max-w-2xl mx-auto">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  const startWorkshop = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/develop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          initialIdea: formData,
        }),
      });

      if (!res.ok) throw new Error("Failed to start workshop");

      const data = await res.json();
      setMessages([
        {
          role: "user",
          content: `**${formData.title}**\n\n${formData.description}`,
        },
        {
          role: "assistant",
          content: data.message,
        },
      ]);
      setStep("workshop");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const skipWorkshop = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setAiDevelopment("");
    setStep("review");
  };

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/develop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to get AI response");

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const finalizeIdea = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages,
          idea: formData 
        }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");

      const data = await res.json();
      setAiDevelopment(data.summary);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const submitIdea = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: "PRODUCT",
          aiDevelopment: aiDevelopment || null,
          status: "SUBMITTED",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit idea");
      }

      const idea = await res.json();
      router.push(`/ideas/${idea.id}?submitted=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Step 1: Initial Idea
  if (step === "initial") {
    return (
      <div className="w-full px-4 py-16 max-w-2xl mx-auto">
        <Link
          href="/submit"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to idea types
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Submit Product Idea</CardTitle>
                <CardDescription>
                  Start with your initial concept, then optionally refine it with AI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startWorkshop();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Working Title</Label>
                <Input
                  id="title"
                  placeholder="Give your product idea a name"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Initial Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product idea. Don't worry about making it perfect - you can refine it with AI!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={6}
                  maxLength={2000}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={skipWorkshop} disabled={loading}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip & Submit
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start AI Workshop
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: AI Workshop
  if (step === "workshop") {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b bg-background px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Development Workshop
              </h1>
              <p className="text-muted-foreground">Refining: {formData.title}</p>
            </div>
          <Button onClick={finalizeIdea} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finalize & Review
              </>
            )}
          </Button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-purple-100 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-muted"
                      : "bg-purple-50 border border-purple-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-purple-100 flex-shrink-0">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-3 bg-purple-50 border border-purple-100">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t bg-background px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Textarea
                ref={textareaRef}
                placeholder="Type your response... (Shift+Enter for new line)"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 min-h-[80px] resize-none"
                rows={3}
              />
              <Button type="submit" disabled={loading || !userInput.trim()} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Review & Submit
  return (
    <div className="w-full px-4 py-16 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => setStep(aiDevelopment ? "workshop" : "initial")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {aiDevelopment ? "Back to workshop" : "Back to edit"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Review Your Product Idea</CardTitle>
          <CardDescription>
            Review your idea before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground">Title</Label>
            <p className="text-lg font-medium">{formData.title}</p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Description</Label>
            <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
          </div>

          {aiDevelopment && (
            <div className="border-t pt-6">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI-Refined Summary
              </Label>
              <div className="mt-2 p-4 rounded-lg bg-purple-50 border border-purple-100">
                <div className="whitespace-pre-wrap text-sm">{aiDevelopment}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(aiDevelopment ? "workshop" : "initial")} 
              disabled={submitting}
            >
              {aiDevelopment ? "Continue Workshop" : "Edit Idea"}
            </Button>
            <Button onClick={submitIdea} disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Product Idea"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
