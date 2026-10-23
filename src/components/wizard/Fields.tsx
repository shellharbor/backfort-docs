import { useId, type ReactNode } from "react";
import { errors, useText } from "../../i18n";
import type { Issue } from "../../domain/validate";
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  hint,
  issues = [],
  field,
  options,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  hint?: string;
  issues?: Issue[];
  field?: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const id = useId();
  const t = useText();
  const found = issues.filter((i) => i.field === field);
  const attrs = {
    id,
    value: typeof value === "number" && !Number.isFinite(value) ? "" : value,
    disabled,
    "aria-invalid": !!found.length,
    "aria-describedby": id + "-hint",
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => onChange(e.target.value),
  };
  return (
    <div className={"field" + (multiline ? " full" : "")}>
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select {...attrs}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...attrs} rows={3} />
      ) : (
        <input {...attrs} type={type} autoComplete="off" spellCheck={false} />
      )}
      <div id={id + "-hint"}>
        {hint && <small>{hint}</small>}
        {found.map((issue, i) => (
          <small className="field-error" key={i}>
            {t(...errors[issue.code])}
            {issue.detail}
          </small>
        ))}
      </div>
    </div>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <label className="toggle">
      <input
        type="checkbox"
        aria-label={label}
        aria-describedby={hint ? id : undefined}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        {hint && <small id={id}>{hint}</small>}
      </span>
    </label>
  );
}
export function Group({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="field-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}
export const lines = (s: string) => (s === "" ? [] : s.split("\n"));
