"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Rocket } from "lucide-react";

export default function SubmitPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-full px-4 py-16 max-w-2xl mx-auto">
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="w-full px-4 py-16 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Submit Your Idea</h1>
        <p className="text-muted-foreground">
          Choose the type of idea you want to submit
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link href="/submit/feature" className="block">
          <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-2 mx-auto">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Feature Idea</CardTitle>
              <CardDescription>
                Suggest an improvement or new feature for an existing product
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/submit/product" className="block">
          <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">
              AI-Assisted
            </div>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-2 mx-auto">
                <Rocket className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Product Idea</CardTitle>
              <CardDescription>
                Propose a new product or major initiative with AI-assisted development
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
