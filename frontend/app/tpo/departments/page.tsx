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
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const { setSelectedDepartment } = useDepartment();

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

  // Navigate to /tpo/students filtered by department
  const handleExploreStudents = (deptCode: string) => {
    const fullName = DEPT_FULL_NAMES[deptCode] || deptCode;
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Top Header Strip ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Department Operations & Velocity
            </h1>
            <Badge variant="outline" className="border-orange-200 bg-orange-50/70 text-orange-700 font-medium">
              NIRF & NAAC Ready
            </Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Institutional overview of placement rates, salary bands, and faculty coordinators across degree branches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDepartments(true)}
            disabled={isRefreshing || isLoading}
            className="h-9 gap-1.5 text-stone-700 border-stone-200 bg-white hover:bg-stone-50"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-orange-600")} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export NIRF Report</span>
          </Button>
        </div>
      </div>

      {/* ─── Error Alert Banner (if any) ─── */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDepartments()}
            className="border-rose-300 text-rose-700 hover:bg-rose-100 h-8"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ─── 1. Executive Metric Strip (4 Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Branches */}
        <Card className="bg-white border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Academic Branches
              </span>
              <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {kpis.totalDepartments}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Active Programs
              </span>
            </div>
            <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-stone-400" />
              <span>{kpis.totalEnrolled} Total Enrolled Candidates</span>
            </div>
          </CardContent>
        </Card>

        {/* Overall Placement Velocity */}
        <Card className="bg-white border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Campus Placement %
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {kpis.overallPlacementRate}%
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-700">
                {kpis.totalPlaced} Placed
              </Badge>
            </div>
            <div className="mt-2 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis.overallPlacementRate)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Branch */}
        <Card className="bg-white border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Leading Placement Rate
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {kpis.topPerformingDept}
              </span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                #1 Ranking
              </span>
            </div>
            <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Fastest cohort placement conversion</span>
            </div>
          </CardContent>
        </Card>

        {/* Highest Average Package */}
        <Card className="bg-white border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Highest Average CTC
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {kpis.highestAvgCtcDept}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 bg-blue-50 text-blue-700">
                Top Pay Band
              </Badge>
            </div>
            <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-stone-400" />
              <span>Leading premium tech salary offers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Interactive Department Cards Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Branch Performance & Operations</h2>
            <p className="text-xs text-stone-500">
              Departmental progress against annual placement targets, CTC bands, and faculty coordinators.
            </p>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            {departments.length} Branches Registered
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse bg-white border-stone-200 p-5 h-72">
                <div className="h-6 w-28 bg-stone-200 rounded-md mb-4" />
                <div className="h-4 w-44 bg-stone-100 rounded-md mb-6" />
                <div className="h-2 w-full bg-stone-100 rounded-full mb-6" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-10 bg-stone-100 rounded-md" />
                  <div className="h-10 bg-stone-100 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => {
              const isAboveTarget = dept.placementRate >= (dept.coordinator.targetPlacementRate || 80);
              const isNearTarget = dept.placementRate >= (dept.coordinator.targetPlacementRate || 80) - 10;

              return (
                <Card
                  key={dept.code}
                  className="bg-white border-stone-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-100 shrink-0">
                          {dept.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-neutral-900">
                              {dept.code}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-medium",
                                isAboveTarget
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : isNearTarget
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                              )}
                            >
                              {isAboveTarget ? "Target Met" : isNearTarget ? "In Progress" : "Action Required"}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1">
                            {dept.name}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenSheet(dept)}
                        className="h-8 w-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100 shrink-0"
                        title="View Detailed Analytics"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress Bar Against Target */}
                    <div className="mt-4 pt-1">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-neutral-800">
                          {dept.placementRate}% <span className="text-stone-400 font-normal">placed</span>
                        </span>
                        <span className="text-stone-500 text-[11px]">
                          Target: <span className="font-semibold text-neutral-700">{dept.coordinator.targetPlacementRate || 80}%</span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            isAboveTarget ? "bg-emerald-500" : isNearTarget ? "bg-orange-500" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.min(100, dept.placementRate)}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-1 space-y-4">
                    {/* Numbers Matrix */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-stone-50/75 border border-stone-100 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Enrolled / Placed</span>
                        <span className="font-bold text-neutral-800 text-sm">
                          {dept.placedStudents} / {dept.totalStudents}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Eligible (0 Backlogs)</span>
                        <span className="font-bold text-neutral-800 text-sm">
                          {dept.eligibleStudents} <span className="text-[10px] text-stone-400 font-normal">students</span>
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-stone-200/60">
                        <span className="text-stone-400 block text-[11px]">Average CTC</span>
                        <span className="font-bold text-neutral-800 text-sm text-emerald-700">
                          ₹{dept.avgCtc.toFixed(1)} <span className="text-[10px] font-normal">LPA</span>
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-stone-200/60">
                        <span className="text-stone-400 block text-[11px]">Peak Package</span>
                        <span className="font-bold text-neutral-800 text-sm text-orange-600">
                          ₹{dept.highestCtc.toFixed(1)} <span className="text-[10px] font-normal">LPA</span>
                        </span>
                      </div>
                    </div>

                    {/* Faculty Coordinator Info Card */}
                    <div className="rounded-lg border border-stone-150 p-3 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-stone-200 bg-stone-100 text-stone-700 text-[11px] font-semibold">
                            <AvatarFallback>
                              {dept.coordinator.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <span className="text-xs font-semibold text-neutral-900 block truncate">
                              {dept.coordinator.fullName}
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {dept.coordinator.designation}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenCoordinatorDialog(dept)}
                          className="h-7 w-7 text-stone-400 hover:text-orange-600 hover:bg-orange-50"
                          title="Edit Faculty Coordinator"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-500 border-t border-stone-100">
                        <a
                          href={`mailto:${dept.coordinator.email}`}
                          className="flex items-center gap-1 hover:text-orange-600 truncate transition-colors"
                          title={dept.coordinator.email}
                        >
                          <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                          <span className="truncate">{dept.coordinator.email.split("@")[0]}</span>
                        </a>
                        <a
                          href={`tel:${dept.coordinator.phone}`}
                          className="flex items-center gap-1 hover:text-orange-600 shrink-0 transition-colors"
                        >
                          <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                          <span>{dept.coordinator.phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Top Recruiters Badges */}
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block mb-1.5">
                        Key Recruiters
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.topRecruiters.map((company) => (
                          <Badge
                            key={company}
                            variant="secondary"
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] px-2 py-0 font-normal border-transparent"
                          >
                            {company}
                          </Badge>
                        ))}
                        {dept.matchingDrivesCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-stone-200 text-stone-500"
                          >
                            +{dept.matchingDrivesCount} Drives
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSheet(dept)}
                      className="flex-1 h-8.5 text-xs text-stone-700 border-stone-200 bg-white hover:bg-stone-50"
                    >
                      <BarChart2 className="h-3.5 w-3.5 mr-1 text-stone-500" />
                      Branch Insights
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExploreStudents(dept.code)}
                      className="flex-1 h-8.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-2xs"
                    >
                      <span>Explore Students</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 3. Institutional Comparison Matrix (NIRF / NAAC Table) ─── */}
      <Card className="bg-white border-stone-200/90 shadow-2xs">
        <CardHeader className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Institutional Accreditation Matrix
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-0.5">
              Standardized departmental placement reporting compliant with NIRF & NAAC Criterion 5.2.1
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder="Search branch or coordinator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 h-8.5 text-xs bg-stone-50/60 border-stone-200 focus:bg-white"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8.5 gap-1.5 text-xs text-stone-700 border-stone-200 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-stone-50/75">
              <TableRow className="border-b border-stone-200/80">
                <TableHead className="text-xs font-semibold text-stone-600 h-10">Department</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10">Faculty Lead</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-right">Intake</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-right">Eligible %</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10">Placement Velocity</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-right">Mean CTC</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-right">Max CTC</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-center">Active Drives</TableHead>
                <TableHead className="text-xs font-semibold text-stone-600 h-10 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-stone-500 text-sm">
                    No departments match &ldquo;{searchQuery}&rdquo;.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept) => {
                  const eligiblePct = dept.totalStudents > 0
                    ? ((dept.eligibleStudents / dept.totalStudents) * 100).toFixed(0)
                    : "0";

                  return (
                    <TableRow key={dept.code} className="hover:bg-stone-50/60 transition-colors">
                      {/* Department Code & Name */}
                      <TableCell className="py-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-md bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs">
                            {dept.code}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block leading-tight">
                              {dept.name}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Code: {dept.code}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Faculty Coordinator */}
                      <TableCell className="py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-800">
                            {dept.coordinator.fullName}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {dept.coordinator.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* Intake vs Enrolled */}
                      <TableCell className="py-3 text-xs text-right font-medium text-neutral-700">
                        {dept.totalStudents} / {dept.coordinator.intakeCapacity || 120}
                      </TableCell>

                      {/* Zero Backlogs Eligibility % */}
                      <TableCell className="py-3 text-xs text-right">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50/70 text-blue-700 font-medium text-[10px]"
                        >
                          {eligiblePct}% (0 Backlog)
                        </Badge>
                      </TableCell>

                      {/* Placement Rate with Progress Bar */}
                      <TableCell className="py-3 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-neutral-800">{dept.placementRate}%</span>
                            <span className="text-stone-400 text-[10px]">
                              {dept.placedStudents} Placed
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                dept.placementRate >= 80 ? "bg-emerald-500" : dept.placementRate >= 70 ? "bg-orange-500" : "bg-amber-500"
                              )}
                              style={{ width: `${Math.min(100, dept.placementRate)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Mean CTC */}
                      <TableCell className="py-3 text-xs text-right font-semibold text-emerald-700">
                        ₹{dept.avgCtc.toFixed(2)} LPA
                      </TableCell>

                      {/* Peak CTC */}
                      <TableCell className="py-3 text-xs text-right font-semibold text-orange-600">
                        ₹{dept.highestCtc.toFixed(2)} LPA
                      </TableCell>

                      {/* Active Drives */}
                      <TableCell className="py-3 text-xs text-center">
                        <Badge variant="secondary" className="bg-stone-100 text-stone-700 text-[10px] font-normal">
                          {dept.matchingDrivesCount} Active
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSheet(dept)}
                            className="h-7 w-7 text-stone-400 hover:text-stone-700"
                            title="Branch Insights"
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenCoordinatorDialog(dept)}
                            className="h-7 w-7 text-stone-400 hover:text-orange-600"
                            title="Edit Coordinator"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExploreStudents(dept.code)}
                            className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Explore Students Directory"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── 4. Slide-Over Branch Deep-Dive Drawer (Sheet) ─── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          {selectedDeptForSheet && (
            <>
              {/* Drawer Top Header */}
              <div className="p-6 pb-4 border-b border-stone-200 bg-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-11 w-11 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {selectedDeptForSheet.code.slice(0, 3)}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-neutral-900 leading-tight">
                      {selectedDeptForSheet.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-stone-500">
                      Department Code: {selectedDeptForSheet.code} • Academic Year 2025-26
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                    {selectedDeptForSheet.placementRate}% Placed
                  </Badge>
                  <Badge variant="outline" className="border-stone-200 text-stone-600">
                    {selectedDeptForSheet.placedStudents} / {selectedDeptForSheet.totalStudents} Candidates
                  </Badge>
                  <Badge variant="outline" className="border-orange-200 bg-orange-50/50 text-orange-700">
                    Avg: ₹{selectedDeptForSheet.avgCtc.toFixed(1)} LPA
                  </Badge>
                </div>
              </div>

              {/* Drawer Tabbed Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Tabs defaultValue="funnel" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-5 w-full bg-stone-100 p-1">
                    <TabsTrigger value="funnel" className="text-xs">Placement Funnel</TabsTrigger>
                    <TabsTrigger value="offers" className="text-xs">Top Placements</TabsTrigger>
                    <TabsTrigger value="governance" className="text-xs">Faculty Lead</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Funnel & Analytics */}
                  <TabsContent value="funnel" className="space-y-4">
                    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
                      <span className="text-xs font-bold text-neutral-900 block uppercase tracking-wider">
                        Enrollment to Offer Conversion
                      </span>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Total Enrolled Cohort</span>
                          <span className="font-bold text-neutral-800">{selectedDeptForSheet.totalStudents}</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                          <div className="bg-stone-500 h-2 rounded-full w-full" />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-stone-500">Placement-Eligible (0 Backlogs)</span>
                          <span className="font-bold text-neutral-800">
                            {selectedDeptForSheet.eligibleStudents} ({((selectedDeptForSheet.eligibleStudents / (selectedDeptForSheet.totalStudents || 1)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(selectedDeptForSheet.eligibleStudents / (selectedDeptForSheet.totalStudents || 1)) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-stone-500">Successfully Placed</span>
                          <span className="font-bold text-emerald-700">
                            {selectedDeptForSheet.placedStudents} ({selectedDeptForSheet.placementRate}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
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
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                      <span className="text-xs font-bold text-neutral-900 block uppercase tracking-wider">
                        Compensation Package Bands
                      </span>
                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="p-2.5 rounded-lg bg-orange-50/70 border border-orange-100">
                          <span className="text-[10px] text-orange-700 font-semibold block uppercase">Super Dream</span>
                          <span className="text-sm font-bold text-orange-950">&gt; 12 LPA</span>
                          <span className="text-[11px] text-stone-500 block mt-1">₹{selectedDeptForSheet.highestCtc.toFixed(1)} LPA Peak</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                          <span className="text-[10px] text-blue-700 font-semibold block uppercase">Dream CTC</span>
                          <span className="text-sm font-bold text-blue-950">6 - 12 LPA</span>
                          <span className="text-[11px] text-stone-500 block mt-1">₹{selectedDeptForSheet.avgCtc.toFixed(1)} LPA Mean</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                          <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Core Tier</span>
                          <span className="text-sm font-bold text-emerald-950">&lt; 6 LPA</span>
                          <span className="text-[11px] text-stone-500 block mt-1">Mass Recruiters</span>
                        </div>
                      </div>
                    </div>

                    {/* Recruiting Partners */}
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2.5">
                      <span className="text-xs font-bold text-neutral-900 block uppercase tracking-wider">
                        Campus Drive Engagement
                      </span>
                      <p className="text-xs text-stone-500">
                        {selectedDeptForSheet.matchingDrivesCount} ongoing recruitment drives have invited students from this branch.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedDeptForSheet.topRecruiters.map((recruiter) => (
                          <div
                            key={recruiter}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-xs text-stone-800 font-medium"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{recruiter}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Top Placements Preview */}
                  <TabsContent value="offers" className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Highest CTC Offers Secured
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleExploreStudents(selectedDeptForSheet.code)}
                        className="text-xs text-orange-600 p-0 h-auto font-medium"
                      >
                        View all students &rarr;
                      </Button>
                    </div>

                    {selectedDeptForSheet.topPlacedStudents && selectedDeptForSheet.topPlacedStudents.length > 0 ? (
                      selectedDeptForSheet.topPlacedStudents.map((candidate, idx) => (
                        <div
                          key={candidate.id || idx}
                          className="rounded-xl border border-stone-200 p-3.5 bg-white flex items-center justify-between shadow-2xs hover:border-orange-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                              {candidate.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-neutral-900 block">
                                {candidate.name}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {candidate.rollNumber} • CGPA: {candidate.cgpa}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 block">
                              ₹{candidate.packageCtc.toFixed(1)} LPA
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">
                              {candidate.company}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-400">
                        No individual placement records available for this branch yet.
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Coordinator & Governance */}
                  <TabsContent value="governance" className="space-y-4">
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                        <div>
                          <span className="text-sm font-bold text-neutral-900 block">
                            {selectedDeptForSheet.coordinator.fullName}
                          </span>
                          <span className="text-xs text-stone-500">
                            {selectedDeptForSheet.coordinator.designation}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCoordinatorDialog(selectedDeptForSheet)}
                          className="h-8 gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </Button>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Mail className="h-4 w-4 text-stone-400" />
                          <span>{selectedDeptForSheet.coordinator.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-600">
                          <Phone className="h-4 w-4 text-stone-400" />
                          <span>{selectedDeptForSheet.coordinator.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-600">
                          <Building2 className="h-4 w-4 text-stone-400" />
                          <span>{selectedDeptForSheet.coordinator.office}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-stone-50/75 p-4 space-y-2 text-xs">
                      <span className="font-bold text-neutral-800 block uppercase tracking-wider text-[11px]">
                        Annual Accreditation Target
                      </span>
                      <p className="text-stone-500">
                        The department has set an institutional target to achieve at least{" "}
                        <strong className="text-neutral-900">{selectedDeptForSheet.coordinator.targetPlacementRate}%</strong>{" "}
                        placement for the {selectedDeptForSheet.coordinator.intakeCapacity || 120} enrolled students.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-stone-200 bg-stone-50/80 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSheetOpen(false)}
                  className="flex-1 h-9 text-stone-600 border-stone-200"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsSheetOpen(false);
                    handleExploreStudents(selectedDeptForSheet.code);
                  }}
                  className="flex-1 h-9 bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
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
        <DialogContent className="sm:max-w-lg bg-white rounded-xl p-6">
          <DialogHeader className="pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold text-neutral-900">
                Configure Coordinator & Targets
              </DialogTitle>
              {selectedDeptForDialog && (
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 font-bold">
                  {selectedDeptForDialog.code}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-stone-500">
              Update the official faculty placement representative and accreditation targets for this branch.
            </DialogDescription>
          </DialogHeader>

          {saveSuccessMsg ? (
            <div className="py-6 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-emerald-800">{saveSuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveCoordinator} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700">Faculty Coordinator Full Name</label>
                  <Input
                    required
                    value={coordinatorForm.fullName}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Chandra"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700">Academic Designation</label>
                  <Input
                    required
                    value={coordinatorForm.designation}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, designation: e.target.value })}
                    placeholder="e.g. Professor & Head of Placements"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Official Email</label>
                  <Input
                    type="email"
                    required
                    value={coordinatorForm.email}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, email: e.target.value })}
                    placeholder="coordinator@college.edu"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Phone Number</label>
                  <Input
                    type="tel"
                    required
                    value={coordinatorForm.phone}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700">Faculty Office Location</label>
                  <Input
                    value={coordinatorForm.office}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, office: e.target.value })}
                    placeholder="e.g. Tech Block A, Room 304"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Approved Intake Capacity</label>
                  <Input
                    type="number"
                    min={30}
                    max={600}
                    value={coordinatorForm.intakeCapacity}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, intakeCapacity: parseInt(e.target.value, 10) || 120 })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Placement Target Goal (%)</label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={coordinatorForm.targetPlacementRate}
                    onChange={(e) => setCoordinatorForm({ ...coordinatorForm, targetPlacementRate: parseFloat(e.target.value) || 80 })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
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
                  className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSavingCoordinator ? "Saving..." : "Save Coordinator"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
