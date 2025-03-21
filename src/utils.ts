export async function fetchScreenDetailApi(designId: string, screenId: string) {
	const apiUrl = `https://codesign.qq.com/api/designs/${designId}/screens/${screenId}`

	const response = await fetch(apiUrl)
	if (!response.ok) {
		throw new Error(`API request failed with status: ${response.status}`)
	}

	const data = await response.json()

	return data
}

export async function fetchScreensApi(designId: string) {
	const apiUrl = `https://codesign.qq.com/api/designs/${designId}/screens?design_id=${designId}&per_page=100&total=1000&page=1`

	const response = await fetch(apiUrl)
	if (!response.ok) {
		throw new Error(`API request failed with status: ${response.status}`)
	}

	const data = await response.json()

	return data
}

export function parseDesignIdFromUrl(url: string) {
	const designIdMatch = url.match(/\/design\/(\d+)/)
	return designIdMatch ? designIdMatch[1] : null
}

// 定义标注节点的接口
interface AnnotationNode {
	name: string
	type: string
	object_id: string
	parent_id: string
	relativeTransform: number[][]
	absoluteTransform: number[][]
	x: number
	y: number
	width: number
	height: number
	rect: { x: number; y: number; width: number; height: number }
	realRect: { x: number; y: number; width: number; height: number }
	css: string[]
	fills: any[]
	borders: any[]
	shadows: any[]
	effects: any[]
	radius: number[]
	rotation: number
	opacity: number
	layerIndex: number
	children?: AnnotationNode[] // 可选的子节点数组
}

// 定义标注数据的接口
interface AnnotationData {
	nodes: AnnotationNode[]
}

/**
 * 清理标注节点数据，移除空数组和指定字段
 */
export function cleanAnnotationNode(node: AnnotationNode): AnnotationNode {
	const result = { ...node }

	// 要移除的特定字段列表
	const fieldsToRemove = [
		"markedForExport",
		"getCSSAsyncSupport",
		"symbolDescription",
		"symbolId",
		"symbolName",
		"componentProperties",
		"documentationLinks",
		"realRect",
	]

	// 移除指定字段
	for (const field of fieldsToRemove) {
		if (field in result) {
			delete result[field as keyof AnnotationNode]
		}
	}

	// 移除空数组字段
	for (const key of Object.keys(result)) {
		const value = result[key as keyof AnnotationNode]
		if (Array.isArray(value) && value.length === 0) {
			delete result[key as keyof AnnotationNode]
		}
	}

	// 递归处理子节点
	if (result.children && result.children.length > 0) {
		result.children = result.children.map((child) => cleanAnnotationNode(child))
	}

	return result
}

// 递归构建节点树
function buildNodeTree(
	parentId: string,
	allNodes: AnnotationNode[],
): AnnotationNode[] {
	const directChildren = allNodes.filter((node) => node.parent_id === parentId)

	return directChildren.map((child) => {
		const childrenOfChild = buildNodeTree(child.object_id, allNodes)
		// 不在这里应用清理逻辑，而是在最终返回时一次性清理整个树
		return {
			...child,
			children: childrenOfChild.length > 0 ? childrenOfChild : undefined,
		}
	})
}

export function getAnnotationByObjectId(
	objectId: string,
	annotationData: AnnotationData,
): AnnotationNode | undefined {
	const current = annotationData.nodes.find(
		(node) => node.object_id === objectId,
	)
	if (!current) {
		return
	}

	const id = current.object_id

	// 递归构建完整的子节点树
	const children = buildNodeTree(id, annotationData.nodes)

	// 清理节点数据
	return cleanAnnotationNode({
		...current,
		children,
	})
}

export function showToast(
	message: string,
	type: "success" | "error" | "info" = "success",
) {
	// Create toast container if it doesn't exist
	let toastContainer = document.getElementById("mcp-toast-container")
	if (!toastContainer) {
		toastContainer = document.createElement("div")
		toastContainer.id = "mcp-toast-container"
		toastContainer.style.cssText = `
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 10000;
		`
		document.body.appendChild(toastContainer)
	}

	// Create toast element
	const toast = document.createElement("div")
	const bgColor =
		type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#3B82F6"
	toast.style.cssText = `
		background-color: ${bgColor};
		color: white;
		padding: 12px 24px;
		border-radius: 4px;
		margin-bottom: 8px;
		font-size: 14px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.2);
		animation: slideIn 0.3s ease-out;
	`
	toast.textContent = message

	// Add animation keyframes if they don't exist
	if (!document.getElementById("mcp-toast-animations")) {
		const style = document.createElement("style")
		style.id = "mcp-toast-animations"
		style.textContent = `
			@keyframes slideIn {
				from {
					transform: translateX(100%);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
			@keyframes slideOut {
				from {
					transform: translateX(0);
					opacity: 1;
				}
				to {
					transform: translateX(100%);
					opacity: 0;
				}
			}
		`
		document.head.appendChild(style)
	}

	// Add toast to container
	toastContainer.appendChild(toast)

	// Remove toast after 3 seconds
	setTimeout(() => {
		toast.style.animation = "slideOut 0.3s ease-out"
		toast.addEventListener("animationend", () => {
			toast.remove()
			// Remove container if empty
			if (toastContainer.children.length === 0) {
				toastContainer.remove()
			}
		})
	}, 3000)
}

export function parseImageSize(str: string) {
	const pattern = /(\d+)px x (\d+)px/
	const result = pattern.exec(str)

	if (result && result.length > 2) {
		return [result[1], result[2]]
	}
	return null
}

export function parseSliceUrl(target: Element) {
	const thumbImgEl = target.querySelector(".node-box__content .thumb img")
	const slicesItemCheckEl = target.querySelector(
		".download-slices .download-slices__scales-item .t-is-checked",
	)

	if (!slicesItemCheckEl || !thumbImgEl) {
		return
	}

	const sizeTextEl = slicesItemCheckEl.querySelector(".t-checkbox__label small")
	if (!sizeTextEl) {
		return
	}

	const sizeText = sizeTextEl.textContent
	if (!sizeText) {
		return
	}

	const size = parseImageSize(sizeText)
	if (!size) {
		return
	}
	let url = (thumbImgEl as HTMLImageElement).src
	url = url.replace(/\/thumbnail\/\d+x\d+/, `/thumbnail/${size[0]}x${size[1]}`)

	return url
}

export async function parseAnnotationData() {
	const designId = parseDesignIdFromUrl(window.location.href)

	if (!designId) {
		showToast("无法获取设计ID", "error")
		return
	}

	const selectedLayerEl = document.querySelector(
		".selected.layer",
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

	const screenDetail = await fetchScreenDetailApi(designId, screenId)

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

	return annotationData
}
