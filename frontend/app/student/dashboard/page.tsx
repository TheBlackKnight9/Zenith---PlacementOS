"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileCheck2,
  Calendar,
  CalendarClock,
  ShieldCheck,
  Building2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  Send,
  Filter,
  Code2,
  Laptop,
  FileText,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface StudentDetails {
  firstName: string;
  lastName: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
}

interface ApplicationFunnel {
  applied: number;
  shortlisted: number;
  onlineTest: number;
  interview: number;
  selected: number;
  joined: number;
}

interface ProfileReadiness {
  score: number;
  verifiedCgpa: boolean;
  cgpaValue: number;
  hasDefaultResume: boolean;
  skillsCount: number;
  hasSocials: boolean;
}

interface RecentApplication {
  id: string;
  companyName: string;
  jobRole: string;
  packageCtc: string;
  status: string;
  appliedAt: string;
}

interface UpcomingInterview {
  id: string;
  companyName: string;
  roundName: string;
  scheduledAt: string;
  mode: string;
  venueOrLink: string | null;
}

interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  type: string;
  badge: string;
}

export interface PlacementStageInfo {
  statusType: "SUCCESS" | "PROCESSING" | "NOT_APPLIED";
  statusLabel: "Success" | "Processing" | "Not Applied";
  companyName: string | null;
  jobRole: string | null;
  stepName: string | null;
  detailText: string;
  packageCtc: number | null;
  offerDate?: string | null;
  totalApplications: number;
  activeApplications: number;
}

interface StudentDashboardStats {
  eligibleDrivesCount: number;
  appliedCount: number;
  upcomingInterviewsCount: number;
  placementStatus: boolean;
  placementStage?: PlacementStageInfo;
  growthThisMonth: {
    eligible: number;
    applications: number;
    interviews: number;
  };
  studentDetails: StudentDetails;
  applicationFunnel: ApplicationFunnel;
  profileReadiness: ProfileReadiness;
  recentApplications: RecentApplication[];
  upcomingInterviews: UpcomingInterview[];
  recentNotifications: StudentNotification[];
  recommendedActions: RecommendedAction[];
}

interface DriveSummary {
  id: string;
  companyName: string;
  jobRole: string;
  packageCtc: number;
  deadline: string;
  isEligible: boolean;
  hasApplied: boolean;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [eligibleDrives, setEligibleDrives] = useState<DriveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, drivesData] = await Promise.all([
          apiClient.get<StudentDashboardStats>("/students/dashboard-stats"),
          apiClient.get<{ drives: DriveSummary[] }>("/students/placement-drives").catch(() => ({ drives: [] }))
        ]);
        setStats(statsData);
        if (drivesData?.drives) {
          setEligibleDrives(drivesData.drives.filter(d => d.isEligible));
        }
      } catch (err) {
        console.error("Failed to load student dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <div className="text-sm font-medium text-slate-500">Loading student career desk...</div>
        </div>
      </div>
    );
  }

  const s = stats;
  const candidateName = user?.profile?.firstName || s?.studentDetails?.firstName || "Aarav";

  return (
    <div className="space-y-4">
      {/* ─── Row 1: 4 Executive KPI Metric Cards (Full Width) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Eligible Drives"
          value={s?.eligibleDrivesCount ?? 14}
          growth={s?.growthThisMonth?.eligible ?? 3}
          growthPrefix="+"
          growthSuffix=" new this week"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          icon={<Briefcase className="h-5 w-5" />}
          sparkType="wave"
          sparkColor="#ea580c"
        />
        <KpiCard
          label="Applications Submitted"
          value={s?.appliedCount ?? 6}
          growth={s?.growthThisMonth?.applications ?? 2}
          growthPrefix="+"
          growthSuffix=" this month"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          icon={<FileCheck2 className="h-5 w-5" />}
          sparkType="bars"
          sparkColor="#10b981"
        />
        <KpiCard
          label="Interviews Scheduled"
          value={s?.upcomingInterviewsCount ?? 2}
          growth={1}
          growthLabel="Next: TCS Ninja (22 May)"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          icon={<CalendarClock className="h-5 w-5" />}
          sparkType="wave"
          sparkColor="#f97316"
        />
        {/* KPI 4: Synchronized Recruitment & Placement Status */}
        {(() => {
          const stage = s?.placementStage;
          const statusType =
            stage?.statusType ||
            (s?.placementStatus ? "SUCCESS" : (s?.appliedCount || 0) > 0 ? "PROCESSING" : "NOT_APPLIED");

          if (statusType === "SUCCESS") {
            return (
              <KpiCard
                label="Placement Status"
                value="Success 🎉"
                growth={0}
                growthLabel={stage?.detailText || stage?.companyName || "Placed"}
                iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                iconColor="text-emerald-600 dark:text-emerald-400"
                icon={<Award className="h-5 w-5" />}
                sparkType="wave"
                sparkColor="#10b981"
              />
            );
          }

          if (statusType === "PROCESSING") {
            return (
              <KpiCard
                label="Recruitment Status"
                value="Processing ⏳"
                growth={0}
                growthLabel={stage?.detailText || "In Pipeline"}
                iconBg="bg-blue-50 dark:bg-blue-950/40"
                iconColor="text-blue-600 dark:text-blue-400"
                icon={<Clock className="h-5 w-5" />}
                sparkType="wave"
                sparkColor="#0284c7"
              />
            );
          }

          return (
            <KpiCard
              label="Recruitment Status"
              value="Not Applied"
              growth={0}
              growthLabel="0 Applications"
              iconBg="bg-slate-50 dark:bg-slate-900/40"
              iconColor="text-slate-500"
              icon={<Briefcase className="h-5 w-5" />}
              sparkType="wave"
              sparkColor="#94a3b8"
            />
          );
        })()}
      </div>

      {/* ─── Rows 2-4: 2-Column Split Layout ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* ── LEFT MAIN AREA (8 of 12 columns ≈ 67%) ── */}
        <div className="xl:col-span-8 space-y-4">
          {/* Personal Application Progress Funnel */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Recruitment Pipeline Tracker
                </CardTitle>
                <span className="text-xs text-muted-foreground font-normal">
                  (Season 2026–2027)
                </span>
              </div>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted transition-colors">
                All Applications <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="pt-1 pb-3 px-4">
              <StudentFunnelChart funnel={s?.applicationFunnel} />
            </CardContent>
          </Card>

          {/* Active Applications Desk & Profile Readiness Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Active Applications Table (7 cols) */}
            <Card className="lg:col-span-7 border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-foreground">
                  Active Applications
                </CardTitle>
                <Link
                  href="/student/applications"
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View All
                </Link>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                <RecentApplicationsTable applications={s?.recentApplications ?? []} />
              </CardContent>
            </Card>

            {/* Profile & Resume Readiness Gauge (5 cols) */}
            <Card className="lg:col-span-5 border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-bold text-foreground">
                  Profile Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4 pt-0">
                <ProfileReadinessWidget readiness={s?.profileReadiness} />
              </CardContent>
            </Card>
          </div>

          {/* Action Items & Deadlines Bar */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-foreground">
                Action Items & Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4 pt-0">
              <RecommendedActionsBar actions={s?.recommendedActions} />
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (4 of 12 columns ≈ 33%) ── */}
        <div className="xl:col-span-4 space-y-4">
          {/* Featured Eligible Drives */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-900">
                Featured Eligible Drives
              </CardTitle>
              <Link
                href="/student/placement-drives"
                className="text-xs text-orange-600 font-semibold hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-3">
              <FeaturedDrivesFeed drives={eligibleDrives} />
            </CardContent>
          </Card>

          {/* Campus Recruitment Alerts */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-900">
                Recruitment Alerts
              </CardTitle>
              <Link
                href="/student/notifications"
                className="text-xs text-orange-600 font-semibold hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-3">
              <StudentNotificationsPanel notifications={s?.recentNotifications ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   KPI CARD COMPONENT (WITH SPARKLINE)
   ═════════════════════════════════════════════════════════════ */

function KpiCard({
  label,
  value,
  growth,
  growthPrefix = "",
  growthSuffix = "",
  growthLabel,
  iconBg,
  iconColor,
  icon,
  sparkType = "wave",
  sparkColor,
}: {
  label: string;
  value: number | string;
  growth: number;
  growthPrefix?: string;
  growthSuffix?: string;
  growthLabel?: string;
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
                {growthLabel || `${growthPrefix}${growth}${growthSuffix}`}
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
   STUDENT RECRUITMENT PIPELINE FUNNEL (5 Stages)
   ═════════════════════════════════════════════════════════════ */

const pipelineStages = [
  { key: "applied", label: "Applied", icon: Send, color: "bg-blue-50 text-blue-600 border border-blue-100" },
  { key: "shortlisted", label: "Shortlisted", icon: Filter, color: "bg-teal-50 text-teal-600 border border-teal-100" },
  { key: "onlineTest", label: "Online Test", icon: Laptop, color: "bg-violet-50 text-violet-600 border border-violet-100" },
  { key: "interview", label: "Interview", icon: Calendar, color: "bg-amber-50 text-amber-600 border border-amber-100" },
  { key: "selected", label: "Final Offer", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
] as const;

function StudentFunnelChart({ funnel }: { funnel?: ApplicationFunnel }) {
  const base = funnel?.applied || 6;

  return (
    <div className="flex items-center justify-between gap-1 py-3 overflow-x-auto">
      {pipelineStages.map((stage, i) => {
        const count = funnel ? funnel[stage.key as keyof ApplicationFunnel] ?? 0 : 0;
        const pct = base > 0 ? ((count / base) * 100).toFixed(0) : "0";
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
              <span className="text-base font-bold text-slate-900 mt-0.5">{count}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{pct}%</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   RECENT APPLICATIONS TABLE
   ═════════════════════════════════════════════════════════════ */

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  APPLIED: { bg: "bg-slate-100 text-slate-700", text: "Under Review" },
  UNDER_REVIEW: { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "Reviewing" },
  SHORTLISTED: { bg: "bg-teal-50 text-teal-700 border-teal-200", text: "Shortlisted" },
  INTERVIEW: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Interview Scheduled" },
  SELECTED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Offer Extended 🎉" },
  REJECTED: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "Not Shortlisted" },
  WITHDRAWN: { bg: "bg-slate-100 text-slate-500", text: "Withdrawn" },
};

function RecentApplicationsTable({ applications }: { applications: RecentApplication[] }) {
  const displayApps = applications.length > 0 ? applications : [
    { id: "1", companyName: "Google Cloud", jobRole: "Cloud Solutions Engineer", packageCtc: "₹18.5 LPA", status: "UNDER_REVIEW", appliedAt: "2026-09-10" },
    { id: "2", companyName: "TCS Ninja", jobRole: "Digital Specialist Engineer", packageCtc: "₹7.5 LPA", status: "INTERVIEW", appliedAt: "2026-09-08" },
    { id: "3", companyName: "Capgemini Hiring", jobRole: "Technical Analyst", packageCtc: "₹6.8 LPA", status: "SHORTLISTED", appliedAt: "2026-09-05" },
    { id: "4", companyName: "Microsoft", jobRole: "Software Engineer Trainee", packageCtc: "₹22.0 LPA", status: "APPLIED", appliedAt: "2026-09-01" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400">
            <th className="text-left py-2 font-medium">Company & Role</th>
            <th className="text-right py-2 font-medium">Package</th>
            <th className="text-right py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {displayApps.map((a) => {
            const badgeCfg = statusBadgeStyles[a.status] || { bg: "bg-slate-100 text-slate-600", text: a.status };
            return (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5">
                  <div className="font-bold text-slate-800 truncate max-w-[150px]">{a.companyName}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{a.jobRole}</div>
                </td>
                <td className="py-2.5 text-right font-semibold text-indigo-700">{a.packageCtc}</td>
                <td className="py-2.5 text-right">
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", badgeCfg.bg)}>
                    {badgeCfg.text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   PROFILE & RESUME READINESS GAUGE
   ═════════════════════════════════════════════════════════════ */

function ProfileReadinessWidget({ readiness }: { readiness?: ProfileReadiness }) {
  const r = readiness ?? { score: 85, verifiedCgpa: true, cgpaValue: 8.85, hasDefaultResume: true, skillsCount: 6, hasSocials: true };
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (r.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Gauge and Score */}
      <div className="relative w-28 h-28 my-1 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="10"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 leading-none">{r.score}%</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Readiness</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="w-full space-y-1.5 mt-2 text-xs">
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified CGPA ({r.cgpaValue || "8.85"})
          </span>
          <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-bold text-emerald-700 bg-emerald-50">Verified</Badge>
        </div>
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Default Resume Active
          </span>
          <Link href="/student/profile" className="text-[10px] text-brand-600 font-semibold hover:underline">Update</Link>
        </div>
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {r.skillsCount} Core Skills Tagged
          </span>
          <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-bold">Ready</Badge>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   RECOMMENDED ACTION ITEMS BAR
   ═════════════════════════════════════════════════════════════ */

function RecommendedActionsBar({ actions }: { actions?: RecommendedAction[] }) {
  const displayActions = actions && actions.length > 0 ? actions : [
    { id: "1", title: "Upcoming Aptitude Round", detail: "TCS Ninja · 22 May, 10:00 AM", type: "TEST", badge: "High Priority" },
    { id: "2", title: "Application Under Review", detail: "Google Cloud Solutions Engineer", type: "STATUS", badge: "Reviewing" },
    { id: "3", title: "Skill Assessment Available", detail: "Take React.js test to boost recruiter rank", type: "ASSESSMENT", badge: "Skill" },
    { id: "4", title: "Resume Recommendation", detail: "3 recruiters prefer PDF resume format", type: "RESUME", badge: "Profile" },
  ];

  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
      {displayActions.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3.5 flex-1 min-w-[160px] p-3 rounded-2xl border border-slate-100 bg-slate-50/60 shadow-xs"
        >
          <div className="p-2.5 rounded-xl shrink-0 border bg-brand-50 text-brand-600 border-brand-100">
            {item.type === "TEST" ? (
              <Laptop className="h-5 w-5" />
            ) : item.type === "STATUS" ? (
              <Clock className="h-5 w-5" />
            ) : item.type === "ASSESSMENT" ? (
              <Code2 className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 leading-tight truncate">
              {item.title}
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
              {item.detail}
            </div>
          </div>
        </div>
      ))}

      <Link
        href="/student/applications"
        className="px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors shrink-0 shadow-xs"
      >
        View All
      </Link>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   FEATURED ELIGIBLE DRIVES FEED (WITH LOGOS & 1-CLICK APPLY)
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

function FeaturedDrivesFeed({ drives }: { drives: DriveSummary[] }) {
  const displayDrives = drives.length > 0 ? drives.slice(0, 5) : [
    { id: "1", companyName: "TCS Ninja", jobRole: "Aptitude Test", packageCtc: 7.5, deadline: "2025-05-22", isEligible: true, hasApplied: true },
    { id: "2", companyName: "Infosys Springboard", jobRole: "Online Test", packageCtc: 9.2, deadline: "2025-05-24", isEligible: true, hasApplied: false },
    { id: "3", companyName: "Wipro Elite", jobRole: "Aptitude Test", packageCtc: 6.5, deadline: "2025-05-26", isEligible: true, hasApplied: false },
    { id: "4", companyName: "Capgemini Hiring", jobRole: "Technical Test", packageCtc: 6.8, deadline: "2025-05-28", isEligible: true, hasApplied: true },
    { id: "5", Del: "Deloitte", companyName: "Deloitte Off Campus", jobRole: "Aptitude Test", packageCtc: 11.5, deadline: "2025-05-30", isEligible: true, hasApplied: false },
  ];

  return (
    <div className="space-y-3.5">
      {displayDrives.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3.5 py-1.5 border-b border-slate-100 last:border-0"
        >
          <CompanyLogo name={d.companyName} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">
              {d.companyName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              ₹{d.packageCtc} LPA · {d.jobRole}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {d.hasApplied ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md inline-block">
                Applied ✓
              </span>
            ) : (
              <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-semibold px-2.5 hover:bg-brand-50 hover:text-brand-700">
                <Link href="/student/placement-drives">
                  Apply
                </Link>
              </Button>
            )}
          </div>
        </div>
      ))}

      <div className="pt-2 text-center">
        <Link
          href="/student/placement-drives"
          className="inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          View All Placement Drives
        </Link>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   CAMPUS RECRUITMENT ALERTS & NOTIFICATIONS
   ═════════════════════════════════════════════════════════════ */

function StudentNotificationsPanel({ notifications }: { notifications: StudentNotification[] }) {
  const displayNotifs = notifications.length > 0 ? notifications.slice(0, 4) : [
    { id: "1", title: "Interview Slot Scheduled", message: "TCS Ninja Aptitude round on 22 May, 10:00 AM", type: "INTERVIEW", createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), isRead: false },
    { id: "2", title: "New Campus Drive Eligible", message: "Infosys Springboard is open for CSE cohort", type: "DRIVE", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isRead: true },
    { id: "3", title: "Application Shortlisted", message: "Shortlisted for Capgemini Technical round", type: "RESULT", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), isRead: true },
    { id: "4", title: "Registration Closing Soon", message: "Deloitte Off Campus closes in 48 hours", type: "DEADLINE", createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), isRead: true },
  ];

  return (
    <div className="space-y-3.5">
      {displayNotifs.map((n) => {
        const timeAgo = formatTimeAgo(n.createdAt);
        return (
          <div key={n.id} className="flex items-start gap-3 py-1 border-b border-slate-100 last:border-0">
            <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-brand-50 text-brand-600">
              <Calendar className="h-4 w-4" />
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
          href="/student/notifications"
          className="inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          View All Alerts
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

