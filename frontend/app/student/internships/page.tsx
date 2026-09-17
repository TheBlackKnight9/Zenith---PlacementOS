"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  MapPin,
  Sparkles,
  Award,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EvaluatedInternship {
  id: string;
  companyName: string;
  companyLogo: string | null;
  roleTitle: string;
  description: string;
  durationMonths: number;
  stipendAmount: number;
  location: string;
  eligibleBranches: string[];
  minCgpa: number;
  maxBacklogs: number;
  eligibleBatch: number;
  deadline: string;
  hasPpoOpportunity: boolean;
  status: string;
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
  appliedAt: string | null;
}

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<EvaluatedInternship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInternship, setSelectedInternship] = useState<EvaluatedInternship | null>(null);
  const [applyingInternship, setApplyingInternship] = useState<EvaluatedInternship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function handleConfirmApply() {
    if (!applyingInternship) return;
    setIsSubmitting(true);
    setApplyError(null);
    try {
      await apiClient.post("/applications", { internshipId: applyingInternship.id });
      setInternships((prev) =>
        prev.map((item) =>
          item.id === applyingInternship.id
            ? { ...item, hasApplied: true, applicationStatus: "APPLIED" }
            : item
        )
      );
      setApplyingInternship(null);
    } catch (err: any) {
      setApplyError(err?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function loadInternships() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<{ internships: EvaluatedInternship[] }>("/students/internships");
        setInternships(data.internships);
      } catch (err) {
        console.error("Failed to load internships:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInternships();
  }, []);

  const filteredInternships = internships.filter(
    (item) =>
      item.companyName.toLowerCase().includes(search.toLowerCase()) ||
      item.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3.5">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-end">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Filter by company, role or location..."
          className="w-full sm:w-72 h-8.5 text-xs"
        />
      </div>

      {/* Internships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            Calculating internship eligibility for your profile...
          </div>
        ) : filteredInternships.length > 0 ? (
          filteredInternships.map((internship) => (
            <Card
              key={internship.id}
              className={`border transition-all hover:shadow-md ${
                internship.isEligible ? "border-border bg-card" : "border-border/60 bg-muted/40 opacity-90"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <CardTitle className="text-sm font-bold text-foreground">
                          {internship.companyName}
                        </CardTitle>
                        {internship.hasPpoOpportunity && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0 px-1.5 font-semibold">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" /> PPO Potential
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{internship.roleTitle}</div>
                    </div>
                  </div>

                  {internship.hasApplied ? (
                    <Badge variant="info">Applied ({internship.applicationStatus})</Badge>
                  ) : internship.isEligible ? (
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
                {/* Stipend & Duration */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Monthly Stipend</div>
                    <div className="text-lg font-black text-violet-700">
                      ₹{internship.stipendAmount.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-500">/ mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Duration & Mode</div>
                    <div className="text-xs text-slate-700 font-medium flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {internship.durationMonths} Months • {internship.location}
                    </div>
                  </div>
                </div>

                {/* Criteria Tags */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Min CGPA Cutoff:</span>
                    <strong className="text-slate-800">{internship.minCgpa.toFixed(1)}+</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Max Backlogs Allowed:</span>
                    <strong className="text-slate-800">{internship.maxBacklogs} allowed</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Eligible Branches:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {internship.eligibleBranches.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Target Batch:</span>
                    <strong className="text-slate-800">{internship.eligibleBatch}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Deadline:</span>
                    <strong className="text-slate-800">
                      {new Date(internship.deadline).toLocaleDateString("en-IN", {
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
                    onClick={() => setSelectedInternship(internship)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Eligibility Details
                  </button>

                  <Button
                    size="sm"
                    disabled={!internship.isEligible || internship.hasApplied}
                    variant={internship.hasApplied ? "outline" : "default"}
                    onClick={() => {
                      if (internship.isEligible && !internship.hasApplied) {
                        setApplyingInternship(internship);
                        setApplyError(null);
                      }
                    }}
                  >
                    {internship.hasApplied ? "Applied" : internship.isEligible ? "Apply Now" : "Ineligible"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No internship opportunities match your search.
          </div>
        )}
      </div>

      {/* Eligibility Breakdown Modal */}
      <Dialog open={!!selectedInternship} onOpenChange={() => setSelectedInternship(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              Eligibility Checklist
            </DialogTitle>
            <DialogDescription>
              {selectedInternship?.companyName} • {selectedInternship?.roleTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedInternship && (
            <div className="space-y-4 py-2">
              {/* Overall Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  selectedInternship.isEligible
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {selectedInternship.isEligible ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="font-bold">You are fully eligible</strong> to submit an application for this internship.
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="font-bold">You do not meet</strong> all the eligibility requirements for this internship.
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
                      Your branch: <strong>{selectedInternship.eligibilityBreakdown.branch?.studentValue}</strong> (Required: {selectedInternship.eligibleBranches.join(", ")})
                    </div>
                  </div>
                  {selectedInternship.eligibilityBreakdown.branch?.passed ? (
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
                      Your CGPA: <strong>{selectedInternship.eligibilityBreakdown.cgpa?.studentValue.toFixed(2)}</strong> (Cutoff: {selectedInternship.minCgpa.toFixed(1)}+)
                    </div>
                  </div>
                  {selectedInternship.eligibilityBreakdown.cgpa?.passed ? (
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
                      Your backlogs: <strong>{selectedInternship.eligibilityBreakdown.backlogs?.studentValue}</strong> (Max allowed: {selectedInternship.maxBacklogs})
                    </div>
                  </div>
                  {selectedInternship.eligibilityBreakdown.backlogs?.passed ? (
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
                      Your batch: <strong>{selectedInternship.eligibilityBreakdown.batch?.studentValue}</strong> (Target: {selectedInternship.eligibleBatch})
                    </div>
                  </div>
                  {selectedInternship.eligibilityBreakdown.batch?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              {/* Specific failure reasons list */}
              {selectedInternship.eligibilityReasons.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Reasons:</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-red-600">
                    {selectedInternship.eligibilityReasons.map((r, i) => (
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
      <Dialog open={!!applyingInternship} onOpenChange={() => !isSubmitting && setApplyingInternship(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              Confirm Internship Application
            </DialogTitle>
            <DialogDescription>
              Submit your candidate dossier for this internship opportunity.
            </DialogDescription>
          </DialogHeader>

          {applyingInternship && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-sm font-bold text-slate-900">{applyingInternship.companyName}</div>
                <div className="text-xs text-slate-600 font-medium">{applyingInternship.roleTitle}</div>
                <div className="text-xs font-semibold text-violet-700">
                  ₹{applyingInternship.stipendAmount.toLocaleString("en-IN")}/mo • {applyingInternship.durationMonths} Months • {applyingInternship.location}
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed">
                By submitting this application, your verified academic record and technical skill portfolio will be made available to the hiring coordinators.
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
                  onClick={() => setApplyingInternship(null)}
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
                  {isSubmitting ? "Submitting..." : "Confirm & Apply"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
