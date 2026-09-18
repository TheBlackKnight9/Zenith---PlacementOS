import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'departments.json');

export const DEPT_MAP = {
  // CSE variations
  'cse': 'CSE',
  'cs': 'CSE',
  'computer science': 'CSE',
  'computer science & engineering': 'CSE',
  'computer science and engineering': 'CSE',
  'computer science engineering': 'CSE',
  
  // IT variations
  'it': 'IT',
  'information technology': 'IT',
  
  // ECE variations
  'ece': 'ECE',
  'electronics & communication': 'ECE',
  'electronics and communication': 'ECE',
  'electronics & communication engineering': 'ECE',
  'electronics and communication engineering': 'ECE',
  
  // MECH variations
  'mech': 'MECH',
  'mechanical': 'MECH',
  'mechanical engineering': 'MECH',
  
  // CIVIL variations
  'civil': 'CIVIL',
  'civil engineering': 'CIVIL',
  
  // EE variations
  'ee': 'EE',
  'eee': 'EE',
  'electrical': 'EE',
  'electrical engineering': 'EE',
  
  // AI & DS variations
  'ai & ds': 'AI & DS',
  'ai and ds': 'AI & DS',
  'aids': 'AI & DS',
  'ai/ds': 'AI & DS',
  'ai & data science': 'AI & DS',
  'artificial intelligence & data science': 'AI & DS',
  'artificial intelligence and data science': 'AI & DS',
  'artificial intelligence & ds': 'AI & DS',

  // Other common
  'mba': 'MBA',
  'mca': 'MCA',
  'bca': 'BCA',
};

const INITIAL_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: 'Code', color: '#3b82f6', badgeColor: 'orange' },
  { code: 'IT', name: 'Information Technology', icon: 'Laptop', color: '#06b6d4', badgeColor: 'blue' },
  { code: 'AI & DS', name: 'Artificial Intelligence & Data Science', icon: 'BrainCircuit', color: '#8b5cf6', badgeColor: 'rose' },
  { code: 'ECE', name: 'Electronics & Communication', icon: 'Cpu', color: '#ec4899', badgeColor: 'purple' },
  { code: 'MECH', name: 'Mechanical Engineering', icon: 'Cog', color: '#f59e0b', badgeColor: 'amber' },
  { code: 'CIVIL', name: 'Civil Engineering', icon: 'Building2', color: '#10b981', badgeColor: 'emerald' },
  { code: 'EE', name: 'Electrical Engineering', icon: 'Zap', color: '#6366f1', badgeColor: 'indigo' },
];

const INITIAL_COORDINATORS = {
  CSE: {
    fullName: "Dr. Anirban Mukherjee",
    designation: "Professor & Head of Placements (CSE)",
    email: "anirban.m@college.edu",
    phone: "+91 98765 00201",
    office: "Tech Block A, Room 402",
    intakeCapacity: 240,
    targetPlacementRate: 90,
  },
  IT: {
    fullName: "Dr. Meera Nambiar",
    designation: "Associate Professor & TPO Coordinator",
    email: "meera.nambiar@college.edu",
    phone: "+91 98765 00202",
    office: "Tech Block B, Room 210",
    intakeCapacity: 180,
    targetPlacementRate: 85,
  },
  ECE: {
    fullName: "Prof. Rajesh Kumar Verma",
    designation: "Assistant Professor & Industry Liaison",
    email: "rajesh.verma@college.edu",
    phone: "+91 98765 00203",
    office: "Circuits & Systems Block, Room 105",
    intakeCapacity: 160,
    targetPlacementRate: 80,
  },
  MECH: {
    fullName: "Dr. Sandeep Deshpande",
    designation: "Professor & Core Placements In-Charge",
    email: "sandeep.d@college.edu",
    phone: "+91 98765 00204",
    office: "Mechanical Workshop Block, Room 301",
    intakeCapacity: 150,
    targetPlacementRate: 75,
  },
  CIVIL: {
    fullName: "Prof. Ananya Mukherjee",
    designation: "Associate Professor & TPO Representative",
    email: "ananya.m@college.edu",
    phone: "+91 98765 00205",
    office: "Structural Wing, Room 102",
    intakeCapacity: 120,
    targetPlacementRate: 70,
  },
  "AI & DS": {
    fullName: "Dr. Vikramaditya Sen",
    designation: "Head of AI Lab & Career Lead",
    email: "vikram.sen@college.edu",
    phone: "+91 98765 00206",
    office: "Innovation Hub, Room 501",
    intakeCapacity: 120,
    targetPlacementRate: 88,
  },
  EE: {
    fullName: "Dr. Arvind Swaminathan",
    designation: "Professor & Department Placement Coordinator",
    email: "arvind.s@college.edu",
    phone: "+91 98765 00207",
    office: "Electrical Sciences Block, Room 204",
    intakeCapacity: 120,
    targetPlacementRate: 82,
  },
};

export let ALL_DEPARTMENT_METADATA = [...INITIAL_DEPARTMENTS];
export let departmentCoordinatorsStore = { ...INITIAL_COORDINATORS };

// Helper to register dynamic name/code in DEPT_MAP
function registerDeptInMap(code, name) {
  if (!code) return;
  const c = code.trim().toUpperCase();
  DEPT_MAP[c.toLowerCase()] = c;
  if (name) {
    const n = name.trim().toLowerCase();
    DEPT_MAP[n] = c;
    DEPT_MAP[n.replace('&', 'and')] = c;
    DEPT_MAP[n.replace('and', '&')] = c;
  }
}

// Load persisted departments from disk if available
function loadDepartmentsFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.departments) && parsed.departments.length > 0) {
        ALL_DEPARTMENT_METADATA = parsed.departments;
      }
      if (parsed.coordinators && typeof parsed.coordinators === 'object') {
        departmentCoordinatorsStore = parsed.coordinators;
      }
    }
  } catch (err) {
    console.warn('[DepartmentHelper] Failed to load departments from disk, using defaults:', err.message);
  }

  // Populate DEPT_MAP for all loaded departments
  ALL_DEPARTMENT_METADATA.forEach((dept) => {
    registerDeptInMap(dept.code, dept.name);
  });
}

// Save departments to disk
function saveDepartmentsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      departments: ALL_DEPARTMENT_METADATA,
      coordinators: departmentCoordinatorsStore,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DepartmentHelper] Failed to persist departments to disk:', err.message);
  }
}

// Initialize on module load
loadDepartmentsFromDisk();

/**
 * Returns all registered departments metadata
 */
export function getAllDepartmentMetadata() {
  return ALL_DEPARTMENT_METADATA.map(d => ({ ...d }));
}

/**
 * Get coordinator for a department code
 */
export function getDepartmentCoordinator(code) {
  const norm = normalizeDepartment(code) || String(code).trim().toUpperCase();
  return departmentCoordinatorsStore[norm] || {
    fullName: "Faculty Coordinator",
    designation: "Placement Representative",
    email: `tpo.${norm.toLowerCase()}@college.edu`,
    phone: "+91 98765 00000",
    office: "Faculty Wing",
    intakeCapacity: 120,
    targetPlacementRate: 80,
  };
}

/**
 * Get all coordinators
 */
export function getDepartmentCoordinatorsStore() {
  return { ...departmentCoordinatorsStore };
}

/**
 * Add a new department
 */
export function addDepartmentMetadata({
  code,
  name,
  icon = 'Building2',
  color = '#3b82f6',
  badgeColor = 'blue',
  intakeCapacity = 120,
  targetPlacementRate = 80,
  coordinator = null,
}) {
  const trimmedCode = String(code).trim().toUpperCase();
  const trimmedName = String(name).trim();

  const exists = ALL_DEPARTMENT_METADATA.some(d => d.code.toUpperCase() === trimmedCode);
  if (exists) {
    throw new Error(`Department with code "${trimmedCode}" already exists`);
  }

  const newDept = {
    code: trimmedCode,
    name: trimmedName,
    icon,
    color,
    badgeColor,
    isCustom: true,
  };

  ALL_DEPARTMENT_METADATA.push(newDept);
  registerDeptInMap(trimmedCode, trimmedName);

  departmentCoordinatorsStore[trimmedCode] = coordinator ? {
    fullName: coordinator.fullName || "Faculty Coordinator",
    designation: coordinator.designation || "Placement Coordinator",
    email: coordinator.email || `coordinator.${trimmedCode.toLowerCase()}@college.edu`,
    phone: coordinator.phone || "+91 98765 00000",
    office: coordinator.office || "Faculty Wing",
    intakeCapacity: parseInt(intakeCapacity, 10) || 120,
    targetPlacementRate: parseFloat(targetPlacementRate) || 80,
  } : {
    fullName: "Faculty Coordinator",
    designation: "Placement Coordinator",
    email: `coordinator.${trimmedCode.toLowerCase()}@college.edu`,
    phone: "+91 98765 00000",
    office: "Faculty Wing",
    intakeCapacity: parseInt(intakeCapacity, 10) || 120,
    targetPlacementRate: parseFloat(targetPlacementRate) || 80,
  };

  saveDepartmentsToDisk();
  return newDept;
}

/**
 * Update an existing department (name, coordinator, intake, etc.)
 */
export function updateDepartmentMetadata(code, updates = {}) {
  const norm = normalizeDepartment(code) || String(code).trim().toUpperCase();
  const dept = ALL_DEPARTMENT_METADATA.find(d => d.code.toUpperCase() === norm);

  if (!dept) {
    throw new Error(`Department "${code}" not found`);
  }

  // Update department name if provided
  if (updates.name && typeof updates.name === 'string' && updates.name.trim()) {
    dept.name = updates.name.trim();
    registerDeptInMap(dept.code, dept.name);
  }

  if (updates.color) dept.color = updates.color;
  if (updates.icon) dept.icon = updates.icon;
  if (updates.badgeColor) dept.badgeColor = updates.badgeColor;

  // Update coordinator details if provided
  const existingCoord = departmentCoordinatorsStore[dept.code] || {};
  departmentCoordinatorsStore[dept.code] = {
    fullName: updates.fullName !== undefined ? updates.fullName : (updates.coordinator?.fullName || existingCoord.fullName || "Faculty Coordinator"),
    designation: updates.designation !== undefined ? updates.designation : (updates.coordinator?.designation || existingCoord.designation || "Placement Coordinator"),
    email: updates.email !== undefined ? updates.email : (updates.coordinator?.email || existingCoord.email || ""),
    phone: updates.phone !== undefined ? updates.phone : (updates.coordinator?.phone || existingCoord.phone || ""),
    office: updates.office !== undefined ? updates.office : (updates.coordinator?.office || existingCoord.office || "Faculty Wing"),
    intakeCapacity: updates.intakeCapacity !== undefined ? parseInt(updates.intakeCapacity, 10) : (updates.coordinator?.intakeCapacity !== undefined ? parseInt(updates.coordinator.intakeCapacity, 10) : (existingCoord.intakeCapacity || 120)),
    targetPlacementRate: updates.targetPlacementRate !== undefined ? parseFloat(updates.targetPlacementRate) : (updates.coordinator?.targetPlacementRate !== undefined ? parseFloat(updates.coordinator.targetPlacementRate) : (existingCoord.targetPlacementRate || 80)),
  };

  saveDepartmentsToDisk();
  return {
    department: { ...dept },
    coordinator: departmentCoordinatorsStore[dept.code],
  };
}

/**
 * Delete a department
 */
export function deleteDepartmentMetadata(code) {
  const norm = normalizeDepartment(code) || String(code).trim().toUpperCase();
  const idx = ALL_DEPARTMENT_METADATA.findIndex(d => d.code.toUpperCase() === norm);

  if (idx === -1) {
    throw new Error(`Department "${code}" not found`);
  }

  const removed = ALL_DEPARTMENT_METADATA.splice(idx, 1)[0];
  delete departmentCoordinatorsStore[norm];
  saveDepartmentsToDisk();
  return removed;
}

/**
 * Normalizes any department string (name or abbreviation) into a standardized code (e.g. 'CSE').
 * Returns null if dept is null, empty, 'ALL', or 'All Departments'.
 */
export function normalizeDepartment(dept) {
  if (!dept) return null;
  const raw = String(dept).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'all' || lower === 'all departments' || lower === 'all branches') {
    return null;
  }
  return DEPT_MAP[lower] || raw.toUpperCase();
}

/**
 * Builds a Prisma filter object for matching a student's department.
 * Matches both standard code (e.g. 'CSE') and full name (e.g. 'Computer Science & Engineering').
 */
export function buildStudentDeptFilter(dept) {
  const norm = normalizeDepartment(dept);
  if (!norm) return null;

  // Find all possible aliases that resolve to this code
  const aliases = [norm];
  for (const [key, code] of Object.entries(DEPT_MAP)) {
    if (code === norm) {
      aliases.push(key);
    }
  }

  return {
    OR: [
      { department: { equals: norm, mode: 'insensitive' } },
      ...aliases.map((alias) => ({ department: { equals: alias, mode: 'insensitive' } }))
    ]
  };
}

/**
 * Builds a Prisma filter object for string array fields (like eligibleBranches or targetBranches).
 * Matches if array contains the normalized code, 'ALL', or any alias.
 */
export function buildBranchArrayFilter(dept, fieldName = 'eligibleBranches') {
  const norm = normalizeDepartment(dept);
  if (!norm) return null;

  return {
    OR: [
      { [fieldName]: { has: norm } },
      { [fieldName]: { has: 'ALL' } },
      { [fieldName]: { has: 'All' } },
      { [fieldName]: { hasSome: [norm, 'ALL', 'All'] } }
    ]
  };
}

