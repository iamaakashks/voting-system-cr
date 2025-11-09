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

    console.log('✅ Data Imported Successfully!');
    process.exit();

  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

// Run destroy/import depending on flag
if (process.argv[2] === '-d') destroyData();
else importData();
