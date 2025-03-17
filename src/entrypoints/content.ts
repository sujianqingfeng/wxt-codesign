import { defineContentScript } from "wxt/sandbox"
import { ANNOTATION_BUTTON_STYLE, COPY_URL_BUTTON_STYLE } from "../constants"
import { onMessage } from "../messages"
import {
	fetchScreenDetailApi,
	fetchScreensApi,
	getAnnotationByObjectId,
	parseDesignIdFromUrl,
	parseSliceUrl,
	showToast,
} from "../utils"

export default defineContentScript({
	matches: ["*://codesign.qq.com/app/design/*"],
	main() {
		// Create and insert button when .screen-inspector appears
		const observer = new MutationObserver(() => {
			const screenInspector = document.querySelector(".screen-inspector")

			if (screenInspector) {
				// Add custom copy annotation data buttons
				const copyNodes = screenInspector.querySelectorAll(".css-node__copy")

				for (const copyNode of copyNodes) {
					// Check if we already added our button
					if (
						!copyNode.previousElementSibling?.classList.contains(
							"mcp-custom-button",
						)
					) {
						const button = document.createElement("button")
						button.className = "mcp-custom-button"
						button.textContent = "获取标注数据"
						button.style.cssText = ANNOTATION_BUTTON_STYLE

						// Add hover effect
						button.addEventListener("mouseenter", () => {
							button.style.backgroundColor = "#f8fafc"
							button.style.borderColor = "#cbd5e1"
						})

						button.addEventListener("mouseleave", () => {
							button.style.backgroundColor = "#ffffff"
							button.style.borderColor = "#e2e8f0"
						})

						// Add active effect
						button.addEventListener("mousedown", () => {
							button.style.transform = "scale(0.98)"
						})

						button.addEventListener("mouseup", () => {
							button.style.transform = "scale(1)"
						})

						button.addEventListener("click", async (e) => {
							e.preventDefault()
							// Empty click handler for now

							const designId = parseDesignIdFromUrl(window.location.href)

							if (!designId) {
								showToast("无法获取设计ID", "error")
								return
							}

							const selectedLayerEl = document.querySelector(
								".selected.layer.hidden-size",
							) as HTMLElement | null

							if (!selectedLayerEl) {
								showToast("无法获取选中的图层", "error")
								return
							}

							const frameName = selectedLayerEl.dataset.layerName
							const objectId = selectedLayerEl.dataset.objectId

							if (!frameName || !objectId) {
								showToast("无法获取图层信息", "error")
								return
							}

							const screenElement = document.querySelector(
								".board-screen-list__item.active",
							) as HTMLElement | null

							if (!screenElement) {
								showToast("无法获取当前屏幕", "error")
								return
							}

							const screenId = screenElement?.dataset.id
							if (!screenId) {
								showToast("无法获取当前屏幕ID", "error")
								return
							}

							const screenDetail = await fetchScreenDetailApi(
								designId,
								screenId,
							)

							const metaUrl = screenDetail?.meta_url
							if (!metaUrl) {
								showToast("无法获取当前屏幕的metaUrl", "error")
								return
							}

							const response = await fetch(metaUrl)
							const data = await response.json()

							const annotationData = getAnnotationByObjectId(objectId, {
								nodes: [...data.groups, ...data.layers],
							})

							// Copy to clipboard and show toast
							try {
								await navigator.clipboard.writeText(
									JSON.stringify(annotationData, null, 2),
								)
								showToast("复制成功！", "success")
							} catch (error) {
								console.error("Failed to copy:", error)
								showToast("复制失败，请重试", "error")
							}
						})

						copyNode.parentElement?.insertBefore(button, copyNode)
					}
				}

				// Add copy URL button above download-slices__confirm-button
				const downloadButton = screenInspector.querySelector(
					".download-slices__confirm-button",
				)

				if (
					downloadButton &&
					!downloadButton.previousElementSibling?.classList.contains(
						"mcp-copy-url-button",
					)
				) {
					const copyUrlButton = document.createElement("button")
					copyUrlButton.className = "mcp-copy-url-button"
					copyUrlButton.textContent = "复制 URL"
					copyUrlButton.style.cssText = COPY_URL_BUTTON_STYLE

					copyUrlButton.addEventListener("click", async (e) => {
						e.preventDefault()
						// Empty click handler for now
						const url = parseSliceUrl(screenInspector)
						if (!url) {
							showToast("无法获取URL", "error")
							return
						}

						await navigator.clipboard.writeText(url)
						showToast("复制成功！", "success")
					})

					downloadButton.parentElement?.insertBefore(
						copyUrlButton,
						downloadButton,
					)
				}
			}
		})

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})

		// Listen for the sync screens message from popup
		onMessage("getScreens", async () => {
			try {
				// Extract design ID from URL
				const designId = parseDesignIdFromUrl(window.location.href)

				if (!designId) {
					return {
						success: false,
						error: "Could not extract design ID from URL",
					}
				}

				const data = await fetchScreensApi(designId)

				// Process the data to combine preview_path and cdn_host for each screen
				if (data?.data && Array.isArray(data.data)) {
					for (const screen of data.data) {
						// Add a full_preview_url property by combining cdn_host and preview_path
						if (screen.cdn_host && screen.preview_path) {
							// 确保 cdn_host 以斜杠结尾或 preview_path 以斜杠开头
							const cdnHost = screen.cdn_host.endsWith("/")
								? screen.cdn_host
								: `${screen.cdn_host}/`
							const previewPath = screen.preview_path.startsWith("/")
								? screen.preview_path.substring(1)
								: screen.preview_path
							screen.full_preview_url = `${cdnHost}${previewPath}`
						}

						if (screen.meta_url) {
						}
					}
				}

				return {
					success: true,
					data: data,
					designId: designId,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				}
			}
		})
	},
})
