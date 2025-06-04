/**
 * JITPhone Client Library
 * A JavaScript client for interacting with the JITPhone server
 * Supports both browser and Node.js environments
 */

class JITPhoneClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3000';
    this.timeout = options.timeout || 30000;
    this.apiKey = options.apiKey || null;
    this.retries = options.retries || 3;
    this.cache = new Map();
    this.cacheEnabled = options.cache !== false;
    
    // Performance tracking
    this.stats = {
      requests: 0,
      cacheHits: 0,
      averageLatency: 0,
      totalLatency: 0
    };
  }

  /**
   * Compile JavaScript code with JIT optimizations
   */
  async compile(code, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey('compile', code, options);
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        this.stats.cacheHits++;
        return this.cache.get(cacheKey);
      }

      const payload = {
        code,
        optimizationLevel: options.optimizationLevel || 'O2',
        target: options.target || 'shortcuts',
        timeout: options.timeout || this.timeout,
        enableJIT: options.enableJIT !== false,
        preservePerformance: options.preservePerformance !== false,
        optimizeForSize: options.optimizeForSize || false,
        language: options.language || 'javascript',
        ...options
      };

      const result = await this._makeRequest('POST', '/jit/compile', payload);
      
      // Cache successful results
      if (this.cacheEnabled && result.success) {
        this.cache.set(cacheKey, result);
      }

      this._updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      throw new JITPhoneError(`Compilation failed: ${error.message}`, 'COMPILE_ERROR', error);
    }
  }

  /**
   * Compile Objective-C code to JavaScript with JIT optimizations
   */
  async compileObjectiveC(objectiveCCode, options = {}) {
    return this.compile(objectiveCCode, { 
      ...options, 
      language: 'objectivec' 
    });
  }

  /**
   * Compile Swift code to JavaScript with JIT optimizations
   */
  async compileSwift(swiftCode, options = {}) {
    return this.compile(swiftCode, { 
      ...options, 
      language: 'swift' 
    });
  }

  /**
   * Execute compiled code
   */
  async execute(compiledCode, input = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const payload = {
        compiledCode,
        input,
        timeout: options.timeout || 10000,
        memoryLimit: options.memoryLimit || 128 * 1024 * 1024,
        sandbox: options.sandbox !== false,
        ...options
      };

      const result = await this._makeRequest('POST', '/jit/execute', payload);
      this._updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      throw new JITPhoneError(`Execution failed: ${error.message}`, 'EXECUTE_ERROR', error);
    }
  }

  /**
   * Compile and execute in one call
   */
  async run(code, input = {}, options = {}) {
    try {
      const compileResult = await this.compile(code, options);
      
      if (!compileResult.success) {
        throw new Error(compileResult.message || 'Compilation failed');
      }

      const executeResult = await this.execute(compileResult.result.compiled, input, options);
      
      return {
        success: executeResult.success,
        result: executeResult.result,
        metadata: {
          compilation: compileResult.result.metadata,
          execution: executeResult.metadata
        }
      };

    } catch (error) {
      throw new JITPhoneError(`Run failed: ${error.message}`, 'RUN_ERROR', error);
    }
  }

  /**
   * Compile and execute Objective-C code
   */
  async runObjectiveC(objectiveCCode, input = {}, options = {}) {
    return this.run(objectiveCCode, input, { 
      ...options, 
      language: 'objectivec' 
    });
  }

  /**
   * Compile and execute Swift code
   */
  async runSwift(swiftCode, input = {}, options = {}) {
    return this.run(swiftCode, input, { 
      ...options, 
      language: 'swift' 
    });
  }

  /**
   * Convert Objective-C code to JavaScript without JIT compilation
   */
  async convertObjectiveC(objectiveCCode, options = {}) {
    const startTime = Date.now();
    
    try {
      const payload = {
        code: objectiveCCode,
        enableFoundationPolyfills: options.enableFoundationPolyfills !== false,
        preserveComments: options.preserveComments || false,
        targetFormat: options.targetFormat || 'javascript'
      };

      const result = await this._makeRequest('POST', '/jit/convert-objc', payload);
      this._updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      throw new JITPhoneError(`Objective-C conversion failed: ${error.message}`, 'OBJC_CONVERT_ERROR', error);
    }
  }

  /**
   * Convert Swift code to JavaScript without JIT compilation
   */
  async convertSwift(swiftCode, options = {}) {
    const startTime = Date.now();
    
    try {
      const payload = {
        code: swiftCode,
        enableFoundationPolyfills: options.enableFoundationPolyfills !== false,
        preserveComments: options.preserveComments || false,
        targetFormat: options.targetFormat || 'javascript',
        strictMode: options.strictMode !== false
      };

      const result = await this._makeRequest('POST', '/jit/convert-swift', payload);
      this._updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      throw new JITPhoneError(`Swift conversion failed: ${error.message}`, 'SWIFT_CONVERT_ERROR', error);
    }
  }

  /**
   * Convert JIT instructions from other platforms to Node.js format
   */
  async convertJITInstructions(instructions, sourceFormat, options = {}) {
    const startTime = Date.now();
    
    try {
      const payload = {
        instructions,
        sourceFormat,
        targetFormat: options.targetFormat || 'nodejs',
        optimizationLevel: options.optimizationLevel || 'O2',
        preserveSemantics: options.preserveSemantics !== false,
        ...options
      };

      const result = await this._makeRequest('POST', '/jit/convert', payload);
      this._updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      throw new JITPhoneError(`JIT conversion failed: ${error.message}`, 'CONVERT_ERROR', error);
    }
  }

  /**
   * Get server health status
   */
  async health() {
    try {
      return await this._makeRequest('GET', '/health');
    } catch (error) {
      throw new JITPhoneError(`Health check failed: ${error.message}`, 'HEALTH_ERROR', error);
    }
  }

  /**
   * Get JIT engine information
   */
  async info() {
    try {
      return await this._makeRequest('GET', '/jit/info');
    } catch (error) {
      throw new JITPhoneError(`Info request failed: ${error.message}`, 'INFO_ERROR', error);
    }
  }

  /**
   * Batch compile multiple code snippets
   */
  async batchCompile(codeArray, options = {}) {
    try {
      const promises = codeArray.map((code, index) => 
        this.compile(code, { ...options, batchIndex: index })
      );
      
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

    } catch (error) {
      throw new JITPhoneError(`Batch compile failed: ${error.message}`, 'BATCH_ERROR', error);
    }
  }

  /**
   * Stream compilation for large code bases
   */
  async *streamCompile(codeChunks, options = {}) {
    for (let i = 0; i < codeChunks.length; i++) {
      try {
        const result = await this.compile(codeChunks[i], { 
          ...options, 
          chunkIndex: i,
          totalChunks: codeChunks.length 
        });
        yield { index: i, result, success: true };
      } catch (error) {
        yield { index: i, error: error.message, success: false };
      }
    }
  }

  /**
   * Performance optimization suggestions
   */
  async getOptimizationSuggestions(code, options = {}) {
    try {
      const payload = {
        code,
        target: options.target || 'shortcuts',
        analysisDepth: options.analysisDepth || 'standard'
      };

      return await this._makeRequest('POST', '/jit/analyze', payload);
    } catch (error) {
      throw new JITPhoneError(`Analysis failed: ${error.message}`, 'ANALYSIS_ERROR', error);
    }
  }

  /**
   * Clear client cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.requests > 0 ? (this.stats.cacheHits / this.stats.requests) * 100 : 0
    };
  }

  /**
   * Private method to make HTTP requests
   */
  async _makeRequest(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Retry logic
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await this._fetch(url, options);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        this.stats.requests++;
        return await response.json();

      } catch (error) {
        if (attempt === this.retries - 1) {
          throw error;
        }
        
        // Exponential backoff
        await this._sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  /**
   * Fetch implementation that works in both browser and Node.js
   */
  async _fetch(url, options) {
    // Browser environment
    if (typeof window !== 'undefined' && window.fetch) {
      return window.fetch(url, options);
    }
    
    // Node.js environment
    if (typeof require !== 'undefined') {
      try {
        const fetch = require('node-fetch');
        return fetch(url, options);
      } catch (e) {
        throw new Error('node-fetch is required for Node.js environments. Install with: npm install node-fetch');
      }
    }
    
    throw new Error('No fetch implementation available');
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(operation, ...params) {
    const crypto = typeof require !== 'undefined' ? require('crypto') : null;
    const data = JSON.stringify({ operation, params });
    
    if (crypto) {
      return crypto.createHash('md5').update(data).digest('hex');
    }
    
    // Simple hash for browser environments
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Update performance statistics
   */
  _updateStats(latency) {
    this.stats.totalLatency += latency;
    this.stats.averageLatency = this.stats.totalLatency / this.stats.requests;
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for JITPhone operations
 */
class JITPhoneError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'JITPhoneError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Utility functions for common operations
 */
class JITPhoneUtils {
  /**
   * Optimize code for iOS Shortcuts
   */
  static optimizeForShortcuts(code) {
    return code
      .replace(/const\s+/g, 'var ')
      .replace(/let\s+/g, 'var ')
      .replace(/=>\s*{([^}]*)}/g, 'function() {$1}')
      .replace(/=>\s*([^;,\n]+)/g, 'function() { return $1; }');
  }

  /**
   * Convert simple Objective-C syntax to JavaScript (basic patterns)
   */
  static convertObjectiveCBasics(objcCode) {
    return objcCode
      // String literals
      .replace(/@"([^"]*)"/g, '"$1"')
      // BOOL values
      .replace(/\bYES\b/g, 'true')
      .replace(/\bNO\b/g, 'false')
      .replace(/\bnil\b/g, 'null')
      // NSLog to console.log
      .replace(/NSLog\s*\(/g, 'console.log(')
      // Simple method calls [obj method] -> obj.method()
      .replace(/\[(\w+)\s+(\w+)\]/g, '$1.$2()')
      // Basic property access
      .replace(/(\w+)\.(\w+)/g, '$1.$2');
  }

  /**
   * Generate Objective-C class template
   */
  static generateObjectiveCClass(className, superclass = 'NSObject') {
    return `
@interface ${className} : ${superclass}

@property (nonatomic, strong) NSString *title;
@property (nonatomic, assign) NSInteger count;

- (instancetype)init;
- (void)performAction;
- (NSString *)description;

@end

@implementation ${className}

- (instancetype)init {
    self = [super init];
    if (self) {
        _title = @"Default Title";
        _count = 0;
    }
    return self;
}

- (void)performAction {
    self.count++;
    NSLog(@"Action performed. Count: %ld", (long)self.count);
}

- (NSString *)description {
    return [NSString stringWithFormat:@"%@ - Count: %ld", self.title, (long)self.count];
}

@end
    `.trim();
  }

  /**
   * Generate simple Objective-C function
   */
  static generateObjectiveCFunction(functionName, returnType = 'void', parameters = []) {
    const paramString = parameters.map(p => `${p.type} ${p.name}`).join(', ');
    const returnStatement = returnType !== 'void' ? `\n    return ${returnType === 'NSString*' ? '@"Result"' : '0'};` : '';
    
    return `
${returnType} ${functionName}(${paramString}) {
    NSLog(@"${functionName} called");${returnStatement}
}
    `.trim();
  }

  /**
   * Analyze code complexity
   */
  static analyzeComplexity(code) {
    const metrics = {
      lines: code.split('\n').length,
      functions: (code.match(/function\s+\w+/g) || []).length,
      loops: (code.match(/for\s*\(|while\s*\(/g) || []).length,
      conditionals: (code.match(/if\s*\(|switch\s*\(/g) || []).length,
      recursion: /(\w+)\s*\([^)]*\)[\s\S]*?\1\s*\(/.test(code),
      objectiveCMethods: (code.match(/[-+]\s*\([^)]+\)/g) || []).length,
      objectiveCClasses: (code.match(/@interface\s+\w+/g) || []).length
    };

    metrics.cyclomaticComplexity = 1 + metrics.loops + metrics.conditionals;
    metrics.estimatedExecutionTime = metrics.cyclomaticComplexity * 0.1; // rough estimate in ms

    // Adjust for Objective-C complexity
    if (metrics.objectiveCMethods > 0 || metrics.objectiveCClasses > 0) {
      metrics.estimatedExecutionTime *= 1.5; // Objective-C conversion adds overhead
    }

    return metrics;
  }

  /**
   * Generate performance test for Objective-C code
   */
  static generateObjectiveCPerformanceTest(objcCode, iterations = 1000) {
    return `
      // Objective-C Performance test generated by JITPhone
      // Note: This will be converted to JavaScript for execution
      
      void performanceTest() {
        NSDate *startTime = [NSDate date];
        
        for (int i = 0; i < ${iterations}; i++) {
          ${objcCode.replace(/\n/g, '\n          ')}
        }
        
        NSTimeInterval executionTime = [[NSDate date] timeIntervalSinceDate:startTime] * 1000;
        NSLog(@"Execution time for ${iterations} iterations: %.2f ms", executionTime);
        NSLog(@"Average time per iteration: %.4f ms", executionTime / ${iterations});
      }
    `;
  }

  /**
   * Generate performance test for Swift code
   */
  static generateSwiftPerformanceTest(swiftCode, iterations = 1000) {
    return `
      // Swift Performance test generated by JITPhone
      // Note: This will be converted to JavaScript for execution
      
      func performanceTest() {
        let startTime = Date()
        
        for i in 0..<${iterations} {
          ${swiftCode.replace(/\n/g, '\n          ')}
        }
        
        let executionTime = Date().timeIntervalSince(startTime) * 1000
        print("Execution time for ${iterations} iterations: \\(executionTime) ms")
        print("Average time per iteration: \\(executionTime / ${iterations}) ms")
      }
    `;
  }

  /**
   * Check if code is Objective-C
   */
  static isObjectiveC(code) {
    const objcPatterns = [
      /@interface\s+\w+/,
      /@implementation\s+\w+/,
      /@property\s*\(/,
      /[-+]\s*\([^)]+\)/,
      /@"[^"]*"/,
      /\[[\w\s:]+\]/,
      /#import\s+<[^>]+>/,
      /\bNSString\b|\bNSArray\b|\bNSObject\b/,
      /\bYES\b|\bNO\b|\bnil\b/
    ];

    return objcPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code is Swift
   */
  static isSwift(code) {
    const swiftPatterns = [
      /\bfunc\s+\w+/,
      /\b(var|let)\s+\w+/,
      /\bclass\s+\w+/,
      /\bstruct\s+\w+/,
      /\benum\s+\w+/,
      /\bprotocol\s+\w+/,
      /\bextension\s+\w+/,
      /\binit\s*\(/,
      /\bguard\s+/,
      /\bdefer\s*{/,
      /\w+\?\./,  // Optional chaining
      /\w+\?\?/,  // Nil coalescing
      /\w+!/,     // Force unwrapping
      /"[^"]*\\\([^)]+\)[^"]*"/,  // String interpolation
      /\bprint\s*\(/,
      /\bimport\s+\w+/,
      /\boverride\s+func/,
      /\bmutating\s+func/,
      /\bpublic\s+|private\s+|internal\s+|fileprivate\s+|open\s+/
    ];

    return swiftPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Validate Objective-C syntax (basic check)
   */
  static validateObjectiveC(code) {
    const errors = [];
    const warnings = [];

    // Check for balanced brackets
    const brackets = code.match(/[\[\]]/g) || [];
    let bracketBalance = 0;
    for (const bracket of brackets) {
      bracketBalance += bracket === '[' ? 1 : -1;
      if (bracketBalance < 0) {
        errors.push('Unbalanced brackets: closing bracket without opening');
        break;
      }
    }
    if (bracketBalance > 0) {
      errors.push('Unbalanced brackets: unclosed opening brackets');
    }

    // Check for basic interface/implementation pairing
    const interfaces = (code.match(/@interface\s+(\w+)/g) || []).map(m => m.match(/@interface\s+(\w+)/)[1]);
    const implementations = (code.match(/@implementation\s+(\w+)/g) || []).map(m => m.match(/@implementation\s+(\w+)/)[1]);
    
    for (const intface of interfaces) {
      if (!implementations.includes(intface)) {
        warnings.push(`Interface ${intface} has no corresponding implementation`);
      }
    }

    // Check for proper method syntax
    const methods = code.match(/[-+]\s*\([^)]*\)[^{;]*[{;]/g) || [];
    for (const method of methods) {
      if (!method.includes('(') || !method.includes(')')) {
        errors.push('Invalid method syntax: missing parentheses');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get Foundation framework suggestions
   */
  static getFoundationSuggestions(objcCode) {
    const suggestions = [];

    if (objcCode.includes('NSMutableArray')) {
      suggestions.push({
        type: 'optimization',
        message: 'Consider using NSArray if the array doesn\'t need to be mutable',
        line: -1
      });
    }

    if (objcCode.includes('stringWithFormat:')) {
      suggestions.push({
        type: 'conversion',
        message: 'Will be converted to JavaScript template strings for better performance',
        line: -1
      });
    }

    if (objcCode.includes('retain') || objcCode.includes('release')) {
      suggestions.push({
        type: 'warning',
        message: 'Manual memory management will be ignored in JavaScript conversion',
        line: -1
      });
    }

    return suggestions;
  }

  /**
   * Validate Swift syntax (basic check)
   */
  static validateSwift(code) {
    const errors = [];
    const warnings = [];

    // Check for balanced braces
    const braces = code.match(/[{}]/g) || [];
    let braceBalance = 0;
    for (const brace of braces) {
      braceBalance += brace === '{' ? 1 : -1;
      if (braceBalance < 0) {
        errors.push('Unbalanced braces: closing brace without opening');
        break;
      }
    }
    if (braceBalance > 0) {
      errors.push('Unbalanced braces: unclosed opening braces');
    }

    // Check for proper function syntax
    const functions = code.match(/func\s+\w+\s*\([^)]*\)/g) || [];
    for (const func of functions) {
      if (!func.includes('(') || !func.includes(')')) {
        errors.push('Invalid function syntax: missing parentheses');
      }
    }

    // Check for proper class/struct syntax
    const classStructs = code.match(/(class|struct)\s+\w+/g) || [];
    if (classStructs.length > 0 && !code.includes('{')) {
      warnings.push('Class/struct declarations should have implementations');
    }

    // Check for optional usage
    if (code.includes('!') && !code.includes('?')) {
      warnings.push('Force unwrapping without optional declaration may cause runtime errors');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert basic Swift syntax to JavaScript (basic patterns)
   */
  static convertSwiftBasics(swiftCode) {
    return swiftCode
      // Variable declarations
      .replace(/\blet\s+(\w+)\s*=\s*([^;\n]+)/g, 'const $1 = $2;')
      .replace(/\bvar\s+(\w+)\s*=\s*([^;\n]+)/g, 'let $1 = $2;')
      // Basic types
      .replace(/\bString\b/g, 'string')
      .replace(/\bInt\b/g, 'number')
      .replace(/\bDouble\b/g, 'number')
      .replace(/\bFloat\b/g, 'number')
      .replace(/\bBool\b/g, 'boolean')
      // Literals
      .replace(/\bnil\b/g, 'null')
      .replace(/\btrue\b/g, 'true')
      .replace(/\bfalse\b/g, 'false')
      // Print statements
      .replace(/print\s*\(/g, 'console.log(')
      // Optional chaining (basic)
      .replace(/(\w+)\?\./g, '$1?.')
      // Force unwrapping (remove !)
      .replace(/(\w+)!/g, '$1')
      // String interpolation (basic)
      .replace(/"([^"]*)\\\(([^)]+)\)([^"]*)"/g, '`$1${$2}$3`');
  }

  /**
   * Generate Swift class template
   */
  static generateSwiftClass(className, superclass = null, protocols = []) {
    const inheritance = superclass ? `: ${superclass}` : '';
    const protocolConformance = protocols.length > 0 ? `, ${protocols.join(', ')}` : '';
    
    return `
class ${className}${inheritance}${protocolConformance} {
    var name: String
    var count: Int
    
    init(name: String, count: Int = 0) {
        self.name = name
        self.count = count
    }
    
    func performAction() {
        count += 1
        print("Action performed. Count: \\(count)")
    }
    
    func description() -> String {
        return "\\(name) - Count: \\(count)"
    }
}
    `.trim();
  }

  /**
   * Generate Swift struct template
   */
  static generateSwiftStruct(structName, properties = []) {
    const props = properties.length > 0 ? properties : [
      { name: 'id', type: 'String' },
      { name: 'value', type: 'Int' }
    ];
    
    const propertyLines = props.map(p => `    var ${p.name}: ${p.type}`).join('\n');
    
    return `
struct ${structName} {
${propertyLines}
    
    init(${props.map(p => `${p.name}: ${p.type}`).join(', ')}) {
${props.map(p => `        self.${p.name} = ${p.name}`).join('\n')}
    }
    
    func description() -> String {
        return "${structName}(${props.map(p => `${p.name}: \\(${p.name})`).join(', ')})"
    }
}
    `.trim();
  }

  /**
   * Generate Swift function template
   */
  static generateSwiftFunction(functionName, parameters = [], returnType = 'Void') {
    const paramString = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    const returnTypeString = returnType !== 'Void' ? ` -> ${returnType}` : '';
    const returnStatement = returnType !== 'Void' ? `\n    return ${returnType === 'String' ? '"Result"' : '0'}` : '';
    
    return `
func ${functionName}(${paramString})${returnTypeString} {
    print("${functionName} called")${returnStatement}
}
    `.trim();
  }

  /**
   * Get Swift framework suggestions
   */
  static getSwiftSuggestions(swiftCode) {
    const suggestions = [];

    if (swiftCode.includes('!') && !swiftCode.includes('?')) {
      suggestions.push({
        type: 'warning',
        message: 'Consider using optional binding instead of force unwrapping',
        line: -1
      });
    }

    if (swiftCode.includes('var ') && !swiftCode.includes('mutating')) {
      suggestions.push({
        type: 'optimization',
        message: 'Consider using let for immutable values',
        line: -1
      });
    }

    if (swiftCode.includes('class ') && !swiftCode.includes('final')) {
      suggestions.push({
        type: 'performance',
        message: 'Consider marking classes as final if they won\'t be subclassed',
        line: -1
      });
    }

    if (swiftCode.includes('[String: Any]')) {
      suggestions.push({
        type: 'type-safety',
        message: 'Consider using specific types instead of Any for better type safety',
        line: -1
      });
    }

    return suggestions;
  }

  /**
   * Generate performance test (general)
   */
  static generatePerformanceTest(code, iterations = 1000) {
    return `
      // Performance test generated by JITPhone
      const startTime = Date.now();
      
      for (let i = 0; i < ${iterations}; i++) {
        ${code}
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      console.log('Execution time for ${iterations} iterations:', executionTime + 'ms');
      console.log('Average time per iteration:', (executionTime / ${iterations}) + 'ms');
      
      executionTime;
    `;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = { JITPhoneClient, JITPhoneError, JITPhoneUtils };
} else if (typeof window !== 'undefined') {
  // Browser
  window.JITPhoneClient = JITPhoneClient;
  window.JITPhoneError = JITPhoneError;
  window.JITPhoneUtils = JITPhoneUtils;
} 