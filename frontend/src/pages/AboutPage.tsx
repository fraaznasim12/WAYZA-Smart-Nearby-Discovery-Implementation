import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  ShieldCheck, 
  Database, 
  Code2, 
  ArrowRight
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export const AboutPage: React.FC = () => {
  const architecturalModules = [
    { num: '01', title: 'User Authentication & Profiles', desc: 'Stateless JWT auth with Role-Based Access Control (User, Contributor, Business, Admin).' },
    { num: '02', title: 'Accessibility Preference Profiles', desc: 'Saved mobility profiles that automatically pre-filter discovery results.' },
    { num: '03', title: 'Interactive Map & Discovery', desc: 'MapLibre GL JS vector maps synchronized with accessible semantic HTML list views.' },
    { num: '04', title: 'Granular Accessibility Filters', desc: 'Multi-criteria querying across distance radius, facility category, and verified features.' },
    { num: '05', title: 'Place Details & 4-State Model', desc: 'Detailed venue ingress information enforcing the strict 4-state verification model.' },
    { num: '06', title: 'Community-Based Reports', desc: 'Crowdsourced field audits with timestamp tracking and contributor attribution.' },
    { num: '07', title: 'Photo Evidence & Verification', desc: 'Visual proof validation ensuring ramp gradients and doorway widths are verifiable.' },
    { num: '08', title: 'Dispute & Moderation Queue', desc: 'Transparent community dispute resolution for outdated or inaccurate data.' },
    { num: '09', title: 'Business & Facility Dashboard', desc: 'Venue managers can claim locations, post maintenance alerts, and verify official updates.' },
    { num: '10', title: 'Admin Governance Dashboard', desc: 'Audit trails, telemetry, category management, and system-wide verification health.' },
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Page Hero */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Mission &amp; Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Building Physical Mobility Intelligence for Everyone.
          </h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            AccessMap was born out of a critical real-world problem: digital map applications treat physical accessibility as an afterthought. We are building an open, verifiable intelligence platform to change that.
          </p>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* The Problem & Our Solution                                          */}
        {/* ------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-rose-600 font-mono text-lg">[01]</span>
              <span>The Binary Trap of Legacy Maps</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Most directories reduce accessibility to a simplistic checkbox: <code>wheelchair_accessible: true</code>. In reality, a venue might have an elevator that has been broken for two months, a ramp that exceeds safe incline angles, or a 3-inch step at the threshold that stops motorized wheelchairs.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              When accessibility information is wrong, people with disabilities face wasted trips, safety hazards, and loss of dignity.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-teal-300 shadow-xs">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-teal-700 font-mono text-lg">[02]</span>
              <span>The AccessMap Engineering Solution</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              AccessMap enforces a <strong>Four-State Verification Model</strong> where status is never assumed, never binary, and audited on a strict 180-day freshness SLA.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We combine spatial PostGIS indexing, open-source vector tile maps, 3D architectural cutaways with 2D fallbacks, and a decentralized community auditing engine.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 10 Architectural Modules                                            */}
        {/* ------------------------------------------------------------------- */}
        <section className="mb-20" aria-labelledby="modules-title">
          <div className="max-w-2xl mb-10">
            <span className="text-xs uppercase tracking-wider font-bold text-teal-700">Platform Blueprint</span>
            <h2 id="modules-title" className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              The 10 Architectural Modules
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered as a clean Modular Monolith with distinct separation between client, API, and spatial database tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architecturalModules.map((m) => (
              <div key={m.num} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-4">
                <span className="text-lg font-black font-mono text-teal-700 shrink-0">{m.num}</span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* Technology Foundation & Standards                                    */}
        {/* ------------------------------------------------------------------- */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white mb-20 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Technology Stack &amp; Open Standards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <Code2 className="w-5 h-5 text-teal-400 mb-2" />
              <h3 className="font-bold text-white text-sm mb-1">Frontend Layer</h3>
              <p>React 18, TypeScript, Vite, Tailwind CSS v4, Three.js, React Three Fiber, Drei, MapLibre GL JS.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <Database className="w-5 h-5 text-teal-400 mb-2" />
              <h3 className="font-bold text-white text-sm mb-1">Backend &amp; Spatial Data</h3>
              <p>Java 21, Spring Boot 3, Spring Data JPA, Hibernate Spatial, PostgreSQL 16, PostGIS 3.4, Docker Compose.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-teal-400 mb-2" />
              <h3 className="font-bold text-white text-sm mb-1">Accessibility Compliance</h3>
              <p>WCAG 2.1 AA certified: 4.5:1 text contrast, visible focus rings, full keyboard operation, prefers-reduced-motion.</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all"
          >
            <span>Get in Touch with the Project</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </PageLayout>
  );
};

export default AboutPage;