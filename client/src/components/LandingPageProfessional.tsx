import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ShieldCheck, 
  Vote, 
  Lock, 
  Zap, 
  Users, 
  BarChart3, 
  Eye,
  CheckCircle2,
  ArrowRight,
  Github,
  Globe,
  Mail,
  ChevronDown,
  Sparkles,
  Trophy,
  Clock,
  Shield,
  Server,
  Smartphone,
  FileCheck,
  Sun,
  Moon,
  Ticket
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onStudentLogin: () => void;
  onTeacherLogin: () => void;
}

const LandingPageProfessional: React.FC<LandingPageProps> = ({ onNavigateToLogin, onStudentLogin, onTeacherLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <ShieldCheck className="w-12 h-12" />,
      title: "Blockchain Security",
      description: "Military-grade cryptographic signatures ensure vote integrity and prevent tampering",
      color: "text-[#b4a9e6]"
    },
    {
      icon: <Eye className="w-12 h-12" />,
      title: "Complete Transparency",
      description: "Real-time vote tracking and verification with immutable audit trails",
      color: "text-[#6d7382] dark:text-[#b4a9e6]"
    },
    {
      icon: <Lock className="w-12 h-12" />,
      title: "Anonymous Voting",
      description: "Zero-knowledge proofs protect voter privacy while maintaining verifiability",
      color: "text-[#b4a9e6]"
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Real-Time Results",
      description: "Live analytics and instant result computation with Socket.io technology",
      color: "text-[#6d7382] dark:text-[#b4a9e6]"
    }
  ];

  const stats = [
    { label: "Vote Accuracy", value: "100%", icon: <CheckCircle2 className="w-6 h-6" /> },
    { label: "Security Level", value: "Military", icon: <Shield className="w-6 h-6" /> },
    { label: "Transaction Speed", value: "<1s", icon: <Zap className="w-6 h-6" /> },
    { label: "Transparency", value: "Total", icon: <Eye className="w-6 h-6" /> }
  ];

  const techStack = [
    { name: "React 19", category: "Frontend", icon: <Globe className="w-5 h-5" /> },
    { name: "TypeScript", category: "Language", icon: <FileCheck className="w-5 h-5" /> },
    { name: "TweetNaCl", category: "Cryptography", icon: <Lock className="w-5 h-5" /> },
    { name: "Socket.io", category: "Real-time", icon: <Zap className="w-5 h-5" /> },
    { name: "PostgreSQL", category: "Database", icon: <Server className="w-5 h-5" /> },
    { name: "Node.js", category: "Backend", icon: <Server className="w-5 h-5" /> }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Login Securely",
      description: "Access the portal using your official college credentials and unique USN",
      icon: <Users className="w-8 h-8" />
    },
    {
      step: 2,
      title: "Get Your Secret Ticket",
      description: "Receive a unique, single-use ticket via email for anonymous voting",
      icon: <Mail className="w-8 h-8" />
    },
    {
      step: 3,
      title: "Cast Your Vote",
      description: "Choose your candidate and submit using the secret ticket",
      icon: <Vote className="w-8 h-8" />
    },
    {
      step: 4,
      title: "Verify & Track",
      description: "Get instant confirmation with a blockchain hash for verification",
      icon: <CheckCircle2 className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-[#060606] dark:via-[#121212] dark:to-[#242424] text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#b4a9e6]/20 dark:bg-[#b4a9e6]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6d7382]/20 dark:bg-[#6d7382]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#b4a9e6]/15 dark:bg-[#b4a9e6]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Modern Header */}
      <header className="relative z-10 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#434546] sticky top-0">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] p-2.5 rounded-xl shadow-lg">
                <Vote className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent">
                VeriVote
              </span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                className="text-gray-700 dark:text-gray-300 hover:text-[#b4a9e6] dark:hover:text-[#b4a9e6] hover:bg-[#b4a9e6]/10"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-700 dark:text-gray-300 hover:text-[#b4a9e6] dark:hover:text-[#b4a9e6] hover:bg-[#b4a9e6]/10"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-700 dark:text-gray-300 hover:text-[#b4a9e6] dark:hover:text-[#b4a9e6] hover:bg-[#b4a9e6]/10"
                onClick={() => document.getElementById('technology')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Technology
              </Button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl 
                         bg-gray-200 dark:bg-[#242424] hover:bg-gray-300 dark:hover:bg-[#434546] 
                         transition-all duration-300 shadow-md hover:shadow-lg
                         border border-gray-300 dark:border-[#434546]"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="relative w-5 h-5">
                <Sun
                  className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 transform ${
                    theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                  }`}
                />
                <Moon
                  className={`absolute inset-0 w-5 h-5 text-[#b4a9e6] transition-all duration-300 transform ${
                    theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        <div className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] rounded-2xl shadow-2xl mb-8 transform hover:scale-110 hover:rotate-3 transition-all duration-300">
            <Vote className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 bg-gradient-to-r from-[#b4a9e6] via-[#6d7382] to-[#b4a9e6] bg-clip-text text-transparent leading-tight">
            VeriVote
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-[#b4a9e6]/20 dark:bg-[#b4a9e6]/30 text-[#b4a9e6] dark:text-white border-[#b4a9e6]/30">
              <Shield className="w-4 h-4 mr-1 inline" />
              Blockchain Secured
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-[#6d7382]/20 dark:bg-[#6d7382]/30 text-[#434546] dark:text-gray-200 border-[#6d7382]/30">
              <Sparkles className="w-4 h-4 mr-1 inline" />
              100% Transparent
            </Badge>
          </div>

          {/* Description */}
          <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-4 leading-relaxed font-semibold">
            Secure, Transparent & Decentralized Voting
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of class representative elections with{' '}
            <span className="text-[#b4a9e6] font-semibold">blockchain-powered security</span>,{' '}
            <span className="text-[#6d7382] dark:text-[#b4a9e6] font-semibold">cryptographic verification</span>, and{' '}
            <span className="text-[#434546] dark:text-gray-300 font-semibold">complete transparency</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              onClick={onStudentLogin} 
              className="text-lg px-10 py-6 bg-linear-to-r from-[#b4a9e6] to-[#6d7382] hover:from-[#6d7382] hover:to-[#b4a9e6] text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
            >
              <Users className="w-5 h-5 mr-2" />
              Student Login
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              size="lg" 
              onClick={onTeacherLogin} 
              className="text-lg px-10 py-6 bg-gradient-to-r from-[#434546] to-[#242424] hover:from-[#6d7382] hover:to-[#434546] text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Teacher Login
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/70 dark:bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-gray-300 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex justify-center mb-3 text-[#b4a9e6]">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
      </section>

      {/* How It Works Section - FIXED */}
      <section id="how-it-works" className="relative z-10 py-20 bg-gray-100/50 dark:bg-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-[#b4a9e6] text-[#b4a9e6]">
              <Clock className="w-4 h-4 mr-1 inline" />
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">How Voting Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Casting your vote is simple, secure, and takes less than 5 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {howItWorks.map((step, index) => (
              <div 
                key={index}
                className="relative bg-black/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/10 backdrop-blur-lg rounded-2xl p-8 border border-gray-300 dark:border-white/10 hover:border-[#b4a9e6] dark:hover:border-[#b4a9e6]/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 shadow-lg"
              >
                {/* Step Number */}
                <div className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] rounded-full flex items-center justify-center text-xl font-bold shadow-xl text-white">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6 text-[#b4a9e6] mt-6">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-center text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow - properly positioned between cards */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute -right-6 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="bg-[#b4a9e6] rounded-full p-1.5 shadow-lg">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-[#6d7382] text-[#6d7382] dark:text-[#b4a9e6]">
              <Sparkles className="w-4 h-4 mr-1 inline" />
              Key Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Why Choose VeriVote?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge technology to ensure secure, fair, and transparent elections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-black/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/10 backdrop-blur-lg rounded-2xl p-8 border border-gray-300 dark:border-white/10 hover:border-[#b4a9e6] dark:hover:border-[#b4a9e6]/50 transition-all duration-500 transform hover:scale-105 shadow-lg ${
                  activeFeature === index ? 'ring-2 ring-[#b4a9e6] shadow-2xl shadow-[#b4a9e6]/20' : ''
                }`}
              >
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology" className="relative z-10 py-20 bg-gray-100/50 dark:bg-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-[#434546] text-[#434546] dark:text-[#b4a9e6]">
              <Server className="w-4 h-4 mr-1 inline" />
              Technology Stack
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Built with Modern Tech</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Leveraging industry-leading technologies for maximum security and performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {techStack.map((tech, index) => (
              <div 
                key={index}
                className="bg-black/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/10 backdrop-blur-lg rounded-xl p-6 border border-gray-300 dark:border-white/10 hover:border-[#b4a9e6] dark:hover:border-[#b4a9e6]/50 transition-all duration-300 transform hover:scale-105 text-center shadow-lg"
              >
                <div className="flex justify-center mb-3 text-[#b4a9e6]">
                  {tech.icon}
                </div>
                <div className="text-sm font-bold mb-1 text-gray-900 dark:text-white">{tech.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">{tech.category}</div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-black/80 dark:bg-gradient-to-br dark:from-[#242424]/80 dark:to-[#121212]/80 backdrop-blur-lg border-gray-300 dark:border-[#b4a9e6]/30 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShieldCheck className="w-6 h-6 text-[#b4a9e6]" />
                  Security & Cryptography
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Understanding our security architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-700 dark:text-gray-300 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#b4a9e6]" />
                      Ed25519 Digital Signatures
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Each vote is cryptographically signed using Ed25519 elliptic curve signatures, 
                      ensuring authenticity and non-repudiation while maintaining voter anonymity.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#6d7382]" />
                      Blockchain Verification
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Every transaction is recorded with an immutable hash on the blockchain, 
                      allowing anyone to verify the integrity of the election without compromising privacy.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#b4a9e6]" />
                      Anonymous Ticket System
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Unique, single-use tickets break the link between voter identity and their vote, 
                      ensuring complete anonymity while preventing double voting.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#6d7382]" />
                      Real-Time Analytics
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Live vote counting with Socket.io provides instant results and comprehensive 
                      analytics including voter turnout, timeline trends, and demographic insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Project Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-black/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/10 backdrop-blur-lg border-gray-300 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2 text-gray-900 dark:text-white">
                  <Trophy className="w-8 h-8 text-[#b4a9e6]" />
                  About VeriVote
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                  A blockchain-powered voting platform for educational institutions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-700 dark:text-gray-300 space-y-4">
                <p className="leading-relaxed">
                  <strong className="text-gray-900 dark:text-white">VeriVote</strong> is a revolutionary decentralized voting system designed specifically for 
                  <span className="text-[#b4a9e6] font-semibold"> class representative elections</span> in educational institutions. 
                  Built by students for students, it addresses the critical need for transparency, security, and trust in electoral processes.
                </p>
                
                <div className="bg-[#b4a9e6]/10 dark:bg-black/20 rounded-lg p-4 border-l-4 border-[#b4a9e6]">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">The Problem We Solve</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Traditional voting systems often suffer from lack of transparency, potential for manipulation, 
                    and voter anonymity concerns. VeriVote eliminates these issues through cryptographic verification 
                    and blockchain technology, ensuring every vote counts and can be verified without compromising privacy.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#b4a9e6]/10 dark:bg-[#b4a9e6]/20 rounded-lg p-4 border border-[#b4a9e6]/30">
                    <div className="text-3xl font-bold text-[#b4a9e6] mb-1">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Verifiable Votes</div>
                  </div>
                  <div className="bg-[#6d7382]/10 dark:bg-[#6d7382]/20 rounded-lg p-4 border border-[#6d7382]/30">
                    <div className="text-3xl font-bold text-[#6d7382] dark:text-[#b4a9e6] mb-1">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Identity Leaks</div>
                  </div>
                  <div className="bg-[#434546]/10 dark:bg-[#434546]/20 rounded-lg p-4 border border-[#434546]/30">
                    <div className="text-3xl font-bold text-[#434546] dark:text-gray-300 mb-1">∞</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trust Level</div>
                  </div>
                </div>

                <p className="leading-relaxed mt-6">
                  Developed as a <span className="text-[#6d7382] dark:text-[#b4a9e6] font-semibold">major project</span> by computer science students at NIE, 
                  VeriVote demonstrates the practical application of blockchain technology in solving real-world problems. 
                  The system combines modern web technologies with cryptographic principles to create a voting platform 
                  that is both user-friendly and mathematically secure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="relative z-10 border-t border-gray-300 dark:border-[#434546] py-12 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-lg">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-linear-to-br from-[#b4a9e6] to-[#6d7382] p-2 rounded-lg shadow-lg">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent">VeriVote</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Secure, transparent, and decentralized voting for the modern era.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-[#b4a9e6] transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-[#b4a9e6] transition-colors">How It Works</a></li>
                <li><a href="#technology" className="hover:text-[#b4a9e6] transition-colors">Technology</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Contact</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Built with ❤️ by NIE Students</p>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 dark:border-[#434546] pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} VeriVote. All rights reserved. | A Blockchain-Powered Voting Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageProfessional;
