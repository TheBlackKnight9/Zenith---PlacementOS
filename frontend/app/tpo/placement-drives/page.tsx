"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Building2, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  CalendarDays, 
  Users, 
  Plus, 
  RefreshCw, 
  MoreHorizontal,
  Trash2,
  Check,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  Power,
  ExternalLink,
  MapPin,
  IndianRupee,
  Clock,
  Layers,
  Sparkles,
  ListChecks,
  CheckCircle2,
  Activity,
  TrendingUp
} from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// --- Types ---
interface JobRoleEntry {
  title: string;
  type: string; // "Internship + Full-Time" | "Full-Time" | "Internship"
  stipend: number; 
  duration: number;
  ctcBreakdown: {
    fixed: number;
    pb: number;
    fyBonus: number;
    syBonus: number;
    total: number;
  };
  responsibilities?: string;
}

interface SelectionStep {
  step: number;
  name: string;
  description: string;
}

interface PlacementDriveItem {
  id: string;
  companyName: string;
  companyLogo: string | null;
  companyWebsite: string | null;
  companyDescription: string | null;
  roleResponsibilities: string | null;
  jobRole: string;
  jobDescription: string;
  packageCtc: number;
  location: string;
  eligibleBranches: string[];
  minCgpa: number;
  maxBacklogs: number;
  eligibleBatch: number;
  skillsRequired: string[];
  deadline: string;
  driveDate: string | null;
  status: string;
  driveType: string;
  jobRoles: JobRoleEntry[] | null;
  internshipDuration: number | null;
  internshipStipend: number | null;
  bondAmount: number | null;
  bondConditions: string | null;
  joiningTimeline: string | null;
  workMode: string;
  selectionProcess: SelectionStep[] | null;
  applicantCount: number;
  createdAt: string;
}

const ALL_BRANCHES = ["CSE", "IT", "ECE", "MECH", "CIVIL", "EE", "AI & DS"];

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "N/A";
  }
};

const formatTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// --- Default Form State ---
const getDefaultFormState = () => ({
  companyName: "",
  companyWebsite: "",
  companyDescription: "",
  companyLogo: "",
  roleResponsibilities: "",
  driveType: "INTERNSHIP_FT", // "INTERNSHIP_FT" | "FULL_TIME" | "INTERNSHIP_ONLY"
  jobRoles: [
    {
      title: "",
      type: "Internship + Full-Time",
      stipend: 0,
      duration: 6,
      ctcBreakdown: { fixed: 0, pb: 0, fyBonus: 0, syBonus: 0, total: 0 },
      responsibilities: "",
    }
  ] as JobRoleEntry[],
  eligibleBranches: [...ALL_BRANCHES],
  minCgpa: 6.0,
  maxBacklogs: 0,
  eligibleBatch: 2027,
  skillsRequired: "",
  bondAmount: 0,
  bondConditions: "",
  joiningTimeline: "",
  location: "",
  workMode: "OFFICE",
  selectionProcess: [
    { step: 1, name: "Resume Shortlisting", description: "" },
    { step: 2, name: "Online Test", description: "" },
    { step: 3, name: "Technical Interview", description: "" },
    { step: 4, name: "HR Interview", description: "" },
  ] as SelectionStep[],
  deadline: "",
  driveDate: "",
  jobDescription: "",
});

export default function PlacementDrivesPage() {
  const { departmentCodes, selectedDepartmentCode, isDepartmentMatch } = useDepartment();
  const activeBranches = departmentCodes && departmentCodes.length > 0 ? departmentCodes : ALL_BRANCHES;

  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getDefaultFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Details Window Card State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDriveItem | null>(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState<PlacementDriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDetailsModal = (drive: PlacementDriveItem) => {
    setSelectedDrive(drive);
    setIsDetailsOpen(true);
  };

  const openDeleteDialog = (drive: PlacementDriveItem) => {
    setDriveToDelete(drive);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDrive = async () => {
    if (!driveToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await apiClient.delete(`/placement-drives/${driveToDelete.id}`);
      setIsDeleteModalOpen(false);
      if (selectedDrive?.id === driveToDelete.id) {
        setIsDetailsOpen(false);
        setSelectedDrive(null);
      }
      setDriveToDelete(null);
      await fetchDrives();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to remove placement drive.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query =
        selectedDepartmentCode && selectedDepartmentCode !== "ALL"
          ? `?department=${encodeURIComponent(selectedDepartmentCode)}`
          : "";
      const res = await apiClient.get<{ drives: PlacementDriveItem[] }>(`/placement-drives${query}`);
      setDrives(res.drives || []);
    } catch (err: any) {
      setError(err.message || "Failed to load placement drives");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartmentCode]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const filteredDrives = useMemo(() => {
    if (!selectedDepartmentCode || selectedDepartmentCode === "ALL") return drives;
    return drives.filter((d) => isDepartmentMatch(d.eligibleBranches));
  }, [drives, selectedDepartmentCode, isDepartmentMatch]);

  const openAddDialog = () => {
    setEditingDriveId(null);
    setFormData({
      ...getDefaultFormState(),
      eligibleBranches: [...activeBranches],
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (drive: PlacementDriveItem) => {
    setEditingDriveId(drive.id);
    setFormError(null);
    setFormData({
      companyName: drive.companyName,
      companyWebsite: drive.companyWebsite || "",
      companyDescription: drive.companyDescription || "",
      roleResponsibilities: drive.roleResponsibilities || "",
      companyLogo: drive.companyLogo || "",
      driveType: drive.driveType,
      jobRoles: drive.jobRoles?.length ? drive.jobRoles.map(r => ({
        ...r,
        responsibilities: r.responsibilities || ""
      })) : [{
        title: drive.jobRole,
        type: drive.driveType === "INTERNSHIP_FT" ? "Internship + Full-Time" : drive.driveType === "FULL_TIME" ? "Full-Time" : "Internship",
        stipend: drive.internshipStipend || 0,
        duration: drive.internshipDuration || 6,
        responsibilities: "",
        ctcBreakdown: {
          fixed: drive.packageCtc * 100000, 
          pb: 0, fyBonus: 0, syBonus: 0, total: drive.packageCtc * 100000
        }
      }],
      eligibleBranches: [...drive.eligibleBranches],
      minCgpa: drive.minCgpa,
      maxBacklogs: drive.maxBacklogs,
      eligibleBatch: drive.eligibleBatch,
      skillsRequired: drive.skillsRequired.join(", "),
      bondAmount: drive.bondAmount || 0,
      bondConditions: drive.bondConditions || "",
      joiningTimeline: drive.joiningTimeline || "",
      location: drive.location,
      workMode: drive.workMode,
      selectionProcess: drive.selectionProcess?.length ? [...drive.selectionProcess] : [
        { step: 1, name: "Resume Shortlisting", description: "" }
      ],
      deadline: drive.deadline ? drive.deadline.slice(0, 16) : "", // strip seconds for datetime-local
      driveDate: drive.driveDate ? drive.driveDate.split("T")[0] : "",
      jobDescription: drive.jobDescription || "",
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/placement-drives/${id}/status`, { status: newStatus });
      fetchDrives();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleSaveDrive = async () => {
    try {
      setFormError(null);
      setIsSubmitting(true);
      
      // Basic validation
      if (!formData.companyName) throw new Error("Company Name is required");
      if (formData.jobRoles.length === 0) throw new Error("At least one job role is required");
      if (!formData.jobRoles[0].title) throw new Error("Job Role title is required");
      if (!formData.deadline) throw new Error("Application Deadline is required");
      if (formData.eligibleBranches.length === 0) throw new Error("At least one branch must be eligible");

      const headlineRole = formData.jobRoles[0];
      const headlineCtc = formData.driveType === "INTERNSHIP_ONLY" ? 0 : (headlineRole.ctcBreakdown.total / 100000);

      const payload = {
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite || null,
        companyDescription: formData.companyDescription || null,
        roleResponsibilities: formData.roleResponsibilities || null,
        companyLogo: formData.companyLogo || null,
        driveType: formData.driveType,
        jobRole: headlineRole.title,
        packageCtc: headlineCtc,
        jobRoles: formData.jobRoles,
        eligibleBranches: formData.eligibleBranches,
        minCgpa: Number(formData.minCgpa),
        maxBacklogs: Number(formData.maxBacklogs),
        eligibleBatch: Number(formData.eligibleBatch),
        skillsRequired: formData.skillsRequired.split(",").map(s => s.trim()).filter(Boolean),
        bondAmount: Number(formData.bondAmount) || null,
        bondConditions: formData.bondConditions || null,
        joiningTimeline: formData.joiningTimeline || null,
        location: formData.location,
        workMode: formData.workMode,
        selectionProcess: formData.selectionProcess,
        deadline: new Date(formData.deadline).toISOString(),
        driveDate: formData.driveDate ? new Date(formData.driveDate).toISOString() : null,
        jobDescription: formData.jobDescription,
        internshipDuration: headlineRole.duration || null,
        internshipStipend: headlineRole.stipend || null,
      };

      if (editingDriveId) {
        await apiClient.put(`/placement-drives/${editingDriveId}`, payload);
      } else {
        await apiClient.post("/placement-drives", payload);
      }

      setIsDialogOpen(false);
      fetchDrives();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBranchToggle = (branch: string) => {
    setFormData(prev => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter(b => b !== branch)
        : [...prev.eligibleBranches, branch]
    }));
  };

  const toggleAllBranches = () => {
    if (formData.eligibleBranches.length === activeBranches.length) {
      setFormData(prev => ({ ...prev, eligibleBranches: [] }));
    } else {
      setFormData(prev => ({ ...prev, eligibleBranches: [...activeBranches] }));
    }
  };

  // Job Roles Helpers
  const addJobRole = () => {
    setFormData(prev => ({
      ...prev,
      jobRoles: [
        ...prev.jobRoles,
        {
          title: "",
          type: prev.driveType === "INTERNSHIP_FT" ? "Internship + Full-Time" : prev.driveType === "FULL_TIME" ? "Full-Time" : "Internship",
          stipend: 0,
          duration: 6,
          ctcBreakdown: { fixed: 0, pb: 0, fyBonus: 0, syBonus: 0, total: 0 },
        }
      ]
    }));
  };

  const removeJobRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      jobRoles: prev.jobRoles.filter((_, i) => i !== index)
    }));
  };

  const updateJobRole = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newRoles = [...prev.jobRoles];
      const role = { ...newRoles[index] };
      
      if (field.startsWith("ctcBreakdown.")) {
        const subField = field.split(".")[1];
        role.ctcBreakdown = { ...role.ctcBreakdown, [subField]: Number(value) || 0 };
        role.ctcBreakdown.total = role.ctcBreakdown.fixed + role.ctcBreakdown.pb + role.ctcBreakdown.fyBonus + role.ctcBreakdown.syBonus;
      } else {
        (role as any)[field] = value;
      }
      
      newRoles[index] = role;
      return { ...prev, jobRoles: newRoles };
    });
  };

  // Selection Steps Helpers
  const addSelectionStep = () => {
    setFormData(prev => ({
      ...prev,
      selectionProcess: [
        ...prev.selectionProcess,
        { step: prev.selectionProcess.length + 1, name: "", description: "" }
      ]
    }));
  };

  const removeSelectionStep = (index: number) => {
    setFormData(prev => {
      const newSteps = prev.selectionProcess.filter((_, i) => i !== index);
      // Re-index
      newSteps.forEach((step, i) => { step.step = i + 1; });
      return { ...prev, selectionProcess: newSteps };
    });
  };

  const updateSelectionStep = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.selectionProcess];
      (newSteps[index] as any)[field] = value;
      return { ...prev, selectionProcess: newSteps };
    });
  };

  // Stats derivation
  const totalDrives = filteredDrives.length;
  const activeDrives = filteredDrives.filter((d: PlacementDriveItem) => d.status === "ACTIVE").length;
  const upcomingDrives = filteredDrives.filter((d: PlacementDriveItem) => d.status === "UPCOMING").length;
  const totalApplicants = filteredDrives.reduce((sum: number, d: PlacementDriveItem) => sum + (d.applicantCount || 0), 0);

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
            onClick={fetchDrives}
            className="border-destructive/40 text-destructive hover:bg-destructive/20 h-8"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ─── 1. Executive Metric Strip (4 Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Placement Drives */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Drives
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {totalDrives}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Campaigns
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{activeDrives} active & published drives</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Drives */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Drives
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Power className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {activeDrives}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Accepting
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>Open for student applications</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Drives */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming Drives
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {upcomingDrives}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Pipeline
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Scheduled recruitment rounds</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Applicants */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-4.5 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Applicants
              </span>
              <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {totalApplicants}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Submissions
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Cumulative student registrations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Placement Drives Section & Controls ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Drive Schedules & Applications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage ongoing and upcoming company recruitment drives, eligibility criteria, and applicants.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 h-8 inline-flex items-center rounded-md border border-border/40 shrink-0">
              {filteredDrives.length} Drives Listed
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDrives}
              disabled={loading}
              className="h-8 px-3 text-xs gap-1.5 border-input bg-background hover:bg-muted text-foreground font-medium shrink-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </Button>

            <Button
              size="sm"
              onClick={openAddDialog}
              className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Drive</span>
            </Button>
          </div>
        </div>

        {/* Drives Table */}
        <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                <TableHead className="font-semibold">Company & Role</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Package (CTC)</TableHead>
                <TableHead className="font-semibold">Eligibility</TableHead>
                <TableHead className="font-semibold">Deadline</TableHead>
                <TableHead className="font-semibold text-center">Applicants</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading drives...</TableCell>
                </TableRow>
              ) : filteredDrives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No placement drives found.</TableCell>
                </TableRow>
              ) : (
                filteredDrives.map((drive: PlacementDriveItem) => (
                  <TableRow key={drive.id} className="border-b border-border/50 hover:bg-muted/30">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openDetailsModal(drive)}
                        className="text-left group cursor-pointer"
                        title="Click to view full drive details"
                      >
                        <div className="font-semibold text-sm text-foreground group-hover:text-primary group-hover:underline flex items-center gap-1.5 transition-colors">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{drive.companyName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{drive.jobRole}</div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase",
                        drive.driveType === "INTERNSHIP_FT" && "border-primary/30 bg-primary/10 text-primary",
                        drive.driveType === "FULL_TIME" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        drive.driveType === "INTERNSHIP_ONLY" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}>
                        {drive.driveType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {drive.packageCtc > 0 ? (
                        <div className="font-medium text-sm text-foreground">{drive.packageCtc} LPA</div>
                      ) : (
                        <div className="font-medium text-sm text-muted-foreground">Stipend Based</div>
                      )}
                      <div className="text-xs text-muted-foreground">{drive.location}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-foreground font-medium">{drive.minCgpa}+ CGPA</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1" title={drive.eligibleBranches.join(", ")}>
                        {drive.eligibleBranches.length === ALL_BRANCHES.length ? "All Branches" : drive.eligibleBranches.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">
                        {formatDate(drive.deadline)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(drive.deadline)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">{drive.applicantCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        drive.status === "ACTIVE" ? "default" :
                        drive.status === "CLOSED" ? "destructive" :
                        drive.status === "UPCOMING" ? "outline" : "secondary"
                      } className="text-[10px] uppercase">
                        {drive.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 border-border">
                          <DropdownMenuItem onClick={() => openDetailsModal(drive)} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(drive)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit Drive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          {drive.status !== "CLOSED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(drive.id, "CLOSED")} className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600">
                              <Power className="h-4 w-4 mr-2" /> Close Drive
                            </DropdownMenuItem>
                          )}
                          {drive.status === "CLOSED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(drive.id, "ACTIVE")} className="cursor-pointer text-emerald-500 focus:text-emerald-500">
                              <Power className="h-4 w-4 mr-2" /> Re-open Drive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(drive)}
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove Drive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      </div>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-border bg-card">
          <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0 bg-muted/20">
            <DialogTitle className="text-xl font-bold">
              {editingDriveId ? "Edit Placement Drive" : "Publish New Drive"}
            </DialogTitle>
            <DialogDescription>
              {editingDriveId ? "Update the details of the drive." : "Fill in the comprehensive details to publish a new placement drive."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
            {formError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            {/* Section 1: Company Profile */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Company Name *</label>
                  <Input 
                    value={formData.companyName} 
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })} 
                    placeholder="e.g. Google" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Website</label>
                  <Input 
                    value={formData.companyWebsite} 
                    onChange={e => setFormData({ ...formData, companyWebsite: e.target.value })} 
                    placeholder="https://..." 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">About Company</label>
                  <Textarea 
                    value={formData.companyDescription} 
                    onChange={e => setFormData({ ...formData, companyDescription: e.target.value })} 
                    placeholder="Brief description of the company..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Company Logo URL</label>
                  <Input 
                    value={formData.companyLogo} 
                    onChange={e => setFormData({ ...formData, companyLogo: e.target.value })} 
                    placeholder="https://..." 
                  />
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 2: Drive Classification */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Drive Classification
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Drive Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "INTERNSHIP_FT", label: "Internship + Full-Time" },
                    { id: "FULL_TIME", label: "Full-Time Only" },
                    { id: "INTERNSHIP_ONLY", label: "Internship Only" },
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, driveType: type.id })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        formData.driveType === type.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                          : "bg-card text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 3: Job Roles */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Job Roles & Compensation
              </h3>
              <div className="space-y-6">
                {formData.jobRoles.map((role, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4 relative">
                    {formData.jobRoles.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeJobRole(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground">Role Title *</label>
                        <Input 
                          value={role.title} 
                          onChange={e => updateJobRole(idx, "title", e.target.value)} 
                          placeholder="e.g. Software Development Engineer" 
                        />
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground">Role Type</label>
                        <div className="text-sm font-medium h-10 flex items-center px-3 border border-border/50 rounded-md bg-muted/30">
                          {formData.driveType === "INTERNSHIP_FT" ? "Internship + Full-Time" : formData.driveType === "FULL_TIME" ? "Full-Time" : "Internship"}
                        </div>
                      </div>
                    </div>

                    {formData.driveType !== "FULL_TIME" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Internship Duration (months)</label>
                          <Input 
                            type="number" 
                            value={role.duration} 
                            onChange={e => updateJobRole(idx, "duration", Number(e.target.value))} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Stipend (₹ per month)</label>
                          <Input 
                            type="number" 
                            value={role.stipend} 
                            onChange={e => updateJobRole(idx, "stipend", Number(e.target.value))} 
                          />
                        </div>
                      </div>
                    )}

                    {formData.driveType !== "INTERNSHIP_ONLY" && (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground">CTC Breakdown (₹)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">Fixed</span>
                            <Input type="number" value={role.ctcBreakdown.fixed} onChange={e => updateJobRole(idx, "ctcBreakdown.fixed", e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">Perf. Bonus</span>
                            <Input type="number" value={role.ctcBreakdown.pb} onChange={e => updateJobRole(idx, "ctcBreakdown.pb", e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">FY Bonus</span>
                            <Input type="number" value={role.ctcBreakdown.fyBonus} onChange={e => updateJobRole(idx, "ctcBreakdown.fyBonus", e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">SY Bonus</span>
                            <Input type="number" value={role.ctcBreakdown.syBonus} onChange={e => updateJobRole(idx, "ctcBreakdown.syBonus", e.target.value)} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <span className="text-sm font-semibold text-foreground">Total CTC</span>
                          <span className="text-lg font-bold text-primary">₹ {role.ctcBreakdown.total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Role-Specific Responsibilities & Deliverables</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                      </label>
                      <Textarea 
                        value={role.responsibilities || ""} 
                        onChange={e => updateJobRole(idx, "responsibilities", e.target.value)} 
                        placeholder="Key duties, day-to-day tasks, or expectations specific to this role..."
                        rows={2}
                        className="text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" size="sm" onClick={addJobRole} className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add Another Role
                </Button>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 4: Role Overview & Key Responsibilities */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" /> Role & Key Responsibilities
                </h3>
                <span className="text-[11px] text-muted-foreground">General job duties & day-to-day tasks</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Core Responsibilities & Deliverables</label>
                <Textarea 
                  value={formData.roleResponsibilities} 
                  onChange={e => setFormData({ ...formData, roleResponsibilities: e.target.value })} 
                  placeholder={`§ Identify and generate new business opportunities / develop scalable modules.
§ Connect with potential clients and understand requirements / write clean, maintainable code.
§ Follow up on deliverables, testing, and continuous client satisfaction.`}
                  rows={4}
                  className="text-xs leading-relaxed"
                />
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 5: Eligibility Criteria */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Eligibility Criteria
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-foreground">Eligible Branches *</label>
                  <button type="button" onClick={toggleAllBranches} className="text-[10px] font-medium text-primary hover:underline">
                    {formData.eligibleBranches.length === activeBranches.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeBranches.map(branch => {
                    const isSelected = formData.eligibleBranches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => handleBranchToggle(branch)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                            : "bg-card text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {branch}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Min CGPA</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={formData.minCgpa} 
                    onChange={e => setFormData({ ...formData, minCgpa: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Max Active Backlogs</label>
                  <Input 
                    type="number" 
                    value={formData.maxBacklogs} 
                    onChange={e => setFormData({ ...formData, maxBacklogs: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Eligible Batch</label>
                  <Input 
                    type="number" 
                    value={formData.eligibleBatch} 
                    onChange={e => setFormData({ ...formData, eligibleBatch: Number(e.target.value) })} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Skills Required (comma separated)</label>
                <Input 
                  value={formData.skillsRequired} 
                  onChange={e => setFormData({ ...formData, skillsRequired: e.target.value })} 
                  placeholder="e.g. React, Node.js, C++" 
                />
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 5: Bond & Conditions */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Bond & Conditions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Bond Amount (₹)</label>
                  <Input 
                    type="number" 
                    value={formData.bondAmount} 
                    onChange={e => setFormData({ ...formData, bondAmount: Number(e.target.value) })} 
                    placeholder="0 if none" 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Bond Conditions</label>
                  <Textarea 
                    value={formData.bondConditions} 
                    onChange={e => setFormData({ ...formData, bondConditions: e.target.value })} 
                    placeholder="Any specific conditions..."
                    rows={2}
                  />
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 6: Joining & Logistics */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Joining & Logistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Joining Timeline</label>
                  <Input 
                    value={formData.joiningTimeline} 
                    onChange={e => setFormData({ ...formData, joiningTimeline: e.target.value })} 
                    placeholder="e.g. September/October 2026" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Job Location *</label>
                  <Input 
                    value={formData.location} 
                    onChange={e => setFormData({ ...formData, location: e.target.value })} 
                    placeholder="e.g. Bangalore, India" 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Work Mode</label>
                  <div className="flex gap-2">
                    {["OFFICE", "REMOTE", "HYBRID"].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, workMode: mode })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          formData.workMode === mode 
                            ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                            : "bg-card text-foreground border-border hover:bg-muted"
                        )}
                      >
                        {mode.charAt(0) + mode.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 7: Selection Process */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Selection Process
              </h3>
              <div className="space-y-3">
                {formData.selectionProcess.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-sm text-muted-foreground">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={step.name} 
                        onChange={e => updateSelectionStep(idx, "name", e.target.value)} 
                        placeholder="Step Name (e.g. Online Test)"
                        className="h-9"
                      />
                      <Input 
                        value={step.description} 
                        onChange={e => updateSelectionStep(idx, "description", e.target.value)} 
                        placeholder="Description (Optional)"
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeSelectionStep(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSelectionStep} className="w-full mt-2 border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add Step
                </Button>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 8: Schedule */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Application Deadline *</label>
                  <Input 
                    type="datetime-local" 
                    value={formData.deadline} 
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Tentative Drive Date</label>
                  <Input 
                    type="date" 
                    value={formData.driveDate} 
                    onChange={e => setFormData({ ...formData, driveDate: e.target.value })} 
                  />
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-border/50"></div>

            {/* Section 9: Additional Notes */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Additional Information
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Job Description / Notes</label>
                <Textarea 
                  value={formData.jobDescription} 
                  onChange={e => setFormData({ ...formData, jobDescription: e.target.value })} 
                  placeholder="Any other details to show to students..."
                  rows={4}
                />
              </div>
            </section>
            
            <div className="h-8"></div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveDrive} disabled={isSubmitting}>
              {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {editingDriveId ? "Save Changes" : "Publish Drive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DRIVE DETAILS WINDOW-TYPE CARD MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-0 border-border bg-card shadow-2xl rounded-2xl">
          {selectedDrive && (
            <>
              {/* Window Title Bar */}
              <div className="px-6 py-4 border-b border-border/60 bg-muted/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {selectedDrive.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h2 className="text-lg font-bold text-foreground tracking-tight">{selectedDrive.companyName}</h2>
                      <Badge variant={
                        selectedDrive.status === "ACTIVE" ? "default" :
                        selectedDrive.status === "CLOSED" ? "destructive" :
                        selectedDrive.status === "UPCOMING" ? "outline" : "secondary"
                      } className="text-[10px] uppercase font-semibold">
                        {selectedDrive.status}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-semibold",
                        selectedDrive.driveType === "INTERNSHIP_FT" && "border-primary/30 bg-primary/10 text-primary",
                        selectedDrive.driveType === "FULL_TIME" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        selectedDrive.driveType === "INTERNSHIP_ONLY" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}>
                        {selectedDrive.driveType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center flex-wrap gap-2.5 text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{selectedDrive.jobRole}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" /> {selectedDrive.location} ({selectedDrive.workMode})
                      </span>
                      {selectedDrive.companyWebsite && (
                        <>
                          <span>•</span>
                          <a
                            href={selectedDrive.companyWebsite}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Visit Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      openEditDialog(selectedDrive);
                    }}
                    className="h-8 gap-1.5 text-xs border-input hover:bg-muted"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Drive</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(selectedDrive)}
                    className="h-8 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>

              {/* Window Content Body (Scrollable with Tabs) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Tabs defaultValue="roles" className="w-full">
                  <TabsList className="grid grid-cols-5 w-full bg-muted/40 p-1 border border-border/50 rounded-xl mb-6">
                    <TabsTrigger value="roles" className="text-xs font-semibold data-[state=active]:bg-card gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span>Roles & CTC ({selectedDrive.jobRoles?.length || 1})</span>
                    </TabsTrigger>
                    <TabsTrigger value="responsibilities" className="text-xs font-semibold data-[state=active]:bg-card gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-primary" />
                      <span>Responsibilities</span>
                    </TabsTrigger>
                    <TabsTrigger value="eligibility" className="text-xs font-semibold data-[state=active]:bg-card gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      <span>Eligibility</span>
                    </TabsTrigger>
                    <TabsTrigger value="process" className="text-xs font-semibold data-[state=active]:bg-card gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>Process</span>
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="text-xs font-semibold data-[state=active]:bg-card gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span>Logistics & Bond</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Job Roles & Compensation */}
                  <TabsContent value="roles" className="space-y-4 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedDrive.jobRoles && selectedDrive.jobRoles.length > 0 ? selectedDrive.jobRoles : [{
                        title: selectedDrive.jobRole,
                        type: selectedDrive.driveType === "INTERNSHIP_FT" ? "Internship + Full-Time" : selectedDrive.driveType === "FULL_TIME" ? "Full-Time" : "Internship",
                        stipend: selectedDrive.internshipStipend || 0,
                        duration: selectedDrive.internshipDuration || 6,
                        responsibilities: "",
                        ctcBreakdown: { fixed: selectedDrive.packageCtc * 100000, pb: 0, fyBonus: 0, syBonus: 0, total: selectedDrive.packageCtc * 100000 }
                      }]).map((role, idx) => (
                        <Card key={idx} className="border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden">
                          <CardHeader className="p-4 pb-3 border-b border-border/40 bg-muted/20">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base font-bold text-foreground">{role.title}</CardTitle>
                                <div className="text-xs text-muted-foreground mt-0.5">{role.type}</div>
                              </div>
                              <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30 bg-primary/10 shrink-0">
                                {role.ctcBreakdown?.total ? `₹${(role.ctcBreakdown.total / 100000).toFixed(2)} LPA` : "Stipend Only"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3.5 flex-1">
                            {(role.stipend > 0 || role.duration > 0) && (
                              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40">
                                {role.duration > 0 && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px]">Duration</span>
                                    <span className="font-semibold text-foreground">{role.duration} months</span>
                                  </div>
                                )}
                                {role.stipend > 0 && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px]">Stipend</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{role.stipend.toLocaleString()} /mo</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {role.ctcBreakdown && role.ctcBreakdown.total > 0 && (
                              <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5 space-y-2">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">CTC Breakdown Structure</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Fixed:</span>
                                    <span className="font-medium text-foreground">₹{role.ctcBreakdown.fixed.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Perf. Bonus:</span>
                                    <span className="font-medium text-foreground">₹{role.ctcBreakdown.pb.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">FY Bonus:</span>
                                    <span className="font-medium text-foreground">₹{role.ctcBreakdown.fyBonus.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">SY Bonus:</span>
                                    <span className="font-medium text-foreground">₹{role.ctcBreakdown.syBonus.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-bold">
                                  <span className="text-foreground">Total CTC Package:</span>
                                  <span className="text-primary text-sm font-extrabold">₹{role.ctcBreakdown.total.toLocaleString()}</span>
                                </div>
                              </div>
                            )}

                            {role.responsibilities && (
                              <div className="pt-2 border-t border-border/40 space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Role Deliverables</span>
                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all">{role.responsibilities}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Tab 2: Role Responsibilities */}
                  <TabsContent value="responsibilities" className="space-y-4 focus-visible:outline-none">
                    {selectedDrive.roleResponsibilities ? (
                      <Card className="border-border bg-card p-5 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">Core Responsibilities & Deliverables</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-border/50 font-sans">
                          {selectedDrive.roleResponsibilities}
                        </div>
                      </Card>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                        No general role responsibilities specified. Review individual role details below.
                      </div>
                    )}

                    {selectedDrive.jobRoles && selectedDrive.jobRoles.some(r => r.responsibilities) && (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-foreground block">Role-Specific Deliverables & Tasks</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedDrive.jobRoles.filter(r => r.responsibilities).map((role, idx) => (
                            <Card key={idx} className="border-border bg-card p-4 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">{role.title}</span>
                                <Badge variant="outline" className="text-[10px]">{role.type}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 rounded-lg border border-border/40 font-sans">
                                {role.responsibilities}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 2: Eligibility & Branches */}
                  <TabsContent value="eligibility" className="space-y-4 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-border bg-card p-4 space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Minimum CGPA</span>
                        <span className="text-2xl font-bold text-foreground">{selectedDrive.minCgpa}+</span>
                        <span className="text-[11px] text-muted-foreground block">Zero active backlogs preference</span>
                      </Card>
                      <Card className="border-border bg-card p-4 space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Active Backlogs Allowed</span>
                        <span className="text-2xl font-bold text-foreground">{selectedDrive.maxBacklogs}</span>
                        <span className="text-[11px] text-muted-foreground block">Maximum allowed backlogs</span>
                      </Card>
                      <Card className="border-border bg-card p-4 space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Eligible Batch</span>
                        <span className="text-2xl font-bold text-foreground">{selectedDrive.eligibleBatch}</span>
                        <span className="text-[11px] text-muted-foreground block">Graduating engineering year</span>
                      </Card>
                    </div>

                    <Card className="border-border bg-card p-5 space-y-3">
                      <span className="text-xs font-bold text-foreground block">Eligible Academic Disciplines</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedDrive.eligibleBranches.map((branch) => (
                          <Badge key={branch} variant="secondary" className="px-3 py-1 text-xs font-medium border border-border">
                            {branch}
                          </Badge>
                        ))}
                      </div>
                    </Card>

                    {selectedDrive.skillsRequired && selectedDrive.skillsRequired.length > 0 && (
                      <Card className="border-border bg-card p-5 space-y-3">
                        <span className="text-xs font-bold text-foreground block">Required Candidate Skills & Tech Stack</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedDrive.skillsRequired.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="px-3 py-1 text-xs border-primary/30 bg-primary/10 text-primary font-medium">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Tab 3: Selection Process */}
                  <TabsContent value="process" className="space-y-4 focus-visible:outline-none">
                    {selectedDrive.selectionProcess && selectedDrive.selectionProcess.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDrive.selectionProcess.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {step.step || idx + 1}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="font-bold text-sm text-foreground">{step.name}</div>
                              {step.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                        Standard recruitment stages (Resume Shortlisting, Assessments, Technical & HR rounds)
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 4: Logistics & Company */}
                  <TabsContent value="logistics" className="space-y-4 focus-visible:outline-none">
                    {selectedDrive.companyDescription && (
                      <Card className="border-border bg-card p-5 space-y-2">
                        <span className="text-xs font-bold text-foreground block">About {selectedDrive.companyName}</span>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedDrive.companyDescription}</p>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border-border bg-card p-4 space-y-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Application Deadline</span>
                        <div className="text-base font-bold text-destructive flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(selectedDrive.deadline)}</span>
                        </div>
                      </Card>

                      <Card className="border-border bg-card p-4 space-y-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Drive Date</span>
                        <div className="text-base font-bold text-foreground flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span>{formatDate(selectedDrive.driveDate)}</span>
                        </div>
                      </Card>
                    </div>

                    <Card className="border-border bg-card p-4 space-y-3">
                      <span className="text-xs font-bold text-foreground block">Onboarding & Location Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Primary Work Location</span>
                          <span className="font-semibold text-foreground">{selectedDrive.location}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Operating Work Mode</span>
                          <span className="font-semibold text-foreground">{selectedDrive.workMode}</span>
                        </div>
                        {selectedDrive.joiningTimeline && (
                          <div className="sm:col-span-2">
                            <span className="text-muted-foreground block text-[11px]">Tentative Joining Schedule</span>
                            <span className="font-semibold text-foreground">{selectedDrive.joiningTimeline}</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {selectedDrive.bondAmount !== null && selectedDrive.bondAmount > 0 && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Employment Bond & Security Conditions</span>
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          Security Amount: <span className="font-bold text-amber-600 dark:text-amber-400">₹{selectedDrive.bondAmount.toLocaleString()}</span>
                        </div>
                        {selectedDrive.bondConditions && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedDrive.bondConditions}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedDrive.jobDescription && (
                      <Card className="border-border bg-card p-5 space-y-2">
                        <span className="text-xs font-bold text-foreground block">Additional Remarks & Job Description</span>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedDrive.jobDescription}</p>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Window Footer */}
              <div className="px-6 py-4 border-t border-border/60 bg-muted/25 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-medium text-xs gap-1 py-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{selectedDrive.applicantCount || 0} Registered Candidates</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailsOpen(false)}
                    className="h-9 text-xs"
                  >
                    Close Window
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* REMOVE DRIVE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md border-border bg-card text-foreground">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Remove Placement Drive
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Confirm placement drive retirement and candidate application cleanup.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {driveToDelete && (
            <div className="space-y-3.5 py-1">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{driveToDelete.companyName}</span>
                  <Badge variant="outline" className="border-border text-xs">
                    {driveToDelete.applicantCount || 0} Applicants Enrolled
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{driveToDelete.jobRole}</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">₹{driveToDelete.packageCtc} LPA</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Location: <span className="text-foreground">{driveToDelete.location}</span>
                </div>
              </div>

              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Irreversible Action Warning
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                  Deleting this drive will permanently remove the recruitment campaign, associated candidate applications, and scheduled interview records.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDriveToDelete(null);
              }}
              disabled={isDeleting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteDrive}
              disabled={isDeleting}
              className="h-9 text-xs font-semibold gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Removing..." : "Confirm & Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
