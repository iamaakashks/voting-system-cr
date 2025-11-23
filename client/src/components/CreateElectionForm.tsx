import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { searchStudents } from '../services/api';
import { motion } from 'framer-motion';

interface CreateElectionData {
  title: string;
  description?: string;
  branch: string;
  section: string;
  admissionYear: number;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

interface CreateElectionFormProps {
  onSubmit: (data: CreateElectionData) => void;
  onCancel: () => void;
}

type CandidateOption = {
  value: string;
  label: string;
  name: string;
  usn: string;
};

const CreateElectionForm: React.FC<CreateElectionFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('cs');
  const [section, setSection] = useState('a');
  const [admissionYear, setAdmissionYear] = useState<number>(2024);
  const [startTime, setStartTime] = useState('');
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdmissionYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAdmissionYear(Number(e.target.value));
    setCandidates([]);
  };

  const loadStudentOptions = async (inputValue: string) => {
    try {
      const students = await searchStudents(branch, section, admissionYear, inputValue);
      return students.map((s: any) => ({ value: s.id, label: `${s.name} (${s.usn})`, name: s.name, usn: s.usn }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (candidates.length < 2) {
      alert('Please select at least two candidates.');
      return;
    }
    if (!startTime) {
      alert('Please select a start time.');
      return;
    }
    setIsSubmitting(true);
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + 10 * 60 * 1000);

    try {
      await onSubmit({
        title,
        description,
        branch,
        section,
        admissionYear,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        candidates: candidates.map(c => ({ id: c.value, name: c.name, usn: c.usn })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="relative">
        <div className="absolute -top-20 left-0 h-56 w-56 bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 bg-white/6 rounded-full blur-[140px]" />
      </div>

      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Create New Election</h2>
          <button onClick={onCancel} className="text-gray-300 hover:text-white">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full rounded-lg p-3 bg-white/[0.06] border border-white/8 text-white outline-none focus:ring-1 focus:ring-white/40"/>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg p-3 bg-white/[0.06] border border-white/8 text-white outline-none focus:ring-1 focus:ring-white/40"/>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Branch</label>
              <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full rounded-lg p-2 bg-white/[0.06] border border-white/8 text-white">
                <option value="cs">Computer Science (CS)</option>
                <option value="ci">CS - AI/ML (CI)</option>
                <option value="ise">Information Science (ISE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Section</label>
              <select value={section} onChange={e => setSection(e.target.value)} className="w-full rounded-lg p-2 bg-white/[0.06] border border-white/8 text-white">
                <option value="a">Section A</option>
                <option value="b">Section B</option>
                <option value="c">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Batch Year</label>
              <select value={admissionYear} onChange={handleAdmissionYearChange} className="w-full rounded-lg p-2 bg-white/[0.06] border border-white/8 text-white">
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Time</label>
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-lg p-3 bg-white/[0.06] border border-white/8 text-white"/>
            <p className="text-xs text-gray-400 mt-1">Election will run for 10 minutes from the start time.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Candidates</label>
            <p className="text-xs text-gray-400 mb-2">Search for students (branch/section/year must be set).</p>
            <AsyncSelect
              key={`${admissionYear}-${branch}-${section}`}
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadStudentOptions}
              onChange={(s) => setCandidates(s as CandidateOption[])}
              placeholder="Type student name or USN..."
              styles={{
                control: base => ({ ...base, backgroundColor: '#1F2937', borderColor: 'rgba(255,255,255,0.06)' }),
                input: base => ({ ...base, color: 'white' }),
                menu: base => ({ ...base, backgroundColor: '#111827' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#111827' : '#0B0F14', color: 'white' }),
                multiValue: base => ({ ...base, backgroundColor: '#374151' }),
                multiValueLabel: base => ({ ...base, color: 'white' }),
              }}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-5 py-2 rounded-md text-gray-300 hover:text-white">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Election'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateElectionForm;
