import { useEffect, useMemo, useState } from 'react'

const imagePattern = /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp)(\?|#|$)/i
const pdfPattern = /\.pdf(\?|#|$)/i

function getFileName(fileUrl) {
  try {
    const parsed = new URL(fileUrl)
    return decodeURIComponent(parsed.pathname.split('/').pop() || 'document')
  } catch {
    return fileUrl.split('/').pop() || 'document'
  }
}

function getFileType(fileUrl) {
  if (imagePattern.test(fileUrl)) {
    return 'image'
  }

  if (pdfPattern.test(fileUrl)) {
    return 'pdf'
  }

  return 'document'
}

function extensionFromName(fileName) {
  const extension = fileName.split('.').pop()?.toUpperCase()
  if (!extension || extension === fileName.toUpperCase()) {
    return 'FILE'
  }
  return extension.slice(0, 5)
}

function downloadFile(fileUrl, fileName) {
  const anchor = window.document.createElement('a')
  anchor.href = fileUrl
  anchor.download = fileName
  anchor.rel = 'noopener noreferrer'
  window.document.body.appendChild(anchor)
  anchor.click()
  window.document.body.removeChild(anchor)
}

function getDocumentSource(document) {
  return document?.access_url || document?.file_url || ''
}

function getDocumentPath(document) {
  return document?.storage_path || document?.file_url || ''
}

function getDocumentName(document) {
  return getFileName(getDocumentPath(document))
}

function getDocumentType(document) {
  return getFileType(getDocumentPath(document) || getDocumentSource(document))
}

function DocumentGallery({
  employee,
  documents,
  isLoading,
  isUploading,
  labels,
  locale,
  isArabic,
  isDark,
  onUpload,
  onDelete,
}) {
  const [activeDocument, setActiveDocument] = useState(null)

  const activeDocumentType = useMemo(
    () => (activeDocument ? getDocumentType(activeDocument) : null),
    [activeDocument],
  )

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveDocument(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const handleChange = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    onUpload(files)
    event.target.value = ''
  }

  const handleDeleteFromPreview = () => {
    if (!activeDocument) {
      return
    }

    onDelete(activeDocument)
    setActiveDocument(null)
  }

  return (
    <>
      <section
        className={`rounded-3xl p-5 backdrop-blur md:p-6 ${
          isDark
            ? 'border border-zinc-800 bg-black/75 shadow-xl shadow-black/40'
            : 'border border-white/80 bg-white/85 shadow-lg shadow-slate-300/40'
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{labels.heading}</h3>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{employee.name}</p>
          </div>
          <label className="cursor-pointer rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400">
            {isUploading ? labels.uploading : labels.upload}
            <input
              type="file"
              accept="image/*,.heic,.heif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              multiple
              disabled={isUploading}
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>

        {isLoading ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
            {labels.loading}
          </p>
        ) : null}

        {!isLoading && documents.length === 0 ? (
          <p className={`rounded-xl p-3 text-sm ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
            {labels.empty}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((documentRow) => {
            const sourceUrl = getDocumentSource(documentRow)
            const fileType = getDocumentType(documentRow)
            const fileName = getDocumentName(documentRow)
            const fileExtension = extensionFromName(fileName)

            return (
              <article
                key={documentRow.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 hover:border-sky-500/40'
                    : 'border-slate-200 bg-slate-50 hover:border-emerald-500/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveDocument(documentRow)}
                  className="block w-full text-left"
                >
                  {fileType === 'image' ? (
                    <img
                      src={sourceUrl}
                      alt={labels.alt}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-40 items-center justify-center text-sm font-semibold tracking-wide ${
                        isDark ? 'bg-black text-sky-200' : 'bg-cyan-50 text-cyan-900'
                      }`}
                    >
                      {fileType === 'pdf' ? 'PDF' : fileExtension}
                    </div>
                  )}
                </button>

                <div className={`space-y-2 p-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className={`line-clamp-1 text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {fileName}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      {new Date(documentRow.created_at).toLocaleDateString(locale)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDocument(documentRow)}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                          isDark
                            ? 'border border-sky-500/50 text-sky-200 hover:bg-sky-500/10'
                            : 'border border-cyan-500/40 text-cyan-700 hover:bg-cyan-100'
                        }`}
                      >
                        {labels.view}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(documentRow)}
                        className={`rounded-md px-2 py-1 text-xs transition ${
                          isDark
                            ? 'border border-rose-700/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40'
                            : 'border border-rose-500/50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {labels.delete}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {activeDocument ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setActiveDocument(null)}
          role="presentation"
        >
          <section
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-5xl rounded-3xl border p-4 shadow-2xl md:p-6 ${
              isDark
                ? 'border-zinc-800 bg-black text-zinc-100'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold md:text-lg">{getDocumentName(activeDocument)}</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{employee.name}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={getDocumentSource(activeDocument)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isDark
                      ? 'border border-sky-500/50 text-sky-200 hover:bg-sky-500/10'
                      : 'border border-cyan-600/40 text-cyan-700 hover:bg-cyan-100'
                  }`}
                >
                  {labels.open}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(getDocumentSource(activeDocument), getDocumentName(activeDocument))
                  }
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-400"
                >
                  {labels.download}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFromPreview}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isDark
                      ? 'border border-rose-700/60 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50'
                      : 'border border-rose-500/50 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {labels.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocument(null)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isDark
                      ? 'border border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {labels.close}
                </button>
              </div>
            </header>

            {activeDocumentType === 'image' ? (
              <img
                src={getDocumentSource(activeDocument)}
                alt={labels.alt}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
            ) : null}

            {activeDocumentType === 'pdf' ? (
              <iframe
                title={getDocumentName(activeDocument)}
                src={getDocumentSource(activeDocument)}
                className={`h-[70vh] w-full rounded-2xl border ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}
              />
            ) : null}

            {activeDocumentType === 'document' ? (
              <div
                className={`flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center ${
                  isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-300 text-slate-600'
                }`}
              >
                <p className="text-sm font-medium">{labels.previewUnavailable}</p>
                <p className="mt-1 text-xs">{labels.openOrDownloadHint}</p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}

export default DocumentGallery
