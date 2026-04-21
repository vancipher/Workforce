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

const managerAccess = {
  username: 'Manager',
  password: 'Manager=7920s',
}

const storageKeys = {
  language: 'wm_language',
  theme: 'wm_theme',
  auth: 'wm_auth',
}

function getInitialAuthState() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(storageKeys.auth) === 'granted'
}

function ThemeToggle({ isDark, onToggle, lightLabel, darkLabel }) {
  const nextThemeLabel = isDark ? lightLabel : darkLabel
  const currentThemeLabel = isDark ? darkLabel : lightLabel

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
        isDark
          ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span className="text-[11px] font-semibold">{currentThemeLabel}</span>
      <span
        dir="ltr"
        className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 ring-1 ${
          isDark
            ? 'bg-black ring-zinc-600'
            : 'bg-slate-200 ring-slate-300'
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full shadow-lg transition-transform duration-300 ${
            isDark
              ? 'translate-x-5 bg-sky-400'
              : 'translate-x-0 bg-white ring-1 ring-sky-300'
          }`}
        />
      </span>
    </button>
  )
}

function LoginPanel({
  ui,
  isDark,
  isArabic,
  error,
  onToggleTheme,
  onToggleLanguage,
  onSubmit,
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ username: username.trim(), password })
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={isArabic ? 'ar' : 'en'}
      className={`relative min-h-screen overflow-hidden ${
        isDark ? 'bg-black text-zinc-100' : 'bg-[#f6fbff] text-slate-900'
      } ${isArabic ? 'font-arabic' : ''}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_12%_18%,rgba(29,155,240,0.2),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(14,116,255,0.14),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(125,211,252,0.1),transparent_32%)]'
            : 'bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.14),transparent_35%),radial-gradient(circle_at_50%_88%,rgba(125,211,252,0.22),transparent_32%)]'
        }`}
      />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 md:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
          <ThemeToggle
            isDark={isDark}
            onToggle={onToggleTheme}
            lightLabel={ui.themeLight}
            darkLabel={ui.themeDark}
          />
          <button
            type="button"
            onClick={onToggleLanguage}
            className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
              isDark
                ? 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                : 'border border-sky-500/30 bg-white text-sky-800 hover:bg-sky-100'
            }`}
          >
            {ui.switchLanguage}
          </button>
        </div>

        <section
          className={`mx-auto w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur md:p-8 ${
            isDark
              ? 'border-zinc-800 bg-black/80 shadow-black/60'
              : 'border-sky-100 bg-white/90 shadow-sky-200/45'
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <img src="/logo.svg" alt={ui.auth.logoAlt} className="h-12 w-12 rounded-2xl" />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                {ui.operationTag}
              </p>
              <h1 className={`text-xl font-semibold md:text-2xl ${isDark ? 'text-zinc-50' : 'text-slate-900'}`}>
                {ui.auth.title}
              </h1>
            </div>
          </div>

          <p className={`mb-5 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{ui.auth.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className={`block text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              {ui.auth.username}
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={ui.auth.usernamePlaceholder}
                className={`mt-1 w-full rounded-2xl border px-3 py-2 outline-none ring-cyan-300 transition focus:ring ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
                }`}
              />
            </label>

            <label className={`block text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              {ui.auth.password}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={ui.auth.passwordPlaceholder}
                className={`mt-1 w-full rounded-2xl border px-3 py-2 outline-none ring-cyan-300 transition focus:ring ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500'
                }`}
              />
            </label>

            {error ? (
              <p className={`rounded-xl px-3 py-2 text-sm ${isDark ? 'bg-rose-500/10 text-rose-200' : 'bg-rose-50 text-rose-700'}`}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              {ui.auth.submit}
            </button>
          </form>

        </section>
      </div>
    </div>
  )
}

const copy = {
  en: {
    locale: 'en-US',
    operationTag: 'Workforce Project',
    title: 'Workers & documents',
    switchLanguage: 'العربية',
    switchTheme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    installApp: 'Add To Home Screen',
    logout: 'Logout',
    missingEnv:
      'Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run the app.',
    selectHint: 'Select a worker name to show the worker data and documents.',
    profileHint: 'Use Add Worker to create a new profile, or select a worker for details and documents.',
    profile: {
      heading: 'Worker Profile',
      subtitle: 'Simple profile view with name, phone, and documents.',
      editingHint: 'Editing is enabled. Save or cancel to return to profile view.',
      emptyHint: 'Choose a worker from the left list to display profile data.',
      name: 'Name',
      phone: 'Phone',
      noPhone: 'No phone number',
    },
    sections: {
      directory: 'Directory',
      profile: 'Profile Workspace',
      back: 'Back To Directory',
      openSelected: 'Open Selected Profile',
    },
    dashboard: {
      heading: 'Operations Hub',
      subtitle:
        'Manage the team from the directory, then open a worker profile for full details, edits, and documents.',
      employees: 'Employees',
      selected: 'Selected Worker',
      files: 'Selected Worker Files',
      noSelection: 'No worker selected',
      openHint: 'Tap a worker name to open profile',
    },
    deleteConfirm: (name) => `Delete ${name} and all linked documents?`,
    employees: {
      heading: 'Employees',
      add: 'Add Worker',
      search: 'Search by name',
      loading: 'Loading employees...',
      empty: 'No employees found. Add your first team member.',
      noPhone: 'No phone number',
      openProfile: 'View',
    },
    form: {
      newTitle: 'Add New Worker',
      editTitle: 'Edit Worker Data',
      detailsTitle: 'Worker Data',
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
      heading: 'Worker Documents',
      uploading: 'Uploading...',
      upload: 'Upload Files',
      loading: 'Loading documents...',
      empty: 'No uploaded files yet.',
      alt: 'Employee document',
      view: 'View',
      open: 'Open',
      download: 'Download',
      close: 'Close',
      previewUnavailable: 'Preview is unavailable for this file type.',
      openOrDownloadHint: 'Use Open or Download to inspect this file.',
      delete: 'Remove',
      deleteConfirm: (name) => `Are you sure you want to remove ${name}?`,
    },
    auth: {
      title: 'Manager Login',
      subtitle: 'This system is only allowed for the system manager.',
      username: 'Username',
      usernamePlaceholder: 'Enter username',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      submit: 'Secure Sign In',
      invalid: 'Incorrect username or password.',
      helper: 'This system is only allowed for the system manager.',
      logoAlt: 'Workforce Project app icon',
    },
  },
  ar: {
    locale: 'ar-IQ-u-nu-arab',
    operationTag: 'Workforce Project',
    title: 'العمال والمستندات',
    switchLanguage: 'English',
    switchTheme: 'تبديل المظهر',
    themeDark: 'داكن',
    themeLight: 'فاتح',
    installApp: 'إضافة للشاشة الرئيسية',
    logout: 'تسجيل الخروج',
    missingEnv:
      'متغيرات Supabase غير موجودة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY لتشغيل التطبيق.',
    selectHint: 'اضغط على اسم الموظف ليظهر ملفه مباشرة مع البيانات والمستندات.',
    profileHint: 'زر إضافة موظف لإنشاء سجل جديد، وزر تعديل لتحديث بيانات الموظف المحدد.',
    profile: {
      heading: 'ملف الموظف',
      subtitle: 'عرض مبسط لبيانات الموظف الأساسية مع المستندات.',
      editingHint: 'وضع التعديل مفعل. احفظ التغييرات أو اضغط إلغاء للعودة.',
      emptyHint: 'اختر اسم موظف من القائمة لعرض البيانات والمستندات.',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      noPhone: 'لا يوجد رقم هاتف',
    },
    sections: {
      directory: 'الدليل',
      profile: 'ملف الموظف',
      back: 'العودة إلى الدليل',
      openSelected: 'فتح ملف الموظف المحدد',
    },
    dashboard: {
      heading: 'مركز العمليات',
      subtitle:
        'أدر الفريق من الدليل ثم افتح ملف أي موظف لعرض التفاصيل الكاملة والتعديل والمستندات.',
      employees: 'عدد الموظفين',
      selected: 'الموظف المحدد',
      files: 'ملفات الموظف المحدد',
      noSelection: 'لا يوجد موظف محدد',
      openHint: 'اضغط على اسم الموظف لفتح ملفه',
    },
    deleteConfirm: (name) => `هل تريد حذف ${name} مع كل المستندات المرتبطة؟`,
    employees: {
      heading: 'الموظفون',
      add: 'إضافة موظف جديد',
      search: 'ابحث باسم الموظف',
      loading: 'جار تحميل الموظفين...',
      empty: 'لا يوجد موظفون بعد. أضف أول موظف.',
      noPhone: 'لا يوجد رقم هاتف',
      openProfile: 'عرض',
    },
    form: {
      newTitle: 'إضافة موظف جديد',
      editTitle: 'تعديل بيانات الموظف',
      detailsTitle: 'بيانات الموظف',
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
      heading: 'مستندات الموظف',
      uploading: 'جار الرفع...',
      upload: 'رفع مستندات',
      loading: 'جار تحميل المستندات...',
      empty: 'لا توجد ملفات مرفوعة حتى الآن.',
      alt: 'مستند الموظف',
      view: 'عرض',
      open: 'فتح',
      download: 'تحميل',
      close: 'إغلاق',
      previewUnavailable: 'لا يمكن معاينة هذا النوع من الملفات.',
      openOrDownloadHint: 'استخدم فتح أو تحميل للاطلاع على الملف.',
      delete: 'إزالة',
      deleteConfirm: (name) => `هل تريد إزالة ${name}؟`,
    },
    auth: {
      title: 'تسجيل دخول المدير',
      subtitle: 'This system is only allowed for the system manager.',
      username: 'اسم المستخدم',
      usernamePlaceholder: 'ادخل اسم المستخدم',
      password: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      submit: 'تسجيل الدخول',
      invalid: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
      helper: 'This system is only allowed for the system manager.',
      logoAlt: 'Workforce Project app icon',
    },
  },
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState)
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
  const [authError, setAuthError] = useState('')
  const [language, setLanguage] = useState('ar')
  const [theme, setTheme] = useState('light')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

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

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setCanInstall(true)
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

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
    if (!isAuthenticated || !hasSupabaseEnv) {
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
  }, [isAuthenticated])

  const loadDocuments = useCallback(async (employeeId) => {
    if (!isAuthenticated || !employeeId || !hasSupabaseEnv) {
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
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    loadEmployees()
  }, [isAuthenticated, loadEmployees])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    loadDocuments(selectedId)
  }, [isAuthenticated, loadDocuments, selectedId])

  useEffect(() => {
    if (isAuthenticated) {
      return
    }

    setEmployees([])
    setDocuments([])
    setSelectedId(null)
    setSearchTerm('')
    setIsEditing(false)
    setError('')
  }, [isAuthenticated])

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
          file_url: uploadResult.filePath,
        })
        uploadedRows.push({
          ...row,
          file_url: uploadResult.filePath,
          storage_path: uploadResult.filePath,
          access_url: uploadResult.accessUrl,
        })
      }

      setDocuments((previous) => [...uploadedRows, ...previous])
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setIsUploadingDocs(false)
    }
  }

  const handleDeleteDocument = async (document) => {
    const rawName = (document.storage_path || document.file_url || '').split('/').pop()
    const documentName = rawName ? decodeURIComponent(rawName) : (language === 'ar' ? 'هذا المستند' : 'this document')
    const accepted = window.confirm(ui.documents.deleteConfirm(documentName))
    if (!accepted) {
      return
    }

    setError('')

    try {
      await deleteDocumentById(
        document.id,
        document.storage_path || document.file_url,
        BUCKET_NAME,
      )
      setDocuments((previous) =>
        previous.filter((documentRow) => documentRow.id !== document.id),
      )
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleAuthenticate = ({ username, password }) => {
    if (username === managerAccess.username && password === managerAccess.password) {
      window.sessionStorage.setItem(storageKeys.auth, 'granted')
      setIsAuthenticated(true)
      setAuthError('')
      return
    }

    setAuthError(ui.auth.invalid)
  }

  const handleLogout = () => {
    window.sessionStorage.removeItem(storageKeys.auth)
    setIsAuthenticated(false)
    setAuthError('')
  }

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
  }

  const handleStartCreate = () => {
    setIsEditing(true)
    setSelectedId(null)
    setDocuments([])
  }

  const handleStartEdit = () => {
    if (!selectedEmployee) {
      return
    }

    setIsEditing(true)
  }

  const handleSelectEmployee = (id) => {
    setSelectedId(id)
    setIsEditing(false)
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        ui={ui}
        isDark={isDark}
        isArabic={isArabic}
        error={authError}
        onToggleTheme={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
        onToggleLanguage={() => setLanguage((previous) => (previous === 'en' ? 'ar' : 'en'))}
        onSubmit={handleAuthenticate}
      />
    )
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={language}
      className={`min-h-screen ${
        isDark ? 'bg-black text-zinc-100' : 'bg-[#f6fbff] text-slate-800'
      } ${isArabic ? 'font-arabic' : ''}`}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div
          className={`pointer-events-none absolute inset-0 -z-10 ${
            isDark
              ? 'bg-[radial-gradient(circle_at_12%_20%,rgba(29,155,240,0.2),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(14,116,255,0.14),transparent_38%),radial-gradient(circle_at_46%_88%,rgba(125,211,252,0.1),transparent_34%)]'
              : 'bg-[radial-gradient(circle_at_12%_20%,rgba(14,165,233,0.13),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_40%_80%,rgba(125,211,252,0.22),transparent_30%)]'
          }`}
        />
        <header
          className={`mb-6 rounded-3xl p-6 backdrop-blur md:mb-8 md:p-8 ${
            isDark
              ? 'border border-zinc-800 bg-black/75 shadow-2xl shadow-black/50'
              : 'border border-sky-100 bg-white/90 shadow-xl shadow-sky-200/45'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt={ui.auth.logoAlt} className="h-11 w-11 rounded-2xl" />
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                {ui.operationTag}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ThemeToggle
                isDark={isDark}
                onToggle={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
                lightLabel={ui.themeLight}
                darkLabel={ui.themeDark}
              />
              <button
                type="button"
                onClick={() => setLanguage((previous) => (previous === 'en' ? 'ar' : 'en'))}
                className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                    : 'border border-sky-500/30 bg-white text-sky-800 hover:bg-sky-100'
                }`}
              >
                {ui.switchLanguage}
              </button>
              {canInstall ? (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="shrink-0 rounded-2xl bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-sky-300"
                >
                  {ui.installApp}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? 'border border-rose-700/60 bg-rose-950/40 text-rose-200 hover:bg-rose-900/40'
                    : 'border border-rose-700/30 bg-white/70 text-rose-800 hover:bg-rose-100'
                }`}
              >
                {ui.logout}
              </button>
            </div>
          </div>
          <h1 className={`mt-2 text-2xl font-semibold md:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ui.title}
          </h1>
          {!hasSupabaseEnv ? (
            <p
              className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                isDark
                  ? 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                  : 'border-rose-400/50 bg-rose-100 text-rose-800'
              }`}
            >
              {ui.missingEnv}
            </p>
          ) : null}
        </header>

        <main className="grid gap-4 xl:grid-cols-[340px_1fr] xl:gap-6">
          <aside>
            <EmployeeList
              employees={filteredEmployees}
              selectedId={selectedId}
              searchTerm={searchTerm}
              isLoading={isLoadingEmployees}
              labels={ui.employees}
              isArabic={isArabic}
              isDark={isDark}
              onSearch={setSearchTerm}
              onSelect={handleSelectEmployee}
              onAddNew={handleStartCreate}
            />
          </aside>

          <section className="space-y-4">
            <section
              className={`rounded-3xl border p-5 backdrop-blur md:p-6 ${
                isDark
                  ? 'border-zinc-800 bg-black/75 shadow-xl shadow-black/40'
                  : 'border-sky-100 bg-white/92 shadow-lg shadow-sky-200/40'
              }`}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {ui.profile.heading}
                  </h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {isEditing ? ui.profile.editingHint : ui.profile.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
                  >
                    {ui.employees.add}
                  </button>

                  {selectedEmployee && !isEditing ? (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        isDark
                          ? 'border border-sky-500/50 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20'
                          : 'border border-sky-500/40 bg-sky-50 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {ui.form.edit}
                    </button>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <EmployeeForm
                  key={selectedEmployee?.id ?? 'create'}
                  employee={selectedEmployee}
                  isEditing={isEditing}
                  isSaving={isSavingEmployee}
                  labels={ui.form}
                  locale={ui.locale}
                  isArabic={isArabic}
                  isDark={isDark}
                  onEdit={handleStartEdit}
                  onCancel={() => setIsEditing(false)}
                  onCreate={handleCreateEmployee}
                  onUpdate={handleUpdateEmployee}
                  onDelete={handleDeleteEmployee}
                />
              ) : selectedEmployee ? (
                <article
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? 'border-zinc-800 bg-zinc-950 text-zinc-100'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div
                      className={`rounded-xl border px-3 py-2 ${
                        isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{ui.profile.name}</p>
                      <p className="mt-1 text-sm font-semibold">{selectedEmployee.name}</p>
                    </div>

                    <div
                      className={`rounded-xl border px-3 py-2 ${
                        isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{ui.profile.phone}</p>
                      <p className="mt-1 text-sm font-semibold">
                        {selectedEmployee.phone?.trim() ? selectedEmployee.phone : ui.profile.noPhone}
                      </p>
                    </div>
                  </div>
                </article>
              ) : (
                <p
                  className={`rounded-xl border border-dashed p-4 text-sm ${
                    isDark
                      ? 'border-zinc-700 text-zinc-400'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {ui.profile.emptyHint}
                </p>
              )}
            </section>

            {selectedEmployee ? (
              <DocumentGallery
                employee={selectedEmployee}
                documents={documents}
                isLoading={isLoadingDocuments}
                isUploading={isUploadingDocs}
                labels={ui.documents}
                locale={ui.locale}
                isArabic={isArabic}
                isDark={isDark}
                onUpload={handleUploadDocuments}
                onDelete={handleDeleteDocument}
              />
            ) : (
              <section
                className={`rounded-3xl border border-dashed p-5 text-sm ${
                  isDark
                    ? 'border-zinc-800 bg-black/60 text-zinc-400'
                    : 'border-slate-300 bg-white/80 text-slate-600'
                }`}
              >
                {isEditing ? ui.profileHint : ui.selectHint}
              </section>
            )}
          </section>
        </main>

        {error ? (
          <p
            className={`mt-5 rounded-xl border px-3 py-2 text-sm ${
              isDark
                ? 'border-rose-700/70 bg-rose-950/40 text-rose-200'
                : 'border-rose-300 bg-rose-50 text-rose-700'
            }`}
          >
            {error}
          </p>
        ) : null}

        <footer className="mt-8 pb-3 text-center">
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Designed by Vandecipher
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
