import { defineBackground } from 'wxt/sandbox';
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

// Create messaging system
defineExtensionMessaging<CodesignProtocolMap>();

export default defineBackground(() => {
  console.log('Codesign Screen Extractor background script initialized', { id: chrome.runtime.id });
  
  // Listen for installation
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Extension installed');
    } else if (details.reason === 'update') {
      console.log('Extension updated');
    }
  });
});
