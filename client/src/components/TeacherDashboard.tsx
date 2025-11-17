import React from 'react';
import ElectionList from './ElectionList';
import { Election } from '../types';
import { motion } from 'framer-motion';

interface TeacherDashboardProps {
  elections: Election[];
  onSelectElection: (id: string) => void;
  onCreateNew: () => void;
  onBack?: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ elections, onSelectElection, onCreateNew }) => {
  return (
    <div className="relative max-w-7xl mx-auto">
      {/* subtle ambient glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 left-0 h-80 w-80 bg-white/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-0 h-96 w-96 bg-white/4 rounded-full blur-[160px]" />
      </div>

      <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Teacher Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage elections, monitor live results and audits.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          className="px-6 py-3 rounded-xl bg-white text-black font-semibold shadow-xl hover:bg-gray-200 transition"
          onClick={onCreateNew}
        >
          + Create New Election
        </motion.button>
      </motion.header>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Active Elections</h2>
            <div className="h-[1px] flex-1 ml-6 bg-white/10" />
          </div>

          <ElectionList elections={elections} onSelectElection={onSelectElection} userRole="teacher" />
        </div>
      </motion.section>
    </div>
  );
};

export default TeacherDashboard;
