"use client";

import React, { useState, useEffect } from "react";
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

interface TpoApplication {
  id: string;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED" | "WITHDRAWN";
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
    setEditInternalRemarks(app.internalRemarks || "");
    setEditStudentRemarks(app.studentRemarks || "");
    setUpdateError(null);
  }

  async function handleSaveStatus() {
    if (!reviewingApp) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await apiClient.patch(`/applications/${reviewingApp.id}/status`, {
        status: editStatus,
        internalRemarks: editInternalRemarks,
        studentRemarks: editStudentRemarks,
      });

      setApplications((prev) =>
        prev.map((a) =>
          a.id === reviewingApp.id
            ? {
                ...a,
                status: editStatus as any,
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
    <div className="space-y-3.5">
      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by student name or roll number..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Dept:</span>
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
                    ? "bg-brand-50 text-brand-700 border border-brand-200 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
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
            <option value="INTERVIEW">Interview</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications Table Card */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Total Applications ({total})
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Showing {applications.length} of {total}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="w-[180px]">Candidate</TableHead>
                  <TableHead>Academics</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading application dossiers...
                    </TableCell>
                  </TableRow>
                ) : applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/50 transition-colors border-border">
                      {/* Candidate Column */}
                      <TableCell>
                        <div className="font-semibold text-foreground text-xs">{app.student.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{app.student.rollNumber}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">{app.student.email}</div>
                      </TableCell>

                      {/* Academics Column */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">{app.student.department}</span>
                          <span className="text-[11px] text-slate-400">({app.student.batchYear})</span>
                        </div>
                        <div className="text-xs font-bold text-indigo-700">
                          CGPA: {app.student.cgpa.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app.student.activeBacklogs === 0 ? (
                            <span className="text-emerald-600 font-semibold">0 Backlogs</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">{app.student.activeBacklogs} Backlogs</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Opportunity Column */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{app.opportunity.companyName}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] py-0 px-1 font-semibold ${
                              app.targetType === "PLACEMENT"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-violet-50 text-violet-700 border-violet-200"
                            }`}
                          >
                            {app.targetType}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 truncate max-w-[180px]">{app.opportunity.title}</div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {app.targetType === "PLACEMENT"
                            ? `₹${app.opportunity.packageCtc} LPA`
                            : `₹${Number(app.opportunity.stipend || 0).toLocaleString("en-IN")}/mo`}
                        </div>
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        {app.status === "SELECTED" ? (
                          <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                            Selected
                          </Badge>
                        ) : app.status === "SHORTLISTED" ? (
                          <Badge variant="default" className="bg-indigo-600 text-white font-bold">
                            Shortlisted
                          </Badge>
                        ) : app.status === "INTERVIEW" ? (
                          <Badge variant="info" className="font-bold">
                            Interview
                          </Badge>
                        ) : app.status === "UNDER_REVIEW" ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 font-bold">
                            Under Review
                          </Badge>
                        ) : app.status === "REJECTED" ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : app.status === "WITHDRAWN" ? (
                          <Badge variant="secondary" className="text-slate-500 bg-slate-100">Withdrawn</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            Applied
                          </Badge>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReview(app)}
                          className="text-xs font-semibold hover:border-brand-500 hover:text-brand-600"
                        >
                          Review Dossier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No applications match the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dossier & Status Update Dialog */}
      <Dialog open={!!reviewingApp} onOpenChange={() => !isUpdating && setReviewingApp(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-brand-600" />
              Candidate Review Desk
            </DialogTitle>
            <DialogDescription>
              {reviewingApp?.student.name} ({reviewingApp?.student.rollNumber}) • {reviewingApp?.opportunity.companyName}
            </DialogDescription>
          </DialogHeader>

          {reviewingApp && (
            <div className="space-y-4 py-2">
              {/* Candidate Quick Dossier Summary */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Academic Profile</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {reviewingApp.student.department} • Batch {reviewingApp.student.batchYear}
                  </div>
                  <div className="text-indigo-700 font-semibold">
                    CGPA: {reviewingApp.student.cgpa.toFixed(2)} | {reviewingApp.student.activeBacklogs} Backlogs
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Target Role</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {reviewingApp.opportunity.title}
                  </div>
                  <div className="text-slate-600">
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
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1.5">
                    Technical Skills
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {reviewingApp.student.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800">Recruitment Pipeline Status</label>
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
                      onClick={() => setEditStatus(st)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border text-center ${
                        editStatus === st
                          ? st === "SELECTED"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : st === "REJECTED"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-brand-600 text-white border-brand-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidential Internal Remarks (TPO Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  <span>Confidential Reviewer Notes</span>
                  <span className="text-[10px] font-normal text-slate-400">(TPO internal only • Hidden from student)</span>
                </div>
                <textarea
                  value={editInternalRemarks}
                  onChange={(e) => setEditInternalRemarks(e.target.value)}
                  placeholder="e.g. Strong problem solving, passed preliminary coding round with 100% score..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-amber-50/20 text-slate-800 outline-none focus:border-brand-500 focus:bg-white resize-none"
                />
              </div>

              {/* Student-Facing Remarks */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>Message to Candidate</span>
                  <span className="text-[10px] font-normal text-slate-400">(Visible on student application card)</span>
                </div>
                <textarea
                  value={editStudentRemarks}
                  onChange={(e) => setEditStudentRemarks(e.target.value)}
                  placeholder="e.g. Shortlisted for Technical Round 1. Check your email for Google Meet invitation..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-blue-50/20 text-slate-800 outline-none focus:border-brand-500 focus:bg-white resize-none"
                />
              </div>

              {updateError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {updateError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingApp(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90"
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
