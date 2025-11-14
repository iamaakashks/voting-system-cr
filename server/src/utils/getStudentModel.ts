import Student2022 from '../models/Student2022';
import Student2023 from '../models/Student2023';
import Student2024 from '../models/Student2024';
import Student2025 from '../models/Student2025';
import { Model, Document } from 'mongoose';

type StudentModel = Model<any & Document>;

/**
 * Get the correct Student model based on admission year
 * @param admissionYear - The admission year (2022, 2023, 2024, or 2025)
 * @returns The appropriate Student model
 */
export const getStudentModel = (admissionYear: number): StudentModel => {
  switch (admissionYear) {
    case 2022:
      return Student2022;
    case 2023:
      return Student2023;
    case 2024:
      return Student2024;
    case 2025:
      return Student2025;
    default:
      throw new Error(`Invalid admission year: ${admissionYear}. Must be 2022, 2023, 2024, or 2025.`);
  }
};

/**
 * Get Student model from a student document or ID by searching all collections
 * This is useful when you only have an ID and don't know the admission year
 */
export const findStudentModelById = async (studentId: string): Promise<{ model: StudentModel; student: any } | null> => {
  const models = [
    { model: Student2022, year: 2022 },
    { model: Student2023, year: 2023 },
    { model: Student2024, year: 2024 },
    { model: Student2025, year: 2025 },
  ];

  for (const { model } of models) {
    const student = await model.findById(studentId);
    if (student) {
      return { model, student };
    }
  }

  return null;
};

/**
 * Find a student by email across all collections
 */
export const findStudentByEmail = async (email: string): Promise<{ model: StudentModel; student: any } | null> => {
  const models = [
    { model: Student2022, year: 2022 },
    { model: Student2023, year: 2023 },
    { model: Student2024, year: 2024 },
    { model: Student2025, year: 2025 },
  ];

  for (const { model } of models) {
    const student = await model.findOne({ email: email.toLowerCase() });
    if (student) {
      return { model, student };
    }
  }

  return null;
};

/**
 * Find a student by email and USN across all collections
 */
export const findStudentByEmailAndUSN = async (email: string, usn: string): Promise<{ model: StudentModel; student: any } | null> => {
  const models = [
    { model: Student2022, year: 2022 },
    { model: Student2023, year: 2023 },
    { model: Student2024, year: 2024 },
    { model: Student2025, year: 2025 },
  ];

  for (const { model } of models) {
    const student = await model.findOne({ 
      email: email.toLowerCase(), 
      usn: usn.toUpperCase() 
    });
    if (student) {
      return { model, student };
    }
  }

  return null;
};

