import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'GENERAL',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSubmitted(true);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community &amp; Developer Inquiries</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Contact &amp; Feedback
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have questions about our physical accessibility standards, want to suggest a venue for audit, or contribute code to the platform? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
            {isSubmitted ? (
              <div className="py-8 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Message Received</h2>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Thank you for contributing to physical accessibility. In this prototype phase, form submissions are logged locally in the client session.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'GENERAL', message: '' });
                  }}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Your Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Topic of Inquiry
                  </label>
                  <select
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors cursor-pointer"
                  >
                    <option value="GENERAL">General Project Inquiry</option>
                    <option value="AUDITOR">Community Auditor Program</option>
                    <option value="VENUE">Facility / Venue Claiming</option>
                    <option value="TECHNICAL">Bug Report / Technical Architecture</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Message Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share your thoughts, suggestions, or reports..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Information Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-md">
              <h3 className="text-xl font-bold mb-4">Direct Communication</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                AccessMap is a distributed, open-source software engineering platform. All communication is routed to our engineering and accessibility working group.
              </p>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Email Inquiries</span>
                    <a href="mailto:contact@accessmap.local" className="font-semibold text-white hover:text-teal-400 transition-colors">
                      contact@accessmap.local
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Distribution</span>
                    <span className="font-semibold text-white">Open Source Distributed Project</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Privacy &amp; Data Ethics</span>
              </div>
              <p className="leading-relaxed text-teal-800">
                AccessMap does not monetize user geolocation telemetry or sell user contact information. All field accessibility audits are published under the Open Database License (ODbL).
              </p>
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
};

export default ContactPage;