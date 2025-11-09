import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import Student from './models/Student';
import Teacher from './models/Teacher';
import Ticket from './models/Ticket';
import Election from './models/Election';

// --- Data for Generation ---
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Anika', 'Pari', 'Riya', 'Kiara', 'Gauri'
];
const lastNames = [
  'Patel', 'Sharma', 'Singh', 'Gupta', 'Kumar', 'Verma', 'Jain', 'Khan', 'Yadav', 'Reddy'
];

// Branch short-code mapping
const branches = {
  cs: 'CS',   // CSE
  ci: 'CI',   // CSE (AI&ML)
  ise: 'IS'   // Information Science
};

const sections = ['a', 'b', 'c', 'd'];
const admissionYear = 2023;

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const makeEmail = (year: number, branch: string, name: string, section: string) =>
  `${year}${branch}_${name.replace(/\s+/g, '').toLowerCase()}_${section}@nie.ac.in`;

const makeUSN = (year: number, branchCode: string, num: number) =>
  `4NI${String(year).slice(-2)}${branchCode}${String(num).padStart(3, '0')}`;

// --- Destroy Database Function ---
const destroyData = async () => {
  try {
    await connectDB();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Ticket.deleteMany();
    await Election.deleteMany();
    console.log('🛑 Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying data: ${error}`);
    process.exit(1);
  }
};

// --- Import Data Function ---
const importData = async () => {
  try {
    await connectDB();

    await Student.deleteMany();
    await Teacher.deleteMany();
    await Ticket.deleteMany();
    await Election.deleteMany();

    console.log('Cleared existing data...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const studentsToCreate = [];
    const teachersToCreate = [];
    const usedEmails = new Set<string>();

    // ---------------- DEMO USERS -----------------
    const yearYY = String(admissionYear).slice(-2);

    // Demo Student (CS-A)
    const demoName1 = 'Demo Student CS';
    studentsToCreate.push({
      usn: `4NI${yearYY}CS001`,
      name: demoName1,
      email: `${admissionYear}cs_${demoName1.replace(/\s+/g, '').toLowerCase()}_a@nie.ac.in`,
      password: hashedPassword,
      admissionYear,
      branch: 'cs',
      section: 'a'
    });

    // Demo Student (ISE-B)
    const demoName2 = 'Demo Student ISE';
    studentsToCreate.push({
      usn: `4NI${yearYY}IS001`,
      name: demoName2,
      email: `${admissionYear}ise_${demoName2.replace(/\s+/g, '').toLowerCase()}_b@nie.ac.in`,
      password: hashedPassword,
      admissionYear,
      branch: 'ise',
      section: 'b'
    });

    // Demo Teacher CS
    teachersToCreate.push({
      teacherId: 'NI20CS001',
      name: 'Dr. Demo (CS)',
      email: 'teacher_cs@nie.ac.in',
      password: hashedPassword,
      branch: 'cs'
    });

    // Demo Teacher AI/ML
    teachersToCreate.push({
      teacherId: 'NI20CI001',
      name: 'Dr. Demo (AI&ML)',
      email: 'teacher_ci@nie.ac.in',
      password: hashedPassword,
      branch: 'ci'
    });

    console.log('Prepared demo users...');

    // ---------------- RANDOM TEACHERS -----------------
    for (let i = 1; i <= 20; i++) {
      const name = `Prof. ${getRandom(firstNames)} ${getRandom(lastNames)}`;
      const branchKey = (Object.keys(branches) as (keyof typeof branches)[])[i % 3];
      const branchCode = branches[branchKey];
      const joiningYear = 2018 + (i % 5);

      teachersToCreate.push({
        teacherId: `NI${String(joiningYear).slice(-2)}${branchCode}${String(i).padStart(3, '0')}`,
        name,
        email: `${name.replace(/\s+/g, '').toLowerCase()}_${branchKey}${i}@nie.ac.in`,
        password: hashedPassword,
        branch: branchKey
      });
    }

    // ---------------- RANDOM STUDENTS -----------------
    let studentNum = 2; // Start at 2 because 001 is demo

    for (const branchKey of Object.keys(branches) as (keyof typeof branches)[]) {
      const branchCode = branches[branchKey];

      for (const section of sections) {
        for (let i = 1; i <= 20; i++) {

          let name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
          const usn = makeUSN(admissionYear, branchCode, studentNum);

          if (usn === '4NI23CS043') {
            name = 'Saanvi Patel';
          }


          let base = `${admissionYear}${branchKey}_${name.replace(/\s+/g, '').toLowerCase()}_${section}`;
          let email = `${base}@nie.ac.in`;
          let count = 1;

          while (usedEmails.has(email)) {
            email = `${base}${count}@nie.ac.in`;
            count++;
          }
          usedEmails.add(email);

          studentsToCreate.push({
            usn,
            name,
            email,
            password: hashedPassword,
            admissionYear,
            branch: branchKey,
            section
          });

          studentNum++;
        }
      }
    }

    console.log(`Generating ${teachersToCreate.length} teachers...`);
    console.log(`Generating ${studentsToCreate.length} students...`);

    // Insert into DB
    await Teacher.insertMany(teachersToCreate);
    await Student.insertMany(studentsToCreate);

    console.log('Generating elections...');
    await createElections(teachersToCreate, studentsToCreate);

    console.log('✅ Data Imported Successfully!');
    process.exit();

  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

// --- Create Elections Function ---
const createElections = async (teachers: any[], students: any[]) => {
  const now = new Date();
  const oneHour = 1000 * 60 * 60;
  const oneDay = oneHour * 24;

  const sampleElections = [
    {
      title: 'CR Election for CS-A',
      description: 'Class Representative election for Computer Science, Section A.',
      branch: 'cs',
      section: 'a',
      startTime: new Date(now.getTime() - oneHour * 2), // Started 2 hours ago
      endTime: new Date(now.getTime() + oneHour * 22), // Ends in 22 hours
      teacherEmail: 'teacher_cs@nie.ac.in',
      candidateUSNs: ['4NI23CS002', '4NI23CS003', '4NI23CS004'] // Arjun Patel and some others
    },
    {
      title: 'CR Election for ISE-B',
      description: 'Class Representative election for Information Science, Section B.',
      branch: 'ise',
      section: 'b',
      startTime: new Date(now.getTime() - oneDay), // Started 1 day ago
      endTime: new Date(now.getTime() + oneDay * 2), // Ends in 2 days
      teacherEmail: 'teacher_cs@nie.ac.in', // Can be any teacher
      candidateUSNs: ['4NI23IS001', '4NI23IS002', '4NI23IS003']
    },
    {
      title: 'Upcoming CR Election for CS-B',
      description: 'Vote for your Class Representative!',
      branch: 'cs',
      section: 'b',
      startTime: new Date(now.getTime() + oneDay), // Starts tomorrow
      endTime: new Date(now.getTime() + oneDay * 3), // Ends in 3 days
      teacherEmail: 'teacher_cs@nie.ac.in',
      candidateUSNs: ['4NI23CS022', '4NI23CS023']
    },
    {
      title: 'Past CR Election for CI-C',
      description: 'Results are in for the CI-C CR election.',
      branch: 'ci',
      section: 'c',
      startTime: new Date(now.getTime() - oneDay * 5), // Started 5 days ago
      endTime: new Date(now.getTime() - oneDay * 3), // Ended 3 days ago
      teacherEmail: 'teacher_ci@nie.ac.in',
      candidateUSNs: ['4NI23CI042', '4NI23CI043']
    }
  ];

  for (const electionData of sampleElections) {
    const teacher = teachers.find(t => t.email === electionData.teacherEmail);
    if (!teacher) {
      console.warn(`Teacher with email ${electionData.teacherEmail} not found for election ${electionData.title}`);
      continue;
    }

    const candidates = electionData.candidateUSNs.map(usn => {
      const student = students.find(s => s.usn === usn);
      if (!student) {
        console.warn(`Candidate student with USN ${usn} not found for election ${electionData.title}`);
        return null;
      }
      return { student: student._id, name: student.name, usn: student.usn, votes: Math.floor(Math.random() * 100) };
    }).filter(Boolean);

    if (candidates.length === 0) {
      console.warn(`No valid candidates for election ${electionData.title}, skipping.`);
      continue;
    }

    const newElection = new Election({
      title: electionData.title,
      description: electionData.description,
      branch: electionData.branch,
      section: electionData.section,
      startTime: electionData.startTime,
      endTime: electionData.endTime,
      createdBy: teacher._id,
      candidates: candidates
    });
    await newElection.save();

    // Generate tickets for all eligible students
    const eligibleStudents = await Student.find({ branch: electionData.branch, section: electionData.section });
    const ticketsToCreate = eligibleStudents.map(student => ({
      election: newElection._id,
      student: student._id,
      ticketString: Ticket.generateTicket(10),
      used: false
    }));

    if (ticketsToCreate.length > 0) {
      await Ticket.insertMany(ticketsToCreate);
    }
    console.log(`Created election: ${newElection.title} with ${ticketsToCreate.length} tickets.`);
  }
};

// Run destroy/import depending on flag
if (process.argv[2] === '-d') destroyData();
else importData();
