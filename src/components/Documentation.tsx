import { useText } from "../i18n";
import { registry, sourceLink, upstream } from "../data/upstream";
import { CodeBlock } from "./CodeBlock";
export function RecoveryGuide() {
  const t = useText();
  return (
    <section id="recovery" className="section recovery-section">
      <div className="section-top">
        <div>
          <span className="eyebrow">
            {t("THE OTHER HALF OF A BACKUP", "ВТОРАЯ ПОЛОВИНА BACKUP")}
          </span>
          <h2>{t("Know your way back.", "Знайте путь обратно.")}</h2>
          <p>
            {t(
              "A recovery drill is where a backup earns your trust.",
              "Пробное восстановление показывает, чего стоит копия.",
            )}
          </p>
        </div>
        <span className="round-icon">
          <span>↶</span>
        </span>
      </div>
      <div className="recovery-grid">
        <div>
          <span className="number-label">01 / VERIFY</span>
          <h3>{t("Check the complete bundle.", "Проверьте полный bundle.")}</h3>
          <p>
            {t(
              "A ready backup has a final .complete marker. Quick verify checks required artifacts, optional signature and payload checksum. Full also decrypts, decompresses and checks layout, manifest and per-file SHA-256 when present. Older bundles may lack per-file hashes.",
              "У готовой копии есть финальный .complete marker. Quick verify проверяет необходимые artifacts, подпись и checksum payload. Full также расшифровывает, распаковывает и проверяет layout, manifest и per-file SHA-256, если они есть. В старых bundles хешей файлов может не быть.",
            )}
          </p>
        </div>
        <div>
          <span className="number-label">02 / RESTORE</span>
          <h3>
            {t("Restore somewhere new.", "Восстанавливайте в новое место.")}
          </h3>
          <p>
            {t(
              "Use the generated recovery command with a new or empty target outside sources and storage. Its parent must exist and be accessible. /srv/app/uploads becomes TARGET/srv/app/uploads. Review absolute symlinks before using restored data. Ownership, ACLs, xattrs and capabilities depend on permissions and trusted content.",
              "Используйте recovery-команду с новым или пустым target вне источников и хранилищ. Parent должен существовать и быть доступным. /srv/app/uploads станет TARGET/srv/app/uploads. Проверьте абсолютные symlinks. Ownership, ACL, xattrs и capabilities зависят от прав и доверия к данным.",
            )}
          </p>
        </div>
        <div>
          <span className="number-label">03 / REHEARSE</span>
          <h3>
            {t("Check the application too.", "Проверьте само приложение.")}
          </h3>
          <p>
            {t(
              "Compose recovery stages manifests, binds, volumes and database dumps. It does not start a stack. Review them before building an isolated recovery project; separate path names alone do not isolate Docker projects or volumes. Verify the application as a separate step.",
              "Compose recovery размещает манифесты, binds, volumes и дампы. Stack не запускается. Проверьте их перед созданием изолированного recovery-проекта; разные пути сами по себе не изолируют Docker projects и volumes. Проверка приложения — отдельный шаг.",
            )}
          </p>
        </div>
      </div>
      <details className="doc-details">
        <summary>
          {t(
            "Compose imports, other hosts and recovery keys",
            "Compose imports, другие hosts и recovery-ключи",
          )}
        </summary>
        <p>
          {t(
            "restore-compose --project-dir … --apply --confirm is a separate PostgreSQL/MySQL/MariaDB import that changes the target database. It needs a new staging path every time and is incompatible with dry-run. PostgreSQL globals are a manual step. MSSQL and Oracle require vendor import; apply is unsupported if either is in the job. This site generates staging only.",
            "restore-compose --project-dir … --apply --confirm — отдельный PostgreSQL/MySQL/MariaDB import, который изменяет целевую БД. Каждый раз нужен новый staging; apply несовместим с dry-run. PostgreSQL globals импортируются вручную. Для MSSQL/Oracle нужен vendor import; apply для job с ними не поддерживается. Сайт генерирует только staging.",
          )}
        </p>
        <p>
          {t(
            "latest is scoped to settings.host_id. Recover another host deliberately using its full backup ID; do not silently change the host ID. restore --pick requires an interactive terminal. Public encryption recipients cannot decrypt: retain the private recovery material separately and test it. No force-overwrite or automatic recovery-directory deletion is generated.",
            "latest ограничен settings.host_id. Для другого host осознанно используйте полный backup ID; не меняйте ID молча. restore --pick требует интерактивного терминала. Публичные encryption recipients не расшифровывают: храните приватные recovery-ключи отдельно и проверяйте их. Force-overwrite и автоудаление recovery-каталогов не генерируются.",
          )}
        </p>
        <a
          className="doc-link"
          href={sourceLink("wiki/Restore-and-Verification.md")}
        >
          {t("Recovery contract", "Контракт восстановления")} ↗
        </a>
      </details>
    </section>
  );
}
export function Documentation() {
  const t = useText();
  return (
    <section id="reference" className="section reference-section">
      <div className="section-top">
        <div>
          <span className="eyebrow">
            {t("THE DETAILS, WITHOUT GUESSWORK", "ДЕТАЛИ БЕЗ ДОГАДОК")}
          </span>
          <h2>{t("A clear contract.", "Ясный контракт.")}</h2>
          <p>
            CLI {upstream.version} · YAML version: 1 ·{" "}
            {t("Audited", "Исследовано")} {upstream.date}
          </p>
        </div>
        <a className="doc-link" href={sourceLink("backfort.sh")}>
          {t("Read the parser", "Посмотреть parser")} ↗
        </a>
      </div>
      <details className="doc-details">
        <summary>
          {t(
            "CLI command & option reference",
            "Справочник CLI-команд и options",
          )}
        </summary>
        <p>
          {t(
            "Globals: -c FILE, -n / --dry-run, -h / --help, -V / --version. Put -c before the subcommand and job-specific options after it. --json belongs only to list and diff. Watchdog, diff, pin and unpin reject dry-run. Do not treat doctor, list, status or verify as plan operations.",
            "Глобальные: -c FILE, -n / --dry-run, -h / --help, -V / --version. -c ставится до subcommand, job-specific options — после. --json доступен только list и diff. Watchdog, diff, pin и unpin отвергают dry-run. Doctor, list, status и verify — не plan operations.",
          )}
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("Command", "Команда")}</th>
                <th>{t("Arguments & options", "Аргументы и options")}</th>
                <th>{t("Coverage", "Покрытие")}</th>
              </tr>
            </thead>
            <tbody>
              {registry.map(([name, args, coverage]) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>
                    <code>{args}</code>
                  </td>
                  <td>
                    {coverage === "docs"
                      ? t("Docs only", "В документации")
                      : coverage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t(
            "Exit 0: success. Exit 1: partial destinations with the success threshold met. Exit 2: usage, config or dependency/environment error. Exit 3: operational failure or unmet copy threshold. Some saved-job preflight failures return 3, even when doctor returns 2 for the same issue.",
            "Exit 0: успех. Exit 1: частичный успех destinations при выполненном пороге. Exit 2: ошибка CLI, config, dependencies/environment. Exit 3: operational failure или невыполненный порог копий. Некоторые preflight-ошибки saved job возвращают 3, хотя doctor для той же проблемы возвращает 2.",
          )}
        </p>
      </details>
      <details className="doc-details">
        <summary>
          {t(
            "Configuration coverage: Basic, Advanced and documentation",
            "Покрытие конфигурации: Basic, Advanced и документация",
          )}
        </summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("Capability", "Возможность")}</th>
                <th>{t("Where", "Где")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  t(
                    "Files, explicit Compose manifests/binds and PG/MySQL/MariaDB dumps",
                    "Files, явные Compose manifests/binds и дампы PG/MySQL/MariaDB",
                  ),
                  "Basic",
                ],
                [
                  t(
                    "Multiple jobs/destinations, copy threshold, compression, age and both GPG modes, GFS",
                    "Несколько jobs/destinations, порог копий, сжатие, age, оба GPG-режима, GFS",
                  ),
                  "Basic",
                ],
                [
                  t(
                    "Symlinks, volumes/helper, timeouts, MSSQL/Oracle, signing, hooks, max age",
                    "Symlinks, volumes/helper, timeouts, MSSQL/Oracle, подписи, hooks, max age",
                  ),
                  "Advanced",
                ],
                [
                  t(
                    "Server state/temp/lock/free space, notifications, watchdog and metrics",
                    "Server state/temp/lock/free space, уведомления, watchdog и метрики",
                  ),
                  "Advanced",
                ],
                [
                  t(
                    "Manual recovery, optional systemd/cron schedule",
                    "Ручное recovery, необязательное systemd/cron-расписание",
                  ),
                  "Basic",
                ],
                [
                  t(
                    "Diff, pins, delete, interactive picker, notification templates and DB apply",
                    "Diff, pins, delete, интерактивный picker, notification templates и DB apply",
                  ),
                  t("Docs only", "В документации"),
                ],
                [
                  "Python / Docker / Kubernetes",
                  t(
                    "Documentation; interactive runners outside scope",
                    "Документация; interactive runners вне scope",
                  ),
                ],
              ].map(([feature, where]) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  <td>{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t(
            "Advanced changes visibility only. Active values remain in the summary and YAML. No secret values are accepted. The server still checks permissions, symlinks, disk space, keys, credentials and Docker services.",
            "Advanced меняет только видимость полей. Активные значения остаются в сводке и YAML. Секретные значения не принимаются. Права, symlinks, disk space, ключи, credentials и Docker-сервисы проверяет сервер.",
          )}
        </p>
      </details>
      <details className="doc-details">
        <summary>
          {t(
            "Retention, pins and intentional deletion",
            "Retention, pins и осознанное удаление",
          )}
        </summary>
        <p>
          {t(
            "Prune applies retention per job and destination. It keeps the union of GFS sets over represented UTC days, ISO weeks and UTC months. max_age_days overrides GFS for old unpinned copies but respects min_keep; pins can grow storage indefinitely. Pin without --from protects completed copies of that ID across destinations. Pin reasons are single-line text up to 200 characters. Pins are runtime markers, not YAML keys.",
            "Prune применяет retention отдельно по job и destination: объединение GFS по представленным UTC-дням, ISO-неделям и UTC-месяцам. max_age_days отменяет GFS для старых unpinned copies, сохраняя min_keep. Pins могут неограниченно увеличивать storage. Pin без --from защищает completed copies ID во всех destinations. Reason — одна строка до 200 символов. Pins — runtime markers, а не YAML-ключи.",
          )}
        </p>
        <CodeBlock
          title={t(
            "Period deletion · preview example only",
            "Удаление периода · только пример preview",
          )}
          code="sudo /opt/backfort/backfort.sh -c '/etc/backfort/config.yaml' --dry-run delete --job 'app' --since '2026-09-01' --until '2026-09-30'"
        />
        <p className="note">
          {t(
            "Date boundaries are inclusive UTC dates. A real date-range delete requires --confirm and is a separate intentional action; min_keep does not apply to it, while pins remain protected. No destructive cleanup is part of installation.",
            "Границы периода включительны и заданы в UTC. Реальный date-range delete требует --confirm и отдельного осознанного действия; min_keep к нему не относится, pins защищены. Установка не включает destructive cleanup.",
          )}
        </p>
        <a
          className="doc-link"
          href={sourceLink("wiki/Retention-Pins-and-Deletion.md")}
        >
          {t(
            "Retention and deletion details",
            "Подробности хранения и удаления",
          )}{" "}
          ↗
        </a>
      </details>
      <details className="doc-details">
        <summary>
          {t(
            "Notifications, hooks and monitoring",
            "Уведомления, hooks и мониторинг",
          )}
        </summary>
        <p>
          {t(
            "Telegram, ntfy, webhook and SMTP use environment variable names. SMTP uses starttls or implicit TLS, never plaintext authentication. Daily digests flush on the first later Backfort event; this is not an independent daily scheduler. drill_failure is accepted by the validator but there is no automatic drill emitter in this commit. The UI offers the eight normal emitted events; digest is configured separately.",
            "Telegram, ntfy, webhook и SMTP используют имена env. SMTP использует starttls или implicit TLS, а не plaintext auth. Daily digest отправляется при первом следующем событии Backfort; это не независимый ежедневный scheduler. drill_failure разрешён validator, но в этом commit нет автоматического drill emitter. UI предлагает восемь обычных отправляемых событий; digest настраивается отдельно.",
          )}
        </p>
        <p>
          {t(
            "Custom text templates are documentation-only. Supported placeholders: event, job, host, id, size, duration, exit_code, destinations, failed_destinations, error, restore_hint, last_backup_age, threshold, target, pinned_count, freed. Hook executables must be owned by the execution account and protected against symlinks and group/other writes. Post cleanup must be idempotent. Prometheus output is world-readable and requires an existing writable directory; do not include secrets there. Watchdog returns 0 for fresh backups and 3 when stale or absent.",
            "Пользовательские text templates доступны через документацию. Placeholders: event, job, host, id, size, duration, exit_code, destinations, failed_destinations, error, restore_hint, last_backup_age, threshold, target, pinned_count, freed. Hook executable принадлежит пользователю запуска; symlinks и запись group/other запрещены. Post cleanup должен быть идемпотентным. Prometheus output читается всеми и требует существующего доступного каталога; секретов в нём быть не должно. Watchdog возвращает 0 для свежих копий и 3 для устаревших или отсутствующих.",
          )}
        </p>
        <div className="link-row">
          <a href={sourceLink("wiki/Automation-and-Notifications.md")}>
            {t("Automation & notifications", "Автоматизация и уведомления")} ↗
          </a>
          <a href={sourceLink("wiki/Monitoring-and-Metrics.md")}>
            {t("Monitoring & metrics", "Мониторинг и метрики")} ↗
          </a>
        </div>
      </details>
      <details className="doc-details">
        <summary>
          {t(
            "Python, Docker and Kubernetes distributions",
            "Поставки Python, Docker и Kubernetes",
          )}
        </summary>
        <p>
          {t(
            "The Python 3.11+ launcher runs the bundled Bash engine on Linux and does not install system dependencies. python -m backfort and run_backfort.py use that engine; --print-example-config is launcher-only. Use a new filename to avoid redirection overwrites. PyPI availability is not asserted here; a GitHub wheel is not evidence of an index publication. Never run a user-writable pipx/venv executable as root.",
            "Python 3.11+ launcher запускает bundled Bash engine в Linux и не устанавливает системные зависимости. python -m backfort и run_backfort.py используют тот же движок; --print-example-config есть только в launcher. Для redirect выбирайте новый файл. Здесь не заявлена проверка доступности PyPI; GitHub wheel не доказывает публикацию в index. Не запускайте user-writable pipx/venv executable от root.",
          )}
        </p>
        <p>
          {t(
            "Canonical container: ghcr.io/shellharbor/backfort. No registry digest is asserted here. Container paths require explicit mounts: config/source read-only; destination, state, temp and lock writable/persistent. Files-only does not need a Docker socket. Compose needs deliberate administrative Docker access and path mapping. Follow maintained upstream examples. Kubernetes/Helm values are a separate schema; there is no interactive runner switch.",
            "Canonical container: ghcr.io/shellharbor/backfort. Registry digest здесь не заявлен. Нужны явные mounts: config/source read-only; destination, state, temp и lock writable/persistent. Files-only не требует Docker socket. Для Compose нужны осознанный административный Docker-доступ и path mapping. Используйте поддерживаемые upstream-примеры. Kubernetes/Helm values — отдельная схема; переключателя interactive runner нет.",
          )}
        </p>
        <div className="link-row">
          <a href={sourceLink("docs/pypi.md")}>Python ↗</a>
          <a href={sourceLink("wiki/Docker-Deployment.md")}>Docker ↗</a>
          <a href={sourceLink("charts/backfort/README.md")}>Kubernetes / Helm ↗</a>
        </div>
      </details>
      <p className="source-note">
        {t(
          "Source of truth: parser and validator at the audited commit. Program version 1.3.0 and YAML schema version 1 are different.",
          "Источник истины — parser и validator исследованного commit. Версия программы 1.3.0 и YAML schema version 1 — разные сущности.",
        )}{" "}
        <a href={sourceLink("backfort.sh")}>{upstream.commit}</a>
      </p>
    </section>
  );
}
export function FAQ() {
  const t = useText();
  const items = [
    [
      t(
        "Does this website back up my server?",
        "Этот сайт делает бэкап сервера?",
      ),
      t(
        "It generates files and commands locally. It never connects over SSH, reads server files, starts Docker or uploads backups. You run the commands on Linux.",
        "Он создаёт файлы и команды локально. Не подключается по SSH, не читает серверные файлы, не запускает Docker и не загружает копии. Команды выполняете вы в Linux.",
      ),
    ],
    [
      t("Where do my secrets go?", "Куда вводить секреты?"),
      t(
        "Only on your server, for the actual execution account. The form accepts variable names, not passwords, private keys or tokens. It uses no browser storage, analytics or remote generation. Downloaded YAML still contains infrastructure paths: handle it carefully.",
        "Только на сервер, для фактического пользователя запуска. Форма принимает имена переменных, а не пароли, приватные ключи и токены. Нет browser storage, аналитики и удалённой генерации. В скачанном YAML есть инфраструктурные пути: храните его внимательно.",
      ),
    ],
    [
      t("Why a second copy?", "Зачем вторая копия?"),
      t(
        "A local archive can disappear with the server. Use an independently managed offsite destination and test recovery. Two directory paths do not establish independent disks or failure domains. min_copies is a success threshold, not an availability guarantee.",
        "Локальный архив может исчезнуть вместе с сервером. Используйте независимое offsite-хранилище и проверяйте восстановление. Два пути не доказывают разные диски и failure domains. min_copies — порог успеха, а не гарантия доступности.",
      ),
    ],
    [
      t(
        "Where is my quick recovery configuration?",
        "Где quick recovery config?",
      ),
      t(
        "With an explicit state directory, STATE/quick/NAME.yaml or STATE/quick-compose/NAME.yaml, after a real run. Otherwise XDG_STATE_HOME/backfort/quick/NAME.yaml or HOME/.local/state/backfort/quick/NAME.yaml, for the execution account. quick-compose uses the corresponding quick-compose subdirectory. Dry-run does not save it; reusing the same name may replace it.",
        "При явном state directory — STATE/quick/NAME.yaml или STATE/quick-compose/NAME.yaml после реального запуска. Иначе XDG_STATE_HOME/backfort/quick/NAME.yaml или HOME/.local/state/backfort/quick/NAME.yaml пользователя запуска. Для quick-compose — соответствующий подкаталог quick-compose. Dry-run не сохраняет файл; повторное имя может его заменить.",
      ),
    ],
    [
      t("Does run clean up old backups?", "Run удаляет старые копии?"),
      t(
        "Retention is applied by a separate prune operation. Review a dry-run preview before a real prune. Scheduling starts disabled, and any prune timer is separate.",
        "Retention применяется отдельным prune. Перед реальным prune изучите dry-run preview. Расписание изначально выключено; prune timer — отдельный.",
      ),
    ],
    [
      t(
        "Can I recover an encrypted backup without the private key?",
        "Можно восстановить шифрованную копию без private key?",
      ),
      t(
        "No. Public recipients can write backups and quick verify can check artifacts, but full verify and restore require recovery material. Keep it separately and rehearse recovery.",
        "Нет. Публичные получатели позволяют создавать копии, а quick verify проверяет artifacts. Full verify и restore требуют recovery-материал. Храните его отдельно и проверяйте восстановление.",
      ),
    ],
    [
      t("Can the browser check my server?", "Может браузер проверить сервер?"),
      t(
        "It checks structure, supported combinations and obvious path overlap. Existence, permissions, real symlink targets, free space, keys, rclone credentials and Docker availability require doctor and a recovery drill on the server.",
        "Он проверяет структуру, сочетания параметров и очевидное пересечение путей. Существование, права, реальные symlink targets, свободное место, ключи, rclone credentials и Docker проверяются doctor и recovery drill на сервере.",
      ),
    ],
  ];
  return (
    <section id="faq" className="section faq-section">
      <div>
        <span className="eyebrow">{t("GOOD TO KNOW", "ПОЛЕЗНО ЗНАТЬ")}</span>
        <h2>
          {t("Before you trust the copy.", "Прежде чем довериться копии.")}
        </h2>
        <p>
          {t(
            "A few answers for a more considered backup plan.",
            "Несколько ответов для продуманного плана копирования.",
          )}
        </p>
        <a className="doc-link" href={sourceLink("README.md")}>
          {t("Read the upstream docs", "Читать upstream-документацию")} ↗
        </a>
      </div>
      <div>
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
