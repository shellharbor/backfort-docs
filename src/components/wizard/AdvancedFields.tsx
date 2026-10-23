import type { Plan, Channel, ChannelType } from "../../domain/schema";
import type { Issue } from "../../domain/validate";
import { emittedEvents } from "../../data/upstream";
import { useText } from "../../i18n";
import { Field, Toggle, Group, lines } from "./Fields";
export function defaultChannel(type: ChannelType): Channel {
  const shared = { name: "ops", type };
  return {
    ...shared,
    ...{
      telegram: {
        token_env: "BACKFORT_TG_TOKEN",
        chat_id_env: "BACKFORT_TG_CHAT",
      },
      ntfy: {
        server: "https://ntfy.example.net",
        topic_env: "BACKFORT_NTFY_TOPIC",
        priority: "default",
      },
      webhook: { url_env: "BACKFORT_WEBHOOK_URL" },
      smtp: {
        host: "smtp.example.net",
        port: 587,
        tls_mode: "starttls" as const,
        username_env: "BACKFORT_SMTP_USER",
        password_env: "BACKFORT_SMTP_PASSWORD",
        to: ["ops@example.net"],
        from: "backfort@example.net",
      },
    }[type],
  };
}
export function AdvancedFields({
  p,
  update,
  issues,
}: {
  p: Plan;
  update: (f: (p: Plan) => void) => void;
  issues: Issue[];
}) {
  const t = useText();
  const c = p.config;
  const props = (field: string) => ({ issues, field });
  function channel(i: number, f: (c: Channel) => void) {
    update((p) => {
      f(p.config.notifications!.channels[i]);
    });
  }
  const labels: Record<string, string> = {
    name: t("Channel name", "Имя канала"),
    token_env: t("Token variable NAME", "ИМЯ переменной токена"),
    chat_id_env: t("Chat ID variable NAME", "ИМЯ переменной chat ID"),
    thread_id_env: t(
      "Thread ID variable (optional)",
      "Переменная thread ID (необязательно)",
    ),
    server: t(
      "HTTPS server (no credentials)",
      "HTTPS-сервер (без credentials)",
    ),
    topic_env: t("Topic variable NAME", "ИМЯ переменной topic"),
    url_env: t("URL variable NAME", "ИМЯ переменной URL"),
    headers_env: t(
      "Headers variable (optional)",
      "Переменная заголовков (необязательно)",
    ),
    host: t("SMTP host", "SMTP-сервер"),
    port: t("SMTP port", "SMTP-порт"),
    username_env: t("Username variable NAME", "ИМЯ переменной пользователя"),
    password_env: t("Password variable NAME", "ИМЯ переменной пароля"),
    to: t("Recipients, one per line", "Получатели, по одному на строку"),
    from: t("From address", "Адрес отправителя"),
  };
  return (
    <details className="advanced-details" open>
      <summary>
        {t("Advanced server settings", "Расширенные настройки сервера")}
      </summary>
      <div className="two-col">
        {(
          [
            "state_directory",
            "temp_directory",
            "lock_file",
            "min_free_mb",
          ] as const
        ).map((key) => (
          <Field
            key={key}
            label={
              {
                state_directory: t("State directory", "Каталог состояния"),
                temp_directory: t("Temporary directory", "Временный каталог"),
                lock_file: t("Lock file", "Lock-файл"),
                min_free_mb: t("Minimum free MB", "Минимум свободных МБ"),
              }[key]
            }
            value={c.settings[key]}
            type={key === "min_free_mb" ? "number" : "text"}
            onChange={(v) =>
              update((p) => {
                Object.assign(p.config.settings, {
                  [key]: key === "min_free_mb" ? Number(v) : v,
                });
              })
            }
            {...props("settings." + key)}
          />
        ))}
      </div>
      <p className="hint">
        {t(
          "512 MB is a free-space guard, not an estimate of archive size. Engine default if omitted: 0.",
          "512 МБ — порог свободного места, а не оценка размера архива. Default движка без поля: 0.",
        )}
      </p>
      <Group title={t("Monitoring", "Мониторинг")}>
        <Toggle
          label={t(
            "Configure watchdog freshness threshold",
            "Задать порог свежести watchdog",
          )}
          checked={!!c.watchdog}
          onChange={(v) =>
            update((p) => {
              if (v) p.config.watchdog = { max_age_hours: 26 };
              else delete p.config.watchdog;
            })
          }
        />
        {c.watchdog && (
          <>
            <Field
              label={t("Maximum age (hours)", "Максимальный возраст (часы)")}
              type="number"
              value={c.watchdog.max_age_hours}
              onChange={(v) =>
                update((p) => {
                  p.config.watchdog!.max_age_hours = Number(v);
                })
              }
              {...props("watchdog.max_age_hours")}
            />
            <Field
              label={t(
                "Watchdog jobs (empty = all)",
                "Watchdog jobs (пусто = все)",
              )}
              multiline
              value={c.watchdog.jobs?.join("\n") || ""}
              onChange={(v) =>
                update((p) => {
                  if (v) p.config.watchdog!.jobs = lines(v);
                  else delete p.config.watchdog!.jobs;
                })
              }
              {...props("watchdog.jobs")}
            />
          </>
        )}
        <Toggle
          label={t("Prometheus textfile output", "Prometheus textfile")}
          checked={!!c.metrics}
          onChange={(v) =>
            update((p) => {
              if (v)
                p.config.metrics = {
                  prometheus: {
                    textfile_directory:
                      "/var/lib/node_exporter/textfile_collector",
                  },
                };
              else delete p.config.metrics;
            })
          }
        />
        {c.metrics && (
          <Field
            label={t(
              "Existing writable textfile directory",
              "Существующий доступный для записи каталог",
            )}
            value={c.metrics.prometheus.textfile_directory}
            onChange={(v) =>
              update((p) => {
                p.config.metrics!.prometheus.textfile_directory = v;
              })
            }
            {...props("metrics.prometheus.textfile_directory")}
          />
        )}
        <p className="hint">
          {t(
            "Create the metrics directory separately. Freshness does not prove integrity or recovery. Watchdog is an independent command; the site installs no exporter.",
            "Каталог метрик создаётся отдельно. Свежесть не доказывает целостность или восстановимость. Watchdog — отдельная команда; сайт не устанавливает exporter.",
          )}
        </p>
      </Group>
      <Group title={t("Notifications", "Уведомления")}>
        <Toggle
          label={t(
            "Enable server notifications",
            "Включить уведомления сервера",
          )}
          checked={!!c.notifications?.enabled}
          onChange={(v) =>
            update((p) => {
              if (v)
                p.config.notifications = {
                  enabled: true,
                  defaults: {
                    events: ["failure", "partial", "recovery", "watchdog"],
                    antiflood_hours: 4,
                    digest: "off",
                  },
                  channels: [defaultChannel("telegram")],
                };
              else delete p.config.notifications;
            })
          }
        />
        {c.notifications?.enabled && (
          <>
            <div className="two-col">
              <Field
                label={t("Antiflood (hours)", "Антифлуд (часы)")}
                type="number"
                value={c.notifications.defaults.antiflood_hours}
                onChange={(v) =>
                  update((p) => {
                    p.config.notifications!.defaults.antiflood_hours =
                      Number(v);
                  })
                }
                {...props("notifications.defaults.antiflood_hours")}
              />
              <Field
                label={t("Digest", "Дайджест")}
                value={c.notifications.defaults.digest}
                options={["off", "daily"].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(v) =>
                  update((p) => {
                    p.config.notifications!.defaults.digest = v as
                      | "off"
                      | "daily";
                  })
                }
              />
            </div>
            <div className="check-grid">
              {emittedEvents.map((event) => (
                <Toggle
                  key={event}
                  label={event}
                  checked={c.notifications!.defaults.events.includes(event)}
                  onChange={(v) =>
                    update((p) => {
                      const a = p.config.notifications!.defaults.events;
                      p.config.notifications!.defaults.events = v
                        ? [...a, event]
                        : a.filter((e) => e !== event);
                    })
                  }
                />
              ))}
            </div>
            {c.notifications.channels.map((ch, i) => (
              <div className="subform" key={i}>
                <div className="subform-title">
                  {ch.type}
                  <button
                    className="text-button"
                    onClick={() =>
                      update((p) => {
                        p.config.notifications!.channels.splice(i, 1);
                      })
                    }
                  >
                    {t("Remove channel", "Удалить канал")}
                  </button>
                </div>
                <Field
                  label={t("Channel type", "Тип канала")}
                  value={ch.type}
                  options={["telegram", "ntfy", "webhook", "smtp"].map(
                    (value) => ({ value, label: value }),
                  )}
                  onChange={(v) =>
                    update((p) => {
                      p.config.notifications!.channels[i] = {
                        ...defaultChannel(v as ChannelType),
                        name: ch.name,
                      };
                    })
                  }
                />
                <div className="two-col">
                  {(
                    [
                      "name",
                      ...{
                        telegram: ["token_env", "chat_id_env", "thread_id_env"],
                        ntfy: ["server", "topic_env"],
                        webhook: ["url_env", "headers_env"],
                        smtp: [
                          "host",
                          "port",
                          "username_env",
                          "password_env",
                          "to",
                          "from",
                        ],
                      }[ch.type],
                    ] as (keyof Channel)[]
                  ).map((key) => (
                    <Field
                      key={key}
                      label={labels[key] || key}
                      value={
                        Array.isArray(ch[key])
                          ? (ch[key] as string[]).join("\n")
                          : String(ch[key] ?? "")
                      }
                      multiline={key === "to"}
                      type={key === "port" ? "number" : "text"}
                      onChange={(v) =>
                        channel(i, (ch) => {
                          if (
                            !v &&
                            ["thread_id_env", "headers_env"].includes(key)
                          )
                            delete ch[key];
                          else
                            Object.assign(ch, {
                              [key]:
                                key === "port"
                                  ? Number(v)
                                  : key === "to"
                                    ? lines(v)
                                    : v,
                            });
                        })
                      }
                      {...props(`notifications.channels.${i}.${key}`)}
                    />
                  ))}
                </div>
                {ch.type === "ntfy" && (
                  <Field
                    label={t("Priority", "Приоритет")}
                    value={ch.priority || "default"}
                    options={[
                      "min",
                      "low",
                      "default",
                      "high",
                      "max",
                      "urgent",
                    ].map((value) => ({ value, label: value }))}
                    onChange={(v) =>
                      channel(i, (ch) => {
                        ch.priority = v;
                      })
                    }
                  />
                )}{" "}
                {ch.type === "smtp" && (
                  <Field
                    label={t("TLS mode", "Режим TLS")}
                    value={ch.tls_mode || "starttls"}
                    options={["starttls", "implicit"].map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(v) =>
                      channel(i, (ch) => {
                        ch.tls_mode = v as "starttls" | "implicit";
                      })
                    }
                  />
                )}
              </div>
            ))}
            <button
              className="add-button"
              onClick={() =>
                update((p) => {
                  p.config.notifications!.channels.push({
                    ...defaultChannel("telegram"),
                    name: `ops-${c.notifications!.channels.length + 1}`,
                  });
                })
              }
            >
              + {t("Add channel", "Добавить канал")}
            </button>
          </>
        )}
        <p className="note">
          {t(
            "Delivery happens on your server and may fail without changing the backup exit code. No test sends from the browser. Only events emitted by this audited engine are offered.",
            "Уведомления отправляет сервер; сбой доставки может не изменить код выхода backup. В браузере нет тестовой отправки. Предлагаются только события, отправляемые исследованным движком.",
          )}
        </p>
      </Group>
    </details>
  );
}
