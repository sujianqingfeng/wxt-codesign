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

// 辅助函数：递归查找与 name 匹配的节点
function getAnnotationByNameHelper(
	name: string,
	nodes: AnnotationNode[],
): AnnotationNode | undefined {
	for (const node of nodes) {
		if (node.name === name) {
			return node
		}
		if (node.children) {
			const result = getAnnotationByNameHelper(name, node.children)
			if (result) {
				return result
			}
		}
	}
	return undefined
}

// 递归构建节点树
function buildNodeTree(
	parentId: string,
	allNodes: AnnotationNode[],
): AnnotationNode[] {
	const directChildren = allNodes.filter((node) => node.parent_id === parentId)

	return directChildren.map((child) => {
		const childrenOfChild = buildNodeTree(child.object_id, allNodes)
		return {
			...child,
			children: childrenOfChild.length > 0 ? childrenOfChild : undefined,
		}
	})
}

// 主函数：根据 name 和 annotationData 获取标注信息
export function getAnnotationByName(
	name: string,
	annotationData: AnnotationData,
): AnnotationNode | undefined {
	const current = getAnnotationByNameHelper(name, annotationData.nodes)
	if (!current) {
		return
	}

	const id = current.object_id

	// 递归构建完整的子节点树
	const children = buildNodeTree(id, annotationData.nodes)

	return {
		...current,
		children,
	}
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
