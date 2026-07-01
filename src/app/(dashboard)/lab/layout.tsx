import { Beaker } from 'lucide-react';

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="bg-slate-900 text-slate-200 px-6 py-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <Beaker className="w-5 h-5 text-indigo-400" />
          <h1 className="font-bold tracking-wide">
            WMS Lab <span className="text-slate-400 font-light">| Beauty</span>
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
