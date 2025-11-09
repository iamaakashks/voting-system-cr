import React from 'react';

interface LandingPageProps {
    onNavigateToLogin: () => void;
    onStudentLogin: () => void;
    onTeacherLogin: () => void;
}

// Fix: Changed JSX.Element to React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
        <div className="flex justify-center items-center mb-4 h-12 w-12 rounded-full bg-blue-500/20 mx-auto text-blue-400">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onStudentLogin, onTeacherLogin }) => {
    return (
        <div className="text-white">
            {/* Hero Section */}
            <section className="text-center py-20 md:py-32 bg-gray-900">
                <div className="container mx-auto px-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">Welcome to VeriVote</h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">A secure, transparent, and decentralized voting platform for your college elections.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            onClick={onStudentLogin}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 text-lg flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Student Login
                        </button>
                        <button 
                            onClick={onTeacherLogin}
                            className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 text-lg flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Teacher Login
                        </button>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gray-800">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-extrabold text-center mb-12">How Voting Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                         <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 font-bold text-xl">1</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Login Securely</h3>
                                <p className="text-gray-400">Access the portal using your official college credentials, including your unique USN, to verify your identity.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 font-bold text-xl">2</div>
                             <div>
                                <h3 className="text-2xl font-bold mb-2">Get Your Secret Ticket</h3>
                                <p className="text-gray-400">For each election, you'll receive a unique, single-use ticket. This ticket is your key to vote anonymously.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 font-bold text-xl">3</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Cast Your Vote</h3>
                                <p className="text-gray-400">Choose your candidate and submit your vote using the secret ticket. The system registers your vote without linking it to your identity.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Features Section */}
            <section className="py-20 bg-gray-900">
                 <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-extrabold text-center mb-12">Security & Transparency First</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                            title="Anonymity Guaranteed"
                        >
                            Your vote is decoupled from your identity using a secure ticketing system. No one can know who you voted for.
                        </FeatureCard>
                         <FeatureCard 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            title="Verifiable on Blockchain"
                        >
                            Every vote is a transaction recorded on a public blockchain (Sepolia testnet), ensuring it cannot be altered or removed.
                        </FeatureCard>
                         <FeatureCard 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            title="Live, Transparent Results"
                        >
                            Watch the results update in real-time as votes are cast. The final tally is transparent and backed by the blockchain record.
                        </FeatureCard>
                    </div>
                 </div>
            </section>
        </div>
    );
};

export default LandingPage;