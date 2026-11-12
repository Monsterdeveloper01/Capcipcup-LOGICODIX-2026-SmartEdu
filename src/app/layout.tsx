import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "CupLabs - Laboratorium Sains Virtual 3D & AI Interaktif",
  description:
    "CupLabs: Platform laboratorium sains virtual 3D, Web-AR, dan asisten AI interaktif untuk siswa SMP & SMA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // 1. Block third-party crypto extensions from injecting inpage scripts
                try {
                  var origInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(newNode, refNode) {
                    if (newNode && newNode.nodeName === 'SCRIPT' && newNode.src) {
                      if (
                        newNode.src.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                        newNode.src.indexOf('inpage.js') !== -1
                      ) {
                        return newNode;
                      }
                    }
                    return origInsertBefore.apply(this, arguments);
                  };

                  var origAppendChild = Node.prototype.appendChild;
                  Node.prototype.appendChild = function(newNode) {
                    if (newNode && newNode.nodeName === 'SCRIPT' && newNode.src) {
                      if (
                        newNode.src.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                        newNode.src.indexOf('inpage.js') !== -1
                      ) {
                        return newNode;
                      }
                    }
                    return origAppendChild.apply(this, arguments);
                  };
                } catch (_) {}

                // 2. Drop MetaMask postMessage ping-pong loop to prevent reconnect stream leak
                try {
                  var origPostMessage = window.postMessage;
                  window.postMessage = function(data, targetOrigin, transfer) {
                    if (data && typeof data === 'object') {
                      var t = data.target || (data.data && data.data.target);
                      if (typeof t === 'string' && t.indexOf('metamask') !== -1) {
                        return;
                      }
                    }
                    return origPostMessage.apply(this, arguments);
                  };

                  var origAddEventListener = window.addEventListener;
                  window.addEventListener = function(type, listener, options) {
                    if (type === 'message' && typeof listener === 'function') {
                      var safeListener = function(event) {
                        if (event && event.data && typeof event.data === 'object') {
                          var t = event.data.target || (event.data.data && event.data.data.target);
                          if (typeof t === 'string' && t.indexOf('metamask') !== -1) {
                            return;
                          }
                        }
                        return listener.apply(this, arguments);
                      };
                      return origAddEventListener.call(this, type, safeListener, options);
                    }
                    return origAddEventListener.apply(this, arguments);
                  };
                } catch (_) {}

                // 3. Prevent external web3 injection from setting up hanging event emitters
                try {
                  if (typeof window.ethereum === 'undefined') {
                    Object.defineProperty(window, 'ethereum', {
                      configurable: true,
                      enumerable: false,
                      get: function() { return undefined; },
                      set: function() {}
                    });
                  }
                } catch (_) {}

                // 4. Benign filter patterns for DevTools console
                var filterPatterns = [
                  'Receiving end does not exist',
                  'Could not establish connection',
                  'Resetting the streams',
                  'MaxListenersExceededWarning',
                  'listeners added',
                  'unsupported GPOS table',
                  'unsupported GSUB table',
                  'THREE.Clock: This module has been deprecated',
                  'THREE.Clock',
                  'gl_context.cc',
                  'landmark_projection_calculator.cc',
                  'OpenGL error checking is disabled',
                  'Using NORM_RECT without IMAGE_DIMENSIONS',
                  'MetaMask',
                  'nkbihfbeogaeaoehlefnkodbefgpgknn',
                  'chrome-extension://',
                  'moz-extension://',
                  'contentscript.js'
                ];

                function matchesFilter(msg) {
                  if (!msg) return false;
                  for (var i = 0; i < filterPatterns.length; i++) {
                    if (msg.indexOf(filterPatterns[i]) !== -1) return true;
                  }
                  return false;
                }

                function shouldFilter(args) {
                  for (var i = 0; i < args.length; i++) {
                    var arg = args[i];
                    if (typeof arg === 'string' && matchesFilter(arg)) return true;
                    if (arg && typeof arg === 'object') {
                      try {
                        if (matchesFilter(arg.message) || matchesFilter(arg.stack) || matchesFilter(JSON.stringify(arg))) return true;
                      } catch (_) {}
                    }
                  }
                  return false;
                }

                // Intercept chrome.runtime.lastError to mark it checked (silencing "Receiving end does not exist")
                try {
                  if (window.chrome && window.chrome.runtime) {
                    var origSend = window.chrome.runtime.sendMessage;
                    if (typeof origSend === 'function') {
                      window.chrome.runtime.sendMessage = function() {
                        var args = Array.prototype.slice.call(arguments);
                        var cb = args[args.length - 1];
                        if (typeof cb === 'function') {
                          args[args.length - 1] = function() {
                            try { if (window.chrome && window.chrome.runtime && window.chrome.runtime.lastError) { var _ = window.chrome.runtime.lastError.message; } } catch (_) {}
                            return cb.apply(this, arguments);
                          };
                        } else {
                          args.push(function() {
                            try { if (window.chrome && window.chrome.runtime && window.chrome.runtime.lastError) { var _ = window.chrome.runtime.lastError.message; } } catch (_) {}
                          });
                        }
                        try {
                          return origSend.apply(this, args);
                        } catch (_) {}
                      };
                    }
                  }
                } catch (_) {}

                // Override console methods to filter out unwanted browser extension and wasm noise
                var origWarn = console.warn;
                console.warn = function() {
                  if (shouldFilter(arguments)) return;
                  return origWarn.apply(console, arguments);
                };

                var origError = console.error;
                console.error = function() {
                  if (shouldFilter(arguments)) return;
                  return origError.apply(console, arguments);
                };

                var origLog = console.log;
                console.log = function() {
                  if (shouldFilter(arguments)) return;
                  return origLog.apply(console, arguments);
                };

                window.addEventListener('unhandledrejection', function(event) {
                  var r = event.reason;
                  var str = (r && (r.stack || r.message || String(r))) || '';
                  if (matchesFilter(str)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                });

                window.addEventListener('error', function(event) {
                  var str = (event.message || '') + ' ' + (event.filename || '');
                  if (matchesFilter(str)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#FFFDF7] text-slate-900">
        {children}
      </body>
    </html>
  );
}
