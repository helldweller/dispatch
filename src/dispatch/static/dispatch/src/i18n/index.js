import { createI18n } from "vue-i18n"
import { en as vuetifyEn, ru as vuetifyRu } from "vuetify/locale"
import ru from "@/locales/ru.json"

// Natural keys: the English UI string is the key, `ru.json` maps it to Russian.
// English therefore needs no message file -- a missing key falls back to itself.
export const SUPPORTED_LOCALES = [
  { value: "en", text: "English" },
  { value: "ru", text: "Русский" },
]

const STORAGE_KEY = "locale"

export function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (SUPPORTED_LOCALES.some((l) => l.value === stored)) return stored
  const browser = (navigator.language || "en").split("-")[0]
  return SUPPORTED_LOCALES.some((l) => l.value === browser) ? browser : "en"
}

// Natural keys contain dots ("Loading... Please wait"), which vue-i18n would
// otherwise treat as a nested path. Look the whole key up first and only then
// walk the path, which Vuetify's own `$vuetify.x.y` keys still need.
export function resolveMessage(messages, path) {
  if (Object.prototype.hasOwnProperty.call(messages, path)) return messages[path]
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), messages)
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: "en",
  messageResolver: resolveMessage,
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: { $vuetify: vuetifyEn },
    ru: { $vuetify: vuetifyRu, ...ru },
  },
})

export function currentLocale() {
  return i18n.global.locale.value
}

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.some((l) => l.value === locale)) return
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

export default i18n
