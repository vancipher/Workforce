import { useEffect, useMemo, useState } from 'react'

const emptyForm = {
  name: '',
  phone: '',
  notes: '',
}

function EmployeeForm({
  employee,
  isEditing,
  isSaving,
  labels,
  locale,
  isArabic,
  isDark,
  onEdit,
  onCancel,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!employee) {
      setForm(emptyForm)
      return
    }

    setForm({
      name: employee.name ?? '',
      phone: employee.phone ?? '',
      notes: employee.notes ?? '',
    })
  }, [employee])

  const title = useMemo(() => {
    if (!employee) {
      return labels.newTitle
    }
    return isEditing ? labels.editTitle : labels.detailsTitle
  }, [employee, isEditing, labels])

  const isReadOnly = Boolean(employee && !isEditing)

  const handleSubmit = (event) => {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    }

    if (!payload.name) {
      return
    }

    if (employee) {
      onUpdate(payload)
      return
    }

    onCreate(payload)
  }

  return (
    <section
      className={`rounded-2xl p-5 backdrop-blur md:p-6 ${
        isDark
          ? 'border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/40'
          : 'border border-white/80 bg-white/85 shadow-lg shadow-slate-300/40'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{title}</h2>
        {employee && !isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              isDark
                ? 'border border-sky-500/50 text-sky-200 hover:bg-sky-500/10'
                : 'border border-emerald-600/40 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {labels.edit}
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className={`block text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'} ${isArabic ? 'text-right' : ''}`}>
          {labels.fullName}
          <input
            required
            value={form.name}
            disabled={isReadOnly || isSaving}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className={`mt-1 w-full rounded-xl px-3 py-2 outline-none ring-sky-300 transition focus:ring disabled:cursor-not-allowed disabled:opacity-70 ${
              isDark
                ? 'border border-zinc-800 bg-black text-zinc-100 placeholder:text-zinc-500'
                : 'border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
            }`}
            placeholder={labels.fullNamePlaceholder}
          />
        </label>

        <label className={`block text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'} ${isArabic ? 'text-right' : ''}`}>
          {labels.phone}
          <input
            value={form.phone}
            disabled={isReadOnly || isSaving}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className={`mt-1 w-full rounded-xl px-3 py-2 outline-none ring-sky-300 transition focus:ring disabled:cursor-not-allowed disabled:opacity-70 ${
              isDark
                ? 'border border-zinc-800 bg-black text-zinc-100 placeholder:text-zinc-500'
                : 'border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
            }`}
            placeholder={labels.phonePlaceholder}
          />
        </label>

        <label className={`block text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'} ${isArabic ? 'text-right' : ''}`}>
          {labels.notes}
          <textarea
            rows={4}
            value={form.notes}
            disabled={isReadOnly || isSaving}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className={`mt-1 w-full rounded-xl px-3 py-2 outline-none ring-sky-300 transition focus:ring disabled:cursor-not-allowed disabled:opacity-70 ${
              isDark
                ? 'border border-zinc-800 bg-black text-zinc-100 placeholder:text-zinc-500'
                : 'border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
            }`}
            placeholder={labels.notesPlaceholder}
          />
        </label>

        {employee?.created_at ? (
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {labels.created}: {new Date(employee.created_at).toLocaleString(locale)}
          </p>
        ) : null}

        {!isReadOnly ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? labels.saving : employee ? labels.save : labels.create}
            </button>
            {employee ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  isDark
                    ? 'border border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {labels.cancel}
              </button>
            ) : null}
          </div>
        ) : null}
      </form>

      {employee ? (
        <div className={`mt-5 border-t pt-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onDelete}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              isDark
                ? 'border border-rose-700/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40'
                : 'border border-rose-500/50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {labels.delete}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default EmployeeForm
