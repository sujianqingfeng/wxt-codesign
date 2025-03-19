import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
	extensionApi: "chrome",
	modules: ["@wxt-dev/module-react"],
	runner: {
		disabled: true,
	},
	outDir: "dist",
	entrypointsDir: "src/entrypoints",
	manifest: {
		name: "Codesign Screen Extractor",
		description: "Extract screen data from Codesign projects",
		permissions: ["activeTab", "tabs", "storage", "alarms"],
		host_permissions: ["*://codesign.qq.com/*"],
		background: {
			persistent: true,
		},
	},
})
