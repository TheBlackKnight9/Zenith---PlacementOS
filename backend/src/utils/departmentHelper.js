/**
 * Department Normalization and Query Helpers
 * Ensures consistent handling of department codes across all TPO and Student endpoints.
 */

const DEPT_MAP = {
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
