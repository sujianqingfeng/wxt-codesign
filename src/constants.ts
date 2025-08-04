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
	display: block;
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

// 按钮文本常量
export const BUTTON_TEXTS = {
	GET_ANNOTATION: "获取标注数据",
	COPY_URL: "复制 URL",
	COPY: "复制",
} as const
