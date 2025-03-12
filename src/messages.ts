
import { defineExtensionMessaging } from '@webext-core/messaging';

// Define protocol map for messaging
interface CodesignProtocolMap {
  getScreens(data: unknown): Promise<{
    success: boolean;
    data?: any;
    designId?: string;
    error?: string;
  }>;


}


const { onMessage,sendMessage } = defineExtensionMessaging<CodesignProtocolMap>();


export { onMessage,sendMessage };