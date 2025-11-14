import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { searchStudents } from '../services/api';

// Define the shape of data for the form
interface CreateElectionData {
  title: string;
  description?: string; // Optional description
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

interface CreateElectionFormProps {
  onSubmit: (data: CreateElectionData) => void;
  onCancel: () => void;
}

// Type for react-select options
type CandidateOption = {
  value: string; // student ID
  label: string; // "Name (USN)"
  name: string;
  usn: string;
};

const CreateElectionForm: React.FC<CreateElectionFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('cs');
  const [section, setSection] = useState('a');
  const [startTime, setStartTime] = useState('');
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);

  // Async function for react-select to load student options
  const loadStudentOptions = async (inputValue: string): Promise<CandidateOption[]> => {
    if (inputValue.length < 2) return []; // Don't search for 1 char
    try {
      const students = await searchStudents(branch, section, inputValue);
      return students.map(s => ({
        value: s.id,
        label: `${s.name} (${s.usn})`,
        name: s.name,
        usn: s.usn,
      }));
    } catch (error) {
      console.error("Error searching students", error);
      return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidates.length < 2) {
      alert("Please select at least two candidates.");
      return;
    }

    if (!startTime) {
      alert("Please select a start time.");
      return;
    }

    // Calculate end time as 10 minutes from start time
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + 10 * 60 * 1000); // Add 10 minutes

    onSubmit({
      title,
      description,
      branch,
      section,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      candidates: candidates.map(c => ({ id: c.value, name: c.name, usn: c.usn })),
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-xl">
      <button onClick={onCancel} className="mb-4 text-white font-semibold hover:text-gray-300 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 className="text-3xl font-bold text-center text-white mb-6">Create New Election</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300">Election Title</label>
          <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 text-white focus:ring-blue-500 focus:border-blue-500" />
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description <span className="text-gray-500 text-xs">(Optional)</span></label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 text-white focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        
        {/* Branch and Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-300">Branch</label>
            <select id="branch" value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="cs">Computer Science (CS)</option>
              <option value="ci">CS - AI/ML (CI)</option>
              <option value="ise">Information Science (ISE)</option>
            </select>
          </div>
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-300">Section</label>
            <select id="section" value={section} onChange={e => setSection(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="a">Section A</option>
              <option value="b">Section B</option>
              <option value="c">Section C</option>
            </select>
          </div>
        </div>
        
        {/* Start Time */}
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-300">Start Time</label>
          <input type="datetime-local" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mt-1 text-white focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-gray-400 mt-1">Election will run for 10 minutes from the start time.</p>
        </div>
        
        {/* Candidates Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Candidates</label>
          <p className="text-xs text-gray-400 mb-1">Search for students by name or USN. Branch and Section must be set correctly.</p>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadStudentOptions}
            onChange={selectedOptions => setCandidates(selectedOptions as CandidateOption[])}
            placeholder="Type student name or USN..."
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#374151', // bg-gray-700
                borderColor: '#4B5563', // border-gray-600
              }),
              input: (base) => ({ ...base, color: 'white' }),
              menu: (base) => ({ ...base, backgroundColor: '#374151' }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#4B5563' : '#374151',
                color: 'white',
              }),
              multiValue: (base) => ({ ...base, backgroundColor: '#4B5563' }),
              multiValueLabel: (base) => ({ ...base, color: 'white' }),
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="submit" className="px-6 py-2 rounded-md font-semibold bg-white text-black hover:bg-gray-200 transition-colors">Create Election</button>
        </div>
      </form>
    </div>
  );
};

export default CreateElectionForm;