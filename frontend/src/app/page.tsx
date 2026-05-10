"use client";

import Link from "next/link";
import { useSession, SessionProvider } from "next-auth/react";
import {
  Brain,
  Sparkles,
  Zap,
  CirclePlay,
  Clock,
  CircleCheck,
  TrendingUp,
  Target,
  Star,
  BookOpen,
  BarChart3,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Comprehensive Analysis",
    description: "Evaluate 10+ core digital skill areas with our scientifically-validated assessment framework for complete insights.",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: Target,
    title: "Personalized Recommendations",
    description: "Get tailored course suggestions and learning paths based on your specific skill gaps and career goals.",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your skill development over time with detailed analytics and milestone achievements.",
    gradient: "from-green-500 to-green-600",
  },
  {
    icon: Globe,
    title: "Industry-Relevant Skills",
    description: "Focus on skills that matter most in today's digital workplace, aligned with industry standards.",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    icon: Globe,
    title: "Global Standards",
    description: "Benchmarked against international digital competency frameworks for global relevance.",
    gradient: "from-teal-500 to-teal-600",
  },
  {
    icon: BookOpen,
    title: "Learning Resources",
    description: "Access curated courses and materials to improve your identified skill gaps immediately.",
    gradient: "from-indigo-500 to-indigo-600",
  },
];

export default function HomePage() {
  return (
    <SessionProvider>
      <HomePageContent />
    </SessionProvider>
  );
}

function HomePageContent() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DSRA</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            </div>
            <div className="flex items-center gap-4">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Animated blobs */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse [animation-delay:1000ms]" />
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse [animation-delay:500ms]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Professional Skills Assessment
                </span>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Transform Your{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Digital Future
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Discover your digital strengths, identify growth opportunities, and get personalized learning recommendations with our comprehensive Digital Skills Readiness Assessment.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Zap className="w-5 h-5" />
                  Start Free Assessment
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-lg px-8 py-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CirclePlay className="w-5 h-5" />
                  See How It Works
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>15 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleCheck className="w-4 h-4 text-green-500" />
                  <span>100% Free</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Card */}
            <div className="relative lg:block">
              <div className="relative max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Your DSRI Score</h3>
                        <p className="text-gray-500">Digital Skills Readiness Assessment</p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        87%
                      </div>
                      <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs font-medium">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Excellent
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Digital Communication</span>
                        <span className="font-semibold text-gray-900">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: "92%" }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Data Analysis</span>
                        <span className="font-semibold text-gray-900">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full" style={{ width: "78%" }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Digital Security</span>
                        <span className="font-semibold text-gray-900">95%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" style={{ width: "95%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Assessment?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get comprehensive insights into your digital capabilities with our scientifically-designed assessment framework
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white p-8 text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with your digital skills assessment in just three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300" />

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-shadow duration-300 relative z-10">
                  <CircleCheck className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Account</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up for free and provide basic information about your professional background and learning goals.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-shadow duration-300 relative z-10">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Take the Assessment</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete our 15-minute comprehensive assessment covering all essential digital skill categories.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-shadow duration-300 relative z-10">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Your Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive your DSRI score, detailed insights, and personalized learning recommendations instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse [animation-delay:1000ms]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Discover Your Digital Potential?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Join thousands of professionals who have already transformed their careers with our comprehensive digital skills assessment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
            >
              <Sparkles className="w-5 h-5" />
              Start Your Journey Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">DSRA</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Empowering professionals to thrive in the digital age through comprehensive skills assessment and personalized learning recommendations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="block hover:text-white transition-colors">How It Works</a>
                <Link href="/register" className="block hover:text-white transition-colors">Get Started</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block hover:text-white transition-colors">Contact Us</a>
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Digital Skills Readiness Assessment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
