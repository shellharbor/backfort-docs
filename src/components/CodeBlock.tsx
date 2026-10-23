import { useRef, useState } from "react";
import { useText } from "../i18n";
import { Icon } from "./Icon";
export function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CodeBlock({
  code,
  title,
  filename,
}: {
  code: string;
  title: string;
  filename?: string;
}) {
  const t = useText();
  const [status, setStatus] = useState<"copied" | "unavailable" | "">("");
  const [fallback, setFallback] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const notices = {
    copied: t("Copied.", "Скопировано."),
    unavailable: t(
      "Clipboard unavailable. Select the text below and copy it.",
      "Буфер обмена недоступен. Выделите текст ниже и скопируйте.",
    ),
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      setFallback(false);
    } catch {
      setFallback(true);
      setStatus("unavailable");
      setTimeout(() => {
        ref.current?.focus();
        ref.current?.select();
      }, 0);
    }
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{title}</span>
        <div>
          {filename && (
            <button
              onClick={() => download(code, filename)}
              aria-label={t("Download ", "Скачать ") + filename}
            >
              <Icon name="download" size={15} />
            </button>
          )}
          <button onClick={copy}>
            <Icon name="copy" size={14} />
            {t("Copy", "Копировать")}
          </button>
        </div>
      </div>
      <pre tabIndex={0} role="region" aria-label={title}>
        <code>{code}</code>
      </pre>
      <span className="copy-status" role="status" aria-live="polite">
        {status && notices[status]}
      </span>
      {fallback && (
        <textarea
          ref={ref}
          readOnly
          value={code}
          aria-label={t("Copy text manually", "Текст для ручного копирования")}
        />
      )}
    </div>
  );
}
