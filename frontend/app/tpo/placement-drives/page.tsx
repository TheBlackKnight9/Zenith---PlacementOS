"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  IndianRupee,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
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

interface PlacementDriveItem {
  id: string;
  companyName: string;
  jobRole: string;
  packageCtc: number;
  location: string;
  eligibleBranches: string[];
  minCgpa: number;
  maxBacklogs: number;
  eligibleBatch: number;
  deadline: string;
  status: string;
  applicantCount: number;
}

const ALL_BRANCHES = ["CSE", "IT", "ECE", "MECH", "CIVIL"];

export default function TpoPlacementDrivesPage() {
  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // New Drive Form State
  const [formData, setFormData] = useState({
    companyName: "",
    jobRole: "",
    packageCtc: "",
    location: "Bangalore, India",
    minCgpa: "7.0",
    maxBacklogs: "0",
    eligibleBatch: "2027",
    deadline: "",
    driveDate: "",
    jobDescription: "",
  });

  const [selectedBranches, setSelectedBranches] = useState<string[]>(["CSE", "IT"]);

  const loadDrives = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ drives: PlacementDriveItem[] }>("/placement-drives");
      setDrives(data.drives);
    } catch (err) {
      console.error("Failed to load placement drives:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleBranchToggle = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      if (selectedBranches.length > 1) {
        setSelectedBranches(selectedBranches.filter((b) => b !== branch));
      }
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleSelectAllBranches = () => {
    if (selectedBranches.length === ALL_BRANCHES.length) {
      setSelectedBranches(["CSE"]);
    } else {
      setSelectedBranches([...ALL_BRANCHES]);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        packageCtc: parseFloat(formData.packageCtc),
        minCgpa: parseFloat(formData.minCgpa),
        maxBacklogs: parseInt(formData.maxBacklogs, 10),
        eligibleBatch: parseInt(formData.eligibleBatch, 10),
        eligibleBranches: selectedBranches,
        deadline: new Date(formData.deadline).toISOString(),
        driveDate: formData.driveDate ? new Date(formData.driveDate).toISOString() : null,
      };

      await apiClient.post("/placement-drives", payload);
      setIsModalOpen(false);
      setFormData({
        companyName: "",
        jobRole: "",
        packageCtc: "",
        location: "Bangalore, India",
        minCgpa: "7.0",
        maxBacklogs: "0",
        eligibleBatch: "2027",
        deadline: "",
        driveDate: "",
        jobDescription: "",
      });
      loadDrives();
    } catch (err: any) {
      setFormError(err.message || "Failed to create placement drive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (driveId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      await apiClient.patch(`/placement-drives/${driveId}/status`, { status: nextStatus });
      loadDrives();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Publish New Drive
        </Button>
      </div>

      {/* Drives Data Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Company & Role</TableHead>
                <TableHead>Package CTC</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Eligible Branches</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading placement drives...
                  </TableCell>
                </TableRow>
              ) : drives.length > 0 ? (
                drives.map((drive) => (
                  <TableRow key={drive.id} className="border-border">
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        {drive.companyName}
                      </div>
                      <div className="text-xs text-muted-foreground">{drive.jobRole}</div>
                    </TableCell>

                    <TableCell className="font-bold text-primary">
                      ₹{drive.packageCtc} LPA
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {drive.location}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {drive.eligibleBranches.map((branch) => (
                          <span
                            key={branch}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground"
                          >
                            {branch}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      {drive.minCgpa.toFixed(1)}+
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(drive.deadline).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {drive.applicantCount} candidates
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          drive.status === "ACTIVE"
                            ? "default"
                            : drive.status === "CLOSED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {drive.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(drive.id, drive.status)}
                        className="text-xs"
                      >
                        {drive.status === "ACTIVE" ? "Close Drive" : "Re-open"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                    No placement drives scheduled yet. Click &quot;Publish New Drive&quot; to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Drive Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-600" />
              Publish New Placement Drive
            </DialogTitle>
            <DialogDescription>
              Configure recruitment criteria. Eligible students will immediately be notified.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDrive} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Row 1: Company & Job Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Company Name</label>
                <Input
                  required
                  placeholder="e.g. Google Cloud"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Job Role / Designation</label>
                <Input
                  required
                  placeholder="e.g. Software Engineer"
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2: Package CTC & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Package CTC (in LPA)</label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 18.5"
                  value={formData.packageCtc}
                  onChange={(e) => setFormData({ ...formData, packageCtc: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Job Location</label>
                <Input
                  required
                  placeholder="e.g. Bangalore / Hybrid"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Eligible Branches Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Eligible Departments</label>
                <button
                  type="button"
                  onClick={handleSelectAllBranches}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {selectedBranches.length === ALL_BRANCHES.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_BRANCHES.map((branch) => {
                  const isSelected = selectedBranches.includes(branch);
                  return (
                    <button
                      type="button"
                      key={branch}
                      onClick={() => handleBranchToggle(branch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Cutoff Criteria */}
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
                <label className="text-xs font-semibold text-slate-700">Max Active Backlogs</label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.maxBacklogs}
                  onChange={(e) => setFormData({ ...formData, maxBacklogs: e.target.value })}
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
            </div>

            {/* Row 5: Deadlines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Application Deadline</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Recruitment Drive Date</label>
                <Input
                  type="date"
                  value={formData.driveDate}
                  onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                />
              </div>
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
                {isSubmitting ? "Publishing..." : "Publish Placement Drive"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
