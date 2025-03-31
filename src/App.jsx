import { useEffect, useState } from "react"
import "./App.css"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import LZString from "lz-string"

function ResponseViewer() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(true)
  const webApp = window.Telegram.WebApp

  // Функция для удаления экранирования
  const removeEscapes = (text) => {
    return text.replace(/\\([_*[\]()~`>#+=|{}.!-])/g, "$1")
  }

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const compressedData = urlParams.get("d")

      if (compressedData) {
        const decompressedData = LZString.decompressFromEncodedURIComponent(compressedData)

        if (decompressedData) {
          const parsedData = JSON.parse(decompressedData)
          setResponse({
            answer: removeEscapes(parsedData.data),
            reasoningSteps: parsedData.r?.map((step) => removeEscapes(step)) || [],
            citations: parsedData.c || [],
          })
        } else {
          console.error("Failed to decompress data")
        }
      }
    } catch (error) {
      console.error("Error parsing response:", error)
    }
    setLoading(false)

    if (webApp) {
      webApp.ready()
      document.documentElement.style.setProperty("--tg-theme-bg-color", webApp.backgroundColor)
      document.documentElement.style.setProperty("--tg-theme-text-color", webApp.textColor)
      document.documentElement.style.setProperty("--tg-theme-button-color", webApp.buttonColor)
      document.documentElement.style.setProperty("--tg-theme-button-text-color", webApp.buttonTextColor)
    }
  }, [webApp])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">No response data available</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--tg-theme-bg-color)",
        color: "var(--tg-theme-text-color)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 dark:bg-gray-800 shadow-lg p-6 fade-in">
          <div className="mb-6">
            <div className="text-gray-700 dark:text-gray-300 markdown-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    const language = match ? match[1] : ""

                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {response.answer}
              </ReactMarkdown>
            </div>
          </div>

          {response.reasoningSteps?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">🧠 Reasoning Steps:</h2>
              <ul className="list-none">
                {response.reasoningSteps.map((step, index) => (
                  <li key={index} className="reasoning-step">
                    <span className="mr-2">🔹</span>
                    <span className="text-gray-700 dark:text-gray-300">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response.citations?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">📚 Sources:</h2>
              <ul className="list-none">
                {response.citations.map((citation, index) => (
                  <li key={index} className="mb-2">
                    <a
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--tg-theme-button-color)" }}
                      className="citation-link hover:opacity-80"
                    >
                      <span className="mr-2">🔗</span>
                      <span>Source {index + 1}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return <ResponseViewer />
}

export default App

