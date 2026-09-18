"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  BookOpen,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  Layers,
  X,
  Building2,
  Plus,
  UserPlus,
  ChevronDown,
  MoreHorizontal,
  SlidersHorizontal,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

/* ─── Interfaces ─── */
interface StudentListItem {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  plainPassword?: string;
  phone: string | null;
  department: string;
  batchYear: number;
  cgpa: number;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  activeBacklogs: number;
  totalBacklogs: number;
  placementStatus: boolean;
  skills: string[];
  applicationsCount: number;
}

interface StudentDetailData extends StudentListItem {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumes?: Array<{ id: string; title: string; isDefault: boolean; createdAt: string }>;
  applications?: Array<{
    id: string;
    status: string;
    appliedAt: string;
    drive?: { companyName: string; jobRole: string; packageCtc: number };
    internship?: { companyName: string; roleTitle: string };
    interviews?: Array<{ roundNumber: number; roundType: string; scheduledAt: string; status: string }>;
  }>;
}

const CGPA_OPTIONS = [
  { label: "All CGPA", value: "" },
  { label: "7.0+ CGPA", value: "7.0" },
  { label: "7.5+ CGPA", value: "7.5" },
  { label: "8.0+ CGPA", value: "8.0" },
  { label: "8.5+ CGPA", value: "8.5" },
  { label: "9.0+ CGPA", value: "9.0" },
];

function generate8CharPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const signs = "!@#$%&*";
  const req = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    signs[Math.floor(Math.random() * signs.length)],
  ];
  const all = upper + lower + digits + signs;
  for (let i = 0; i < 4; i++) {
    req.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = req.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [req[i], req[j]] = [req[j], req[i]];
  }
  return req.join("");
}

export default function StudentsDirectoryPage() {
  const {
    selectedDepartment,
    setSelectedDepartment,
    selectedDepartmentCode,
    departments,
    departmentCodes,
    getDepartmentName,
  } = useDepartment();

  // Primary Data State
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [minCgpa, setMinCgpa] = useState("");
  const [zeroBacklogsOnly, setZeroBacklogsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Table Sorting, Visibility & Selection States (shadcn Data Table)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Detail Sheet State
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showPasswordInSheet, setShowPasswordInSheet] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Add Student Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState("");
  const [studentFormData, setStudentFormData] = useState({
    rollNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    department: "CSE",
    batchYear: 2027,
    cgpa: "8.0",
    tenthPercentage: "90",
    twelfthPercentage: "90",
    activeBacklogs: 0,
    totalBacklogs: 0,
    placementStatus: false,
    skills: "",
  });

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fileTypeDetected, setFileTypeDetected] = useState<"excel" | "csv" | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "bulk";
    student?: StudentListItem | { id: string; name: string; rollNumber: string; email?: string };
    students?: StudentListItem[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteSingleStudent = useCallback((student: StudentListItem) => {
    setDeleteTarget({ type: "single", student });
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }, []);

  // Synchronize topbar department filter with page department filter
  useEffect(() => {
    const code = selectedDepartmentCode || "ALL";
    if (code !== selectedDept) {
      setSelectedDept(code);
      setPage(1);
    }
  }, [selectedDepartmentCode]);

  // Handle local department pill click
  const handleDepartmentPillChange = (code: string) => {
    setSelectedDept(code);
    const fullName = getDepartmentName(code);
    setSelectedDepartment(fullName);
    setPage(1);
  };

  // Fetch Students from API
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedDept !== "ALL") params.set("department", selectedDept);
      if (minCgpa) params.set("minCgpa", minCgpa);
      if (zeroBacklogsOnly) params.set("maxBacklogs", "0");
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get<{ total: number; students: StudentListItem[] }>(
        `/tpo/students${queryStr}`
      );
      setStudents(res.students || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load students:", err);
      setErrorMessage(err.message || "Failed to load students directory from server.");
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedDept, minCgpa, zeroBacklogsOnly, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  // Load Single Student Detailed Data for Slide-Over Sheet
  const openStudentDetail = useCallback(
    async (studentId: string) => {
      setActiveStudentId(studentId);
      setIsLoadingDetail(true);
      setShowPasswordInSheet(false);
      setCopiedPassword(false);
      try {
        const res = await apiClient.get<{ student: StudentDetailData }>(`/tpo/students/${studentId}`);
        setStudentDetail(res.student);
      } catch (err) {
        console.error("Failed to fetch student details:", err);
        const fallback = students.find((s) => s.id === studentId);
        if (fallback) setStudentDetail(fallback as StudentDetailData);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [students]
  );

  // TanStack Table Column Definitions (Official shadcn Data Table)
  const columns: ColumnDef<StudentListItem>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "placementStatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const placed = Boolean(row.getValue("placementStatus"));
          return (
            <span
              className={cn(
                "text-sm font-medium",
                placed ? "text-emerald-500" : "text-muted-foreground"
              )}
            >
              {placed ? "Success" : "Processing"}
            </span>
          );
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.getValue("name")}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-normal text-foreground">
            {row.getValue("email")}
          </span>
        ),
      },
      {
        accessorKey: "rollNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Roll No
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-normal text-muted-foreground">
            {row.getValue("rollNumber")}
          </span>
        ),
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-normal text-foreground">
            {row.getValue("department")}
          </span>
        ),
      },
      {
        accessorKey: "cgpa",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            CGPA
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const val = Number(row.getValue("cgpa"));
          return (
            <span className="text-sm font-medium text-foreground">
              {isNaN(val) ? row.getValue("cgpa") : `${val.toFixed(2)} CGPA`}
            </span>
          );
        },
      },
      {
        accessorKey: "activeBacklogs",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm font-medium hover:text-foreground text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Backlogs
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const backlogs = Number(row.getValue("activeBacklogs"));
          return (
            <span className="text-sm font-normal text-muted-foreground">
              {backlogs === 0 ? "None" : `${backlogs} active`}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div
              className="flex items-center justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Open menu"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => openStudentDetail(student.id)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    View Student
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(student.email)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Copy Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(student.rollNumber)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    Copy Roll Number
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteSingleStudent(student)}
                    className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove Student
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [openStudentDetail, handleDeleteSingleStudent]
  );

  // Initialize TanStack React Table
  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  const copySelectedEmails = () => {
    const selectedStudents = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
    const emails = selectedStudents.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget.type === "single" && deleteTarget.student) {
        await apiClient.delete(`/tpo/students/${deleteTarget.student.id}`);
        if (activeStudentId === deleteTarget.student.id) {
          setActiveStudentId(null);
          setStudentDetail(null);
        }
      } else if (deleteTarget.type === "bulk" && deleteTarget.students?.length) {
        const ids = deleteTarget.students.map((s) => s.id);
        await apiClient.post(`/tpo/students/bulk-delete`, { ids });
        table.resetRowSelection();
        if (activeStudentId && ids.includes(activeStudentId)) {
          setActiveStudentId(null);
          setStudentDetail(null);
        }
      }

      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      await loadStudents();
    } catch (err: any) {
      console.error("Failed to delete student(s):", err);
      setDeleteError(err.message || "Failed to remove student(s). Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Student Submit Handler
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStudent(true);
    setAddStudentError("");

    try {
      await apiClient.post("/tpo/students", {
        rollNumber: studentFormData.rollNumber,
        firstName: studentFormData.firstName,
        lastName: studentFormData.lastName,
        email: studentFormData.email,
        password: studentFormData.password || undefined,
        phone: studentFormData.phone || undefined,
        department: studentFormData.department,
        batchYear: studentFormData.batchYear,
        cgpa: studentFormData.cgpa,
        tenthPercentage: studentFormData.tenthPercentage || undefined,
        twelfthPercentage: studentFormData.twelfthPercentage || undefined,
        activeBacklogs: studentFormData.activeBacklogs,
        totalBacklogs: studentFormData.totalBacklogs,
        placementStatus: studentFormData.placementStatus,
        skills: studentFormData.skills
          ? studentFormData.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      });

      // Reset form & reload directory
      setStudentFormData({
        rollNumber: "",
        firstName: "",
        lastName: "",
        email: "",
        password: generate8CharPassword(),
        phone: "",
        department: "CSE",
        batchYear: 2027,
        cgpa: "8.0",
        tenthPercentage: "90",
        twelfthPercentage: "90",
        activeBacklogs: 0,
        totalBacklogs: 0,
        placementStatus: false,
        skills: "",
      });
      setIsAddStudentModalOpen(false);
      loadStudents();
    } catch (err: any) {
      setAddStudentError(err.message || "Failed to register student. Please verify the roll number and email.");
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Export to Excel (.xlsx) Function
  const exportToExcel = (studentsToExport: StudentListItem[] = students) => {
    const data = studentsToExport.map((s) => ({
      "Roll Number": s.rollNumber,
      "Full Name": s.name,
      "Email": s.email,
      "Password": s.plainPassword || "",
      "Phone": s.phone || "",
      "Department": s.department,
      "Batch Year": s.batchYear,
      "CGPA": Number(s.cgpa.toFixed(2)),
      "10th Percentage": s.tenthPercentage !== null ? s.tenthPercentage : "",
      "12th Percentage": s.twelfthPercentage !== null ? s.twelfthPercentage : "",
      "Active Backlogs": s.activeBacklogs,
      "Total Backlogs": s.totalBacklogs,
      "Placement Status": s.placementStatus ? "Placed" : "Unplaced",
      "Skills": s.skills.join("; "),
      "Applications Count": s.applicationsCount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 15 }, // Roll Number
      { wch: 22 }, // Full Name
      { wch: 28 }, // Email
      { wch: 16 }, // Password
      { wch: 16 }, // Phone
      { wch: 14 }, // Department
      { wch: 12 }, // Batch Year
      { wch: 10 }, // CGPA
      { wch: 16 }, // 10th %
      { wch: 16 }, // 12th %
      { wch: 15 }, // Active Backlogs
      { wch: 15 }, // Total Backlogs
      { wch: 16 }, // Placement Status
      { wch: 35 }, // Skills
      { wch: 18 }, // Applications Count
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(
      workbook,
      `PlacementOS_Students_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Export to CSV Function
  const exportToCsv = (studentsToExport: StudentListItem[] = students) => {
    const headers = [
      "Roll Number",
      "Full Name",
      "Email",
      "Password",
      "Phone",
      "Department",
      "Batch Year",
      "CGPA",
      "10th Percentage",
      "12th Percentage",
      "Active Backlogs",
      "Total Backlogs",
      "Placement Status",
      "Skills",
      "Applications Count",
    ];

    const rows = studentsToExport.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.plainPassword || ""}"`,
      `"${s.phone || ""}"`,
      `"${s.department}"`,
      s.batchYear,
      s.cgpa.toFixed(2),
      s.tenthPercentage !== null ? s.tenthPercentage : "",
      s.twelfthPercentage !== null ? s.twelfthPercentage : "",
      s.activeBacklogs,
      s.totalBacklogs,
      s.placementStatus ? "Placed" : "Unplaced",
      `"${s.skills.join("; ")}"`,
      s.applicationsCount,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PlacementOS_Students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Excel (.xlsx) Template
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        "Roll Number": "23CS101",
        "First Name": "Rahul",
        "Last Name": "Sharma",
        "Email": "rahul.sharma@college.edu",
        "Password (Optional)": "K9#m$2pQ",
        "Phone": "+91 9876543211",
        "Department": "CSE",
        "Batch Year": 2027,
        "CGPA": 8.75,
        "10th %": 92.5,
        "12th %": 90.0,
        "Active Backlogs": 0,
        "Total Backlogs": 0,
        "Skills": "Python;React.js;SQL"
      },
      {
        "Roll Number": "23IT102",
        "First Name": "Anjali",
        "Last Name": "Deshmukh",
        "Email": "anjali.d@college.edu",
        "Password (Optional)": "P8!v$4wZ",
        "Phone": "+91 9876543212",
        "Department": "IT",
        "Batch Year": 2027,
        "CGPA": 9.10,
        "10th %": 95.0,
        "12th %": 94.2,
        "Active Backlogs": 0,
        "Total Backlogs": 0,
        "Skills": "Java;AWS;Data Structures"
      },
      {
        "Roll Number": "23EC103",
        "First Name": "Karthik",
        "Last Name": "Menon",
        "Email": "karthik.m@college.edu",
        "Password (Optional)": "Z3@k&8rX",
        "Phone": "+91 9876543213",
        "Department": "ECE",
        "Batch Year": 2027,
        "CGPA": 7.80,
        "10th %": 88.0,
        "12th %": 85.5,
        "Active Backlogs": 0,
        "Total Backlogs": 1,
        "Skills": "Embedded C;Python;MATLAB"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 28 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Template");
    XLSX.writeFile(workbook, "PlacementOS_Student_Import_Template.xlsx");
  };

  // Download Sample CSV Template
  const downloadSampleCsv = () => {
    const sampleHeaders = "Roll Number,First Name,Last Name,Email,Password (Optional - auto-generated if blank),Phone,Department,Batch Year,CGPA,10th %,12th %,Active Backlogs,Total Backlogs,Skills\r\n";
    const sampleRows = [
      "23CS101,Rahul,Sharma,rahul.sharma@college.edu,K9#m$2pQ,+91 9876543211,CSE,2027,8.75,92.5,90.0,0,0,Python;React.js;SQL",
      "23IT102,Anjali,Deshmukh,anjali.d@college.edu,P8!v$4wZ,+91 9876543212,IT,2027,9.10,95.0,94.2,0,0,Java;AWS;Data Structures",
      "23EC103,Karthik,Menon,karthik.m@college.edu,Z3@k&8rX,+91 9876543213,ECE,2027,7.80,88.0,85.5,0,1,Embedded C;Python;MATLAB",
    ].join("\r\n");

    const blob = new Blob([sampleHeaders + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "PlacementOS_Student_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flexible column finder helper
  const getFieldValue = (row: Record<string, any>, possibleKeys: string[]): any => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return row[key];
      }
    }
    const normalizedKeys: Record<string, string> = {};
    for (const k of Object.keys(row)) {
      normalizedKeys[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = k;
    }
    for (const key of possibleKeys) {
      const cleanTarget = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizedKeys[cleanTarget]) {
        const origKey = normalizedKeys[cleanTarget];
        const val = row[origKey];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return val;
        }
      }
    }
    return undefined;
  };

  // Student row normalizer
  const normalizeStudentRow = (row: Record<string, any>) => {
    const rollNumber = String(
      getFieldValue(row, ["rollNumber", "rollNo", "roll number", "roll_no", "regNo", "registrationNumber"]) || ""
    ).trim().toUpperCase();

    const email = String(
      getFieldValue(row, ["email", "emailAddress", "email address", "email id", "mail"]) || ""
    ).trim().toLowerCase();

    let firstName = String(getFieldValue(row, ["firstName", "first_name", "first name"]) || "").trim();
    let lastName = String(getFieldValue(row, ["lastName", "last_name", "last name"]) || "").trim();
    if (!firstName) {
      const fullName = String(
        getFieldValue(row, ["name", "fullName", "full_name", "full name", "studentName", "student name"]) || ""
      ).trim();
      if (fullName) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
    }

    const rawPassword = getFieldValue(row, [
      "password",
      "plainPassword",
      "password (optional)",
      "pass",
      "portalPassword",
      "studentPassword",
    ]);
    const password = rawPassword ? String(rawPassword).trim() : undefined;

    const rawPhone = getFieldValue(row, ["phone", "phoneNumber", "phone number", "mobile", "contact"]);
    const phone = rawPhone ? String(rawPhone).trim() : null;

    const rawDept = getFieldValue(row, ["department", "branch", "dept", "course"]);
    const department = rawDept ? String(rawDept).trim().toUpperCase() : "CSE";

    const rawBatch = getFieldValue(row, ["batchYear", "batch", "batch year", "year", "graduationYear"]);
    const batchYear = rawBatch ? parseInt(String(rawBatch), 10) : 2027;

    const rawCgpa = getFieldValue(row, ["cgpa", "gpa", "score"]);
    const cgpa = rawCgpa !== undefined && !isNaN(parseFloat(String(rawCgpa))) ? parseFloat(String(rawCgpa)) : 7.0;

    const rawTenth = getFieldValue(row, ["tenthPercentage", "tenth", "10thPercentage", "10th %", "10th", "tenth%"]);
    const tenthPercentage = rawTenth !== undefined && !isNaN(parseFloat(String(rawTenth))) ? parseFloat(String(rawTenth)) : null;

    const rawTwelfth = getFieldValue(row, ["twelfthPercentage", "twelfth", "12thPercentage", "12th %", "12th", "twelfth%"]);
    const twelfthPercentage = rawTwelfth !== undefined && !isNaN(parseFloat(String(rawTwelfth))) ? parseFloat(String(rawTwelfth)) : null;

    const rawActive = getFieldValue(row, ["activeBacklogs", "active backlogs", "current backlogs", "backlogs"]);
    const activeBacklogs = rawActive !== undefined && !isNaN(parseInt(String(rawActive), 10)) ? parseInt(String(rawActive), 10) : 0;

    const rawTotal = getFieldValue(row, ["totalBacklogs", "total backlogs", "history backlogs"]);
    const totalBacklogs = rawTotal !== undefined && !isNaN(parseInt(String(rawTotal), 10)) ? parseInt(String(rawTotal), 10) : 0;

    const rawSkills = getFieldValue(row, ["skills", "skill", "technologies"]);
    const skills = rawSkills
      ? String(rawSkills)
          .replace(/;/g, ",")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return {
      rollNumber,
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      batchYear,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      activeBacklogs,
      totalBacklogs,
      skills,
    };
  };

  // Parse Excel (.xlsx, .xls) or CSV (.csv) File on upload
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatusMessage(null);
    setParsedRows([]);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCsv = fileName.endsWith(".csv");

    if (!isExcel && !isCsv) {
      setImportStatusMessage({
        type: "error",
        text: "Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
      });
      return;
    }

    setFileTypeDetected(isExcel ? "excel" : "csv");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setImportStatusMessage({
          type: "error",
          text: "The uploaded file does not contain any sheets or data.",
        });
        return;
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheetName], { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        setImportStatusMessage({
          type: "error",
          text: "The uploaded file has no data rows. Please ensure rows exist below the header.",
        });
        return;
      }

      const normalized = rawRows
        .map((row) => normalizeStudentRow(row))
        .filter((s) => s.rollNumber && s.email && s.firstName);

      if (normalized.length === 0) {
        setImportStatusMessage({
          type: "error",
          text: "Could not find valid student rows. Required fields: Roll Number, First Name (or Name), and Email.",
        });
        return;
      }

      setParsedRows(normalized);
    } catch (err: any) {
      console.error("Error reading file:", err);
      setImportStatusMessage({
        type: "error",
        text: `Failed to read ${isExcel ? "Excel" : "CSV"} file: ${err.message || "Invalid format"}`,
      });
    }
  };

  // Submit Bulk Import to Server
  const handleBulkImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportStatusMessage(null);

    try {
      const res = await apiClient.post<{
        totalProcessed: number;
        importedCount: number;
        updatedCount: number;
        errorsCount: number;
      }>("/tpo/students/bulk-import", { students: parsedRows });

      setImportStatusMessage({
        type: "success",
        text: `Successfully processed ${res.totalProcessed} records (${res.importedCount} imported, ${res.updatedCount} updated).`,
      });

      loadStudents();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setFileTypeDetected(null);
        setParsedRows([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1800);
    } catch (err: any) {
      setImportStatusMessage({
        type: "error",
        text: err.message || "Failed to import students. Please check your data format.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedDept("ALL");
    setSelectedDepartment("All Departments");
    setMinCgpa("");
    setZeroBacklogsOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ─── Filter & Action Toolbar ─── */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            {/* Search Input & Total Count */}
            <div className="flex items-center gap-2.5 w-full lg:max-w-md">
              <SearchBar
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch("");
                  setPage(1);
                }}
                placeholder="Search students by name, roll number, email..."
                className="w-full h-9 text-xs"
              />
              <Badge
                variant="outline"
                className="hidden sm:inline-flex h-9 px-3 items-center font-semibold text-muted-foreground border-border bg-muted/40 shrink-0 text-xs rounded-lg"
              >
                {total} Students
              </Badge>
            </div>

            {/* Quick Filters + Add Student with Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {/* CGPA Select */}
              <Select
                value={minCgpa || "ALL"}
                onValueChange={(val) => {
                  setMinCgpa(val === "ALL" ? "" : val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[125px] text-xs bg-background border-input font-medium">
                  <SelectValue placeholder="All CGPA" />
                </SelectTrigger>
                <SelectContent>
                  {CGPA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.label} value={opt.value || "ALL"} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Zero Backlogs Filter Button */}
              <Button
                variant={zeroBacklogsOnly ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setZeroBacklogsOnly(!zeroBacklogsOnly);
                  setPage(1);
                }}
                className={cn(
                  "h-9 gap-1.5 text-xs font-medium border-input transition-colors",
                  zeroBacklogsOnly && "border-primary/50 text-primary font-semibold"
                )}
              >
                <CheckCircle2 className={cn("h-4 w-4", zeroBacklogsOnly ? "text-primary" : "text-muted-foreground")} />
                Zero Backlogs
              </Button>

              {/* Combined Action Button: [ + Add Student ] [ ▼ ] */}
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden">
                <Button
                  size="sm"
                  onClick={() => {
                    setAddStudentError("");
                    setStudentFormData((prev) => ({
                      ...prev,
                      password: generate8CharPassword(),
                    }));
                    setIsAddStudentModalOpen(true);
                  }}
                  className="h-9 gap-1.5 text-xs font-semibold rounded-r-none pr-3"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-9 px-2 rounded-l-none border-l border-primary-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0"
                      aria-label="More student actions"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => setIsImportModalOpen(true)}
                      className="gap-2.5 text-xs cursor-pointer py-2"
                    >
                      <Upload className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Import Students</div>
                        <div className="text-[10px] text-muted-foreground">Bulk upload via Excel or CSV</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => exportToExcel(students)}
                      disabled={students.length === 0}
                      className="gap-2.5 text-xs cursor-pointer py-2"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-foreground">Export as Excel (.xlsx)</div>
                        <div className="text-[10px] text-muted-foreground">Download formatted spreadsheet</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => exportToCsv(students)}
                      disabled={students.length === 0}
                      className="gap-2.5 text-xs cursor-pointer py-2"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-semibold text-foreground">Export as CSV (.csv)</div>
                        <div className="text-[10px] text-muted-foreground">Download standard CSV dataset</div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Columns Visibility Dropdown (Official shadcn Data Table) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 text-sm font-medium border-input"
                  >
                    Columns
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs font-semibold">Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                    .map((column) => {
                      const titleMap: Record<string, string> = {
                        placementStatus: "Status",
                        name: "Name",
                        email: "Email",
                        rollNumber: "Roll No",
                        department: "Branch",
                        cgpa: "CGPA",
                        activeBacklogs: "Backlogs",
                      };
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="text-xs capitalize cursor-pointer"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {titleMap[column.id] || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1">
              <Building2 className="h-4 w-4" /> Branch:
            </span>
            {["ALL", ...departmentCodes].map((dept) => (
              <Button
                key={dept}
                size="sm"
                variant={selectedDept === dept ? "default" : "outline"}
                onClick={() => handleDepartmentPillChange(dept)}
                className={cn(
                  "h-7 px-3 text-xs rounded-full font-medium transition-all",
                  selectedDept !== dept && "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {dept}
              </Button>
            ))}

            {(search || selectedDept !== "ALL" || minCgpa || zeroBacklogsOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-7 text-xs text-muted-foreground hover:text-primary ml-auto font-medium"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Error State Banner ─── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadStudents}
            className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* ─── Official shadcn Data Table ─── */}
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-card overflow-hidden min-h-[480px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 px-4 text-sm font-medium text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-border">
                    <TableCell className="p-4 w-10">
                      <Skeleton className="h-4 w-4 rounded-[4px]" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-16 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-28 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-44 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-16 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-16 rounded" />
                    </TableCell>
                    <TableCell className="p-4">
                      <Skeleton className="h-4 w-14 rounded" />
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <Skeleton className="h-8 w-8 rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-border hover:bg-muted/50 data-[state=selected]:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => openStudentDetail(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-4 text-sm align-middle text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        No students found
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No students match your selected filters. Register a new student or import an entire cohort via CSV.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetAllFilters}
                          className="h-8 text-xs"
                        >
                          Reset Filters
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAddStudentError("");
                            setIsAddStudentModalOpen(true);
                          }}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Add Student
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── shadcn Data Table Pagination & Info Bar (Identical to Screenshot) ─── */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {total} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="h-8 px-3 text-sm font-medium"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= total || isLoading}
              className="h-8 px-3 text-sm font-medium"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Floating Bulk Actions Bar ─── */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card text-card-foreground rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-border animate-in fade-in slide-in-from-bottom-4">
          <Badge className="font-bold text-xs px-2">
            {table.getFilteredSelectedRowModel().rows.length} Selected
          </Badge>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={copySelectedEmails}
            className="h-8 text-xs gap-1.5 text-foreground hover:bg-muted"
          >
            {copiedNotification ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
            {copiedNotification ? "Copied!" : "Copy Emails"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const selectedStudents = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
              exportToExcel(selectedStudents);
            }}
            className="h-8 text-xs gap-1.5 text-foreground hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const selectedStudents = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
              exportToCsv(selectedStudents);
            }}
            className="h-8 text-xs gap-1.5 text-foreground hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const selectedStudents = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
              setDeleteTarget({
                type: "bulk",
                students: selectedStudents,
              });
              setDeleteError(null);
              setIsDeleteDialogOpen(true);
            }}
            className="h-8 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Selected
          </Button>
          <button
            onClick={() => table.resetRowSelection()}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors ml-1"
            title="Clear Selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Slide-Over Profile Drawer (Sheet) ─── */}
      <Sheet open={!!activeStudentId} onOpenChange={(open) => !open && setActiveStudentId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col justify-between overflow-hidden">
          {isLoadingDetail ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Loading student profile...</p>
            </div>
          ) : studentDetail ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Profile Bar */}
              <div className="p-6 pr-14 bg-card border-b border-border space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                    {(studentDetail.name || `${studentDetail.firstName || ''} ${studentDetail.lastName || ''}`.trim() || studentDetail.rollNumber || "ST").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">
                      {studentDetail.name || `${studentDetail.firstName || ''} ${studentDetail.lastName || ''}`.trim() || studentDetail.rollNumber}
                    </h2>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {studentDetail.rollNumber} • {studentDetail.department} (Batch {studentDetail.batchYear})
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {studentDetail.placementStatus ? (
                    <Badge variant="success">Placed Candidate</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Active Seeking</Badge>
                  )}
                  <Badge variant="outline">CGPA: {studentDetail.cgpa.toFixed(2)}</Badge>
                  {studentDetail.activeBacklogs === 0 ? (
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                      Zero Backlogs
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {studentDetail.activeBacklogs} Active Backlogs
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tabs Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="overview" className="text-xs">
                      Academics
                    </TabsTrigger>
                    <TabsTrigger value="drives" className="text-xs">
                      Drives ({studentDetail.applications?.length || studentDetail.applicationsCount || 0})
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="text-xs">
                      Skills & Docs
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Academics & Contact */}
                  <TabsContent value="overview" className="space-y-4 pt-3">
                    {/* Academic Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/50 border border-secondary text-center">
                        <span className="text-[10px] font-bold uppercase text-secondary-foreground tracking-wider">
                          Current CGPA
                        </span>
                        <div className="text-xl font-extrabold text-foreground mt-0.5">
                          {studentDetail.cgpa.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                          10th Grade
                        </span>
                        <div className="text-base font-bold text-foreground mt-0.5">
                          {studentDetail.tenthPercentage ? `${studentDetail.tenthPercentage}%` : "N/A"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                          12th Grade
                        </span>
                        <div className="text-base font-bold text-foreground mt-0.5">
                          {studentDetail.twelfthPercentage ? `${studentDetail.twelfthPercentage}%` : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Student Access Credentials Card */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-foreground">
                              Portal Access Credentials
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Student login credentials (TPO roster restricted)
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-background text-primary border-primary/30 text-[10px] font-medium">
                          TPO Synced
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Login Email</span>
                            <span className="font-mono text-xs font-medium text-foreground truncate block">{studentDetail.email}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText(studentDetail.email);
                              setCopiedNotification(true);
                              setTimeout(() => setCopiedNotification(false), 2000);
                            }}
                            title="Copy email"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Password</span>
                            <span className="font-mono text-xs font-semibold text-foreground tracking-wider block">
                              {showPasswordInSheet
                                ? (studentDetail.plainPassword || "••••••••")
                                : "••••••••"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPasswordInSheet(!showPasswordInSheet)}
                              title={showPasswordInSheet ? "Hide password" : "Show password"}
                            >
                              {showPasswordInSheet ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (studentDetail.plainPassword) {
                                  navigator.clipboard.writeText(studentDetail.plainPassword);
                                  setCopiedPassword(true);
                                  setTimeout(() => setCopiedPassword(false), 2000);
                                }
                              }}
                              title="Copy password"
                            >
                              {copiedPassword ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        When student changes password from their profile, it automatically updates and syncs here.
                      </p>
                    </div>

                    {/* Contact & Registry Info */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Contact Registry
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{studentDetail.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{studentDetail.phone || "No phone added"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Profiles */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Professional Portals
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {studentDetail.githubUrl ? (
                          <a
                            href={studentDetail.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            GitHub Profile
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">No GitHub linked</span>
                        )}
                        {studentDetail.linkedinUrl && (
                          <a
                            href={studentDetail.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            LinkedIn Profile
                          </a>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Applications & Drives */}
                  <TabsContent value="drives" className="space-y-3 pt-3">
                    {studentDetail.applications && studentDetail.applications.length > 0 ? (
                      studentDetail.applications.map((app) => (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-xs text-foreground">
                                {app.drive?.companyName || app.internship?.companyName || "Campus Opportunity"}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {app.drive?.jobRole || app.internship?.roleTitle}
                              </div>
                            </div>
                            <Badge
                              variant={
                                app.status === "SELECTED"
                                  ? "success"
                                  : app.status === "INTERVIEW"
                                  ? "info"
                                  : app.status === "SHORTLISTED"
                                  ? "warning"
                                  : "outline"
                              }
                            >
                              {app.status}
                            </Badge>
                          </div>
                          {app.drive?.packageCtc && (
                            <div className="text-[11px] text-primary font-semibold">
                              CTC: ₹{app.drive.packageCtc} LPA
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-1">
                        <Briefcase className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                        <div className="text-xs font-semibold text-foreground">No applications recorded</div>
                        <p className="text-[11px] text-muted-foreground">
                          This student has not yet applied to any campus placement drives.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Skills & Resumes */}
                  <TabsContent value="skills" className="space-y-4 pt-3">
                    {/* Skills Tag Cloud */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Technical Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {studentDetail.skills.length > 0 ? (
                          studentDetail.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs font-medium"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No verified skills entered.</span>
                        )}
                      </div>
                    </div>

                    {/* Resumes */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Verified CV / Resumes
                      </span>
                      {studentDetail.resumes && studentDetail.resumes.length > 0 ? (
                        studentDetail.resumes.map((res) => (
                          <div
                            key={res.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">{res.title}</span>
                              {res.isDefault && (
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1">
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-lg bg-muted/20 border border-border text-center text-xs text-muted-foreground">
                          No PDF resume uploaded yet.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer Action Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget({
                      type: "single",
                      student: {
                        id: studentDetail.id,
                        name: studentDetail.name || `${studentDetail.firstName || ''} ${studentDetail.lastName || ''}`.trim() || studentDetail.rollNumber,
                        rollNumber: studentDetail.rollNumber,
                        email: studentDetail.email,
                      },
                    });
                    setDeleteError(null);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  title="Remove Student from Placement Roster"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Student
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (studentDetail.email) {
                        navigator.clipboard.writeText(studentDetail.email);
                        setCopiedNotification(true);
                        setTimeout(() => setCopiedNotification(false), 2000);
                      }
                    }}
                    className="h-9 text-xs gap-1.5"
                  >
                    {copiedNotification ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                    {copiedNotification ? "Email Copied!" : "Copy Email"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveStudentId(null)}
                    className="h-9 text-xs px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ─── Add Student Modal (Functional) ─── */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="max-w-xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 pr-12">
            <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Register New Student
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an official student record in the placement registry. A login account will automatically be provisioned with standard student credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudentSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {addStudentError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addStudentError}</span>
                </div>
              )}

              {/* Row 1: Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">First Name *</label>
                  <Input
                    required
                    placeholder="e.g. Priya"
                    value={studentFormData.firstName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Last Name</label>
                  <Input
                    placeholder="e.g. Patel"
                    value={studentFormData.lastName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Roll Number & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Roll Number *</label>
                  <Input
                    required
                    placeholder="e.g. 23CS045"
                    value={studentFormData.rollNumber}
                    onChange={(e) => setStudentFormData({ ...studentFormData, rollNumber: e.target.value })}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">College Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="student@college.edu"
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Row 2.5: Assigned Login Password */}
              <div className="space-y-1.5 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Assigned Student Password (8 digits/chars)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary gap-1"
                    onClick={() =>
                      setStudentFormData({
                        ...studentFormData,
                        password: generate8CharPassword(),
                      })
                    }
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={studentFormData.password || ""}
                    onChange={(e) =>
                      setStudentFormData({ ...studentFormData, password: e.target.value })
                    }
                    placeholder="Auto-generated 8-character password"
                    className="h-8 text-xs font-mono font-semibold text-foreground tracking-wider bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs shrink-0"
                    onClick={() => {
                      if (studentFormData.password) {
                        navigator.clipboard.writeText(studentFormData.password);
                        setCopiedNotification(true);
                        setTimeout(() => setCopiedNotification(false), 2000);
                      }
                    }}
                    title="Copy password"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Only students added here can log in. The student can later change their password from their profile, which will sync back here.
                </p>
              </div>

              {/* Row 3: Phone & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input
                    placeholder="+91 9876543210"
                    value={studentFormData.phone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Department / Branch *</label>
                  <Select
                    value={studentFormData.department}
                    onValueChange={(val) => setStudentFormData({ ...studentFormData, department: val })}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-background border-input">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.code} value={dept.code} className="text-xs">
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Batch Year & CGPA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Graduation Batch</label>
                  <Select
                    value={String(studentFormData.batchYear)}
                    onValueChange={(val) => setStudentFormData({ ...studentFormData, batchYear: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-background border-input">
                      <SelectValue placeholder="Batch Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025" className="text-xs">Batch 2025</SelectItem>
                      <SelectItem value="2026" className="text-xs">Batch 2026</SelectItem>
                      <SelectItem value="2027" className="text-xs">Batch 2027</SelectItem>
                      <SelectItem value="2028" className="text-xs">Batch 2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Current CGPA (out of 10) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    placeholder="e.g. 8.5"
                    value={studentFormData.cgpa}
                    onChange={(e) => setStudentFormData({ ...studentFormData, cgpa: e.target.value })}
                    className="h-9 text-xs font-bold text-primary"
                  />
                </div>
              </div>

              {/* Row 5: 10th & 12th % */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">10th Grade Percentage</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 92.5"
                    value={studentFormData.tenthPercentage}
                    onChange={(e) => setStudentFormData({ ...studentFormData, tenthPercentage: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">12th Grade Percentage</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 89.0"
                    value={studentFormData.twelfthPercentage}
                    onChange={(e) => setStudentFormData({ ...studentFormData, twelfthPercentage: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Row 6: Backlogs & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Active Backlogs</label>
                  <Input
                    type="number"
                    min="0"
                    value={studentFormData.activeBacklogs}
                    onChange={(e) => setStudentFormData({ ...studentFormData, activeBacklogs: parseInt(e.target.value, 10) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Total Backlogs</label>
                  <Input
                    type="number"
                    min="0"
                    value={studentFormData.totalBacklogs}
                    onChange={(e) => setStudentFormData({ ...studentFormData, totalBacklogs: parseInt(e.target.value, 10) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Placement Status</label>
                  <Select
                    value={studentFormData.placementStatus ? "placed" : "unplaced"}
                    onValueChange={(val) => setStudentFormData({ ...studentFormData, placementStatus: val === "placed" })}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-background border-input">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unplaced" className="text-xs">Seeking (Unplaced)</SelectItem>
                      <SelectItem value="placed" className="text-xs">Placed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 7: Skills */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Skills <span className="text-muted-foreground font-normal">(Comma separated)</span>
                </label>
                <Input
                  placeholder="e.g. Python, React.js, SQL, Docker"
                  value={studentFormData.skills}
                  onChange={(e) => setStudentFormData({ ...studentFormData, skills: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2 sm:gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStudentModalOpen(false)}
                disabled={isSubmittingStudent}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingStudent}
                className="text-xs gap-1.5"
              >
                {isSubmittingStudent ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Registering Student...
                  </>
                ) : (
                  <>Register Student</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Import Students Dialog ─── */}
      <Dialog
        open={isImportModalOpen}
        onOpenChange={(open) => {
          setIsImportModalOpen(open);
          if (!open) {
            setImportFile(null);
            setFileTypeDetected(null);
            setParsedRows([]);
            setImportStatusMessage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 pr-12">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Bulk Import Students (Excel & CSV)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload a standard university Excel (.xlsx, .xls) or CSV (.csv) file to register or update student cohorts. Each student will automatically be assigned an 8-digit secure random password (letters, numbers, signs) for login and included in your student directory export.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Template Download Prompt */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-foreground">Need a standardized template?</div>
                <div className="text-muted-foreground text-[11px]">
                  Download our pre-formatted spreadsheet template with all required student enrollment fields.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleExcel}
                  className="h-8 text-xs gap-1.5 font-semibold bg-background hover:bg-muted"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Excel Template (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCsv}
                  className="h-8 text-xs gap-1.5 font-semibold bg-background hover:bg-muted"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  CSV Template (.csv)
                </Button>
              </div>
            </div>

            {/* File Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary hover:bg-accent/20 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                {fileTypeDetected === "excel" ? (
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                ) : fileTypeDetected === "csv" ? (
                  <FileText className="h-5 w-5 text-blue-600" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-xs font-semibold text-foreground">
                {importFile ? importFile.name : "Click to select or drag & drop student Excel or CSV file"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB
              </p>
            </div>

            {/* Status & Error feedback */}
            {importStatusMessage && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs font-medium flex items-center gap-2",
                  importStatusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}
              >
                {importStatusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{importStatusMessage.text}</span>
              </div>
            )}

            {/* Preview of Parsed Rows */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Preview ({parsedRows.length} students found in file):</span>
                  {fileTypeDetected && (
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {fileTypeDetected === "excel" ? "Excel Spreadsheet" : "CSV Document"}
                    </Badge>
                  )}
                </div>
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">Roll No</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Branch</th>
                        <th className="p-2 text-left">CGPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.slice(0, 4).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2 font-mono font-semibold">{row.rollNumber}</td>
                          <td className="p-2">{row.firstName} {row.lastName}</td>
                          <td className="p-2 text-muted-foreground">{row.email}</td>
                          <td className="p-2">{row.department}</td>
                          <td className="p-2 font-bold text-primary">{row.cgpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setFileTypeDetected(null);
                setParsedRows([]);
                setImportStatusMessage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isImporting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImportSubmit}
              disabled={parsedRows.length === 0 || isImporting}
              className="text-xs gap-1.5"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing {parsedRows.length} Students...
                </>
              ) : (
                <>Import {parsedRows.length} Students</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Modal ─── */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {deleteTarget?.type === "bulk"
                    ? `Remove ${deleteTarget.students?.length} Students?`
                    : "Remove Student?"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  This action is permanent and will permanently delete records from the system.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {deleteError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {deleteTarget?.type === "single" && deleteTarget.student && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold text-foreground text-sm">
                  {deleteTarget.student.name}
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <span>
                    Roll: <span className="font-mono font-medium text-foreground">{deleteTarget.student.rollNumber}</span>
                  </span>
                  {"email" in deleteTarget.student && deleteTarget.student.email && (
                    <>
                      <span>•</span>
                      <span>{deleteTarget.student.email}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {deleteTarget?.type === "bulk" && deleteTarget.students && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs space-y-2">
                <div className="text-muted-foreground">
                  You are about to permanently delete{" "}
                  <span className="font-bold text-foreground">
                    {deleteTarget.students.length} students
                  </span>
                  :
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {deleteTarget.students.slice(0, 5).map((s) => (
                    <div key={s.id} className="text-foreground flex items-center justify-between">
                      <span>{s.name} ({s.rollNumber})</span>
                      <span className="text-muted-foreground text-[10px]">{s.department}</span>
                    </div>
                  ))}
                  {deleteTarget.students.length > 5 && (
                    <div className="text-muted-foreground text-center pt-1 italic">
                      + {deleteTarget.students.length - 5} more students
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-destructive">Consequences of this action:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                <li>Student profile, academic records, and user login will be deleted.</li>
                <li>All job applications, interview schedules, and uploads will be purged.</li>
                <li>This action cannot be undone.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleteTarget?.type === "bulk"
                    ? `Remove ${deleteTarget.students?.length} Students`
                    : "Remove Student"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
