import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import Student from "./models/Student";
import Teacher from "./models/Teacher";
import Ticket from "./models/Ticket";
import Election from "./models/Election";

// -----------------------------------------------------------------------------
// FIRST NAME POOLS (50 MALE + 50 FEMALE)
// -----------------------------------------------------------------------------
const maleNames = [
  "Aarav","Vivaan","Aditya","Arjun","Vihaan","Krishna","Ishaan","Reyansh","Ayaan","Kabir",
  "Dhruv","Rudra","Atharv","Yuvraj","Rohan","Ritvik","Nishant","Harsh","Pranav","Sahil",
  "Manish","Ujjwal","Varun","Abhinav","Samar","Tanay","Amit","Jay","Kunal","Raghav",
  "Dev","Ayush","Rakesh","Sujal","Tejas","Naman","Shaurya","Rajat","Sameer","Irfan",
  "Farhan","Prem","Siddharth","Chirag","Omkar","Girish","Sanjay","Ravi","Rakesh","Kartik"
];

const femaleNames = [
  "Ananya","Aadhya","Diya","Myra","Aanya","Saanvi","Riya","Kiara","Gauri","Anika",
  "Pari","Meera","Isha","Suhani","Aarohi","Tanvi","Nandini","Rashmi","Pragya","Muskan",
  "Sneha","Rupal","Kavya","Bhavya","Vidhi","Harini","Swara","Lavanya","Anjali","Sita",
  "Pooja","Neha","Komal","Prachi","Radhika","Srishti","Drishti","Juhi","Vrinda","Mahima",
  "Simran","Tanya","Janvi","Chaitra","Kriti","Nisha","Apoorva","Sandhya","Shreya","Mitali"
];

// -----------------------------------------------------------------------------
// LAST NAME POOL (60)
// -----------------------------------------------------------------------------
const lastNames = [
  "Patel","Sharma","Singh","Gupta","Kumar","Yadav","Reddy","Rao","Shetty","Gowda",
  "Naidu","Nair","Das","Iyer","Menon","Agarwal","Jha","Mishra","Tiwari","Pandey",
  "Joshi","Kulkarni","Desai","Bhat","Bhatia","Kapoor","Chopra","Mehta","Saxena","Verma",
  "Choudhary","Srinivas","Pawar","Gopal","Rastogi","Tripathi","Chatterjee",
  "Mukherjee","Bandyopadhyay","Banerjee","Dutta","Paul","Saha","Sarkar","Khatri",
  "Rajput","Solanki","Gohil","Bhatt","Rawat","Negi","Kohli","Gill","Ahluwalia",
  "Sandhu","Malhotra","Arora","Talwar","Sehgal"
];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
const getGenderFromName = (name: string): "male" | "female" =>
  maleNames.includes(name) ? "male" : "female";

const branches = { cs: "CS", ci: "CI", is: "IS" };
const sections = ["a", "b", "c", "d"];

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const makeUSN = (year: number, branchCode: string, rollNumber: number) =>
  `4NI${String(year).slice(-2)}${branchCode}${String(rollNumber).padStart(3, "0")}`;

// -----------------------------------------------------------------------------
// DESTROY DATA
// -----------------------------------------------------------------------------
const destroyData = async () => {
  await connectDB();
  await Student.deleteMany();
  await Teacher.deleteMany();
  await Ticket.deleteMany();
  await Election.deleteMany();
  console.log("🛑 All data destroyed!");
  process.exit();
};

// -----------------------------------------------------------------------------
// IMPORT DATA
// -----------------------------------------------------------------------------
const importData = async () => {
  try {
    await connectDB();

    await Student.deleteMany();
    await Teacher.deleteMany();
    await Ticket.deleteMany();
    await Election.deleteMany();

    console.log("🧹 Old data cleared...");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const studentsToCreate: any[] = [];
    const teachersToCreate: any[] = [];
    const usedEmails = new Set<string>();

    // ---------------- DEMO TEACHERS -----------------
    teachersToCreate.push({
      teacherId: "NI20CS001",
      name: "Dr. Demo (CS)",
      email: "teacher_cs@nie.ac.in",
      password: hashedPassword,
      branch: "cs",
    });

    teachersToCreate.push({
      teacherId: "NI20CI001",
      name: "Dr. Demo (AI&ML)",
      email: "teacher_ci@nie.ac.in",
      password: hashedPassword,
      branch: "ci",
    });
    
    // ---------------- DEMO STUDENTS (2022 Batch) -----------------
    const demoSections = ['a', 'b', 'c', 'd'];
    for (const section of demoSections) {
      const email = `student_2022_cs_${section}@nie.ac.in`;
      studentsToCreate.push({
        usn: `4NI22CS${section.charCodeAt(0)}00`,
        name: `Demo Student (CS-${section.toUpperCase()})`,
        email: email,
        password: hashedPassword,
        admissionYear: 2022,
        branch: 'cs',
        section: section,
        gender: 'male',
      });
      usedEmails.add(email);
    }

    // ---------------- RANDOM TEACHERS -----------------
    for (let i = 1; i <= 20; i++) {
      const fullName = `Prof. ${rand([...maleNames, ...femaleNames])} ${rand(lastNames)}`;
      const branchKey = ["cs", "ci", "is"][i % 3] as "cs" | "ci" | "is";
      const branchCode = branches[branchKey];
      const joinYear = 2018 + (i % 5);

      teachersToCreate.push({
        teacherId: `NI${String(joinYear).slice(-2)}${branchCode}${String(i).padStart(3, "0")}`,
        name: fullName,
        email: fullName.replace(/\s+/g, "").toLowerCase() + `_${branchKey}${i}@nie.ac.in`,
        password: hashedPassword,
        branch: branchKey,
      });
    }

    // -------------------------------------------------------------------------
    // FOUR BATCHES × 3 BRANCHES × 4 SECTIONS × 40 STUDENTS = 1920 STUDENTS
    // -------------------------------------------------------------------------
    const admissionYears = [2022, 2023, 2024, 2025];

    for (const year of admissionYears) {
      // Each branch has its own independent roll number sequence starting at 001
      const branchRollCounters: { [key: string]: number } = {
        cs: 1,
        ci: 1,
        is: 1
      };

      for (const branchKey of Object.keys(branches) as ("cs" | "ci" | "is")[]) {
        const branchCode = branches[branchKey];

        for (const section of sections) {
          for (let i = 0; i < 40; i++) {
            const firstName = rand([...maleNames, ...femaleNames]);
            const lastName = rand(lastNames);

            const gender = getGenderFromName(firstName);
            const fullName = `${firstName} ${lastName}`;

            // Use branch-specific roll counter (starts at 001 for each branch)
            const rollNumber = branchRollCounters[branchKey];
            const usn = makeUSN(year, branchCode, rollNumber);
            branchRollCounters[branchKey]++;

            let emailBase = `${year}${branchKey}_${fullName.replace(/\s+/g, "").toLowerCase()}_${section}`;
            let email = `${emailBase}@nie.ac.in`;
            let suffix = 1;

            while (usedEmails.has(email)) {
              email = `${emailBase}${suffix}@nie.ac.in`;
              suffix++;
            }

            usedEmails.add(email);

            studentsToCreate.push({
              usn,
              name: fullName,
              email,
              password: hashedPassword,
              admissionYear: year,
              branch: branchKey,
              section,
              gender,
            });
          }
        }
      }
    }

    console.log(`🎓 Students prepared: ${studentsToCreate.length}`);
    console.log(`👨‍🏫 Teachers prepared: ${teachersToCreate.length}`);

    const insertedTeachers = await Teacher.insertMany(teachersToCreate);
    const insertedStudents = await Student.insertMany(studentsToCreate);
    
    console.log(`✅ Inserted ${insertedStudents.length} students into the unified collection.`);

    console.log("📊 Creating sample elections...");

    await createSampleElections(insertedTeachers, insertedStudents);

    console.log("✅ Database seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// -----------------------------------------------------------------------------
// SAMPLE ELECTION CREATOR
// -----------------------------------------------------------------------------
const createSampleElections = async (teachers: any[], students: any[]) => {
  const now = new Date();
  const oneHour = 1000 * 60 * 60;

  const samples = [
    { branch: "cs", section: "a", year: 2025 },
    { branch: "ci", section: "b", year: 2024 },
    { branch: "is", section: "c", year: 2023 },
  ];

  for (const e of samples) {
    const teacher = teachers.find((t: any) => t.branch === e.branch);
    if (!teacher) continue;

    // Filter students by branch, section, AND admission year
    const eligibleStudents = students.filter(
      (s: any) => s.branch === e.branch && s.section === e.section && s.admissionYear === e.year
    );

    const candidates = eligibleStudents.slice(0, 3).map((s: any) => ({
      student: s._id,
      name: s.name,
      usn: s.usn,
      votes: Math.floor(Math.random() * 50),
    }));

    if (candidates.length < 1) continue;

    await Election.create({
      title: `CR Election ${e.year} - ${e.branch.toUpperCase()}-${e.section.toUpperCase()}`,
      description: "Auto-generated seed election",
      branch: e.branch,
      section: e.section,
      admissionYear: e.year,
      createdBy: teacher._id,
      startTime: new Date(now.getTime() - oneHour),
      endTime: new Date(now.getTime() + oneHour * 8),
      candidates,
    });
  }
};

// -----------------------------------------------------------------------------
// RUN MODE
// -----------------------------------------------------------------------------
if (process.argv[2] === "-d") destroyData();
else importData();