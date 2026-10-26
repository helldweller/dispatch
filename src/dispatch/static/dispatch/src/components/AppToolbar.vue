<template>
  <v-app-bar flat style="border-bottom: 1px solid #d2d2d2 !important" color="background0">
    <template #prepend>
      <router-link :to="{ name: 'IncidentOverview' }" style="text-decoration: none">
        <span class="button font-weight-bold">D I S P A T C H</span>
      </router-link>
    </template>
    <organization-create-edit-dialog />
    <!--<v-app-bar-nav-icon @click="handleDrawerToggle" />-->

    <v-spacer />
    <v-text-field
      v-model="queryString"
      hide-details
      prepend-inner-icon="mdi-magnify"
      :label="$t('Search')"
      clearable
      variant="solo"
      single-line
      flat
      bg-color="background2"
      @keyup.enter="performSearch()"
    />
    <v-spacer />
    <v-toolbar-items>
      <v-btn
        v-if="shouldShowSecurityEventButton"
        nav
        variant="text"
        @click="navigateToEventReport"
        class="ml-2"
        hide-details
      >
        <v-icon start color="error">mdi-shield-search</v-icon>
        <span class="text-uppercase text-body-2 font-weight-bold">{{
          $t("Report Security Event")
        }}</span>
      </v-btn>
      <v-btn icon variant="text" @click="toggleDarkTheme">
        <v-icon :icon="dark_theme ? 'mdi-white-balance-sunny' : 'mdi-moon-waxing-crescent'" />
        <v-tooltip activator="parent" location="bottom">
          {{ $t(dark_theme ? "Dark Mode Off" : "Dark Mode On") }}
        </v-tooltip>
      </v-btn>
      <v-btn icon variant="text">
        <v-icon>mdi-help-circle-outline</v-icon>
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item
              href="/api/v1/docs"
              target="_blank"
              :title="$t('API Documentation')"
              append-icon="mdi-open-in-new"
            />
            <v-list-item
              href="https://helldweller.github.io/dispatch/"
              target="_blank"
              :title="$t('App Documentation')"
              append-icon="mdi-open-in-new"
            />
            <v-list-item
              v-if="currentVersion()"
              :href="`https://github.com/Netflix/dispatch/commit/${currentVersion()}`"
              target="_blank"
              append-icon="mdi-open-in-new"
            >
              <v-list-item-title>
                {{ $t("Current version") }}: {{ formatHash(currentVersion())
                }}{{
                  currentVersionDate() && currentVersionDate() !== "Unknown"
                    ? ` (${currentVersionDate()})`
                    : ""
                }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <v-btn icon size="large" variant="text">
        <CurrentUserAvatar :size="30" />
        <v-menu activator="parent" width="400">
          <v-list class="pb-0">
            <v-list-item class="px-2">
              <template #prepend>
                <CurrentUserAvatar :size="30" />
              </template>

              <v-list-item-title class="text-h6">
                {{ currentUser().name || currentUser().email }}
              </v-list-item-title>
              <v-list-item-subtitle> {{ currentUser().email }} </v-list-item-subtitle>

              <template #append>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-btn icon="mdi-logout" variant="plain" v-bind="props" @click="logout()" />
                  </template>
                  <span>{{ $t("Logout") }}</span>
                </v-tooltip>
              </template>
            </v-list-item>
            <v-divider />
            <v-list-subheader>{{ $t("User Preferences") }}</v-list-subheader>
            <v-switch
              v-model="currentUser().experimental_features"
              inset
              class="ml-5"
              color="blue"
              @update:model-value="updateExperimentalFeatures()"
              :label="$t('Experimental Features')"
            />
            <v-switch
              v-model="bridgePreference"
              inset
              class="ml-5"
              color="blue"
              @click.stop
              :label="$t('Add me automatically to incident bridges')"
            />
            <v-list-subheader>{{ $t("Language") }}</v-list-subheader>
            <v-btn-toggle
              v-model="locale"
              mandatory
              density="compact"
              variant="outlined"
              divided
              class="mx-5 mb-3"
              @click.stop
            >
              <v-btn v-for="lang in languages" :key="lang.value" :value="lang.value" size="small">
                {{ lang.text }}
              </v-btn>
            </v-btn-toggle>
            <v-divider />
            <v-list-subheader>{{ $t("Organizations") }}</v-list-subheader>
            <v-list-item v-for="(item, i) in organizations" :key="i">
              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>

              <template #append>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      v-bind="props"
                      @click="showCreateEditDialog(item)"
                    />
                  </template>
                  <span>{{ $t("Edit Organization") }}</span>
                </v-tooltip>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      @click="switchOrganizations(item.slug)"
                      icon="mdi-swap-horizontal"
                      variant="text"
                      v-bind="props"
                    />
                  </template>
                  <span>{{ $t("Switch Organization") }}</span>
                </v-tooltip>
              </template>
            </v-list-item>
            <v-list-item @click="showCreateEditDialog()" prepend-icon="mdi-plus">
              <v-list-item-title>{{ $t("Create a new organization") }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-toolbar-items>
  </v-app-bar>
</template>
<script>
import { mapActions, mapGetters, mapMutations, mapState } from "vuex"

import Util from "@/util"
import { formatHash } from "@/filters"
import OrganizationApi from "@/organization/api"
import OrganizationCreateEditDialog from "@/organization/CreateEditDialog.vue"
import UserApi from "@/auth/api"
import CurrentUserAvatar from "@/atomics/CurrentUserAvatar.vue"
import { mapFields } from "vuex-map-fields"
import { SUPPORTED_LOCALES, setLocale } from "@/i18n"

export default {
  name: "AppToolbar",
  data: () => ({
    organizations: [],
    query: "",
    dark_theme: false,
    languages: SUPPORTED_LOCALES,
  }),
  setup() {
    return { formatHash }
  },
  components: {
    OrganizationCreateEditDialog,
    CurrentUserAvatar,
  },
  computed: {
    ...mapFields("auth", ["currentUser.projects"]),
    queryString: {
      set(query) {
        this.$store.dispatch("search/setQuery", query)
        this.query = query
      },
      get() {
        return this.$store.state.query.q
      },
    },
    bridgePreference: {
      get() {
        return this.currentUser()?.settings?.auto_add_to_incident_bridges ?? true
      },
      set(value) {
        // Call Vuex action to update settings
        this.$store
          .dispatch("auth/updateUserSettings", {
            auto_add_to_incident_bridges: value,
          })
          .then(() => {
            console.log("Bridge preference updated to:", value)
          })
          .catch((error) => {
            console.error("Error occurred while updating bridge preference: ", error)
            // Refresh user data to ensure UI is in sync with server
            this.$store.dispatch("auth/refreshCurrentUser")
          })
      },
    },
    locale: {
      get() {
        return this.$i18n.locale
      },
      set(value) {
        setLocale(value)
        this.$store.dispatch("auth/updateUserSettings", { locale: value }).catch((error) => {
          console.error("Error occurred while saving language preference: ", error)
        })
      },
    },
    defaultUserProjects() {
      if (!this.projects || this.projects.length === 0) {
        return []
      }
      return this.projects.filter((v) => v.default === true).map((v) => v.project)
    },
    shouldShowSecurityEventButton() {
      // Check if any of the default projects have the security event suggestion enabled
      return this.defaultUserProjects.some(
        (project) => project.suggest_security_event_over_incident === true,
      )
    },
  },
  methods: {
    updateExperimentalFeatures() {
      UserApi.getUserInfo()
        .then((response) => {
          let userId = response.data.id
          let newUserExperimentalFeatures = this.currentUser().experimental_features
          UserApi.update(userId, {
            id: userId,
            experimental_features: newUserExperimentalFeatures,
          })
        })
        .catch((error) => {
          console.error("Error occurred while updating experimental features: ", error)
        })
    },
    handleDrawerToggle() {
      this.$store.dispatch("app/toggleDrawer")
    },
    handleFullScreen() {
      Util.toggleFullScreen()
    },
    performSearch() {
      let query = this.query
      this.$store.dispatch("search/getResults", this.$store.state.query)
      this.$router.push({ name: "ResultList", query: { q: query } })
    },
    toggleDarkTheme() {
      const dark = !this.$vuetify.theme.current.dark
      this.$vuetify.theme.change(dark ? "dark" : "light")
      localStorage.setItem("dark_theme", dark.toString())
      this.dark_theme = !this.dark_theme
    },
    navigateToEventReport() {
      this.$router.push({ name: "eventReport" })
    },
    switchOrganizations(slug) {
      this.$router.push({ params: { organization: slug } }).then(() => {
        this.$router.go()
      })
    },
    ...mapState("auth", ["currentUser"]),
    ...mapState("app", ["currentVersion", "currentVersionDate"]),
    ...mapActions("auth", ["logout", "getExperimentalFeatures", "refreshCurrentUser"]),
    ...mapActions("search", ["setQuery"]),
    ...mapActions("organization", ["showCreateEditDialog"]),
    ...mapActions("app", ["showCommitMessage"]),
    ...mapMutations("search", ["SET_QUERY"]),
    ...mapGetters("auth", ["userAvatarUrl"]),
  },

  created() {
    this.error = null
    this.loading = "error"
    let filterOptions = {
      itemsPerPage: 50,
      sortBy: ["name"],
      descending: [false],
    }

    let theme = localStorage.getItem("dark_theme")
    if (theme) {
      if (theme === "true") {
        this.dark_theme = true
        this.$vuetify.theme.change("dark")
      } else {
        this.dark_theme = false
        this.$vuetify.theme.change("light")
      }
    }

    OrganizationApi.getAll(filterOptions).then((response) => {
      this.organizations = response.data.items
      this.loading = false
    })

    // Fetch user projects if they're not loaded
    if (!this.projects || this.projects.length === 0) {
      this.refreshCurrentUser().catch((error) => {
        console.error("Failed to refresh user projects:", error)
      })
    }

    this.getExperimentalFeatures()
  },
}
</script>
