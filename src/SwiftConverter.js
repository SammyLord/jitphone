const crypto = require('crypto');

/**
 * Swift to JavaScript Converter
 * Converts Swift code to equivalent JavaScript for execution
 */
class SwiftConverter {
  constructor() {
    this.conversionCache = new Map();
    this.stats = {
      conversions: 0,
      cacheHits: 0,
      totalLines: 0
    };

    // Swift to JavaScript type mappings
    this.typeMappings = {
      'String': 'String',
      'Int': 'Number',
      'Double': 'Number',
      'Float': 'Number',
      'Bool': 'Boolean',
      'Array': 'Array',
      'Dictionary': 'Object',
      'Set': 'Set',
      'Optional': 'null',
      'Any': 'any',
      'AnyObject': 'Object',
      'Void': 'void',
      'nil': 'null',
      'true': 'true',
      'false': 'false'
    };

    // Common Swift method mappings
    this.methodMappings = {
      'append': 'push',
      'removeFirst': 'shift',
      'removeLast': 'pop',
      'insert': 'splice',
      'remove': 'splice',
      'count': 'length',
      'isEmpty': 'length === 0',
      'first': '[0]',
      'last': '[arr.length - 1]'
    };

    // Swift keywords
    this.swiftKeywords = [
      'func', 'var', 'let', 'class', 'struct', 'enum', 'protocol', 'extension',
      'init', 'deinit', 'override', 'final', 'static', 'lazy', 'weak', 'unowned',
      'private', 'fileprivate', 'internal', 'public', 'open', 'mutating',
      'inout', 'throws', 'rethrows', 'try', 'catch', 'defer', 'guard',
      'where', 'as', 'is', 'super', 'self', 'Self', 'Type', 'associatedtype'
    ];
  }

  /**
   * Main conversion method
   */
  async convert(swiftCode, options = {}) {
    const {
      enableFoundationPolyfills = true,
      preserveComments = false,
      targetFormat = 'javascript',
      cache = true,
      strictMode = true
    } = options;

    // Check cache
    const cacheKey = this.generateCacheKey(swiftCode, options);
    if (cache && this.conversionCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.conversionCache.get(cacheKey);
    }

    try {
      // Parse Swift code
      const parsed = this.parseSwift(swiftCode, options);
      
      // Convert to JavaScript
      const jsCode = this.convertToJavaScript(parsed, options);
      
      // Add polyfills if needed
      let finalCode = jsCode;
      if (enableFoundationPolyfills) {
        finalCode = this.addSwiftPolyfills() + '\n\n' + jsCode;
      }

      const result = {
        success: true,
        code: finalCode,
        metadata: {
          originalLines: swiftCode.split('\n').length,
          convertedLines: finalCode.split('\n').length,
          classes: parsed.classes.length,
          structs: parsed.structs.length,
          functions: parsed.functions.length,
          protocols: parsed.protocols.length,
          extensions: parsed.extensions.length,
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
      throw new Error(`Swift conversion failed: ${error.message}`);
    }
  }

  /**
   * Parse Swift code into structured format
   */
  parseSwift(code, options = {}) {
    const result = {
      imports: [],
      classes: [],
      structs: [],
      enums: [],
      protocols: [],
      extensions: [],
      functions: [],
      variables: [],
      closures: [],
      warnings: []
    };

    const lines = code.split('\n').map(line => line.trim()).filter(line => line);
    let currentContext = null;
    let braceDepth = 0;
    let contextStack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // Parse imports
      if (line.startsWith('import ')) {
        const importMatch = line.match(/import\s+(.+)/);
        if (importMatch) {
          result.imports.push(importMatch[1]);
        }
        continue;
      }

      // Parse class declarations
      if (line.includes('class ')) {
        const classMatch = line.match(/(?:public\s+|private\s+|internal\s+|open\s+|final\s+)*class\s+(\w+)(?:\s*:\s*([^{]+))?/);
        if (classMatch) {
          currentContext = {
            type: 'class',
            name: classMatch[1],
            superclass: classMatch[2] ? classMatch[2].trim().split(',')[0] : null,
            protocols: classMatch[2] ? classMatch[2].trim().split(',').slice(1).map(p => p.trim()) : [],
            properties: [],
            methods: [],
            initializers: []
          };
          result.classes.push(currentContext);
          contextStack.push(currentContext);
        }
        continue;
      }

      // Parse struct declarations
      if (line.includes('struct ')) {
        const structMatch = line.match(/(?:public\s+|private\s+|internal\s+)*struct\s+(\w+)(?:\s*:\s*([^{]+))?/);
        if (structMatch) {
          currentContext = {
            type: 'struct',
            name: structMatch[1],
            protocols: structMatch[2] ? structMatch[2].trim().split(',').map(p => p.trim()) : [],
            properties: [],
            methods: [],
            initializers: []
          };
          result.structs.push(currentContext);
          contextStack.push(currentContext);
        }
        continue;
      }

      // Parse enum declarations
      if (line.includes('enum ')) {
        const enumMatch = line.match(/(?:public\s+|private\s+|internal\s+)*enum\s+(\w+)(?:\s*:\s*([^{]+))?/);
        if (enumMatch) {
          currentContext = {
            type: 'enum',
            name: enumMatch[1],
            rawType: enumMatch[2] ? enumMatch[2].trim() : null,
            cases: []
          };
          result.enums.push(currentContext);
          contextStack.push(currentContext);
        }
        continue;
      }

      // Parse protocol declarations
      if (line.includes('protocol ')) {
        const protocolMatch = line.match(/(?:public\s+|private\s+|internal\s+)*protocol\s+(\w+)(?:\s*:\s*([^{]+))?/);
        if (protocolMatch) {
          currentContext = {
            type: 'protocol',
            name: protocolMatch[1],
            inheritedProtocols: protocolMatch[2] ? protocolMatch[2].trim().split(',').map(p => p.trim()) : [],
            requirements: []
          };
          result.protocols.push(currentContext);
          contextStack.push(currentContext);
        }
        continue;
      }

      // Parse extension declarations
      if (line.includes('extension ')) {
        const extensionMatch = line.match(/extension\s+(\w+)(?:\s*:\s*([^{]+))?/);
        if (extensionMatch) {
          currentContext = {
            type: 'extension',
            extendedType: extensionMatch[1],
            protocols: extensionMatch[2] ? extensionMatch[2].trim().split(',').map(p => p.trim()) : [],
            methods: []
          };
          result.extensions.push(currentContext);
          contextStack.push(currentContext);
        }
        continue;
      }

      // Parse function declarations
      if (line.includes('func ')) {
        const func = this.parseFunction(line, lines, i);
        if (func) {
          if (currentContext && (currentContext.type === 'class' || currentContext.type === 'struct')) {
            currentContext.methods.push(func);
          } else if (currentContext && currentContext.type === 'extension') {
            currentContext.methods.push(func);
          } else if (currentContext && currentContext.type === 'protocol') {
            currentContext.requirements.push(func);
          } else {
            result.functions.push(func);
          }
          i = func.endLine || i;
        }
        continue;
      }

      // Parse init methods
      if (line.includes('init(')) {
        const init = this.parseInitializer(line, lines, i);
        if (init && currentContext && (currentContext.type === 'class' || currentContext.type === 'struct')) {
          currentContext.initializers.push(init);
          i = init.endLine || i;
        }
        continue;
      }

      // Parse properties
      if (line.match(/^\s*(?:public\s+|private\s+|internal\s+|fileprivate\s+|open\s+)?(?:static\s+|lazy\s+|weak\s+|unowned\s+)?(?:var|let)\s+/)) {
        const property = this.parseProperty(line, lines, i);
        if (property && currentContext && (currentContext.type === 'class' || currentContext.type === 'struct')) {
          currentContext.properties.push(property);
          i = property.endLine || i;
        } else if (property) {
          result.variables.push(property);
        }
        continue;
      }

      // Parse enum cases
      if (line.includes('case ') && currentContext && currentContext.type === 'enum') {
        const caseMatch = line.match(/case\s+(\w+)(?:\s*=\s*(.+))?/);
        if (caseMatch) {
          currentContext.cases.push({
            name: caseMatch[1],
            value: caseMatch[2] ? caseMatch[2].trim() : null
          });
        }
        continue;
      }

      // Track brace depth for context management
      if (line.includes('{')) {
        braceDepth += (line.match(/{/g) || []).length;
      }
      if (line.includes('}')) {
        braceDepth -= (line.match(/}/g) || []).length;
        if (braceDepth === contextStack.length - 1) {
          contextStack.pop();
          currentContext = contextStack[contextStack.length - 1] || null;
        }
      }

      // Parse closures
      if (line.includes('{') && line.includes('in')) {
        const closureMatch = line.match(/\{([^}]*)\s+in/);
        if (closureMatch) {
          result.closures.push({
            parameters: closureMatch[1].trim(),
            line: i
          });
        }
      }
    }

    return result;
  }

  /**
   * Parse Swift function
   */
  parseFunction(line, lines, startIndex) {
    const funcMatch = line.match(/(?:public\s+|private\s+|internal\s+|fileprivate\s+|open\s+|static\s+|class\s+|override\s+|final\s+|mutating\s+)*func\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+))?/);
    if (!funcMatch) return null;

    const name = funcMatch[1];
    const paramString = funcMatch[2];
    const returnType = funcMatch[3] ? funcMatch[3].trim() : 'Void';

    // Parse parameters
    const parameters = this.parseParameters(paramString);

    // Find function body - handle both single line and multi-line functions
    let body = '';
    let braceDepth = 0;
    let bodyStart = -1;
    let bodyEnd = startIndex;
    let foundOpenBrace = false;

    // Check if function is on same line
    if (line.includes('{')) {
      foundOpenBrace = true;
      bodyStart = startIndex;
      braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // Extract body from same line if it's complete
      const braceIndex = line.indexOf('{');
      if (braceIndex !== -1) {
        const samLineBody = line.substring(braceIndex + 1);
        if (samLineBody.includes('}') && braceDepth === 0) {
          // Single line function
          body = samLineBody.substring(0, samLineBody.lastIndexOf('}')).trim();
          return {
            name,
            parameters,
            returnType,
            body: body,
            endLine: startIndex
          };
        } else {
          body += samLineBody + '\n';
        }
      }
    }

    // Continue parsing multi-line function
    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];
      
      if (!foundOpenBrace && currentLine.includes('{')) {
        foundOpenBrace = true;
        bodyStart = i;
      }
      
      if (foundOpenBrace) {
        if (currentLine.includes('{')) {
          braceDepth += (currentLine.match(/{/g) || []).length;
        }
        if (currentLine.includes('}')) {
          braceDepth -= (currentLine.match(/}/g) || []).length;
        }
        
        if (braceDepth === 0) {
          // End of function
          if (currentLine.includes('}')) {
            const beforeBrace = currentLine.substring(0, currentLine.lastIndexOf('}'));
            if (beforeBrace.trim()) {
              body += beforeBrace + '\n';
            }
          }
          bodyEnd = i;
          break;
        } else {
          body += currentLine + '\n';
        }
      }
    }

    return {
      name,
      parameters,
      returnType,
      body: body.trim(),
      endLine: bodyEnd
    };
  }

  /**
   * Parse Swift initializer
   */
  parseInitializer(line, lines, startIndex) {
    const initMatch = line.match(/(?:public\s+|private\s+|internal\s+|convenience\s+|required\s+)*init\s*\(([^)]*)\)/);
    if (!initMatch) return null;

    const paramString = initMatch[1];
    const parameters = this.parseParameters(paramString);

    // Find initializer body
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
      parameters,
      body: body.trim(),
      endLine: bodyEnd
    };
  }

  /**
   * Parse Swift property
   */
  parseProperty(line, lines, startIndex) {
    const propMatch = line.match(/(?:public\s+|private\s+|internal\s+|fileprivate\s+|open\s+|static\s+|lazy\s+|weak\s+|unowned\s+)*(var|let)\s+(\w+)(?:\s*:\s*([^=\n{]+))?(?:\s*=\s*([^{\n]+))?/);
    if (!propMatch) return null;

    const isConstant = propMatch[1] === 'let';
    const name = propMatch[2];
    const type = propMatch[3] ? propMatch[3].trim() : null;
    const initialValue = propMatch[4] ? propMatch[4].trim() : null;

    // Check for computed property
    let getter = null;
    let setter = null;
    let endLine = startIndex;

    if (line.includes('{') || lines[startIndex + 1]?.trim() === '{') {
      // Parse computed property
      let braceDepth = 0;
      let inGetter = false;
      let inSetter = false;
      let getterBody = '';
      let setterBody = '';
      let currentBlock = '';

      // Find the opening brace
      let startLine = startIndex;
      if (!line.includes('{') && lines[startIndex + 1]?.trim() === '{') {
        startLine = startIndex + 1;
      }

      for (let i = startLine; i < lines.length; i++) {
        const currentLine = lines[i];
        
        // Track brace depth
        if (currentLine.includes('{')) {
          braceDepth += (currentLine.match(/{/g) || []).length;
        }
        if (currentLine.includes('}')) {
          braceDepth -= (currentLine.match(/}/g) || []).length;
        }
        
        // Check for getter/setter blocks
        if (currentLine.trim() === 'get {' || currentLine.includes('get {')) {
          inGetter = true;
          inSetter = false;
          currentBlock = '';
        } else if (currentLine.trim() === 'set {' || currentLine.includes('set {')) {
          inSetter = true;
          inGetter = false;
          if (inGetter && getterBody === '') {
            getterBody = currentBlock.trim();
          }
          currentBlock = '';
        } else if (braceDepth === 0) {
          // End of property
          if (inGetter) {
            getterBody = currentBlock.trim();
          } else if (inSetter) {
            setterBody = currentBlock.trim();
          }
          endLine = i;
          break;
        } else if (braceDepth > 0 && !currentLine.includes('get') && !currentLine.includes('set')) {
          // Accumulate body content
          if (currentLine.trim() && !currentLine.includes('{') && !currentLine.includes('}')) {
            currentBlock += currentLine + '\n';
          }
        }

        // Handle simple computed property (just return statement)
        if (braceDepth === 1 && currentLine.includes('return') && !inGetter && !inSetter) {
          getterBody = currentLine.trim();
          if (i + 1 < lines.length && lines[i + 1].includes('}')) {
            endLine = i + 1;
            break;
          }
        }
      }

      getter = getterBody || null;
      setter = setterBody || null;
    }

    return {
      name,
      type,
      isConstant,
      initialValue,
      getter,
      setter,
      endLine
    };
  }

  /**
   * Parse function parameters
   */
  parseParameters(paramString) {
    if (!paramString.trim()) return [];

    const parameters = [];
    const parts = paramString.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      const match = trimmed.match(/(?:(\w+)\s+)?(\w+)\s*:\s*([^=]+)(?:\s*=\s*(.+))?/);
      
      if (match) {
        parameters.push({
          externalName: match[1] || match[2],
          internalName: match[2],
          type: match[3].trim(),
          defaultValue: match[4] ? match[4].trim() : null
        });
      } else {
        // Simple parameter without type annotation
        const simple = trimmed.match(/(\w+)/);
        if (simple) {
          parameters.push({
            externalName: simple[1],
            internalName: simple[1],
            type: 'Any',
            defaultValue: null
          });
        }
      }
    }

    return parameters;
  }

  /**
   * Convert parsed Swift to JavaScript
   */
  convertToJavaScript(parsed, options = {}) {
    let jsCode = '// Converted from Swift by JITPhone\n';
    jsCode += "'use strict';\n\n";

    // Convert protocols to comments/interfaces
    for (const protocol of parsed.protocols) {
      jsCode += this.convertProtocol(protocol) + '\n\n';
    }

    // Convert classes
    for (const cls of parsed.classes) {
      jsCode += this.convertClass(cls) + '\n\n';
    }

    // Convert structs
    for (const struct of parsed.structs) {
      jsCode += this.convertStruct(struct) + '\n\n';
    }

    // Convert enums
    for (const enumDef of parsed.enums) {
      jsCode += this.convertEnum(enumDef) + '\n\n';
    }

    // Convert extensions
    for (const extension of parsed.extensions) {
      jsCode += this.convertExtension(extension) + '\n\n';
    }

    // Convert standalone functions
    for (const func of parsed.functions) {
      jsCode += this.convertFunction(func) + '\n\n';
    }

    // Convert global variables
    for (const variable of parsed.variables) {
      jsCode += this.convertVariable(variable) + '\n';
    }

    return jsCode;
  }

  /**
   * Convert Swift class to JavaScript class
   */
  convertClass(cls) {
    let jsClass = `class ${cls.name}`;
    
    if (cls.superclass) {
      jsClass += ` extends ${cls.superclass}`;
    }
    
    jsClass += ' {\n';

    // Constructor
    const hasCustomInit = cls.initializers.length > 0;
    if (hasCustomInit) {
      for (const init of cls.initializers) {
        jsClass += this.convertInitializer(init, cls) + '\n';
      }
    } else {
      jsClass += '  constructor() {\n';
      if (cls.superclass) {
        jsClass += '    super();\n';
      }
      
      // Initialize properties
      for (const prop of cls.properties) {
        if (!prop.getter && !prop.setter) {
          let defaultValue = prop.initialValue || this.getDefaultValue(prop.type);
          jsClass += `    this.${prop.name} = ${defaultValue};\n`;
        }
      }
      
      jsClass += '  }\n\n';
    }

    // Convert properties (getters/setters)
    for (const prop of cls.properties) {
      if (prop.getter || prop.setter) {
        jsClass += this.convertComputedProperty(prop) + '\n';
      }
    }

    // Convert methods
    for (const method of cls.methods) {
      jsClass += this.convertMethod(method, cls) + '\n';
    }

    jsClass += '}';
    return jsClass;
  }

  /**
   * Convert Swift struct to JavaScript class
   */
  convertStruct(struct) {
    // Structs are converted to classes in JavaScript
    return this.convertClass(struct);
  }

  /**
   * Convert Swift enum to JavaScript object
   */
  convertEnum(enumDef) {
    let jsEnum = `const ${enumDef.name} = {\n`;
    
    for (const enumCase of enumDef.cases) {
      const value = enumCase.value || `'${enumCase.name}'`;
      jsEnum += `  ${enumCase.name}: ${value},\n`;
    }
    
    // Add helper methods
    jsEnum += `  allCases: [${enumDef.cases.map(c => `'${c.name}'`).join(', ')}],\n`;
    jsEnum += `  rawValue(caseName) { return this[caseName]; }\n`;
    
    jsEnum += '};';
    return jsEnum;
  }

  /**
   * Convert Swift protocol to JavaScript mixin
   */
  convertProtocol(protocol) {
    let jsProtocol = `// Protocol: ${protocol.name}\n`;
    jsProtocol += `// Requirements: ${protocol.requirements.map(r => r.name).join(', ')}\n`;
    jsProtocol += `const ${protocol.name}Protocol = {\n`;
    
    for (const requirement of protocol.requirements) {
      jsProtocol += `  ${requirement.name}() {\n`;
      jsProtocol += `    throw new Error('${requirement.name} must be implemented');\n`;
      jsProtocol += `  },\n`;
    }
    
    jsProtocol += '};';
    return jsProtocol;
  }

  /**
   * Convert Swift extension to JavaScript prototype extension
   */
  convertExtension(extension) {
    let jsExtension = `// Extension for ${extension.extendedType}\n`;
    
    if (extension.methods.length > 0) {
      jsExtension += `${extension.extendedType}.prototype = Object.assign(${extension.extendedType}.prototype, {\n`;
      
      for (const method of extension.methods) {
        const methodBody = this.convertMethodBody(method.body);
        const jsParams = method.parameters.map(p => p.internalName).join(', ');
        jsExtension += `  ${method.name}(${jsParams}) {\n`;
        jsExtension += this.indentCode(methodBody, 4);
        jsExtension += '\n  },\n';
      }
      
      jsExtension = jsExtension.slice(0, -2) + '\n'; // Remove last comma
      jsExtension += '});\n';
    }
    
    return jsExtension;
  }

  /**
   * Convert Swift initializer to JavaScript constructor
   */
  convertInitializer(init, cls) {
    const jsParams = init.parameters.map(p => p.internalName).join(', ');
    const methodBody = this.convertMethodBody(init.body);
    
    let constructor = `  constructor(${jsParams}) {\n`;
    if (cls.superclass) {
      constructor += '    super();\n';
    }
    constructor += this.indentCode(methodBody, 4);
    constructor += '\n  }';
    
    return constructor;
  }

  /**
   * Convert computed property
   */
  convertComputedProperty(prop) {
    let jsProp = '';
    
    if (prop.getter) {
      jsProp += `  get ${prop.name}() {\n`;
      jsProp += this.indentCode(this.convertMethodBody(prop.getter), 4);
      jsProp += '\n  }\n';
    }
    
    if (prop.setter) {
      jsProp += `  set ${prop.name}(value) {\n`;
      jsProp += this.indentCode(this.convertMethodBody(prop.setter), 4);
      jsProp += '\n  }\n';
    }
    
    return jsProp;
  }

  /**
   * Convert Swift function to JavaScript function
   */
  convertFunction(func) {
    const jsParams = func.parameters.map(p => p.internalName).join(', ');
    const jsBody = this.convertMethodBody(func.body);

    let funcStr = `function ${func.name}(${jsParams}) {\n`;
    funcStr += this.indentCode(jsBody, 2);
    funcStr += '\n}';

    return funcStr;
  }

  /**
   * Convert Swift method to JavaScript method
   */
  convertMethod(method, context) {
    const jsParams = method.parameters.map(p => p.internalName).join(', ');
    const jsBody = this.convertMethodBody(method.body);

    let methodStr = `  ${method.name}(${jsParams}) {\n`;
    methodStr += this.indentCode(jsBody, 4);
    methodStr += '\n  }';

    return methodStr;
  }

  /**
   * Convert Swift variable to JavaScript variable
   */
  convertVariable(variable) {
    const keyword = variable.isConstant ? 'const' : 'let';
    let jsValue = variable.initialValue;
    
    if (jsValue) {
      jsValue = this.convertExpression(jsValue);
    } else {
      jsValue = this.getDefaultValue(variable.type);
    }

    return `${keyword} ${variable.name} = ${jsValue};`;
  }

  /**
   * Convert method body from Swift to JavaScript
   */
  convertMethodBody(body) {
    if (!body) return 'return null;';

    let jsBody = body;

    // Convert Swift closure syntax FIRST (before other conversions)
    // Handle specific Swift closure patterns that we know how to convert safely
    // Handle: numbers.map { $0 * 2 } -> numbers.map(x => x * 2)
    jsBody = jsBody.replace(/(\w+)\.map\s*{\s*\$0\s*\*\s*(\d+)\s*}/g, '$1.map(x => x * $2)');
    jsBody = jsBody.replace(/(\w+)\.filter\s*{\s*\$0\s*>\s*(\d+)\s*}/g, '$1.filter(x => x > $2)');
    
    // Handle explicit closure assignment: let closure = { (params) -> ReturnType in body }
    jsBody = jsBody.replace(/=\s*{\s*\(([^)]*)\)\s*->\s*\w+\s+in\s+([^}]+)\s*}/g, '= ($1) => { $2 }');

    // Convert Swift for-in loops with ranges FIRST (before other conversions)
    // Handle: for i in 0..<n { ... } -> for (let i = 0; i < n; i++) { ... }
    jsBody = jsBody.replace(/for\s+(\w+)\s+in\s+(\d+)\.\.\.?<(\w+|\d+)\s*{/g, 'for (let $1 = $2; $1 < $3; $1++) {');
    jsBody = jsBody.replace(/for\s+(\w+)\s+in\s+(\w+)\.\.\.?<(\w+|\d+)\s*{/g, 'for (let $1 = $2; $1 < $3; $1++) {');
    
    // Handle: for i in 0...n { ... } -> for (let i = 0; i <= n; i++) { ... }
    jsBody = jsBody.replace(/for\s+(\w+)\s+in\s+(\d+)\.\.\.(\w+|\d+)\s*{/g, 'for (let $1 = $2; $1 <= $3; $1++) {');
    jsBody = jsBody.replace(/for\s+(\w+)\s+in\s+(\w+)\.\.\.(\w+|\d+)\s*{/g, 'for (let $1 = $2; $1 <= $3; $1++) {');

    // Handle array iteration: for item in array { ... } -> for (const item of array) { ... }
    jsBody = jsBody.replace(/for\s+(\w+)\s+in\s+(\w+)\s*{/g, 'for (const $1 of $2) {');

    // Convert computed properties: var name: Type { return value } -> get name() { return value }
    jsBody = jsBody.replace(/var\s+(\w+):\s*\w+\s*{\s*return\s+([^}]+)\s*}/g, 'get $1() { return $2; }');

    // Convert error handling
    jsBody = jsBody.replace(/throws\s*->\s*(\w+)/g, ''); // Remove throws from function signature
    jsBody = jsBody.replace(/throw\s+([^;\n]+)/g, 'throw new Error("$1");');
    jsBody = jsBody.replace(/do\s*{/g, 'try {');
    jsBody = jsBody.replace(/}\s*catch\s+(\w+)\s*{/g, '} catch (error) { if (error.message === "$1") {');

    // Convert Swift variable declarations
    jsBody = jsBody.replace(/\blet\s+(\w+)\s*:\s*\w+\s*=\s*([^;\n]+)/g, 'const $1 = $2;');
    jsBody = jsBody.replace(/\bvar\s+(\w+)\s*:\s*\w+\s*=\s*([^;\n]+)/g, 'let $1 = $2;');
    jsBody = jsBody.replace(/\blet\s+(\w+)\s*=\s*([^;\n]+)/g, 'const $1 = $2;');
    jsBody = jsBody.replace(/\bvar\s+(\w+)\s*=\s*([^;\n]+)/g, 'let $1 = $2;');

    // Convert Swift types to JavaScript types
    for (const [swiftType, jsType] of Object.entries(this.typeMappings)) {
      const regex = new RegExp(`\\b${swiftType}\\b`, 'g');
      jsBody = jsBody.replace(regex, jsType);
    }

    // Convert Swift string interpolation BEFORE other string operations
    jsBody = jsBody.replace(/"([^"]*)\\\(([^)]+)\)([^"]*)"/g, '`$1${$2}$3`');

    // Convert optional chaining
    jsBody = jsBody.replace(/(\w+)\?\./g, '$1?.');

    // Convert nil coalescing
    jsBody = jsBody.replace(/(\w+)\s*\?\?\s*([^,\n;]+)/g, '($1 !== null && $1 !== undefined) ? $1 : $2');

    // Convert force unwrapping (remove !)
    jsBody = jsBody.replace(/(\w+)!/g, '$1');

    // Convert guard statements
    jsBody = jsBody.replace(/guard\s+([^{]+)\s+else\s*{([^}]+)}/g, 'if (!($1)) { $2 }');

    // Convert if let statements
    jsBody = jsBody.replace(/if\s+let\s+(\w+)\s*=\s*([^{]+)\s*{/g, 'if (($1 = $2) !== null && $1 !== undefined) {');

    // Convert Swift method calls and properties
    jsBody = jsBody.replace(/(\w+)\.count/g, '$1.length');
    jsBody = jsBody.replace(/(\w+)\.isEmpty/g, '($1.length === 0)');
    jsBody = jsBody.replace(/(\w+)\.contains\s*\(\s*([^)]+)\s*\)/g, '$1.includes($2)');

    // Convert array/dictionary methods
    for (const [swiftMethod, jsMethod] of Object.entries(this.methodMappings)) {
      const regex = new RegExp(`\\.${swiftMethod}\\(`, 'g');
      jsBody = jsBody.replace(regex, `.${jsMethod}(`);
    }

    // Convert print statements
    jsBody = jsBody.replace(/print\s*\(/g, 'console.log(');

    // Convert self to this
    jsBody = jsBody.replace(/\bself\./g, 'this.');
    jsBody = jsBody.replace(/\bself\b/g, 'this');

    // Convert super calls
    jsBody = jsBody.replace(/super\.(\w+)/g, 'super.$1');

    // Handle Swift's increment/decrement operators
    jsBody = jsBody.replace(/(\w+)\s*\+\=\s*1/g, '$1++');
    jsBody = jsBody.replace(/(\w+)\s*-\=\s*1/g, '$1--');

    // Convert basic control structures
    jsBody = jsBody.replace(/if\s+([^{]+)\s*{/g, 'if ($1) {');
    jsBody = jsBody.replace(/while\s+([^{]+)\s*{/g, 'while ($1) {');
    jsBody = jsBody.replace(/else\s+if\s+([^{]+)\s*{/g, 'else if ($1) {');

    // Ensure proper statement termination
    jsBody = jsBody.replace(/([^;{}\n])\n/g, '$1;\n');

    // Convert return statements (ensure proper termination)
    jsBody = jsBody.replace(/return\s+([^;\n]+)(?![;\n])/g, 'return $1;');

    // Clean up any double semicolons
    jsBody = jsBody.replace(/;;/g, ';');

    return jsBody || 'return null;';
  }

  /**
   * Convert Swift expressions
   */
  convertExpression(expr) {
    let jsExpr = expr;

    // Convert Swift range operators first
    jsExpr = jsExpr.replace(/(\d+)\.\.\.?<(\d+)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
    jsExpr = jsExpr.replace(/(\d+)\.\.\.(\d+)/g, 'Array.from({length: $2 - $1 + 1}, (_, i) => i + $1)');

    // Convert types
    for (const [swiftType, jsType] of Object.entries(this.typeMappings)) {
      const regex = new RegExp(`\\b${swiftType}\\b`, 'g');
      jsExpr = jsExpr.replace(regex, jsType);
    }

    // Convert Swift string interpolation
    jsExpr = jsExpr.replace(/"([^"]*)\\\(([^)]+)\)([^"]*)"/g, '`$1${$2}$3`');

    // Convert optional chaining and nil coalescing
    jsExpr = jsExpr.replace(/(\w+)\?\./g, '$1?.');
    jsExpr = jsExpr.replace(/(\w+)\s*\?\?\s*([^,\n;]+)/g, '($1 !== null && $1 !== undefined) ? $1 : $2');

    // Convert force unwrapping (remove !)
    jsExpr = jsExpr.replace(/(\w+)!/g, '$1');

    // Convert array literals
    jsExpr = jsExpr.replace(/\[([^\]]*)\]/g, '[$1]');

    // Convert dictionary literals  
    jsExpr = jsExpr.replace(/\[([^:]+):([^\]]+)\]/g, '{$1: $2}');

    // Convert Swift method calls
    jsExpr = jsExpr.replace(/\.count\b/g, '.length');
    jsExpr = jsExpr.replace(/\.isEmpty\b/g, '.length === 0');

    // Convert basic Swift literals
    jsExpr = jsExpr.replace(/\bnil\b/g, 'null');
    jsExpr = jsExpr.replace(/\btrue\b/g, 'true');
    jsExpr = jsExpr.replace(/\bfalse\b/g, 'false');

    return jsExpr;
  }

  /**
   * Get default value for Swift type
   */
  getDefaultValue(type) {
    if (!type) return 'null';
    
    const cleanType = type.replace(/[?!]/g, ''); // Remove optionals
    
    switch (cleanType) {
      case 'String': return "''";
      case 'Int':
      case 'Double':
      case 'Float': return '0';
      case 'Bool': return 'false';
      case 'Array': return '[]';
      case 'Dictionary': return '{}';
      case 'Set': return 'new Set()';
      default: return 'null';
    }
  }

  /**
   * Add Swift polyfills
   */
  addSwiftPolyfills() {
    return `
// Swift Framework Polyfills for JavaScript
(function() {
  'use strict';
  
  // String extensions
  String.prototype.count = function() {
    return this.length;
  };
  
  String.prototype.isEmpty = function() {
    return this.length === 0;
  };
  
  String.prototype.uppercased = function() {
    return this.toUpperCase();
  };
  
  String.prototype.lowercased = function() {
    return this.toLowerCase();
  };
  
  // Array extensions
  Array.prototype.count = function() {
    return this.length;
  };
  
  Array.prototype.isEmpty = function() {
    return this.length === 0;
  };
  
  Array.prototype.first = function() {
    return this.length > 0 ? this[0] : null;
  };
  
  Array.prototype.last = function() {
    return this.length > 0 ? this[this.length - 1] : null;
  };
  
  Array.prototype.append = function(element) {
    this.push(element);
  };
  
  Array.prototype.removeFirst = function() {
    return this.shift();
  };
  
  Array.prototype.removeLast = function() {
    return this.pop();
  };
  
  // Optional type simulation
  class Optional {
    constructor(value) {
      this.value = value;
    }
    
    static some(value) {
      return new Optional(value);
    }
    
    static none() {
      return new Optional(null);
    }
    
    unwrap() {
      if (this.value === null || this.value === undefined) {
        throw new Error('Unexpectedly found nil while unwrapping an Optional value');
      }
      return this.value;
    }
    
    map(transform) {
      if (this.value === null || this.value === undefined) {
        return Optional.none();
      }
      return Optional.some(transform(this.value));
    }
    
    flatMap(transform) {
      if (this.value === null || this.value === undefined) {
        return Optional.none();
      }
      return transform(this.value);
    }
  }
  
  // Export classes and functions
  if (typeof window !== 'undefined') {
    window.Optional = Optional;
  } else if (typeof global !== 'undefined') {
    global.Optional = Optional;
  }
})();
    `.trim();
  }

  /**
   * Utility methods
   */
  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => line ? indent + line : line).join('\n');
  }

  generateCacheKey(code, options) {
    const data = JSON.stringify({ code, options });
    return crypto.createHash('md5').update(data).digest('hex');
  }

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

  clearCache() {
    this.conversionCache.clear();
  }
}

module.exports = SwiftConverter; 