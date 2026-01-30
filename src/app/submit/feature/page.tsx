"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const PRODUCTS = [
  { value: "pi", label: "Pi" },
  { value: "eq-dashboard", label: "EQ Dashboard" },
  { value: "safety-center", label: "Safety Center" },
  { value: "developer-central", label: "Inflection Developer Central" },
];

export default function SubmitFeaturePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product: "pi",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.product) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          product: formData.product,
          type: "FEATURE",
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
      setLoading(false);
    }
  };

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
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Submit Feature Idea</CardTitle>
              <CardDescription>
                Suggest an improvement for an existing product
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.product}
                onValueChange={(value) => setFormData({ ...formData, product: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.value} value={product.value}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="A clear, concise title for your idea"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.title.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your feature idea in detail. What problem does it solve? How would it work?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/2000
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href="/submit">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feature Idea"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
