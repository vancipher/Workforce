import { useCallback, useEffect, useMemo, useState } from 'react'
import EmployeeForm from './components/EmployeeForm'
import EmployeeList from './components/EmployeeList'
import DocumentGallery from './components/DocumentGallery'
import { compressImage } from './lib/image'
import {
  BUCKET_NAME,
  deleteDocumentById,
  deleteEmployeeById,
  fetchDocumentsByEmployeeId,
  fetchEmployees,
  hasSupabaseEnv,
  insertDocument,
  insertEmployee,
  updateEmployeeById,
  uploadDocumentFile,
} from './lib/supabase'

const storageKeys = {
  language: 'wm_language',
  theme: 'wm_theme',
}

const copy = {
  en: {
    locale: 'en-US',
    operationTag: 'Employee Operations',
    title: 'Workforce Manager',
    switchLanguage: 'العربية',
    switchTheme: 'Light Mode',
    missingEnv:
      'Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run the app.',
    selectHint: 'Select an employee to view and manage document images.',
    deleteConfirm: (name) => `Delete ${name} and all linked documents?`,
    employees: {
      heading: 'Employees',
      add: 'Add Employee',
      search: 'Search by name',
      loading: 'Loading employees...',
      empty: 'No employees found. Add your first team member.',
      noPhone: 'No phone number',
    },
    form: {
      newTitle: 'New Employee',
      editTitle: 'Edit Employee',
      detailsTitle: 'Employee Details',
      edit: 'Edit',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter full name',
      phone: 'Phone Number (optional)',
      phonePlaceholder: 'e.g. +964 7xx xxx xxxx',
      notes: 'Notes (optional)',
      notesPlaceholder: 'Any relevant notes',
      created: 'Created',
      saving: 'Saving...',
      save: 'Save Changes',
      create: 'Create Employee',
      cancel: 'Cancel',
      delete: 'Delete Employee',
    },
    documents: {
      heading: 'Documents',
      uploading: 'Uploading...',
      upload: 'Upload Images',
      loading: 'Loading documents...',
      empty: 'No uploaded files yet.',
      alt: 'Employee document',
      delete: 'Delete',
    },
  },
  ar: {
    locale: 'ar-IQ-u-nu-arab',
    operationTag: 'إدارة الموظفين',
    title: 'لوحة إدارة الكادر',
    switchLanguage: 'English',
    switchTheme: 'الوضع الفاتح',
    missingEnv:
      'متغيرات Supabase غير موجودة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY لتشغيل التطبيق.',
    selectHint: 'اختر موظفًا لعرض وإدارة صور المستندات.',
    deleteConfirm: (name) => `هل تريد حذف ${name} مع كل المستندات المرتبطة؟`,
    employees: {
      heading: 'الموظفون',
      add: 'إضافة موظف',
      search: 'ابحث بالاسم',
      loading: 'جار تحميل الموظفين...',
      empty: 'لا يوجد موظفون بعد. أضف أول موظف.',
      noPhone: 'لا يوجد رقم هاتف',
    },
    form: {
      newTitle: 'موظف جديد',
      editTitle: 'تعديل بيانات الموظف',
      detailsTitle: 'تفاصيل الموظف',
      edit: 'تعديل',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل الاسم الكامل',
      phone: 'رقم الهاتف (اختياري)',
      phonePlaceholder: 'مثال: +964 7xx xxx xxxx',
      notes: 'ملاحظات (اختياري)',
      notesPlaceholder: 'أضف أي ملاحظة مهمة',
      created: 'تاريخ الإنشاء',
      saving: 'جار الحفظ...',
      save: 'حفظ التعديلات',
      create: 'إنشاء موظف',
      cancel: 'إلغاء',
      delete: 'حذف الموظف',
    },
    documents: {
      heading: 'المستندات',
      uploading: 'جار الرفع...',
      upload: 'رفع صور',
      loading: 'جار تحميل المستندات...',
      empty: 'لا توجد ملفات مرفوعة حتى الآن.',
      alt: 'مستند الموظف',
      delete: 'حذف',
    },
  },
}

function App() {
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [documents, setDocuments] = useState([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [isUploadingDocs, setIsUploadingDocs] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('dark')

  const ui = copy[language]
  const isArabic = language === 'ar'
  const isDark = theme === 'dark'

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(storageKeys.language)
    const savedTheme = window.localStorage.getItem(storageKeys.theme)

    if (savedLanguage === 'en' || savedLanguage === 'ar') {
      setLanguage(savedLanguage)
    }

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.language, language)
  }, [language])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.theme, theme)
  }, [theme])

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedId) ?? null,
    [employees, selectedId],
  )

  const filteredEmployees = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) {
      return employees
    }

    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(normalized),
    )
  }, [employees, searchTerm])

  const loadEmployees = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setIsLoadingEmployees(false)
      return
    }

    setIsLoadingEmployees(true)
    setError('')

    try {
      const rows = await fetchEmployees()
      setEmployees(rows)

      if (rows.length > 0) {
        setSelectedId((previous) => previous ?? rows[0].id)
      }
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoadingEmployees(false)
    }
  }, [])

  const loadDocuments = useCallback(async (employeeId) => {
    if (!employeeId || !hasSupabaseEnv) {
      setDocuments([])
      return
    }

    setIsLoadingDocuments(true)
    setError('')

    try {
      const rows = await fetchDocumentsByEmployeeId(employeeId)
      setDocuments(rows)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    loadDocuments(selectedId)
  }, [loadDocuments, selectedId])

  const handleCreateEmployee = async (payload) => {
    setIsSavingEmployee(true)
    setError('')

    try {
      const created = await insertEmployee(payload)
      setEmployees((previous) => [created, ...previous])
      setSelectedId(created.id)
      setIsEditing(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSavingEmployee(false)
    }
  }

  const handleUpdateEmployee = async (payload) => {
    if (!selectedEmployee) {
      return
    }

    setIsSavingEmployee(true)
    setError('')

    try {
      const updated = await updateEmployeeById(selectedEmployee.id, payload)
      setEmployees((previous) =>
        previous.map((employee) =>
          employee.id === selectedEmployee.id ? updated : employee,
        ),
      )
      setIsEditing(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSavingEmployee(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) {
      return
    }

    const accepted = window.confirm(
      ui.deleteConfirm(selectedEmployee.name),
    )
    if (!accepted) {
      return
    }

    setError('')

    try {
      await deleteEmployeeById(selectedEmployee.id)
      setEmployees((previous) => {
        const remainder = previous.filter(
          (employee) => employee.id !== selectedEmployee.id,
        )
        setSelectedId((currentSelectedId) => {
          if (currentSelectedId !== selectedEmployee.id) {
            return currentSelectedId
          }
          return remainder[0]?.id ?? null
        })
        return remainder
      })
      setDocuments([])
      setIsEditing(false)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleUploadDocuments = async (fileList) => {
    if (!selectedEmployee || fileList.length === 0) {
      return
    }

    setIsUploadingDocs(true)
    setError('')

    try {
      const uploadedRows = []

      for (const file of fileList) {
        const optimized = await compressImage(file)
        const uploadResult = await uploadDocumentFile(selectedEmployee.id, optimized)
        const row = await insertDocument({
          employee_id: selectedEmployee.id,
          file_url: uploadResult.publicUrl,
        })
        uploadedRows.push(row)
      }

      setDocuments((previous) => [...uploadedRows, ...previous])
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setIsUploadingDocs(false)
    }
  }

  const handleDeleteDocument = async (document) => {
    setError('')

    try {
      await deleteDocumentById(document.id, document.file_url, BUCKET_NAME)
      setDocuments((previous) =>
        previous.filter((documentRow) => documentRow.id !== document.id),
      )
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={language}
      className={`min-h-screen ${
        isDark ? 'bg-[#06080e] text-slate-100' : 'bg-slate-100 text-slate-800'
      } ${isArabic ? 'font-arabic' : ''}`}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div
          className={`pointer-events-none absolute inset-0 -z-10 ${
            isDark
              ? 'bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.2),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_40%_80%,rgba(249,115,22,0.16),transparent_30%)]'
              : 'bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_40%_80%,rgba(249,115,22,0.1),transparent_30%)]'
          }`}
        />
        <header
          className={`mb-6 rounded-3xl p-6 backdrop-blur md:mb-8 md:p-8 ${
            isDark
              ? 'border border-slate-700/60 bg-slate-900/70 shadow-2xl shadow-black/30'
              : 'border border-white/80 bg-white/85 shadow-xl shadow-slate-300/50'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              {ui.operationTag}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? 'border border-cyan-400/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-400/20'
                    : 'border border-cyan-600/40 bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                }`}
              >
                {ui.switchTheme}
              </button>
              <button
                type="button"
                onClick={() => setLanguage((previous) => (previous === 'en' ? 'ar' : 'en'))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? 'border border-emerald-400/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-400/20'
                    : 'border border-emerald-600/40 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {ui.switchLanguage}
              </button>
            </div>
          </div>
          <h1 className={`mt-2 text-2xl font-semibold md:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ui.title}
          </h1>
          {!hasSupabaseEnv ? (
            <p className="mt-4 rounded-xl border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {ui.missingEnv}
            </p>
          ) : null}
        </header>

        <main className="grid gap-4 md:grid-cols-[320px_1fr] md:gap-6">
          <EmployeeList
            employees={filteredEmployees}
            selectedId={selectedId}
            searchTerm={searchTerm}
            isLoading={isLoadingEmployees}
            labels={ui.employees}
            isArabic={isArabic}
            isDark={isDark}
            onSearch={setSearchTerm}
            onSelect={(id) => {
              setSelectedId(id)
              setIsEditing(false)
            }}
            onAddNew={() => {
              setIsEditing(true)
              setSelectedId(null)
            }}
          />

          <section className="space-y-4">
            <EmployeeForm
              key={selectedEmployee?.id ?? 'create'}
              employee={selectedEmployee}
              isEditing={isEditing}
              isSaving={isSavingEmployee}
              labels={ui.form}
              locale={ui.locale}
              isArabic={isArabic}
              isDark={isDark}
              onEdit={() => setIsEditing(true)}
              onCancel={() => setIsEditing(false)}
              onCreate={handleCreateEmployee}
              onUpdate={handleUpdateEmployee}
              onDelete={handleDeleteEmployee}
            />

            {selectedEmployee ? (
              <DocumentGallery
                employee={selectedEmployee}
                documents={documents}
                isLoading={isLoadingDocuments}
                isUploading={isUploadingDocs}
                labels={ui.documents}
                locale={ui.locale}
                isDark={isDark}
                onUpload={handleUploadDocuments}
                onDelete={handleDeleteDocument}
              />
            ) : (
              <section
                className={`rounded-2xl border border-dashed p-5 text-sm shadow-sm ${
                  isDark
                    ? 'border-slate-600 bg-slate-900/70 text-slate-300'
                    : 'border-slate-300 bg-white/80 text-slate-600'
                }`}
              >
                {ui.selectHint}
              </section>
            )}
          </section>
        </main>

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default App
