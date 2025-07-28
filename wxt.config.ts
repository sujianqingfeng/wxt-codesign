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
		name: "Codesign Annotated Extractor",
		description: "Extract annotated data from Codesign",
		permissions: ["tabs", "alarms"],
		host_permissions: ["*://codesign.qq.com/*"],
		background: {
			persistent: true,
		},
	},
})
