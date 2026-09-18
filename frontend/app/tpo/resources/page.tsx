"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  FolderGit2,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Youtube,
  FileText,
  FileSpreadsheet,
  Download,
  Building2,
  GraduationCap,
  Sparkles,
  Tag,
  Star,
  Trash2,
  Edit,
  CheckCircle2,
  Video,
  Code2,
  Layers,
  FileCode,
  Globe,
  Share2,
  Eye,
  UploadCloud,
  Link2,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUpload, UploadedFileItem } from "@/components/ui/file-upload";

interface PlacementResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: "COMPANY_SPECIFIC" | "BRANCH_CURATED" | "GENERAL_APTITUDE" | "INTERVIEW_PREP";
  resourceType: "PDF" | "QUESTION_BANK" | "VIDEO_PLAYLIST" | "DOCX" | "ARTICLE_LINK" | "CODE_REPOSITORY";
  fileUrl: string | null;
  externalUrl: string | null;
  companyName: string | null;
  targetBranches: string[];
  subjectDomain: string | null;
  fileSize: string | null;
  tags: string[];
  uploadedBy: string | null;
  isFeatured: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

const ALL_BRANCHES = ["ALL", "CSE", "IT", "AI & DS", "ECE", "MECH", "CIVIL", "EE"];

export default function TpoResourcesPage() {
  const { selectedDepartment, selectedDepartmentCode, setSelectedDepartment } = useDepartment();

  const [resources, setResources] = useState<PlacementResourceItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, company: 0, branch: 0, aptitude: 0, interview: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Add/Edit Dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<PlacementResourceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delivery Method Segment: Upload PDF vs External Web Link
  const [deliveryMethod, setDeliveryMethod] = useState<"UPLOAD_PDF" | "EXTERNAL_URL">("UPLOAD_PDF");
  const [uploadedPdf, setUploadedPdf] = useState<UploadedFileItem | null>(null);

  // In-App PDF Preview Dialog State
  const [previewResource, setPreviewResource] = useState<PlacementResourceItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenPreview = (resource: PlacementResourceItem) => {
    setPreviewResource(resource);
    setIsPreviewFullscreen(true);
    setIsPreviewModalOpen(true);
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "COMPANY_SPECIFIC" as "COMPANY_SPECIFIC" | "BRANCH_CURATED" | "GENERAL_APTITUDE" | "INTERVIEW_PREP",
    resourceType: "PDF" as "PDF" | "QUESTION_BANK" | "VIDEO_PLAYLIST" | "DOCX" | "ARTICLE_LINK" | "CODE_REPOSITORY",
    externalUrl: "",
    companyName: "",
    targetBranches: ["ALL"] as string[],
    subjectDomain: "Interview Q-Bank",
    fileSize: "",
    tags: "",
    isFeatured: false,
  });

  // Sync with global department code safely (never pass 'All Departments')
  useEffect(() => {
    if (selectedDepartmentCode && selectedDepartmentCode !== "ALL" && selectedDepartmentCode !== "All Departments") {
      setSelectedBranch(selectedDepartmentCode);
    } else {
      setSelectedBranch("ALL");
    }
  }, [selectedDepartmentCode]);

  // Fetch Resources from Backend API
  const fetchResources = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.append("category", activeTab);
      if (selectedType !== "ALL") params.append("resourceType", selectedType);

      // Only pass department if a specific branch is selected
      if (
        selectedBranch &&
        selectedBranch !== "ALL" &&
        selectedBranch !== "All Departments" &&
        selectedBranch.toUpperCase() !== "ALL DEPARTMENTS"
      ) {
        params.append("department", selectedBranch);
      }
      if (search.trim()) params.append("search", search.trim());

      const res = await apiClient.get<{
        total: number;
        counts: { all: number; company: number; branch: number; aptitude: number; interview: number };
        resources: PlacementResourceItem[];
      }>(`/resources?${params.toString()}`);

      if (res?.resources) {
        setResources(res.resources);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedType, selectedBranch, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchResources]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources(true);
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingResource(null);
    setUploadedPdf(null);
    setDeliveryMethod("UPLOAD_PDF");
    setFormData({
      title: "",
      description: "",
      category: "COMPANY_SPECIFIC",
      resourceType: "PDF",
      externalUrl: "",
      companyName: "",
      targetBranches: selectedBranch && selectedBranch !== "ALL" ? [selectedBranch] : ["ALL"],
      subjectDomain: "Interview Q-Bank",
      fileSize: "",
      tags: "PDF, Placement Prep",
      isFeatured: false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (resource: PlacementResourceItem) => {
    setEditingResource(resource);
    if (resource.fileUrl) {
      setDeliveryMethod("UPLOAD_PDF");
      setUploadedPdf({
        fileName: resource.title + ".pdf",
        fileSize: resource.fileSize || "Uploaded Document",
        fileUrl: resource.fileUrl,
      });
    } else {
      setDeliveryMethod("EXTERNAL_URL");
      setUploadedPdf(null);
    }

    setFormData({
      title: resource.title,
      description: resource.description || "",
      category: resource.category,
      resourceType: resource.resourceType,
      externalUrl: resource.externalUrl || "",
      companyName: resource.companyName || "",
      targetBranches: resource.targetBranches || ["ALL"],
      subjectDomain: resource.subjectDomain || "",
      fileSize: resource.fileSize || "",
      tags: resource.tags?.join(", ") || "",
      isFeatured: resource.isFeatured || false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Resource title is required.");
      return;
    }

    // Check delivery method validation
    const hasUploadedFile = uploadedPdf && (uploadedPdf.fileData || uploadedPdf.fileUrl);
    const hasExternalUrl = formData.externalUrl.trim().length > 0;

    if (deliveryMethod === "UPLOAD_PDF" && !hasUploadedFile && !hasExternalUrl) {
      setFormError("Please upload a PDF document file.");
      return;
    }

    if (deliveryMethod === "EXTERNAL_URL" && !hasExternalUrl && !hasUploadedFile) {
      setFormError("Please enter a valid resource URL (e.g. YouTube playlist or Drive link).");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        resourceType: hasUploadedFile ? "PDF" : formData.resourceType,
        companyName: formData.companyName.trim() || null,
        targetBranches: formData.targetBranches.length > 0 ? formData.targetBranches : ["ALL"],
        subjectDomain: formData.subjectDomain.trim() || null,
        fileSize: uploadedPdf?.fileSize || formData.fileSize || null,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured: Boolean(formData.isFeatured),
      };

      if (uploadedPdf?.fileData) {
        payload.fileData = uploadedPdf.fileData;
        payload.fileName = uploadedPdf.fileName;
      } else if (uploadedPdf?.fileUrl) {
        payload.fileUrl = uploadedPdf.fileUrl;
      }

      if (formData.externalUrl.trim()) {
        payload.externalUrl = formData.externalUrl.trim();
      }

      let savedItem: PlacementResourceItem | null = null;

      if (editingResource) {
        const res = await apiClient.put<{ resource: PlacementResourceItem }>(`/resources/${editingResource.id}`, payload);
        savedItem = res?.resource || null;
      } else {
        const res = await apiClient.post<{ resource: PlacementResourceItem }>("/resources", payload);
        savedItem = res?.resource || null;
      }

      // Optimistic UI state update so it appears instantly
      if (savedItem) {
        setResources((prev) => {
          if (editingResource) {
            return prev.map((r) => (r.id === editingResource.id ? savedItem! : r));
          }
          return [savedItem!, ...prev.filter((r) => r.id !== savedItem!.id)];
        });
        setCounts((prev) => ({
          ...prev,
          all: editingResource ? prev.all : prev.all + 1,
        }));
      }

      setIsModalOpen(false);
      await fetchResources(true);
    } catch (err: any) {
      console.error("Error saving resource:", err);
      // Even if API errored, create local optimistic card if demo mode
      const mockSaved: PlacementResourceItem = {
        id: editingResource ? editingResource.id : `local-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        resourceType: uploadedPdf ? "PDF" : formData.resourceType,
        fileUrl: uploadedPdf?.fileData || uploadedPdf?.fileUrl || null,
        externalUrl: formData.externalUrl.trim() || uploadedPdf?.fileData || uploadedPdf?.fileUrl || null,
        companyName: formData.companyName.trim() || null,
        targetBranches: formData.targetBranches,
        subjectDomain: formData.subjectDomain.trim() || null,
        fileSize: uploadedPdf?.fileSize || formData.fileSize || "PDF Document",
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        uploadedBy: "TPO Placement Cell",
        isFeatured: formData.isFeatured,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setResources((prev) => [mockSaved, ...prev.filter((r) => r.id !== mockSaved.id)]);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Resource
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiClient.delete(`/resources/${id}`);
    } catch (err) {
      console.warn("Delete API warning:", err);
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
    setCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));
  };

  // Helper for Type Icon & Badges
  const getResourceMeta = (type: string) => {
    switch (type) {
      case "VIDEO_PLAYLIST":
        return {
          icon: Youtube,
          badgeLabel: "YouTube Playlist",
          badgeClass: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        };
      case "PDF":
        return {
          icon: FileText,
          badgeLabel: "PDF Document",
          badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        };
      case "QUESTION_BANK":
        return {
          icon: Code2,
          badgeLabel: "Question Bank",
          badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
        };
      case "DOCX":
        return {
          icon: FileSpreadsheet,
          badgeLabel: "Docx / Guide",
          badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      default:
        return {
          icon: Globe,
          badgeLabel: "Curated Resource",
          badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
    }
  };

  const getResourceDownloadLink = (resource: PlacementResourceItem) => {
    if (resource.fileUrl) {
      if (resource.fileUrl.startsWith("http") || resource.fileUrl.startsWith("data:")) return resource.fileUrl;
      return `http://localhost:5000${resource.fileUrl}`;
    }
    if (resource.externalUrl) {
      if (resource.externalUrl.startsWith("http") || resource.externalUrl.startsWith("data:")) return resource.externalUrl;
      if (resource.externalUrl.startsWith("/uploads/")) return `http://localhost:5000${resource.externalUrl}`;
      return resource.externalUrl;
    }
    return "#";
  };

  const handleDownloadResource = async (resource: PlacementResourceItem) => {
    const rawUrl = getResourceDownloadLink(resource);
    if (!rawUrl || rawUrl === "#") {
      alert("No valid download link found for this resource.");
      return;
    }

    const cleanTitle = (resource.title || "resource").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const fileName = cleanTitle.toLowerCase().endsWith(".pdf") ? cleanTitle : `${cleanTitle}.pdf`;

    try {
      setIsDownloading(true);
      // For local server or data URLs, fetch as blob for seamless background download
      if (rawUrl.startsWith("data:") || rawUrl.startsWith("http://localhost:5000") || rawUrl.startsWith("/")) {
        const response = await fetch(rawUrl);
        if (!response.ok) throw new Error("Fetch failed");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }

      // Direct fallback
      const downloadUrl = rawUrl.includes("?") ? `${rawUrl}&download=true` : `${rawUrl}?download=true`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.warn("Direct blob download error, triggering fallback direct download:", error);
      const downloadUrl = rawUrl.includes("?") ? `${rawUrl}&download=true` : `${rawUrl}?download=true`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedBranch && selectedBranch !== "ALL") {
        const code = selectedBranch.toUpperCase();
        const matchesBranch =
          !r.targetBranches ||
          r.targetBranches.length === 0 ||
          r.targetBranches.includes("ALL") ||
          r.targetBranches.includes("All") ||
          r.targetBranches.some((b) => {
            const bc = b.toUpperCase();
            return (
              bc === code ||
              bc === "ALL" ||
              (code === "CSE" && (bc === "CS" || bc === "COMPUTER SCIENCE" || bc.includes("COMPUTER SCIENCE")))
            );
          });
        if (!matchesBranch) return false;
      }
      return true;
    });
  }, [resources, selectedBranch]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Executive Control Header ─── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  Placement Learning Resources & Question Banks
                </h1>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold">
                  TPO Library
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Company recruitment archives, uploaded PDF question banks, branch-wise playlists, and aptitude kits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreate}
              className="h-8 px-3 text-xs gap-1.5 shadow-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Upload / Publish Resource</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Search & Branch Filter Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company (Amazon, TCS), DSA, or tags..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase mr-1 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" /> Branch:
          </span>
          {ALL_BRANCHES.map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => {
                setSelectedBranch(branch);
                setSelectedDepartment(branch === "ALL" ? "All Departments" : branch);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all border",
                selectedBranch === branch
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Category Navigation Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border">
          <TabsList className="bg-transparent p-0 gap-6 h-10">
            <TabsTrigger
              value="ALL"
              className="relative h-10 rounded-none border-b-2 border-transparent px-2 font-semibold text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              All Resources ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              value="COMPANY_SPECIFIC"
              className="relative h-10 rounded-none border-b-2 border-transparent px-2 font-semibold text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              Company Question Banks ({counts.company})
            </TabsTrigger>
            <TabsTrigger
              value="BRANCH_CURATED"
              className="relative h-10 rounded-none border-b-2 border-transparent px-2 font-semibold text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              Branch Playlists & Kits ({counts.branch})
            </TabsTrigger>
            <TabsTrigger
              value="GENERAL_APTITUDE"
              className="relative h-10 rounded-none border-b-2 border-transparent px-2 font-semibold text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              General Aptitude & Reasoning ({counts.aptitude})
            </TabsTrigger>
            <TabsTrigger
              value="INTERVIEW_PREP"
              className="relative h-10 rounded-none border-b-2 border-transparent px-2 font-semibold text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              HR & Behavioral Prep ({counts.interview})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Resources Grid View ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-16 text-muted-foreground text-xs">
              Loading curated placement learning materials...
            </div>
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => {
              const isPdf = resource.resourceType === "PDF" || Boolean(resource.fileUrl);
              const meta = getResourceMeta(resource.resourceType);
              const IconComp = meta.icon;
              const downloadUrl = getResourceDownloadLink(resource);

              return (
                <Card
                  key={resource.id}
                  className="border border-border bg-card shadow-xs transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-3.5">
                    {/* Top Row: Type Badge + Featured + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 border", meta.badgeClass)}>
                          <IconComp className="h-3 w-3 mr-1 shrink-0" />
                          {meta.badgeLabel}
                        </Badge>
                        {resource.companyName && (
                          <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 flex items-center gap-1">
                            <Building2 className="h-2.5 w-2.5" />
                            {resource.companyName}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {resource.isFeatured && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                            <Star className="h-3 w-3 fill-amber-500" />
                            <span>Featured</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Domain */}
                    <div className="space-y-1">
                      <h3
                        onClick={() => {
                          if (isPdf) {
                            handleOpenPreview(resource);
                          } else if (downloadUrl !== "#") {
                            window.open(downloadUrl, "_blank");
                          }
                        }}
                        className="font-bold text-sm text-foreground line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
                        title={isPdf ? "Click to view PDF document" : "Click to open resource"}
                      >
                        {resource.title}
                      </h3>
                      {resource.subjectDomain && (
                        <span className="text-[11px] font-medium text-primary block">
                          Domain: {resource.subjectDomain}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {resource.description}
                    </p>

                    {/* Target Branches & File Size */}
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {resource.targetBranches?.map((branch) => (
                        <span
                          key={branch}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50"
                        >
                          {branch}
                        </span>
                      ))}
                      {resource.fileSize && (
                        <span className="text-[10px] text-muted-foreground ml-auto font-medium flex items-center gap-1">
                          {isPdf && <FileText className="h-3 w-3 text-primary" />}
                          {resource.fileSize}
                        </span>
                      )}
                    </div>
                  </CardContent>

                  {/* Card Footer Actions */}
                  <CardFooter className="p-4 pt-0 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(resource)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Resource"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resource.id, resource.title)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Resource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {isPdf ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadResource(resource)}
                          disabled={isDownloading}
                          className="h-7 px-2.5 text-xs font-semibold gap-1.5 text-foreground hover:text-primary hover:border-primary/40 border-border"
                          title="Download PDF directly"
                        >
                          <Download className="h-3 w-3 text-primary" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenPreview(resource)}
                          className="h-7 px-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1"
                          title="View PDF full window"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View PDF</span>
                        </Button>
                      </div>
                    ) : (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/20"
                      >
                        <span>Open Resource</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
              No learning resources found matching the selected filters.
            </div>
          )}
        </div>
      </Tabs>

      {/* ─── ADD / EDIT RESOURCE MODAL ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <FolderGit2 className="h-5 w-5 text-primary" />
              <span>{editingResource ? "Edit Learning Resource" : "Upload & Publish Learning Resource"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload PDF question banks, official guides, YouTube playlists (Web Dev, DSA), and general aptitude master kits.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {/* Delivery Method Segmented Control */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resource Upload Method *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("UPLOAD_PDF")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all",
                    deliveryMethod === "UPLOAD_PDF"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("EXTERNAL_URL")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all",
                    deliveryMethod === "EXTERNAL_URL"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  <Link2 className="h-4 w-4" />
                  External URL / Playlist
                </button>
              </div>
            </div>

            {/* If UPLOAD_PDF: Show Shadcn FileUpload Component */}
            {deliveryMethod === "UPLOAD_PDF" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  PDF Question Bank / Document File *
                </label>
                <FileUpload
                  value={uploadedPdf}
                  onChange={(file) => {
                    setUploadedPdf(file);
                    if (file) {
                      setFormData((prev) => ({
                        ...prev,
                        resourceType: "PDF",
                        fileSize: file.fileSize,
                        title: prev.title.trim()
                          ? prev.title
                          : file.fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
                      }));
                    }
                  }}
                  label="Upload PDF Document"
                  description="Drag & drop your question bank or study material PDF here, or browse files (Max 25MB)"
                />
              </div>
            ) : (
              /* If EXTERNAL_URL: Show External Link Input */
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Resource Web Link / YouTube Playlist / Cloud URL *
                </label>
                <Input
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  placeholder="https://youtube.com/playlist?... or https://drive.google.com/..."
                  className="h-9 text-xs"
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Resource Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Amazon SDE-1 Technical Question Bank 2026"
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Category Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Resource Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "COMPANY_SPECIFIC", label: "Company Q-Bank" },
                  { id: "BRANCH_CURATED", label: "Branch Playlist" },
                  { id: "GENERAL_APTITUDE", label: "General Aptitude" },
                  { id: "INTERVIEW_PREP", label: "HR & Interview" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id as any })}
                    className={cn(
                      "p-2 rounded-lg text-xs font-semibold border transition-all text-center",
                      formData.category === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Type Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Resource Format Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "PDF", label: "PDF Document" },
                  { id: "QUESTION_BANK", label: "Question Bank" },
                  { id: "VIDEO_PLAYLIST", label: "YouTube Playlist" },
                  { id: "DOCX", label: "Docx / Notes" },
                  { id: "ARTICLE_LINK", label: "External Guide" },
                  { id: "CODE_REPOSITORY", label: "Code Repo" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: type.id as any })}
                    className={cn(
                      "p-2 rounded-lg text-xs font-semibold border transition-all text-center",
                      formData.resourceType === type.id
                        ? "bg-primary/10 text-primary border-primary/40 font-bold"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Branches */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Disciplines / Branches *</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_BRANCHES.map((b) => {
                  const isSelected = formData.targetBranches.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        if (b === "ALL") {
                          setFormData({ ...formData, targetBranches: ["ALL"] });
                        } else {
                          const withoutAll = formData.targetBranches.filter((x) => x !== "ALL");
                          if (isSelected) {
                            const next = withoutAll.filter((x) => x !== b);
                            setFormData({ ...formData, targetBranches: next.length === 0 ? ["ALL"] : next });
                          } else {
                            setFormData({ ...formData, targetBranches: [...withoutAll, b] });
                          }
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold border transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Associated Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company Tag (Optional)</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Amazon, Google, TCS"
                  className="h-8 text-xs"
                />
              </div>

              {/* Subject Domain */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subject Domain</label>
                <Input
                  value={formData.subjectDomain}
                  onChange={(e) => setFormData({ ...formData, subjectDomain: e.target.value })}
                  placeholder="e.g. DSA, Web Dev, Aptitude"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Size / Lectures */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Size / Lecture Count (Optional)</label>
                <Input
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                  placeholder="e.g. 120 Videos or 4.5 MB"
                  className="h-8 text-xs"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Search Tags (Comma-separated)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, Next.js, Striver, DSA"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Summary & Guidance Notes</label>
              <Textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key topics covered, recommended study strategy for students..."
                className="text-xs resize-none"
              />
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isFeatured" className="text-xs font-medium text-foreground cursor-pointer">
                Highlight as Featured Resource on Student Dashboard
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-8 text-xs font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? "Publishing..." : editingResource ? "Update Resource" : "Publish Resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Dedicated In-App PDF Preview Dialog (Full Window by Default) ─── */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent
          className={cn(
            "p-0 m-0 border-0 flex flex-col bg-background text-foreground z-50 duration-200 overflow-hidden [&>button.absolute]:hidden",
            isPreviewFullscreen
              ? "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none rounded-none"
              : "fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl h-[88vh] max-h-[92vh] rounded-2xl border border-border shadow-2xl"
          )}
        >
          {previewResource && (
            <>
              {/* Top Navigation & Action Header */}
              <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-border bg-card/95 backdrop-blur flex items-center justify-between gap-3 shrink-0 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30 py-0 px-1.5 h-4">
                        PDF Document
                      </Badge>
                      {previewResource.companyName && (
                        <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5 h-4">
                          {previewResource.companyName}
                        </Badge>
                      )}
                      {previewResource.fileSize && (
                        <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                          &bull; {previewResource.fileSize}
                        </span>
                      )}
                    </div>
                    <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate max-w-[260px] sm:max-w-md md:max-w-lg lg:max-w-2xl leading-tight">
                      {previewResource.title}
                    </DialogTitle>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Prominent Download Button */}
                  <Button
                    onClick={() => handleDownloadResource(previewResource)}
                    disabled={isDownloading}
                    className="h-9 px-3.5 sm:px-4 text-xs sm:text-sm font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground gap-2 transition-all active:scale-95 cursor-pointer"
                    title="Download this PDF file"
                  >
                    <Download className={cn("h-4 w-4", isDownloading && "animate-bounce")} />
                    <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
                  </Button>

                  {/* Open in New Tab */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = getResourceDownloadLink(previewResource);
                      window.open(url, "_blank");
                    }}
                    className="h-9 px-3 text-xs font-medium gap-1.5 hidden md:inline-flex border-border/80 hover:bg-muted"
                    title="Open PDF in a new browser tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Tab</span>
                  </Button>

                  {/* Toggle Fullscreen / Windowed */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted hidden sm:inline-flex"
                    title={isPreviewFullscreen ? "Exit Fullscreen (Window mode)" : "Full Window"}
                  >
                    {isPreviewFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Close Dialog */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 hover:bg-muted border border-border/60 rounded-md"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Close</span>
                  </Button>
                </div>
              </div>

              {/* Embedded Document Viewer filling 100% of available height & width */}
              <div className="flex-1 w-full h-full min-h-0 bg-muted/10 relative overflow-hidden">
                {previewResource.fileUrl || previewResource.externalUrl ? (
                  <iframe
                    src={getResourceDownloadLink(previewResource)}
                    className="w-full h-full border-0 block"
                    title={previewResource.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 text-muted-foreground/40" />
                    <p className="text-base font-semibold text-foreground">No preview available for this document</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Please download the file directly to view its contents.</p>
                    <Button
                      onClick={() => handleDownloadResource(previewResource)}
                      className="gap-2 bg-primary text-primary-foreground font-semibold"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
