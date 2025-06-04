const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const JITEngine = require('./src/JITEngine');
const IOSTranslator = require('./src/IOSTranslator');
const JITConverter = require('./src/JITConverter');
const ObjectiveCConverter = require('./src/ObjectiveCConverter');
const SwiftConverter = require('./src/SwiftConverter');

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'jit_api',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['shortcuts://'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shortcut-ID']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    await rateLimiter.consume(clientId);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
});

// Initialize JIT Engine, iOS Translator, JIT Converter, Objective-C Converter, and Swift Converter
const jitEngine = new JITEngine();
const iosTranslator = new IOSTranslator();
const jitConverter = new JITConverter();
const objectiveCConverter = new ObjectiveCConverter();
const swiftConverter = new SwiftConverter();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: {
      jit: true,
      ios_translation: true,
      v8_optimization: true,
      jit_conversion: true,
      code_analysis: true,
      objectivec_conversion: true
    }
  });
});

// Main JIT compilation endpoint
app.post('/jit/compile', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    logger.info(`JIT compilation request started`, { requestId, ip: req.ip });
    
    const {
      code,
      options = {},
      target = 'ios',
      optimizationLevel = 'O2',
      timeout = 30000,
      language = 'javascript'  // New parameter for source language
    } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Code parameter is required and must be a string'
      });
    }

    if (code.length > 1024 * 1024) { // 1MB limit
      return res.status(400).json({
        error: 'Code too large',
        message: 'Code must be less than 1MB'
      });
    }

    let processedCode = code;
    let conversionMetadata = null;

    // Convert Objective-C to JavaScript if needed
    if (language === 'objectivec' || language === 'objc') {
      logger.info(`Converting Objective-C to JavaScript`, { requestId });
      
      const objcResult = await objectiveCConverter.convert(code, {
        enableFoundationPolyfills: true,
        cache: true
      });

      if (!objcResult.success) {
        return res.status(400).json({
          error: 'Objective-C conversion failed',
          message: 'Failed to convert Objective-C code to JavaScript'
        });
      }

      processedCode = objcResult.code;
      conversionMetadata = objcResult.metadata;
    }

    // Convert Swift to JavaScript if needed
    if (language === 'swift') {
      logger.info(`Converting Swift to JavaScript`, { requestId });
      
      const swiftResult = await swiftConverter.convert(code, {
        enableFoundationPolyfills: true,
        cache: true
      });

      if (!swiftResult.success) {
        return res.status(400).json({
          error: 'Swift conversion failed',
          message: 'Failed to convert Swift code to JavaScript'
        });
      }

      processedCode = swiftResult.code;
      conversionMetadata = swiftResult.metadata;
    }

    // Compile with JIT optimizations
    const jitResult = await jitEngine.compile(processedCode, {
      optimizationLevel,
      timeout,
      enableJIT: true,
      ...options
    });

    // Translate for iOS compatibility
    const iosCompatible = await iosTranslator.translate(jitResult, {
      target,
      preservePerformance: true
    });

    const executionTime = Date.now() - startTime;

    logger.info(`JIT compilation completed`, {
      requestId,
      executionTime,
      codeSize: code.length,
      optimizationLevel,
      language
    });

    res.json({
      success: true,
      requestId,
      result: {
        compiled: iosCompatible.code,
        metadata: {
          originalSize: code.length,
          compiledSize: iosCompatible.code.length,
          optimizations: jitResult.optimizations,
          iosAdaptations: iosCompatible.adaptations,
          executionTime,
          jitEnabled: true,
          sourceLanguage: language,
          ...(conversionMetadata && { objectiveCConversion: conversionMetadata })
        },
        execution: {
          canExecute: iosCompatible.canExecute,
          requirements: iosCompatible.requirements,
          shortcuts_compatible: true
        }
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`JIT compilation failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Compilation failed',
      message: error.message,
      executionTime
    });
  }
});

// Execute compiled code endpoint
app.post('/jit/execute', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`JIT execution request started`, { requestId, ip: req.ip });

    const {
      compiledCode,
      input = {},
      timeout = 10000,
      memoryLimit = 128 * 1024 * 1024 // 128MB
    } = req.body;

    if (!compiledCode) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'compiledCode parameter is required'
      });
    }

    // Execute the compiled code
    const result = await jitEngine.execute(compiledCode, input, {
      timeout,
      memoryLimit
    });

    const executionTime = Date.now() - startTime;

    logger.info(`JIT execution completed`, {
      requestId,
      executionTime,
      resultSize: JSON.stringify(result).length
    });

    res.json({
      success: true,
      requestId,
      result: result,
      metadata: {
        executionTime,
        memoryUsed: process.memoryUsage().heapUsed
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`JIT execution failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Execution failed',
      message: error.message,
      executionTime
    });
  }
});

// Objective-C to JavaScript conversion endpoint
app.post('/jit/convert-objc', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`Objective-C conversion request started`, { requestId, ip: req.ip });

    const {
      code,
      enableFoundationPolyfills = true,
      preserveComments = false,
      targetFormat = 'javascript'
    } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'code parameter is required and must be a string'
      });
    }

    // Convert Objective-C to JavaScript
    const result = await objectiveCConverter.convert(code, {
      enableFoundationPolyfills,
      preserveComments,
      targetFormat
    });

    const executionTime = Date.now() - startTime;

    logger.info(`Objective-C conversion completed`, {
      requestId,
      executionTime,
      originalLines: result.metadata.originalLines,
      convertedLines: result.metadata.convertedLines
    });

    res.json({
      success: true,
      requestId,
      result,
      metadata: {
        executionTime,
        sourceLanguage: 'objectivec',
        targetLanguage: 'javascript'
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`Objective-C conversion failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Objective-C conversion failed',
      message: error.message,
      executionTime
    });
  }
});

// Swift to JavaScript conversion endpoint
app.post('/jit/convert-swift', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`Swift conversion request started`, { requestId, ip: req.ip });

    const {
      code,
      enableFoundationPolyfills = true,
      preserveComments = false,
      targetFormat = 'javascript',
      strictMode = true
    } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'code parameter is required and must be a string'
      });
    }

    // Convert Swift to JavaScript
    const result = await swiftConverter.convert(code, {
      enableFoundationPolyfills,
      preserveComments,
      targetFormat,
      strictMode
    });

    const executionTime = Date.now() - startTime;

    logger.info(`Swift conversion completed`, {
      requestId,
      executionTime,
      originalLines: result.metadata.originalLines,
      convertedLines: result.metadata.convertedLines,
      classes: result.metadata.classes,
      structs: result.metadata.structs,
      functions: result.metadata.functions
    });

    res.json({
      success: true,
      requestId,
      result,
      metadata: {
        executionTime,
        sourceLanguage: 'swift',
        targetLanguage: 'javascript'
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`Swift conversion failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Swift conversion failed',
      message: error.message,
      executionTime
    });
  }
});

// Enhanced JIT instruction conversion endpoint
app.post('/jit/convert', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`JIT conversion request started`, { requestId, ip: req.ip });

    const {
      instructions,
      sourceFormat,
      targetFormat = 'nodejs',
      optimizationLevel = 'O2',
      preserveSemantics = true
    } = req.body;

    // Validate input
    if (!instructions || !sourceFormat) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'instructions and sourceFormat parameters are required'
      });
    }

    // Add support for Objective-C as source format
    let result;
    if (sourceFormat === 'objectivec' || sourceFormat === 'objc') {
      result = await objectiveCConverter.convert(instructions, {
        enableFoundationPolyfills: targetFormat === 'nodejs',
        targetFormat: 'javascript'
      });
    } else if (sourceFormat === 'swift') {
      result = await swiftConverter.convert(instructions, {
        enableFoundationPolyfills: targetFormat === 'nodejs',
        targetFormat: 'javascript'
      });
    } else {
      // Use existing JIT converter
      result = await jitConverter.convert(instructions, sourceFormat, {
        targetFormat,
        optimizationLevel,
        preserveSemantics
      });
    }

    const executionTime = Date.now() - startTime;

    logger.info(`JIT conversion completed`, {
      requestId,
      executionTime,
      sourceFormat,
      targetFormat,
      instructionSize: JSON.stringify(instructions).length
    });

    res.json({
      success: true,
      requestId,
      result,
      metadata: {
        sourceFormat,
        targetFormat,
        executionTime,
        preservedSemantics: preserveSemantics
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`JIT conversion failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Conversion failed',
      message: error.message,
      executionTime
    });
  }
});

// Code analysis endpoint
app.post('/jit/analyze', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`Code analysis request started`, { requestId, ip: req.ip });

    const {
      code,
      target = 'shortcuts',
      analysisDepth = 'standard'
    } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Code parameter is required and must be a string'
      });
    }

    // Perform code analysis
    const analysis = await performCodeAnalysis(code, { target, analysisDepth });

    const executionTime = Date.now() - startTime;

    logger.info(`Code analysis completed`, {
      requestId,
      executionTime,
      codeSize: code.length,
      analysisDepth
    });

    res.json({
      success: true,
      requestId,
      result: analysis,
      metadata: {
        executionTime,
        analysisDepth,
        target
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error(`Code analysis failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      executionTime
    });

    res.status(500).json({
      success: false,
      requestId,
      error: 'Analysis failed',
      message: error.message,
      executionTime
    });
  }
});

// Get supported JIT formats endpoint
app.get('/jit/formats', (req, res) => {
  const supportedFormats = [...jitConverter.stats.supportedPlatforms, 'objectivec', 'objc', 'swift'];
  
  res.json({
    supportedSourceFormats: supportedFormats,
    supportedTargetFormats: ['nodejs', 'javascript', 'ios-compatible'],
    conversionStats: {
      ...jitConverter.getStats(),
      objectiveC: objectiveCConverter.getStats(),
      swift: swiftConverter.getStats()
    },
    description: {
      'ios-llvm': 'iOS LLVM Intermediate Representation',
      'android-art': 'Android ART Runtime bytecode',
      'wasm': 'WebAssembly text or binary format',
      'java-hotspot': 'Java HotSpot JVM bytecode',
      'dotnet-clr': '.NET CLR Intermediate Language',
      'v8-bytecode': 'V8 JavaScript engine bytecode',
      'spidermonkey': 'SpiderMonkey JavaScript engine bytecode',
      'chakra': 'Chakra JavaScript engine bytecode',
      'assembly': 'Native assembly code (x86, ARM, etc.)',
      'objectivec': 'Objective-C source code',
      'objc': 'Objective-C source code (alias)',
      'swift': 'Swift source code'
    }
  });
});

// Get JIT information endpoint
app.get('/jit/info', (req, res) => {
  res.json({
    engine: 'V8',
    version: process.version,
    jit_enabled: true,
    optimizations: {
      turbofan: true,
      ignition: true,
      concurrent_compilation: true,
      inline_caching: true
    },
    ios_compatibility: {
      shortcuts_integration: true,
      webview_execution: true,
      javascript_core: true
    },
    conversion_capabilities: {
      supported_platforms: jitConverter.stats.supportedPlatforms.length + 2, // +2 for Objective-C and Swift
      conversion_cache_size: jitConverter.getStats().cacheSize + objectiveCConverter.getStats().cacheSize + swiftConverter.getStats().cacheSize,
      total_conversions: jitConverter.getStats().conversions + objectiveCConverter.getStats().conversions + swiftConverter.getStats().conversions,
      objectivec_support: true,
      swift_support: true
    },
    supported_languages: {
      javascript: 'Native JavaScript support',
      objectivec: 'Objective-C to JavaScript conversion',
      swift: 'Swift to JavaScript conversion',
      llvm: 'LLVM IR conversion',
      wasm: 'WebAssembly conversion'
    },
    limits: {
      max_code_size: '1MB',
      max_execution_time: '30s',
      max_memory: '128MB'
    }
  });
});

// Get server statistics endpoint
app.get('/jit/stats', (req, res) => {
  res.json({
    jitEngine: jitEngine.getStats(),
    iosTranslator: iosTranslator.getStats(),
    jitConverter: jitConverter.getStats(),
    objectiveCConverter: objectiveCConverter.getStats(),
    swiftConverter: swiftConverter.getStats(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
  });
});

// Code analysis function
async function performCodeAnalysis(code, options = {}) {
  const analysis = {
    complexity: calculateComplexity(code),
    optimizationSuggestions: [],
    iosCompatibility: checkIOSCompatibility(code),
    performance: estimatePerformance(code),
    security: performSecurityAnalysis(code)
  };

  // Generate optimization suggestions
  if (analysis.complexity.cyclomaticComplexity > 10) {
    analysis.optimizationSuggestions.push({
      type: 'complexity',
      message: 'Consider breaking down complex functions',
      severity: 'medium'
    });
  }

  if (analysis.iosCompatibility.issues.length > 0) {
    analysis.optimizationSuggestions.push({
      type: 'compatibility',
      message: 'iOS compatibility issues detected',
      severity: 'high',
      details: analysis.iosCompatibility.issues
    });
  }

  if (analysis.performance.estimatedTime > 100) {
    analysis.optimizationSuggestions.push({
      type: 'performance',
      message: 'Consider optimizing for better performance',
      severity: 'medium',
      suggestions: ['Use more efficient algorithms', 'Avoid nested loops', 'Consider memoization']
    });
  }

  return analysis;
}

function calculateComplexity(code) {
  const lines = code.split('\n').length;
  const functions = (code.match(/function\s+\w+/g) || []).length;
  const loops = (code.match(/for\s*\(|while\s*\(/g) || []).length;
  const conditionals = (code.match(/if\s*\(|switch\s*\(/g) || []).length;
  const recursion = /(\w+)\s*\([^)]*\)[\s\S]*?\1\s*\(/.test(code);

  return {
    lines,
    functions,
    loops,
    conditionals,
    recursion,
    cyclomaticComplexity: 1 + loops + conditionals,
    maintainabilityIndex: Math.max(0, 171 - 5.2 * Math.log(lines) - 0.23 * (1 + loops + conditionals) - 16.2 * Math.log(functions || 1))
  };
}

function checkIOSCompatibility(code) {
  const issues = [];
  const warnings = [];

  // Check for restricted APIs
  const restrictedAPIs = ['eval', 'Function', 'setTimeout', 'setInterval'];
  for (const api of restrictedAPIs) {
    if (code.includes(api)) {
      issues.push(`Restricted API: ${api}`);
    }
  }

  // Check for modern JS features
  if (code.includes('=>')) {
    warnings.push('Arrow functions may not work in older iOS versions');
  }
  if (code.includes('let ') || code.includes('const ')) {
    warnings.push('let/const may not work in older iOS versions');
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings,
    confidence: Math.max(0, 1 - (issues.length * 0.3) - (warnings.length * 0.1))
  };
}

function estimatePerformance(code) {
  const complexity = calculateComplexity(code);
  const estimatedTime = complexity.cyclomaticComplexity * 0.1;
  const memoryUsage = code.length * 2; // rough estimate

  return {
    estimatedTime,
    memoryUsage,
    jitFriendly: !code.includes('eval') && !code.includes('with'),
    hotspots: identifyHotspots(code)
  };
}

function identifyHotspots(code) {
  const hotspots = [];
  
  // Nested loops
  if (code.includes('for') && code.match(/for[\s\S]*?for/)) {
    hotspots.push({ type: 'nested-loops', line: -1, impact: 'high' });
  }
  
  // Recursive functions
  if (/(\w+)\s*\([^)]*\)[\s\S]*?\1\s*\(/.test(code)) {
    hotspots.push({ type: 'recursion', line: -1, impact: 'medium' });
  }

  return hotspots;
}

function performSecurityAnalysis(code) {
  const vulnerabilities = [];
  const warnings = [];

  // Check for dangerous patterns
  if (code.includes('eval(')) {
    vulnerabilities.push({ type: 'code-injection', severity: 'high', description: 'eval() usage detected' });
  }
  
  if (code.includes('innerHTML')) {
    warnings.push({ type: 'xss', severity: 'medium', description: 'innerHTML usage detected' });
  }

  return {
    safe: vulnerabilities.length === 0,
    vulnerabilities,
    warnings,
    score: Math.max(0, 100 - (vulnerabilities.length * 30) - (warnings.length * 10))
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Create logs directory
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Start server
app.listen(port, () => {
  logger.info(`JITPhone server running on port ${port}`);
  console.log(`🚀 JITPhone Server started on http://localhost:${port}`);
  console.log(`📱 iOS Shortcuts can now connect to this server`);
  console.log(`⚡ JIT compilation ready with V8 optimizations`);
  console.log(`🔄 JIT instruction conversion enabled`);
  console.log(`📊 Code analysis tools available`);
});

module.exports = app; 