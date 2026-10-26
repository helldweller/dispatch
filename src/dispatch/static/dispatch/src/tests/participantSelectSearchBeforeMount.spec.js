import { flushPromises, mount } from "@vue/test-utils"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

const getAll = vi.fn(() => Promise.resolve({ data: { items: [], total: 0 } }))
vi.mock("@/individual/api", () => ({ default: { getAll: (...args) => getAll(...args) } }))

import ParticipantSelect from "@/components/ParticipantSelect.vue"

const vuetify = createVuetify({ components, directives })

beforeEach(() => {
  vi.useFakeTimers()
  getAll.mockClear()
})
afterEach(() => vi.useRealTimers())

test("a search change before onMounted still queries individuals instead of throwing", async () => {
  const errors = []
  const onRejection = (event) => errors.push(event.reason)
  window.addEventListener("unhandledrejection", onRejection)

  // v-autocomplete syncs its search model while it mounts, which is before the
  // parent's onMounted hook: the debounced loader must already exist by then.
  const wrapper = mount(ParticipantSelect, {
    props: { modelValue: [] },
    global: { plugins: [vuetify], config: { errorHandler: (e) => errors.push(e) } },
  })
  await flushPromises()
  vi.advanceTimersByTime(300)
  await flushPromises()
  window.removeEventListener("unhandledrejection", onRejection)

  expect(errors.map(String)).toEqual([])
  expect(getAll).toHaveBeenCalled()
  wrapper.unmount()
})
