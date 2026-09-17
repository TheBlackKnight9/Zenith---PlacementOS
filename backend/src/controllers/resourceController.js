import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const SEED_RESOURCES = [
  {
    title: 'Amazon SDE-1 Technical Interview Question Bank (2025-26)',
    description: 'Comprehensive collection of actual Amazon coding problems, Leadership Principles behavioral questions, and Low-Level System Design questions.',
    category: 'COMPANY_SPECIFIC',
    resourceType: 'QUESTION_BANK',
    externalUrl: 'https://github.com/amazon-archives/sde-interview-prep',
    companyName: 'Amazon',
    targetBranches: ['CSE', 'IT', 'AI & DS'],
    subjectDomain: 'DSA & System Design',
    fileSize: '4.8 MB (86 Pages)',
    tags: ['Amazon', 'SDE-1', 'DSA', 'Leadership Principles'],
    uploadedBy: 'TPO Placement Cell',
    isFeatured: true,
  },
  {
    title: 'TCS NQT Comprehensive Aptitude & Reasoning Past Papers',
    description: 'Solved test papers covering Quantitative Aptitude, Logical Ability, Verbal English, and Advanced Coding section for TCS Ninja & Digital.',
    category: 'COMPANY_SPECIFIC',
    resourceType: 'PDF',
    externalUrl: 'https://placementos.edu/resources/tcs_nqt_master_archive.pdf',
    companyName: 'TCS',
    targetBranches: ['ALL'],
    subjectDomain: 'Aptitude & Coding',
    fileSize: '7.2 MB (120 Pages)',
    tags: ['TCS', 'NQT', 'Aptitude', 'Ninja', 'Digital'],
    uploadedBy: 'TPO Placement Cell',
    isFeatured: true,
  },
  {
    title: 'Striver A2Z DSA Complete Sheet & Video Playlist',
    description: 'Curated roadmap of 450+ data structures & algorithms topics covering Arrays, Graphs, Dynamic Programming, and Trees with step-by-step video solutions.',
    category: 'BRANCH_CURATED',
    resourceType: 'VIDEO_PLAYLIST',
    externalUrl: 'https://youtube.com/playlist?list=striver-a2z-dsa',
    companyName: null,
    targetBranches: ['CSE', 'IT', 'AI & DS', 'ECE'],
    subjectDomain: 'Data Structures & Algorithms',
    fileSize: '120 Video Lectures',
    tags: ['DSA', 'LeetCode', 'Striver', 'Interviews', 'CS'],
    uploadedBy: 'Prof. Rajesh Sharma (TPO)',
    isFeatured: true,
  },
  {
    title: 'Full Stack Web Development Complete Roadmap & Projects',
    description: 'Industry-ready curriculum covering React 18, Node.js, Express, PostgreSQL, Next.js, and Docker microservices with production project templates.',
    category: 'BRANCH_CURATED',
    resourceType: 'VIDEO_PLAYLIST',
    externalUrl: 'https://youtube.com/playlist?list=fullstack-webdev-bootcamp',
    companyName: null,
    targetBranches: ['CSE', 'IT', 'AI & DS'],
    subjectDomain: 'Web Development',
    fileSize: '85 Video Lectures',
    tags: ['React', 'Node.js', 'Next.js', 'PostgreSQL', 'Web Dev'],
    uploadedBy: 'TPO Technical Lead',
    isFeatured: true,
  },
  {
    title: 'Quantitative Aptitude & Logical Reasoning Master Formula Book',
    description: 'Speed math shortcuts, formulas for Time & Work, Speed Distance, Permutations, Probability, Syllogisms, and Data Interpretation.',
    category: 'GENERAL_APTITUDE',
    resourceType: 'DOCX',
    externalUrl: 'https://placementos.edu/resources/quant_aptitude_formula_handbook.docx',
    companyName: null,
    targetBranches: ['ALL'],
    subjectDomain: 'Quantitative Aptitude',
    fileSize: '3.1 MB DOCX',
    tags: ['Aptitude', 'Formulas', 'Speed Math', 'All Branches'],
    uploadedBy: 'Career Development Centre',
    isFeatured: false,
  },
  {
    title: 'HR Interview & Behavioural STAR Method Script Guide',
    description: 'Top 50 HR questions: "Tell me about yourself", conflict resolution, situational judgment, and salary negotiation frameworks.',
    category: 'INTERVIEW_PREP',
    resourceType: 'PDF',
    externalUrl: 'https://placementos.edu/resources/hr_interview_script_handbook.pdf',
    companyName: null,
    targetBranches: ['ALL'],
    subjectDomain: 'HR & Behavioral',
    fileSize: '2.4 MB PDF',
    tags: ['HR Round', 'STAR Method', 'Behavioral', 'Soft Skills'],
    uploadedBy: 'Dean Corporate Relations',
    isFeatured: true,
  },
  {
    title: 'Embedded Systems & VLSI Core Question Bank (Qualcomm / TI)',
    description: 'Interview questions on C pointers, microcontroller architecture, Verilog HDL, static timing analysis, and I2C/SPI protocols.',
    category: 'BRANCH_CURATED',
    resourceType: 'QUESTION_BANK',
    externalUrl: 'https://placementos.edu/resources/embedded_vlsi_qbank.pdf',
    companyName: 'Qualcomm',
    targetBranches: ['ECE', 'EE'],
    subjectDomain: 'Embedded & VLSI',
    fileSize: '5.6 MB PDF',
    tags: ['ECE', 'Embedded', 'VLSI', 'Verilog', 'Core'],
    uploadedBy: 'ECE Department TPO Coordinator',
    isFeatured: false,
  },
  {
    title: 'Mechanical Core: Thermodynamics & Strength of Materials Guide',
    description: 'Standard campus interview questions for Tata Motors, L&T, and Mahindra covering IC engines, Som stress analysis, and fluid mechanics.',
    category: 'BRANCH_CURATED',
    resourceType: 'PDF',
    externalUrl: 'https://placementos.edu/resources/mechanical_core_prep.pdf',
    companyName: 'L&T',
    targetBranches: ['MECH'],
    subjectDomain: 'Core Mechanical',
    fileSize: '6.2 MB PDF',
    tags: ['MECH', 'Thermodynamics', 'SOM', 'Tata Motors', 'Core'],
    uploadedBy: 'MECH Department Coordinator',
    isFeatured: false,
  },
];

/**
 * Get All Placement Learning Resources with Filters
 * GET /api/resources
 */
export async function getResources(req, res, next) {
  try {
    const {
      search,
      category,
      resourceType,
      department,
      companyName,
      isFeatured,
    } = req.query;

    const where = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (resourceType && resourceType !== 'ALL') {
      where.resourceType = resourceType;
    }
    if (companyName && companyName.trim()) {
      where.companyName = { contains: companyName.trim(), mode: 'insensitive' };
    }
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    if (
      department &&
      department.trim().toUpperCase() !== 'ALL' &&
      department.trim().toUpperCase() !== 'ALL DEPARTMENTS'
    ) {
      const deptCode = department.trim().toUpperCase();
      where.OR = [
        { targetBranches: { has: deptCode } },
        { targetBranches: { has: 'ALL' } }
      ];
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { subjectDomain: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } }
          ]
        }
      ];
    }

    let resources = await prisma.placementResource.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    });

    // Auto-seed if database table is fresh
    if (resources.length === 0 && !search && (!category || category === 'ALL') && (!department || department === 'ALL' || department === 'All Departments')) {
      for (const seed of SEED_RESOURCES) {
        await prisma.placementResource.create({ data: seed });
      }
      resources = await prisma.placementResource.findMany({
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
      });
    }

    const counts = {
      all: await prisma.placementResource.count(),
      company: await prisma.placementResource.count({ where: { category: 'COMPANY_SPECIFIC' } }),
      branch: await prisma.placementResource.count({ where: { category: 'BRANCH_CURATED' } }),
      aptitude: await prisma.placementResource.count({ where: { category: 'GENERAL_APTITUDE' } }),
      interview: await prisma.placementResource.count({ where: { category: 'INTERVIEW_PREP' } }),
    };

    return sendSuccess(res, 200, 'Placement resources retrieved successfully', {
      total: resources.length,
      counts,
      resources
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload PDF File Resource
 * POST /api/resources/upload-pdf
 */
export async function uploadPdfResource(req, res, next) {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) {
      return sendError(res, 400, 'PDF file data is required', { code: 'MISSING_FILE_DATA' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'resources');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanBaseName = fileName
      ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
      : 'document.pdf';
    const finalName = cleanBaseName.toLowerCase().endsWith('.pdf') ? cleanBaseName : `${cleanBaseName}.pdf`;
    const uniqueName = `${Date.now()}-${finalName}`;
    const filePath = path.join(uploadDir, uniqueName);

    const base64Clean = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    const fileSize = `${sizeMb} MB`;
    const fileUrl = `/uploads/resources/${uniqueName}`;

    return sendSuccess(res, 200, 'PDF file uploaded successfully', {
      fileUrl,
      fileName: finalName,
      fileSize,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a New Learning Resource
 * POST /api/resources
 */
export async function createResource(req, res, next) {
  try {
    const {
      title,
      description,
      category = 'BRANCH_CURATED',
      resourceType = 'PDF',
      fileUrl,
      fileData,
      fileName,
      externalUrl,
      companyName,
      targetBranches = ['ALL'],
      subjectDomain,
      fileSize,
      tags = [],
      isFeatured = false,
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 400, 'Resource title is required', { code: 'MISSING_TITLE' });
    }

    let finalFileUrl = fileUrl ? fileUrl.trim() : null;
    let finalFileSize = fileSize ? fileSize.trim() : null;

    // Handle inline PDF binary data if provided directly in create payload
    if (fileData) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'resources');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const cleanBaseName = fileName
        ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
        : 'resource_document.pdf';
      const finalName = cleanBaseName.toLowerCase().endsWith('.pdf') ? cleanBaseName : `${cleanBaseName}.pdf`;
      const uniqueName = `${Date.now()}-${finalName}`;
      const filePath = path.join(uploadDir, uniqueName);

      const base64Clean = fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      await fs.promises.writeFile(filePath, buffer);

      finalFileUrl = `/uploads/resources/${uniqueName}`;
      finalFileSize = `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`;
    }

    const resource = await prisma.placementResource.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category,
        resourceType,
        fileUrl: finalFileUrl,
        externalUrl: externalUrl ? externalUrl.trim() : finalFileUrl,
        companyName: companyName ? companyName.trim() : null,
        targetBranches: Array.isArray(targetBranches) && targetBranches.length > 0 ? targetBranches : ['ALL'],
        subjectDomain: subjectDomain ? subjectDomain.trim() : null,
        fileSize: finalFileSize,
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isFeatured: Boolean(isFeatured),
        uploadedBy: req.user?.email || 'TPO Cell',
      }
    });

    return sendSuccess(res, 201, 'Resource published successfully', { resource });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an Existing Resource
 * PUT /api/resources/:id
 */
export async function updateResource(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      resourceType,
      fileUrl,
      externalUrl,
      companyName,
      targetBranches,
      subjectDomain,
      fileSize,
      tags,
      isFeatured,
    } = req.body;

    const existing = await prisma.placementResource.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 404, 'Resource not found', { code: 'RESOURCE_NOT_FOUND' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (category !== undefined) updateData.category = category;
    if (resourceType !== undefined) updateData.resourceType = resourceType;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl ? fileUrl.trim() : null;
    if (externalUrl !== undefined) updateData.externalUrl = externalUrl ? externalUrl.trim() : null;
    if (companyName !== undefined) updateData.companyName = companyName ? companyName.trim() : null;
    if (targetBranches !== undefined) updateData.targetBranches = Array.isArray(targetBranches) ? targetBranches : ['ALL'];
    if (subjectDomain !== undefined) updateData.subjectDomain = subjectDomain ? subjectDomain.trim() : null;
    if (fileSize !== undefined) updateData.fileSize = fileSize ? fileSize.trim() : null;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);

    const updated = await prisma.placementResource.update({
      where: { id },
      data: updateData
    });

    return sendSuccess(res, 200, 'Resource updated successfully', { resource: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a Resource
 * DELETE /api/resources/:id
 */
export async function deleteResource(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.placementResource.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 404, 'Resource not found', { code: 'RESOURCE_NOT_FOUND' });
    }

    await prisma.placementResource.delete({ where: { id } });

    return sendSuccess(res, 200, 'Resource deleted successfully', { id });
  } catch (error) {
    next(error);
  }
}
