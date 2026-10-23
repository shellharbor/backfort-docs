import type { Job, Database, Engine } from "../../domain/schema";
import { filesSource, composeSource, newDatabase } from "../../domain/schema";
import { useText } from "../../i18n";
import type { Issue } from "../../domain/validate";
import { Field, Toggle, Group, lines } from "./Fields";
export function SourceFields({
  job,
  index,
  edit,
  advanced,
  quick,
  issues,
}: {
  job: Job;
  index: number;
  edit: (f: (j: Job) => void) => void;
  advanced: boolean;
  quick: boolean;
  issues: Issue[];
}) {
  const t = useText();
  const s = job.source;
  const base = `jobs.${index}.source`;
  const field = (key: string) => ({ issues, field: base + "." + key });
  function dbEdit(k: number, fn: (db: Database) => void) {
    edit((j) => {
      if (j.source.type === "docker_compose") fn(j.source.databases[k]);
    });
  }
  return (
    <>
      <Field
        label={t("Job name", "Имя задания")}
        value={job.name}
        onChange={(v) =>
          edit((j) => {
            j.name = v;
          })
        }
        issues={issues}
        field={`jobs.${index}.name`}
      />
      {!quick && (
        <div className="segmented source-type">
          <button
            className={s.type === "files" ? "active" : ""}
            onClick={() =>
              edit((j) => {
                j.source = filesSource();
              })
            }
          >
            {t("Files & directories", "Файлы и каталоги")}
          </button>
          <button
            className={s.type === "docker_compose" ? "active" : ""}
            onClick={() =>
              edit((j) => {
                j.source = composeSource();
              })
            }
          >
            Docker Compose
          </button>
        </div>
      )}
      {s.type === "files" ? (
        <>
          <Field
            label={t("Source paths", "Пути источников")}
            value={s.paths.join("\n")}
            multiline
            onChange={(v) =>
              edit((j) => {
                if (j.source.type === "files") j.source.paths = lines(v);
              })
            }
            hint={t(
              "One explicit absolute Linux path per line. Example: /srv/app/uploads",
              "Один явный абсолютный Linux-путь на строку. Пример: /srv/app/uploads",
            )}
            {...field("paths")}
          />
          <Field
            label={t("Exclude patterns", "Исключения")}
            value={s.exclude.join("\n")}
            multiline
            onChange={(v) =>
              edit((j) => {
                if (j.source.type === "files") j.source.exclude = lines(v);
              })
            }
            hint={t(
              "GNU tar patterns, one per line. Example: *.log",
              "Шаблоны GNU tar, по одному на строку. Пример: *.log",
            )}
            {...field("exclude")}
          />
          <p className="note">
            {t(
              "Live database directories are not a consistent application snapshot. Use a database dump or a reviewed quiescing process.",
              "Каталог работающей БД не даёт согласованного снимка приложения. Используйте дамп или проверенную процедуру приостановки записи.",
            )}
          </p>
          {advanced && (
            <Toggle
              label={t(
                "Follow symbolic links",
                "Переходить по символическим ссылкам",
              )}
              checked={s.follow_symlinks}
              onChange={(v) =>
                edit((j) => {
                  if (j.source.type === "files") j.source.follow_symlinks = v;
                })
              }
              hint={t(
                "May include data outside the visible source tree.",
                "Может включить данные за пределами видимого дерева источника.",
              )}
            />
          )}
        </>
      ) : (
        <>
          <Field
            label={t("Compose project directory", "Каталог Compose-проекта")}
            value={s.project_dir}
            onChange={(v) =>
              edit((j) => {
                if (j.source.type === "docker_compose")
                  j.source.project_dir = v;
              })
            }
            {...field("project_dir")}
          />
          <Field
            label={t("Compose manifests", "Compose-манифесты")}
            value={s.files.join("\n")}
            multiline
            onChange={(v) =>
              edit((j) => {
                if (j.source.type === "docker_compose")
                  j.source.files = lines(v);
              })
            }
            hint={t(
              "Relative to project directory. compose.yaml is an explicit example.",
              "Относительно каталога проекта. compose.yaml — явный пример.",
            )}
            {...field("files")}
          />
          <p className="note">
            {t(
              "Only selected manifests, binds, volumes and dumps are included. .env and other files are not discovered automatically. Do not archive live DB volumes.",
              "В копию попадут только выбранные манифесты, bind-каталоги, volumes и дампы. .env и другие файлы не добавляются автоматически. Не архивируйте live DB volumes.",
            )}
          </p>
          <Group title={t("Bind mounts", "Bind-каталоги")}>
            {s.bind_mounts.map((b, k) => (
              <div className="subform" key={k}>
                <div className="two-col">
                  <Field
                    label={t("Bind name", "Имя bind")}
                    value={b.name}
                    onChange={(v) =>
                      edit((j) => {
                        if (j.source.type === "docker_compose")
                          j.source.bind_mounts[k].name = v;
                      })
                    }
                    {...field(`bind_mounts.${k}.name`)}
                  />
                  <Field
                    label={t("Relative path", "Относительный путь")}
                    value={b.path}
                    onChange={(v) =>
                      edit((j) => {
                        if (j.source.type === "docker_compose")
                          j.source.bind_mounts[k].path = v;
                      })
                    }
                    {...field(`bind_mounts.${k}.path`)}
                  />
                </div>
                <button
                  className="text-button"
                  onClick={() =>
                    edit((j) => {
                      if (j.source.type === "docker_compose")
                        j.source.bind_mounts.splice(k, 1);
                    })
                  }
                >
                  {t("Remove bind", "Удалить bind")}
                </button>
              </div>
            ))}
            <button
              className="add-button"
              onClick={() =>
                edit((j) => {
                  if (j.source.type === "docker_compose")
                    j.source.bind_mounts.push({
                      name: `uploads${s.bind_mounts.length || ""}`,
                      path: "data/uploads",
                    });
                })
              }
            >
              + {t("Add bind mount", "Добавить bind-каталог")}
            </button>
          </Group>
          <Group title={t("Database dumps", "Дампы баз данных")}>
            {s.databases.map((db, k) => (
              <div className="subform" key={k}>
                <div className="subform-title">
                  {db.name || t("Database", "База данных")}
                  <button
                    className="text-button"
                    onClick={() =>
                      edit((j) => {
                        if (j.source.type === "docker_compose")
                          j.source.databases.splice(k, 1);
                      })
                    }
                  >
                    {t("Remove", "Удалить")}
                  </button>
                </div>
                <Field
                  label={t("Engine", "Движок")}
                  value={db.engine}
                  options={(advanced && !quick
                    ? ["postgres", "mysql", "mariadb", "mssql", "oracle"]
                    : [...new Set(["postgres", "mysql", "mariadb", db.engine])]
                  ).map((value) => ({ value, label: value }))}
                  onChange={(v) =>
                    edit((j) => {
                      if (j.source.type === "docker_compose")
                        j.source.databases[k] = newDatabase(v as Engine);
                    })
                  }
                  {...field(`databases.${k}.engine`)}
                />
                <div className="two-col">
                  {(["name", "service", "user", "password_env"] as const).map(
                    (key) => (
                      <Field
                        key={key}
                        label={
                          {
                            name: t("Dump name", "Имя дампа"),
                            service: t("Compose service", "Compose-сервис"),
                            user: t("Database user", "Пользователь БД"),
                            password_env: t(
                              "Password variable NAME",
                              "ИМЯ переменной пароля",
                            ),
                          }[key]
                        }
                        value={db[key]}
                        onChange={(v) =>
                          dbEdit(k, (d) => {
                            d[key] = v;
                          })
                        }
                        {...field(`databases.${k}.${key}`)}
                      />
                    ),
                  )}
                </div>
                {db.engine === "oracle" ? (
                  <div className="two-col">
                    {(["connect", "directory", "path"] as const).map((key) => (
                      <Field
                        key={key}
                        label={key}
                        value={db[key] || ""}
                        onChange={(v) =>
                          dbEdit(k, (d) => {
                            d[key] = v;
                          })
                        }
                        {...field(`databases.${k}.${key}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <Field
                    label={t("Database names", "Имена баз данных")}
                    multiline
                    value={db.databases?.join("\n") || ""}
                    onChange={(v) =>
                      dbEdit(k, (d) => {
                        d.databases = lines(v);
                      })
                    }
                    {...field(`databases.${k}.databases`)}
                  />
                )}
                {db.engine === "postgres" &&
                  (quick ? (
                    <p className="note">
                      {t(
                        "Quick PostgreSQL dumps use plain SQL.",
                        "Quick-дампы PostgreSQL используют plain SQL.",
                      )}
                    </p>
                  ) : (
                    <>
                      <Field
                        label={t("PostgreSQL format", "Формат PostgreSQL")}
                        value={db.format || "custom"}
                        options={[
                          { value: "custom", label: "custom (.dump)" },
                          { value: "sql", label: "sql (.sql)" },
                        ]}
                        onChange={(v) =>
                          dbEdit(k, (d) => {
                            d.format = v as "sql" | "custom";
                          })
                        }
                      />
                      <Toggle
                        label={t(
                          "Include PostgreSQL globals",
                          "Включить PostgreSQL globals",
                        )}
                        checked={!!db.include_globals}
                        onChange={(v) =>
                          dbEdit(k, (d) => {
                            d.include_globals = v;
                          })
                        }
                        hint={t(
                          "Globals require a separate manual recovery step.",
                          "Globals восстанавливаются отдельным ручным шагом.",
                        )}
                      />
                    </>
                  ))}
                {db.engine === "mssql" && (
                  <Field
                    label={t(
                      "Backup directory inside container",
                      "Каталог бэкапов внутри контейнера",
                    )}
                    value={db.backup_directory || ""}
                    onChange={(v) =>
                      dbEdit(k, (d) => {
                        d.backup_directory = v;
                      })
                    }
                    {...field(`databases.${k}.backup_directory`)}
                  />
                )}
              </div>
            ))}
            <button
              className="add-button"
              onClick={() =>
                edit((j) => {
                  if (j.source.type === "docker_compose")
                    j.source.databases.push({
                      ...newDatabase(),
                      name: `app-db-${s.databases.length + 1}`,
                    });
                })
              }
            >
              + {t("Add database dump", "Добавить дамп БД")}
            </button>
          </Group>
          {advanced && (
            <>
              <Field
                label={t("Non-database volumes", "Volumes без live-БД")}
                multiline
                value={s.volumes.join("\n")}
                onChange={(v) =>
                  edit((j) => {
                    if (j.source.type === "docker_compose")
                      j.source.volumes = lines(v);
                  })
                }
                {...field("volumes")}
              />
              {s.volumes.length > 0 && (
                <Field
                  label={t(
                    "Preloaded helper image",
                    "Заранее загруженный helper-образ",
                  )}
                  value={s.volume_helper_image || ""}
                  onChange={(v) =>
                    edit((j) => {
                      if (j.source.type === "docker_compose")
                        j.source.volume_helper_image = v;
                    })
                  }
                  hint={t(
                    "Must contain tar and timeout. Backfort never pulls it. Prefer a trusted digest.",
                    "Должен содержать tar и timeout. Backfort не делает pull. Предпочтителен доверенный digest.",
                  )}
                  {...field("volume_helper_image")}
                />
              )}{" "}
              {!quick && (
                <Field
                  label={t(
                    "Compose command timeout (seconds)",
                    "Таймаут Compose-команд (сек.)",
                  )}
                  type="number"
                  value={s.command_timeout_seconds}
                  onChange={(v) =>
                    edit((j) => {
                      if (j.source.type === "docker_compose")
                        j.source.command_timeout_seconds = Number(v);
                    })
                  }
                  {...field("command_timeout_seconds")}
                />
              )}
            </>
          )}
          <p className="note">
            {t(
              "Docker Engine + Compose v2 are required on the server. DB images need dump tools and timeout. Service names and access are checked by doctor.",
              "На сервере нужны Docker Engine и Compose v2. В DB-образах нужны dump tools и timeout. Имена сервисов и доступ проверит doctor.",
            )}
          </p>
        </>
      )}
    </>
  );
}
