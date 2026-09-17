"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RootHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "TPO") {
        router.push("/tpo/dashboard");
      } else if (user.role === "STUDENT") {
        router.push("/student/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleQuickTpoLogin = async () => {
    try {
      await login("tpo@college.edu", "Tpo@12345");
      router.push("/tpo/dashboard");
    } catch {
      router.push("/tpo/dashboard");
    }
  };

  const handleQuickStudentLogin = async () => {
    try {
      await login("student@college.edu", "Student@12345");
      router.push("/student/dashboard");
    } catch {
      router.push("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                PlacementOS
              </span>
              <span className="text-[10px] text-primary font-semibold tracking-wider uppercase ml-2">
                Zenith Institute
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/tpo/dashboard">
                TPO Dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Generation Campus Recruitment Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Institutional Placement & Career Operating System
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            Comprehensive recruitment funnel monitoring, corporate campus drives, automated eligibility filtering, and candidate lifecycle management.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* TPO Command Center Card */}
          <Card className="border-border shadow-md hover:shadow-xl transition-all duration-200 bg-card text-card-foreground rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <CardHeader className="p-7">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <Badge className="w-fit mb-2">
                Institutional Administration
              </Badge>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                TPO Command Center
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Full-featured training and placement officer desk with real-time funnel intelligence, 8-module sidebar, drive scheduling, and candidate review pipelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 pt-0 space-y-3">
              <Button asChild className="w-full h-11 text-sm font-semibold rounded-xl shadow-md shadow-primary/20">
                <Link href="/tpo/dashboard">
                  Open TPO Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickTpoLogin}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-9"
              >
                1-Click Demo Login as TPO (Amit Sharma)
              </Button>
            </CardContent>
          </Card>

          {/* Student Portal Card */}
          <Card className="border-border shadow-md hover:shadow-xl transition-all duration-200 bg-card text-card-foreground rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
            <CardHeader className="p-7">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <GraduationCap className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="w-fit mb-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                Candidate Career Desk
              </Badge>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Student Portal
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Browse eligible placement drives, track multi-round application progress, view scheduled interviews, and manage verified resume credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 pt-0 space-y-3">
              <Button asChild variant="outline" className="w-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-11 text-sm font-semibold rounded-xl">
                <Link href="/student/dashboard">
                  Open Student Portal <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickStudentLogin}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-9"
              >
                1-Click Demo Login as Student (Aarav Sharma)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features highlight footer */}
        <div className="mt-16 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-extrabold text-foreground">1,248+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Registered Students</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-primary">14 Drives</div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Campus Recruitment</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">89.4%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Placement Velocity</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-primary">6 Stages</div>
            <div className="text-xs text-muted-foreground mt-0.5">Placement Funnel Tracking</div>
          </div>
        </div>
      </main>
    </div>
  );
}
