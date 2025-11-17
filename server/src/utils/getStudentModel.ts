import Student, { IStudent } from '../models/Student';

/**
 * This file is refactored to use the single, consolidated Student model.
 * The functions are kept to minimize changes in the route files,
 * but they now operate on a single collection.
 */

/**
 * The getStudentModel function is now obsolete as there is only one Student model.
 * Kept for compatibility during refactoring, but should be removed later.
 * @returns The Student model
 */
export const getStudentModel = () => {
  return Student;
};

/**
 * Find a student by their ID.
 */
export const findStudentModelById = async (studentId: string): Promise<{ student: IStudent } | null> => {
  const student = await Student.findById(studentId);
  if (student) {
    return { student };
  }
  return null;
};

/**
 * Find a student by their email.
 */
export const findStudentByEmail = async (email: string): Promise<{ student: IStudent } | null> => {
  const student = await Student.findOne({ email: email.toLowerCase() });
  if (student) {
    return { student };
  }
  return null;
};

/**
 * Find a student by their email and USN.
 */
export const findStudentByEmailAndUSN = async (email: string, usn: string): Promise<{ student: IStudent } | null> => {
  const student = await Student.findOne({ 
    email: email.toLowerCase(), 
    usn: usn.toUpperCase() 
  });
  if (student) {
    return { student };
  }
  return null;
};