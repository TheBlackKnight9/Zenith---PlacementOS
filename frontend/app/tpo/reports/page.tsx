"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  RefreshCw,
  Plus,
  ShieldCheck,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  UserCheck,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Interfaces ────────────────────────────────────────────────────────
interface ReportTemplate {
  id: string;
  name: string;
  badge: string;
  category: string;
  description: string;
  format: string[];
  fieldsCount: number;
}

interface NirfRow {
  academicYear: string;
  intakeCohort: number;
  admittedFirstYear: number;
  graduatedInMinTime: number;
  placedCount: number;
  medianSalaryInr: number;
  medianSalaryLpa: string;
  higherStudiesCount: number;
  placementRate: string;
}

interface NaacRow {
  serialNo: number;
  batchYear: number;
  rollNumber: string;
  studentName: string;
  department: string;
  studentEmail: string;
  studentPhone: string;
  employerName: string;
  designation: string;
  packageLpa: number;
  appointmentRefNo: string;
  offerDate: string;
}

interface UnplacedRow {
  serialNo: number;
  rollNumber: string;
  fullName: string;
  department: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  totalBacklogs: number;
  applicationsCount: number;
  skills: string;
  email: string;
  phone: string;
  actionRecommendation: string;
}

interface ReportArchiveItem {
  id: string;
  title: string;
  template: string;
  batchYear: number | string;
  department: string;
  recordCount: number;
  fileSize: string;
  format: string;
  generatedAt: string;
  author: string;
}

export default function TpoReportsPage() {
  const {
    selectedDepartment,
    selectedDepartmentCode,
    setSelectedDepartment,
    departments,
    isDepartmentMatch,
  } = useDepartment();

  const [batchYear, setBatchYear] = useState<string>("2026");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("naac");

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data sets
  const [nirfRows, setNirfRows] = useState<NirfRow[]>([]);
  const [naacRows, setNaacRows] = useState<NaacRow[]>([]);
  const [unplacedRows, setUnplacedRows] = useState<UnplacedRow[]>([]);
  const [archive, setArchive] = useState<ReportArchiveItem[]>([]);

  // Modals
  const [letterheadModalOpen, setLetterheadModalOpen] = useState<boolean>(false);
  const [customBuilderOpen, setCustomBuilderOpen] = useState<boolean>(false);

  // Custom Builder Form
  const [customTitle, setCustomTitle] = useState<string>("Placement_Accreditation_Audit");
  const [customBatch, setCustomBatch] = useState<string>("2026");
  const [customDept, setCustomDept] = useState<string>("ALL");
  const [customStatus, setCustomStatus] = useState<string>("ALL");
  const [customMinCgpa, setCustomMinCgpa] = useState<string>("");
  const [customFormat, setCustomFormat] = useState<string>("CSV");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);

  // Load All Reports Data
  const loadReportsData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const params = new URLSearchParams();
      if (selectedDepartmentCode && selectedDepartmentCode !== "ALL") {
        params.append("department", selectedDepartmentCode);
      }
      if (batchYear && batchYear !== "ALL") {
        params.append("batchYear", batchYear);
      }

      const [nirfRes, naacRes, unplacedRes, histRes] = await Promise.all([
        apiClient.get<{ rows: NirfRow[] }>(`/reports/nirf?${params.toString()}`),
        apiClient.get<{ rows: NaacRow[] }>(`/reports/naac?${params.toString()}`),
        apiClient.get<{ rows: UnplacedRow[] }>(`/reports/unplaced?${params.toString()}`),
        apiClient.get<{ reports: ReportArchiveItem[] }>(`/reports/history`),
      ]);

      if (nirfRes?.rows) setNirfRows(nirfRes.rows);
      if (naacRes?.rows) setNaacRows(naacRes.rows);
      if (unplacedRes?.rows) setUnplacedRows(unplacedRes.rows);
      if (histRes?.reports) setArchive(histRes.reports);
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDepartmentCode, batchYear]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReportsData(true);
  };

  // Generate Custom Report
  const handleGenerateCustom = async () => {
    try {
      setIsGeneratingCustom(true);
      const res = await apiClient.post<{ summary: ReportArchiveItem; rows: any[] }>("/reports/generate", {
        title: customTitle,
        batchYear: customBatch,
        department: customDept,
        status: customStatus,
        minCgpa: customMinCgpa ? parseFloat(customMinCgpa) : undefined,
        format: customFormat,
      });

      if (res?.summary) {
        setArchive((prev) => [res.summary, ...prev]);
        setCustomBuilderOpen(false);
      }
    } catch (err) {
      console.error("Failed to generate custom report:", err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Export CSV Helper
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current active report
  const handleExportCurrent = () => {
    if (selectedTemplate === "nirf") {
      const headers = [
        "Academic Year",
        "Intake Cohort",
        "Admitted 1st Year",
        "Graduated in Min Time",
        "No. Placed",
        "Median Salary (INR)",
        "Median Salary (LPA)",
        "Selected for Higher Studies",
        "Placement Rate %",
      ];
      const rows = nirfRows.map((r) => [
        r.academicYear,
        r.intakeCohort,
        r.admittedFirstYear,
        r.graduatedInMinTime,
        r.placedCount,
        r.medianSalaryInr,
        r.medianSalaryLpa,
        r.higherStudiesCount,
        r.placementRate,
      ]);
      downloadCsv(`NIRF_Table2_Placement_Report_${batchYear}.csv`, headers, rows);
    } else if (selectedTemplate === "naac") {
      const headers = [
        "Serial No",
        "Batch Year",
        "Roll Number",
        "Student Name",
        "Department",
        "Student Email",
        "Phone",
        "Employer Name",
        "Designation",
        "Package (LPA)",
        "Appointment Order Ref No",
        "Offer Date",
      ];
      const rows = naacRows.map((r) => [
        r.serialNo,
        r.batchYear,
        r.rollNumber,
        r.studentName,
        r.department,
        r.studentEmail,
        r.studentPhone,
        r.employerName,
        r.designation,
        r.packageLpa,
        r.appointmentRefNo,
        r.offerDate,
      ]);
      downloadCsv(`NAAC_Criteria_5.2.1_Placed_Students_Ledger_${batchYear}.csv`, headers, rows);
    } else if (selectedTemplate === "unplaced") {
      const headers = [
        "Serial No",
        "Roll Number",
        "Full Name",
        "Department",
        "Batch Year",
        "CGPA",
        "Active Backlogs",
        "Total Backlogs",
        "Applications Submitted",
        "Verified Skills",
        "Email",
        "Phone",
        "Action Recommendation",
      ];
      const rows = unplacedRows.map((r) => [
        r.serialNo,
        r.rollNumber,
        r.fullName,
        r.department,
        r.batchYear,
        r.cgpa,
        r.activeBacklogs,
        r.totalBacklogs,
        r.applicationsCount,
        r.skills,
        r.email,
        r.phone,
        r.actionRecommendation,
      ]);
      downloadCsv(`Unplaced_Students_Remediation_Roster_${batchYear}.csv`, headers, rows);
    }
  };

  // Filtered NAAC rows by department & search
  const filteredNaacRows = useMemo(() => {
    let rows = naacRows;
    if (selectedDepartmentCode && selectedDepartmentCode !== "ALL") {
      rows = rows.filter((r) => isDepartmentMatch(r.department));
    }
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.employerName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.appointmentRefNo.toLowerCase().includes(q)
    );
  }, [naacRows, searchQuery, selectedDepartmentCode, isDepartmentMatch]);

  // Filtered Unplaced rows by department & search
  const filteredUnplacedRows = useMemo(() => {
    let rows = unplacedRows;
    if (selectedDepartmentCode && selectedDepartmentCode !== "ALL") {
      rows = rows.filter((r) => isDepartmentMatch(r.department));
    }
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.skills.toLowerCase().includes(q)
    );
  }, [unplacedRows, searchQuery, selectedDepartmentCode, isDepartmentMatch]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Executive Header Bar ─── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  Accreditation & Regulatory Placement Reports
                </h1>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  Audited Standards
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate, preview, and export official filings compliant with NIRF Table 2, NAAC Criteria 5.2, and Governing Board charters.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Batch Selector */}
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1 border border-border/60">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">Batch:</span>
              <Select value={batchYear} onValueChange={setBatchYear}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none focus:ring-0 px-1 py-0 w-[85px] font-semibold text-foreground">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026 Batch</SelectItem>
                  <SelectItem value="2025">2025 Batch</SelectItem>
                  <SelectItem value="2027">2027 Batch</SelectItem>
                  <SelectItem value="ALL">All Batches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Synchronized Filter */}
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1 border border-border/60">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">Branch:</span>
              <Select
                value={selectedDepartmentCode || "ALL"}
                onValueChange={(val) => setSelectedDepartment(val === "ALL" ? "All Departments" : val)}
              >
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none focus:ring-0 px-1 py-0 w-[120px] font-semibold text-foreground">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (refreshing || loading) && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Custom Report Builder */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setCustomBuilderOpen(true)}
              className="h-8 px-3 text-xs gap-1.5 shadow-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Custom Report Builder</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 4 Standard Accreditation Report Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Template 1: NIRF Table 2 */}
        <Card
          onClick={() => setSelectedTemplate("nirf")}
          className={cn(
            "border cursor-pointer transition-all hover:shadow-md",
            selectedTemplate === "nirf"
              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
              : "border-border bg-card"
          )}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                MoE Mandatory
              </Badge>
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                NIRF Table 2 Placement Filing
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Prescribed 3-year historical format for UG 4-Year engineering cohorts, placed counts, median salary & higher studies.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">3 Cycle Records</span>
              <span className="text-primary font-bold inline-flex items-center gap-1">
                Select <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Template 2: NAAC Criteria 5.2 */}
        <Card
          onClick={() => setSelectedTemplate("naac")}
          className={cn(
            "border cursor-pointer transition-all hover:shadow-md",
            selectedTemplate === "naac"
              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
              : "border-border bg-card"
          )}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                NAAC SSR Cycle-3
              </Badge>
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                NAAC Criteria 5.2 Placed Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Serialized student-by-student verification ledger with Employer name, appointment order references, and CTC packages.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{naacRows.length} Verified Records</span>
              <span className="text-primary font-bold inline-flex items-center gap-1">
                Select <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Template 3: Executive Summary */}
        <Card
          onClick={() => setSelectedTemplate("executive")}
          className={cn(
            "border cursor-pointer transition-all hover:shadow-md",
            selectedTemplate === "executive"
              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
              : "border-border bg-card"
          )}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                Governing Board
              </Badge>
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Annual Placement Executive Dossier
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Board-level summary with percentile distribution, visiting recruiter volume, tier analysis, and departmental rankings.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Board Document</span>
              <span className="text-primary font-bold inline-flex items-center gap-1">
                Select <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Template 4: Unplaced Students Roster */}
        <Card
          onClick={() => setSelectedTemplate("unplaced")}
          className={cn(
            "border cursor-pointer transition-all hover:shadow-md",
            selectedTemplate === "unplaced"
              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
              : "border-border bg-card"
          )}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                Actionable Remediation
              </Badge>
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Unplaced Remediation Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Targeted intervention roster of students needing support with CGPA, backlog status, verified skills, and drive fit recommendations.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{unplacedRows.length} Action Items</span>
              <span className="text-primary font-bold inline-flex items-center gap-1">
                Select <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Active Report Interactive Preview Section ─── */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {selectedTemplate === "nirf" && "NIRF Table 2 Placement & Higher Studies Report"}
                  {selectedTemplate === "naac" && "NAAC Criteria 5.2.1 Placed Students Verification Ledger"}
                  {selectedTemplate === "executive" && "Annual Campus Placement Executive Dossier"}
                  {selectedTemplate === "unplaced" && "Unplaced Students Remediation Action Roster"}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {selectedTemplate === "nirf" && "3-Year Academic Cycle"}
                  {selectedTemplate === "naac" && `${filteredNaacRows.length} Placed Candidates`}
                  {selectedTemplate === "executive" && "Executive Audit"}
                  {selectedTemplate === "unplaced" && `${filteredUnplacedRows.length} Students Pending`}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Live regulatory dataset generated for <strong>{selectedDepartment || "All Departments"}</strong> (Batch {batchYear}).
              </CardDescription>
            </div>

            {/* Action Buttons for the Active Report */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLetterheadModalOpen(true)}
                className="h-8 px-3 text-xs gap-1.5 font-semibold"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Official Letterhead Preview</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCurrent}
                className="h-8 px-3 text-xs gap-1.5 font-semibold shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dataset (CSV)</span>
              </Button>
            </div>
          </div>

          {/* Quick Search for Large Roster Tables */}
          {(selectedTemplate === "naac" || selectedTemplate === "unplaced") && (
            <div className="pt-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, roll number, or company..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* ── 1. NIRF TABLE 2 PREVIEW ── */}
          {selectedTemplate === "nirf" && (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[920px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Academic Year
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Intake Cohort
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      1st Year Admitted
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Graduated (Min Time)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Placed Graduates
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-right">
                      Median Salary (INR)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Higher Studies
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3 text-center">
                      Placement %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nirfRows.map((row) => (
                    <TableRow key={row.academicYear} className="hover:bg-muted/30">
                      <TableCell className="px-5 py-3.5 font-bold text-sm text-foreground">
                        {row.academicYear}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center font-medium text-xs">
                        {row.intakeCohort}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center font-medium text-xs">
                        {row.admittedFirstYear}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center font-medium text-xs">
                        {row.graduatedInMinTime}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center font-bold text-xs text-primary">
                        {row.placedCount}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-black text-sm text-foreground">
                        {row.medianSalaryLpa}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          ₹{row.medianSalaryInr.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center font-medium text-xs">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {row.higherStudiesCount} Selected
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-center">
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          {row.placementRate}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── 2. NAAC CRITERIA 5.2 PREVIEW ── */}
          {selectedTemplate === "naac" && (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[1080px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 w-14 text-center">
                      S.No
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                      Roll Number
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Student Name & Contact
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                      Program / Branch
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Employer & Designation
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-right">
                      Package (LPA)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Appointment Order Ref No.
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Offer Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNaacRows.map((row) => (
                    <TableRow key={row.serialNo} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-4 py-3 text-center text-xs text-muted-foreground font-semibold">
                        {row.serialNo}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-bold text-xs text-foreground">
                        {row.rollNumber}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-foreground block">
                            {row.studentName}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {row.studentEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {row.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-foreground block">
                            {row.employerName}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {row.designation}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-black text-xs text-primary">
                        ₹{row.packageLpa} LPA
                      </TableCell>
                      <TableCell className="px-5 py-3 font-mono text-[11px] text-foreground">
                        {row.appointmentRefNo}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">
                        {row.offerDate}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── 3. EXECUTIVE DOSSIER PREVIEW ── */}
          {selectedTemplate === "executive" && (
            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Institutional Placement Executive Overview
                  </h3>
                  <Badge variant="outline" className="font-semibold text-xs">
                    Session 2025-26
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Campus Placement %</span>
                    <div className="text-xl font-black text-foreground">84.6%</div>
                    <p className="text-[11px] text-muted-foreground">478 placed of 565 eligible graduates</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Peak Compensation</span>
                    <div className="text-xl font-black text-primary">₹44.5 LPA</div>
                    <p className="text-[11px] text-muted-foreground">Amazon Development Centre (SDE-1)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Institutional Median</span>
                    <div className="text-xl font-black text-foreground">₹9.2 LPA</div>
                    <p className="text-[11px] text-muted-foreground">Highest median salary in university history</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Recruiter Footprint</span>
                    <div className="text-xl font-black text-foreground">68 Companies</div>
                    <p className="text-[11px] text-muted-foreground">24 Tier-1 Product & 44 Core/IT</p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground leading-relaxed">
                  The complete certified Board Dossier includes audited CTC percentiles, departmental HOD achievements, dream-offer conversion ratios, and corporate recruiter feedback scorecards. Click <strong>Official Letterhead Preview</strong> above to render the printable document.
                </div>
              </div>
            </div>
          )}

          {/* ── 4. UNPLACED STUDENTS PREVIEW ── */}
          {selectedTemplate === "unplaced" && (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[1020px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 w-14 text-center">
                      S.No
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                      Roll Number
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Student Name & Contact
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                      Branch
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      CGPA
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                      Active Backlogs
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Verified Technical Skills
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                      Remediation Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnplacedRows.map((row) => (
                    <TableRow key={row.serialNo} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-4 py-3 text-center text-xs text-muted-foreground font-semibold">
                        {row.serialNo}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-bold text-xs text-foreground">
                        {row.rollNumber}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-foreground block">
                            {row.fullName}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {row.email} • {row.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {row.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center font-bold text-xs text-foreground">
                        {row.cgpa.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            row.activeBacklogs === 0
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          )}
                        >
                          {row.activeBacklogs} Active
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {row.skills}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span className="text-xs font-medium text-foreground block">
                          {row.actionRecommendation}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Reports Archive & Audit Trail ─── */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Generated Reports Archive & Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Historical record of all formal compliance documents generated, audited, and exported by TPO officers.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {archive.length} Archived Reports
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[960px] w-full">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                    Document Title & File
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                    Template Type
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-4 py-3">
                    Scope / Branch
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                    Records
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-center">
                    File Size
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-5 py-3">
                    Generated Timestamp
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground px-4 py-3 text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archive.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold text-xs text-foreground font-mono">
                          {item.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-medium">
                      {item.template}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.department} ({item.batchYear})
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-center font-bold text-xs text-foreground">
                      {item.recordCount}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-center text-xs text-muted-foreground font-medium">
                      {item.fileSize}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(item.generatedAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLetterheadModalOpen(true)}
                        className="h-7 px-2 text-xs gap-1 hover:text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── MODAL 1: OFFICIAL LETTERHEAD IN-BROWSER PREVIEW ─── */}
      <Dialog open={letterheadModalOpen} onOpenChange={setLetterheadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border border-border shadow-2xl">
          <div className="p-8 space-y-6 bg-card text-foreground" id="printable-letterhead">
            {/* Institution Letterhead Header */}
            <div className="border-b-2 border-primary/40 pb-4 text-center space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Government of National Accreditation & Technical Education
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                PlacementOS Institute of Technology & Management
              </h2>
              <p className="text-xs text-muted-foreground">
                Office of Training & Placement Cell • Career Development Centre • NAAC A++ Accredited
              </p>
              <div className="text-[11px] font-semibold text-muted-foreground pt-1">
                Ref: TPO/ACCRED/2026/04 • Academic Session: 2025-2026
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 py-2">
              <h3 className="text-base font-black uppercase tracking-wide text-foreground underline decoration-primary decoration-2 underline-offset-4">
                {selectedTemplate === "nirf" && "NIRF Table 2: Placement & Higher Studies Statutory Filing"}
                {selectedTemplate === "naac" && "NAAC Criteria 5.2.1: Certified Student Placement Ledger"}
                {selectedTemplate === "executive" && "Annual Campus Placement Operations Executive Dossier"}
                {selectedTemplate === "unplaced" && "Institutional Remediation Ledger: Unplaced Student Action Plan"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Certified compliance record for <strong>{selectedDepartment || "All Engineering Disciplines"}</strong> (Graduating Batch {batchYear})
              </p>
            </div>

            {/* Formatted Letterhead Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              {selectedTemplate === "nirf" ? (
                <Table className="w-full text-xs">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold text-foreground">Academic Cycle</TableHead>
                      <TableHead className="font-bold text-foreground text-center">Intake Cohort</TableHead>
                      <TableHead className="font-bold text-foreground text-center">Graduated in Time</TableHead>
                      <TableHead className="font-bold text-foreground text-center">Placed</TableHead>
                      <TableHead className="font-bold text-foreground text-right">Median CTC</TableHead>
                      <TableHead className="font-bold text-foreground text-center">Higher Studies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nirfRows.map((r) => (
                      <TableRow key={r.academicYear}>
                        <TableCell className="font-bold">{r.academicYear}</TableCell>
                        <TableCell className="text-center">{r.intakeCohort}</TableCell>
                        <TableCell className="text-center">{r.graduatedInMinTime}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{r.placedCount}</TableCell>
                        <TableCell className="text-right font-black">{r.medianSalaryLpa}</TableCell>
                        <TableCell className="text-center">{r.higherStudiesCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table className="w-full text-xs">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold text-foreground w-12 text-center">S.No</TableHead>
                      <TableHead className="font-bold text-foreground">Roll No</TableHead>
                      <TableHead className="font-bold text-foreground">Student Name</TableHead>
                      <TableHead className="font-bold text-foreground">Branch</TableHead>
                      <TableHead className="font-bold text-foreground">Employer</TableHead>
                      <TableHead className="font-bold text-foreground text-right">Package</TableHead>
                      <TableHead className="font-bold text-foreground">Offer Reference No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {naacRows.slice(0, 10).map((r) => (
                      <TableRow key={r.serialNo}>
                        <TableCell className="text-center text-muted-foreground">{r.serialNo}</TableCell>
                        <TableCell className="font-bold">{r.rollNumber}</TableCell>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell>{r.department}</TableCell>
                        <TableCell className="font-semibold">{r.employerName}</TableCell>
                        <TableCell className="text-right font-bold text-primary">₹{r.packageLpa}L</TableCell>
                        <TableCell className="font-mono text-[11px]">{r.appointmentRefNo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {selectedTemplate === "naac" && naacRows.length > 10 && (
              <p className="text-[11px] text-muted-foreground italic text-center">
                * Showing first 10 candidate entries in preview. Full dataset of {naacRows.length} verified students included in download.
              </p>
            )}

            {/* Certification Statement & Seal Block */}
            <div className="pt-8 grid grid-cols-2 gap-8 border-t border-border">
              <div className="space-y-2">
                <div className="h-12 border-b border-dashed border-border" />
                <span className="font-bold text-xs text-foreground block">
                  Dr. Rajesh Sharma
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Head, Training & Placement Operations
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  PlacementOS Institutional Cell
                </span>
              </div>

              <div className="space-y-2 text-right">
                <div className="h-12 border-b border-dashed border-border" />
                <span className="font-bold text-xs text-foreground block">
                  Prof. K. Venkatesh Rao
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Dean of Academic & Corporate Affairs
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Official Institutional Seal Verified
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex sm:justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Official accreditation document certified by TPO Cell.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLetterheadModalOpen(false)}
                className="h-8 text-xs"
              >
                Close Preview
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs gap-1.5 shadow-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Letterhead</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: CUSTOM REPORT GENERATOR ─── */}
      <Dialog open={customBuilderOpen} onOpenChange={setCustomBuilderOpen}>
        <DialogContent className="max-w-lg border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Custom Placement Report Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure parameters to generate specialized cohort reports for NAAC audit, NIRF compliance, or departmental review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Report Title</label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. NIRF_Verification_Cohort"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Graduation Batch</label>
                <Select value={customBatch} onValueChange={setCustomBatch}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026 Batch</SelectItem>
                    <SelectItem value="2025">2025 Batch</SelectItem>
                    <SelectItem value="2027">2027 Batch</SelectItem>
                    <SelectItem value="ALL">All Batches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Department</label>
                <Select value={customDept} onValueChange={setCustomDept}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    <SelectItem value="CSE">CSE</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="AI & DS">AI & DS</SelectItem>
                    <SelectItem value="ECE">ECE</SelectItem>
                    <SelectItem value="MECH">MECH</SelectItem>
                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Placement Status</label>
                <Select value={customStatus} onValueChange={setCustomStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Candidates</SelectItem>
                    <SelectItem value="PLACED">Placed Candidates Only</SelectItem>
                    <SelectItem value="UNPLACED">Seeking / Unplaced Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Output Format</label>
                <Select value={customFormat} onValueChange={setCustomFormat}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV Spreadsheet</SelectItem>
                    <SelectItem value="PDF">Printable PDF Dossier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Minimum CGPA (Optional)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={customMinCgpa}
                onChange={(e) => setCustomMinCgpa(e.target.value)}
                placeholder="e.g. 7.5"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomBuilderOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateCustom}
              disabled={isGeneratingCustom}
              className="h-8 text-xs gap-1.5 shadow-xs font-semibold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{isGeneratingCustom ? "Generating..." : "Generate & Save to Archive"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
