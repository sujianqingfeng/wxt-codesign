import { defineContentScript } from "wxt/sandbox"
import {
	ANNOTATION_BUTTON_STYLE,
	BUTTON_TEXTS,
	CLASS_NAMES,
	COPY_URL_BUTTON_STYLE,
	SELECTORS,
	SLICE_COPY_BUTTON_STYLE,
} from "../constants"
import { onMessage } from "../messages"
import { parseAnnotationData, parseSliceUrl, showToast } from "../utils"

// 创建通用按钮的函数
function createButton(
	className: string,
	text: string,
	style: string,
	clickHandler: (e: MouseEvent) => void,
): HTMLButtonElement {
	const button = document.createElement("button")
	button.className = className
	button.textContent = text
	button.style.cssText = style

	// 添加悬停效果
	button.addEventListener("mouseenter", () => {
		button.style.backgroundColor = "#f8fafc"
		button.style.borderColor = "#cbd5e1"
	})

	button.addEventListener("mouseleave", () => {
		button.style.backgroundColor = "#ffffff"
		button.style.borderColor = "#e2e8f0"
	})

	// 添加点击效果
	button.addEventListener("mousedown", () => {
		button.style.transform = "scale(0.98)"
	})

	button.addEventListener("mouseup", () => {
		button.style.transform = "scale(1)"
	})

	button.addEventListener("click", clickHandler)

	return button
}

// 处理资源列表逻辑
function handleAssetList(assetList: HTMLUListElement): void {
	console.log("Asset list found in screen inspector")

	// 为每个切片层添加复制按钮
	const sliceLayers = assetList.querySelectorAll(SELECTORS.SLICE_LAYER)
	for (const sliceLayer of sliceLayers) {
		if (!sliceLayer.querySelector(`.${CLASS_NAMES.SLICE_COPY_BUTTON}`)) {
			const copyButton = createButton(
				CLASS_NAMES.SLICE_COPY_BUTTON,
				BUTTON_TEXTS.COPY,
				SLICE_COPY_BUTTON_STYLE,
				async (e) => {
					e.preventDefault()
					e.stopPropagation()

					try {
						const imgElement = sliceLayer.querySelector(
							SELECTORS.PICTURE_IMG,
						) as HTMLImageElement | null
						if (imgElement?.src) {
							await navigator.clipboard.writeText(imgElement.src)
							showToast("图片URL已复制", "success")
						} else {
							showToast("未找到图片元素", "error")
						}
					} catch (error) {
						console.error("复制图片URL失败:", error)
						showToast("复制失败，请重试", "error")
					}
				},
			)

			sliceLayer.appendChild(copyButton)
		}
	}
}

// 处理标注数据按钮逻辑
function handleAnnotationButtons(screenInspector: Element): void {
	const copyNodes = screenInspector.querySelectorAll(SELECTORS.CSS_NODE_COPY)

	for (const copyNode of copyNodes) {
		if (
			!copyNode.previousElementSibling?.classList.contains(
				CLASS_NAMES.CUSTOM_BUTTON,
			)
		) {
			const button = createButton(
				CLASS_NAMES.CUSTOM_BUTTON,
				BUTTON_TEXTS.GET_ANNOTATION,
				ANNOTATION_BUTTON_STYLE,
				async (e) => {
					e.preventDefault()

					try {
						const annotationData = await parseAnnotationData()
						await navigator.clipboard.writeText(
							JSON.stringify(annotationData, null, 2),
						)
						showToast("复制成功！", "success")
					} catch (error) {
						console.error("Failed to copy:", error)
						showToast("复制失败，请重试", "error")
					}
				},
			)

			copyNode.parentElement?.insertBefore(button, copyNode)
		}
	}
}

// 处理复制URL按钮逻辑
function handleCopyUrlButton(screenInspector: Element): void {
	const downloadButton = screenInspector.querySelector(
		SELECTORS.DOWNLOAD_BUTTON,
	)

	if (
		downloadButton &&
		!downloadButton.previousElementSibling?.classList.contains(
			CLASS_NAMES.COPY_URL_BUTTON,
		)
	) {
		const copyUrlButton = createButton(
			CLASS_NAMES.COPY_URL_BUTTON,
			BUTTON_TEXTS.COPY_URL,
			COPY_URL_BUTTON_STYLE,
			async (e) => {
				e.preventDefault()

				const url = parseSliceUrl(screenInspector)
				if (!url) {
					showToast("无法获取URL", "error")
					return
				}

				await navigator.clipboard.writeText(url)
				showToast("复制成功！", "success")
			},
		)

		downloadButton.parentElement?.insertBefore(copyUrlButton, downloadButton)
	}
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null

	return (...args: Parameters<T>) => {
		if (timeout) {
			clearTimeout(timeout)
		}

		timeout = setTimeout(() => {
			func(...args)
		}, wait)
	}
}

// 主要的DOM变化处理函数
function handleDOMChanges(): void {
	try {
		const screenInspector = document.querySelector(SELECTORS.SCREEN_INSPECTOR)

		if (screenInspector) {
			// 处理资源列表
			const assetList = screenInspector.querySelector(
				SELECTORS.ASSET_LIST,
			) as HTMLUListElement | null
			if (assetList) {
				handleAssetList(assetList)
			}

			// 处理标注按钮
			handleAnnotationButtons(screenInspector)

			// 处理复制URL按钮
			handleCopyUrlButton(screenInspector)
		}
	} catch (error) {
		console.error("处理DOM变化时出错:", error)
	}
}

export default defineContentScript({
	matches: ["*://codesign.qq.com/app/design/*"],
	main() {
		// 使用防抖优化DOM观察
		const debouncedHandleChanges = debounce(handleDOMChanges, 100)

		// 创建观察器
		const observer = new MutationObserver(debouncedHandleChanges)

		// 开始观察DOM变化
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})

		// 初始执行一次
		handleDOMChanges()

		// 监听获取标注数据的消息
		onMessage("getAnnotation", async () => {
			console.log("🚀 ~ onMessage ~ getAnnotation:")
			try {
				const annotationData = await parseAnnotationData()
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
