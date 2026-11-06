import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export const NotFoundPage: React.FC = () => {
  return (
    <PageLayout className="flex items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        
        <span className="font-mono text-sm font-bold text-teal-700 uppercase tracking-widest">
          Error 404
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
          Route Not Found
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          The accessibility route you requested does not exist or has been relocated. Let's guide you back to a verified path.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Explore Places</span>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFoundPage;