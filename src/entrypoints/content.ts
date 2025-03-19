import { defineContentScript } from "wxt/sandbox"
import { ANNOTATION_BUTTON_STYLE, COPY_URL_BUTTON_STYLE } from "../constants"
import { onMessage } from "../messages"
import { parseAnnotationData, parseSliceUrl, showToast } from "../utils"

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

							const annotationData = await parseAnnotationData()
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

		// 监听获取标注数据的消息
		onMessage("getAnnotation", async () => {
			console.log("🚀 ~ onMessage ~ getAnnotation:")
			try {
				const annotationData = await parseAnnotationData()

				// 显示提示
				showToast("标注数据已发送", "success")

				return {
					success: true,
					data: annotationData,
				}
			} catch (error) {
				console.error("获取标注数据时出错:", error)
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				}
			}
		})
	},
})
