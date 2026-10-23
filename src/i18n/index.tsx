import { createContext, useContext } from "react";
import type { Issue } from "../domain/validate";
export type Language = "en" | "ru";
export const LanguageContext = createContext<Language>("en");
export function useText() {
  const lang = useContext(LanguageContext);
  return (en: string, ru: string) => (lang === "en" ? en : ru);
}
export const errors: Record<Issue["code"], [string, string]> = {
  required: ["Add at least one value.", "Добавьте хотя бы одно значение."],
  identifier: [
    "Use letters, numbers, dots, dashes or underscores; start with a letter or number.",
    "Используйте латиницу, цифры, точки, дефисы и подчёркивания. Начните с буквы или цифры.",
  ],
  env: [
    "Enter a variable NAME, such as BACKFORT_DB_PASSWORD. Do not enter a secret value.",
    "Введите ИМЯ переменной, например BACKFORT_DB_PASSWORD. Не вводите секретное значение.",
  ],
  absolute: [
    "Use an absolute Linux path other than /, without control characters or . / .. components.",
    "Нужен абсолютный Linux-путь, кроме /, без управляющих символов и компонентов . / ...",
  ],
  relative: [
    "Use a relative path without a leading / or . / .. components.",
    "Нужен относительный путь без начального / и компонентов . / ...",
  ],
  duplicate: [
    "This name, reference or storage target is already used. Choose a different one.",
    "Это имя, ссылка или место хранения уже используется. Выберите другое.",
  ],
  range: [
    "Enter a whole number in this range: ",
    "Введите целое число в диапазоне: ",
  ],
  reference: [
    "Choose an existing job or destination.",
    "Выберите существующее задание или хранилище.",
  ],
  overlap: [
    "Source, working storage and recovery paths must be separate. Conflicting path: ",
    "Источники, рабочие и recovery-каталоги должны быть раздельными. Конфликт: ",
  ],
  incompatible: [
    "This combination is not supported. Review the selected mode and its fields.",
    "Эта комбинация не поддерживается. Проверьте выбранный режим и его поля.",
  ],
  unknown: [
    "An unknown configuration key was found.",
    "Обнаружен неизвестный ключ конфигурации.",
  ],
  schedule: [
    "Check time, account and IANA timezone. This schedule builder does not support %, $, quotes, backticks or backslashes in command paths.",
    "Проверьте время, пользователя и IANA timezone. Мастер расписания не поддерживает %, $, кавычки, обратные кавычки и обратный слеш в путях команды.",
  ],
  text: [
    "Use a valid single-line value without control characters or credentials in URLs.",
    "Нужно допустимое однострочное значение без управляющих символов и секретов в URL.",
  ],
};
