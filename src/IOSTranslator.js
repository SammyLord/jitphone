const crypto = require('crypto');

class IOSTranslator {
  constructor() {
    this.iosCompatibilityRules = {
      // iOS-specific limitations and workarounds
      restrictedAPIs: [
        'eval', 'Function', 'setTimeout', 'setInterval',
        'XMLHttpRequest', 'fetch', 'WebSocket'
      ],
      
      // Shortcuts-specific capabilities
      shortcutsAPIs: [
        'shortcuts.run', 'shortcuts.ask', 'shortcuts.choose',
        'shortcuts.getClipboard', 'shortcuts.setClipboard',
        'shortcuts.getFile', 'shortcuts.saveFile'
      ],
      
      // JavaScriptCore limitations
      jscLimitations: {
        maxCodeSize: 1024 * 1024, // 1MB
        maxExecutionTime: 30000,   // 30 seconds
        noJIT: true, // JSC on iOS doesn't have JIT in most contexts
        strictMode: true
      }
    };

    this.translationCache = new Map();
    this.adaptationStrategies = {
      'webview': this.adaptForWebView.bind(this),
      'shortcuts': this.adaptForShortcuts.bind(this),
      'jsc': this.adaptForJavaScriptCore.bind(this)
    };
  }

  /**
   * Main translation method - converts JIT-compiled code for iOS
   */
  async translate(jitResult, options = {}) {
    const {
      target = 'shortcuts',
      preservePerformance = true,
      enablePolyfills = true,
      optimizeForSize = false
    } = options;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(jitResult, options);
      
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      // Start translation process
      let translatedCode = jitResult.optimizedCode;
      const adaptations = [];

      // Step 1: Remove JIT-specific optimizations (not available on iOS)
      const dejittedCode = this.removeJITOptimizations(translatedCode);
      adaptations.push('jit_removal');

      // Step 2: Apply iOS compatibility fixes
      const iosCompatibleCode = this.applyIOSCompatibility(dejittedCode);
      adaptations.push('ios_compatibility');

      // Step 3: Add polyfills for missing APIs
      let polyfillCode = iosCompatibleCode;
      if (enablePolyfills) {
        polyfillCode = this.addPolyfills(iosCompatibleCode);
        adaptations.push('polyfills');
      }

      // Step 4: Apply target-specific adaptations
      const targetAdaptedCode = await this.adaptForTarget(polyfillCode, target);
      adaptations.push(`target_${target}`);

      // Step 5: Optimize for iOS constraints
      const optimizedCode = this.optimizeForIOS(targetAdaptedCode, {
        optimizeForSize,
        preservePerformance
      });
      adaptations.push('ios_optimization');

      // Step 6: Wrap in iOS-compatible execution context
      const wrappedCode = this.wrapForIOSExecution(optimizedCode, target);
      adaptations.push('ios_wrapper');

      // Create result object
      const result = {
        code: wrappedCode,
        originalSize: jitResult.optimizedCode.length,
        translatedSize: wrappedCode.length,
        adaptations,
        canExecute: this.validateIOSCompatibility(wrappedCode),
        requirements: this.getExecutionRequirements(target),
        performance: {
          expectedSlowdown: this.calculatePerformanceImpact(jitResult, wrappedCode),
          optimizationsPreserved: preservePerformance ? 0.7 : 0.4
        }
      };

      // Cache the result
      this.translationCache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      throw new Error(`iOS translation failed: ${error.message}`);
    }
  }

  /**
   * Remove JIT-specific optimizations that won't work on iOS
   */
  removeJITOptimizations(code) {
    // Remove V8-specific optimization hints
    let cleanCode = code.replace(/\/\/ V8 JIT optimization hints[\s\S]*?(?=\/\/|$)/g, '');
    
    // Remove optimization function calls
    cleanCode = cleanCode.replace(/__v8OptimizationHint\(\);?/g, '');
    
    // Remove 'use strict' duplicates and optimize placement
    const hasStrict = cleanCode.includes("'use strict'");
    cleanCode = cleanCode.replace(/'use strict';?\s*/g, '');
    
    if (hasStrict) {
      cleanCode = `'use strict';\n${cleanCode}`;
    }

    return cleanCode;
  }

  /**
   * Apply iOS-specific compatibility fixes
   */
  applyIOSCompatibility(code) {
    let compatibleCode = code;

    // Replace restricted APIs with safe alternatives
    for (const api of this.iosCompatibilityRules.restrictedAPIs) {
      const regex = new RegExp(`\\b${api}\\b`, 'g');
      compatibleCode = compatibleCode.replace(regex, `__ios_safe_${api}`);
    }

    // Fix arrow functions in older iOS versions (pre-iOS 10)
    compatibleCode = this.transpileArrowFunctions(compatibleCode);

    // Fix let/const for older iOS versions
    compatibleCode = this.transpileBlockScope(compatibleCode);

    // Remove unsupported ES6+ features
    compatibleCode = this.transpileModernFeatures(compatibleCode);

    return compatibleCode;
  }

  /**
   * Add polyfills for missing APIs and functions
   */
  addPolyfills(code) {
    const polyfills = `
// iOS Polyfills for JITPhone
(function() {
  'use strict';
  
  // Safe eval replacement (limited functionality)
  if (typeof __ios_safe_eval === 'undefined') {
    window.__ios_safe_eval = function(code) {
      console.warn('eval() is not available on iOS - code execution blocked');
      return undefined;
    };
  }
  
  // Safe Function constructor replacement
  if (typeof __ios_safe_Function === 'undefined') {
    window.__ios_safe_Function = function() {
      console.warn('Function constructor is not available on iOS');
      return function() { return undefined; };
    };
  }
  
  // Safe setTimeout replacement (for Shortcuts context)
  if (typeof __ios_safe_setTimeout === 'undefined') {
    window.__ios_safe_setTimeout = function(callback, delay) {
      console.warn('setTimeout is limited on iOS - executing immediately');
      if (typeof callback === 'function') {
        callback();
      }
      return 0;
    };
  }
  
  // Promise polyfill for older iOS versions
  if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
      var self = this;
      this.state = 'pending';
      this.value = undefined;
      this.handlers = [];
      
      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }
      
      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };
      
      try {
        executor(resolve, reject);
      } catch (error) {
        reject(error);
      }
    };
  }
})();

${code}
    `;

    return polyfills;
  }

  /**
   * Adapt code for specific iOS targets
   */
  async adaptForTarget(code, target) {
    if (this.adaptationStrategies[target]) {
      return this.adaptationStrategies[target](code);
    }
    
    // Default to shortcuts adaptation
    return this.adaptForShortcuts(code);
  }

  /**
   * Adapt code for iOS Shortcuts execution
   */
  adaptForShortcuts(code) {
    const shortcutsWrapper = `
// iOS Shortcuts Adaptation Layer
(function() {
  'use strict';
  
  // Shortcuts API bridge
  var shortcuts = {
    run: function(shortcutName, input) {
      // This would be handled by the Shortcuts app
      console.log('Running shortcut:', shortcutName, 'with input:', input);
      return { success: true, result: input };
    },
    
    ask: function(prompt) {
      // Simplified - actual implementation would use Shortcuts' Ask for Input
      return prompt("Please enter: " + prompt) || "";
    },
    
    choose: function(options) {
      // Simplified - actual implementation would use Shortcuts' Choose from Menu
      return options[0] || null;
    }
  };
  
  // Make shortcuts available globally
  if (typeof window !== 'undefined') {
    window.shortcuts = shortcuts;
  } else {
    global.shortcuts = shortcuts;
  }
  
  // Execute the main code
  try {
    ${code}
  } catch (error) {
    console.error('Shortcuts execution error:', error);
    return { error: error.message, success: false };
  }
})();
    `;

    return shortcutsWrapper;
  }

  /**
   * Adapt code for WebView execution
   */
  adaptForWebView(code) {
    const webViewWrapper = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JITPhone WebView</title>
</head>
<body>
  <script>
    (function() {
      'use strict';
      
      // WebView-specific optimizations
      ${code}
      
      // Post results back to native app
      if (window.webkit && window.webkit.messageHandlers) {
        window.webkit.messageHandlers.jitphone.postMessage({
          type: 'execution_complete',
          timestamp: Date.now()
        });
      }
    })();
  </script>
</body>
</html>
    `;

    return webViewWrapper;
  }

  /**
   * Adapt code for JavaScriptCore execution
   */
  adaptForJavaScriptCore(code) {
    // Remove DOM-specific code and adapt for pure JS execution
    let jscCode = code.replace(/document\.|window\.|DOM/g, '// DOM_REMOVED ');
    
    const jscWrapper = `
// JavaScriptCore Execution Context
(function(global) {
  'use strict';
  
  // Minimal global environment
  global.console = {
    log: function() { 
      var args = Array.prototype.slice.call(arguments);
      print('[LOG]', args.join(' '));
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      print('[ERROR]', args.join(' '));
    }
  };
  
  // Execute code
  ${jscCode}
  
})(this);
    `;

    return jscWrapper;
  }

  /**
   * Optimize code for iOS constraints
   */
  optimizeForIOS(code, options) {
    let optimizedCode = code;

    if (options.optimizeForSize) {
      // Remove comments and extra whitespace
      optimizedCode = optimizedCode.replace(/\/\*[\s\S]*?\*\//g, '');
      optimizedCode = optimizedCode.replace(/\/\/.*$/gm, '');
      optimizedCode = optimizedCode.replace(/\s+/g, ' ');
    }

    // Ensure code size is within iOS limits
    if (optimizedCode.length > this.iosCompatibilityRules.jscLimitations.maxCodeSize) {
      console.warn('Code size exceeds iOS limits - truncating');
      optimizedCode = optimizedCode.substring(0, this.iosCompatibilityRules.jscLimitations.maxCodeSize - 100) + '\n// TRUNCATED';
    }

    return optimizedCode;
  }

  /**
   * Wrap code for iOS execution context
   */
  wrapForIOSExecution(code, target) {
    const executionWrapper = `
// JITPhone iOS Execution Wrapper
(function() {
  'use strict';
  
  var startTime = Date.now();
  var result = null;
  var error = null;
  
  try {
    // Set up iOS-safe environment
    var safeGlobal = {
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      console: console
    };
    
    // Execute in controlled context
    (function() {
      ${code}
    }).call(safeGlobal);
    
  } catch (e) {
    error = {
      message: e.message,
      name: e.name,
      stack: e.stack
    };
  }
  
  var executionTime = Date.now() - startTime;
  
  // Return standardized result for iOS
  return {
    success: error === null,
    result: result,
    error: error,
    executionTime: executionTime,
    target: '${target}',
    jitphone: true
  };
})();
    `;

    return executionWrapper;
  }

  /**
   * Transpile arrow functions for older iOS versions
   */
  transpileArrowFunctions(code) {
    // Simple arrow function transpilation
    return code.replace(/\(\s*([^)]*)\s*\)\s*=>\s*{([^}]*)}/g, 'function($1) {$2}')
               .replace(/\(\s*([^)]*)\s*\)\s*=>\s*([^;,\n]+)/g, 'function($1) { return $2; }')
               .replace(/(\w+)\s*=>\s*{([^}]*)}/g, 'function($1) {$2}')
               .replace(/(\w+)\s*=>\s*([^;,\n]+)/g, 'function($1) { return $2; }');
  }

  /**
   * Transpile block scope (let/const) for older iOS versions
   */
  transpileBlockScope(code) {
    // Simple let/const to var transpilation
    return code.replace(/\b(let|const)\b/g, 'var');
  }

  /**
   * Transpile modern JavaScript features for iOS compatibility
   */
  transpileModernFeatures(code) {
    let transpiledCode = code;

    // Template literals
    transpiledCode = transpiledCode.replace(/`([^`]*)`/g, '"$1"');
    
    // Destructuring (basic cases)
    transpiledCode = transpiledCode.replace(/var\s*{\s*(\w+)\s*}\s*=\s*(\w+)/g, 'var $1 = $2.$1');
    
    // Default parameters (basic cases)
    transpiledCode = transpiledCode.replace(/function\s+(\w+)\s*\(\s*(\w+)\s*=\s*([^,)]+)/g, 
      'function $1($2) { if (typeof $2 === "undefined") $2 = $3;');

    return transpiledCode;
  }

  /**
   * Validate iOS compatibility
   */
  validateIOSCompatibility(code) {
    const issues = [];

    // Check for restricted APIs
    for (const api of this.iosCompatibilityRules.restrictedAPIs) {
      if (code.includes(api) && !code.includes(`__ios_safe_${api}`)) {
        issues.push(`Restricted API detected: ${api}`);
      }
    }

    // Check code size
    if (code.length > this.iosCompatibilityRules.jscLimitations.maxCodeSize) {
      issues.push('Code size exceeds iOS limits');
    }

    return {
      compatible: issues.length === 0,
      issues: issues,
      confidence: Math.max(0, 1 - (issues.length * 0.2))
    };
  }

  /**
   * Get execution requirements for target platform
   */
  getExecutionRequirements(target) {
    const requirements = {
      shortcuts: {
        minimumIOS: '12.0',
        shortcutsApp: true,
        capabilities: ['http_requests', 'user_interaction', 'file_system']
      },
      webview: {
        minimumIOS: '9.0',
        webKit: true,
        capabilities: ['dom_access', 'local_storage', 'http_requests']
      },
      jsc: {
        minimumIOS: '8.0',
        javaScriptCore: true,
        capabilities: ['pure_javascript']
      }
    };

    return requirements[target] || requirements.shortcuts;
  }

  /**
   * Calculate expected performance impact
   */
  calculatePerformanceImpact(jitResult, translatedCode) {
    // Estimate performance degradation due to iOS limitations
    const jitSpeedup = jitResult.jitEnabled ? 2.0 : 1.0;
    const iosOverhead = 1.3; // iOS execution overhead
    const polyfillOverhead = translatedCode.includes('Polyfills') ? 1.2 : 1.0;
    
    return (jitSpeedup * iosOverhead * polyfillOverhead) - 1.0;
  }

  /**
   * Generate cache key for translation
   */
  generateCacheKey(jitResult, options) {
    const hashInput = JSON.stringify({
      code: jitResult.optimizedCode,
      options,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60)) // Cache for 1 hour
    });
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }

  /**
   * Get translation statistics
   */
  getStats() {
    return {
      cacheSize: this.translationCache.size,
      supportedTargets: Object.keys(this.adaptationStrategies),
      iosLimitations: this.iosCompatibilityRules.jscLimitations
    };
  }
}

module.exports = IOSTranslator; 