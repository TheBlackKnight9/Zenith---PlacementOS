import { PrismaClient, Role, DriveStatus, ApplicationStatus, InterviewMode, InterviewStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PlacementOS database seeding...');

  // Clear existing data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.selectionResult.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.skillAssessment.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.internshipOpportunity.deleteMany();
  await prisma.placementDrive.deleteMany();
  await prisma.tpoProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const tpoPassword = await bcrypt.hash('Tpo@12345', 10);
  const studentPassword = await bcrypt.hash('Student@12345', 10);

  // 1. Create TPO User and Profile
  const tpoUser = await prisma.user.create({
    data: {
      email: 'tpo@college.edu',
      passwordHash: tpoPassword,
      role: Role.TPO,
      tpoProfile: {
        create: {
          fullName: 'Dr. Robert Vance',
          designation: 'Head of Training & Placement Cell',
          department: 'Placement Cell',
          phone: '+91 9876500001'
        }
      }
    },
    include: { tpoProfile: true }
  });

  const tpoProfileId = tpoUser.tpoProfile.id;
  console.log('✅ Created TPO Administrator:', tpoUser.email);

  // 2. Create Core Technical Skills
  const skillsData = [
    { name: 'JavaScript', category: 'Programming' },
    { name: 'TypeScript', category: 'Programming' },
    { name: 'Python', category: 'Programming' },
    { name: 'Java', category: 'Programming' },
    { name: 'C++', category: 'Programming' },
    { name: 'React.js', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express.js', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Data Structures & Algorithms', category: 'Fundamentals' }
  ];

  const createdSkills = {};
  for (const skill of skillsData) {
    const s = await prisma.skill.create({ data: skill });
    createdSkills[skill.name] = s.id;
  }
  console.log(`✅ Created ${skillsData.length} core skills.`);

  // 3. Create Sample Students Cohort (2027 and 2026 batches)
  const studentsConfig = [
    {
      email: 'student@college.edu',
      passwordHash: studentPassword,
      rollNumber: '23CS001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '+91 9876500101',
      department: 'CSE',
      batchYear: 2027,
      cgpa: 8.85,
      tenthPercentage: 94.2,
      twelfthPercentage: 91.5,
      activeBacklogs: 0,
      totalBacklogs: 0,
      placementStatus: false,
      githubUrl: 'https://github.com/aarav-sharma',
      linkedinUrl: 'https://linkedin.com/in/aarav-sharma',
      skills: ['React.js', 'Node.js', 'PostgreSQL', 'Data Structures & Algorithms']
    },
    {
      email: 'priya.patel@college.edu',
      passwordHash: defaultPassword,
      rollNumber: '23CS002',
      firstName: 'Priya',
      lastName: 'Patel',
      phone: '+91 9876500102',
      department: 'CSE',
      batchYear: 2027,
      cgpa: 9.42,
      tenthPercentage: 96.0,
      twelfthPercentage: 95.2,
      activeBacklogs: 0,
      totalBacklogs: 0,
      placementStatus: false,
      githubUrl: 'https://github.com/priya-patel',
      linkedinUrl: 'https://linkedin.com/in/priya-patel',
      skills: ['Java', 'Docker', 'AWS', 'Data Structures & Algorithms']
    },
    {
      email: 'rohan.verma@college.edu',
      passwordHash: defaultPassword,
      rollNumber: '23IT001',
      firstName: 'Rohan',
      lastName: 'Verma',
      phone: '+91 9876500103',
      department: 'IT',
      batchYear: 2027,
      cgpa: 7.60,
      tenthPercentage: 88.0,
      twelfthPercentage: 84.5,
      activeBacklogs: 0,
      totalBacklogs: 0,
      placementStatus: false,
      githubUrl: 'https://github.com/rohan-verma',
      linkedinUrl: 'https://linkedin.com/in/rohan-verma',
      skills: ['JavaScript', 'React.js', 'MongoDB']
    },
    {
      email: 'sneha.reddy@college.edu',
      passwordHash: defaultPassword,
      rollNumber: '23EC001',
      firstName: 'Sneha',
      lastName: 'Reddy',
      phone: '+91 9876500104',
      department: 'ECE',
      batchYear: 2027,
      cgpa: 8.10,
      tenthPercentage: 91.0,
      twelfthPercentage: 89.0,
      activeBacklogs: 0,
      totalBacklogs: 0,
      placementStatus: false,
      githubUrl: 'https://github.com/sneha-reddy',
      skills: ['C++', 'Python', 'Data Structures & Algorithms']
    },
    {
      email: 'vikram.singh@college.edu',
      passwordHash: defaultPassword,
      rollNumber: '23ME001',
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '+91 9876500105',
      department: 'MECH',
      batchYear: 2027,
      cgpa: 6.80,
      tenthPercentage: 80.5,
      twelfthPercentage: 78.0,
      activeBacklogs: 1,
      totalBacklogs: 2,
      placementStatus: false,
      skills: ['Python']
    }
  ];

  const createdStudents = [];
  for (const s of studentsConfig) {
    const { skills, email, passwordHash, ...studentFields } = s;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.STUDENT,
        student: {
          create: studentFields
        }
      },
      include: { student: true }
    });

    // Link skills
    for (const skillName of skills) {
      if (createdSkills[skillName]) {
        await prisma.studentSkill.create({
          data: {
            studentId: user.student.id,
            skillId: createdSkills[skillName],
            proficiency: 'INTERMEDIATE'
          }
        });
      }
    }

    // Create default resume for student
    await prisma.resume.create({
      data: {
        studentId: user.student.id,
        title: `${user.student.firstName}'s Tech Resume`,
        templateName: 'modern',
        isDefault: true,
        contentJson: {
          summary: `Passionate ${user.student.department} undergraduate at Zenith Institute.`,
          skills: skills,
          education: [
            { institution: 'Zenith Institute of Technology', degree: 'B.Tech', department: user.student.department, cgpa: user.student.cgpa }
          ]
        }
      }
    });

    createdStudents.push(user.student);
  }
  console.log(`✅ Created ${createdStudents.length} sample students with default resumes and skills.`);

  // 4. Create Placement Drives
  const googleDrive = await prisma.placementDrive.create({
    data: {
      tpoId: tpoProfileId,
      companyName: 'Google Cloud',
      jobRole: 'Cloud Solutions Engineer',
      jobDescription: 'Design resilient distributed cloud systems for enterprise clients.',
      packageCtc: 18.5,
      location: 'Bangalore, India (Hybrid)',
      eligibleBranches: ['CSE', 'IT'],
      minCgpa: 8.5,
      maxBacklogs: 0,
      eligibleBatch: 2027,
      skillsRequired: ['Python', 'Docker', 'AWS', 'Data Structures & Algorithms'],
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days ahead
      driveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: DriveStatus.ACTIVE
    }
  });

  const microsoftDrive = await prisma.placementDrive.create({
    data: {
      tpoId: tpoProfileId,
      companyName: 'Microsoft',
      jobRole: 'Software Engineer',
      jobDescription: 'Build next-gen services across Azure and Microsoft 365.',
      packageCtc: 22.0,
      location: 'Hyderabad, India',
      eligibleBranches: ['CSE', 'IT', 'ECE'],
      minCgpa: 8.0,
      maxBacklogs: 0,
      eligibleBatch: 2027,
      skillsRequired: ['C++', 'Java', 'Data Structures & Algorithms'],
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      status: DriveStatus.ACTIVE
    }
  });

  const tcsDrive = await prisma.placementDrive.create({
    data: {
      tpoId: tpoProfileId,
      companyName: 'TCS Digital',
      jobRole: 'Digital Systems Engineer',
      jobDescription: 'Enterprise software development and digital transformation.',
      packageCtc: 7.5,
      location: 'Chennai / Pan-India',
      eligibleBranches: ['CSE', 'IT', 'ECE', 'MECH'],
      minCgpa: 6.5,
      maxBacklogs: 1,
      eligibleBatch: 2027,
      skillsRequired: ['Java', 'Python'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: DriveStatus.ACTIVE
    }
  });

  console.log('✅ Created Placement Drives: Google Cloud, Microsoft, TCS Digital.');

  // 5. Create Internship Opportunities
  const amazonInternship = await prisma.internshipOpportunity.create({
    data: {
      tpoId: tpoProfileId,
      companyName: 'Amazon',
      roleTitle: 'Software Development Intern',
      description: '6-month full-time internship with high pre-placement offer (PPO) conversion potential.',
      durationMonths: 6,
      stipendAmount: 50000.0,
      location: 'Bangalore, India',
      eligibleBranches: ['CSE', 'IT'],
      minCgpa: 8.0,
      maxBacklogs: 0,
      eligibleBatch: 2027,
      hasPpoOpportunity: true,
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: DriveStatus.ACTIVE
    }
  });

  console.log('✅ Created Internship Opportunity: Amazon SDE Intern.');

  // 6. Create Realistic Applications and Workflow Stages
  const primaryStudent = createdStudents[0]; // Aarav Sharma (Eligible for Google, Microsoft, TCS)
  const topStudent = createdStudents[1];     // Priya Patel (Eligible for all)

  // Aarav applies to Microsoft -> SHORTLISTED -> INTERVIEW SCHEDULED
  const aaravResume = await prisma.resume.findFirst({ where: { studentId: primaryStudent.id } });
  const app1 = await prisma.application.create({
    data: {
      studentId: primaryStudent.id,
      driveId: microsoftDrive.id,
      resumeId: aaravResume?.id,
      status: ApplicationStatus.INTERVIEW,
      internalRemarks: 'Strong candidate in DSA and competitive programming.',
      studentRemarks: 'Passionate about systems programming.',
      interviews: {
        create: {
          roundNumber: 1,
          roundName: 'Technical Round 1 (DSA & Problem Solving)',
          scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          mode: InterviewMode.ONLINE,
          venueOrLink: 'https://meet.google.com/xyz-placement-interview',
          instructions: 'Join 5 minutes prior with a working webcam and IDE ready.',
          status: InterviewStatus.SCHEDULED,
          internalFeedback: 'Scheduled with Senior Engineering Manager.'
        }
      }
    }
  });

  // Priya Patel applies to Google Cloud -> SELECTED
  const priyaResume = await prisma.resume.findFirst({ where: { studentId: topStudent.id } });
  const app2 = await prisma.application.create({
    data: {
      studentId: topStudent.id,
      driveId: googleDrive.id,
      resumeId: priyaResume?.id,
      status: ApplicationStatus.SELECTED,
      internalRemarks: 'Outstanding system design performance.',
      selectionResult: {
        create: {
          companyName: 'Google Cloud',
          offeredPackage: 18.5,
          offerDate: new Date(),
          joiningDate: new Date('2027-07-15'),
          isAccepted: true,
          hasJoined: false
        }
      }
    }
  });

  // Mark Priya as placed
  await prisma.student.update({
    where: { id: topStudent.id },
    data: { placementStatus: true }
  });

  console.log('✅ Created test applications, interview rounds, and selection records.');

  // 7. Create Skill Assessment
  const assessment = await prisma.skillAssessment.create({
    data: {
      title: 'Core Java & Data Structures Assessment',
      description: 'Test your grasp of OOP principles, collections, and algorithmic complexity.',
      category: 'TECHNICAL',
      timeLimitMinutes: 20,
      totalQuestions: 3,
      passingScore: 60,
      questions: {
        create: [
          {
            questionText: 'Which data structure offers O(1) average time complexity for key lookups?',
            options: ['LinkedList', 'Binary Search Tree', 'HashMap / Hash Table', 'Array'],
            correctOptionIndex: 2,
            explanation: 'Hash tables calculate array indices using hash functions, achieving amortized O(1) retrieval.'
          },
          {
            questionText: 'What principle is demonstrated when a subclass provides a specific implementation of a parent method?',
            options: ['Encapsulation', 'Method Overriding (Polymorphism)', 'Abstraction', 'Inheritance Chain'],
            correctOptionIndex: 1,
            explanation: 'Runtime polymorphism is achieved via method overriding in object-oriented programming.'
          },
          {
            questionText: 'What is the worst-case time complexity of QuickSort?',
            options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
            correctOptionIndex: 1,
            explanation: 'When the pivot selection repeatedly yields unbalanced partitions, QuickSort degrades to O(N^2).'
          }
        ]
      }
    }
  });

  // Record a passed assessment for Aarav
  await prisma.assessmentResult.create({
    data: {
      studentId: primaryStudent.id,
      assessmentId: assessment.id,
      score: 100,
      passed: true,
      answers: [
        { questionIndex: 0, selectedOptionIndex: 2 },
        { questionIndex: 1, selectedOptionIndex: 1 },
        { questionIndex: 2, selectedOptionIndex: 1 }
      ]
    }
  });

  console.log('✅ Created Skill Assessment and sample student scorecard.');

  // 8. Create System Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: primaryStudent.userId,
        title: 'Interview Scheduled: Microsoft',
        message: 'Your Technical Round 1 with Microsoft has been scheduled for Oct 18 at 2:00 PM.',
        type: 'INTERVIEW',
        link: '/student/interviews',
        isRead: false
      },
      {
        userId: primaryStudent.userId,
        title: 'New Eligible Placement Drive',
        message: 'Google Cloud has posted an opening for Cloud Solutions Engineer (18.5 LPA). You are eligible to apply.',
        type: 'DRIVE_ALERT',
        link: '/student/placement-drives',
        isRead: true
      }
    ]
  });

  console.log('✅ Created notifications.');
  console.log('\n🎉 PlacementOS database seeding successfully completed!');
  console.log('----------------------------------------------------');
  console.log('TPO Admin Account:    tpo@college.edu      / Tpo@12345');
  console.log('Student Test Account: student@college.edu  / Student@12345');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
