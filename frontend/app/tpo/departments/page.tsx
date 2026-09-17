"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Search,
  Download,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart2,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDepartment } from "@/contexts/DepartmentContext";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* ─── Interfaces ─── */
interface FacultyCoordinator {
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  office: string;
  intakeCapacity: number;
  targetPlacementRate: number;
}

interface TopPlacedStudent {
  id: string;
  rollNumber: string;
  name: string;
  cgpa: number;
  company: string;
  packageCtc: number;
}

interface DepartmentData {
  code: string;
  name: string;
  totalStudents: number;
  placedStudents: number;
  eligibleStudents: number;
  placementRate: number;
  avgCtc: number;
  highestCtc: number;
  matchingDrivesCount: number;
  topRecruiters: string[];
  coordinator: FacultyCoordinator;
  topPlacedStudents: TopPlacedStudent[];
}

interface DepartmentKpis {
  totalDepartments: number;
  overallPlacementRate: number;
  topPerformingDept: string;
  highestAvgCtcDept: string;
  totalEnrolled: number;
  totalPlaced: number;
}

const DEPT_FULL_NAMES: Record<string, string> = {
  CSE: "Computer Science Engineering",
  IT: "Information Technology",
  ECE: "Electronics & Communication",
  MECH: "Mechanical Engineering",
  CIVIL: "Civil Engineering",
  "AI & DS": "Artificial Intelligence & DS",
};

export default function DepartmentsPage() {
  const router = useRouter();
  const { setSelectedDepartment, refreshDepartments } = useDepartment();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [kpis, setKpis] = useState<DepartmentKpis>({
    totalDepartments: 6,
    overallPlacementRate: 0,
    topPerformingDept: "CSE",
    highestAvgCtcDept: "AI & DS",
    totalEnrolled: 0,
    totalPlaced: 0,
  });

  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Sheet (Drawer) State
  const [selectedDeptForSheet, setSelectedDeptForSheet] = useState<DepartmentData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Dialog (Coordinator Edit) State
  const [selectedDeptForDialog, setSelectedDeptForDialog] = useState<DepartmentData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSavingCoordinator, setIsSavingCoordinator] = useState(false);
  const [coordinatorForm, setCoordinatorForm] = useState<FacultyCoordinator>({
    fullName: "",
    designation: "",
    email: "",
    phone: "",
    office: "",
    intakeCapacity: 120,
    targetPlacementRate: 80,
  });

  // Success message badge
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Add Branch Dialog State
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [addDeptError, setAddDeptError] = useState("");
  const [newDeptForm, setNewDeptForm] = useState({
    code: "",
    name: "",
    intakeCapacity: 120,
    targetPlacementRate: 80,
    coordinatorFullName: "",
    coordinatorDesignation: "Placement Coordinator",
    coordinatorEmail: "",
    coordinatorPhone: "",
    coordinatorOffice: "Faculty Wing",
  });

  // Remove Branch Dialog State
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentData | null>(null);
  const [isDeletingDept, setIsDeletingDept] = useState(false);
  const [deleteDeptError, setDeleteDeptError] = useState("");

  // Fetch departments data
  const fetchDepartments = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiClient.get<{
        kpis: DepartmentKpis;
        departments: DepartmentData[];
      }>("/tpo/departments");

      if (data?.departments) {
        setDepartments(data.departments);
      }
      if (data?.kpis) {
        setKpis(data.kpis);
      }
    } catch (err: any) {
      console.error("Failed to load department analytics:", err);
      setErrorMessage(err.message || "Failed to load departmental placement records.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Filtered departments for comparison table
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.coordinator.fullName.toLowerCase().includes(q) ||
        d.topRecruiters.some((r) => r.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  const isAllSelected = filteredDepartments.length > 0 && filteredDepartments.every((d) => selectedRows[d.code]);
  const isSomeSelected = filteredDepartments.some((d) => selectedRows[d.code]) && !isAllSelected;
  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      filteredDepartments.forEach((d) => { next[d.code] = true; });
    }
    setSelectedRows(next);
  };
  const toggleSelectRow = (code: string) => {
    setSelectedRows((prev) => ({ ...prev, [code]: !prev[code] }));
  };
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  // Navigate to /tpo/students filtered by department
  const handleExploreStudents = (deptCode: string, deptName?: string) => {
    const fullName = deptName || DEPT_FULL_NAMES[deptCode] || deptCode;
    setSelectedDepartment(fullName);
    router.push(`/tpo/students`);
  };

  // Open Deep Dive Sheet
  const handleOpenSheet = (dept: DepartmentData) => {
    setSelectedDeptForSheet(dept);
    setIsSheetOpen(true);
  };

  // Open Coordinator Dialog
  const handleOpenCoordinatorDialog = (dept: DepartmentData) => {
    setSelectedDeptForDialog(dept);
    setCoordinatorForm({ ...dept.coordinator });
    setIsDialogOpen(true);
    setSaveSuccessMsg(null);
  };

  // Save Coordinator Form
  const handleSaveCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForDialog) return;

    setIsSavingCoordinator(true);
    try {
      await apiClient.post("/tpo/departments/coordinator", {
        departmentCode: selectedDeptForDialog.code,
        ...coordinatorForm,
      });

      // Update state locally
      setDepartments((prev) =>
        prev.map((d) =>
          d.code === selectedDeptForDialog.code
            ? { ...d, coordinator: { ...coordinatorForm } }
            : d
        )
      );

      if (selectedDeptForSheet?.code === selectedDeptForDialog.code) {
        setSelectedDeptForSheet((prev) =>
          prev ? { ...prev, coordinator: { ...coordinatorForm } } : null
        );
      }

      setSaveSuccessMsg(`Faculty Coordinator for ${selectedDeptForDialog.code} updated successfully!`);
      setTimeout(() => {
        setIsDialogOpen(false);
        setSaveSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      alert("Failed to update coordinator: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingCoordinator(false);
    }
  };

  // Add Department / Academic Branch
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDept(true);
    setAddDeptError("");

    const trimmedCode = newDeptForm.code.trim().toUpperCase();
    const trimmedName = newDeptForm.name.trim();

    if (!trimmedCode || !trimmedName) {
      setAddDeptError("Branch code and department name are required.");
      setIsAddingDept(false);
      return;
    }

    try {
      const payload = {
        code: trimmedCode,
        name: trimmedName,
        intakeCapacity: Number(newDeptForm.intakeCapacity) || 120,
        targetPlacementRate: Number(newDeptForm.targetPlacementRate) || 80,
        coordinator: {
          fullName: newDeptForm.coordinatorFullName.trim() || "Faculty Placement Lead",
          designation: newDeptForm.coordinatorDesignation.trim() || "Placement Coordinator",
          email: newDeptForm.coordinatorEmail.trim() || `${trimmedCode.toLowerCase()}coordinator@college.edu`,
          phone: newDeptForm.coordinatorPhone.trim() || "+91 98765 00000",
          office: newDeptForm.coordinatorOffice.trim() || "Faculty Wing",
          intakeCapacity: Number(newDeptForm.intakeCapacity) || 120,
          targetPlacementRate: Number(newDeptForm.targetPlacementRate) || 80,
        },
      };

      await apiClient.post("/tpo/departments", payload);

      setIsAddDeptModalOpen(false);
      setNewDeptForm({
        code: "",
        name: "",
        intakeCapacity: 120,
        targetPlacementRate: 80,
        coordinatorFullName: "",
        coordinatorDesignation: "Placement Coordinator",
        coordinatorEmail: "",
        coordinatorPhone: "",
        coordinatorOffice: "Faculty Wing",
      });
      await fetchDepartments(true);
      await refreshDepartments();
    } catch (err: any) {
      setAddDeptError(err.message || "Failed to register branch.");
    } finally {
      setIsAddingDept(false);
    }
  };

  // Remove Department Modal and Handler
  const handleOpenDeleteModal = (dept: DepartmentData) => {
    setDeptToDelete(dept);
    setDeleteDeptError("");
    setIsDeleteDeptModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeletingDept(true);
    setDeleteDeptError("");

    try {
      await apiClient.delete(`/tpo/departments/${encodeURIComponent(deptToDelete.code)}?force=true`);
      setIsDeleteDeptModalOpen(false);
      setDeptToDelete(null);
      await fetchDepartments(true);
      await refreshDepartments();
    } catch (err: any) {
      setDeleteDeptError(err.message || "Failed to remove department branch.");
    } finally {
      setIsDeletingDept(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (departments.length === 0) return;

    const headers = [
      "Branch Code",
      "Department Name",
      "Total Enrolled",
      "Eligible Students",
      "Placed Students",
      "Placement Rate (%)",
      "Average Package (LPA)",
      "Peak Package (LPA)",
      "Active Drives",
      "Faculty Coordinator",
      "Coordinator Email",
      "Coordinator Phone",
      "Target Rate (%)",
    ];

    const rows = departments.map((d) => [
      `"${d.code}"`,
      `"${d.name}"`,
      d.totalStudents,
      d.eligibleStudents,
      d.placedStudents,
      d.placementRate,
      d.avgCtc,
      d.highestCtc,
      d.matchingDrivesCount,
      `"${d.coordinator.fullName}"`,
      `"${d.coordinator.email}"`,
      `"${d.coordinator.phone}"`,
      d.coordinator.targetPlacementRate,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `PlacementOS_Departments_NIRF_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ─── Top Action Bar ─── */}
      <div className="flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDepartments(true)}
          disabled={isRefreshing || isLoading}
          className="h-9 gap-1.5 border-input bg-background hover:bg-muted text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="h-9 gap-1.5 border-input bg-background hover:bg-muted text-foreground"
        >
          <Download className="h-4 w-4" />
          <span>Export NIRF Report</span>
        </Button>

        <Button
          size="sm"
          onClick={() => setIsAddDeptModalOpen(true)}
          className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Add Branch</span>
        </Button>
      </div>

      {/* ─── Error Alert Banner (if any) ─── */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between text-destructive text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDepartments()}
            className="border-destructive/40 text-destructive hover:bg-destructive/20 h-8"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ─── 1. Executive Metric Strip (4 Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Total Active Branches */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-5 sm:p-5.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Academic Branches
              </span>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Building2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.totalDepartments}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Active Programs
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{kpis.totalEnrolled} Total Enrolled Candidates</span>
            </div>
          </CardContent>
        </Card>

        {/* Overall Placement Velocity */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-5 sm:p-5.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Campus Placement %
              </span>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.overallPlacementRate}%
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {kpis.totalPlaced} Placed
              </Badge>
            </div>
            <div className="pt-2 border-t border-border/40 space-y-1.5">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpis.overallPlacementRate)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Branch */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-5 sm:p-5.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Leading Placement Rate
              </span>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Award className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.topPerformingDept}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                #1 Ranking
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Fastest cohort placement conversion</span>
            </div>
          </CardContent>
        </Card>

        {/* Highest Average Package */}
        <Card className="border-border bg-card shadow-xs transition-shadow">
          <CardContent className="p-5 sm:p-5.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Highest Average CTC
              </span>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {kpis.highestAvgCtcDept}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Top Pay Band
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Leading premium tech salary offers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Interactive Department Cards Grid ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Branch Performance & Operations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Departmental progress against annual placement targets, CTC bands, and faculty coordinators.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-md border border-border/40">
              {departments.length} Branches Registered
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDeptModalOpen(true)}
              className="h-8 gap-1.5 text-xs border-input hover:bg-muted font-medium"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>New Branch</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-border bg-card p-6 h-80">
                <div className="h-6 w-28 bg-muted rounded-md mb-4" />
                <div className="h-4 w-44 bg-muted/60 rounded-md mb-6" />
                <div className="h-2 w-full bg-muted/60 rounded-full mb-6" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-10 bg-muted/60 rounded-md" />
                  <div className="h-10 bg-muted/60 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const isAboveTarget = dept.placementRate >= (dept.coordinator.targetPlacementRate || 80);
              const isNearTarget = dept.placementRate >= (dept.coordinator.targetPlacementRate || 80) - 10;

              return (
                <Card
                  key={dept.code}
                  className="border-border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <CardHeader className="p-6 pb-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                          {dept.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-foreground">
                              {dept.code}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 font-medium",
                                isAboveTarget
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : isNearTarget
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {isAboveTarget ? "Target Met" : isNearTarget ? "In Progress" : "Action Required"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {dept.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8.5 w-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
                              title="Branch options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs font-semibold">{dept.code} Department</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleOpenSheet(dept)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              Branch Insights
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenCoordinatorDialog(dept)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              Edit Coordinator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExploreStudents(dept.code, dept.name)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              Explore Students
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteModal(dept)}
                              className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove Branch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenSheet(dept)}
                          className="h-8.5 w-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
                          title="View Detailed Analytics"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar Against Target */}
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          {dept.placementRate}% <span className="text-muted-foreground font-normal">placed</span>
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          Target: <span className="font-semibold text-foreground">{dept.coordinator.targetPlacementRate || 80}%</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            isAboveTarget ? "bg-emerald-500" : isNearTarget ? "bg-primary" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.min(100, dept.placementRate)}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-5">
                    {/* Numbers Matrix */}
                    <div className="rounded-xl border border-border/70 bg-muted/35 dark:bg-zinc-900/50 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs">
                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-1">
                            Enrolled / Placed
                          </span>
                          <span className="font-bold text-foreground text-sm">
                            {dept.placedStudents} / {dept.totalStudents}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-1">
                            Eligible (0 Backlogs)
                          </span>
                          <span className="font-bold text-foreground text-sm">
                            {dept.eligibleStudents} <span className="text-[11px] text-muted-foreground font-normal">students</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs pt-3 border-t border-border/50">
                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-1">
                            Average CTC
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            ₹{dept.avgCtc.toFixed(1)} <span className="text-[11px] font-normal text-muted-foreground">LPA</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-1">
                            Peak Package
                          </span>
                          <span className="font-bold text-primary text-sm">
                            ₹{dept.highestCtc.toFixed(1)} <span className="text-[11px] font-normal text-muted-foreground">LPA</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Coordinator Info Card */}
                    <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-border bg-muted text-foreground text-xs font-semibold">
                            <AvatarFallback>
                              {dept.coordinator.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <span className="text-xs font-semibold text-foreground block truncate">
                              {dept.coordinator.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              {dept.coordinator.designation}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenCoordinatorDialog(dept)}
                          className="h-7.5 w-7.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit Faculty Coordinator"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2.5 text-xs text-muted-foreground border-t border-border/40">
                        <a
                          href={`mailto:${dept.coordinator.email}`}
                          className="flex items-center gap-1.5 hover:text-foreground truncate transition-colors"
                          title={dept.coordinator.email}
                        >
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span className="truncate">{dept.coordinator.email.split("@")[0]}</span>
                        </a>
                        <a
                          href={`tel:${dept.coordinator.phone}`}
                          className="flex items-center gap-1.5 hover:text-foreground shrink-0 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span>{dept.coordinator.phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Top Recruiters Badges */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        Key Recruiters
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {dept.topRecruiters.map((company) => (
                          <Badge
                            key={company}
                            variant="secondary"
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs px-2.5 py-1 font-normal border border-border/40 rounded-md transition-colors"
                          >
                            {company}
                          </Badge>
                        ))}
                        {dept.matchingDrivesCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2.5 py-1 border-primary/30 bg-primary/10 text-primary font-medium rounded-md"
                          >
                            +{dept.matchingDrivesCount} Drives
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSheet(dept)}
                      className="flex-1 h-9.5 text-xs font-medium border-input bg-transparent hover:bg-muted text-foreground transition-colors"
                    >
                      <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      Branch Insights
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExploreStudents(dept.code)}
                      className="flex-1 h-9.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors"
                    >
                      <span>Explore Students</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 3. Institutional Comparison Matrix (Official shadcn Data Table) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              placeholder="Filter branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm h-9 bg-transparent border-input text-sm"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-sm font-medium border-input"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-10 px-4">
                  <Checkbox
                    checked={isAllSelected || (isSomeSelected && "indeterminate")}
                    onCheckedChange={(val) => toggleSelectAll(!!val)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Department</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Faculty Lead</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right">Intake</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right">Eligible</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Placement Velocity</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right">Mean CTC</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right">Peak CTC</TableHead>
                <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-center">Active Drives</TableHead>
                <TableHead className="w-10 px-4 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground text-sm">
                    No departments match &ldquo;{searchQuery}&rdquo;.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept) => {
                  const eligiblePct = dept.totalStudents > 0
                    ? ((dept.eligibleStudents / dept.totalStudents) * 100).toFixed(0)
                    : "0";
                  const isSelected = !!selectedRows[dept.code];

                  return (
                    <TableRow
                      key={dept.code}
                      data-state={isSelected && "selected"}
                      className="border-b border-border hover:bg-muted/50 data-[state=selected]:bg-muted/50 transition-colors"
                    >
                      {/* Checkbox */}
                      <TableCell className="p-4 w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(dept.code)}
                          aria-label={`Select ${dept.code}`}
                        />
                      </TableCell>

                      {/* Department Code & Name */}
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-sm text-foreground">
                            {dept.code}
                          </span>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            • {dept.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Faculty Coordinator */}
                      <TableCell className="p-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-normal text-foreground">
                            {dept.coordinator.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dept.coordinator.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* Intake vs Enrolled */}
                      <TableCell className="p-4 text-sm text-right text-foreground">
                        {dept.totalStudents} / {dept.coordinator.intakeCapacity || 120}
                      </TableCell>

                      {/* Zero Backlogs Eligibility % */}
                      <TableCell className="p-4 text-sm text-right text-foreground">
                        {eligiblePct}%
                      </TableCell>

                      {/* Placement Rate with Progress Bar */}
                      <TableCell className="p-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{dept.placementRate}%</span>
                            <span className="text-muted-foreground text-xs">
                              {dept.placedStudents} Placed
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                dept.placementRate >= 80 ? "bg-emerald-500" : dept.placementRate >= 70 ? "bg-primary" : "bg-amber-500"
                              )}
                              style={{ width: `${Math.min(100, dept.placementRate)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Mean CTC */}
                      <TableCell className="p-4 text-sm text-right font-medium text-foreground">
                        ₹{dept.avgCtc.toFixed(2)} LPA
                      </TableCell>

                      {/* Peak CTC */}
                      <TableCell className="p-4 text-sm text-right font-medium text-foreground">
                        ₹{dept.highestCtc.toFixed(2)} LPA
                      </TableCell>

                      {/* Active Drives */}
                      <TableCell className="p-4 text-sm text-center text-muted-foreground">
                        {dept.matchingDrivesCount}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              aria-label="Branch actions"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleOpenSheet(dept)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              Branch Insights
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenCoordinatorDialog(dept)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              Edit Coordinator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExploreStudents(dept.code, dept.name)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              Explore Students
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteModal(dept)}
                              className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove Branch
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

        {/* ─── shadcn Data Table Pagination & Info Bar (Identical to Screenshot) ─── */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedCount} of {filteredDepartments.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-3 text-sm font-medium"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-3 text-sm font-medium"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 4. Slide-Over Branch Deep-Dive Drawer (Sheet) ─── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col border-l border-border bg-card">
          {selectedDeptForSheet && (
            <>
              {/* Drawer Top Header */}
              <div className="p-6 pb-4 border-b border-border bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
                    {selectedDeptForSheet.code.slice(0, 3)}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-foreground leading-tight">
                      {selectedDeptForSheet.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                      Department Code: {selectedDeptForSheet.code} • Academic Year 2025-26
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
                    {selectedDeptForSheet.placementRate}% Placed
                  </Badge>
                  <Badge variant="outline" className="border-border text-foreground">
                    {selectedDeptForSheet.placedStudents} / {selectedDeptForSheet.totalStudents} Candidates
                  </Badge>
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    Avg: ₹{selectedDeptForSheet.avgCtc.toFixed(1)} LPA
                  </Badge>
                </div>
              </div>

              {/* Drawer Tabbed Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Tabs defaultValue="funnel" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-5 w-full bg-muted p-1">
                    <TabsTrigger value="funnel" className="text-xs">Placement Funnel</TabsTrigger>
                    <TabsTrigger value="offers" className="text-xs">Top Placements</TabsTrigger>
                    <TabsTrigger value="governance" className="text-xs">Faculty Lead</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Funnel & Analytics */}
                  <TabsContent value="funnel" className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
                      <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                        Enrollment to Offer Conversion
                      </span>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Enrolled Cohort</span>
                          <span className="font-bold text-foreground">{selectedDeptForSheet.totalStudents}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-muted-foreground/60 h-2 rounded-full w-full" />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-muted-foreground">Placement-Eligible (0 Backlogs)</span>
                          <span className="font-bold text-foreground">
                            {selectedDeptForSheet.eligibleStudents} ({((selectedDeptForSheet.eligibleStudents / (selectedDeptForSheet.totalStudents || 1)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(selectedDeptForSheet.eligibleStudents / (selectedDeptForSheet.totalStudents || 1)) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-muted-foreground">Successfully Placed</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedDeptForSheet.placedStudents} ({selectedDeptForSheet.placementRate}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, selectedDeptForSheet.placementRate)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTC Tier Breakdown */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                      <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                        Compensation Package Bands
                      </span>
                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-[10px] text-primary font-semibold block uppercase">Super Dream</span>
                          <span className="text-sm font-bold text-foreground">&gt; 12 LPA</span>
                          <span className="text-[11px] text-muted-foreground block mt-1">₹{selectedDeptForSheet.highestCtc.toFixed(1)} LPA Peak</span>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold block uppercase">Dream CTC</span>
                          <span className="text-sm font-bold text-foreground">6 - 12 LPA</span>
                          <span className="text-[11px] text-muted-foreground block mt-1">₹{selectedDeptForSheet.avgCtc.toFixed(1)} LPA Mean</span>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold block uppercase">Core Tier</span>
                          <span className="text-sm font-bold text-foreground">&lt; 6 LPA</span>
                          <span className="text-[11px] text-muted-foreground block mt-1">Mass Recruiters</span>
                        </div>
                      </div>
                    </div>

                    {/* Recruiting Partners */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2.5">
                      <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                        Campus Drive Engagement
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {selectedDeptForSheet.matchingDrivesCount} ongoing recruitment drives have invited students from this branch.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedDeptForSheet.topRecruiters.map((recruiter) => (
                          <div
                            key={recruiter}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs text-secondary-foreground font-medium border border-border/40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{recruiter}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Top Placements Preview */}
                  <TabsContent value="offers" className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Highest CTC Offers Secured
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleExploreStudents(selectedDeptForSheet.code)}
                        className="text-xs text-primary p-0 h-auto font-medium"
                      >
                        View all students &rarr;
                      </Button>
                    </div>

                    {selectedDeptForSheet.topPlacedStudents && selectedDeptForSheet.topPlacedStudents.length > 0 ? (
                      selectedDeptForSheet.topPlacedStudents.map((candidate, idx) => (
                        <div
                          key={candidate.id || idx}
                          className="rounded-xl border border-border/70 p-4 bg-card flex items-center justify-between shadow-2xs hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                              {candidate.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {candidate.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {candidate.rollNumber} • CGPA: {candidate.cgpa}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                              ₹{candidate.packageCtc.toFixed(1)} LPA
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {candidate.company}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-border/70 p-8 text-center text-xs text-muted-foreground">
                        No individual placement records available for this branch yet.
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Coordinator & Governance */}
                  <TabsContent value="governance" className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div>
                          <span className="text-sm font-bold text-foreground block">
                            {selectedDeptForSheet.coordinator.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {selectedDeptForSheet.coordinator.designation}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCoordinatorDialog(selectedDeptForSheet)}
                          className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </Button>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 text-muted-foreground/70" />
                          <span>{selectedDeptForSheet.coordinator.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 text-muted-foreground/70" />
                          <span>{selectedDeptForSheet.coordinator.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4 text-muted-foreground/70" />
                          <span>{selectedDeptForSheet.coordinator.office}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2 text-xs">
                      <span className="font-bold text-foreground block uppercase tracking-wider text-[11px]">
                        Annual Accreditation Target
                      </span>
                      <p className="text-muted-foreground">
                        The department has set an institutional target to achieve at least{" "}
                        <strong className="text-foreground">{selectedDeptForSheet.coordinator.targetPlacementRate}%</strong>{" "}
                        placement for the {selectedDeptForSheet.coordinator.intakeCapacity || 120} enrolled students.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-card flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSheetOpen(false)}
                  className="flex-1 h-9 text-muted-foreground border-input hover:text-foreground"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsSheetOpen(false);
                    handleExploreStudents(selectedDeptForSheet.code);
                  }}
                  className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                >
                  <span>Explore Student Roster</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── 5. Configure Coordinator Modal (Dialog) ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border text-foreground rounded-xl p-6">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold text-foreground">
                Configure Coordinator & Targets
              </DialogTitle>
              {selectedDeptForDialog && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-bold">
                  {selectedDeptForDialog.code}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the official faculty placement representative and accreditation targets for this branch.
            </DialogDescription>
          </DialogHeader>

          {saveSuccessMsg ? (
            <div className="py-6 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{saveSuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveCoordinator} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Faculty Coordinator Full Name</label>
                  <Input
                    required
                    value={coordinatorForm.fullName}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Chandra"
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Academic Designation</label>
                  <Input
                    required
                    value={coordinatorForm.designation}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, designation: e.target.value })}
                    placeholder="e.g. Professor & Head of Placements"
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Official Email</label>
                  <Input
                    type="email"
                    required
                    value={coordinatorForm.email}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, email: e.target.value })}
                    placeholder="coordinator@college.edu"
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input
                    type="tel"
                    required
                    value={coordinatorForm.phone}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Faculty Office Location</label>
                  <Input
                    value={coordinatorForm.office}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, office: e.target.value })}
                    placeholder="e.g. Tech Block A, Room 304"
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Approved Intake Capacity</label>
                  <Input
                    type="number"
                    min={30}
                    max={600}
                    value={coordinatorForm.intakeCapacity}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, intakeCapacity: parseInt(e.target.value, 10) || 120 })}
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Placement Target Goal (%)</label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={coordinatorForm.targetPlacementRate}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, targetPlacementRate: parseFloat(e.target.value) || 80 })}
                    className="h-9 text-xs border-input bg-background"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSavingCoordinator}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingCoordinator}
                  className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSavingCoordinator ? "Saving..." : "Save Coordinator"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Add Branch Modal ─── */}
      <Dialog open={isAddDeptModalOpen} onOpenChange={setIsAddDeptModalOpen}>
        <DialogContent className="max-w-xl border-border bg-card text-foreground">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Register Academic Branch
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Enroll a new degree discipline into institutional tracking, velocity metrics, and NIRF audits.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {addDeptError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{addDeptError}</span>
            </div>
          )}

          <form onSubmit={handleAddDepartment} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Branch Code <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MECH, AIML, CSBS"
                  className="h-9 text-xs uppercase font-mono tracking-wider border-input bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Department Name <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  placeholder="e.g. Mechanical Engineering"
                  className="h-9 text-xs border-input bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Approved Intake Capacity</label>
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={newDeptForm.intakeCapacity}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, intakeCapacity: parseInt(e.target.value, 10) || 120 })}
                  className="h-9 text-xs border-input bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Placement Rate (%)</label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={newDeptForm.targetPlacementRate}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, targetPlacementRate: parseFloat(e.target.value) || 80 })}
                  className="h-9 text-xs border-input bg-background"
                />
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-border/50">
                <span className="text-xs font-semibold text-foreground block mb-2">
                  Faculty Placement Coordinator
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Coordinator Full Name</label>
                    <Input
                      value={newDeptForm.coordinatorFullName}
                      onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinatorFullName: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Verma"
                      className="h-8.5 text-xs border-input bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Academic Designation</label>
                    <Input
                      value={newDeptForm.coordinatorDesignation}
                      onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinatorDesignation: e.target.value })}
                      placeholder="e.g. Associate Professor & Lead"
                      className="h-8.5 text-xs border-input bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Official Email</label>
                    <Input
                      type="email"
                      value={newDeptForm.coordinatorEmail}
                      onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinatorEmail: e.target.value })}
                      placeholder="coordinator@college.edu"
                      className="h-8.5 text-xs border-input bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Phone Number</label>
                    <Input
                      type="tel"
                      value={newDeptForm.coordinatorPhone}
                      onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinatorPhone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="h-8.5 text-xs border-input bg-background"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] text-muted-foreground">Office Location</label>
                    <Input
                      value={newDeptForm.coordinatorOffice}
                      onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinatorOffice: e.target.value })}
                      placeholder="e.g. Engineering Wing, Room 302"
                      className="h-8.5 text-xs border-input bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddDeptModalOpen(false)}
                disabled={isAddingDept}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAddingDept}
                className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {isAddingDept ? "Registering..." : "Register Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Branch Confirmation Modal ─── */}
      <Dialog open={isDeleteDeptModalOpen} onOpenChange={setIsDeleteDeptModalOpen}>
        <DialogContent className="max-w-md border-border bg-card text-foreground">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Remove Academic Branch
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Confirm branch retirement from institutional placement tracking.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteDeptError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{deleteDeptError}</span>
            </div>
          )}

          {deptToDelete && (
            <div className="space-y-3.5 py-1">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{deptToDelete.code}</span>
                  <Badge variant="outline" className="border-border text-xs">
                    {deptToDelete.totalStudents} Candidates Enrolled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{deptToDelete.name}</p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  Faculty Lead: <span className="text-foreground font-medium">{deptToDelete.coordinator.fullName}</span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Candidate Data Protection Notice
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  Student profiles, applications, and selection records will <span className="font-semibold underline">remain completely intact</span> in the database. This action removes the branch from NIRF velocity analytics, coordinator oversight, and comparative dashboards.
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
                setIsDeleteDeptModalOpen(false);
                setDeptToDelete(null);
              }}
              disabled={isDeletingDept}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeletingDept}
              className="h-9 text-xs font-semibold gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeletingDept ? "Removing..." : "Confirm & Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
