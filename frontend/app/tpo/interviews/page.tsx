"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarClock,
  Calendar,
  Clock,
  Video,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  Download,
  Search,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Award,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Briefcase,
  FileText,
  Check,
  X,
  MessageSquare,
  ArrowUpDown,
  Phone,
  Mail,
  ChevronRight,
  LayoutGrid,
  List
} from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---
interface InterviewItem {
  id: string;
  applicationId: string;
  roundNumber: number;
  roundName: string;
  scheduledAt: string;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  venueOrLink: string;
  instructions: string | null;
  status: "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";
  internalFeedback: string | null;
  studentFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  applicationStatus: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    batchYear: number;
    cgpa: number;
    phone: string | null;
    email: string;
    activeBacklogs: number;
    placementStatus: boolean;
  } | null;
  opportunity: {
    id: string;
    type: "PLACEMENT" | "INTERNSHIP";
    companyName: string;
    title: string;
    compensation: string;
    location: string;
  } | null;
}

interface InterviewKpis {
  totalInterviews: number;
  scheduledToday: number;
  upcomingThisWeek: number;
  completed: number;
  feedbackPending: number;
}

interface EligibleCandidate {
  applicationId: string;
  status: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    cgpa: number;
    email: string;
  };
  opportunity: {
    id: string;
    type: "PLACEMENT" | "INTERNSHIP";
    companyName: string;
    title: string;
    packageCtc?: number;
    stipend?: number;
  };
  lastRoundNumber: number;
  suggestedNextRoundNumber: number;
  interviewsCount: number;
}

const ROUND_PRESETS = [
  "Technical Round 1",
  "Technical Round 2 - System Design",
  "Coding Assessment & Pair Programming",
  "Managerial Round",
  "HR & Culture Fit",
  "Group Discussion",
  "Final Executive Review",
];

export default function TpoInterviewsPage() {
  const { departmentCodes } = useDepartment();

  // State: Data & Loading
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [kpis, setKpis] = useState<InterviewKpis>({
    totalInterviews: 0,
    scheduledToday: 0,
    upcomingThisWeek: 0,
    completed: 0,
    feedbackPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  // Selection
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Eligible Candidates for Scheduling
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibleCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Schedule Interview Dialog
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: "",
    roundNumber: 1,
    roundName: "Technical Round 1",
    scheduledAt: "",
    mode: "ONLINE" as "ONLINE" | "OFFLINE" | "HYBRID",
    venueOrLink: "",
    instructions: "",
    internalFeedback: "",
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Log Feedback / Scorecard Dialog
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [interviewForFeedback, setInterviewForFeedback] = useState<InterviewItem | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    internalFeedback: "",
    studentFeedback: "",
    status: "COMPLETED" as "COMPLETED" | "CANCELLED",
    advanceApplicationStatus: "" as "" | "INTERVIEW" | "SELECTED" | "REJECTED",
  });
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Reschedule Dialog
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [interviewForReschedule, setInterviewForReschedule] = useState<InterviewItem | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledAt: "",
    venueOrLink: "",
    mode: "ONLINE" as "ONLINE" | "OFFLINE" | "HYBRID",
    instructions: "",
  });
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Details Sheet
  const [selectedInterviewForSheet, setSelectedInterviewForSheet] = useState<InterviewItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Cancel / Delete Dialog
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<InterviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Interviews & KPIs
  const fetchInterviews = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (modeFilter !== "ALL") params.append("mode", modeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (departmentFilter !== "ALL") params.append("department", departmentFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      if (activeTab === "today") params.append("dateFilter", "today");
      else if (activeTab === "upcoming") params.append("dateFilter", "this_week");
      else if (activeTab === "feedback_pending") params.append("dateFilter", "feedback_pending");
      else if (activeTab === "completed") params.append("status", "COMPLETED");

      const res = await apiClient.get<{
        total: number;
        kpis: InterviewKpis;
        interviews: InterviewItem[];
      }>(`/interviews?${params.toString()}`);

      if (res?.interviews) {
        setInterviews(res.interviews);
      }
      if (res?.kpis) {
        setKpis(res.kpis);
      }
    } catch (err: any) {
      console.error("Failed to load interviews:", err);
      setError(err?.message || "Failed to load placement interviews.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [modeFilter, statusFilter, departmentFilter, searchQuery, activeTab]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Fetch Eligible Candidates for Scheduling Modal
  const loadEligibleCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await apiClient.get<{ candidates: EligibleCandidate[] }>("/interviews/candidates");
      if (res?.candidates) {
        setEligibleCandidates(res.candidates);
      }
    } catch (err) {
      console.error("Failed to load candidates for scheduling:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = () => {
    loadEligibleCandidates();
    // Default scheduledAt to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setScheduleForm({
      applicationId: "",
      roundNumber: 1,
      roundName: "Technical Round 1",
      scheduledAt: dateLocal,
      mode: "ONLINE",
      venueOrLink: "https://meet.google.com/",
      instructions: "Please join 5 minutes prior with working webcam and portfolio/code samples ready.",
      internalFeedback: "",
    });
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  // Handle Selecting Candidate in Schedule Modal
  const handleSelectCandidate = (appId: string) => {
    const cand = eligibleCandidates.find((c) => c.applicationId === appId);
    setScheduleForm((prev) => ({
      ...prev,
      applicationId: appId,
      roundNumber: cand ? cand.suggestedNextRoundNumber : 1,
      roundName: cand && cand.suggestedNextRoundNumber > 1
        ? `Round ${cand.suggestedNextRoundNumber} - Technical Review`
        : "Technical Round 1",
    }));
  };

  // Submit New Interview
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.applicationId) {
      setScheduleError("Please select a candidate application.");
      return;
    }
    if (!scheduleForm.scheduledAt) {
      setScheduleError("Please select an interview date and time.");
      return;
    }
    if (!scheduleForm.venueOrLink.trim()) {
      setScheduleError("Please provide a meeting link or campus venue.");
      return;
    }

    setIsScheduling(true);
    setScheduleError(null);

    try {
      await apiClient.post("/interviews", scheduleForm);
      setIsScheduleModalOpen(false);
      await fetchInterviews(true);
    } catch (err: any) {
      setScheduleError(err?.message || "Failed to schedule interview.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Open Feedback Modal
  const handleOpenFeedbackModal = (interview: InterviewItem) => {
    setInterviewForFeedback(interview);
    setFeedbackForm({
      internalFeedback: interview.internalFeedback || "",
      studentFeedback: interview.studentFeedback || "",
      status: interview.status === "CANCELLED" ? "CANCELLED" : "COMPLETED",
      advanceApplicationStatus: "",
    });
    setFeedbackError(null);
    setIsFeedbackModalOpen(true);
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewForFeedback) return;

    setIsSavingFeedback(true);
    setFeedbackError(null);

    try {
      await apiClient.patch(`/interviews/${interviewForFeedback.id}/feedback`, feedbackForm);
      setIsFeedbackModalOpen(false);
      setInterviewForFeedback(null);
      await fetchInterviews(true);
    } catch (err: any) {
      setFeedbackError(err?.message || "Failed to record evaluation.");
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenRescheduleModal = (interview: InterviewItem) => {
    setInterviewForReschedule(interview);
    const existingDate = interview.scheduledAt
      ? new Date(new Date(interview.scheduledAt).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";

    setRescheduleForm({
      scheduledAt: existingDate,
      venueOrLink: interview.venueOrLink || "",
      mode: interview.mode,
      instructions: interview.instructions || "",
    });
    setRescheduleError(null);
    setIsRescheduleModalOpen(true);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewForReschedule) return;

    setIsSavingReschedule(true);
    setRescheduleError(null);

    try {
      await apiClient.put(`/interviews/${interviewForReschedule.id}`, {
        ...rescheduleForm,
        status: "RESCHEDULED",
      });
      setIsRescheduleModalOpen(false);
      setInterviewForReschedule(null);
      await fetchInterviews(true);
    } catch (err: any) {
      setRescheduleError(err?.message || "Failed to reschedule round.");
    } finally {
      setIsSavingReschedule(false);
    }
  };

  // Open Delete / Cancel Modal
  const handleOpenDeleteModal = (interview: InterviewItem) => {
    setInterviewToDelete(interview);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!interviewToDelete) return;
    setIsDeleting(true);

    try {
      await apiClient.delete(`/interviews/${interviewToDelete.id}`);
      setIsDeleteModalOpen(false);
      setInterviewToDelete(null);
      await fetchInterviews(true);
    } catch (err: any) {
      console.error("Failed to delete interview:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Mark as Completed
  const handleQuickComplete = async (interview: InterviewItem) => {
    try {
      await apiClient.patch(`/interviews/${interview.id}/feedback`, {
        status: "COMPLETED",
      });
      await fetchInterviews(true);
    } catch (err: any) {
      console.error("Failed to complete interview:", err);
    }
  };

  // Open Details Sheet
  const handleOpenSheet = (interview: InterviewItem) => {
    setSelectedInterviewForSheet(interview);
    setIsSheetOpen(true);
  };

  // Copy Link / Venue
  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Export CSV Schedule
  const handleExportCSV = () => {
    if (interviews.length === 0) return;

    const headers = [
      "Candidate Name",
      "Roll Number",
      "Department",
      "Company",
      "Role",
      "Round Number",
      "Round Name",
      "Scheduled Date",
      "Scheduled Time",
      "Mode",
      "Venue / Meeting Link",
      "Status",
      "Feedback Status",
      "Internal Feedback",
    ];

    const rows = interviews.map((item) => {
      const d = new Date(item.scheduledAt);
      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : "N/A";
      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A";

      return [
        `"${item.student?.name || "N/A"}"`,
        `"${item.student?.rollNumber || "N/A"}"`,
        `"${item.student?.department || "N/A"}"`,
        `"${item.opportunity?.companyName || "N/A"}"`,
        `"${item.opportunity?.title || "N/A"}"`,
        item.roundNumber,
        `"${item.roundName}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        item.mode,
        `"${item.venueOrLink.replace(/"/g, '""')}"`,
        item.status,
        item.internalFeedback ? "Logged" : "Pending",
        `"${(item.internalFeedback || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `PlacementOS_Interviews_Schedule_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection helpers
  const isAllSelected = interviews.length > 0 && interviews.every((i) => selectedRows[i.id]);
  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      interviews.forEach((i) => { next[i.id] = true; });
    }
    setSelectedRows(next);
  };
  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Format Helpers
  const formatDateTimeDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "TBD";

      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeString = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (isToday) {
        return { label: `Today at ${timeString}`, isToday: true };
      }

      const dateString = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return { label: `${dateString}, ${timeString}`, isToday: false };
    } catch {
      return { label: dateStr, isToday: false };
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ─── Error Alert Banner (if any) ─── */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between text-destructive text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInterviews(true)}
            className="border-destructive/40 text-destructive hover:bg-destructive/20 h-8"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ─── 1. Executive Metric Strip (4 Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interviews */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Interviews
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <CalendarClock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.totalInterviews}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                All Rounds
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{kpis.scheduledToday} scheduled for today</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Today&apos;s Sessions
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.scheduledToday}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active Today
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Real-time interview coordination</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Pipeline */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming Pipeline
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.upcomingThisWeek}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                This Week
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Multi-round panel pipeline</span>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Pending */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Feedback Pending
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.feedbackPending}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Action Required
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>Scorecards & remarks awaiting</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Section Header & Control Bar ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Interview Schedules & Panel Coordination</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage virtual and campus interview rounds, panel logistics, meeting links, and candidate evaluations.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 h-8 inline-flex items-center rounded-md border border-border/40 shrink-0">
              {interviews.length} Interviews Listed
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/40 shrink-0">
              <Button
                type="button"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs gap-1.5 font-medium"
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2.5 text-xs gap-1.5 font-medium"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={interviews.length === 0}
              className="h-8 px-3 text-xs gap-1.5 border-input bg-background hover:bg-muted text-foreground font-medium shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Schedule</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInterviews(true)}
              disabled={isRefreshing || loading}
              className="h-8 px-3 text-xs gap-1.5 border-input bg-background hover:bg-muted text-foreground font-medium shrink-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || loading) && "animate-spin text-primary")} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenScheduleModal}
              className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Interview</span>
            </Button>
          </div>
        </div>

        {/* ─── Workflow Filter Tabs ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="h-8 bg-muted/60 p-0.5 rounded-lg border border-border/40">
              <TabsTrigger value="all" className="text-xs px-3 h-7 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                All Interviews
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs px-3 h-7 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                Today&apos;s Sessions ({kpis.scheduledToday})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs px-3 h-7 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                Upcoming This Week
              </TabsTrigger>
              <TabsTrigger value="feedback_pending" className="text-xs px-3 h-7 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                Feedback Pending ({kpis.feedbackPending})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3 h-7 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quick Toolbar Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Live Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, company, role..."
                className="pl-8 h-8 text-xs bg-card border-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Mode Filter */}
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="h-8 text-xs w-[110px] bg-card border-input font-medium">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Modes</SelectItem>
                <SelectItem value="ONLINE" className="text-xs">Online</SelectItem>
                <SelectItem value="OFFLINE" className="text-xs">Campus / Offline</SelectItem>
                <SelectItem value="HYBRID" className="text-xs">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-[120px] bg-card border-input font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED" className="text-xs">Scheduled</SelectItem>
                <SelectItem value="RESCHEDULED" className="text-xs">Rescheduled</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            {departmentCodes && departmentCodes.length > 0 && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-8 text-xs w-[120px] bg-card border-input font-medium">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Branches</SelectItem>
                  {departmentCodes.map((code) => (
                    <SelectItem key={code} value={code} className="text-xs">
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* ─── Main Content View: Table or Cards ─── */}
        {viewMode === "table" ? (
          <Card className="border-border shadow-xs overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[1080px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b border-border">
                    <TableHead className="w-12 px-5">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[220px] px-5 py-3.5">
                      Candidate
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[200px] px-5 py-3.5">
                      Company & Role
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[220px] px-5 py-3.5">
                      Round & Format
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[170px] px-5 py-3.5">
                      Date & Time
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[180px] px-5 py-3.5">
                      Venue / Meeting
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[160px] px-5 py-3.5">
                      Status & Outcome
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider w-16 px-5 py-3.5 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading interview schedules...
                      </TableCell>
                    </TableRow>
                  ) : interviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                        <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                        <p className="font-medium text-foreground">No interview sessions found.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your filters or click &quot;Schedule Interview&quot; to arrange a new round.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interviews.map((item) => {
                      const timeInfo = formatDateTimeDisplay(item.scheduledAt);
                      const isSelected = !!selectedRows[item.id];
                      const isOnline = item.mode === "ONLINE";

                      return (
                        <TableRow
                          key={item.id}
                          data-state={isSelected ? "selected" : undefined}
                          className="border-b border-border/50 hover:bg-muted/25 transition-colors"
                        >
                          <TableCell className="w-12 px-5 py-4.5 align-middle">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRow(item.id)}
                              aria-label={`Select ${item.student?.name}`}
                            />
                          </TableCell>

                          {/* Candidate with Initial Avatar */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center shrink-0">
                                {item.student?.name
                                  ? item.student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join("")
                                  : "ST"}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSheet(item)}
                                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors text-left truncate block cursor-pointer"
                                >
                                  {item.student?.name || "Unknown Candidate"}
                                </button>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono">{item.student?.rollNumber}</span>
                                  <span>•</span>
                                  <span>{item.student?.department}</span>
                                  {item.student?.cgpa !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="font-medium text-foreground">{item.student.cgpa.toFixed(2)} CGPA</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Company & Role */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[200px]">
                            <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                              <div className="h-7 w-7 rounded-md bg-muted/60 border border-border/50 flex items-center justify-center shrink-0">
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="truncate">{item.opportunity?.companyName || "Unknown"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground pl-9 mt-0.5 truncate">
                              {item.opportunity?.title}
                              {item.opportunity?.compensation && (
                                <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  • {item.opportunity.compensation}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Round & Format */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[220px]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                R{item.roundNumber}
                              </span>
                              <span className="text-sm font-medium text-foreground truncate max-w-[170px]" title={item.roundName}>
                                {item.roundName}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 pl-0.5">
                              {isOnline ? (
                                <>
                                  <Video className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  <span>Virtual Meeting</span>
                                </>
                              ) : item.mode === "OFFLINE" ? (
                                <>
                                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span>Campus Venue</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                  <span>Hybrid Mode</span>
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* Scheduled Date & Time */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[170px]">
                            <div className="text-sm font-medium text-foreground">
                              {new Date(item.scheduledAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                              <span>
                                {new Date(item.scheduledAt).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                              {typeof timeInfo === "object" && timeInfo.isToday && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Today
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Meeting Link / Venue */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[180px]">
                            {isOnline ? (
                              <div className="flex items-center gap-2">
                                {item.venueOrLink.startsWith("http") ? (
                                  <a
                                    href={item.venueOrLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all shrink-0"
                                    title={item.venueOrLink}
                                  >
                                    <Video className="h-3.5 w-3.5 shrink-0" />
                                    <span>Join Call</span>
                                    <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-xs font-medium text-foreground truncate max-w-[130px]" title={item.venueOrLink}>
                                    {item.venueOrLink}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyLink(item.venueOrLink)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                  title="Copy Link"
                                >
                                  {copiedLink === item.venueOrLink ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted/60 border border-border/70 text-foreground shrink-0">
                                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span className="truncate max-w-[120px]" title={item.venueOrLink}>
                                    {item.venueOrLink}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyLink(item.venueOrLink)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                  title="Copy Venue"
                                >
                                  {copiedLink === item.venueOrLink ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </TableCell>

                          {/* Status & Outcome */}
                          <TableCell className="px-5 py-4.5 align-middle min-w-[160px]">
                            <div className="space-y-1">
                              <Badge
                                variant={
                                  item.status === "COMPLETED"
                                    ? "outline"
                                    : item.status === "CANCELLED"
                                    ? "destructive"
                                    : item.status === "RESCHEDULED"
                                    ? "outline"
                                    : "default"
                                }
                                className={cn(
                                  "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5",
                                  item.status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                  item.status === "RESCHEDULED" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                  item.status === "SCHEDULED" && "bg-primary text-primary-foreground"
                                )}
                              >
                                {item.status}
                              </Badge>

                              <div>
                                {item.internalFeedback ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                                    <span>Evaluated</span>
                                  </span>
                                ) : item.status === "COMPLETED" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFeedbackModal(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                  >
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>Pending Scorecard</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">
                                    Pending Round
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Actions Dropdown */}
                          <TableCell className="px-5 py-4.5 align-middle w-16 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 border-border">
                                <DropdownMenuItem onClick={() => handleOpenSheet(item)} className="cursor-pointer text-xs">
                                  <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenFeedbackModal(item)} className="cursor-pointer text-xs font-medium text-primary">
                                  <MessageSquare className="h-3.5 w-3.5 mr-2" /> Log Scorecard & Notes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenRescheduleModal(item)} className="cursor-pointer text-xs">
                                  <Clock className="h-3.5 w-3.5 mr-2" /> Reschedule Round
                                </DropdownMenuItem>
                                {item.status !== "COMPLETED" && (
                                  <DropdownMenuItem onClick={() => handleQuickComplete(item)} className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenDeleteModal(item)} className="cursor-pointer text-xs text-destructive focus:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Cancel Interview
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          /* ─── Card Grid View (Executive & Ultra-Spacious) ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-border bg-card p-6 h-72">
                  <div className="h-5 w-24 bg-muted rounded mb-4" />
                  <div className="h-4 w-40 bg-muted/60 rounded mb-6" />
                  <div className="h-12 bg-muted/40 rounded mb-4" />
                  <div className="h-8 bg-muted/40 rounded mt-6" />
                </Card>
              ))
            ) : interviews.length === 0 ? (
              <div className="col-span-full text-center py-16 border rounded-xl bg-card border-border">
                <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                <p className="font-medium text-foreground">No interview sessions found.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your filters or click &quot;Schedule Interview&quot; to arrange a new round.
                </p>
              </div>
            ) : (
              interviews.map((item) => {
                const isOnline = item.mode === "ONLINE";

                return (
                  <Card
                    key={item.id}
                    className="border-border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-mono font-bold border-primary/30 text-primary bg-primary/10">
                          Round {item.roundNumber}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            item.status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            item.status === "RESCHEDULED" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            item.status === "SCHEDULED" && "bg-primary text-primary-foreground"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground mt-2 truncate">
                        {item.roundName}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {new Date(item.scheduledAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4 flex-1">
                      {/* Candidate Box */}
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm flex items-center justify-center shrink-0">
                          {item.student?.name
                            ? item.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                            : "ST"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSheet(item)}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block text-left"
                          >
                            {item.student?.name}
                          </button>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="font-mono">{item.student?.rollNumber}</span>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {item.student?.department}
                            </Badge>
                            <span>•</span>
                            <span>{item.student?.cgpa.toFixed(2)} CGPA</span>
                          </div>
                        </div>
                      </div>

                      {/* Opportunity */}
                      <div className="space-y-1.5 text-xs">
                        <div className="text-muted-foreground font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1.5 truncate mr-2">
                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <strong className="text-foreground truncate">{item.opportunity?.companyName}</strong>
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            {item.opportunity?.compensation}
                          </span>
                        </div>
                        <div className="text-muted-foreground pl-5 truncate">
                          Role: <span className="text-foreground font-medium">{item.opportunity?.title}</span>
                        </div>
                      </div>

                      {/* Meeting / Venue */}
                      <div className="p-3 rounded-lg border border-border/60 bg-background flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate mr-2">
                          {isOnline ? (
                            <Video className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-foreground truncate" title={item.venueOrLink}>
                            {item.venueOrLink}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(item.venueOrLink)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          title="Copy Link/Venue"
                        >
                          {copiedLink === item.venueOrLink ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* Evaluation / Scorecard */}
                      {item.internalFeedback ? (
                        <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-foreground space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Evaluation Logged</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic truncate">
                            &ldquo;{item.internalFeedback}&rdquo;
                          </p>
                        </div>
                      ) : item.status === "COMPLETED" ? (
                        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between">
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Scorecard Pending
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFeedbackModal(item)}
                            className="h-6 px-2 text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400"
                          >
                            Add Notes
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>

                    <CardFooter className="p-4 pt-3 border-t border-border/40 bg-muted/10 flex items-center gap-2">
                      {isOnline && item.venueOrLink.startsWith("http") && (
                        <a
                          href={item.venueOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Join Call</span>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSheet(item)}
                        className="h-8 px-3 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenFeedbackModal(item)} className="text-xs">
                            <MessageSquare className="h-3.5 w-3.5 mr-2" /> Log Scorecard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenRescheduleModal(item)} className="text-xs">
                            <Clock className="h-3.5 w-3.5 mr-2" /> Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDeleteModal(item)} className="text-xs text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Cancel Interview
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 1: SCHEDULE NEW INTERVIEW ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <span>Schedule Interview Round</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a candidate to an upcoming virtual meeting or on-campus recruitment interview round.
            </DialogDescription>
          </DialogHeader>

          {scheduleError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{scheduleError}</span>
            </div>
          )}

          <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-1">
            {/* Step 1: Candidate Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Candidate Application *
              </label>
              <Select
                value={scheduleForm.applicationId}
                onValueChange={handleSelectCandidate}
                disabled={loadingCandidates}
              >
                <SelectTrigger className="h-9 text-xs bg-background border-input">
                  <SelectValue placeholder={loadingCandidates ? "Loading candidate applications..." : "Select candidate..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {eligibleCandidates.map((cand) => (
                    <SelectItem key={cand.applicationId} value={cand.applicationId} className="text-xs">
                      <span className="font-semibold text-foreground">{cand.student.name}</span>
                      {" "}({cand.student.rollNumber} • {cand.student.department}) —{" "}
                      <span className="text-primary font-medium">{cand.opportunity.companyName}</span>
                      {" "}({cand.opportunity.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Showing candidates who have applied or have been shortlisted for active drives.
              </p>
            </div>

            {/* Step 2: Round Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Round Number</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={scheduleForm.roundNumber}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, roundNumber: parseInt(e.target.value, 10) || 1 })}
                  className="h-9 text-xs bg-background border-input font-mono"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Round Title *</label>
                <Input
                  value={scheduleForm.roundName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, roundName: e.target.value })}
                  placeholder="e.g. Technical Round 1 (Algorithms)"
                  className="h-9 text-xs bg-background border-input"
                />
              </div>
            </div>

            {/* Quick Round Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Quick Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {ROUND_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setScheduleForm((prev) => ({ ...prev, roundName: preset }))}
                    className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/50 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Date & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                  className="h-9 text-xs bg-background border-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Interview Format</label>
                <div className="grid grid-cols-3 gap-1 h-9">
                  {(["ONLINE", "OFFLINE", "HYBRID"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setScheduleForm((prev) => ({
                          ...prev,
                          mode: m,
                          venueOrLink: m === "ONLINE" && !prev.venueOrLink.startsWith("http")
                            ? "https://meet.google.com/"
                            : m === "OFFLINE" && prev.venueOrLink.startsWith("http")
                            ? "Campus Placement Cell, Boardroom 2"
                            : prev.venueOrLink,
                        }));
                      }}
                      className={cn(
                        "rounded-md text-[11px] font-semibold border transition-all flex items-center justify-center gap-1",
                        scheduleForm.mode === m
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {m === "ONLINE" && <Video className="h-3 w-3" />}
                      {m === "OFFLINE" && <MapPin className="h-3 w-3" />}
                      {m === "HYBRID" && <Sparkles className="h-3 w-3" />}
                      <span>{m === "ONLINE" ? "Online" : m === "OFFLINE" ? "Campus" : "Hybrid"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Venue or Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {scheduleForm.mode === "ONLINE" ? "Video Meeting Link (Google Meet / Zoom / Teams) *" : "Campus Room / Venue Location *"}
              </label>
              <Input
                value={scheduleForm.venueOrLink}
                onChange={(e) => setScheduleForm({ ...scheduleForm, venueOrLink: e.target.value })}
                placeholder={scheduleForm.mode === "ONLINE" ? "https://meet.google.com/abc-def-ghi" : "e.g. Placement Cell Block 3, Interview Hall A"}
                className="h-9 text-xs bg-background border-input"
              />
            </div>

            {/* Step 5: Candidate Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Candidate Instructions</label>
              <Textarea
                rows={2}
                value={scheduleForm.instructions}
                onChange={(e) => setScheduleForm({ ...scheduleForm, instructions: e.target.value })}
                placeholder="e.g. Bring 2 hard copies of resume, college ID card, and maintain video camera active."
                className="text-xs bg-background border-input resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isScheduling}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isScheduling}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isScheduling ? "Scheduling..." : "Confirm & Schedule Round"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 2: LOG EVALUATION & SCORECARD ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Log Evaluation & Scorecard</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record interview outcome, recruiter notes, and optionally advance the candidate in the recruitment pipeline.
            </DialogDescription>
          </DialogHeader>

          {feedbackError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          {interviewForFeedback && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  {interviewForFeedback.student?.name}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  R{interviewForFeedback.roundNumber} • {interviewForFeedback.roundName}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {interviewForFeedback.opportunity?.companyName} — {interviewForFeedback.opportunity?.title}
              </div>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-1">
            {/* Round Outcome Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Round Outcome Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, status: "COMPLETED" })}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                    feedbackForm.status === "COMPLETED"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Interview Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, status: "CANCELLED" })}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                    feedbackForm.status === "CANCELLED"
                      ? "bg-destructive/10 border-destructive/40 text-destructive"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancelled / No Show</span>
                </button>
              </div>
            </div>

            {/* Confidential Internal Feedback */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Confidential Scorecard & Panel Notes (TPO Only)
                </label>
                <span className="text-[10px] text-muted-foreground">Isolated from student view</span>
              </div>
              <Textarea
                rows={3}
                value={feedbackForm.internalFeedback}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, internalFeedback: e.target.value })}
                placeholder="e.g. Strong problem solving in DSA round, good understanding of React and Node. Recommended for next architecture round."
                className="text-xs bg-background border-input resize-none"
              />
            </div>

            {/* Student Feedback (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Student-Facing Feedback / Next Steps (Optional)
              </label>
              <Textarea
                rows={2}
                value={feedbackForm.studentFeedback}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, studentFeedback: e.target.value })}
                placeholder="e.g. Interview successfully conducted. Results will be declared by the placement cell."
                className="text-xs bg-background border-input resize-none"
              />
            </div>

            {/* Advance Application Pipeline */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <label className="text-xs font-semibold text-foreground">
                Candidate Pipeline Progression
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "", label: "No Status Change" },
                  { value: "SELECTED", label: "Mark as Selected (Offer)", highlight: "emerald" },
                  { value: "REJECTED", label: "Mark as Rejected", highlight: "destructive" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, advanceApplicationStatus: opt.value as any })}
                    className={cn(
                      "p-2 rounded-md border text-[11px] font-medium transition-colors text-center",
                      feedbackForm.advanceApplicationStatus === opt.value
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFeedbackModalOpen(false)}
                disabled={isSavingFeedback}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingFeedback}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isSavingFeedback ? "Saving..." : "Save Scorecard"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 3: RESCHEDULE INTERVIEW ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Reschedule Interview Round</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update the scheduled date, meeting link, or instructions for this session.
            </DialogDescription>
          </DialogHeader>

          {rescheduleError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{rescheduleError}</span>
            </div>
          )}

          <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Date & Time *</label>
              <Input
                type="datetime-local"
                value={rescheduleForm.scheduledAt}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduledAt: e.target.value })}
                className="h-9 text-xs bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Updated Meeting Link / Venue</label>
              <Input
                value={rescheduleForm.venueOrLink}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, venueOrLink: e.target.value })}
                className="h-9 text-xs bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Updated Instructions</label>
              <Textarea
                rows={2}
                value={rescheduleForm.instructions}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, instructions: e.target.value })}
                className="text-xs bg-background border-input resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleModalOpen(false)}
                disabled={isSavingReschedule}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingReschedule}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isSavingReschedule ? "Updating..." : "Confirm Reschedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 4: DELETE / CANCEL CONFIRMATION ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Cancel Interview Round?</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to cancel and delete this interview round for{" "}
              <strong className="text-foreground">{interviewToDelete?.student?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="h-8 text-xs"
            >
              Keep Round
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Cancelling..." : "Confirm & Cancel Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── SLIDE-OVER SHEET: CANDIDATE & INTERVIEW PROFILE ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto border-border bg-card p-6 space-y-6">
          {selectedInterviewForSheet && (
            <>
              <SheetHeader className="p-0 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30 text-primary">
                    Round {selectedInterviewForSheet.roundNumber}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase font-semibold",
                      selectedInterviewForSheet.status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      selectedInterviewForSheet.status === "RESCHEDULED" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      selectedInterviewForSheet.status === "SCHEDULED" && "bg-primary text-primary-foreground"
                    )}
                  >
                    {selectedInterviewForSheet.status}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {selectedInterviewForSheet.roundName}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Session scheduled for {new Date(selectedInterviewForSheet.scheduledAt).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              {/* Candidate Info */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" /> Candidate Profile
                </span>
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {selectedInterviewForSheet.student?.name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedInterviewForSheet.student?.rollNumber} • {selectedInterviewForSheet.student?.department}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {selectedInterviewForSheet.student?.cgpa.toFixed(2)} CGPA
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{selectedInterviewForSheet.student?.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{selectedInterviewForSheet.student?.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Opportunity */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" /> Target Opportunity
                </span>
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-foreground">
                      {selectedInterviewForSheet.opportunity?.companyName}
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedInterviewForSheet.opportunity?.compensation}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Role: <span className="text-foreground font-medium">{selectedInterviewForSheet.opportunity?.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Location: <span className="text-foreground font-medium">{selectedInterviewForSheet.opportunity?.location}</span>
                  </div>
                </div>
              </div>

              {/* Meeting Logistics */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  {selectedInterviewForSheet.mode === "ONLINE" ? <Video className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-amber-500" />}
                  Meeting Logistics
                </span>
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Format</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedInterviewForSheet.mode}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Location / Meeting Link:</span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/60">
                      <span className="text-xs font-medium text-foreground truncate mr-2">
                        {selectedInterviewForSheet.venueOrLink}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyLink(selectedInterviewForSheet.venueOrLink)}
                        className="h-6 px-2 text-[10px]"
                      >
                        {copiedLink === selectedInterviewForSheet.venueOrLink ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  {selectedInterviewForSheet.mode === "ONLINE" && selectedInterviewForSheet.venueOrLink.startsWith("http") && (
                    <a
                      href={selectedInterviewForSheet.venueOrLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-8 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Launch Interview Room</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Instructions */}
              {selectedInterviewForSheet.instructions && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Candidate Instructions</span>
                  <p className="text-xs text-muted-foreground p-3 rounded-xl border border-border/60 bg-muted/20">
                    {selectedInterviewForSheet.instructions}
                  </p>
                </div>
              )}

              {/* Scorecard / Feedback */}
              {selectedInterviewForSheet.internalFeedback && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Confidential Panel Evaluation</span>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-foreground space-y-1">
                    <p className="italic">&ldquo;{selectedInterviewForSheet.internalFeedback}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setIsSheetOpen(false);
                    handleOpenFeedbackModal(selectedInterviewForSheet);
                  }}
                  className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Log Evaluation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsSheetOpen(false);
                    handleOpenRescheduleModal(selectedInterviewForSheet);
                  }}
                  className="h-8 text-xs"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Reschedule
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
