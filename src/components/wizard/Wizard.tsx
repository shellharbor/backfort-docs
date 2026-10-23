import { useMemo, useRef, useState } from "react";
import {
  initialPlan,
  applyPreset,
  newJob,
  filesSource,
  composeSource,
  removeDestination,
  type Plan,
  type Mode,
  type Preset,
} from "../../domain/schema";
import { validate } from "../../domain/validate";
import { generateYaml } from "../../domain/generateYaml";
import { generateCommands, configInstall } from "../../domain/generateCommands";
import {
  generateSchedule,
  scheduleInstallCommands,
} from "../../domain/schedule";
import {
  requiredEnv,
  prerequisites,
  activeJobs,
} from "../../domain/compatibility";
import { useText, errors } from "../../i18n";
import { Icon } from "../Icon";
import { CodeBlock, download } from "../CodeBlock";
import { Field, Toggle, Group } from "./Fields";
import { SourceFields } from "./SourceFields";
import { ProtectionFields } from "./ProtectionFields";
import { AdvancedFields } from "./AdvancedFields";
export function Wizard() {
  const t = useText();
  const [p, setP] = useState(initialPlan);
  const [step, setStep] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [jobIndex, setJobIndex] = useState(0);
  const [tab, setTab] = useState("yaml");
  const [message, setMessage] = useState<
    "quick" | "durable" | "preset" | "removed" | "reset" | ""
  >("");
  const notices = {
    quick: t(
      "Quick exports only the first job, gzip 6 and no encryption. Retention, hooks, notifications and schedule are omitted; they remain available in durable mode.",
      "Quick экспортирует только первое задание: gzip 6 без шифрования. Retention, hooks, уведомления и расписание исключены; они доступны в постоянном режиме.",
    ),
    durable: t(
      "Durable settings are active again. Review sources and protection before export.",
      "Постоянные настройки снова активны. Перед экспортом проверьте источники и защиту.",
    ),
    preset: t(
      "Preset loaded with EXAMPLE paths and names. Review every source and destination before running. Host ID was kept.",
      "Пресет заполнен ПРИМЕРАМИ путей и имён. Проверьте каждый источник и хранилище. Host ID сохранён.",
    ),
    removed: t(
      "Destination removed from every job. Review each minimum-copies threshold.",
      "Хранилище удалено из всех jobs. Проверьте каждый порог min_copies.",
    ),
    reset: t("Configuration reset.", "Конфигурация сброшена."),
  };
  const heading = useRef<HTMLHeadingElement>(null);
  const issues = useMemo(() => validate(p), [p]);
  const valid = issues.length === 0;
  const job = p.config.jobs[jobIndex] || p.config.jobs[0];
  const commands = useMemo(
    () => (valid ? generateCommands(p) : null),
    [p, valid],
  );
  const yaml = useMemo(
    () => (valid && p.mode === "durable" ? generateYaml(p) : ""),
    [p, valid],
  );
  const env = requiredEnv(p);
  const schedules = useMemo(
    () => (valid ? generateSchedule(p) : {}),
    [p, valid],
  );
  const steps = [
    t("The plan", "План"),
    t("Sources", "Источники"),
    t("Destinations", "Хранилища"),
    t("Protection", "Защита"),
    t("Your configuration", "Конфигурация"),
  ];
  const titles = [
    t(
      "A little planning. A lot of peace of mind.",
      "Немного настроек. Больше спокойствия.",
    ),
    t("What deserves a backup?", "Что нужно сохранить?"),
    t("Give your data another home.", "Ещё один дом для ваших данных."),
    t("Make it yours. Keep it safe.", "Настройте защиту и хранение."),
    t("Your plan, ready for the server.", "План готов к проверке на сервере."),
  ];
  function update(fn: (p: Plan) => void) {
    setP((old) => {
      const next = structuredClone(old);
      fn(next);
      return next;
    });
  }
  function edit(fn: (j: typeof job) => void) {
    update((p) => {
      const old = p.config.jobs[jobIndex].name;
      fn(p.config.jobs[jobIndex]);
      const name = p.config.jobs[jobIndex].name;
      if (p.job === old) p.job = name;
      if (p.config.watchdog?.jobs)
        p.config.watchdog.jobs = p.config.watchdog.jobs.map((v) =>
          v === old ? name : v,
        );
    });
  }
  function go(next: number) {
    setStep(next);
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  }
  function mode(next: Mode) {
    update((p) => {
      p.mode = next;
      if (next !== "durable") {
        p.job = p.config.jobs[0].name;
        if (next === "quick" && p.config.jobs[0].source.type !== "files")
          p.config.jobs[0].source = filesSource();
        if (
          next === "quick-compose" &&
          p.config.jobs[0].source.type !== "docker_compose"
        )
          p.config.jobs[0].source = composeSource();
      }
    });
    setJobIndex(0);
    setMessage(next === "durable" ? "durable" : "quick");
  }
  function preset(value: Preset) {
    setP((old) => applyPreset(old, value));
    setJobIndex(0);
    setMessage("preset");
  }
  const issueStep = (field: string) =>
    field.startsWith("destinations") ||
    field.includes("success") ||
    field.includes(".destinations")
      ? 2
      : field.includes(".source") || field.includes(".name")
        ? 1
        : field.includes("encryption") ||
            field.includes("compression") ||
            field.includes("retention") ||
            field.includes("hooks") ||
            field.includes("signing")
          ? 3
          : 4;
  return (
    <section id="configure" className="wizard-section section">
      <div className="section-top">
        <div>
          <span className="eyebrow">
            {t("THE CONFIGURATOR", "МАСТЕР НАСТРОЙКИ")}{" "}
            <span className="pale">01 — 05</span>
          </span>
          <h2>{t("Your data. Your rules.", "Ваши данные. Ваши правила.")}</h2>
          <p>
            {t(
              "Five steps to a backup plan you can understand.",
              "Пять шагов к понятному плану резервного копирования.",
            )}
          </p>
        </div>
        <div
          className="segmented"
          aria-label={t("Configuration detail", "Уровень настроек")}
        >
          <button
            onClick={() => setAdvanced(false)}
            className={!advanced ? "active" : ""}
            aria-pressed={!advanced}
          >
            Basic
          </button>
          <button
            onClick={() => setAdvanced(true)}
            className={advanced ? "active" : ""}
            aria-pressed={advanced}
          >
            Advanced
          </button>
        </div>
      </div>
      <div className="wizard-shell">
        <nav
          className="step-nav"
          aria-label={t("Configuration steps", "Шаги настройки")}
        >
          <ol>
            {steps.map((name, i) => (
              <li key={i}>
                <button
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => go(i)}
                >
                  <span className="step-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{name}</span>
                  {i < step && <Icon name="check" size={14} />}
                </button>
              </li>
            ))}
          </ol>
          <div className="local-note">
            <Icon name="shield" size={23} />
            <strong>
              {t("Built in your browser.", "Создаётся в браузере.")}
            </strong>
            <p>
              {t(
                "No sign-in. No server connection. No secret values.",
                "Без регистрации, подключения к серверу и секретных значений.",
              )}
            </p>
          </div>
        </nav>
        <div className="wizard-panel">
          <div className="step-caption">
            <span>
              {t("STEP", "ШАГ")} {step + 1} / 5
            </span>
            <span>
              {t("Configuration progress", "Прогресс настройки")}{" "}
              {Math.round(((step + 1) / 5) * 100)}%
            </span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${(step + 1) * 20}%` }} />
          </div>
          <h3 tabIndex={-1} ref={heading}>
            {titles[step]}
          </h3>
          {message && (
            <p className="notice" role="status">
              {notices[message]}
            </p>
          )}
          {step === 0 && (
            <>
              <div className="choice-grid">
                {(
                  [
                    {
                      mode: "durable",
                      icon: "folder",
                      title: t("A lasting backup plan", "Постоянные копии"),
                      text: t(
                        "YAML jobs, encryption, retention.",
                        "YAML, шифрование, хранение.",
                      ),
                    },
                    {
                      mode: "quick",
                      icon: "clock",
                      title: t("Quick files backup", "Разовая копия файлов"),
                      text: t(
                        "One-time, explicit file sources.",
                        "Разовая копия явных файлов.",
                      ),
                    },
                    {
                      mode: "quick-compose",
                      icon: "terminal",
                      title: t("Quick Compose backup", "Разовая копия Compose"),
                      text: t(
                        "Manifests, data and DB dumps.",
                        "Манифесты, данные, дампы БД.",
                      ),
                    },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.mode}
                    className={
                      "choice " + (p.mode === c.mode ? "selected" : "")
                    }
                    aria-pressed={p.mode === c.mode}
                    onClick={() => mode(c.mode)}
                  >
                    <Icon name={c.icon} />
                    <strong>{c.title}</strong>
                    <small>{c.text}</small>
                  </button>
                ))}
              </div>
              <Group title={t("Start with a preset", "Начните с пресета")}>
                <div className="preset-grid">
                  {(
                    [
                      {
                        id: "local",
                        name: t("Files → local", "Файлы → локально"),
                        desc: t("One local copy", "Одна локальная копия"),
                      },
                      {
                        id: "offsite",
                        name: t("Local + offsite", "Локально + offsite"),
                        desc: t("Two copies · rclone", "Две копии · rclone"),
                      },
                      {
                        id: "encrypted",
                        name: t("Encrypted offsite", "Шифрованный offsite"),
                        desc: "age · rclone",
                      },
                      {
                        id: "compose",
                        name: "Compose + PostgreSQL",
                        desc: t(
                          "Explicit dump, no live volume",
                          "Явный дамп, без live volume",
                        ),
                      },
                      {
                        id: "upgrade",
                        name: t("Before an upgrade", "Перед обновлением"),
                        desc: t("Quick files · gzip 6", "Quick files · gzip 6"),
                      },
                    ] as const
                  ).map((c) => (
                    <button key={c.id} onClick={() => preset(c.id)}>
                      <strong>{c.name}</strong>
                      <small>{c.desc}</small>
                      <span>↗</span>
                    </button>
                  ))}
                </div>
                <p className="hint">
                  {t(
                    "Presets replace the form with visible examples. Choose real paths in the next steps.",
                    "Пресеты заменяют форму видимыми примерами. Укажите реальные пути на следующих шагах.",
                  )}
                </p>
              </Group>
              {p.mode === "durable" && (
                <Field
                  label={t("Stable host ID", "Постоянный host ID")}
                  value={p.config.settings.host_id}
                  onChange={(v) =>
                    update((p) => {
                      p.config.settings.host_id = v;
                    })
                  }
                  issues={issues}
                  field="settings.host_id"
                  hint={t(
                    "Example: web-01. Keep it stable: latest and automatic operations are scoped to this host.",
                    "Пример: web-01. Сохраняйте ID: latest и автоматические операции ограничены этим host.",
                  )}
                />
              )}
              <p className="note">
                {t(
                  "The Bash CLI runs on Linux. This page creates configuration and commands locally; you run them on your own server.",
                  "Bash CLI запускается в Linux. Страница создаёт конфигурацию и команды локально; вы выполняете их на своём сервере.",
                )}
              </p>
            </>
          )}
          {(step === 1 || step === 3) && p.mode === "durable" && (
            <div className="job-bar">
              <div className="job-tabs" aria-label={t("Jobs", "Задания")}>
                {p.config.jobs.map((j, i) => (
                  <button
                    key={i}
                    aria-pressed={i === jobIndex}
                    className={i === jobIndex ? "active" : ""}
                    onClick={() => setJobIndex(i)}
                  >
                    {j.name || t("Unnamed", "Без имени")}
                  </button>
                ))}
              </div>
              <button
                className="text-button"
                onClick={() => {
                  update((p) => {
                    let n = p.config.jobs.length + 1;
                    while (p.config.jobs.some((j) => j.name === `job-${n}`))
                      n++;
                    p.config.jobs.push({
                      ...newJob(`job-${n}`),
                      destinations: p.config.destinations
                        .slice(0, 1)
                        .map((d) => d.name),
                    });
                  });
                  setJobIndex(p.config.jobs.length);
                }}
              >
                {t("+ Add job", "+ Добавить job")}
              </button>
              {p.config.jobs.length > 1 && (
                <button
                  className="text-button danger"
                  onClick={() => {
                    update((p) => {
                      const [removed] = p.config.jobs.splice(jobIndex, 1);
                      if (p.job === removed.name) p.job = p.config.jobs[0].name;
                      if (p.config.watchdog?.jobs)
                        p.config.watchdog.jobs = p.config.watchdog.jobs.filter(
                          (n) => n !== removed.name,
                        );
                    });
                    setJobIndex(0);
                  }}
                >
                  {t("Remove job", "Удалить job")}
                </button>
              )}
            </div>
          )}
          {step === 1 && (
            <SourceFields
              job={job}
              index={jobIndex}
              edit={edit}
              advanced={advanced}
              quick={p.mode !== "durable"}
              issues={issues}
            />
          )}
          {step === 2 && (
            <>
              <p className="panel-intro">
                {t(
                  "A second destination is another copy. Physical independence is something you verify.",
                  "Второе хранилище — ещё одна копия. Физическую независимость проверяете вы.",
                )}
              </p>
              {p.config.destinations.map((d, i) => (
                <div className="subform" key={i}>
                  <div className="subform-title">
                    <span>
                      {String(i + 1).padStart(2, "0")} / {d.name}
                    </span>
                    <button
                      className="text-button danger"
                      onClick={() => {
                        setP((p) => removeDestination(p, i));
                        setMessage("removed");
                      }}
                    >
                      {t("Remove destination", "Удалить хранилище")}
                    </button>
                  </div>
                  <div className="two-col">
                    <Field
                      label={t("Destination name", "Имя хранилища")}
                      value={d.name}
                      onChange={(v) =>
                        update((p) => {
                          const old = p.config.destinations[i].name;
                          p.config.destinations[i].name = v;
                          p.config.jobs.forEach((j) => {
                            j.destinations = j.destinations.map((n) =>
                              n === old ? v : n,
                            );
                          });
                        })
                      }
                      issues={issues}
                      field={`destinations.${i}.name`}
                    />
                    <Field
                      label={t("Storage type", "Тип хранилища")}
                      value={d.type}
                      options={[
                        {
                          value: "local",
                          label: t("Local directory", "Локальный каталог"),
                        },
                        { value: "rclone", label: "rclone remote" },
                      ]}
                      onChange={(v) =>
                        update((p) => {
                          p.config.destinations[i] =
                            v === "local"
                              ? {
                                  name: d.name,
                                  type: "local",
                                  path: "/var/backups/backfort",
                                }
                              : {
                                  name: d.name,
                                  type: "rclone",
                                  remote: "company-s3",
                                  path: "backups-bucket/backfort/web-01",
                                };
                        })
                      }
                    />
                  </div>
                  {d.type === "rclone" && (
                    <Field
                      label={t(
                        "Configured rclone remote name",
                        "Имя настроенного rclone remote",
                      )}
                      value={d.remote || ""}
                      onChange={(v) =>
                        update((p) => {
                          p.config.destinations[i].remote = v;
                        })
                      }
                      issues={issues}
                      field={`destinations.${i}.remote`}
                    />
                  )}
                  <Field
                    label={
                      d.type === "local"
                        ? t(
                            "Absolute destination path",
                            "Абсолютный путь хранилища",
                          )
                        : t(
                            "Path relative to remote",
                            "Путь относительно remote",
                          )
                    }
                    value={d.path}
                    onChange={(v) =>
                      update((p) => {
                        p.config.destinations[i].path = v;
                      })
                    }
                    issues={issues}
                    field={`destinations.${i}.path`}
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  update((p) => {
                    let i = p.config.destinations.length + 1;
                    while (
                      p.config.destinations.some((d) => d.name === `copy-${i}`)
                    )
                      i++;
                    p.config.destinations.push({
                      name: `copy-${i}`,
                      type: "rclone",
                      remote: "company-s3",
                      path: "backups-bucket/backfort/web-01",
                    });
                  })
                }
              >
                + {t("Add destination", "Добавить хранилище")}
              </button>
              {activeJobs(p).map((j, i) => (
                <Group
                  key={i}
                  title={`${t("Copies for", "Копии для")} ${j.name}`}
                >
                  <div className="check-grid">
                    {p.config.destinations.map((d) => (
                      <Toggle
                        key={d.name}
                        label={d.name}
                        checked={j.destinations.includes(d.name)}
                        onChange={(v) =>
                          update((p) => {
                            p.config.jobs[i].destinations = v
                              ? [...j.destinations, d.name]
                              : j.destinations.filter((n) => n !== d.name);
                          })
                        }
                      />
                    ))}
                  </div>
                  <Field
                    label={t(
                      "Minimum successful copies",
                      "Минимум успешных копий",
                    )}
                    value={j.success.min_copies}
                    type="number"
                    onChange={(v) =>
                      update((p) => {
                        p.config.jobs[i].success.min_copies = Number(v);
                      })
                    }
                    issues={issues}
                    field={`jobs.${i}.success.min_copies`}
                  />
                </Group>
              ))}
              {p.config.destinations.some((d) => d.type === "rclone") ? (
                <div className="callout">
                  <strong>rclone config</strong>
                  <p>
                    {t(
                      "Configure the remote as the Backfort execution account. Provide RCLONE_CONFIG as a protected server path when needed. Under sudo, your interactive account’s configuration is not automatically available. S3/R2/Spaces/FTP/Dropbox are rclone configurations, not additional Backfort types.",
                      "Настройте remote от пользователя запуска Backfort. При необходимости передайте RCLONE_CONFIG с защищённым серверным путём. При sudo настройки интерактивного пользователя не появляются автоматически. S3/R2/Spaces/FTP/Dropbox — настройки rclone, а не типы Backfort.",
                    )}
                  </p>
                </div>
              ) : (
                <p className="note">
                  {t(
                    "A single local copy shares the server’s failure risks. Consider a separate offsite destination.",
                    "Одна локальная копия разделяет риски сервера. Рассмотрите отдельное offsite-хранилище.",
                  )}
                </p>
              )}
            </>
          )}
          {step === 3 &&
            (p.mode === "durable" ? (
              <ProtectionFields
                job={job}
                index={jobIndex}
                edit={edit}
                advanced={advanced}
                issues={issues}
              />
            ) : (
              <div className="callout">
                <Icon name="lock" />
                <h4>{t("Quick stays simple.", "Quick остаётся простым.")}</h4>
                <p>
                  {t(
                    "gzip level 6 · encryption none · no signing, hooks or custom retention. For protection controls, choose a lasting YAML backup plan. PostgreSQL quick dumps use plain SQL.",
                    "gzip level 6 · без шифрования, подписи, hooks и собственной retention. Для настройки защиты выберите постоянный YAML-план. Quick-дампы PostgreSQL используют plain SQL.",
                  )}
                </p>
                <Field
                  label={t("Quick state directory", "Каталог состояния quick")}
                  value={p.quickState}
                  onChange={(v) =>
                    update((p) => {
                      p.quickState = v;
                    })
                  }
                  issues={issues}
                  field="quickState"
                />
              </div>
            ))}
          {step === 4 && (
            <>
              <Field
                label={t("Job for commands", "Задание для команд")}
                value={p.job}
                options={[
                  ...p.config.jobs
                    .slice(0, p.mode === "durable" ? undefined : 1)
                    .map((j) => ({ value: j.name, label: j.name })),
                  ...(p.mode === "durable"
                    ? [
                        {
                          value: "",
                          label: t(
                            "All jobs (run / doctor / list / status / prune)",
                            "Все jobs (run / doctor / list / status / prune)",
                          ),
                        },
                      ]
                    : []),
                ]}
                onChange={(v) =>
                  update((p) => {
                    p.job = v;
                  })
                }
              />
              {!p.job && (
                <p className="hint">
                  {t(
                    "Verify and recovery below explicitly use the first job. Choose a job to recover another one.",
                    "Verify и recovery ниже явно используют первое задание. Для другого восстановления выберите job.",
                  )}
                </p>
              )}
              {p.mode === "durable" ? (
                <Field
                  label={t(
                    "Server configuration path",
                    "Путь конфигурации на сервере",
                  )}
                  value={p.configPath}
                  onChange={(v) =>
                    update((p) => {
                      p.configPath = v;
                    })
                  }
                  issues={issues}
                  field="configPath"
                />
              ) : (
                <Field
                  label={t("Quick state directory", "Каталог состояния quick")}
                  value={p.quickState}
                  onChange={(v) =>
                    update((p) => {
                      p.quickState = v;
                    })
                  }
                  issues={issues}
                  field="quickState"
                />
              )}
              <Field
                label={t(
                  "New or empty recovery target",
                  "Новый или пустой recovery-каталог",
                )}
                value={p.restorePath}
                onChange={(v) =>
                  update((p) => {
                    p.restorePath = v;
                  })
                }
                issues={issues}
                field="restorePath"
                hint={t(
                  "Parent must already exist and be accessible. Never use an original source or a filled staging directory.",
                  "Parent должен существовать и быть доступным. Не используйте исходник или заполненный staging.",
                )}
              />
              {advanced && p.mode === "durable" && (
                <AdvancedFields p={p} update={update} issues={issues} />
              )}
              {p.mode === "durable" && (
                <Group
                  title={t("Optional schedule", "Необязательное расписание")}
                >
                  <Field
                    label={t("Scheduling", "Расписание")}
                    value={p.schedule.kind}
                    options={[
                      {
                        value: "none",
                        label: t(
                          "Off — manual commands",
                          "Выключено — ручной запуск",
                        ),
                      },
                      { value: "systemd", label: "systemd timer" },
                      { value: "cron", label: "/etc/cron.d" },
                    ]}
                    onChange={(v) =>
                      update((p) => {
                        p.schedule.kind = v as Plan["schedule"]["kind"];
                      })
                    }
                  />
                  {p.schedule.kind !== "none" && (
                    <>
                      <div className="two-col">
                        <Field
                          label={t("Server time", "Время сервера")}
                          value={p.schedule.time}
                          type="time"
                          onChange={(v) =>
                            update((p) => {
                              p.schedule.time = v;
                            })
                          }
                        />
                        <Field
                          label={t("IANA timezone", "IANA timezone")}
                          value={p.schedule.timezone}
                          onChange={(v) =>
                            update((p) => {
                              p.schedule.timezone = v;
                            })
                          }
                        />
                        <Field
                          label={t("Execution account", "Пользователь запуска")}
                          value={p.schedule.account}
                          onChange={(v) =>
                            update((p) => {
                              p.schedule.account = v;
                            })
                          }
                        />
                      </div>
                      {p.schedule.kind === "systemd" && (
                        <>
                          <Field
                            label={t(
                              "Randomized delay (seconds)",
                              "Случайная задержка (сек.)",
                            )}
                            value={p.schedule.delay}
                            type="number"
                            onChange={(v) =>
                              update((p) => {
                                p.schedule.delay = Number(v);
                              })
                            }
                            issues={issues}
                            field="schedule.delay"
                          />
                          <Toggle
                            label="Persistent=true"
                            checked={p.schedule.persistent}
                            onChange={(v) =>
                              update((p) => {
                                p.schedule.persistent = v;
                              })
                            }
                            hint={t(
                              "Catch up a missed run after the machine returns.",
                              "Выполнить пропущенный запуск после включения сервера.",
                            )}
                          />
                          <Toggle
                            label={t(
                              "Prepare a separate prune timer",
                              "Подготовить отдельный prune timer",
                            )}
                            checked={p.schedule.prune}
                            onChange={(v) =>
                              update((p) => {
                                p.schedule.prune = v;
                              })
                            }
                            hint={t(
                              "Six hours after backup. Review prune preview first; both timers remain disabled until you enable them.",
                              "Через шесть часов после backup. Сначала проверьте prune preview; оба таймера выключены до вашего enable.",
                            )}
                          />
                        </>
                      )}
                      <p className="note">
                        {t(
                          "Enable scheduling only after a manual backup and recovery drill. Shared locks reject overlap; they do not queue jobs. Browser time does not control server scheduling. Check CRON_TZ support for cron.",
                          "Включайте расписание после ручного backup и recovery drill. Общий lock отклоняет пересечение, а не ставит задания в очередь. Время браузера не управляет сервером. Для cron проверьте поддержку CRON_TZ.",
                        )}
                      </p>
                    </>
                  )}
                </Group>
              )}
              <Group
                title={t(
                  "Server prerequisites for this plan",
                  "Требования сервера для этого плана",
                )}
              >
                <p className="hint">{prerequisites(p).join(" · ")}</p>
              </Group>
              {env.length > 0 && (
                <div className="callout">
                  <strong>
                    {t(
                      "Prepare these environment variable names",
                      "Подготовьте эти имена переменных окружения",
                    )}
                  </strong>
                  <p className="env-list">{env.join(" · ")}</p>
                  <p>
                    {t(
                      "Supply values on the server to the actual execution account. A normal export before sudo does not guarantee delivery. Use a protected root-owned /etc/backfort/backfort.env for systemd EnvironmentFile; create it manually without overwriting an existing file. Keep permissions 0600 and private keys offline. Identity file and identity passphrase variables are recovery-only: a public-recipient writer does not need private recovery keys.",
                      "Задайте значения на сервере для фактического пользователя запуска. Обычный export перед sudo не гарантирует передачу. Для systemd используйте защищённый root-owned /etc/backfort/backfort.env через EnvironmentFile; создайте вручную без перезаписи существующего файла. Права 0600, приватные ключи — отдельно. Identity file и identity passphrase нужны для recovery: серверу записи с публичными получателями не нужны приватные ключи восстановления.",
                    )}
                  </p>
                  <button
                    className="text-button"
                    onClick={() =>
                      download(
                        "# Variable names only. Supply values securely on the server.\n" +
                          env.map((n) => "# " + n).join("\n") +
                          "\n",
                        "required-environment.txt",
                      )
                    }
                  >
                    {t("Download variable names", "Скачать имена переменных")}
                  </button>
                </div>
              )}
              {valid && commands && (
                <>
                  <div className="ready-banner">
                    <Icon name="check" />
                    <div>
                      <strong>
                        {t(
                          "Ready for checks on your server.",
                          "Готово к проверке на сервере.",
                        )}
                      </strong>
                      <small>
                        {t(
                          "Browser validation cannot check files, permissions, storage, keys or services.",
                          "Браузер не проверяет файлы, права, хранилища, ключи и сервисы.",
                        )}
                      </small>
                    </div>
                  </div>
                  {p.mode === "durable" ? (
                    <>
                      <h4>
                        {t(
                          "1. Transfer and install the YAML",
                          "1. Перенесите и установите YAML",
                        )}
                      </h4>
                      <p className="hint">
                        {t(
                          "Download backfort.yaml from the preview. Transfer it to the server’s current directory using your chosen method. These commands refuse an existing config. For upgrades, preserve the old file separately and review the diff.",
                          "Скачайте backfort.yaml из предпросмотра. Перенесите в текущий каталог сервера удобным способом. Эти команды откажутся перезаписывать config. При обновлении отдельно сохраните прежний файл и проверьте изменения.",
                        )}
                      </p>
                      <CodeBlock
                        title={t(
                          "Install config · on server",
                          "Установка config · на сервере",
                        )}
                        code={configInstall(p)}
                      />
                    </>
                  ) : (
                    <p className="notice">
                      {t(
                        "A real quick run writes the recovery config below; dry-run does not. Preserve a previous config before reusing the same quick name. The host ID depends on the execution account’s server environment; BACKFORT_QUICK_HOST_ID overrides its host component.",
                        "Реальный quick-запуск сохранит recovery config ниже; dry-run не сохраняет его. Перед повторным quick name сохраните прежний config. Host ID зависит от окружения сервера; BACKFORT_QUICK_HOST_ID переопределяет host-компонент.",
                      )}{" "}
                      <code>{commands.recoveryConfig}</code>
                    </p>
                  )}
                  <h4>{t("2. Check the plan", "2. Проверьте план")}</h4>
                  <CodeBlock
                    title={t(
                      "Diagnostics · no real backup",
                      "Диагностика · без реального backup",
                    )}
                    code={commands.diagnostics}
                  />
                  <details className="result-details">
                    <summary>
                      {t(
                        "3. Real backup — after reviewing sources and diagnostics",
                        "3. Реальный backup — после проверки источников и диагностики",
                      )}
                    </summary>
                    <p className="hint">
                      {t(
                        "This command writes a real copy. Review the complete source summary and destination list first.",
                        "Эта команда создаёт реальную копию. Сначала проверьте полную сводку источников и хранилищ.",
                      )}
                    </p>
                    <CodeBlock
                      title={t(
                        "Run on your Linux server",
                        "Запустите на своём Linux-сервере",
                      )}
                      code={commands.run}
                    />
                  </details>
                  <details className="result-details">
                    <summary>
                      {t(
                        "4. Inspect, fully verify and rehearse recovery",
                        "4. Просмотр, full verify и пробное восстановление",
                      )}
                    </summary>
                    <CodeBlock title="list / status" code={commands.inspect} />
                    <CodeBlock title="verify · full" code={commands.verify} />
                    <p className="hint">
                      {t(
                        "Full verification requires recovery keys for encrypted data. Restore stages into a new or empty directory; create its parent separately. Files retain their absolute hierarchy inside the target. Compose stages compose/, bind-mounts/, volumes/ and databases/ without apply or starting services.",
                        "Для full verify шифрованных данных нужны recovery-ключи. Restore выполняется в новый или пустой каталог; parent создайте отдельно. Файлы сохраняют абсолютную иерархию внутри target. Compose размещает compose/, bind-mounts/, volumes/ и databases/ без apply и запуска сервисов.",
                      )}
                    </p>
                    <CodeBlock
                      title="restore · staging"
                      code={commands.restore}
                    />
                  </details>
                  {p.mode === "durable" && (
                    <details className="result-details">
                      <summary>
                        {t(
                          "Retention preview · separate from backup",
                          "Предпросмотр retention · отдельно от backup",
                        )}
                      </summary>
                      <CodeBlock
                        title="prune · dry-run"
                        code={commands.prune}
                      />
                      <p className="hint">
                        {t(
                          "Review the preview. A real prune is a separate deliberate server action.",
                          "Проверьте preview. Реальный prune — отдельное осознанное действие на сервере.",
                        )}
                      </p>
                    </details>
                  )}
                  {Object.keys(schedules).length > 0 && (
                    <details className="result-details">
                      <summary>
                        {t(
                          "Schedule files · review before enabling",
                          "Файлы расписания · проверьте перед включением",
                        )}
                      </summary>
                      {Object.entries(schedules).map(([name, code]) => (
                        <CodeBlock
                          key={name}
                          title={name}
                          filename={name}
                          code={code}
                        />
                      ))}
                      <CodeBlock
                        title={t(
                          "Install reviewed schedule files · refuses existing files",
                          "Установить проверенные файлы · без перезаписи",
                        )}
                        code={scheduleInstallCommands(p)}
                      />
                      {p.schedule.kind === "systemd" && (
                        <CodeBlock
                          title={t(
                            "Enable backup timer · only after successful recovery drill",
                            "Включить backup timer · после успешного recovery drill",
                          )}
                          code={
                            "sudo systemctl daemon-reload\nsudo systemctl enable --now backfort.timer"
                          }
                        />
                      )}
                      {p.schedule.kind === "systemd" && p.schedule.prune && (
                        <CodeBlock
                          title={t(
                            "Enable prune separately · after reviewing prune preview",
                            "Включить prune отдельно · после проверки preview",
                          )}
                          code={
                            "sudo systemctl enable --now backfort-prune.timer"
                          }
                        />
                      )}
                      <p className="hint">
                        {t(
                          "Install service/timer files root-owned in /etc/systemd/system. After manual recovery succeeds: daemon-reload, then explicitly enable the desired timer. Inspect logs and exit 1 partial results. For cron, install the file at /etc/cron.d/backfort and confirm timezone support, log permissions and systemd-run availability if environment delivery is needed.",
                          "Установите service/timer root-owned в /etc/systemd/system. После успешного ручного восстановления выполните daemon-reload и явно enable нужного таймера. Проверяйте логи и частичный exit 1. Для cron установите файл в /etc/cron.d/backfort и проверьте timezone, права логов и systemd-run для передачи env.",
                        )}
                      </p>
                    </details>
                  )}
                </>
              )}
            </>
          )}
          {issues.length > 0 &&
            (step === 4 || issues.some((i) => issueStep(i.field) === step)) && (
              <div className="error-summary" role="status">
                <strong>
                  {t(
                    "Complete the plan before exporting.",
                    "Заполните план перед экспортом.",
                  )}
                </strong>
                {issues
                  .filter((i) => step === 4 || issueStep(i.field) === step)
                  .map((issue, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setStep(issueStep(issue.field));
                        const match = issue.field.match(/^jobs\.(\d+)/);
                        if (match) setJobIndex(Number(match[1]));
                      }}
                    >
                      <code>{issue.field}</code> — {t(...errors[issue.code])}
                      {issue.detail}
                    </button>
                  ))}
              </div>
            )}
          <div className="wizard-actions">
            <button
              className="text-button"
              disabled={step === 0}
              onClick={() => go(step - 1)}
            >
              ← {t("Back", "Назад")}
            </button>
            <span>
              {t(
                "Your choices stay in this tab.",
                "Настройки остаются в этой вкладке.",
              )}
            </span>
            {step < 4 ? (
              <button className="button" onClick={() => go(step + 1)}>
                {t("Continue", "Продолжить")}
                <Icon size={17} />
              </button>
            ) : (
              <button
                className="button"
                disabled={!valid || p.mode !== "durable"}
                onClick={() => download(yaml, "backfort.yaml")}
              >
                <Icon name="download" size={16} />
                {t("Download YAML", "Скачать YAML")}
              </button>
            )}
          </div>
        </div>
        <aside className="preview">
          <div className="preview-heading">
            <span className="eyebrow">
              {t("YOUR BACKUP PLAN", "ВАШ ПЛАН КОПИРОВАНИЯ")}
            </span>
            <Icon name="shield" />
          </div>
          <h4>{p.mode === "durable" ? p.config.settings.host_id : job.name}</h4>
          <p className="preview-mode">
            {p.mode === "durable"
              ? t("Durable YAML configuration", "Постоянная YAML-конфигурация")
              : p.mode}
          </p>
          <div className="summary-list">
            {activeJobs(p).map((j, i) => (
              <div key={i}>
                <strong>{j.name}</strong>
                <small>
                  {j.source.type === "files"
                    ? j.source.paths.join(" · ") ||
                      t("Choose source paths", "Укажите пути источников")
                    : [
                        j.source.project_dir,
                        ...j.source.files,
                        ...j.source.bind_mounts.map((b) => b.path),
                        ...j.source.volumes,
                        ...j.source.databases.map(
                          (d) =>
                            `${d.engine}: ${d.databases?.join(",") || d.connect}`,
                        ),
                      ].join(" · ")}
                </small>
                <small>
                  →{" "}
                  {j.destinations
                    .map((n) => {
                      const d = p.config.destinations.find((d) => d.name === n);
                      return d
                        ? `${n}: ${d.type === "rclone" ? d.remote + ":" : ""}${d.path}`
                        : n;
                    })
                    .join(" · ")}
                </small>
                <div className="chips">
                  <span>
                    {j.success.min_copies}{" "}
                    {t("required copies", "нужных копий")}
                  </span>
                  <span>
                    {p.mode === "durable" ? j.compression.method : "gzip 6"}
                  </span>
                  <span>
                    {p.mode === "durable"
                      ? j.encryption.method
                      : t("unencrypted", "без шифрования")}
                  </span>
                  {p.mode === "durable" && j.signing.method !== "none" && (
                    <span>minisign</span>
                  )}
                  {p.mode === "durable" &&
                    j.hooks &&
                    Object.keys(j.hooks).length > 0 && (
                      <span>hooks: {Object.keys(j.hooks).join(", ")}</span>
                    )}
                  {j.source.type === "files" && j.source.follow_symlinks && (
                    <span>{t("Follow symlinks", "Переход по symlinks")}</span>
                  )}
                  {p.mode === "durable" && j.retention.max_age_days && (
                    <span>{j.retention.max_age_days}d max age</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="summary-meta">
            {p.mode === "durable" && (
              <>
                <span>
                  GFS {job.retention.keep_last}/{job.retention.keep_daily}/
                  {job.retention.keep_weekly}/{job.retention.keep_monthly} · min{" "}
                  {job.retention.min_keep}
                </span>
                {p.config.watchdog && (
                  <span>Watchdog {p.config.watchdog.max_age_hours}h</span>
                )}
                {p.config.metrics && <span>Prometheus</span>}
                {p.config.notifications?.enabled && (
                  <span>
                    {t("Notifications", "Уведомления")}:{" "}
                    {p.config.notifications.channels
                      .map((c) => c.type)
                      .join(", ")}
                  </span>
                )}
                <span>
                  {t("Schedule", "Расписание")}:{" "}
                  {p.schedule.kind === "none"
                    ? t("off", "выкл.")
                    : p.schedule.kind +
                      " " +
                      p.schedule.time +
                      " " +
                      p.schedule.timezone}
                </span>
              </>
            )}
          </div>
          <div className="preview-tabs">
            <button
              onClick={() => setTab("yaml")}
              className={tab === "yaml" ? "active" : ""}
            >
              YAML
            </button>
            <button
              onClick={() => setTab("commands")}
              className={tab === "commands" ? "active" : ""}
            >
              {t("Commands", "Команды")}
            </button>
          </div>
          {valid ? (
            tab === "yaml" ? (
              p.mode === "durable" ? (
                <CodeBlock
                  title="backfort.yaml"
                  filename="backfort.yaml"
                  code={yaml}
                />
              ) : (
                <p className="preview-placeholder">
                  {t(
                    "Backfort writes the quick recovery YAML on the server after a real run.",
                    "Backfort сохранит quick recovery YAML на сервере после реального запуска.",
                  )}
                  <code>{commands?.recoveryConfig}</code>
                </p>
              )
            ) : (
              <CodeBlock
                title={t("Diagnostics preview", "Предпросмотр диагностики")}
                code={commands!.diagnostics}
              />
            )
          ) : (
            <div className="preview-placeholder">
              <Icon name="terminal" size={25} />
              <strong>
                {t("Your plan is taking shape.", "Ваш план обретает форму.")}
              </strong>
              <p>
                {t(
                  "Add sources and resolve the fields below. Executable output appears only when the plan is valid.",
                  "Добавьте источники и исправьте поля. Команды появятся после успешной проверки плана.",
                )}
              </p>
              <span>
                {issues.length} {t("items to review", "пунктов для проверки")}
              </span>
            </div>
          )}
          <div className="preview-foot">
            <span className={"status-dot " + (valid ? "ready" : "")} />
            {valid
              ? t(
                  "Browser checks passed · check server next",
                  "Проверено в браузере · далее сервер",
                )
              : t("Configuration incomplete", "Конфигурация не заполнена")}
          </div>
        </aside>
      </div>
      <div className="wizard-footer">
        <span>
          <Icon name="lock" size={14} />
          {t(
            "No analytics or browser storage. Refresh clears the form.",
            "Без аналитики и browser storage. Обновление страницы очистит форму.",
          )}
        </span>
        <button
          className="text-button"
          onClick={() => {
            setP(initialPlan());
            setJobIndex(0);
            setStep(0);
            setMessage("reset");
          }}
        >
          {t("Reset configuration", "Сбросить настройки")}
        </button>
      </div>
    </section>
  );
}
