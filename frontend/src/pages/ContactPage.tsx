import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, MapPin, Copy, Check } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'GENERAL',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const directEmail = 'fraaz8212@gmail.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(directEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Could not copy email to clipboard', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSubmitted(true);
    }
  };

  return (
    <PageLayout className="bg-[#F5F8FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] border border-[#0F9D91]/20 text-[#0F9D91] text-xs font-semibold mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community &amp; Developer Inquiries</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#101C36] font-display">
            Contact &amp; Feedback
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have questions about physical accessibility standards, want to suggest a venue for audit, or collaborate with the project maintainer? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm">
            {isSubmitted ? (
              <div className="py-8 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-[#101C36]">Message Received</h2>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Thank you for contributing to physical accessibility. Your feedback helps make the platform better.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', topic: 'GENERAL', message: '' });
                  }}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-[#101C36] text-white text-xs font-semibold hover:bg-[#17365B] transition-colors cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#0F9D91] focus:ring-1 focus:ring-[#0F9D91] transition-colors"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#0F9D91] focus:ring-1 focus:ring-[#0F9D91] transition-colors"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white text-slate-800 focus:border-[#0F9D91] focus:ring-1 focus:ring-[#0F9D91] transition-colors cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#0F9D91] focus:ring-1 focus:ring-[#0F9D91] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0F9D91] to-[#2DD4BF] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Information Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-[#101C36] text-white shadow-lg border border-slate-800">
              <h3 className="text-xl font-bold mb-4 font-display">Direct Communication</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                AccessMap is maintained by a dedicated engineering and accessibility team. For partnerships, security inquiries, or direct questions, reach out via email:
              </p>

              <div className="space-y-5 text-xs text-slate-300">
                {/* Official Direct Contact Email */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-400/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F9D91] to-[#2DD4BF] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Mail className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-teal-400 text-[10px] uppercase font-bold tracking-wider">Direct Email</span>
                        <a 
                          href={`mailto:${directEmail}`}
                          className="font-semibold text-white text-sm hover:text-teal-300 transition-colors block truncate"
                          title={`Send email to ${directEmail}`}
                        >
                          {directEmail}
                        </a>
                      </div>
                    </div>

                    {/* Copy Email Button */}
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all shrink-0 cursor-pointer"
                      title={copied ? "Email copied to clipboard" : "Copy email address"}
                      aria-label="Copy direct email address to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> Copied {directEmail} to clipboard!
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-teal-400 shrink-0 border border-white/10">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Distribution</span>
                    <span className="font-semibold text-white text-xs">Open Source Distributed Project (India)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200/90 text-xs text-teal-950">
              <div className="flex items-center gap-2 font-bold mb-1 text-[#0F9D91]">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy &amp; Data Ethics</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                AccessMap does not monetize user geolocation telemetry or sell contact details. All community observations and accessibility audits are protected and verified with rigorous moderation.
              </p>
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
};

export default ContactPage;
