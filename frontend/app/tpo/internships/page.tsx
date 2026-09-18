"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GraduationCap,
  Plus,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Award,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InternshipItem {
  id: string;
  companyName: string;
  roleTitle: string;
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
  applicantCount: number;
}

const ALL_BRANCHES = ["CSE", "IT", "ECE", "MECH", "CIVIL"];

export default function TpoInternshipsPage() {
  const { departmentCodes, selectedDepartmentCode, isDepartmentMatch } = useDepartment();
  const activeBranches = departmentCodes && departmentCodes.length > 0 ? departmentCodes : ALL_BRANCHES;

  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    roleTitle: "",
    durationMonths: "6",
    stipendAmount: "30000",
    location: "Bangalore / Remote",
    minCgpa: "7.0",
    maxBacklogs: "0",
    eligibleBatch: "2027",
    deadline: "",
    hasPpoOpportunity: true,
    description: "",
  });

  const [selectedBranches, setSelectedBranches] = useState<string[]>(["CSE", "IT"]);

  const loadInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartmentCode && selectedDepartmentCode !== "ALL") {
        params.append("department", selectedDepartmentCode);
      }
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await apiClient.get<{ internships: InternshipItem[] }>(`/internships${queryStr}`);
      setInternships(data.internships || []);
    } catch (err) {
      console.error("Failed to load internships:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartmentCode]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  const filteredInternships = useMemo(() => {
    if (!selectedDepartmentCode || selectedDepartmentCode === "ALL") return internships;
    return internships.filter((item) => isDepartmentMatch(item.eligibleBranches));
  }, [internships, selectedDepartmentCode, isDepartmentMatch]);

  const handleBranchToggle = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      if (selectedBranches.length > 1) {
        setSelectedBranches(selectedBranches.filter((b) => b !== branch));
      }
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        durationMonths: parseInt(formData.durationMonths, 10),
        stipendAmount: parseFloat(formData.stipendAmount),
        minCgpa: parseFloat(formData.minCgpa),
        maxBacklogs: parseInt(formData.maxBacklogs, 10),
        eligibleBatch: parseInt(formData.eligibleBatch, 10),
        eligibleBranches: selectedBranches,
        deadline: new Date(formData.deadline).toISOString(),
      };

      await apiClient.post("/internships", payload);
      setIsModalOpen(false);
      setFormData({
        companyName: "",
        roleTitle: "",
        durationMonths: "6",
        stipendAmount: "30000",
        location: "Bangalore / Remote",
        minCgpa: "7.0",
        maxBacklogs: "0",
        eligibleBatch: "2027",
        deadline: "",
        hasPpoOpportunity: true,
        description: "",
      });
      loadInternships();
    } catch (err: any) {
      setFormError(err.message || "Failed to create internship opportunity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      await apiClient.patch(`/internships/${id}/status`, { status: nextStatus });
      loadInternships();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs font-semibold">
          {filteredInternships.length} Internships Available {selectedDepartmentCode !== "ALL" ? `(${selectedDepartmentCode})` : ""}
        </Badge>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Publish New Internship
        </Button>
      </div>

      {/* Internships Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Company & Role</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Monthly Stipend</TableHead>
                <TableHead>PPO Potential</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Min CGPA</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Loading internship opportunities...
                  </TableCell>
                </TableRow>
              ) : filteredInternships.length > 0 ? (
                filteredInternships.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        {item.companyName}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.roleTitle}</div>
                    </TableCell>

                    <TableCell className="text-foreground font-medium">
                      {item.durationMonths} Months
                    </TableCell>

                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.stipendAmount.toLocaleString("en-IN")}/mo
                    </TableCell>

                    <TableCell>
                      {item.hasPpoOpportunity ? (
                        <Badge variant="success" className="text-[11px]">
                          PPO Available
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Intern Only</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.eligibleBranches.map((branch) => (
                          <span
                            key={branch}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground"
                          >
                            {branch}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-slate-800">
                      {item.minCgpa.toFixed(1)}+
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {new Date(item.deadline).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {item.applicantCount} applied
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          item.status === "ACTIVE"
                            ? "default"
                            : item.status === "CLOSED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className="text-xs"
                      >
                        {item.status === "ACTIVE" ? "Close" : "Re-open"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                    No internship opportunities posted yet. Click &quot;Publish New Internship&quot; to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Internship Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              Publish New Internship Opportunity
            </DialogTitle>
            <DialogDescription>
              Configure internship terms, monthly stipend, and conversion potential.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInternship} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Row 1: Company & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Company Name</label>
                <Input
                  required
                  placeholder="e.g. Amazon"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Internship Role</label>
                <Input
                  required
                  placeholder="e.g. SDE Intern"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2: Duration & Monthly Stipend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Duration (Months)</label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Monthly Stipend (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formData.stipendAmount}
                  onChange={(e) => setFormData({ ...formData, stipendAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Location</label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Branches */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Eligible Departments</label>
              <div className="flex flex-wrap gap-2">
                {activeBranches.map((branch) => {
                  const isSelected = selectedBranches.includes(branch);
                  return (
                    <button
                      type="button"
                      key={branch}
                      onClick={() => handleBranchToggle(branch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Cutoffs & PPO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Minimum CGPA</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={formData.minCgpa}
                  onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Eligible Batch</label>
                <Input
                  type="number"
                  required
                  value={formData.eligibleBatch}
                  onChange={(e) => setFormData({ ...formData, eligibleBatch: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Application Deadline</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            {/* PPO Toggle Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.hasPpoOpportunity}
                  onChange={(e) => setFormData({ ...formData, hasPpoOpportunity: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Pre-Placement Offer (PPO) Conversion Opportunity Available
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Publishing..." : "Publish Internship"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
