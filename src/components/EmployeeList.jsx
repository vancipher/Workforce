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
      className={`rounded-2xl p-4 backdrop-blur md:p-5 ${
        isDark
          ? 'border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/20'
          : 'border border-white/80 bg-white/85 shadow-lg shadow-slate-300/40'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{labels.heading}</h2>
        <button
          type="button"
          onClick={onAddNew}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400"
        >
          {labels.add}
        </button>
      </div>

      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={labels.search}
        className={`mb-4 w-full rounded-xl px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring ${
          isDark
            ? 'border border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-400'
            : 'border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
        }`}
      />

      <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
        {isLoading ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{labels.loading}</p>
        ) : null}

        {!isLoading && employees.length === 0 ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {labels.empty}
          </p>
        ) : null}

        {employees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => onSelect(employee.id)}
            className={`w-full rounded-xl border px-3 py-3 ${isArabic ? 'text-right' : 'text-left'} transition ${
              selectedId === employee.id
                ? isDark
                  ? 'border-emerald-400/60 bg-emerald-400/10'
                  : 'border-emerald-500/60 bg-emerald-100'
                : isDark
                  ? 'border-slate-700 bg-slate-800/70 hover:border-emerald-400/50 hover:bg-slate-800'
                  : 'border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50'
            }`}
          >
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{employee.name}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {employee.phone?.trim() ? employee.phone : labels.noPhone}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default EmployeeList
