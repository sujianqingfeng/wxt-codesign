import { sendMessage } from "@/src/messages"
import {
	AlertCircle,
	CheckCircle,
	Info,
	RefreshCw,
	Wifi,
	WifiOff,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

// Toast interface
interface ToastProps {
	message: string
	type: "success" | "error" | "info"
	isVisible: boolean
}

// Toast component
const Toast = ({ message, type, isVisible }: ToastProps) => {
	if (!isVisible) return null

	const bgColor =
		type === "success"
			? "bg-emerald-500"
			: type === "error"
				? "bg-rose-500"
				: "bg-blue-500"

	return (
		<div
			className={`fixed top-4 right-4 left-4 ${bgColor} text-white py-3 px-4 rounded-md shadow-lg z-50 animate-fade-in-down flex items-center`}
		>
			<div className="mr-3">
				{type === "success" && <CheckCircle size={20} />}
				{type === "error" && <AlertCircle size={20} />}
				{type === "info" && <Info size={20} />}
			</div>
			<p className="text-sm font-medium">{message}</p>
		</div>
	)
}

function App() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [wsConnected, setWsConnected] = useState<boolean | null>(null)
	const [toast, setToast] = useState<ToastProps>({
		message: "",
		type: "info",
		isVisible: false,
	})

	// Show toast message
	const showToast = useCallback(
		(message: string, type: "success" | "error" | "info" = "info") => {
			setToast({
				message,
				type,
				isVisible: true,
			})

			// Auto hide after 3 seconds
			setTimeout(() => {
				setToast((prev) => ({ ...prev, isVisible: false }))
			}, 3000)
		},
		[],
	)

	// 检查 WebSocket 连接状态
	const checkWSConnection = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			// 获取codesign设计页面的标签页
			const tabs = await chrome.tabs.query({
				url: "*://codesign.qq.com/app/design/*",
				currentWindow: true,
			})

			if (tabs.length === 0) {
				setError("未找到已打开的Codesign设计页面，请先打开设计页面")
				setWsConnected(false)
				showToast("未找到已打开的Codesign设计页面", "error")
				setLoading(false)
				return
			}

			// 发送消息给 background 脚本检查 WebSocket 连接状态
			const result = await sendMessage("checkWSConnection", undefined)

			if (result.success) {
				setWsConnected(result.isConnected)

				if (result.isConnected) {
					showToast("WebSocket 已连接", "success")
				} else {
					showToast("WebSocket 未连接", "error")
				}
			} else {
				setError(result.error || "检查 WebSocket 连接失败")
				setWsConnected(false)
				showToast(result.error || "检查 WebSocket 连接失败", "error")
			}
		} catch (err) {
			console.error("检查 WebSocket 连接出错:", err)
			setError(err instanceof Error ? err.message : "发生未知错误")
			setWsConnected(false)
			showToast(err instanceof Error ? err.message : "发生未知错误", "error")
		} finally {
			setLoading(false)
		}
	}, [showToast])

	// 组件挂载时自动检查一次连接状态
	useEffect(() => {
		checkWSConnection()

		// 设置定时器每 5 秒检查一次连接状态
		const intervalId = setInterval(() => {
			checkWSConnection()
		}, 5000)

		// 组件卸载时清除定时器
		return () => {
			clearInterval(intervalId)
		}
	}, [checkWSConnection])

	return (
		<div className="max-w-xl min-w-[400px] mx-auto p-6 font-sans bg-slate-50">
			<Toast {...toast} />

			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-2 text-slate-800 text-center">
					Codesign WebSocket 状态
				</h1>
				<div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
			</div>

			<div className="flex justify-center mb-6">
				<button
					type="button"
					onClick={checkWSConnection}
					disabled={loading}
					className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-6 py-2.5 text-sm font-medium transition-colors shadow-sm ${loading ? "bg-slate-400 cursor-not-allowed" : ""} flex items-center`}
				>
					{loading ? (
						<>
							<RefreshCw size={16} className="animate-spin mr-2" />
							检查中...
						</>
					) : (
						<>
							<RefreshCw size={16} className="mr-1.5" />
							检查连接状态
						</>
					)}
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 text-sm">
					<div className="flex">
						<AlertCircle size={20} className="text-red-500 mr-2" />
						<div>
							<p className="font-medium">错误: {error}</p>
						</div>
					</div>
				</div>
			)}

			<div className="mt-6">
				<div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
					<div className="flex flex-col items-center justify-center">
						{wsConnected === null ? (
							<div className="flex flex-col items-center justify-center text-slate-500">
								<RefreshCw size={64} className="animate-spin mb-4" />
								<p className="text-lg font-medium">正在检查连接状态...</p>
							</div>
						) : wsConnected ? (
							<div className="flex flex-col items-center justify-center text-emerald-600">
								<Wifi size={64} className="mb-4" />
								<p className="text-lg font-medium">WebSocket 已连接</p>
								<p className="text-sm mt-2 text-slate-500">
									连接到 ws://localhost:3690
								</p>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center text-red-600">
								<WifiOff size={64} className="mb-4" />
								<p className="text-lg font-medium">WebSocket 未连接</p>
								<p className="text-sm mt-2 text-slate-500">
									尝试连接到 ws://localhost:3690
								</p>
								<p className="text-sm mt-4 text-slate-500">
									确保 WebSocket 服务器已启动并正在运行
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default App
