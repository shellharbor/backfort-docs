import { useEffect, useState } from "react";
import { LanguageContext, type Language, useText } from "./i18n";
import { Mark, Icon } from "./components/Icon";
import { Wizard } from "./components/wizard/Wizard";
import { InstallationGuide } from "./components/InstallationGuide";
import { RecoveryGuide, Documentation, FAQ } from "./components/Documentation";
import { upstream, sourceLink } from "./data/upstream";
function Site({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (v: Language) => void;
}) {
  const t = useText();
  return (
    <>
      <a className="skip-link" href="#configure">
        {t("Skip to configurator", "К мастеру настройки")}
      </a>
      <header className="site-header wrap">
        <a className="brand" href="#overview">
          <Mark />
          <span>Backfort</span>
          <small>{t("DOCS & CONFIGURATOR", "ДОКУМЕНТАЦИЯ И МАСТЕР")}</small>
        </a>
        <nav aria-label={t("Main navigation", "Главная навигация")}>
          {[
            ["overview", t("Overview", "Обзор")],
            ["installation", t("Installation", "Установка")],
            ["configure", t("Configure", "Настроить")],
            ["recovery", t("Recovery", "Recovery")],
            ["reference", t("Reference", "Справочник")],
            ["faq", "FAQ"],
          ].map(([id, label]) => (
            <a key={id} href={"#" + id}>
              {label}
            </a>
          ))}
        </nav>
        <a
          className="github-link"
          href={upstream.repo}
          aria-label="Backfort on GitHub"
        >
          <Icon name="github" size={18} />
          <span>GitHub ↗</span>
        </a>
        <button
          className="language-button"
          onClick={() => setLanguage(language === "en" ? "ru" : "en")}
          aria-label={
            language === "en"
              ? "EN / RU: Switch to Russian"
              : "EN / RU: Переключить на английский"
          }
        >
          <span className={language === "en" ? "active" : ""}>EN</span>
          <span>/</span>
          <span className={language === "ru" ? "active" : ""}>RU</span>
        </button>
      </header>
      <main>
        <section id="overview" className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-dot" />
              {t(
                "LINUX BACKUPS. EXPLICIT BY DESIGN.",
                "LINUX-БЭКАПЫ. ВСЁ ПОД КОНТРОЛЕМ.",
              )}
            </span>
            <h1>
              {t("Your data.", "Ваши данные.")}
              <br />
              <em>{t("Another copy.", "Ещё одна копия.")}</em>
              <br />
              {t("A way back.", "Путь обратно.")}
            </h1>
            <p>
              {t(
                "Back up what matters. Know where it goes. Build a clear backup and recovery plan for your Linux server.",
                "Сохраняйте важное. Знайте, где лежат копии. Соберите понятный план бэкапа и восстановления своего Linux-сервера.",
              )}
            </p>
            <div className="hero-actions">
              <a className="button" href="#configure">
                {t("Build your backup plan", "Собрать план копирования")}
                <Icon size={18} />
              </a>
              <a className="subtle-link" href="#installation">
                {t("Installation guide", "Инструкция по установке")} ↗
              </a>
            </div>
            <div className="hero-facts">
              <span>
                <Icon name="check" size={14} />
                {t("Local configuration", "Настройка локально")}
              </span>
              <span>
                <Icon name="check" size={14} />
                {t("No account needed", "Без регистрации")}
              </span>
              <span>
                <Icon name="check" size={14} />
                Open source
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <span className="visual-cross">+</span>
            <div className="terminal-window">
              <div className="terminal-title">
                <span className="traffic">
                  <i />
                  <i />
                  <i />
                </span>
                <span>your-server ~</span>
                <Icon name="terminal" size={17} />
              </div>
              <div className="terminal-body">
                <div className="terminal-comment">
                  #{" "}
                  {t(
                    "A plan you can read. A copy you can recover.",
                    "Понятный план. Копия, которую можно восстановить.",
                  )}
                </div>
                <pre>
                  <code>
                    <span className="terminal-muted">sudo</span>{" "}
                    /opt/backfort/backfort.sh \<br />
                    -c{" "}
                    <span className="terminal-lime">
                      '/etc/backfort/config.yaml'
                    </span>{" "}
                    \<br />
                    --dry-run run --job{" "}
                    <span className="terminal-lime">'app'</span>
                  </code>
                </pre>
                <div className="terminal-plan">
                  <div>
                    <span>
                      <Icon name="folder" size={16} />
                      {t("Explicit sources", "Явные источники")}
                    </span>
                    <span>files / Compose</span>
                  </div>
                  <div>
                    <span>
                      <Icon name="cloud" size={16} />
                      {t("Independent copies", "Независимые копии")}
                    </span>
                    <span>local + rclone</span>
                  </div>
                  <div>
                    <span>
                      <Icon name="shield" size={16} />
                      {t("Recovery first", "Recovery прежде всего")}
                    </span>
                    <span>verify → restore</span>
                  </div>
                </div>
                <small>
                  {t(
                    "Example · run after installation and server preparation",
                    "Пример · после установки и подготовки сервера",
                  )}
                </small>
              </div>
            </div>
            <div className="floating-note">
              <span className="round-icon">
                <Icon name="shield" />
              </span>
              <div>
                <strong>
                  {t(
                    "A backup is a recovery plan.",
                    "Бэкап — это план восстановления.",
                  )}
                </strong>
                <small>
                  {t(
                    "Make sure you can get back.",
                    "Убедитесь, что сможете вернуться.",
                  )}
                </small>
              </div>
            </div>
          </div>
        </section>
        <div className="capability-strip wrap">
          <span>{t("ONE COMPLETE CHAIN", "ПОЛНАЯ ЦЕПОЧКА")}</span>
          <strong>{t("Explicit source", "Явный источник")}</strong>
          <i>→</i>
          <strong>{t("Bundle + checksum", "Bundle + checksum")}</strong>
          <i>→</i>
          <strong>{t("Independent copies", "Независимые копии")}</strong>
          <i>→</i>
          <strong>.complete</strong>
        </div>
        <section className="how-section wrap">
          <div>
            <span className="eyebrow">
              {t("FROM CHOICES TO RECOVERY", "ОТ НАСТРОЕК ДО RECOVERY")}
            </span>
            <h2>{t("A clearer way to back up.", "Понятный путь к копии.")}</h2>
          </div>
          {[
            [
              "01",
              t("Choose what matters", "Выберите важное"),
              t(
                "Explicit files, Compose data and database dumps.",
                "Явные файлы, данные Compose и дампы БД.",
              ),
            ],
            [
              "02",
              t("Review the whole plan", "Проверьте весь план"),
              t(
                "Readable YAML. Real commands. No hidden defaults.",
                "Читаемый YAML. Реальные команды. Видимые настройки.",
              ),
            ],
            [
              "03",
              t("Check your way back", "Проверьте путь обратно"),
              t(
                "Diagnose, dry-run, back up. Then rehearse recovery.",
                "Doctor, dry-run, backup. Затем — recovery drill.",
              ),
            ],
          ].map(([n, title, text]) => (
            <div className="how-item" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>
        <div className="version-note wrap">
          <span className="version-pill">v{upstream.version}</span>
          <p>
            {t(
              "Built against a pinned CLI contract. YAML schema 1. Configuration stays in this tab; secret values stay on your server.",
              "На основе зафиксированного CLI-контракта. YAML schema 1. Конфигурация остаётся во вкладке; секретные значения — на сервере.",
            )}
          </p>
          <a href={sourceLink("backfort.sh")}>
            {upstream.commit.slice(0, 7)} ↗
          </a>
        </div>
        <div className="wrap">
          <InstallationGuide />
          <Wizard />
          <RecoveryGuide />
          <Documentation />
          <FAQ />
        </div>
      </main>
      <footer className="site-footer wrap">
        <a className="brand" href="#overview">
          <Mark />
          <span>Backfort</span>
        </a>
        <span>
          {t("A little more peace of mind.", "Чуть больше спокойствия.")}
        </span>
        <a href={sourceLink("backfort.sh")}>
          CLI {upstream.version} · {upstream.commit.slice(0, 7)} ↗
        </a>
      </footer>
    </>
  );
}
export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const id = location.hash.slice(1);
    if (
      [
        "overview",
        "installation",
        "configure",
        "recovery",
        "reference",
        "faq",
      ].includes(id)
    )
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" }),
      );
  }, []);
  return (
    <LanguageContext value={language}>
      <Site language={language} setLanguage={setLanguage} />
    </LanguageContext>
  );
}
