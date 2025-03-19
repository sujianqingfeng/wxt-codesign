import { defineBackground } from "wxt/sandbox"
import { onMessage, sendMessage } from "../messages"

// 创建WebSocket连接
let socket: WebSocket | null = null
let reconnectInterval: ReturnType<typeof setInterval> | null = null
let isConnected = false

// 连接WebSocket服务器
function connectWebSocket() {
	// 关闭之前的连接
	if (socket) {
		socket.close()
	}

	// 创建新连接
	socket = new WebSocket("ws://localhost:3690")

	// 连接打开时
	socket.onopen = () => {
		console.log("WebSocket连接已建立")
		isConnected = true

		// 发送初始连接消息
		if (socket) {
			socket.send(
				JSON.stringify({
					type: "connect",
					data: {
						clientType: "browser-extension",
						version: "1.0.0",
					},
				}),
			)
		}

		// 连接成功后清除重连定时器
		if (reconnectInterval) {
			clearInterval(reconnectInterval)
			reconnectInterval = null
		}
	}

	// 接收消息
	socket.onmessage = (event) => {
		const message = JSON.parse(event.data)
		console.log("收到服务器消息:", message)

		// 处理不同类型的消息
		if (message.type === "getAnnotation") {
			handleGetAnnotationRequest(message)
		}
	}

	// 连接关闭
	socket.onclose = () => {
		console.log("WebSocket连接已关闭")
		isConnected = false

		// 设置重连
		if (!reconnectInterval) {
			reconnectInterval = setInterval(connectWebSocket, 5000)
		}
	}

	// 连接错误
	socket.onerror = (error) => {
		console.error("WebSocket连接错误:", error)
		isConnected = false
	}
}

// 处理获取标注请求
async function handleGetAnnotationRequest(message: any) {
	try {
		// 从内容脚本获取标注数据 - 仅查询codesign设计页面的标签页
		const tabs = await chrome.tabs.query({
			url: "*://codesign.qq.com/app/design/*",
			currentWindow: true,
		})
		console.log("🚀 ~ handleGetAnnotationRequest ~ tabs:", tabs)

		if (tabs.length > 0 && tabs[0].id !== undefined) {
			try {
				// 使用 @webext-core/messaging 发送消息到内容脚本并等待响应
				const response = await sendMessage(
					"getAnnotation",
					message.data || {},
					tabs[0].id,
				)

				// 处理内容脚本返回的标注数据
				if (response.success && response.data) {
					// 向WebSocket服务器发送标注数据
					sendAnnotationDataToServer(response.data)
				} else {
					console.error("获取标注数据失败:", response.error)
					// 发送错误响应给服务器
					sendErrorToServer(response.error || "未知错误")
				}
			} catch (error: any) {
				console.error("与内容脚本通信失败:", error)
				sendErrorToServer(error.message || "通信失败")
			}
		} else {
			console.error("未找到codesign设计页面的标签页")
			sendErrorToServer("未找到codesign设计页面的标签页，请确保已打开设计页面")
		}
	} catch (error: any) {
		console.error("查询标签页失败:", error)
		sendErrorToServer(`查询标签页失败: ${error.message || String(error)}`)
	}
}

// 发送标注数据到服务器
function sendAnnotationDataToServer(annotationData: any) {
	if (socket && isConnected) {
		socket.send(
			JSON.stringify({
				type: "annotation",
				data: annotationData,
			}),
		)
	} else {
		console.error("WebSocket未连接，无法发送标注数据")
	}
}

// 发送错误信息到服务器
function sendErrorToServer(errorMessage: string) {
	if (socket && isConnected) {
		socket.send(
			JSON.stringify({
				type: "error",
				error: errorMessage,
			}),
		)
	} else {
		console.error("WebSocket未连接，无法发送错误信息")
	}
}

export default defineBackground(() => {
	console.log("Codesign Screen Extractor background script initialized", {
		id: chrome.runtime.id,
	})

	// 初始连接
	connectWebSocket()

	// 添加检查WebSocket连接状态的消息处理程序
	onMessage("checkWSConnection", async () => {
		try {
			return {
				success: true,
				isConnected: isConnected,
			}
		} catch (error: any) {
			return {
				success: false,
				isConnected: false,
				error: error.message || "检查WebSocket连接状态时发生错误",
			}
		}
	})
})
