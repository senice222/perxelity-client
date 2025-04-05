import { useEffect, useState } from "react"
import "./App.css"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import LZString from "lz-string"

function ResponseViewer() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const webApp = window.Telegram.WebApp

  // Функция для удаления экранирования
  const removeEscapes = (text) => {
    return text.replace(/\\([_*[\]()~`>#+=|{}.!-])/g, "$1")
  }

  // Функция для копирования текста ответа
  const copyToClipboard = () => {
    // Создаем текстовую версию ответа без markdown-разметки
    const plainText = response.answer
      .replace(/\[\\?\[(\d+)\\?\]\]\([^)]+\)/g, '[$1]') // Заменяем markdown-ссылки на [N]
      .replace(/\\\*/g, '*') // Заменяем экранированные звездочки
      .replace(/\\_/g, '_') // Заменяем экранированные подчеркивания
      .replace(/\\([[\]()~`>#+=|{}.!-])/g, '$1') // Убираем другие экранирования

    navigator.clipboard.writeText(plainText).then(
      () => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      },
      (err) => {
        console.error('Не удалось скопировать текст: ', err)
      }
    )
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
                  a({ node, href, children, ...props }) {
                    // Проверяем, является ли это ссылкой на источник
                    const isSourceLink = /\[\d+\]/.test(String(children));
                    
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-link ${isSourceLink ? 'source-link' : ''}`}
                        style={{
                          color: "black",
                          textDecoration: "underline",
                          fontWeight: isSourceLink ? "bold" : "normal"
                        }}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {response.answer}
              </ReactMarkdown>
            </div>
          </div>

          {/* Кнопка "Скопировать" */}
          <div className="mb-4 mt-2">
            <button
              onClick={copyToClipboard}
              className="copy-button"
              style={{
                backgroundColor: "#2196F3",
                color: "white",
                padding: "10px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "500",
                width: "100%",
                textAlign: "center"
              }}
            >
              {copySuccess ? "✅ Скопировано" : "Copy / Скопировать"}
            </button>
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
              <h2 style={{
                color: 'black'
              }} className="text-lg font-semibold mb-2">📚 Sources:</h2>
              <ul className="list-none">
                {response.citations.map((citation, index) => (
                  <li key={index} className="mb-2">
                    <a
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: "black",
                        display: "block",
                        padding: "4px 0",
                        textDecoration: "underline",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%"
                      }}
                      className="citation-link hover:opacity-80"
                      title={citation}
                    >
                      {index + 1}. {citation}
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

