"use client";

import React, { useState, useEffect } from "react";
import {
  UserCircle,
  ShieldCheck,
  BookOpen,
  Award,
  Link as LinkIcon,
  Github,
  Linkedin,
  Globe,
  Phone,
  Plus,
  X,
  Sparkles,
  Save,
  CheckCircle2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { TypographyH3, TypographyMuted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface SkillItem {
  id: string;
  name: string;
  category: string | null;
  proficiency: string;
}

interface StudentProfile {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  plainPassword?: string | null;
  phone: string | null;
  department: string;
  batchYear: number;
  cgpa: number;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  activeBacklogs: number;
  totalBacklogs: number;
  placementStatus: boolean;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  skills: SkillItem[];
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Editable Profile Form State
  const [editableData, setEditableData] = useState({
    phone: "",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  // New Skill Form State
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("INTERMEDIATE");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Password Management State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [copiedCreds, setCopiedCreds] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage("");
    setPasswordSuccessMessage("");

    if (!passwordForm.newPassword || passwordForm.newPassword.trim().length < 6) {
      setPasswordErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrorMessage("New passwords do not match. Please re-enter.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await apiClient.put<{ plainPassword?: string }>("/students/change-password", {
        currentPassword: passwordForm.currentPassword || undefined,
        newPassword: passwordForm.newPassword.trim(),
      });

      setPasswordSuccessMessage(
        "Password changed successfully! Your updated password is now active for login and synchronized with your Training & Placement Office (TPO) records."
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      loadProfile();
    } catch (err: any) {
      setPasswordErrorMessage(err.message || "Failed to update password. Please check your credentials.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ profile: StudentProfile }>("/students/profile");
      setProfile(data.profile);
      setEditableData({
        phone: data.profile.phone || "",
        bio: data.profile.bio || "",
        githubUrl: data.profile.githubUrl || "",
        linkedinUrl: data.profile.linkedinUrl || "",
        portfolioUrl: data.profile.portfolioUrl || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load student profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      await apiClient.put("/students/profile", editableData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadProfile();
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setIsAddingSkill(true);
    try {
      await apiClient.post("/students/skills", {
        skillName: newSkillName.trim(),
        proficiency: newSkillProficiency,
      });
      setNewSkillName("");
      loadProfile();
    } catch (err: any) {
      setError(err.message || "Failed to add skill.");
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await apiClient.delete(`/students/skills/${skillId}`);
      loadProfile();
    } catch (err: any) {
      setError(err.message || "Failed to remove skill.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        Loading student academic profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Profile updated successfully!
        </div>
      )}

      {/* 1. Verified Academic Credentials (Read-Only) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-2 border-b border-border bg-muted/30 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verified Academic Records
              </CardTitle>
              <CardDescription>Official college registry records governing placement eligibility</CardDescription>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 font-semibold text-[11px] self-start sm:self-auto">
              Verified by Registrar
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Roll Number</div>
              <div className="font-mono text-base font-bold text-foreground mt-0.5">
                {profile?.rollNumber}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Department</div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {profile?.department} ({profile?.batchYear})
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="text-xs text-primary font-semibold uppercase">Current CGPA</div>
              <div className="text-xl font-black text-primary mt-0.5">
                {profile?.cgpa.toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Active Backlogs</div>
              <div className={`text-base font-bold mt-0.5 ${profile?.activeBacklogs === 0 ? "text-emerald-600" : "text-destructive"}`}>
                {profile?.activeBacklogs}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground">
            <span>10th Grade: <strong>{profile?.tenthPercentage ? `${profile.tenthPercentage}%` : "92.4%"}</strong></span>
            <span>12th Grade / Diploma: <strong>{profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : "89.6%"}</strong></span>
            <span>Placement Status: <strong className={profile?.placementStatus ? "text-emerald-600" : "text-amber-600"}>{profile?.placementStatus ? "Placed" : "In Progress"}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Portal Security & Credentials (Synchronized with TPO) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border bg-muted/30 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <KeyRound className="h-5 w-5 text-primary" />
                Portal Security & Password
              </CardTitle>
              <CardDescription>
                Manage your student login credentials. Changes are synchronized directly with your TPO placement records.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 font-semibold text-[11px] self-start sm:self-auto gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              TPO Verified Roster
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Current Credential Info */}
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registered Login Email</span>
              <span className="font-mono text-xs font-semibold text-foreground">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current Active Password</span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {showCurrentPassword ? (profile?.plainPassword || "••••••••") : "••••••••"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (profile?.plainPassword) {
                    navigator.clipboard.writeText(profile.plainPassword);
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 2000);
                  }
                }}
              >
                {copiedCreds ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
          </div>

          {passwordSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}

          {passwordErrorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordErrorMessage}</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Change Password
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">New Password *</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="e.g. rahul123"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="h-9 text-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showNewPassword ? "Hide" : "Show"}
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Confirm New Password *</label>
                <Input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-muted-foreground">
                Updating your password here will immediately reflect in the TPO dashboard so placement coordinators have matching access records.
              </p>
              <Button
                type="submit"
                disabled={isUpdatingPassword || !passwordForm.newPassword}
                className="h-9 px-4 text-xs font-semibold shrink-0 gap-1.5"
              >
                {isUpdatingPassword ? (
                  <>
                    <Save className="h-3.5 w-3.5 animate-spin" />
                    Updating & Syncing...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Editable Personal & Portfolio Details */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <UserCircle className="h-5 w-5 text-primary" />
            Personal & Portfolio Links
          </CardTitle>
          <CardDescription>
            These details are shared on your resume and candidate review dossiers
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4">
            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Professional Summary / Bio</label>
              <textarea
                rows={3}
                placeholder="Brief summary of your technical interests and career aspirations..."
                value={editableData.bio}
                onChange={(e) => setEditableData({ ...editableData, bio: e.target.value })}
                className="w-full p-3 text-sm rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="+91 9876543210"
                  value={editableData.phone}
                  onChange={(e) => setEditableData({ ...editableData, phone: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" /> GitHub Profile
                </label>
                <Input
                  placeholder="https://github.com/username"
                  value={editableData.githubUrl}
                  onChange={(e) => setEditableData({ ...editableData, githubUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn Profile
                </label>
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={editableData.linkedinUrl}
                  onChange={(e) => setEditableData({ ...editableData, linkedinUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" /> Portfolio Website
                </label>
                <Input
                  placeholder="https://yourportfolio.dev"
                  value={editableData.portfolioUrl}
                  onChange={(e) => setEditableData({ ...editableData, portfolioUrl: e.target.value })}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save Profile Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* 3. Technical Skills Manager */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Verified Technical Skills
          </CardTitle>
          <CardDescription>
            Add your core competencies to match with company required skill tags
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Skills Badges */}
          <div className="flex flex-wrap gap-2">
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold shadow-xs"
                >
                  <span className="text-slate-900">{skill.name}</span>
                  <span className="text-[10px] text-brand-600 font-bold uppercase bg-brand-50 px-1 rounded">
                    {skill.proficiency}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-slate-400 hover:text-red-600 ml-1 transition-colors"
                    title="Remove skill"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400">No skills added yet.</span>
            )}
          </div>

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Skill name (e.g. Next.js, Docker, Java)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1"
            />

            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>

            <Button type="submit" variant="secondary" disabled={isAddingSkill || !newSkillName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
