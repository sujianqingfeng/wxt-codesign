// CSS 样式常量
export const ANNOTATION_BUTTON_STYLE = `
	margin-right: 8px;
	padding: 4px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background-color: #ffffff;
	color: #475569;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

export const COPY_URL_BUTTON_STYLE = `
	cursor: pointer;
	transition: all 0.2s ease;
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	padding: 6px 10px;
	border-radius: 2px;
	color: hsla(0, 0%, 100%, 0.9);
	background-color: #222324;
	width: 100%;
`

export const SLICE_COPY_BUTTON_STYLE = `
	margin-left: 8px;
	padding: 2px 8px;
	border: 1px solid #e2e8f0;
	border-radius: 3px;
	background-color: #ffffff;
	color: #475569;
	font-size: 11px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
`

// DOM 选择器常量
export const SELECTORS = {
	SCREEN_INSPECTOR: ".screen-inspector",
	ASSET_LIST: "ul.asset-list",
	SLICE_LAYER: "li.slice-layer",
	CSS_NODE_COPY: ".css-node__copy",
	DOWNLOAD_BUTTON: ".download-slices__confirm-button",
	PICTURE_IMG: "picture img",
} as const

// 自定义类名常量
export const CLASS_NAMES = {
	CUSTOM_BUTTON: "mcp-custom-button",
	COPY_URL_BUTTON: "mcp-copy-url-button",
	SLICE_COPY_BUTTON: "mcp-slice-copy-button",
} as const

// SVG 图标常量
export const ICONS = {
	// 获取标注数据图标 - 文档/数据图标
	ANNOTATION: `
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
			<polyline points="14 2 14 8 20 8"/>
			<line x1="16" x2="8" y1="13" y2="13"/>
			<line x1="16" x2="8" y1="17" y2="17"/>
			<polyline points="10 9 9 9 8 9"/>
		</svg>
	`,
	// 复制图标
	COPY: `
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
			<path d="m4 16c-1.1 0-2-.9-2-2v-10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
		</svg>
	`,
	// URL链接图标
	URL: `
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
		</svg>
	`,
} as const

// 按钮文本常量
export const BUTTON_TEXTS = {
	GET_ANNOTATION: "获取标注数据",
	COPY_URL: "复制 URL",
	COPY: "复制",
} as const
