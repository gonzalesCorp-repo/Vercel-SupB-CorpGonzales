export default function DashboardLoading() {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          {/* Title bar */}
          <div className="h-7 w-48 sm:w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          {/* Subtitle / breadcrumb */}
          <div className="h-4 w-32 sm:w-40 bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          {/* Action button 1 */}
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          {/* Action button 2 */}
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area / Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 space-y-5 shadow-xs">
        {/* Search & Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/50">
          <div className="h-10 w-full sm:w-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-4 py-2 px-3 bg-slate-100 dark:bg-slate-700/40 rounded-xl">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md col-span-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>

          {/* Data Rows */}
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="grid grid-cols-5 gap-4 py-3.5 px-3 border-b border-slate-100 dark:border-slate-700/30 items-center last:border-b-0"
            >
              <div className="flex items-center gap-3 col-span-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="space-y-1.5 w-full max-w-[140px]">
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
                  <div className="h-2.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
              </div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
