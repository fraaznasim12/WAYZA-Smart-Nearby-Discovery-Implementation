import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BusinessPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageLayout className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-700 shadow-xl mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Business Facility Management</h1>
        </div>
        <p className="text-xs text-slate-300">
          Restricted to <span className="font-mono text-teal-300 font-bold">ROLE_BUSINESS_OWNER</span>. Authenticated as: {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Claimed Facilities</h2>
          </div>
          <p className="text-xs text-slate-500">Manage venue details and update verified accessibility features.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Verification Badges</h2>
          </div>
          <p className="text-xs text-slate-500">Respond to community reports and submit official accessibility documentation.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessPage;

