import { useState, useEffect } from 'react';
import { storage } from '@wxt-dev/storage';
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Copy, 
  ArrowLeft, 
  AlertCircle,
  Monitor,
  FileText,
  Image as ImageIcon,
  X,
  ZoomIn,
  Clock
} from 'lucide-react';
import { sendMessage } from '@/src/messages';

// Define screen data interface
interface Screen {
  id: string;
  name: string;
  thumbnail_url: string;
  meta_url?: string;
  preview_path?: string;
  cdn_host?: string;
  full_preview_url?: string;
  [key: string]: any;
}

// Toast interface
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

// Toast component
const Toast = ({ message, type, isVisible }: ToastProps) => {
  if (!isVisible) return null;
  
  const bgColor = type === 'success' 
    ? 'bg-emerald-500' 
    : type === 'error' 
      ? 'bg-rose-500' 
      : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 left-4 ${bgColor} text-white py-3 px-4 rounded-md shadow-lg z-50 animate-fade-in-down flex items-center`}>
      <div className="mr-3">
        {type === 'success' && <CheckCircle size={20} />}
        {type === 'error' && <XCircle size={20} />}
        {type === 'info' && <Info size={20} />}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

// Function to clean JSON data by removing empty fields
function cleanJsonData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data
      .map(item => cleanJsonData(item))
      .filter(item => item !== null && item !== undefined);
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      const cleanedValue = cleanJsonData(data[key]);
      
      // Only include non-empty values
      if (
        cleanedValue !== null && 
        cleanedValue !== undefined && 
        cleanedValue !== '' &&
        !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
        !(typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0)
      ) {
        result[key] = cleanedValue;
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }
  
  return data;
}

// Image Preview Modal interface
interface ImagePreviewProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

// Image Preview Modal component
const ImagePreview = ({ imageUrl, alt, isOpen, onClose }: ImagePreviewProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div className="relative max-w-full max-h-full">
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X size={24} />
        </button>
        <img 
          src={imageUrl} 
          alt={alt} 
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-xl" 
        />
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [designId, setDesignId] = useState<string | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [toast, setToast] = useState<ToastProps>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{url: string; alt: string} | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Load screens data from storage when popup opens
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        setIsLoadingFromStorage(true);
        
        // Get the current active tab to get the design ID
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab || !activeTab.url || !activeTab.url.includes('codesign.qq.com/app/design/')) {
          setError('Please navigate to a Codesign design page first');
          setIsLoadingFromStorage(false);
          return;
        }
        
        // Extract design ID from URL
        const designIdMatch = activeTab.url.match(/\/design\/(\d+)/);
        const currentDesignId = designIdMatch ? designIdMatch[1] : null;
        
        if (!currentDesignId) {
          setError('Could not extract design ID from URL');
          setIsLoadingFromStorage(false);
          return;
        }
        
        // Try to load data for this specific design ID
        const storageKey = `session:codesign_screens_${currentDesignId}` as const;
        const storedData = await storage.getItem<{
          screens: Screen[];
          timestamp: string;
        }>(storageKey);
        
        if (storedData && storedData.screens && storedData.screens.length > 0) {
          console.log('Loaded screens data from storage:', storedData);
          setScreens(storedData.screens);
          setDesignId(currentDesignId);
          setLastSyncTime(storedData.timestamp || null);
          showToast(`Loaded ${storedData.screens.length} screens from cache`, 'info');
        } else {
          console.log('No stored data found for this design');
          // If no stored data, we'll wait for user to click sync
        }
      } catch (err) {
        console.error('Error loading from storage:', err);
      } finally {
        setIsLoadingFromStorage(false);
      }
    };
    
    loadFromStorage();
  }, []);

  const syncScreens = async () => {
    setLoading(true);
    setError(null);
    setSelectedScreen(null);
    setMetaData(null);
    
    try {
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (!activeTab || !activeTab.id) {
        throw new Error('No active tab found');
      }
      
      // Send message to the active tab
      const result = await sendMessage('getScreens', {}, activeTab.id);
      
      if (result.success && result.data) {
        // Process the screens data
        const screensData = result.data.data || [];
        setScreens(screensData);
        setDesignId(result.designId || null);
        
        // Log the screens data for debugging
        console.log('Screens data:', screensData);
        
        // Store the data in storage
        if (result.designId) {
          const timestamp = new Date().toLocaleString();
          const storageKey = `session:codesign_screens_${result.designId}` as const;
          await storage.setItem(storageKey, {
            screens: screensData,
            timestamp: timestamp
          });
          setLastSyncTime(timestamp);
          console.log('Saved screens data to storage');
        }
        
        if (screensData.length > 0) {
          showToast(`Successfully loaded ${screensData.length} screens`, 'success');
        } else {
          showToast('No screens found', 'info');
        }
      } else {
        setError(result.error || 'Failed to sync screens');
        setScreens([]);
        showToast(result.error || 'Failed to sync screens', 'error');
      }
    } catch (err) {
      console.error('Error syncing screens:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setScreens([]);
      showToast(err instanceof Error ? err.message : 'Unknown error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle clicking on a screen item
  const handleScreenClick = async (screen: Screen) => {
    if (!screen.meta_url) {
      showToast('This screen does not have meta data available', 'error');
      return;
    }
    
    setSelectedScreen(screen);
    setMetaData(null);
    setFetchingMeta(true);
    
    try {
      // Directly fetch the meta data using fetch API
      console.log(`Fetching meta data from: ${screen.meta_url}`);
      const response = await fetch(screen.meta_url);
      
      if (!response.ok) {
        throw new Error(`Meta data request failed with status: ${response.status}`);
      }
      
      // Parse the JSON response
      const metaData = await response.json();
      console.log('Successfully fetched meta data', metaData);
      
      // Clean the data by removing empty fields
      const cleanedData = cleanJsonData(metaData);
      console.log('Cleaned meta data', cleanedData);
      
      setMetaData(cleanedData);
      showToast(`Successfully loaded meta data for ${screen.name}`, 'success');
    } catch (err) {
      console.error('Error fetching meta data:', err);
      showToast(`Error fetching meta data: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setFetchingMeta(false);
    }
  };

  // Function to copy meta data to clipboard
  const copyMetaData = () => {
    if (!metaData || !selectedScreen) {
      showToast('No meta data to copy', 'error');
      return;
    }
    
    // Convert to JSON string
    const jsonString = JSON.stringify(metaData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        showToast(`Meta data for "${selectedScreen.name}" copied to clipboard!`, 'success');
      })
      .catch(err => {
        console.error('Failed to copy meta data:', err);
        showToast(`Failed to copy meta data: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      });
  };

  // Get the best available image URL for a screen
  const getImageUrl = (screen: Screen): string => {
    if (screen.full_preview_url) {
      return screen.full_preview_url;
    } else if (screen.thumbnail_url) {
      return screen.thumbnail_url;
    } else if (screen.cdn_host && screen.preview_path) {
      // 确保 cdn_host 以斜杠结尾或 preview_path 以斜杠开头
      const cdnHost = screen.cdn_host.endsWith('/') ? screen.cdn_host : screen.cdn_host + '/';
      const previewPath = screen.preview_path.startsWith('/') ? screen.preview_path.substring(1) : screen.preview_path;
      return `${cdnHost}${previewPath}`;
    }
    return '';
  };

  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, screen: Screen) => {
    const img = e.currentTarget;
    
    // 如果当前使用的是 full_preview_url，尝试使用 thumbnail_url
    if (img.src === getImageUrl(screen) && screen.thumbnail_url && img.src !== screen.thumbnail_url) {
      console.log(`Trying fallback thumbnail for ${screen.name}`);
      img.src = screen.thumbnail_url;
      return;
    }
    
    // 如果已经尝试了所有可能的 URL 或没有备用 URL，显示错误状态
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      // 检查是否已经添加了错误提示
      if (!parent.querySelector('.image-error-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'flex items-center justify-center w-full h-full bg-slate-200 image-error-fallback';
        fallback.innerHTML = '<div class="text-slate-400 flex flex-col items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs mt-1">加载失败</span></div>';
        parent.appendChild(fallback);
      }
    }
  };

  // Render JSON data in a readable format
  const renderJsonData = (data: any, level = 0): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span className="text-red-600 italic">null</span>;
    }
    
    if (typeof data === 'string') {
      return <span className="text-emerald-600">"{data}"</span>;
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return <span className="text-blue-600">{String(data)}</span>;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-gray-600">[]</span>;
      }
      
      return (
        <div className="text-gray-700" style={{ marginLeft: level * 20 + 'px' }}>
          [
          <div className="ml-5">
            {data.map((item, index) => (
              <div key={index}>
                {renderJsonData(item, level + 1)}
                {index < data.length - 1 && ','}
              </div>
            ))}
          </div>
          ]
        </div>
      );
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      
      if (keys.length === 0) {
        return <span className="text-gray-600">{'{}'}</span>;
      }
      
      return (
        <div className="text-gray-700" style={{ marginLeft: level * 20 + 'px' }}>
          {'{'}
          <div className="ml-5">
            {keys.map((key, index) => (
              <div key={key}>
                <span className="text-purple-600 font-medium">"{key}"</span>: {renderJsonData(data[key], level + 1)}
                {index < keys.length - 1 && ','}
              </div>
            ))}
          </div>
          {'}'}
        </div>
      );
    }
    
    return <span>{String(data)}</span>;
  };

  // Preload image and handle loading state
  const preloadImage = (src: string, id: string) => {
    if (!src) return;
    
    setLoadingImages(prev => ({ ...prev, [id]: true }));
    
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoadingImages(prev => ({ ...prev, [id]: false }));
    };
    img.onerror = () => {
      setLoadingImages(prev => ({ ...prev, [id]: false }));
    };
  };

  // Preload images when screens data is available
  useEffect(() => {
    if (screens.length > 0) {
      screens.forEach(screen => {
        const imageUrl = getImageUrl(screen);
        if (imageUrl) {
          preloadImage(imageUrl, screen.id);
        }
      });
    }
  }, [screens]);

  // Handle image click to preview
  const handleImageClick = (e: React.MouseEvent, screen: Screen) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    const imageUrl = getImageUrl(screen);
    if (imageUrl) {
      setPreviewImage({
        url: imageUrl,
        alt: screen.name
      });
    }
  };

  return (
    <div className="max-w-xl min-w-[400px] mx-auto p-6 font-sans bg-slate-50">
      <Toast {...toast} />
      <ImagePreview 
        imageUrl={previewImage?.url || ''} 
        alt={previewImage?.alt || ''} 
        isOpen={!!previewImage} 
        onClose={() => setPreviewImage(null)} 
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-slate-800 text-center">Codesign Screens</h1>
        <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
      </div>
      
      <div className="flex justify-center mb-6">
        <button 
          onClick={syncScreens} 
          disabled={loading || isLoadingFromStorage}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-6 py-2.5 text-sm font-medium transition-colors shadow-sm ${(loading || isLoadingFromStorage) ? 'bg-slate-400 cursor-not-allowed' : ''} flex items-center`}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-2" />
              Syncing...
            </>
          ) : isLoadingFromStorage ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-1.5" />
              Sync Screens
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 text-sm">
          <div className="flex">
            <AlertCircle size={20} className="text-red-500 mr-2" />
            <div>
              <p className="font-medium">Error: {error}</p>
              <p>Make sure you're on a Codesign design page.</p>
            </div>
          </div>
        </div>
      )}
      
      {designId && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md mb-6 text-sm text-emerald-800">
          <div className="flex">
            <CheckCircle size={20} className="text-emerald-500 mr-2" />
            <div>
              <p className="font-medium">Design ID: {designId}</p>
              <p>Total Screens: {screens.length}</p>
              {lastSyncTime && (
                <p className="flex items-center mt-1 text-xs text-emerald-700">
                  <Clock size={12} className="mr-1" />
                  Last synced: {lastSyncTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {selectedScreen && (
        <div className="bg-white rounded-lg p-5 mt-6 shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">Meta Data for: {selectedScreen.name}</h3>
            <button 
              onClick={() => setSelectedScreen(null)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center"
            >
              <ArrowLeft size={14} className="mr-1" />
              Back to List
            </button>
          </div>
          
          {fetchingMeta ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-indigo-500" />
              <p>Loading meta data...</p>
            </div>
          ) : metaData ? (
            <>
              <div className="flex justify-end mb-3">
                <button 
                  onClick={copyMetaData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-1.5 text-xs font-medium transition-colors shadow-sm flex items-center"
                >
                  <Copy size={14} className="mr-1.5" />
                  Copy Meta Data
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-md p-4 whitespace-pre-wrap text-left">
                {renderJsonData(metaData)}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-red-600">
              <AlertCircle size={32} className="mx-auto mb-2" />
              <p>No meta data available or failed to load.</p>
            </div>
          )}
        </div>
      )}
      
      {!selectedScreen && screens.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
            <Monitor size={20} className="mr-1.5 text-indigo-500" />
            Screens
            <span className="text-xs font-normal text-slate-500 ml-2">(Click to view meta data)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {screens.map((screen) => (
              <div 
                key={screen.id} 
                className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md ${screen.meta_url ? 'cursor-pointer relative' : ''}`}
                onClick={() => screen.meta_url && handleScreenClick(screen)}
                title={screen.meta_url ? "Click to view meta data" : "No meta data available"}
              >
                <div className="relative aspect-video bg-slate-100 group">
                  {getImageUrl(screen) ? (
                    <>
                      {loadingImages[screen.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                          <RefreshCw size={20} className="animate-spin text-slate-400" />
                        </div>
                      )}
                      <img 
                        src={getImageUrl(screen)} 
                        alt={screen.name} 
                        className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages[screen.id] ? 'opacity-0' : 'opacity-100'}`}
                        onError={(e) => handleImageError(e, screen)}
                        onClick={(e) => handleImageClick(e, screen)}
                      />
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleImageClick(e, screen)}
                      >
                        <div className="bg-white bg-opacity-80 p-1.5 rounded-full">
                          <ZoomIn size={18} className="text-slate-700" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <ImageIcon size={24} className="text-slate-400" />
                    </div>
                  )}
                  {screen.meta_url && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-medium text-slate-700 truncate mb-1">{screen.name}</div>
                  {screen.meta_url && (
                    <div className="flex items-center text-[10px] text-emerald-600">
                      <FileText size={12} className="mr-0.5" />
                      Has Meta Data
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!error && !designId && !loading && (
        <div className="text-center py-10">
          <Monitor size={64} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-2">Navigate to a Codesign design page</p>
          <p className="text-slate-400 text-sm">Then click "Sync Screens" to fetch data</p>
        </div>
      )}
    </div>
  );
}

export default App;
