import React, {
  Suspense,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { UploadCard } from "./components/ui/UploadCard";
import { HistorySidebar } from "./components/ui/HistorySidebar";
import { ChatPanel } from "./components/ui/ChatPanel";
import { ErrorProvider } from "./components/ui/ErrorContext";
import { ErrorBanner } from "./components/ui/ErrorBanner";

// Theme context for dark mode
const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  // Set initial theme on mount
  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {theme === "dark" ? (
        // Moon icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-yellow-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
          />
        </svg>
      ) : (
        // Sun icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"
          />
        </svg>
      )}
    </button>
  );
}

interface Document {
  id: string;
  filename: string;
  uploadDate: string;
  filePath: string;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">Loading...</p>
  </div>
);

function App() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleUploadSuccess = () => {
    setSidebarKey((k) => k + 1);
  };

  return (
    <ThemeProvider>
      <ErrorProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-blue-50 dark:bg-gray-900 font-sans transition-colors duration-300">
          <header className="flex-none bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-8 lg:px-12 flex items-center justify-between">
              <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 tracking-tight">
                jo-speaks: Meet Jo Jo, your PDF Q&A BFF! 🦜
              </h1>
              <ThemeToggleButton />
            </div>
          </header>
          <ErrorBanner />
          <div className="flex flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-10 lg:px-12 overflow-hidden">
            <aside className="w-3/10 lg:w-1/4 flex flex-col h-full">
              <div className="flex-none p-0 pb-4">
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-base sm:text-lg"
                  onClick={() => setSelectedDocument(null)}
                >
                  + Upload New PDF
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<LoadingFallback />}>
                  <HistorySidebar
                    key={sidebarKey}
                    onSelectDocument={handleDocumentSelect}
                    selectedDocumentId={selectedDocument?.id}
                  />
                </Suspense>
              </div>
            </aside>
            <main className="w-7/10 lg:w-3/4 p-0 pl-4 flex flex-col h-full overflow-y-auto">
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-col h-[60vh] sm:h-[70vh] md:h-[75vh] lg:h-[80vh] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg p-2 sm:p-6 overflow-hidden transition-colors duration-300">
                  <div
                    className="flex-1 min-h-0 overflow-y-auto pr-1"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {!selectedDocument ? (
                      <UploadCard onUploadSuccess={handleUploadSuccess} />
                    ) : (
                      <Suspense fallback={<LoadingFallback />}>
                        <ChatPanel documentId={selectedDocument.id} />
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ErrorProvider>
    </ThemeProvider>
  );
}

export default App;
