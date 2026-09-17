"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowRight, Lock, Mail, Sparkles, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { dashboardUrl } = await login(email, password);
      const targetUrl = callbackUrl && !callbackUrl.includes("/login") ? callbackUrl : dashboardUrl;
      router.push(targetUrl);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillStudentDemo = () => {
    setEmail("student@college.edu");
    setPassword("Student@12345");
    setError("");
  };

  const fillTpoDemo = () => {
    setEmail("tpo@college.edu");
    setPassword("Tpo@12345");
    setError("");
  };

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">Sign In</CardTitle>
        <CardDescription>Enter your college email credentials</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">College Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 bg-background border-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 h-10 bg-background border-input"
              />
            </div>
          </div>

          {/* 1-Click Demo Fill Options */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Quick 1-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillStudentDemo}
                className="h-8 text-xs font-medium"
              >
                <User className="h-3.5 w-3.5 mr-1 text-primary" />
                Student Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillTpoDemo}
                className="h-8 text-xs font-medium"
              >
                <Shield className="h-3.5 w-3.5 mr-1 text-primary" />
                TPO Demo
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" disabled={isLoading} className="w-full h-10 font-semibold">
            {isLoading ? "Signing in..." : "Continue to Dashboard"}
            {!isLoading && <ArrowRight className="h-4 w-4 ml-1.5" />}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register as Student
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 py-12 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 mb-1">
            <GraduationCap className="h-6 w-6" />
          </div>
          <TypographyH2 className="border-none pb-0 text-foreground">PlacementOS</TypographyH2>
          <TypographyMuted>Sign in to access your placement dashboard</TypographyMuted>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
