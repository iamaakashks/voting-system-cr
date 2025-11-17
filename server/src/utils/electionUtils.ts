import Student, { IStudent } from '../models/Student';
import { IElection } from '../models/Election';

type Candidate = IElection['candidates'][0];

/**
 * Enriches a list of election candidates with profile picture URLs.
 * This function is optimized to prevent N+1 query problems by fetching all student data in a single query.
 * @param candidates - An array of candidate objects from an election document.
 * @returns A promise that resolves to an array of candidates, each enriched with an `imageUrl`.
 */
export const enrichCandidatesWithProfilePictures = async (candidates: Candidate[]) => {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  // 1. Collect all unique student IDs from the candidates
  const studentIds = candidates.map(c => c.student.toString());

  // 2. Fetch all corresponding students in a single database query
  const students: IStudent[] = await Student.find({ _id: { $in: studentIds } }).select('gender');

  // 3. Create a map for efficient lookup (studentId -> gender)
  const studentGenderMap = new Map(students.map((s: IStudent) => [s._id.toString(), s.gender]));

  // 4. Map over the original candidates to enrich them with the image URL
  return candidates.map(candidate => {
    const candidateId = candidate.student.toString();
    const gender = studentGenderMap.get(candidateId) || 'male'; // Default to 'male' if not found
    const username = candidate.name.split(' ')[0]; // Use first name for the avatar
    const genderPath = gender === 'female' ? 'girl' : 'boy';
    
    const imageUrl = `https://avatar.iran.liara.run/public/${genderPath}?username=${encodeURIComponent(username)}`;

    return {
      id: candidateId,
      name: candidate.name,
      usn: candidate.usn,
      votes: candidate.votes,
      imageUrl,
    };
  });
};
