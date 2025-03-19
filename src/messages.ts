import { defineExtensionMessaging } from "@webext-core/messaging"

type CodesignProtocolMap = {
	checkWSConnection(data?: unknown): Promise<{
		success: boolean
		isConnected: boolean
		error?: string
	}>

	getAnnotation: (data: {
		objectId?: string
		[key: string]: any
	}) => Promise<{
		success: boolean
		data?: any
		error?: string
	}>

	sendAnnotation: (data: unknown) => Promise<{
		success: boolean
		data?: any
		error?: string
	}>
}

const { onMessage, sendMessage } =
	defineExtensionMessaging<CodesignProtocolMap>()

export { onMessage, sendMessage }
