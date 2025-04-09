import { useEffect, useState } from "react"
import "./App.css"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import LZString from "lz-string"
import 'katex/dist/katex.min.css'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function ResponseViewer() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showThinking, setShowThinking] = useState(true)
  const webApp = window.Telegram.WebApp

  // Функция для удаления экранирования
  const removeEscapes = (text) => {
    return text.replace(/\\([_*[\]()~`>#+=|{}.!-])/g, "$1")
  }

  // Функция для извлечения и обработки блока thinking
  const extractThinking = (text) => {
    const thinkBlock = /<think>([\s\S]*?)<\/think>/;
    if (thinkBlock.test(text)) {
      const match = text.match(thinkBlock);
      if (match && match[1]) {
        return {
          content: match[1].trim(),
          textWithoutThinking: text.replace(thinkBlock, '')
        };
      }
    }
    return { content: '', textWithoutThinking: text };
  }

  // Функция для форматирования математических формул
  const formatMathContent = (text) => {
    if (!text) return text;
    
    console.log("Исходный текст для форматирования:", text);
    
    // Предварительная очистка: удаляем все горизонтальные линии в тексте
    // Перед любой другой обработкой
    let formatted = text;
    
    // Самое агрессивное удаление горизонтальных линий
    // 1. Удаляем одиночные короткие тире на отдельных строках
    formatted = formatted.replace(/^[-]\s*$/gm, "");
    
    // 2. Удаляем все виды горизонтальных линий (дефисы, подчеркивания, знаки равно)
    formatted = formatted.replace(/^[-=_]{2,}$/gm, "");
    formatted = formatted.replace(/^[-=_]\s[-=_]\s[-=_]$/gm, "");
    
    // 3. Удаляем линии с пробелами вокруг
    formatted = formatted.replace(/\n\s*[-=_]{2,}\s*\n/g, "\n");
    formatted = formatted.replace(/^\s*[-=_]{2,}\s*$/gm, "");
    
    // 4. Фиксируем в начале и в конце текста
    if (/^[-=_]{2,}/.test(formatted)) {
      formatted = formatted.replace(/^[-=_]{2,}(?:\s*\n)?/, "");
    }
    if (/[-=_]{2,}$/.test(formatted)) {
      formatted = formatted.replace(/(?:\n\s*)?[-=_]{2,}$/, "");
    }
    
    // 5. Удаляем все прочие варианты горизонтальных линий
    formatted = formatted.replace(/^--+$/gm, "");
    formatted = formatted.replace(/^==+$/gm, "");
    formatted = formatted.replace(/^__+$/gm, "");
    formatted = formatted.replace(/^-[-\s]*-$/gm, "");
    formatted = formatted.replace(/^=[\s=]*=$/gm, "");
    formatted = formatted.replace(/^_[\s_]*_$/gm, "");
    
    // Очищаем от информационных сообщений
    formatted = formatted.replace(/🧠 (Для просмотра хода рассуждений перейдите в веб-приложение)/g, "");
    formatted = formatted.replace(/\*Ваш запрос содержит математические выражения\*\n\n/g, "");
    formatted = formatted.replace(/\*Для просмотра полного решения с корректным форматированием формул перейдите в веб-приложение\*/g, "");
    formatted = formatted.replace(/Краткий ответ:([^\n]*)\n\n/g, "");
    
    // Обрабатываем и удаляем лишние двоеточия
    formatted = formatted.replace(/\\([_*[\]()~`>#+=|{}.!-])/g, "$1")
    
    // Обрабатываем и удаляем лишние двоеточия
    formatted = formatted.replace(/\\([_*[\]()~`>#+=|{}.!-])/g, "$1")
    
    // Очищаем от цветовой разметки (красный текст)
    formatted = formatted.replace(/<font color=['"]?red['"]?>(.*?)<\/font>/gi, '$1');
    formatted = formatted.replace(/<span style=['"]color:\s*red['"]>(.*?)<\/span>/gi, '$1');
    
    // Обрабатываем и удаляем информационные сообщения
    formatted = formatted.replace(/🧠 (Для просмотра хода рассуждений перейдите в веб-приложение)/g, "");
    formatted = formatted.replace(/\*Ваш запрос содержит математические выражения\*\n\n/g, "");
    formatted = formatted.replace(/\*Для просмотра полного решения с корректным форматированием формул перейдите в веб-приложение\*/g, "");
    formatted = formatted.replace(/Краткий ответ:([^\n]*)\n\n/g, "");
    
    // Обрабатываем и удаляем лишние двоеточия
    formatted = formatted.replace(/(?<!\$)Корни:\s*/g, "**Корни** ");
    formatted = formatted.replace(/(?<!\$)корни:\s*/g, "**Корни** ");
    formatted = formatted.replace(/(?<!\$)Дискриминант:\s*/g, "**Дискриминант** ");
    formatted = formatted.replace(/(?<!\$)дискриминант:\s*/g, "**Дискриминант** ");
    formatted = formatted.replace(/(?<!\$)Решение:\s*/g, "**Решение** ");
    formatted = formatted.replace(/(?<!\$)решение:\s*/g, "**Решение** ");
    formatted = formatted.replace(/(?<!\$)Вычисление:\s*/g, "**Вычисление** ");
    formatted = formatted.replace(/(?<!\$)Вычисления:\s*/g, "**Вычисления** ");
    formatted = formatted.replace(/(?<!\$)Ответ:\s*/g, "**Ответ** ");
    formatted = formatted.replace(/(?<!\$)ответ:\s*/g, "**Ответ** ");
    formatted = formatted.replace(/(?<!\$)Значение:\s*/g, "**Значение** ");
    formatted = formatted.replace(/(?<!\$)значение:\s*/g, "**Значение** ");
    formatted = formatted.replace(/(?<!\$)Подставим:\s*/g, "**Подставим** ");
    formatted = formatted.replace(/(?<!\$)подставим:\s*/g, "**Подставим** ");
    formatted = formatted.replace(/(?<!\$)Решаем:\s*/g, "**Решаем** ");
    formatted = formatted.replace(/(?<!\$)решаем:\s*/g, "**Решаем** ");
    formatted = formatted.replace(/(?<!\$)Проверка:\s*/g, "**Проверка** ");
    formatted = formatted.replace(/(?<!\$)проверка:\s*/g, "**Проверка** ");
    formatted = formatted.replace(/(?<!\$)Результат:\s*/g, "**Результат** ");
    formatted = formatted.replace(/(?<!\$)результат:\s*/g, "**Результат** ");
    formatted = formatted.replace(/(?<!\$)Преобразование:\s*/g, "**Преобразование** ");
    formatted = formatted.replace(/(?<!\$)преобразование:\s*/g, "**Преобразование** ");
    formatted = formatted.replace(/(?<!\$)Инструкция:\s*/g, "**Инструкция** ");
    formatted = formatted.replace(/(?<!\$)инструкция:\s*/g, "**Инструкция** ");
    formatted = formatted.replace(/(?<!\$)Шаг:\s*/g, "**Шаг** ");
    formatted = formatted.replace(/(?<!\$)шаг:\s*/g, "**Шаг** ");
    formatted = formatted.replace(/(?<!\$)Шаги:\s*/g, "**Шаги** ");
    formatted = formatted.replace(/(?<!\$)шаги:\s*/g, "**Шаги** ");
    
    // Обрабатываем и удаляем лишние двоеточия
    formatted = formatted.replace(/^([А-Яа-яЁё\s]+):\s*/gm, "**$1** ");
    
    // Удаляем отдельно стоящие двоеточия (особенно после списков и заголовков)
    // Одиночные двоеточия в начале строки
    formatted = formatted.replace(/^:\s*/gm, "");
    
    // Одиночные двоеточия после заголовков
    formatted = formatted.replace(/(\*\*[^*]+\*\*)\s*\n\s*:/g, "$1\n");
    
    // Одиночные двоеточия после нумерованных списков
    formatted = formatted.replace(/(\d+\.\s+[^\n]+)\n\s*:/g, "$1\n");
    
    // Удаляем двоеточия после маркированных списков
    formatted = formatted.replace(/(•\s+[^\n]+)\n\s*:/g, "$1\n");
    
    // Удаляем любые отдельно стоящие двоеточия
    formatted = formatted.replace(/\n\s*:\s*\n/g, "\n\n");
    
    // Удаляем двоеточия, оказавшиеся на отдельной строке
    formatted = formatted.replace(/([^\n])\n\s*:\s*\n/g, "$1\n\n");
    
    // 6. Исправляем ошибочно обработанные двоеточия в формулах
    // Для этого находим все формулы и восстанавливаем двоеточия внутри них
    const mathParts = [];
    let lastIdx = 0;
    const mathRegex = /\$(.*?)\$/g;
    let mathMatch;
    
    while ((mathMatch = mathRegex.exec(formatted)) !== null) {
      // Добавляем обычный текст до формулы
      if (mathMatch.index > lastIdx) {
        mathParts.push({
          type: 'text',
          content: formatted.substring(lastIdx, mathMatch.index)
        });
      }
      
      // Восстанавливаем двоеточия в формулах
      let formula = mathMatch[0];
      formula = formula.replace(/\*\*([^*]+)\*\*/g, "$1:"); // Восстанавливаем в формулах
      
      mathParts.push({
        type: 'math',
        content: formula
      });
      
      lastIdx = mathMatch.index + mathMatch[0].length;
    }
    
    // Добавляем оставшийся текст
    if (lastIdx < formatted.length) {
      mathParts.push({
        type: 'text',
        content: formatted.substring(lastIdx)
      });
    }
    
    // Собираем части обратно
    if (mathParts.length > 0) {
      formatted = mathParts.map(p => p.content).join('');
    }
    
    // Обрабатываем вложенные списки и маркеры
    formatted = formatted.replace(/^\s*(\d+)[.)]?\s+/gm, "1. ");
    formatted = formatted.replace(/\n\n\s*(\d+)[.)]?\s+/g, "\n\n1. ");
    formatted = formatted.replace(/\n\s*-\s+/g, "\n• ");
    
    // Удаляем лишние пробелы и переносы строк в списках
    formatted = formatted.replace(/(\d\.\s+[^\n]+)\n\s+(?=\d\.\s+)/g, "$1\n");
    
    // Удаляем горизонтальные разделители в виде тире (---)
    formatted = formatted.replace(/^-{3,}$/gm, "");
    formatted = formatted.replace(/^={3,}$/gm, "");
    formatted = formatted.replace(/^-\s*-\s*-\s*$/gm, "");
    formatted = formatted.replace(/\n\s*-{3,}\s*\n/g, "\n\n");
    formatted = formatted.replace(/\n\s*={3,}\s*\n/g, "\n\n");
    formatted = formatted.replace(/\n\s*-\s*-\s*-\s*\n/g, "\n\n");
    
    // ГЛОБАЛЬНОЕ УДАЛЕНИЕ ДВОЕТОЧИЙ
    
    // Находим и сохраняем все математические формулы
    const formulas = [];
    let tempFormatted = formatted;
    let formulaIndex = 0;
    
    // Извлекаем и заменяем формулы на временные маркеры
    tempFormatted = tempFormatted.replace(/\$([^$]*)\$/g, (match) => {
      formulas.push(match);
      return `__FORMULA_${formulaIndex++}__`;
    });
    
    // Теперь безопасно удаляем все оставшиеся двоеточия (они точно не в формулах)
    
    // 1. Заменяем двоеточия в обычных заголовках на жирный текст
    tempFormatted = tempFormatted.replace(/^([А-Яа-яЁё][^:\n]*?):\s*$/gm, "**$1**");
    
    // 2. Удаляем одиночные двоеточия в начале строк и после переносов
    tempFormatted = tempFormatted.replace(/^:\s*$/gm, "");
    tempFormatted = tempFormatted.replace(/\n\s*:\s*(?=\n)/g, "\n");
    
    // 3. Заменяем двоеточия после заголовков на пробелы
    tempFormatted = tempFormatted.replace(/\*\*([^*]+)\*\*\s*:/g, "**$1**");
    
    // 4. Удаляем двоеточия после элементов списка
    tempFormatted = tempFormatted.replace(/^(\d+\.\s+[^:\n]+):\s*$/gm, "$1");
    tempFormatted = tempFormatted.replace(/^(•\s+[^:\n]+):\s*$/gm, "$1");
    
    // 5. Специально для списков добавок и подсказок
    tempFormatted = tempFormatted.replace(/^(Овощи|Мясо|Добавки|Соусы|Приправы|Сыр|Советы|Варианты):\s*/gm, "**$1**\n");
    
    // 6. Полностью удаляем строки, содержащие только одиночное двоеточие
    tempFormatted = tempFormatted.replace(/(?:^|\n)\s*:\s*(?=\n|$)/g, "\n");
    
    // 7. Заменяем любые оставшиеся двоеточия на точки (кроме временных тегов формул)
    tempFormatted = tempFormatted.replace(/([^_]):/g, "$1.");
    
    // Теперь возвращаем формулы обратно
    for (let i = 0; i < formulas.length; i++) {
      tempFormatted = tempFormatted.replace(`__FORMULA_${i}__`, formulas[i]);
    }
    
    formatted = tempFormatted;
    
    // Объединяем группы элементов списка в реальные списки
    formatted = formatted.replace(/(?:^|\n)(•\s+[^\n]+)(?:\n(•\s+[^\n]+))+/g, (match) => {
      return "\n" + match.trim().split("\n").map(item => item.trim()).join("\n");
    });
    
    // Объединяем группы нумерованных элементов в реальные списки
    formatted = formatted.replace(/(?:^|\n)(\d+\.\s+[^\n]+)(?:\n(\d+\.\s+[^\n]+))+/g, (match) => {
      return "\n" + match.trim().split("\n").map(item => item.trim()).join("\n");
    });
    
    // Улучшаем отображение заголовков для рецептов и инструкций
    formatted = formatted.replace(/^(Ингредиенты|Инструкции|Шаги|Советы|Добавки|Варианты|Приготовление)$/gm, "**$1**");
    
    // Исправляем текст с формулами для корней
    formatted = formatted.replace(/Корни:/g, "**Корни:**");
    
    // Обрабатываем формулы с корнями
    formatted = formatted.replace(/\(x\s*=\s*(-?[^)]+)\)\s+и\s+\(x\s*=\s*(-?[^)]+)\)/g, 
                              (m, root1, root2) => `$x_1 = ${root1}$ и $x_2 = ${root2}$`);
    
    // Обрабатываем запись с корнями (x = -\\frac{2}{5}) и (x = 1/3)
    formatted = formatted.replace(/\(x\s*=\s*(-?\\frac\{[^}]+\}\{[^}]+\})\)/g, "$x = $1$");
    formatted = formatted.replace(/\(x\s*=\s*(-?[0-9]+\/[0-9]+)\)/g, "$x = $1$");
    
    // Преобразуем записи вида 5x^2 - 3x - 2 = (5x + 2)(x - 1) в LaTeX
    formatted = formatted.replace(/(\d+)x\^2/g, "$1x^2");
    formatted = formatted.replace(/(\d+)x\^(\d+)/g, "$1x^$2");
    formatted = formatted.replace(/(\d+)x(?!\^)/g, "$1x");
    
    // Специальная обработка для корней в формулах
    formatted = formatted.replace(/\\frac\{(-?\d+)([+-]\\sqrt\{[^}]+\})\}\{([^}]+)\}/g, 
                              (match, num, sqrt, denom) => `\\frac{${num}${sqrt}}{${denom}}`);
    
    // Обрабатываем квадратные уравнения в формате ax^2 + bx + c = 0
    formatted = formatted.replace(/(\d+)x\^2\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)\s*=\s*0/g, 
                              (match, a, sign1, b, sign2, c) => `$${a}x^2 ${sign1} ${b}x ${sign2} ${c} = 0$`);
    
    // ВАЖНО: Гарантированное удаление всех тегов \cdot
    // 1. Сначала обрабатываем парные \cdot\cdot как заголовки
    formatted = formatted.replace(/\\cdot\\cdot([^]*?)\\cdot\\cdot/g, function(match, content) {
      return `\n\n**${content.trim()}**\n\n`;
    });
    
    // 2. Выделяем математические выражения и остальной текст
    const parts = [];
    let lastIndex = 0;
    const mathPattern = /\$(.*?)\$/g;
    let match;
    
    while ((match = mathPattern.exec(formatted)) !== null) {
      // Добавляем текст до формулы
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: formatted.substring(lastIndex, match.index)
        });
      }
      
      // Добавляем формулу
      parts.push({
        type: 'math',
        content: match[0]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Добавляем оставшийся текст
    if (lastIndex < formatted.length) {
      parts.push({
        type: 'text',
        content: formatted.substring(lastIndex)
      });
    }
    
    // 3. Обрабатываем каждую часть отдельно
    formatted = parts.map(part => {
      if (part.type === 'math') {
        // Замена неправильных символов в формулах
        let math = part.content;
        // Заменяем дефисы на минусы
        math = math.replace(/(\d+)-(\d+)/g, "$1-$2");
        return math;
      } else {
        // В обычном тексте удаляем все теги \cdot\cdot и \cdot
        let text = part.content;
        // Удаляем одиночные теги \cdot\cdot
        text = text.replace(/\\cdot\\cdot/g, "");
        // Удаляем теги \cdot
        text = text.replace(/\\cdot/g, "");
        
        // Улучшаем форматирование списков
        text = text.replace(/^\s*•\s+/gm, "• ");
        text = text.replace(/^\s*-\s+/gm, "• ");
        
        // Исправляем вложенные списки
        text = text.replace(/^\s{2,}•/gm, "  • ");
        
        // Обрабатываем текст со специальными символами
        text = text.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
        
        return text;
      }
    }).join('');
    
    // Обрабатываем неформатированные формулы с корнями, которые остались в тексте
    formatted = formatted.replace(/(?<!\$)(\d+x\^2\s*[+-]\s*\d+x\s*[+-]\s*\d+\s*=\s*\d+)(?!\$)/g, "$$$1$$");
    formatted = formatted.replace(/(?<!\$)(Корни:\s*\(x\s*=\s*[^)]+\)[^)]*\(x\s*=\s*[^)]+\))(?!\$)/g, function(match) {
      return match.replace(/Корни:/g, "**Корни:**")
                 .replace(/\(x\s*=\s*([^)]+)\)/g, "$x = $1$");
    });
    
    // Специальная обработка для формул с множителями
    formatted = formatted.replace(/(\d+x\^2\s*[+-]\s*\d+x\s*[+-]\s*\d+)\s*=\s*(\([^)]+\)\([^)]+\))/g, 
                          "$$$1 = $2$$");
    
    // Обработка формул с корнями и дробями в вертикальной записи
    formatted = formatted.replace(/x\s*=\s*\\frac\{(-?\d+\s*[+-]\s*\\sqrt\{[^}]+\})\}\{[^}]+\}/g, 
                          "$x = \\frac{$1}{$2}$");
    
    // Преобразуем разделители в правильные переносы строк
    formatted = formatted.replace(/(---+)/g, "\n\n");
    
    // Добавляю более агрессивное удаление горизонтальных разделителей
    // В начале текста
    if (formatted.startsWith('---') || formatted.startsWith('===') || formatted.startsWith('- - -')) {
      formatted = formatted.replace(/^(?:-{3,}|={3,}|-\s*-\s*-\s*)(\n|$)/, "");
    }
    
    // В конце текста
    if (formatted.endsWith('---') || formatted.endsWith('===') || formatted.endsWith('- - -')) {
      formatted = formatted.replace(/(\n|^)(?:-{3,}|={3,}|-\s*-\s*-\s*)$/, "");
    }
    
    // В середине текста - заменяем одиночные на пустую строку
    formatted = formatted.replace(/\n(?:-{3,}|={3,}|-\s*-\s*-\s*)\n/g, "\n\n");
    
    // Убираем все оставшиеся одиночные разделители
    formatted = formatted.replace(/^(?:-{3,}|={3,}|-\s*-\s*-\s*)$/gm, "");
    
    // Убираем двойные тире в начале строки (часто используется для списков, но неправильно)
    formatted = formatted.replace(/^--\s+/gm, "• ");
    
    // Нормализуем переносы строк для согласованности
    formatted = formatted.replace(/\n{3,}/g, "\n\n"); // Заменяем три или более переносов строк на два
    
    // Добавляем переносы строк перед числами с точкой (для списков)
    formatted = formatted.replace(/(\d+)\.\s+/g, "\n$1. ");
    
    // Обрабатываем математические окружения (align, array, matrix, и т.д.)
    const envPatterns = [
      /\\begin\{(align|aligned)\}([\s\S]*?)\\end\{\1\}/g, 
      /\\begin\{(array|matrix|pmatrix|bmatrix|vmatrix|cases)\}([\s\S]*?)\\end\{\1\}/g
    ];
    
    envPatterns.forEach(pattern => {
      formatted = formatted.replace(pattern, (match, env, content) => {
        // Заменяем переносы строк в окружении на \\ для корректного отображения
        let fixedContent = content.replace(/\n+/g, ' \\\\ ');
        // Удаляем лишние пробелы
        fixedContent = fixedContent.replace(/\s+\\\\\s+/g, ' \\\\ ');
        return `\\begin{${env}}${fixedContent}\\end{${env}}`;
      });
    });
    
    // Склеиваем разорванные математические формулы со разрывами строк и числами
    formatted = formatted.replace(/\$([^$]+?)\s*=\s*([^$=]+?)\s*\+\s*\n+\s*(\d+)\s*=\s*\n+\s*(\d+)\$/gs, 
                               function(match, prefix, expr, num, result) {
      return `$${prefix} = ${expr} + ${num} = ${result}$`;
    });
    
    // Исправляем другие подобные разрывы в формулах 
    formatted = formatted.replace(/\$([^$]+?)\s*=\s*([^$=]+?)\s*\n+\s*(\d+)\$/gs, 
                               function(match, prefix, expr, num) {
      return `$${prefix} = ${expr} ${num}$`;
    });
    
    // Обработка неформатированных корней в формате sqrt{...}
    formatted = formatted.replace(/\\sqrt\{([^}]+)\}/g, (m, inside) => {
      // Если это уже часть формулы, оставляем
      if (/((?:\$[^$]*)|(?:\\begin))/.test(formatted.substring(Math.max(0, m.index - 20), m.index))) {
        return m;
      }
      return `$\\sqrt{${inside}}$`;
    });
    
    // Исправляем разорванные фрагменты с дробями
    formatted = formatted.replace(/\$([^$]+?)\\frac\{([^{}]+)\}\{[^{}]*\n+\s*([^{}]+)\}\s*([^$]*)\$/gs, 
                               function(match, prefix, numerator, denominator, suffix) {
      return `$${prefix}\\frac{${numerator}}{${denominator}} ${suffix}$`;
    });
    
    // Исправляем разрывы в формулах с числами на новой строке
    formatted = formatted.replace(/\$([^$\n]+)\n+\s*(\d+)([^$\n]*)\$/gs, '$$$1 $2$3$$');
    
    // Исправляем выражения с дробями без правильного LaTeX синтаксиса
    formatted = formatted.replace(/\$([^$]*?\\frac\{[^{}]+\}\{)(\n\n)?(\d+)(\}[^$]*?)\$/g, '$$$1$3$4$$');
    
    // Обработка inline-формул вида $...$, которые разбиты на несколько строк
    formatted = formatted.replace(/\$([^$\n]+)\n+([^$\n]+)\$/g, (match, first, second) => {
      return `$${first} ${second}$`;
    });
    
    // Объединение многострочных формул в одну строку
    formatted = formatted.replace(/\$\n+([^$]+)\n+\$/gs, (match, formula) => {
      return `$${formula.replace(/\n+/g, ' ')}$`;
    });
    
    // Добавление пропущенных закрывающих скобок в LaTeX командах
    formatted = formatted.replace(/\\(left|right)([({[])/g, '\\$1$2');
    formatted = formatted.replace(/\\(left|right)([)}\]])/g, '\\$1$2');
    
    // Исправление дробей, разделенных пробелами
    formatted = formatted.replace(/\\frac\s+\{([^{}]+)\}\s+\{([^{}]+)\}/g, '\\frac{$1}{$2}');
    
    // Очищаем повторяющиеся формулы (дублированные в тексте)
    const lines = formatted.split('\n');
    const uniqueLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      // Пропускаем пустые строки
      if (!line) continue;
      
      // Проверяем, не является ли текущая строка дубликатом предыдущей
      if (i > 0) {
        // Создаем очищенные версии для сравнения (без пробелов и переносов)
        const cleanCurrent = line.replace(/\s+/g, '');
        const cleanPrev = lines[i-1].replace(/\s+/g, '');
        
        // Если текущая строка почти такая же, как предыдущая, пропускаем её
        if (cleanCurrent.length > 10 && cleanPrev.includes(cleanCurrent.substring(0, 10))) {
          continue;
        }
      }
      
      uniqueLines.push(line);
    }
    
    // Собираем текст обратно с правильными отступами
    formatted = uniqueLines.join('\n\n');
    
    // Обрабатываем квадратные скобки с математическими выражениями
    formatted = formatted.replace(/\[([^\]]*)\]/g, function(match, content) {
      // Если содержимое уже содержит LaTeX-команды или математические символы
      if (/\\(?:frac|sqrt|sum|int|prod|lim|infty|partial)/i.test(content) ||
          /[=<>+\-*/_{}()]/.test(content)) {
        // Убираем лишние пробелы в начале и конце
        content = content.trim();
        // Используем инлайновый режим для LaTeX
        return '$' + content + '$';
      }
      return match; // Иначе оставляем как есть
    });
    
    // Обрабатываем некорректные скобки вида [Дискриминант(... и подобные
    formatted = formatted.replace(/\[([А-Яа-яЁё]+)\s*\(\s*([^)]*)\s*\)/g, function(match, word, inner) {
      return `**${word}** (${inner})`;
    });
    
    // Удаляем одиночные скобки без пары
    formatted = formatted.replace(/\[([^\]\n]*?)$/gm, "$1");
    formatted = formatted.replace(/^\s*\]\s*/gm, "");
    
    // Удаляем одиночные открывающие скобки в начале строки
    formatted = formatted.replace(/^\s*\[\s*/gm, "");
    
    // Удаляем странные символы и комбинации
    formatted = formatted.replace(/•/g, "");
    formatted = formatted.replace(/\+\*/g, "");
    formatted = formatted.replace(/\*\+/g, "");
    formatted = formatted.replace(/\*двадействительныхкорня\*/g, "**два действительных корня**");
    
    // Исправляем некорректное форматирование текста
    formatted = formatted.replace(/(\w+)([А-Яа-я])/g, "$1 $2"); // Добавляем пробел между словами
    
    // Обрабатываем дискриминант и подобные термины
    formatted = formatted.replace(/(?:^|\s)[ДД]искриминант\s*\(([^)]*)\)/g, "**Дискриминант** ($1)");
    formatted = formatted.replace(/два\s*действительных\s*корня/gi, "**два действительных корня**");
    
    // Исправляем некорректные ### символы
    formatted = formatted.replace(/###\s*$/gm, "");
    formatted = formatted.replace(/###/g, "");
    
    // Очищаем странные символы между словами
    formatted = formatted.replace(/([А-Яа-яЁё])\s*[•*+.]\s*([А-Яа-яЁё])/g, "$1 $2");
    
    // Исправляем ошибочное оформление корней уравнения
    formatted = formatted.replace(/\$\$Корни:\s*\(x\s*=\s*([^)]+)\)\s*и\s*\(x\s*=\s*([^)]+)\)\$\$/g, 
      "**Корни:** $x_1 = $1$ и $x_2 = $2$");
    
    // Обрабатываем специальную запись корней с дробями
    formatted = formatted.replace(/\$\$x\s*=\s*(-?\d+\/\d+)\$\$/g, "$x = $1$");
    
    // Обрабатываем строки с примерами вычислений
    formatted = formatted.replace(/(\d+[a-zA-Z]\^2\s*[+-]\s*\d+[a-zA-Z]\s*[+-]\s*\d+)\s*=\s*(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g, 
      "$$$1 = $2 + $3 = $4$$");
    
    // Распознавание математических выражений и их преобразование
    // Поиск формул, которые могут быть не обернуты в символы доллара
    const mathExpressions = [
      // Выражения с корнями и дробями
      /(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\})/g,
      // Выражения с индексами и операторами
      /([a-zA-Z]_\{[^{}]+\}|\\pm|\\cdot|\\text\{[^{}]+\})/g,
      // Выражения с символами +-*/= и скобками
      /([a-zA-Z]\s*[=<>]\s*[-+]?[0-9.]+|[-+]?[0-9.]+\s*[=<>]\s*[a-zA-Z])/g
    ];
    
    // Разбиваем текст на абзацы для обработки формул в каждом абзаце
    const paragraphs = formatted.split("\n\n");
    
    // Обрабатываем каждый абзац
    formatted = paragraphs.map(paragraph => {
      // Если абзац уже содержит символы $ или начинается с заголовка, оставляем как есть
      if (paragraph.includes('$') || paragraph.startsWith("**")) {
        return paragraph;
      }
      
      // Проверяем наличие математических выражений в абзаце
      let containsMath = false;
      for (const regex of mathExpressions) {
        if (regex.test(paragraph)) {
          containsMath = true;
          break;
        }
      }
      
      // Если абзац содержит математическое выражение
      if (containsMath) {
        // Обрабатываем простые формулы типа "a = 5"
        if (/^[a-zA-Z]_?\{?[\d,]*\}?\s*=\s*[-\d./]+\s*$/.test(paragraph.trim())) {
          return '$' + paragraph.trim() + '$';
        }
        
        // Обрабатываем выражения вида "x_1 = ..."
        if (/^[a-zA-Z]_\{?\d+\}?\s*=/.test(paragraph.trim())) {
          return '$' + paragraph.trim() + '$';
        }
        
        // Обрабатываем математические выражения с операторами
        if (/=/.test(paragraph) && /[+\-*/()]/.test(paragraph)) {
          return '$' + paragraph.trim() + '$';
        }
      }
      
      return paragraph;
    }).join("\n\n");
    
    // Добавляем обработку систем уравнений
    formatted = formatted.replace(/\{([\s\S]*?)\}\s*,\s*где/g, (match, system) => {
      // Проверяем наличие переносов строк в системе
      if (system.includes('\n')) {
        // Создаем environment cases для системы
        let cases = system.split('\n')
          .map(line => line.trim())
          .filter(line => line)
          .map(line => line.replace(/,$/, ''))
          .join(' \\\\ ');
        return `$\\begin{cases}${cases}\\end{cases}$, где`;
      }
      return match;
    });
    
    // Преобразуем заголовки в жирный текст Markdown, если они еще не в формате Markdown
    formatted = formatted.replace(/^([\wА-Яа-яЁё\s]+)(?=\n)/gm, function(match, title) {
      if (title.trim().length > 3 && !/\*\*/.test(title)) {
        return '**' + title.trim() + '**';
      }
      return match;
    });
    
    // Обеспечиваем правильные пробелы вокруг операторов в формулах
    formatted = formatted.replace(/\$([^$]*?[a-zA-Z0-9]}?)([+\-=<>])([a-zA-Z0-9{][^$]*?)\$/g, 
      (match, before, operator, after) => {
        return `$${before} ${operator} ${after}$`;
    });
    
    // Исправляем дроби: преобразуем a/b в \frac{a}{b}
    formatted = formatted.replace(/\$([^$]*?)(\d+)\/(\d+)([^$]*?)\$/g, function(match, before, numerator, denominator, after) {
      return '$' + before + '\\frac{' + numerator + '}{' + denominator + '}' + after + '$';
    });
    
    // Фиксируем особые случаи frac
    formatted = formatted.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "\\frac{$1}{$2}");
    
    // Фиксируем различные символы и выражения в LaTeX
    // Корни: \sqrt{...}
    formatted = formatted.replace(/\\sqrt\s+(\w+)/g, "\\sqrt{$1}");
    formatted = formatted.replace(/\\sqrt([^{])/g, "\\sqrt{$1}");
    
    // Индексы: x_{1,2}
    formatted = formatted.replace(/(\w+)_(\w+)/g, "$1_{$2}");
    
    // Знак "плюс-минус": \pm
    formatted = formatted.replace(/\+-/g, "\\pm");
    formatted = formatted.replace(/±/g, "\\pm");
    
    // Знак умножения: \cdot
    formatted = formatted.replace(/⋅/g, "\\cdot");
    
    // ВАЖНО: Еще раз проверяем, не остались ли теги \cdot в тексте вне математических выражений
    // Разбиваем текст на математические и нематематические части
    const mathSegments = formatted.split(/(\$[^$]*\$)/);
    formatted = mathSegments.map((segment, index) => {
      // Нечетные сегменты - это математические выражения
      if (index % 2 === 1) return segment;
      // В обычном тексте удаляем все оставшиеся \cdot
      return segment.replace(/\\cdot/g, "");
    }).join('');
    
    // Улучшаем обработку систем уравнений
    formatted = formatted.replace(/\$\\begin\{cases\}([^$]+)\\end\{cases\}\$/g, (match, content) => {
      // Убеждаемся, что строки системы корректно разделены
      let fixedContent = content.replace(/(?<![\\])\n/g, ' \\\\ ');
      // Исправляем все \\ на правильную форму
      fixedContent = fixedContent.replace(/\\\\/g, '\\\\');
      // Удаляем лишние пробелы вокруг разделителей строк
      fixedContent = fixedContent.replace(/\s*\\\\\s*/g, ' \\\\ ');
      return `$\\begin{cases}${fixedContent}\\end{cases}$`;
    });
    
    // Исправляем различные специальные символы и выражения
    formatted = formatted.replace(/\\text\{([^{}]*)\}/g, "\\text{$1}");
    formatted = formatted.replace(/\(\\text\{([^{}]*)\}\)/g, "\\text{$1}");
    
    // Убираем лишние пробелы внутри LaTeX выражений
    formatted = formatted.replace(/\$\s+/g, "$");
    formatted = formatted.replace(/\s+\$/g, "$");
    
    // Удаляем лишние цифры в тексте
    formatted = formatted.replace(/\n\d+\s*(?=\n)/g, "\n");
    
    // Исправляем фрагменты с перепутанными индексами и метками
    formatted = formatted.replace(/−∗∗/g, "**");
    
    // Добавляем отступы между заголовками и математическими формулами
    formatted = formatted.replace(/\*\*([^*]+)\*\*\s*\n*\s*\$\$/g, "**$1**\n\n$$");
    formatted = formatted.replace(/\$\$\s*\n*\s*\*\*([^*]+)\*\*/g, "$$\n\n**$1**");
    
    // Добавляем отступы между абзацами и математическими формулами
    formatted = formatted.replace(/([^$\n])\n\$\$/g, "$1\n\n$$");
    formatted = formatted.replace(/\$\$\n([^$\n])/g, "$$\n\n$1");
    
    // Разделяем длинные выражения переносами строк для лучшей читаемости
    formatted = formatted.split("\n\n").map(para => {
      if (para.length > 100 && !para.includes("$") && !para.startsWith("**")) {
        return para.replace(/\.\s+/g, ".\n\n");
      }
      return para;
    }).join("\n\n");
    
    // Убираем дубликаты переносов строк
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    
    // Преобразуем все последовательности $$ в одиночные $ (для inline формул)
    formatted = formatted.replace(/\$\$([^$]+?)\$\$/g, "$$$1$$");
    
    // Преобразуем display-формулы к правильному виду
    formatted = formatted.replace(/\$\$([^$]+?)\$\$/g, function(match, content) {
      // Если в формуле есть специальные окружения, сохраняем как $$
      if (/\\begin\{/i.test(content)) {
        return match;
      }
      // Если это большая формула с несколькими = или \\, делаем display mode
      if ((content.match(/=/g) || []).length > 1 || content.includes('\\\\')) {
        return `$$${content}$$`;
      }
      // Иначе делаем inline формулу
      return `$${content}$`;
    });
    
    // Финальная проверка - удаляем все оставшиеся теги \cdot
    formatted = formatted.replace(/\\cdot\\cdot/g, "");
    formatted = formatted.replace(/\\cdot/g, " · ");
    
    console.log("Отформатированный текст:", formatted);
    
    return formatted;
  }

  // Функция для копирования текста ответа
  const copyToClipboard = () => {
    // Создаем текстовую версию ответа без markdown-разметки
    const plainText = response.answer
      .replace(/\$([^$]+)\$/g, '$1') // Убираем символы $ из LaTeX
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2") // Заменяем \frac{a}{b} на a/b
      .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)") // Заменяем \sqrt{a} на √(a)
      .replace(/\\pm/g, "±") // Заменяем \pm на ±
      .replace(/\\cdot/g, "·") // Заменяем \cdot на ·
      .replace(/\\text\{([^{}]+)\}/g, "$1") // Убираем \text{}
      .replace(/\\_/g, "_") // Убираем экранирование подчеркивания
      .replace(/\\([[\]()~`>#+=|{}.!-])/g, "$1"); // Убираем другие экранирования

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

  // Функция для переключения отображения рассуждений
  const toggleThinking = () => {
    setShowThinking(!showThinking)
  }

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const compressedData = urlParams.get("d")

      if (compressedData) {
        const decompressedData = LZString.decompressFromEncodedURIComponent(compressedData)

        if (decompressedData) {
          const parsedData = JSON.parse(decompressedData)
          console.log("Полученные данные:", parsedData)
          
          // Обработка ответа и thinking
          let thinkingContent = '';
          
          // Определяем приоритетный источник для ответа
          let answerText = '';
          
          // 1. Если есть математический контент, используем его
          if (parsedData.hasMath && parsedData.mathContent) {
            console.log("Использую математический контент");
            answerText = formatMathContent(removeEscapes(parsedData.mathContent));
          }
          // 2. Иначе если есть оригинальный ответ, используем его
          else if (parsedData.originalAnswer) {
            console.log("Использую оригинальный ответ");
            const extracted = extractThinking(removeEscapes(parsedData.originalAnswer));
            thinkingContent = extracted.content;
            answerText = formatMathContent(extracted.textWithoutThinking);
          } 
          // 3. В крайнем случае используем data
          else {
            console.log("Использую data");
            const data = removeEscapes(parsedData.data);
            // Проверяем, содержит ли текст сообщение о математических выражениях
            if (data.includes("Ваш запрос содержит математические выражения")) {
              answerText = "К сожалению, не удалось получить полное математическое решение. Пожалуйста, повторите запрос.";
            } else {
              const extracted = extractThinking(data);
              thinkingContent = extracted.content;
              answerText = formatMathContent(extracted.textWithoutThinking);
            }
          }
          
          console.log("Итоговый ответ:", answerText);
          
          setResponse({
            answer: answerText,
            thinking: thinkingContent,
            reasoningSteps: parsedData.r?.map((step) => removeEscapes(step)) || [],
            citations: parsedData.c || [],
            reasoningMode: parsedData.reasoningMode || false
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
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ inline, className, children, ...props }) {
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
                  a({ href, children, ...props }) {
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

          {/* Кнопки действий */}
          <div className="mb-4 mt-2 flex flex-col gap-2">
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
            
            {/* Кнопка переключения режима рассуждений */}
            {response.reasoningMode && (response.thinking || response.reasoningSteps?.length > 0) && (
              <button
                onClick={toggleThinking}
                className="toggle-thinking-button"
                style={{
                  backgroundColor: "#4CAF50",
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
                {showThinking ? "🧠 Скрыть ход рассуждений" : "🧠 Показать ход рассуждений"}
              </button>
            )}
          </div>

          {/* Отображаем блок thinking если режим рассуждений включен и есть содержимое блока */}
          {response.reasoningMode && response.thinking && showThinking && (
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">🧠 Ход рассуждений:</h2>
              <div className="text-gray-700">
                {response.thinking.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2">{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Отображаем шаги рассуждения только если режим рассуждений включен */}
          {response.reasoningMode && response.reasoningSteps?.length > 0 && showThinking && (
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
                        maxWidth: "100%",
                        wordBreak: "break-all"
                      }}
                      className="citation-link hover:opacity-80"
                      title={citation}
                    >
                      {index + 1}. {formatUrl(citation)}
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

// Добавляем функцию для форматирования URL
function formatUrl(url) {
  try {
    // Создаем объект URL для разбора адреса
    const urlObj = new URL(url);
    // Убираем протокол, www и оставляем только домен и путь
    let domain = urlObj.hostname.replace(/^www\./, '');
    
    // Форматируем путь
    let path = urlObj.pathname;
    if (path.length > 20) {
      path = path.substring(0, 15) + '...';
    }
    
    // Возвращаем более компактное представление URL
    return `${domain}${path === '/' ? '' : path}`;
  } catch (e) {
    // Если что-то не так с URL, возвращаем его в обрезанном виде
    if (url.length > 40) {
      return url.substring(0, 37) + '...';
    }
    return url;
  }
}

export default App

