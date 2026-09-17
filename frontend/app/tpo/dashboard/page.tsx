"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileCheck2,
  Award,
  TrendingUp,
  Send,
  Filter,
  Calendar,
  CheckCircle,
  UserCheck,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Bell as BellIcon,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  FileBarChart,
  Building2,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface GrowthData {
  students: number;
  applications: number;
  selected: number;
  placementRate: number;
}

interface PlacementFunnel {
  eligible: number;
  applied: number;
  shortlisted: number;
  interview: number;
  selected: number;
  joined: number;
}

interface DriveStatusBreakdown {
  active: number;
  upcoming: number;
  completed: number;
  draft: number;
  total: number;
}

interface DepartmentRow {
  department: string;
  students: number;
  applied: number;
  selected: number;
  placementRate: number;
}

interface UpcomingDrive {
  id: string;
  companyName: string;
  jobRole: string;
  driveType: string;
  driveDate: string;
  companyLogo: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

interface PendingActions {
  interviewFeedbackPending: number;
  applicationsToReview: number;
  upcomingInterviewsThisWeek: number;
  reportsToGenerate: number;
}

interface DashboardStats {
  totalStudents: number;
  totalApplications: number;
  selectedStudents: number;
  placementRate: number;
  growthThisMonth: GrowthData;
  placementFunnel: PlacementFunnel;
  driveStatusBreakdown: DriveStatusBreakdown;
  departmentOverview: DepartmentRow[];
  upcomingDrives: UpcomingDrive[];
  recentNotifications: NotificationItem[];
  pendingActions: PendingActions;
}

export default function TpoDashboardPage() {
  const { selectedDepartment } = useDepartment();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const query =
          selectedDepartment && selectedDepartment !== "All Departments"
            ? `?department=${encodeURIComponent(selectedDepartment)}`
            : "";
        const data = await apiClient.get<DashboardStats>(`/tpo/dashboard-stats${query}`);
        setStats(data);
      } catch (err) {
        console.error("Failed to load TPO stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [selectedDepartment]);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <div className="text-sm font-medium text-slate-500">Loading placement intelligence...</div>
        </div>
      </div>
    );
  }

  const s = stats;
  const deptLabel = selectedDepartment && selectedDepartment !== "All Departments" ? selectedDepartment : "All Departments";

  return (
    <div className="space-y-4">
      {/* ─── Row 1: KPI Summary Cards (Full Width 4 Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Total Students"
          value={s?.totalStudents ?? 1248}
          growth={s?.growthThisMonth?.students ?? 12}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          icon={<Users className="h-5 w-5" />}
          sparkType="wave"
          sparkColor="#ea580c"
        />
        <KpiCard
          label="Applications"
          value={s?.totalApplications ?? 620}
          growth={s?.growthThisMonth?.applications ?? 48}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          icon={<FileCheck2 className="h-5 w-5" />}
          sparkType="bars"
          sparkColor="#10b981"
        />
        <KpiCard
          label="Selected"
          value={s?.selectedStudents ?? 102}
          growth={s?.growthThisMonth?.selected ?? 9}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          icon={<Award className="h-5 w-5" />}
          sparkType="wave"
          sparkColor="#f97316"
        />
        <KpiCard
          label="Placement Rate"
          value={`${s?.placementRate ?? 23.7}%`}
          growth={s?.growthThisMonth?.placementRate ?? 3.2}
          growthSuffix="%"
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          icon={<TrendingUp className="h-5 w-5" />}
          sparkType="wave"
          sparkColor="#0284c7"
        />
      </div>

      {/* ─── Rows 2-4: 2-Column Split Layout ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* ── LEFT MAIN AREA (8 of 12 columns ≈ 67%) ── */}
        <div className="xl:col-span-8 space-y-4">
          {/* Placement Funnel Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Placement Funnel
                </CardTitle>
                <span className="text-xs text-muted-foreground font-normal">
                  ({deptLabel})
                </span>
              </div>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted transition-colors">
                All Drives <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="pt-1 pb-3 px-4">
              <PlacementFunnelChart funnel={s?.placementFunnel} totalStudents={s?.totalStudents ?? 1248} />
            </CardContent>
          </Card>

          {/* Drive Status (Donut) & Department-wise Overview (Table) Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Drive Status Donut */}
            <Card className="lg:col-span-5 border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Drive Status
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <DriveStatusDonut breakdown={s?.driveStatusBreakdown} />
              </CardContent>
            </Card>

            {/* Department Overview Table */}
            <Card className="lg:col-span-7 border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-foreground">
                  Department Overview
                </CardTitle>
                <Link
                  href="/tpo/departments"
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View Report
                </Link>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <DepartmentOverviewTable departments={s?.departmentOverview ?? []} />
              </CardContent>
            </Card>
          </div>

          {/* Pending Actions Bar */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-foreground">
                Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4 pt-0">
              <PendingActionsBar actions={s?.pendingActions} />
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (4 of 12 columns ≈ 33%) ── */}
        <div className="xl:col-span-4 space-y-4">
          {/* Upcoming Drives Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-foreground">
                Upcoming Drives
              </CardTitle>
              <Link
                href="/tpo/placement-drives"
                className="text-xs text-primary font-semibold hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-3">
              <UpcomingDrivesList drives={s?.upcomingDrives ?? []} />
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-foreground">
                Notifications
              </CardTitle>
              <Link
                href="/tpo/notifications"
                className="text-xs text-primary font-semibold hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-3">
              <NotificationsPanel notifications={s?.recentNotifications ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   KPI CARD WITH SPARKLINE
   ═════════════════════════════════════════════════════════════ */

function KpiCard({
  label,
  value,
  growth,
  growthSuffix = "",
  iconBg,
  iconColor,
  icon,
  sparkType = "wave",
  sparkColor,
}: {
  label: string;
  value: number | string;
  growth: number;
  growthSuffix?: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  sparkType?: "wave" | "bars";
  sparkColor: string;
}) {
  return (
    <Card className="border-border shadow-sm relative overflow-hidden bg-card">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", iconBg, iconColor)}>
            {icon}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{growth}{growthSuffix} this month
              </span>
            </div>
          </div>

          {/* Mini Chart on Bottom Right */}
          <div className="shrink-0 mb-1">
            {sparkType === "bars" ? (
              <div className="flex items-end gap-1 h-7">
                <span className="w-1.5 h-3 bg-emerald-200 rounded-sm" />
                <span className="w-1.5 h-5 bg-emerald-300 rounded-sm" />
                <span className="w-1.5 h-4 bg-emerald-400 rounded-sm" />
                <span className="w-1.5 h-7 bg-emerald-500 rounded-sm" />
              </div>
            ) : (
              <svg viewBox="0 0 65 24" className="w-16 h-6" fill="none">
                <path
                  d="M1 18 Q 12 6, 22 14 T 44 8 T 64 4"
                  stroke={sparkColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═════════════════════════════════════════════════════════════
   PLACEMENT FUNNEL (6-Stage Horizontal Stepper)
   Matches reference: Circle icon -> Label -> Count -> Percentage
   ═════════════════════════════════════════════════════════════ */

const funnelStages = [
  { key: "eligible", label: "Eligible", icon: Users, color: "bg-indigo-50 text-indigo-600 border border-indigo-100" },
  { key: "applied", label: "Applied", icon: Send, color: "bg-blue-50 text-blue-600 border border-blue-100" },
  { key: "shortlisted", label: "Shortlisted", icon: Filter, color: "bg-teal-50 text-teal-600 border border-teal-100" },
  { key: "interview", label: "Interview", icon: Calendar, color: "bg-amber-50 text-amber-600 border border-amber-100" },
  { key: "selected", label: "Selected", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  { key: "joined", label: "Joined", icon: UserCheck, color: "bg-violet-50 text-violet-600 border border-violet-100" },
] as const;

function PlacementFunnelChart({
  funnel,
  totalStudents,
}: {
  funnel?: PlacementFunnel;
  totalStudents: number;
}) {
  const base = funnel?.eligible || totalStudents || 1048;

  return (
    <div className="flex items-center justify-between gap-1 py-3 overflow-x-auto">
      {funnelStages.map((stage, i) => {
        const count = funnel ? funnel[stage.key as keyof PlacementFunnel] ?? 0 : 0;
        const pct = ((count / base) * 100).toFixed(1);
        const Icon = stage.icon;

        return (
          <React.Fragment key={stage.key}>
            {i > 0 && (
              <div className="text-slate-300 font-light text-base shrink-0 mx-1">
                →
              </div>
            )}
            <div className="flex flex-col items-center text-center min-w-[75px] flex-1">
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-2.5 shadow-xs", stage.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{stage.label}</span>
              <span className="text-base font-bold text-slate-900 mt-0.5">{count.toLocaleString()}</span>
              {stage.key !== "eligible" ? (
                <span className="text-[10px] text-slate-400 mt-0.5">{pct}%</span>
              ) : (
                <span className="text-[10px] text-transparent mt-0.5 select-none">-</span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   UPCOMING DRIVES LIST (with dedicated company logo styling)
   ═════════════════════════════════════════════════════════════ */

function CompanyLogo({ name }: { name: string }) {
  const n = name.toLowerCase();

  if (n.includes("tcs")) {
    return (
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
        <span className="text-red-600 font-extrabold text-sm tracking-tighter">tcs</span>
      </div>
    );
  }
  if (n.includes("infosys")) {
    return (
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
        <span className="text-sky-600 font-bold text-[11px] tracking-tight">Infosys</span>
      </div>
    );
  }
  if (n.includes("wipro")) {
    return (
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
        <span className="text-emerald-700 font-bold text-[11px]">wipro</span>
      </div>
    );
  }
  if (n.includes("capgemini")) {
    return (
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
        <span className="text-blue-600 font-bold text-lg leading-none">♠</span>
      </div>
    );
  }
  if (n.includes("deloitte")) {
    return (
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
        <span className="text-slate-900 font-black text-sm">
          D<span className="text-emerald-500">.</span>
        </span>
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shadow-xs">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function UpcomingDrivesList({ drives }: { drives: UpcomingDrive[] }) {
  const displayDrives = drives.length > 0 ? drives.slice(0, 5) : [
    { id: "1", companyName: "TCS Ninja", jobRole: "Aptitude Test", driveType: "Aptitude Test", driveDate: "2025-05-22T10:00:00.000Z", companyLogo: null },
    { id: "2", companyName: "Infosys Springboard", jobRole: "Online Test", driveType: "Online Test", driveDate: "2025-05-24T11:00:00.000Z", companyLogo: null },
    { id: "3", companyName: "Wipro Elite", jobRole: "Aptitude Test", driveType: "Aptitude Test", driveDate: "2025-05-26T09:30:00.000Z", companyLogo: null },
    { id: "4", companyName: "Capgemini Hiring", jobRole: "Technical Test", driveType: "Technical Test", driveDate: "2025-05-28T14:00:00.000Z", companyLogo: null },
    { id: "5", companyName: "Deloitte Off Campus", jobRole: "Aptitude Test", driveType: "Aptitude Test", driveDate: "2025-05-30T10:30:00.000Z", companyLogo: null },
  ];

  return (
    <div className="space-y-3.5">
      {displayDrives.map((drive) => {
        const dt = drive.driveDate ? new Date(drive.driveDate) : null;
        const dateLabel = dt
          ? dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "22 May 2025";
        const timeLabel = dt
          ? dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
          : "10:00 AM";

        return (
          <div
            key={drive.id}
            className="flex items-center gap-3.5 py-1.5 border-b border-slate-100 last:border-0"
          >
            <CompanyLogo name={drive.companyName} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {drive.companyName}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {drive.driveType || drive.jobRole || "Aptitude Test"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-800">{dateLabel}</div>
              <div className="text-[11px] text-sky-600 font-medium mt-0.5">{timeLabel}</div>
            </div>
          </div>
        );
      })}

      <div className="pt-2 text-center">
        <Link
          href="/tpo/placement-drives"
          className="inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          View All Drives
        </Link>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   DRIVE STATUS DONUT CHART (Exact SVG Ring with Legend)
   ═════════════════════════════════════════════════════════════ */

const donutColors = {
  active: "#22c55e",
  upcoming: "#3b82f6",
  completed: "#f59e0b",
  draft: "#94a3b8",
};

function DriveStatusDonut({ breakdown }: { breakdown?: DriveStatusBreakdown }) {
  const b = breakdown && breakdown.total > 0 ? breakdown : { active: 7, upcoming: 4, completed: 2, draft: 1, total: 14 };
  const total = b.total || 14;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { key: "active", label: "Active", count: b.active, color: donutColors.active },
    { key: "upcoming", label: "Upcoming", count: b.upcoming, color: donutColors.upcoming },
    { key: "completed", label: "Completed", count: b.completed, color: donutColors.completed },
    { key: "draft", label: "Draft", count: b.draft, color: donutColors.draft },
  ];

  let offset = 0;

  return (
    <div className="flex items-center gap-5 justify-between">
      {/* Donut SVG */}
      <div className="relative w-[130px] h-[130px] shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {segments.map((seg) => {
            const pct = seg.count / total;
            const dashLen = pct * circumference;
            const dashGap = circumference - dashLen;
            const currentOffset = offset;
            offset += dashLen;
            return (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        {/* Center count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend List */}
      <div className="space-y-2.5 flex-1 pl-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600 font-medium">{seg.label}</span>
            </div>
            <span className="font-semibold text-slate-800">
              {seg.count} ({((seg.count / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   DEPARTMENT-WISE OVERVIEW TABLE
   ═════════════════════════════════════════════════════════════ */

function DepartmentOverviewTable({ departments }: { departments: DepartmentRow[] }) {
  const displayDepartments = departments.length > 0 ? departments : [
    { department: "CSE", students: 420, applied: 226, selected: 42, placementRate: 22.4 },
    { department: "IT", students: 180, applied: 112, selected: 20, placementRate: 22.2 },
    { department: "ECE", students: 160, applied: 92, selected: 15, placementRate: 16.3 },
    { department: "Mechanical", students: 150, applied: 68, selected: 10, placementRate: 14.7 },
    { department: "AI & DS", students: 120, applied: 62, selected: 8, placementRate: 12.9 },
    { department: "Others", students: 218, applied: 60, selected: 7, placementRate: 11.5 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400">
            <th className="text-left py-2 font-medium">Department</th>
            <th className="text-right py-2 font-medium">Students</th>
            <th className="text-right py-2 font-medium">Applied</th>
            <th className="text-right py-2 font-medium">Selected</th>
            <th className="text-right py-2 font-medium w-28">Placement Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {displayDepartments.map((d) => (
            <tr key={d.department} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 font-bold text-slate-800">{d.department}</td>
              <td className="py-2.5 text-right text-slate-600">{d.students}</td>
              <td className="py-2.5 text-right text-slate-600">{d.applied}</td>
              <td className="py-2.5 text-right text-slate-600">{d.selected}</td>
              <td className="py-2.5 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-semibold text-slate-700">{d.placementRate}%</span>
                  <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, d.placementRate * 3.5)}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   NOTIFICATIONS PANEL (Real-time feed with colored icons)
   ═════════════════════════════════════════════════════════════ */

const notifIcons: Record<string, { icon: typeof BellIcon; bg: string; text: string }> = {
  DRIVE: { icon: Building2, bg: "bg-indigo-50", text: "text-indigo-600" },
  RESULT: { icon: CheckCircle, bg: "bg-sky-50", text: "text-sky-600" },
  INTERVIEW: { icon: Calendar, bg: "bg-orange-50", text: "text-orange-500" },
  DEADLINE: { icon: Clock, bg: "bg-emerald-50", text: "text-emerald-600" },
  WARNING: { icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-500" },
  SYSTEM: { icon: BellIcon, bg: "bg-slate-50", text: "text-slate-500" },
};

function NotificationsPanel({ notifications }: { notifications: NotificationItem[] }) {
  const displayNotifications = notifications.length > 0 ? notifications.slice(0, 5) : [
    { id: "1", title: "New drive TCS Ninja is scheduled", message: "Aptitude test on 22 May 2025", type: "DRIVE", createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isRead: false },
    { id: "2", title: "Results updated for Infosys Springboard", message: "10 students shortlisted", type: "RESULT", createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), isRead: true },
    { id: "3", title: "Interview scheduled for 16 students", message: "On 24 May 2025", type: "INTERVIEW", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isRead: true },
    { id: "4", title: "Capgemini Hiring registrations open", message: "Last date to apply 27 May 2025", type: "DEADLINE", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), isRead: true },
    { id: "5", title: "78 students not yet applied", message: "Reminder: Deloitte Off Campus", type: "WARNING", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), isRead: true },
  ];

  return (
    <div className="space-y-3.5">
      {displayNotifications.map((n) => {
        const cfg = notifIcons[n.type] || notifIcons.SYSTEM;
        const Icon = cfg.icon;
        const timeAgo = formatTimeAgo(n.createdAt);

        return (
          <div key={n.id} className="flex items-start gap-3 py-1 border-b border-slate-100 last:border-0">
            <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", cfg.bg, cfg.text)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                {n.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {n.message}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
              <span className="text-[10px] text-slate-400">{timeAgo}</span>
              {!n.isRead && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-2 text-center">
        <Link
          href="/tpo/notifications"
          className="inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          View All
        </Link>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ═════════════════════════════════════════════════════════════
   PENDING ACTIONS BAR (4 Cards + View All Button)
   ═════════════════════════════════════════════════════════════ */

function PendingActionsBar({ actions }: { actions?: PendingActions }) {
  const a = actions ?? {
    interviewFeedbackPending: 12,
    applicationsToReview: 28,
    upcomingInterviewsThisWeek: 5,
    reportsToGenerate: 3,
  };

  const items = [
    {
      icon: MessageSquare,
      label: "Interview Feedback Pending",
      count: a.interviewFeedbackPending,
      bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      icon: Users,
      label: "Applications To Review",
      count: a.applicationsToReview,
      bg: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: Calendar,
      label: "Upcoming Interviews This Week",
      count: a.upcomingInterviewsThisWeek,
      bg: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      icon: FileBarChart,
      label: "Reports To Generate",
      count: a.reportsToGenerate,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3.5 flex-1 min-w-[150px] p-3 rounded-2xl border border-slate-100 bg-slate-50/60 shadow-xs"
          >
            <div className={cn("p-2.5 rounded-xl shrink-0 border", item.bg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 leading-tight">
                {item.count}
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}

      <Link
        href="/tpo/applications"
        className="px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors shrink-0 shadow-xs"
      >
        View All
      </Link>
    </div>
  );
}

