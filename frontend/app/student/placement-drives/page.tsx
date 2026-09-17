"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  MapPin,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EvaluatedDrive {
  id: string;
  companyName: string;
  jobRole: string;
  jobDescription: string;
  packageCtc: number;
  location: string;
  eligibleBranches: string[];
  minCgpa: number;
  maxBacklogs: number;
  eligibleBatch: number;
  deadline: string;
  isEligible: boolean;
  eligibilityReasons: string[];
  eligibilityBreakdown: {
    branch?: { passed: boolean; studentValue: string; requiredValue: string[] };
    cgpa?: { passed: boolean; studentValue: number; requiredValue: number };
    backlogs?: { passed: boolean; studentValue: number; requiredValue: number };
    batch?: { passed: boolean; studentValue: number; requiredValue: number };
  };
  hasApplied: boolean;
  applicationStatus: string | null;
}

export default function StudentPlacementDrivesPage() {
  const [drives, setDrives] = useState<EvaluatedDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDrive, setSelectedDrive] = useState<EvaluatedDrive | null>(null);
  const [applyingDrive, setApplyingDrive] = useState<EvaluatedDrive | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function handleConfirmApply() {
    if (!applyingDrive) return;
    setIsSubmitting(true);
    setApplyError(null);
    try {
      await apiClient.post("/applications", { driveId: applyingDrive.id });
      setDrives((prev) =>
        prev.map((d) =>
          d.id === applyingDrive.id
            ? { ...d, hasApplied: true, applicationStatus: "APPLIED" }
            : d
        )
      );
      setApplyingDrive(null);
    } catch (err: any) {
      setApplyError(err?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function loadDrives() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<{ drives: EvaluatedDrive[] }>("/students/placement-drives");
        setDrives(data.drives);
      } catch (err) {
        console.error("Failed to load drives:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDrives();
  }, []);

  const filteredDrives = drives.filter(
    (d) =>
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      d.jobRole.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3.5">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-end">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Filter by company or role..."
          className="w-full sm:w-72 h-8.5 text-xs"
        />
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            Calculating company eligibility for your profile...
          </div>
        ) : filteredDrives.length > 0 ? (
          filteredDrives.map((drive) => (
            <Card
              key={drive.id}
              className={`border transition-all hover:shadow-md ${
                drive.isEligible ? "border-border bg-card" : "border-border/60 bg-muted/40 opacity-90"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {drive.companyName}
                      </CardTitle>
                      <div className="text-[11px] text-muted-foreground">{drive.jobRole}</div>
                    </div>
                  </div>

                  {drive.hasApplied ? (
                    <Badge variant="info">Applied ({drive.applicationStatus})</Badge>
                  ) : drive.isEligible ? (
                    <Badge variant="default" className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Eligible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground bg-muted text-[11px]">
                      Not Eligible
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-0">
                {/* Package & Location */}
                <div className="flex items-baseline justify-between pt-1.5 border-t border-border">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase">Package CTC</div>
                    <div className="text-base font-black text-primary">₹{drive.packageCtc} LPA</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Location</div>
                    <div className="text-xs text-slate-700 font-medium flex items-center gap-1 justify-end">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {drive.location}
                    </div>
                  </div>
                </div>

                {/* Criteria Tags */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Min CGPA Cutoff:</span>
                    <strong className="text-slate-800">{drive.minCgpa.toFixed(1)}+</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Max Backlogs:</span>
                    <strong className="text-slate-800">{drive.maxBacklogs} allowed</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Eligible Branches:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {drive.eligibleBranches.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Application Deadline:</span>
                    <strong className="text-slate-800">
                      {new Date(drive.deadline).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDrive(drive)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Eligibility Details
                  </button>

                  <Button
                    size="sm"
                    disabled={!drive.isEligible || drive.hasApplied}
                    variant={drive.hasApplied ? "outline" : "default"}
                    onClick={() => {
                      if (drive.isEligible && !drive.hasApplied) {
                        setApplyingDrive(drive);
                        setApplyError(null);
                      }
                    }}
                  >
                    {drive.hasApplied ? "Applied" : drive.isEligible ? "Apply Now" : "Ineligible"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No placement drives match your search.
          </div>
        )}
      </div>

      {/* Eligibility Breakdown Modal */}
      <Dialog open={!!selectedDrive} onOpenChange={() => setSelectedDrive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-600" />
              Eligibility Checklist
            </DialogTitle>
            <DialogDescription>
              {selectedDrive?.companyName} • {selectedDrive?.jobRole}
            </DialogDescription>
          </DialogHeader>

          {selectedDrive && (
            <div className="space-y-4 py-2">
              {/* Overall Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  selectedDrive.isEligible
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {selectedDrive.isEligible ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="font-bold">You are fully eligible</strong> to submit an application for this drive.
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="font-bold">You do not meet</strong> all the requirements for this drive.
                    </div>
                  </>
                )}
              </div>

              {/* Itemized Pass / Fail Breakdown */}
              <div className="space-y-2.5 text-xs">
                {/* 1. Department */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900">Branch / Department</div>
                    <div className="text-slate-500">
                      Your branch: <strong>{selectedDrive.eligibilityBreakdown.branch?.studentValue}</strong> (Required: {selectedDrive.eligibleBranches.join(", ")})
                    </div>
                  </div>
                  {selectedDrive.eligibilityBreakdown.branch?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {/* 2. CGPA */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900">CGPA Threshold</div>
                    <div className="text-slate-500">
                      Your CGPA: <strong>{selectedDrive.eligibilityBreakdown.cgpa?.studentValue.toFixed(2)}</strong> (Cutoff: {selectedDrive.minCgpa.toFixed(1)}+)
                    </div>
                  </div>
                  {selectedDrive.eligibilityBreakdown.cgpa?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {/* 3. Backlogs */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900">Active Backlogs</div>
                    <div className="text-slate-500">
                      Your backlogs: <strong>{selectedDrive.eligibilityBreakdown.backlogs?.studentValue}</strong> (Max allowed: {selectedDrive.maxBacklogs})
                    </div>
                  </div>
                  {selectedDrive.eligibilityBreakdown.backlogs?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {/* 4. Batch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900">Graduation Batch</div>
                    <div className="text-slate-500">
                      Your batch: <strong>{selectedDrive.eligibilityBreakdown.batch?.studentValue}</strong> (Target: {selectedDrive.eligibleBatch})
                    </div>
                  </div>
                  {selectedDrive.eligibilityBreakdown.batch?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              {/* Specific failure reasons list */}
              {selectedDrive.eligibilityReasons.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Reasons:</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-red-600">
                    {selectedDrive.eligibilityReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Application Confirmation Modal */}
      <Dialog open={!!applyingDrive} onOpenChange={() => !isSubmitting && setApplyingDrive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-600" />
              Confirm Application
            </DialogTitle>
            <DialogDescription>
              Submit your candidate profile for this recruitment drive.
            </DialogDescription>
          </DialogHeader>

          {applyingDrive && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-sm font-bold text-slate-900">{applyingDrive.companyName}</div>
                <div className="text-xs text-slate-600 font-medium">{applyingDrive.jobRole}</div>
                <div className="text-xs font-semibold text-indigo-700">₹{applyingDrive.packageCtc} LPA • {applyingDrive.location}</div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed">
                By submitting this application, your verified academic record (CGPA, department, roll number) and profile portfolio will be forwarded directly to the recruitment committee.
              </div>

              {applyError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {applyError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyingDrive(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmApply}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
