// LandingPage.tsx
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onStudentLogin: () => void;
  onTeacherLogin: () => void;
}

const StepCard: React.FC<{
  index: number;
  title: string;
  description: string;
  color?: string;
}> = ({ index, title, description, color = "bg-blue-600" }) => {
  const cardVariants = {
    hidden: { opacity: 0, x: 60, y: 20, scale: 0.98 },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 110, damping: 18, mass: 0.4 },
    },
  };

  return (
    <motion.article
      className="relative md:pl-8 md:pr-8"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.45 }}
      variants={cardVariants}
    >
      <div className="flex items-start gap-6 md:gap-10">
        {/* Left side number (hidden on narrow screens handled by layout) */}
        <div className="hidden md:flex flex-col items-center">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${color}`}
          >
            {index}
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-xl max-w-xl">
          <h4 className="text-2xl font-semibold text-white mb-2">{title}</h4>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.article>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({
  onStudentLogin,
  onTeacherLogin,
}) => {
  // timeline container ref for useScroll
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // read scroll progress of the timeline container
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    // offsets map container start/end relative to viewport start/end
    offset: ["start end", "end start"],
  });

  // map progress to scaleY for the vertical line; clamp slightly so it doesn't vanish
  const lineScale = useTransform(scrollYProgress, [0, 1], [0.03, 1]);

  // subtle horizontal parallax for cards (optional extra polish)
  const cardX = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <div className="text-white bg-gradient-to-b from-black via-gray-900 to-gray-950 min-h-screen">
      {/* HERO */}
      {/* PREMIUM HERO HEADER */}
<header className="relative py-28 md:py-40 overflow-hidden bg-gradient-to-b from-black via-gray-900 to-gray-950">

  {/* Glowing background blobs */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-32 -left-20 h-96 w-96 bg-blue-700/20 rounded-full blur-[140px]" />
    <div className="absolute top-20 right-0 h-72 w-72 bg-purple-600/20 rounded-full blur-[140px]" />
    <div className="absolute bottom-0 left-1/3 h-72 w-72 bg-pink-500/10 rounded-full blur-[120px]" />
  </div>

  <div className="container mx-auto px-6 text-center relative z-10">

    {/* Animated Logo */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-8"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-28 w-28 mx-auto text-white opacity-90"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </motion.div>

    {/* Hero Title */}
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6
                bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent"
    >
      Secure • Verifiable • Trustless Elections
    </motion.h1>

    {/* Subtitle with glass panel */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mx-auto max-w-3xl mb-10 px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
    >
      <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
        VeriVote brings blockchain-backed transparency and cryptographic anonymity
        to college elections — ensuring fairness, accountability, and trust.
      </p>
    </motion.div>

    {/* CTA Buttons */}
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="flex justify-center gap-4 mt-4"
    >
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={onStudentLogin}
        className="px-8 py-4 bg-white text-black font-semibold text-lg rounded-xl shadow-xl hover:shadow-white/40 transition-all"
      >
        Student Login
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={onTeacherLogin}
        className="px-8 py-4 border border-gray-700 text-white font-semibold text-lg rounded-xl hover:bg-white/10 transition-all"
      >
        Teacher Login
      </motion.button>
    </motion.div>
  </div>
</header>


      {/* TIMELINE SECTION */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
            How Voting Works
          </h2>

          <div className="relative max-w-5xl mx-auto">
            {/* Vertical progress line container */}
            <div ref={timelineRef} className="relative">
              {/* Animated vertical line (center) */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-6 bottom-6 w-[4px]">
                {/* background rail */}
                <div className="absolute inset-0 bg-gray-800 rounded-full overflow-hidden">
                  {/* animated fill */}
                  <motion.div
                    style={{ scaleY: lineScale }}
                    className="origin-top absolute left-0 right-0 top-0 bottom-0 bg-gradient-to-b from-blue-500 via-purple-600 to-pink-500"
                  />
                </div>
              </div>

              {/* Timeline Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-y-20 md:items-start">
                {/* Left column (odd steps) */}
                <div className="flex flex-col gap-12">
                  <motion.div style={{ x: cardX }} className="relative md:pr-8">
                    {/* Dot + connector on wide screens */}
                    <div className="md:absolute md:-right-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={1}
                      title="Identity Verification"
                      description="Sign in with your college credentials (USN + official email). The system validates your eligibility without exposing private data."
                      color="bg-indigo-600"
                    />
                  </motion.div>

                  <motion.div style={{ x: cardX }} className="relative md:pr-8">
                    <div className="md:absolute md:-right-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={3}
                      title="Ticket Issuance"
                      description="After verification, you receive a one-time secret ticket (cryptographic token). The ticket is single-use and unlinkable to your identity."
                      color="bg-emerald-600"
                    />
                  </motion.div>

                  <motion.div style={{ x: cardX }} className="relative md:pr-8">
                    <div className="md:absolute md:-right-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={5}
                      title="Results Publication"
                      description="Votes (as transactions) are published to the Sepolia testnet. Results are auditable, immutable, and displayed in real-time."
                      color="bg-fuchsia-600"
                    />
                  </motion.div>
                </div>

                {/* Right column (even steps) */}
                <div className="flex flex-col gap-12">
                  <motion.div style={{ x: cardX }} className="relative md:pl-8">
                    <div className="md:absolute md:-left-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={2}
                      title="Ticket Minting"
                      description="The backend mints a cryptographic, ephemeral ticket tied to the election session. It can be validated by the voting contract but cannot be traced back to the user."
                      color="bg-blue-600"
                    />
                  </motion.div>

                  <motion.div style={{ x: cardX }} className="relative md:pl-8">
                    <div className="md:absolute md:-left-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={4}
                      title="Vote Submission"
                      description="Use your ticket to cast a vote. The ticket is consumed upon submission — the vote is recorded on-chain without any identity linkage."
                      color="bg-yellow-600"
                    />
                  </motion.div>

                  <motion.div style={{ x: cardX }} className="relative md:pl-8">
                    <div className="md:absolute md:-left-6 md:top-6 hidden md:flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-gray-900 border-2 border-gray-700 shadow" />
                    </div>

                    <StepCard
                      index={6}
                      title="Audit & Verification"
                      description="Anyone (students, election officers) can verify the vote counts against the blockchain ledger. Audits are reproducible and tamper-evident."
                      color="bg-red-600"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Mobile timeline: stacked with centered dots */}
              <div className="md:hidden mt-8">
                <div className="relative">
                  {/* thin line for mobile */}
                  <div className="absolute left-6 top-2 bottom-2 w-1 bg-gray-800 rounded" />
                  <div className="flex flex-col gap-8 pl-12">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                        1
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Identity Verification</h5>
                        <p className="text-gray-300 text-sm">
                          Sign in with your college credentials (USN + official
                          email).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                        2
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Ticket Minting</h5>
                        <p className="text-gray-300 text-sm">
                          Backend mints an ephemeral ticket tied to the election
                          session.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                        3
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Ticket Issuance</h5>
                        <p className="text-gray-300 text-sm">
                          You receive a one-time secret ticket (cryptographic
                          token).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center font-bold">
                        4
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Vote Submission</h5>
                        <p className="text-gray-300 text-sm">
                          Submit your vote; the ticket is consumed upon use.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-fuchsia-600 flex items-center justify-center font-bold">
                        5
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Results Publication</h5>
                        <p className="text-gray-300 text-sm">
                          Votes are published to the Sepolia testnet for audit.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
                        6
                      </div>
                      <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl">
                        <h5 className="font-semibold">Audit & Verification</h5>
                        <p className="text-gray-300 text-sm">
                          Anyone can verify tally against the blockchain ledger.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* end of timelineRef container */}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / CTA */}
      {/* PREMIUM CTA SECTION */}
      <section className="relative py-28 overflow-hidden bg-gradient-to-b from-gray-900 to-black border-t border-gray-800">
        {/* Subtle glowing background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-10 h-72 w-72 bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 bg-purple-600/20 rounded-full blur-[140px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="container mx-auto px-6"
        >
          {/* Frosted Glass Panel */}
          <div className="relative max-w-4xl mx-auto text-center px-10 py-16 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
            >
              Security, Privacy & Transparency
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10"
            >
              VeriVote leverages cryptographic identity-proofs, anonymous
              ticketing, and public blockchain verification to ensure elections
              remain tamper-proof, trustworthy, and impossible to manipulate.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex justify-center gap-6 mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStudentLogin}
                className="px-8 py-4 text-lg font-semibold rounded-xl bg-white text-black shadow-lg hover:shadow-white/30 transition-all"
              >
                Get Started
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={onTeacherLogin}
                className="px-8 py-4 text-lg font-semibold rounded-xl border border-gray-600 text-white hover:bg-white/10 transition-all"
              >
                Admin Console
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>
      
    </div>
  );
};

export default LandingPage;
