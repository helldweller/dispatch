import { describe, expect, it } from "vitest"

import i18n, { resolveMessage, setLocale } from "@/i18n"

describe("i18n", () => {
  it("resolves natural keys with dots before walking nested paths", () => {
    const messages = { "Loading... Please wait": "Загрузка", $vuetify: { close: "Закрыть" } }
    expect(resolveMessage(messages, "Loading... Please wait")).toBe("Загрузка")
    expect(resolveMessage(messages, "$vuetify.close")).toBe("Закрыть")
    expect(resolveMessage(messages, "missing.key")).toBeUndefined()
  })

  it("falls back to the English key and switches Vuetify strings with the app", () => {
    setLocale("ru")
    expect(i18n.global.t("Incidents")).toBe("Инциденты")
    expect(i18n.global.t("Untranslated string")).toBe("Untranslated string")
    expect(i18n.global.t("$vuetify.close")).toBe("Закрыть")
    expect(localStorage.getItem("locale")).toBe("ru")

    setLocale("en")
    expect(i18n.global.t("Incidents")).toBe("Incidents")
    expect(i18n.global.t("$vuetify.close")).toBe("Close")

    setLocale("xx")
    expect(i18n.global.locale.value).toBe("en")
  })
})
