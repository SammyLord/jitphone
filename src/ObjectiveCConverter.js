const crypto = require('crypto');

/**
 * Objective-C to JavaScript Converter
 * Converts Objective-C code to equivalent JavaScript for execution
 */
class ObjectiveCConverter {
  constructor() {
    this.conversionCache = new Map();
    this.stats = {
      conversions: 0,
      cacheHits: 0,
      totalLines: 0
    };

    // Foundation framework mappings
    this.foundationMappings = {
      'NSString': 'String',
      'NSMutableString': 'String',
      'NSArray': 'Array',
      'NSMutableArray': 'Array',
      'NSDictionary': 'Object',
      'NSMutableDictionary': 'Object',
      'NSNumber': 'Number',
      'BOOL': 'boolean',
      'YES': 'true',
      'NO': 'false',
      'nil': 'null',
      'NSLog': 'console.log'
    };

    // Common method mappings
    this.methodMappings = {
      'stringWithFormat:': 'String.format',
      'arrayWithObjects:': 'Array.of',
      'dictionaryWithObjectsAndKeys:': 'Object.fromEntries',
      'length': 'length',
      'count': 'length',
      'objectAtIndex:': 'at',
      'addObject:': 'push',
      'removeObject:': 'splice',
      'containsObject:': 'includes'
    };
  }

  /**
   * Main conversion method
   */
  async convert(objectiveCCode, options = {}) {
    const {
      enableFoundationPolyfills = true,
      preserveComments = false,
      targetFormat = 'javascript',
      cache = true
    } = options;

    // Check cache
    const cacheKey = this.generateCacheKey(objectiveCCode, options);
    if (cache && this.conversionCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.conversionCache.get(cacheKey);
    }

    try {
      // Parse Objective-C code
      const parsed = this.parseObjectiveC(objectiveCCode, options);
      
      // Convert to JavaScript
      const jsCode = this.convertToJavaScript(parsed, options);
      
      // Add polyfills if needed
      let finalCode = jsCode;
      if (enableFoundationPolyfills) {
        finalCode = this.addFoundationPolyfills() + '\n\n' + jsCode;
      }

      const result = {
        success: true,
        code: finalCode,
        metadata: {
          originalLines: objectiveCCode.split('\n').length,
          convertedLines: finalCode.split('\n').length,
          classes: parsed.classes.length,
          methods: parsed.methods.length,
          conversionTime: Date.now()
        },
        warnings: parsed.warnings
      };

      // Cache result
      if (cache) {
        this.conversionCache.set(cacheKey, result);
      }

      this.stats.conversions++;
      this.stats.totalLines += result.metadata.originalLines;

      return result;

    } catch (error) {
      throw new Error(`Objective-C conversion failed: ${error.message}`);
    }
  }

  /**
   * Parse Objective-C code into structured format
   */
  parseObjectiveC(code, options = {}) {
    const result = {
      imports: [],
      classes: [],
      methods: [],
      functions: [],
      variables: [],
      protocols: [],
      categories: [],
      blocks: [],
      warnings: []
    };

    const lines = code.split('\n').map(line => line.trim()).filter(line => line);
    let currentClass = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.includes('*')) {
        continue;
      }

      // Parse imports
      if (line.startsWith('#import') || line.startsWith('#include')) {
        const importMatch = line.match(/#import\s+[<"]([^>"]+)[>"]/);
        if (importMatch) {
          result.imports.push(importMatch[1]);
        }
        continue;
      }

      // Parse protocols
      if (line.startsWith('@protocol')) {
        const protocol = this.parseProtocols(line, lines, i);
        if (protocol) {
          result.protocols.push(protocol);
          i = protocol.endLine;
        }
        continue;
      }

      // Parse categories
      if (line.includes('@interface') && line.includes('(') && line.includes(')')) {
        const category = this.parseCategory(line, lines, i);
        if (category) {
          result.categories.push(category);
          i = category.endLine;
        }
        continue;
      }

      // Parse interface declarations
      if (line.startsWith('@interface')) {
        const interfaceMatch = line.match(/@interface\s+(\w+)(?:\s*:\s*(\w+))?(?:\s*<([^>]+)>)?/);
        if (interfaceMatch) {
          currentClass = {
            name: interfaceMatch[1],
            superclass: interfaceMatch[2] || 'NSObject',
            protocols: interfaceMatch[3] ? interfaceMatch[3].split(',').map(p => p.trim()) : [],
            properties: [],
            methods: [],
            isInterface: true
          };
          result.classes.push(currentClass);
        }
        continue;
      }

      // Parse implementation
      if (line.startsWith('@implementation')) {
        const implMatch = line.match(/@implementation\s+(\w+)/);
        if (implMatch) {
          currentClass = result.classes.find(c => c.name === implMatch[1]);
          if (!currentClass) {
            currentClass = {
              name: implMatch[1],
              superclass: 'NSObject',
              protocols: [],
              properties: [],
              methods: [],
              isInterface: false
            };
            result.classes.push(currentClass);
          } else {
            currentClass.isInterface = false;
          }
        }
        continue;
      }

      // End of class/interface
      if (line === '@end') {
        currentClass = null;
        continue;
      }

      // Parse properties
      if (line.startsWith('@property')) {
        const propMatch = line.match(/@property\s*(\([^)]*\))?\s*([^;]+)\s+(\w+)/);
        if (propMatch && currentClass) {
          currentClass.properties.push({
            attributes: propMatch[1] || '',
            type: propMatch[2].trim(),
            name: propMatch[3]
          });
        }
        continue;
      }

      // Parse synthesize
      if (line.startsWith('@synthesize')) {
        // Handle property synthesis
        continue;
      }

      // Parse method declarations/implementations
      if (line.match(/^[-+]\s*\(/)) {
        const method = this.parseMethod(line, lines, i);
        if (method) {
          if (currentClass) {
            currentClass.methods.push(method);
          } else {
            result.methods.push(method);
          }
          i = method.endLine || i;
        }
        continue;
      }

      // Parse blocks
      if (line.includes('^')) {
        const blockMatch = line.match(/(\w+)\s*=\s*\^([^{]*)\{/);
        if (blockMatch) {
          result.blocks.push({
            name: blockMatch[1],
            parameters: blockMatch[2].trim(),
            line: i
          });
        }
        continue;
      }

      // Parse standalone functions
      if (line.match(/^\w+\s+\w+\s*\(/)) {
        const func = this.parseFunction(line, lines, i);
        if (func) {
          result.functions.push(func);
          i = func.endLine || i;
        }
        continue;
      }

      // Track brace depth
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;

      // Parse variable declarations
      if (braceDepth === 0 && line.match(/^\w+\s+\*?\w+\s*[=;]/)) {
        const varMatch = line.match(/^(\w+)\s+\*?(\w+)\s*(?:=\s*([^;]+))?/);
        if (varMatch) {
          result.variables.push({
            type: varMatch[1],
            name: varMatch[2],
            initialValue: varMatch[3]
          });
        }
      }
    }

    return result;
  }

  /**
   * Parse Objective-C method
   */
  parseMethod(line, lines, startIndex) {
    const methodMatch = line.match(/^([-+])\s*\(([^)]+)\)\s*(.+)/);
    if (!methodMatch) return null;

    const isInstance = methodMatch[1] === '-';
    const returnType = methodMatch[2];
    let signature = methodMatch[3];

    // Handle method declaration vs implementation
    if (signature.endsWith(';')) {
      // Method declaration only
      signature = signature.slice(0, -1);
      return {
        isInstance,
        returnType,
        name: signature.trim(),
        parameters: this.parseMethodParameters(signature),
        body: '',
        endLine: startIndex,
        isDeclaration: true
      };
    }

    // Parse method name and parameters
    const parameters = this.parseMethodParameters(signature);
    const methodName = this.extractMethodName(signature);

    // Find method body
    let body = '';
    let braceDepth = 0;
    let bodyStart = -1;
    let bodyEnd = startIndex;
    let foundOpenBrace = false;

    for (let i = startIndex; i < lines.length; i++) {
      const currentLine = lines[i];
      
      if (currentLine.includes('{')) {
        if (!foundOpenBrace) {
          foundOpenBrace = true;
          bodyStart = i;
        }
        braceDepth += (currentLine.match(/{/g) || []).length;
      }
      
      if (currentLine.includes('}')) {
        braceDepth -= (currentLine.match(/}/g) || []).length;
        if (braceDepth === 0 && foundOpenBrace) {
          bodyEnd = i;
          break;
        }
      }
      
      if (foundOpenBrace && i > bodyStart) {
        body += currentLine + '\n';
      }
    }

    return {
      isInstance,
      returnType,
      name: methodName,
      parameters,
      body: body.trim(),
      endLine: bodyEnd,
      isDeclaration: false
    };
  }

  /**
   * Parse method parameters from signature
   */
  parseMethodParameters(signature) {
    const parameters = [];
    
    // Handle simple method names without parameters
    if (!signature.includes(':')) {
      return parameters;
    }

    // Split by parameter parts (word:)
    const parts = signature.split(/(?=\w+:)/);
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const match = part.match(/(\w+):\s*\(([^)]+)\)\s*(\w+)/);
      
      if (match) {
        parameters.push({
          label: match[1],
          type: match[2],
          name: match[3]
        });
      } else {
        // Handle unlabeled parameters
        const simpleMatch = part.match(/(\w+):\s*(\w+)/);
        if (simpleMatch) {
          parameters.push({
            label: simpleMatch[1],
            type: 'id',
            name: simpleMatch[2]
          });
        }
      }
    }

    return parameters;
  }

  /**
   * Extract method name from signature
   */
  extractMethodName(signature) {
    if (!signature.includes(':')) {
      return signature.trim();
    }
    
    const parts = signature.split(':');
    return parts[0].trim();
  }

  /**
   * Parse protocols
   */
  parseProtocols(line, lines, startIndex) {
    const protocolMatch = line.match(/@protocol\s+(\w+)/);
    if (!protocolMatch) return null;

    const protocolName = protocolMatch[1];
    const methods = [];
    let endLine = startIndex;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      
      if (currentLine === '@end') {
        endLine = i;
        break;
      }
      
      if (currentLine.match(/^[-+]\s*\(/)) {
        const method = this.parseMethod(currentLine, lines, i);
        if (method) {
          methods.push(method);
        }
      }
    }

    return {
      name: protocolName,
      methods,
      endLine
    };
  }

  /**
   * Parse categories
   */
  parseCategory(line, lines, startIndex) {
    const categoryMatch = line.match(/@interface\s+(\w+)\s*\((\w+)\)/);
    if (!categoryMatch) return null;

    const className = categoryMatch[1];
    const categoryName = categoryMatch[2];
    const methods = [];
    let endLine = startIndex;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      
      if (currentLine === '@end') {
        endLine = i;
        break;
      }
      
      if (currentLine.match(/^[-+]\s*\(/)) {
        const method = this.parseMethod(currentLine, lines, i);
        if (method) {
          methods.push(method);
          i = method.endLine || i;
        }
      }
    }

    return {
      className,
      categoryName,
      methods,
      endLine
    };
  }

  /**
   * Convert parsed Objective-C to JavaScript
   */
  convertToJavaScript(parsed, options = {}) {
    let jsCode = '// Converted from Objective-C by JITPhone\n';
    jsCode += "'use strict';\n\n";

    // Convert protocols to interfaces (comments)
    for (const protocol of parsed.protocols) {
      jsCode += `// Protocol: ${protocol.name}\n`;
      jsCode += `// Methods: ${protocol.methods.map(m => m.name).join(', ')}\n\n`;
    }

    // Convert classes
    for (const cls of parsed.classes) {
      jsCode += this.convertClass(cls) + '\n\n';
    }

    // Convert categories as mixins
    for (const category of parsed.categories) {
      jsCode += this.convertCategory(category) + '\n\n';
    }

    // Convert standalone functions
    for (const func of parsed.functions) {
      jsCode += this.convertFunction(func) + '\n\n';
    }

    // Convert standalone methods
    for (const method of parsed.methods) {
      jsCode += this.convertMethod(method) + '\n\n';
    }

    // Convert global variables
    for (const variable of parsed.variables) {
      jsCode += this.convertVariable(variable) + '\n';
    }

    // Convert blocks to arrow functions
    for (const block of parsed.blocks) {
      jsCode += `var ${block.name} = (${block.parameters}) => {\n  // Block implementation\n};\n\n`;
    }

    return jsCode;
  }

  /**
   * Convert Objective-C class to JavaScript class
   */
  convertClass(cls) {
    let jsClass = `class ${cls.name}`;
    
    if (cls.superclass && cls.superclass !== 'NSObject') {
      jsClass += ` extends ${this.foundationMappings[cls.superclass] || cls.superclass}`;
    }
    
    jsClass += ' {\n';

    // Constructor
    jsClass += '  constructor() {\n';
    if (cls.superclass && cls.superclass !== 'NSObject') {
      jsClass += '    super();\n';
    }
    
    // Initialize properties
    for (const prop of cls.properties) {
      const jsType = this.foundationMappings[prop.type] || prop.type;
      let defaultValue = 'null';
      
      if (jsType === 'String') defaultValue = "''";
      else if (jsType === 'Number') defaultValue = '0';
      else if (jsType === 'boolean') defaultValue = 'false';
      else if (jsType === 'Array') defaultValue = '[]';
      else if (jsType === 'Object') defaultValue = '{}';
      
      jsClass += `    this.${prop.name} = ${defaultValue};\n`;
    }
    
    jsClass += '  }\n\n';

    // Convert methods
    for (const method of cls.methods) {
      jsClass += this.convertMethodToClassMethod(method, cls) + '\n';
    }

    jsClass += '}';
    return jsClass;
  }

  /**
   * Convert Objective-C method to JavaScript class method
   */
  convertMethodToClassMethod(method, cls) {
    // Generate JavaScript method name
    let jsMethodName = method.name;
    if (method.parameters.length > 0) {
      jsMethodName += method.parameters.map(p => p.label).join('');
    }
    
    // Make it camelCase
    jsMethodName = this.toCamelCase(jsMethodName);

    // Generate parameters
    const jsParams = method.parameters.map(p => p.name).join(', ');

    // Convert method body
    const jsBody = this.convertMethodBody(method.body);

    let methodStr = `  ${jsMethodName}(${jsParams}) {\n`;
    methodStr += this.indentCode(jsBody, 4);
    methodStr += '\n  }';

    return methodStr;
  }

  /**
   * Convert standalone function
   */
  convertFunction(func) {
    const jsParams = func.parameters.map(p => p.name).join(', ');
    const jsBody = this.convertMethodBody(func.body);

    let funcStr = `function ${func.name}(${jsParams}) {\n`;
    funcStr += this.indentCode(jsBody, 2);
    funcStr += '\n}';

    return funcStr;
  }

  /**
   * Convert standalone method
   */
  convertMethod(method) {
    let jsMethodName = method.name;
    if (method.parameters.length > 0) {
      jsMethodName += method.parameters.map(p => p.label).join('');
    }
    jsMethodName = this.toCamelCase(jsMethodName);

    const jsParams = method.parameters.map(p => p.name).join(', ');
    const jsBody = this.convertMethodBody(method.body);

    let methodStr = `function ${jsMethodName}(${jsParams}) {\n`;
    methodStr += this.indentCode(jsBody, 2);
    methodStr += '\n}';

    return methodStr;
  }

  /**
   * Convert variable declaration
   */
  convertVariable(variable) {
    const jsType = this.foundationMappings[variable.type] || variable.type;
    let jsValue = variable.initialValue;
    
    if (jsValue) {
      jsValue = this.convertExpression(jsValue);
    } else {
      // Default values
      if (jsType === 'String') jsValue = "''";
      else if (jsType === 'Number') jsValue = '0';
      else if (jsType === 'boolean') jsValue = 'false';
      else jsValue = 'null';
    }

    return `var ${variable.name} = ${jsValue};`;
  }

  /**
   * Convert method body from Objective-C to JavaScript
   */
  convertMethodBody(body) {
    if (!body) return 'return null;';

    let jsBody = body;

    // Convert string literals first
    jsBody = jsBody.replace(/@"([^"]*)"/g, '"$1"');

    // Convert Foundation types
    for (const [objcType, jsType] of Object.entries(this.foundationMappings)) {
      const regex = new RegExp(`\\b${objcType}\\b`, 'g');
      jsBody = jsBody.replace(regex, jsType);
    }

    // Convert self to this
    jsBody = jsBody.replace(/\bself\./g, 'this.');
    jsBody = jsBody.replace(/\bself\b/g, 'this');

    // Convert super calls
    jsBody = jsBody.replace(/\[super\s+(\w+)\]/g, 'super.$1()');

    // Method calls: [object method:param]
    jsBody = jsBody.replace(/\[([^[\]]+)\s+([^[\]:]+):([^[\]]+)\]/g, (match, obj, method, param) => {
      const jsObj = this.convertExpression(obj.trim());
      const jsMethod = this.methodMappings[method + ':'] || this.toCamelCase(method);
      const jsParam = this.convertExpression(param.trim());
      return `${jsObj}.${jsMethod}(${jsParam})`;
    });

    // Method calls without parameters: [object method]
    jsBody = jsBody.replace(/\[([^[\]]+)\s+([^[\]]+)\]/g, (match, obj, method) => {
      const jsObj = this.convertExpression(obj.trim());
      const jsMethod = this.methodMappings[method] || this.toCamelCase(method);
      return `${jsObj}.${jsMethod}()`;
    });

    // Number literals: @(number)
    jsBody = jsBody.replace(/@\(([^)]+)\)/g, '$1');

    // Array literals: @[item1, item2]
    jsBody = jsBody.replace(/@\[([^\]]*)\]/g, '[$1]');

    // Dictionary literals: @{key: value}
    jsBody = jsBody.replace(/@\{([^}]*)\}/g, '{$1}');

    // Variable declarations
    jsBody = jsBody.replace(/(\w+)\s+\*(\w+)\s*=\s*([^;]+);/g, 'var $2 = $3;');
    jsBody = jsBody.replace(/(\w+)\s+(\w+)\s*=\s*([^;]+);/g, 'var $2 = $3;');

    // Control structures
    jsBody = jsBody.replace(/if\s*\(([^)]+)\)\s*{/g, 'if ($1) {');
    jsBody = jsBody.replace(/while\s*\(([^)]+)\)\s*{/g, 'while ($1) {');
    jsBody = jsBody.replace(/for\s*\(([^)]+)\)\s*{/g, 'for ($1) {');

    // Return statements
    jsBody = jsBody.replace(/return\s+([^;]+);/g, 'return $1;');

    return jsBody || 'return null;';
  }

  /**
   * Convert expressions from Objective-C to JavaScript
   */
  convertExpression(expr) {
    let jsExpr = expr;

    // Convert common expressions
    for (const [objcExpr, jsExprReplacement] of Object.entries(this.foundationMappings)) {
      const regex = new RegExp(`\\b${objcExpr}\\b`, 'g');
      jsExpr = jsExpr.replace(regex, jsExprReplacement);
    }

    // Convert string literals
    jsExpr = jsExpr.replace(/@"([^"]*)"/g, '"$1"');
    
    // Convert BOOL values
    jsExpr = jsExpr.replace(/\bYES\b/g, 'true');
    jsExpr = jsExpr.replace(/\bNO\b/g, 'false');
    
    // Convert nil
    jsExpr = jsExpr.replace(/\bnil\b/g, 'null');

    return jsExpr;
  }

  /**
   * Add Foundation framework polyfills
   */
  addFoundationPolyfills() {
    return `
// Foundation Framework Polyfills for JavaScript
(function() {
  'use strict';
  
  // String extensions
  if (!String.format) {
    String.format = function(format, ...args) {
      return format.replace(/%[sd@]/g, function() {
        return args.shift() || '';
      });
    };
  }
  
  // Array extensions
  if (!Array.of) {
    Array.of = function(...items) {
      return items;
    };
  }
  
  // Object extensions
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      const obj = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
  }
  
  // NSLog replacement
  window.NSLog = console.log.bind(console);
  global.NSLog = console.log.bind(console);
  
  // Basic NSObject simulation
  class NSObject {
    constructor() {
      this.retainCount = 1;
    }
    
    description() {
      return this.toString();
    }
    
    isEqual(other) {
      return this === other;
    }
  }
  
  // Export NSObject
  if (typeof window !== 'undefined') {
    window.NSObject = NSObject;
  } else if (typeof global !== 'undefined') {
    global.NSObject = NSObject;
  }
})();
    `.trim();
  }

  /**
   * Convert string to camelCase
   */
  toCamelCase(str) {
    return str.replace(/(?:^|_)([a-z])/g, (match, letter, index) => {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    });
  }

  /**
   * Indent code by specified spaces
   */
  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => line ? indent + line : line).join('\n');
  }

  /**
   * Generate cache key
   */
  generateCacheKey(code, options) {
    const data = JSON.stringify({ code, options });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Get conversion statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.conversionCache.size,
      cacheHitRate: this.stats.conversions > 0 ? 
        (this.stats.cacheHits / this.stats.conversions) * 100 : 0,
      averageLinesPerConversion: this.stats.conversions > 0 ?
        this.stats.totalLines / this.stats.conversions : 0
    };
  }

  /**
   * Clear conversion cache
   */
  clearCache() {
    this.conversionCache.clear();
  }
}

module.exports = ObjectiveCConverter; 
module.exports = ObjectiveCConverter; 