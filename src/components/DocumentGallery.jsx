function DocumentGallery({
  employee,
  documents,
  isLoading,
  isUploading,
  labels,
  locale,
  isDark,
  onUpload,
  onDelete,
}) {
  const handleChange = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    onUpload(files)
    event.target.value = ''
  }

  return (
    <section
      className={`rounded-2xl p-5 backdrop-blur md:p-6 ${
        isDark
          ? 'border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/20'
          : 'border border-white/80 bg-white/85 shadow-lg shadow-slate-300/40'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{labels.heading}</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{employee.name}</p>
        </div>
        <label className="cursor-pointer rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400">
          {isUploading ? labels.uploading : labels.upload}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {isLoading ? (
        <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{labels.loading}</p>
      ) : null}

      {!isLoading && documents.length === 0 ? (
        <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          {labels.empty}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <article
            key={document.id}
            className={`overflow-hidden rounded-xl border ${
              isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <img
              src={document.file_url}
              alt={labels.alt}
              loading="lazy"
              className="h-36 w-full object-cover"
            />
            <div className="flex items-center justify-between p-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date(document.created_at).toLocaleDateString(locale)}
              </span>
              <button
                type="button"
                onClick={() => onDelete(document)}
                className={`rounded-md px-2 py-1 text-xs transition ${
                  isDark
                    ? 'border border-rose-500/60 text-rose-300 hover:bg-rose-500/10'
                    : 'border border-rose-500/50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {labels.delete}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DocumentGallery
