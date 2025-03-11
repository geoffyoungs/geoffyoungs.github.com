// Cache name with version
const CACHE_NAME = 'eml-viewer-cache-v1';

// Files to cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/emailjs-mime-parser/2.0.7/emailjs-mime-parser.min.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event handler - caches resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event handler - cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  return self.clients.claim();
});

// Fetch event handler - serves cached resources or fetches from network
self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.startsWith('https://cdnjs.cloudflare.com')) {
    
    // Check if this is a navigation request or a resource request
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            // If fetch fails, serve the cached index.html
            return caches.open(CACHE_NAME)
              .then((cache) => {
                return cache.match('index.html');
              });
          })
      );
    } else {
      // For non-navigation requests, use a cache-first strategy
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            // Cache hit - return response
            if (response) {
              return response;
            }
            
            // No cache hit - fetch from network
            return fetch(event.request)
              .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone the response since it can only be consumed once
                var responseToCache = response.clone();
                
                // Open the cache and store the new response
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                
                return response;
              });
          })
      );
    }
  }
});

// Handle the share target event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') return;
  
  // Check if this is a shared file request
  if (event.request.url.includes('share-target')) {
    event.respondWith(Response.redirect('/index.html'));
    
    event.waitUntil(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get('eml');
        
        // Store the file in IndexedDB for later retrieval
        const client = await self.clients.get(event.resultingClientId);
        const data = {
          file: file,
          timestamp: new Date().getTime()
        };
        
        // Post the file data to the client
        client.postMessage(data);
      })()
    );
  }
});

// Add support for handling files
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SHARED_FILE') {
    const client = event.source;
    
    if (self.sharedFile) {
      client.postMessage({
        type: 'SHARED_FILE',
        file: self.sharedFile
      });
      
      // Clear the shared file after sending
      self.sharedFile = null;
    }
  }
});

// Helper function for getting files from the share target
self.getFiles = async () => {
  return new Promise((resolve) => {
    const channel = new BroadcastChannel('shared-files-channel');
    
    channel.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SHARED_FILE' && event.data.file) {
        resolve([event.data.file]);
        channel.close();
      }
    });
    
    channel.postMessage({ type: 'GET_SHARED_FILE' });
    
    // Set a timeout to resolve with an empty array if no file is received
    setTimeout(() => {
      resolve([]);
      channel.close();
    }, 5000);
  });
};

// Add support for Web Share Target API
navigator.getFiles = self.getFiles;
