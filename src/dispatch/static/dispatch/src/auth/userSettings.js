import store from "@/store"
import UserApi from "./api"
import { setLocale } from "@/i18n"

function load() {
  return UserApi.getUserInfo().then(function (response) {
    // Update the full current user data including settings
    store.commit("auth/SET_CURRENT_USER", response.data)
    if (response.data.settings?.locale) setLocale(response.data.settings.locale)
    // Also update projects for backward compatibility
    return store.commit("auth/SET_USER_PROJECTS", response.data.projects)
  })
}

export default {
  load,
}
