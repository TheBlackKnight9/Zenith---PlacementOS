"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck2,
  Building2,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  MessageSquare,
  ExternalLink,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Filter,
  Check,
  X,
  Target,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SelectionStep {
  step: number;
  name: string;
  description?: string;
}

interface TpoApplication {
  id: string;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED" | "WITHDRAWN";
  currentStep: number;
  stepStatus: "IN_PROGRESS" | "CLEARED" | "ELIMINATED";
  selectionProcess: SelectionStep[];
  internalRemarks: string | null;
  studentRemarks: string | null;
  appliedAt: string;
  updatedAt: string;
  targetType: "PLACEMENT" | "INTERNSHIP";
  opportunity: {
    id: string;
    companyName: string;
    title: string;
    packageCtc?: number;
    stipend?: number;
  };
  student: {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    batchYear: number;
    cgpa: number;
    activeBacklogs: number;
    placementStatus: boolean;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    skills: string[];
  };
  interviews?: any[];
  selectionResult?: any;
}

export default function TpoApplicationsPage() {
  const {
    departmentCodes,
    selectedDepartmentCode,
    setSelectedDepartment,
    getDepartmentName,
  } = useDepartment();

  const [applications, setApplications] = useState<TpoApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [reviewingApp, setReviewingApp] = useState<TpoApplication | null>(null);

  // Sync with global department context
  useEffect(() => {
    setSelectedDept(selectedDepartmentCode || "ALL");
  }, [selectedDepartmentCode]);

  // Modal editing state
  const [editStatus, setEditStatus] = useState<string>("APPLIED");
  const [editCurrentStep, setEditCurrentStep] = useState<number>(1);
  const [editStepStatus, setEditStepStatus] = useState<"IN_PROGRESS" | "CLEARED" | "ELIMINATED">("IN_PROGRESS");
  const [editInternalRemarks, setEditInternalRemarks] = useState<string>("");
  const [editStudentRemarks, setEditStudentRemarks] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function loadApplications() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedDept !== "ALL") params.append("department", selectedDept);
      if (search.trim()) params.append("search", search.trim());

      const data = await apiClient.get<{ applications: TpoApplication[]; total: number }>(
        `/applications/tpo?${params.toString()}`
      );
      setApplications(data.applications);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedStatus, selectedDept, search]);

  function handleOpenReview(app: TpoApplication) {
    setReviewingApp(app);
    setEditStatus(app.status);
    setEditCurrentStep(app.currentStep || 1);
    setEditStepStatus(app.stepStatus || "IN_PROGRESS");
    setEditInternalRemarks(app.internalRemarks || "");
    setEditStudentRemarks(app.studentRemarks || "");
    setUpdateError(null);
  }

  // Quick Action: Advance to Next Step
  const handleAdvanceNextStep = () => {
    if (!reviewingApp) return;
    const steps = reviewingApp.selectionProcess || [];
    const maxStep = steps.length || 4;
    const currentStepObj = steps.find((s) => s.step === editCurrentStep);

    if (editCurrentStep >= maxStep) {
      // Final step cleared -> Offer
      setEditStepStatus("CLEARED");
      setEditStatus("SELECTED");
      setEditInternalRemarks(`Candidate successfully cleared final stage: ${currentStepObj?.name || "Final Round"}. Offer extended!`);
      setEditStudentRemarks(`Congratulations! You have successfully cleared all selection rounds for ${reviewingApp.opportunity.title} at ${reviewingApp.opportunity.companyName}. An official offer has been extended.`);
    } else {
      const nextStepNum = editCurrentStep + 1;
      const nextStepObj = steps.find((s) => s.step === nextStepNum);
      setEditCurrentStep(nextStepNum);
      setEditStepStatus("IN_PROGRESS");
      setEditStatus("INTERVIEW");
      setEditInternalRemarks(`Cleared Step ${editCurrentStep} (${currentStepObj?.name || "Round"}). Advanced to Step ${nextStepNum}: ${nextStepObj?.name || "Next Round"}.`);
      setEditStudentRemarks(`Congratulations! You have cleared ${currentStepObj?.name || "the current round"} and advanced to Step ${nextStepNum}: ${nextStepObj?.name || "the next round"}.`);
    }
  };

  // Quick Action: Eliminate at Current Step
  const handleEliminateCurrentStep = () => {
    if (!reviewingApp) return;
    const steps = reviewingApp.selectionProcess || [];
    const currentStepObj = steps.find((s) => s.step === editCurrentStep);
    setEditStepStatus("ELIMINATED");
    setEditStatus("REJECTED");
    setEditInternalRemarks(`Eliminated at Step ${editCurrentStep}: ${currentStepObj?.name || "Round"}.`);
    setEditStudentRemarks(`Thank you for appearing for Step ${editCurrentStep}: ${currentStepObj?.name || "this round"} of the recruitment process for ${reviewingApp.opportunity.companyName}. Regrettably, your candidature has not been advanced.`);
  };

  // Quick Action: Final Selection
  const handleMarkSelected = () => {
    if (!reviewingApp) return;
    const steps = reviewingApp.selectionProcess || [];
    setEditCurrentStep(steps.length || editCurrentStep);
    setEditStepStatus("CLEARED");
    setEditStatus("SELECTED");
    setEditInternalRemarks(`Candidate cleared all recruitment stages. Offer extended for ${reviewingApp.opportunity.title}.`);
    setEditStudentRemarks(`Congratulations! You have been selected for the position of ${reviewingApp.opportunity.title} at ${reviewingApp.opportunity.companyName}!`);
  };

  async function handleSaveStatus() {
    if (!reviewingApp) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await apiClient.patch(`/applications/${reviewingApp.id}/status`, {
        status: editStatus,
        currentStep: editCurrentStep,
        stepStatus: editStepStatus,
        internalRemarks: editInternalRemarks,
        studentRemarks: editStudentRemarks,
      });

      setApplications((prev) =>
        prev.map((a) =>
          a.id === reviewingApp.id
            ? {
                ...a,
                status: editStatus as any,
                currentStep: editCurrentStep,
                stepStatus: editStepStatus,
                internalRemarks: editInternalRemarks || null,
                studentRemarks: editStudentRemarks || null,
              }
            : a
        )
      );
      setReviewingApp(null);
    } catch (err: any) {
      setUpdateError(err?.message || "Failed to update application status.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border shadow-xs">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by candidate name, roll no, email, or company name..."
          className="w-full md:w-96 text-xs"
        />

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Dept:</span>
            {["ALL", ...departmentCodes].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  setSelectedDept(dept);
                  setSelectedDepartment(getDepartmentName(dept));
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedDept === dept
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW">Interview / In Progress</option>
            <option value="SELECTED">Selected (Offer)</option>
            <option value="REJECTED">Rejected / Eliminated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications Table Card */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold text-foreground">
              Candidate Applications & Selection Pipeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Real-time synchronization with company selection process steps and evaluation outcomes.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            Showing {applications.length} of {total} Applications
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[1020px] w-full">
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="w-[200px] text-xs font-bold text-foreground px-4 py-3">Candidate Profile</TableHead>
                  <TableHead className="w-[150px] text-xs font-bold text-foreground px-4 py-3">Academics</TableHead>
                  <TableHead className="w-[200px] text-xs font-bold text-foreground px-4 py-3">Company & Opportunity</TableHead>
                  <TableHead className="w-[280px] text-xs font-bold text-foreground px-4 py-3">Selection Stage & Progress</TableHead>
                  <TableHead className="w-[120px] text-xs font-bold text-foreground px-4 py-3 text-center">Pipeline Status</TableHead>
                  <TableHead className="text-right text-xs font-bold text-foreground px-4 py-3">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                      Loading application dossiers...
                    </TableCell>
                  </TableRow>
                ) : applications.length > 0 ? (
                  applications.map((app) => {
                    const totalSteps = app.selectionProcess?.length || 4;
                    const curStepNum = app.currentStep || 1;
                    const curStepObj = app.selectionProcess?.find((s) => s.step === curStepNum);
                    const isEliminated = app.stepStatus === "ELIMINATED" || app.status === "REJECTED";
                    const isSelected = app.stepStatus === "CLEARED" || app.status === "SELECTED";

                    return (
                      <TableRow key={app.id} className="hover:bg-muted/40 transition-colors border-border">
                        {/* Candidate Column */}
                        <TableCell className="px-4 py-3.5">
                          <div className="font-bold text-foreground text-xs">{app.student.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{app.student.rollNumber}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[170px]">{app.student.email}</div>
                        </TableCell>

                        {/* Academics Column */}
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground">{app.student.department}</span>
                            <span className="text-[11px] text-muted-foreground">({app.student.batchYear})</span>
                          </div>
                          <div className="text-xs font-bold text-primary">
                            CGPA: {app.student.cgpa.toFixed(2)}
                          </div>
                          <div className="text-[11px]">
                            {app.student.activeBacklogs === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 Backlogs</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">{app.student.activeBacklogs} Backlogs</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Opportunity Column */}
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-foreground">{app.opportunity.companyName}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] py-0 px-1 font-semibold",
                                app.targetType === "PLACEMENT"
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              )}
                            >
                              {app.targetType}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">{app.opportunity.title}</div>
                          <div className="text-[11px] font-semibold text-foreground">
                            {app.targetType === "PLACEMENT"
                              ? `₹${app.opportunity.packageCtc} LPA CTC`
                              : `₹${Number(app.opportunity.stipend || 0).toLocaleString("en-IN")}/mo`}
                          </div>
                        </TableCell>

                        {/* Selection Stage & Progress Column */}
                        <TableCell className="px-4 py-3.5">
                          <div className="space-y-1.5 max-w-[260px]">
                            {isSelected ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                <Award className="h-4 w-4 shrink-0" />
                                <span>Offer Extended (All {totalSteps} Steps Cleared)</span>
                              </div>
                            ) : isEliminated ? (
                              <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                                <XCircle className="h-4 w-4 shrink-0" />
                                <span>Failed at Step {curStepNum}: {curStepObj?.name || "Round"}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary shrink-0">
                                  {curStepNum}
                                </span>
                                <span>Step {curStepNum}/{totalSteps}: <strong>{curStepObj?.name || "In Progress"}</strong></span>
                              </div>
                            )}

                            {/* Mini Segmented Progress Track */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalSteps }).map((_, idx) => {
                                const stepNum = idx + 1;
                                const isPassed = stepNum < curStepNum || (stepNum === curStepNum && isSelected);
                                const isCurrent = stepNum === curStepNum;

                                return (
                                  <div
                                    key={idx}
                                    title={app.selectionProcess?.[idx]?.name || `Step ${stepNum}`}
                                    className={cn(
                                      "h-1.5 flex-1 rounded-full transition-all",
                                      isSelected
                                        ? "bg-emerald-500"
                                        : isEliminated && isCurrent
                                        ? "bg-destructive"
                                        : isPassed
                                        ? "bg-emerald-500"
                                        : isCurrent
                                        ? "bg-primary animate-pulse"
                                        : "bg-muted"
                                    )}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>

                        {/* Pipeline Status */}
                        <TableCell className="px-4 py-3.5 text-center">
                          {app.status === "SELECTED" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]">
                              Selected
                            </Badge>
                          ) : app.status === "SHORTLISTED" ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]">
                              Shortlisted
                            </Badge>
                          ) : app.status === "INTERVIEW" ? (
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-bold text-[11px]">
                              In Interview
                            </Badge>
                          ) : app.status === "UNDER_REVIEW" ? (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              Under Review
                            </Badge>
                          ) : app.status === "REJECTED" ? (
                            <Badge variant="destructive" className="font-bold text-[11px]">
                              Rejected
                            </Badge>
                          ) : app.status === "WITHDRAWN" ? (
                            <Badge variant="secondary" className="text-muted-foreground text-[11px]">
                              Withdrawn
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[11px]">
                              Applied
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(app)}
                            className="h-7 px-2.5 text-xs font-semibold hover:border-primary hover:text-primary gap-1"
                          >
                            <span>Review Desk</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                      No applications match the selected criteria or company name.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── CANDIDATE REVIEW DESK MODAL (DYNAMIC SELECTION PROCESS) ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!reviewingApp} onOpenChange={() => !isUpdating && setReviewingApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Candidate Review Desk
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {reviewingApp?.student.name} ({reviewingApp?.student.rollNumber}) • <strong>{reviewingApp?.opportunity.companyName}</strong>
            </DialogDescription>
          </DialogHeader>

          {reviewingApp && (
            <div className="space-y-4 py-1">
              {/* Candidate Quick Dossier Summary */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] block">
                    Academic Profile
                  </span>
                  <div className="font-bold text-foreground">
                    {reviewingApp.student.department} • Batch {reviewingApp.student.batchYear}
                  </div>
                  <div className="text-primary font-bold">
                    CGPA: {reviewingApp.student.cgpa.toFixed(2)} | {reviewingApp.student.activeBacklogs} Backlogs
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] block">
                    Target Opportunity
                  </span>
                  <div className="font-bold text-foreground">
                    {reviewingApp.opportunity.title}
                  </div>
                  <div className="text-muted-foreground font-semibold">
                    {reviewingApp.targetType === "PLACEMENT"
                      ? `₹${reviewingApp.opportunity.packageCtc} LPA CTC`
                      : `₹${Number(reviewingApp.opportunity.stipend || 0).toLocaleString("en-IN")}/mo Stipend`}
                  </div>
                </div>
              </div>

              {/* Portfolio & Profiles */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                {reviewingApp.student.githubUrl && (
                  <a
                    href={reviewingApp.student.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    GitHub <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {reviewingApp.student.linkedinUrl && (
                  <a
                    href={reviewingApp.student.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {reviewingApp.student.portfolioUrl && (
                  <a
                    href={reviewingApp.student.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    Portfolio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Skills Tags */}
              {reviewingApp.student.skills.length > 0 && (
                <div>
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] block mb-1">
                    Verified Technical Skills
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {reviewingApp.student.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs py-0.5 px-2">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── DYNAMIC SELECTION PROCESS PIPELINE STEPPER ─── */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Selection Process Workflow
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                      {reviewingApp.opportunity.companyName} Drive
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {editCurrentStep} of {reviewingApp.selectionProcess.length}
                  </span>
                </div>

                {/* Interactive Stepper Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reviewingApp.selectionProcess.map((step) => {
                    const isPassed = step.step < editCurrentStep || (step.step === editCurrentStep && editStepStatus === "CLEARED");
                    const isCurrent = step.step === editCurrentStep;
                    const isFailed = isCurrent && editStepStatus === "ELIMINATED";

                    return (
                      <div
                        key={step.step}
                        onClick={() => {
                          setEditCurrentStep(step.step);
                          if (isFailed) setEditStepStatus("IN_PROGRESS");
                        }}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                          isFailed
                            ? "bg-destructive/10 border-destructive/40 text-destructive ring-1 ring-destructive/30"
                            : isPassed
                            ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                            : isCurrent
                            ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-xs"
                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5",
                            isFailed
                              ? "bg-destructive text-destructive-foreground"
                              : isPassed
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-primary text-primary-foreground animate-pulse"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {isFailed ? (
                            <X className="h-3.5 w-3.5" />
                          ) : isPassed ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            step.step
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate text-foreground">
                              {step.name}
                            </span>
                            {isCurrent && !isFailed && (
                              <Badge className="text-[9px] px-1 py-0 bg-primary text-primary-foreground font-bold">
                                Current
                              </Badge>
                            )}
                            {isFailed && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold">
                                Eliminated
                              </Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ─── QUICK STAGE ACTION BUTTONS ─── */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Update Current Stage Action (Step {editCurrentStep}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Eliminate Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEliminateCurrentStep}
                      className={cn(
                        "h-8 text-xs font-bold gap-1.5 transition-all",
                        editStepStatus === "ELIMINATED"
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "border-destructive/40 text-destructive hover:bg-destructive/10"
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>✕ Eliminate at Step {editCurrentStep}</span>
                    </Button>

                    {/* Advance to Next Step Button */}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAdvanceNextStep}
                      className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        {editCurrentStep >= reviewingApp.selectionProcess.length
                          ? "✓ Cleared Final Step (Extend Offer)"
                          : `✓ Advance to Step ${editCurrentStep + 1}`}
                      </span>
                    </Button>

                    {/* Direct Offer Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMarkSelected}
                      className={cn(
                        "h-8 text-xs font-bold gap-1.5 transition-all",
                        editStatus === "SELECTED"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      )}
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>★ Final Selection (Offer)</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pipeline Status Override */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground">
                  Recruitment Pipeline Status Override
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "UNDER_REVIEW",
                    "SHORTLISTED",
                    "INTERVIEW",
                    "SELECTED",
                    "REJECTED",
                    "WITHDRAWN",
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setEditStatus(st);
                        if (st === "REJECTED") setEditStepStatus("ELIMINATED");
                        if (st === "SELECTED") setEditStepStatus("CLEARED");
                      }}
                      className={cn(
                        "p-2 rounded-lg text-xs font-bold transition-all border text-center",
                        editStatus === st
                          ? st === "SELECTED"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : st === "REJECTED"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidential Internal Remarks (TPO Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  <span>Confidential Reviewer Notes</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (TPO internal only • Hidden from student)
                  </span>
                </div>
                <textarea
                  value={editInternalRemarks}
                  onChange={(e) => setEditInternalRemarks(e.target.value)}
                  placeholder="e.g. Strong problem solving, cleared online coding test with 95% score..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-input bg-background text-foreground outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Student-Facing Remarks */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  <span>Message to Candidate</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (Visible on student application card)
                  </span>
                </div>
                <textarea
                  value={editStudentRemarks}
                  onChange={(e) => setEditStudentRemarks(e.target.value)}
                  placeholder="e.g. Congratulations! You have cleared Step 1 and advanced to Step 2: Online Test..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-input bg-background text-foreground outline-none focus:border-primary resize-none"
                />
              </div>

              {updateError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
                  {updateError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingApp(null)}
                  disabled={isUpdating}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
                >
                  {isUpdating ? "Saving..." : "Save & Propagate Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
