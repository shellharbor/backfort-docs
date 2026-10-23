import type { Job, Encryption } from "../../domain/schema";
import type { Issue } from "../../domain/validate";
import { useText } from "../../i18n";
import { Field, Toggle, Group, lines } from "./Fields";
export function ProtectionFields({
  job,
  index,
  edit,
  advanced,
  issues,
}: {
  job: Job;
  index: number;
  edit: (f: (j: Job) => void) => void;
  advanced: boolean;
  issues: Issue[];
}) {
  const t = useText();
  const e = job.encryption;
  const base = `jobs.${index}`;
  const props = (key: string) => ({ issues, field: base + "." + key });
  const mode =
    e.method === "gpg"
      ? e.password_env
        ? "gpg-symmetric"
        : "gpg-asymmetric"
      : e.method;
  function changeEncryption(v: string) {
    edit((j) => {
      j.encryption =
        v === "none"
          ? { method: "none" }
          : v === "age"
            ? { method: "age", recipient_env: "BACKFORT_AGE_RECIPIENT" }
            : v === "gpg-symmetric"
              ? { method: "gpg", password_env: "BACKFORT_GPG_PASSWORD" }
              : { method: "gpg", recipient_env: "BACKFORT_GPG_RECIPIENT" };
    });
  }
  const envField = (key: keyof Encryption, label: string, optional = false) => (
    <Field
      label={label}
      value={String(e[key] || "")}
      onChange={(v) =>
        edit((j) => {
          if (optional && !v) delete j.encryption[key];
          else Object.assign(j.encryption, { [key]: v });
        })
      }
      {...props("encryption." + key)}
      hint={t(
        "Variable name only. Supply the value on your server.",
        "Только имя переменной. Значение задаётся на сервере.",
      )}
    />
  );
  return (
    <>
      <div className="two-col">
        <Field
          label={t("Compression", "Сжатие")}
          value={job.compression.method}
          options={["gzip", "zstd", "none"].map((value) => ({
            value,
            label: value,
          }))}
          onChange={(v) =>
            edit((j) => {
              j.compression =
                v === "none"
                  ? { method: "none" }
                  : { method: v as "gzip" | "zstd", level: 6 };
            })
          }
        />
        {job.compression.method !== "none" && (
          <Field
            label={t("Compression level", "Уровень сжатия")}
            type="number"
            value={job.compression.level || 0}
            onChange={(v) =>
              edit((j) => {
                j.compression.level = Number(v);
              })
            }
            {...props("compression.level")}
            hint={job.compression.method === "gzip" ? "1–9" : "1–19"}
          />
        )}
      </div>
      <Field
        label={t("Encryption", "Шифрование")}
        value={mode}
        options={[
          {
            value: "none",
            label: t("None — readable archive", "Нет — читаемый архив"),
          },
          { value: "age", label: "age" },
          {
            value: "gpg-symmetric",
            label: t("GPG · symmetric", "GPG · симметричное"),
          },
          {
            value: "gpg-asymmetric",
            label: t("GPG · public recipients", "GPG · публичные получатели"),
          },
        ]}
        onChange={changeEncryption}
        {...props("encryption")}
      />
      {mode === "none" ? (
        <p className="note">
          {t(
            "Copies are unencrypted. Anyone with storage access can read the payload.",
            "Копии не зашифрованы. Любой, у кого есть доступ к хранилищу, сможет прочитать данные.",
          )}
        </p>
      ) : (
        <>
          {(mode === "age" || mode === "gpg-asymmetric") && (
            <>
              <Toggle
                label={t(
                  "Multiple recipient variables",
                  "Несколько переменных получателей",
                )}
                checked={!!e.recipients_env}
                onChange={(v) =>
                  edit((j) => {
                    if (v) {
                      j.encryption.recipients_env = [
                        j.encryption.recipient_env || "BACKFORT_RECIPIENT",
                      ];
                      delete j.encryption.recipient_env;
                    } else {
                      j.encryption.recipient_env =
                        j.encryption.recipients_env?.[0] ||
                        "BACKFORT_RECIPIENT";
                      delete j.encryption.recipients_env;
                    }
                  })
                }
              />
              {e.recipients_env ? (
                <Field
                  label={t(
                    "Recipient variable NAMES",
                    "ИМЕНА переменных получателей",
                  )}
                  multiline
                  value={e.recipients_env.join("\n")}
                  onChange={(v) =>
                    edit((j) => {
                      j.encryption.recipients_env = lines(v);
                    })
                  }
                  {...props("encryption.recipients_env")}
                />
              ) : (
                envField(
                  "recipient_env",
                  t("Recipient variable NAME", "ИМЯ переменной получателя"),
                )
              )}
            </>
          )}
          {mode === "age" &&
            envField(
              "identity_file_env",
              t(
                "Recovery identity file variable (optional)",
                "Переменная пути к recovery identity (необязательно)",
              ),
              true,
            )}
          {mode === "gpg-symmetric" &&
            envField(
              "password_env",
              t("Passphrase variable NAME", "ИМЯ переменной пароля"),
            )}
          {mode === "gpg-asymmetric" && (
            <>
              {envField(
                "identity_password_env",
                t(
                  "Recovery key passphrase variable (optional)",
                  "Переменная пароля recovery-ключа (необязательно)",
                ),
                true,
              )}
              <p className="note">
                {t(
                  "Recipient values must be full 40/64-hex primary fingerprints already imported into the execution account’s GPG keyring.",
                  "Значения получателей — полные primary fingerprints 40/64 hex. Публичные ключи должны быть в GPG keyring пользователя запуска.",
                )}
              </p>
            </>
          )}
          <div className="callout">
            <strong>
              {t(
                "Keep your recovery material separately.",
                "Храните recovery-ключи отдельно.",
              )}
            </strong>
            <p>
              {t(
                "Public recipients can create backups. Full verify and restore require the private recovery key (or symmetric passphrase). Test access to it before relying on encrypted copies.",
                "Публичные получатели позволяют создавать копии. Full verify и restore требуют приватного ключа восстановления или симметричного пароля. Проверьте доступ к ним заранее.",
              )}
            </p>
          </div>
        </>
      )}
      <Group title={t("Retention policy", "Политика хранения")}>
        <p className="hint">
          {t(
            "Used by a separate prune. Run never prunes automatically. Site preset: 3 / 7 / 4 / 6; engine defaults: 3 / 0 / 0 / 0.",
            "Применяется отдельным prune. Run не удаляет копии автоматически. Пресет сайта: 3 / 7 / 4 / 6; defaults движка: 3 / 0 / 0 / 0.",
          )}
        </p>
        <div className="two-col">
          {(
            [
              "keep_last",
              "keep_daily",
              "keep_weekly",
              "keep_monthly",
              "min_keep",
            ] as const
          ).map((key) => (
            <Field
              key={key}
              label={
                {
                  keep_last: t("Latest copies", "Последние копии"),
                  keep_daily: t("UTC days", "UTC-дни"),
                  keep_weekly: t("ISO weeks", "ISO-недели"),
                  keep_monthly: t("UTC months", "UTC-месяцы"),
                  min_keep: t("Safety floor", "Минимум сохраняемых"),
                }[key]
              }
              value={job.retention[key]}
              type="number"
              onChange={(v) =>
                edit((j) => {
                  j.retention[key] = Number(v);
                })
              }
              {...props("retention." + key)}
            />
          ))}
        </div>
        {advanced && (
          <>
            <Toggle
              label={t(
                "Expire old unpinned copies",
                "Удалять старые незакреплённые копии",
              )}
              checked={job.retention.max_age_days !== undefined}
              onChange={(v) =>
                edit((j) => {
                  if (v) j.retention.max_age_days = 90;
                  else delete j.retention.max_age_days;
                })
              }
            />
            {job.retention.max_age_days !== undefined && (
              <Field
                label={t("Maximum age (days)", "Максимальный возраст (дни)")}
                value={job.retention.max_age_days}
                type="number"
                onChange={(v) =>
                  edit((j) => {
                    j.retention.max_age_days = Number(v);
                  })
                }
                {...props("retention.max_age_days")}
              />
            )}
          </>
        )}
        <p className="hint">
          {t(
            "GFS keeps the union of represented days, weeks and months. Age expiry overrides GFS, but not min_keep. Pins can grow storage without a limit.",
            "GFS сохраняет объединение дней, недель и месяцев. Возраст отменяет GFS, но не min_keep. Pins могут неограниченно увеличивать объём хранения.",
          )}
        </p>
      </Group>
      {advanced && (
        <>
          <Group title={t("Signature", "Подпись")}>
            <Toggle
              label={t("Sign with Minisign", "Подписывать через Minisign")}
              checked={job.signing.method === "minisign"}
              onChange={(v) =>
                edit((j) => {
                  j.signing = v
                    ? {
                        method: "minisign",
                        secret_key_env: "BACKFORT_MINISIGN_SECRET_KEY",
                        public_key_env: "BACKFORT_MINISIGN_PUBLIC_KEY",
                      }
                    : { method: "none" };
                })
              }
            />
            {job.signing.method === "minisign" && (
              <>
                <Field
                  label={t(
                    "Signing key file variable NAME",
                    "ИМЯ переменной пути к signing key",
                  )}
                  value={job.signing.secret_key_env || ""}
                  onChange={(v) =>
                    edit((j) => {
                      j.signing.secret_key_env = v;
                    })
                  }
                  {...props("signing.secret_key_env")}
                />
                <Field
                  label={t(
                    "Public key text variable NAME",
                    "ИМЯ переменной текста public key",
                  )}
                  value={job.signing.public_key_env || ""}
                  onChange={(v) =>
                    edit((j) => {
                      j.signing.public_key_env = v;
                    })
                  }
                  {...props("signing.public_key_env")}
                />
              </>
            )}
            <p className="hint">
              {t(
                "SHA-256 detects corruption. A trusted signature also detects substituted payloads and checksums. Protect the signing key.",
                "SHA-256 обнаруживает повреждение. Доверенная подпись также выявляет подмену payload и checksum. Защищайте signing key.",
              )}
            </p>
          </Group>
          <Group title={t("Lifecycle hooks", "Lifecycle hooks")}>
            {(["pre", "post"] as const).map((phase) => (
              <div key={phase}>
                <Toggle
                  label={
                    phase === "pre"
                      ? t("Before backup hook", "Hook перед копированием")
                      : t("Cleanup hook", "Hook очистки")
                  }
                  checked={!!job.hooks?.[phase]}
                  onChange={(v) =>
                    edit((j) => {
                      if (v) {
                        j.hooks ||= {};
                        j.hooks[phase] = {
                          path: "/usr/local/lib/backfort/hooks/application",
                          args: [],
                          timeout_seconds: 300,
                        };
                      } else if (j.hooks) delete j.hooks[phase];
                    })
                  }
                />
                {job.hooks?.[phase] && (
                  <div className="subform">
                    <Field
                      label={t(
                        "Trusted executable path",
                        "Путь к доверенному executable",
                      )}
                      value={job.hooks[phase]!.path}
                      onChange={(v) =>
                        edit((j) => {
                          j.hooks![phase]!.path = v;
                        })
                      }
                      {...props(`hooks.${phase}.path`)}
                    />
                    <Field
                      label={t(
                        "Literal arguments (one per line)",
                        "Буквальные аргументы (по одному на строку)",
                      )}
                      value={job.hooks[phase]!.args.join("\n")}
                      multiline
                      onChange={(v) =>
                        edit((j) => {
                          j.hooks![phase]!.args = lines(v);
                        })
                      }
                      {...props(`hooks.${phase}.args`)}
                    />
                    <Field
                      label={t("Timeout (seconds)", "Таймаут (сек.)")}
                      value={job.hooks[phase]!.timeout_seconds}
                      type="number"
                      onChange={(v) =>
                        edit((j) => {
                          j.hooks![phase]!.timeout_seconds = Number(v);
                        })
                      }
                      {...props(`hooks.${phase}.timeout_seconds`)}
                    />
                  </div>
                )}
              </div>
            ))}
            <p className="note">
              {t(
                "Hooks are executable paths + literal argv, never shell commands. Owner must match the execution account; no symlinks or group/other write. Post must be idempotent, including after failed pre; SIGKILL/power loss cannot guarantee cleanup. Doctor, dry-run and quick never execute hooks.",
                "Hooks — путь executable и буквальный argv, а не shell-команды. Владелец совпадает с пользователем запуска; symlink и запись для group/other запрещены. Post должен быть идемпотентным, в том числе после ошибки pre; SIGKILL и потеря питания не гарантируют очистку. Doctor, dry-run и quick hooks не исполняют.",
              )}
            </p>
          </Group>
        </>
      )}
    </>
  );
}
