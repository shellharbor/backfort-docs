import { useText } from "../i18n";
import { sourceLink, upstream } from "../data/upstream";
import { checkoutCommands, installCommands } from "../domain/installation";
import { CodeBlock } from "./CodeBlock";
export function InstallationGuide() {
  const t = useText();
  return (
    <section id="installation" className="section install-section">
      <div className="section-top">
        <div>
          <span className="eyebrow">
            {t("BEFORE YOUR FIRST BACKUP", "ПЕРЕД ПЕРВОЙ КОПИЕЙ")}
          </span>
          <h2>
            {t("First, prepare your server.", "Сначала подготовьте сервер.")}
          </h2>
          <p>
            {t(
              "A small Bash CLI. An explicit, reproducible installation.",
              "Небольшой Bash CLI. Явная, воспроизводимая установка.",
            )}
          </p>
        </div>
        <span className="version-pill">
          Linux · Bash 4.3+ · CLI {upstream.version}
        </span>
      </div>
      <div className="install-grid">
        <div>
          <h3>{t("What you’ll need", "Что понадобится")}</h3>
          <p>
            {t(
              "Linux, Bash 4.3+, GNU tar, coreutils, findutils, gzip, flock (util-linux), SHA-256 tools and Mike Farah yq v4. Git is needed for this checkout.",
              "Linux, Bash 4.3+, GNU tar, coreutils, findutils, gzip, flock (util-linux), SHA-256 tools и Mike Farah yq v4. Git нужен для checkout.",
            )}
          </p>
          <CodeBlock
            title={t(
              "Debian / Ubuntu · base tools",
              "Debian / Ubuntu · базовые утилиты",
            )}
            code="sudo apt-get install git bash coreutils findutils gzip tar util-linux"
          />
          <p className="hint">
            {t(
              "Install Mike Farah yq v4 separately from its official source. A different yq implementation will not work. Add zstd, age, GnuPG, Minisign, rclone or Docker only for the features you choose. On other Linux distributions, install the same prerequisites using your package manager.",
              "Установите Mike Farah yq v4 отдельно из официального источника. Другая реализация yq не подойдёт. zstd, age, GnuPG, Minisign, rclone и Docker нужны для выбранных функций. В других Linux установите те же зависимости своим пакетным менеджером.",
            )}
          </p>
          <a
            className="doc-link"
            href="https://github.com/mikefarah/yq#install"
          >
            {t("Get the right yq", "Установить нужный yq")} ↗
          </a>
        </div>
        <div className="install-steps">
          <details open>
            <summary>
              {t(
                "01 · Check out the audited source",
                "01 · Получите исследованный исходник",
              )}
            </summary>
            <CodeBlock
              title={t(
                "Linux · pinned source",
                "Linux · зафиксированный исходник",
              )}
              code={checkoutCommands}
            />
          </details>
          <details>
            <summary>
              {t(
                "02 · Review, then install the executable",
                "02 · Проверьте и установите executable",
              )}
            </summary>
            <p className="hint">
              {t(
                "Read the checked-out code before trusting it with root access. These commands refuse an existing executable. Upgrades require a deliberate backup of the old file and review of the new version.",
                "Прочитайте код checkout, прежде чем доверить ему root-доступ. Эти команды отказываются заменять существующий executable. Для обновления отдельно сохраните старый файл и проверьте новую версию.",
              )}
            </p>
            <CodeBlock
              title={t(
                "Install after source review",
                "Установка после проверки исходника",
              )}
              code={installCommands}
            />
            <p className="note">
              {t(
                "Upstream scripts/install.sh and install.ps1 install AI Kit instruction templates, not Backfort. They are excluded from this installation.",
                "Upstream scripts/install.sh и install.ps1 устанавливают шаблоны инструкций AI Kit. Это не установщики Backfort; здесь они не используются.",
              )}
            </p>
          </details>
          <details>
            <summary>
              {t(
                "03 · Configure, diagnose, back up, recover",
                "03 · Настройте, проверьте, скопируйте, восстановите",
              )}
            </summary>
            <p>
              {t(
                "Use the builder below. Transfer the downloaded YAML, install it root-owned with mode 0640 or stricter, prepare real paths and environment, then run doctor and dry-run. The real backup is a separate command.",
                "Используйте мастер ниже. Перенесите YAML, установите root-owned с правами 0640 или строже, подготовьте реальные пути и окружение. Затем выполните doctor и dry-run. Реальный backup — отдельная команда.",
              )}
            </p>
            <a className="doc-link" href="#configure">
              {t("Open the configurator", "Открыть мастер")} →
            </a>
          </details>
        </div>
      </div>
      <div className="source-note">
        <span>
          {t("Audited engine", "Исследованный движок")}: {upstream.version} ·{" "}
          <a href={sourceLink("backfort.sh")}>
            {upstream.commit.slice(0, 7)} ↗
          </a>
        </span>
        <a href={sourceLink("README.md")}>
          {t("Official installation guide", "Официальная установка")} ↗
        </a>
      </div>
    </section>
  );
}
