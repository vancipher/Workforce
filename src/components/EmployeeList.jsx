function EmployeeList({
  employees,
  selectedId,
  searchTerm,
  isLoading,
  labels,
  isArabic,
  isDark,
  onSearch,
  onSelect,
  onAddNew,
}) {
  return (
    <section
      className={`rounded-3xl p-4 backdrop-blur md:p-5 ${
        isDark
          ? 'border border-zinc-800 bg-black/75 shadow-xl shadow-black/40'
          : 'border border-white/80 bg-white/85 shadow-lg shadow-slate-300/40'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{labels.heading}</h2>
        <button
          type="button"
          onClick={onAddNew}
          className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          {labels.add}
        </button>
      </div>

      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={labels.search}
        className={`mb-4 w-full rounded-2xl px-3 py-2 text-sm outline-none ring-sky-300 transition focus:ring ${
          isDark
            ? 'border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
            : 'border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
        }`}
      />

      <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
        {isLoading ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>{labels.loading}</p>
        ) : null}

        {!isLoading && employees.length === 0 ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
            {labels.empty}
          </p>
        ) : null}

        {employees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => onSelect(employee.id)}
            className={`w-full rounded-2xl border px-3 py-3 ${isArabic ? 'text-right' : 'text-left'} transition ${
              selectedId === employee.id
                ? isDark
                  ? 'border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-950/30'
                  : 'border-emerald-500/60 bg-emerald-100 shadow-lg shadow-emerald-300/30'
                : isDark
                  ? 'border-zinc-800 bg-zinc-950 hover:border-sky-500/50 hover:bg-zinc-900'
                  : 'border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50'
            }`}
          >
            <p className={`font-medium ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{employee.name}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {employee.phone?.trim() ? employee.phone : labels.noPhone}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  isDark ? 'bg-sky-500/20 text-sky-200' : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                {labels.openProfile}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default EmployeeList
