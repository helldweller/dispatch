import { config } from "@vue/test-utils"
import i18n from "@/i18n"

// Components call $t(); install vue-i18n globally so specs need no per-mount plugin.
config.global.plugins.push(i18n)

// happy-dom implements neither window.visualViewport nor ResizeObserver;
// Vuetify's overlay positioning code requires both, so every test that opens
// a menu or dialog crashes without these stubs.
class VisualViewportStub extends EventTarget {
  constructor() {
    super()
    this.width = 1920
    this.height = 1080
    this.offsetLeft = 0
    this.offsetTop = 0
    this.pageLeft = 0
    this.pageTop = 0
    this.scale = 1
  }
}

if (!globalThis.visualViewport) {
  globalThis.visualViewport = new VisualViewportStub()
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
