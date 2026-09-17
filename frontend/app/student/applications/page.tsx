"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Undo2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ApplicationItem {
  id: string;
  type: "PLACEMENT" | "INTERNSHIP";
  targetId: string;
  companyName: string;
  role: string;
  compensation: string;
  location: string;
  durationMonths: number | null;
  hasPpoOpportunity: boolean;
  deadline: string | null;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  updatedAt: string;
  studentRemarks: string | null;
  interviews?: any[];
  selectionResult?: any;
}

const PIPELINE_STAGES = [
  { key: "APPLIED", label: "Applied" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "SELECTED", label: "Selected" },
];

function getStageIndex(status: string): number {
  switch (status) {
    case "APPLIED":
      return 0;
    case "UNDER_REVIEW":
      return 1;
    case "SHORTLISTED":
      return 2;
    case "INTERVIEW":
      return 3;
    case "SELECTED":
      return 4;
    default:
      return -1;
  }
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PLACEMENT" | "INTERNSHIP">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [withdrawingApp, setWithdrawingApp] = useState<ApplicationItem | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  async function loadApplications() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ applications: ApplicationItem[] }>("/applications/my-applications");
      setApplications(data.applications);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleConfirmWithdraw() {
    if (!withdrawingApp) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await apiClient.post(`/applications/${withdrawingApp.id}/withdraw`);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === withdrawingApp.id
            ? { ...a, status: "WITHDRAWN", studentRemarks: "Application voluntarily withdrawn by candidate" }
            : a
        )
      );
      setWithdrawingApp(null);
    } catch (err: any) {
      setWithdrawError(err?.message || "Failed to withdraw application.");
    } finally {
      setIsWithdrawing(false);
    }
  }

  const filteredApps = applications.filter((app) => {
    const matchesType = activeTab === "ALL" || app.type === activeTab;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !["SELECTED", "REJECTED", "WITHDRAWN"].includes(app.status)) ||
      app.status === statusFilter;
    return matchesType && matchesStatus;
  });

  // Metrics summary
  const totalApplied = applications.length;
  const inReviewCount = applications.filter((a) => a.status === "UNDER_REVIEW").length;
  const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW").length;
  const selectedCount = applications.filter((a) => a.status === "SELECTED").length;

  return (
    <div className="space-y-3.5">
      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Applied</div>
          <div className="text-xl font-black text-foreground mt-0.5">{totalApplied}</div>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">In Review</div>
          <div className="text-xl font-black text-amber-600 mt-0.5">{inReviewCount}</div>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">Shortlisted</div>
          <div className="text-xl font-black text-primary mt-0.5">{shortlistedCount}</div>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Offers / Selected</div>
          <div className="text-xl font-black text-emerald-600 mt-0.5">{selectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        {/* Type Toggle Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            All Opportunities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PLACEMENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "PLACEMENT"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Placement Drives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("INTERNSHIP")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "INTERNSHIP"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Internships
          </button>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {["ALL", "ACTIVE", "SHORTLISTED", "SELECTED", "REJECTED", "WITHDRAWN"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Pipeline Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading your recruitment records...</div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => {
            const stageIdx = getStageIndex(app.status);
            const isTerminalNegative = app.status === "REJECTED" || app.status === "WITHDRAWN";
            const canWithdraw = app.status === "APPLIED" || app.status === "UNDER_REVIEW";

            return (
              <Card key={app.id} className="border border-slate-200 shadow-xs hover:shadow-sm transition-all">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          app.type === "PLACEMENT"
                            ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                            : "bg-violet-50 border-violet-100 text-violet-600"
                        }`}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base font-bold text-slate-900">
                            {app.companyName}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              app.type === "PLACEMENT"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-violet-50 text-violet-700 border-violet-200"
                            }`}
                          >
                            {app.type}
                          </Badge>
                          {app.hasPpoOpportunity && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5 text-amber-600" /> PPO Potential
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{app.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{app.compensation}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {app.location}
                        </div>
                      </div>

                      {/* Top Status Pill */}
                      {app.status === "SELECTED" ? (
                        <Badge variant="default" className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold">
                          Selected
                        </Badge>
                      ) : app.status === "REJECTED" ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : app.status === "WITHDRAWN" ? (
                        <Badge variant="secondary" className="text-slate-500 bg-slate-100">Withdrawn</Badge>
                      ) : (
                        <Badge variant="info">{app.status.replace("_", " ")}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  {/* Multi-Stage Visual Pipeline Stepper */}
                  {!isTerminalNegative ? (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Recruitment Pipeline
                      </div>
                      <div className="relative flex items-center justify-between">
                        {/* Connecting track line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full z-0" />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-500 z-0"
                          style={{
                            width: `${(stageIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                          }}
                        />

                        {PIPELINE_STAGES.map((stage, idx) => {
                          const isPassed = idx < stageIdx;
                          const isCurrent = idx === stageIdx;
                          return (
                            <div key={stage.key} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isPassed
                                    ? "bg-brand-600 text-white"
                                    : isCurrent
                                    ? "bg-white border-2 border-brand-600 text-brand-700 shadow-md ring-4 ring-brand-100"
                                    : "bg-white border border-slate-200 text-slate-400"
                                }`}
                              >
                                {isPassed ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                                  isCurrent
                                    ? "text-brand-700 font-bold"
                                    : isPassed
                                    ? "text-slate-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Terminal Banner for Rejected / Withdrawn */
                    <div
                      className={`p-3 rounded-lg flex items-center gap-3 ${
                        app.status === "REJECTED"
                          ? "bg-red-50 border border-red-200 text-red-800"
                          : "bg-slate-100 border border-slate-200 text-slate-700"
                      }`}
                    >
                      {app.status === "REJECTED" ? (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      ) : (
                        <Undo2 className="h-4 w-4 text-slate-500 shrink-0" />
                      )}
                      <div className="text-xs">
                        {app.status === "REJECTED" ? (
                          <span>
                            <strong>Application Closed:</strong> The recruitment team has not moved forward with your candidacy for this role.
                          </span>
                        ) : (
                          <span>
                            <strong>Withdrawn:</strong> You voluntarily withdrew this application.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback / Instructions Note from TPO */}
                  {app.studentRemarks && (
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900 leading-relaxed">
                        <strong className="font-semibold">Recruitment Update: </strong>
                        {app.studentRemarks}
                      </div>
                    </div>
                  )}

                  {/* Card Footer Info & Withdrawal Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>
                        Applied on:{" "}
                        <strong className="text-slate-700">
                          {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawingApp(app);
                          setWithdrawError(null);
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Withdraw Application
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-base font-bold text-slate-900">No applications found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t submitted any applications matching this filter. Explore visiting companies and apply with one click.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link href="/student/placement-drives">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs font-semibold">
                  Browse Placement Drives
                </Button>
              </Link>
              <Link href="/student/internships">
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  Browse Internships
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={!!withdrawingApp} onOpenChange={() => !isWithdrawing && setWithdrawingApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Undo2 className="h-5 w-5" />
              Withdraw Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application?
            </DialogDescription>
          </DialogHeader>

          {withdrawingApp && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                You are withdrawing your candidacy for{" "}
                <strong className="text-slate-900">{withdrawingApp.role}</strong> at{" "}
                <strong className="text-slate-900">{withdrawingApp.companyName}</strong>.
              </div>

              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Notice: Once withdrawn, you may not be able to reapply if the opportunity deadline expires.
              </div>

              {withdrawError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {withdrawError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawingApp(null)}
                  disabled={isWithdrawing}
                >
                  Keep Application
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirmWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
