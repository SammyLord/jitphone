# JITPhone Client Library & JIT Conversion API

Complete documentation for the JITPhone JavaScript client library and JIT instruction conversion capabilities.

## Table of Contents

1. [Installation](#installation)
2. [Client Library](#client-library)
3. [JIT Conversion API](#jit-conversion-api)
4. [Code Analysis](#code-analysis)
5. [Examples](#examples)
6. [Error Handling](#error-handling)
7. [Performance](#performance)

## Installation

### Node.js Environment

```bash
# Install the JITPhone client
npm install jitphone-client

# Or use the local client library
const { JITPhoneClient } = require('./client/jitphone-client');
```

### Browser Environment

```html
<script src="jitphone-client.js"></script>
<script>
  const client = new JITPhoneClient({
    baseURL: 'https://your-jitphone-server.com'
  });
</script>
```

## Client Library

### JITPhoneClient Class

#### Constructor

```javascript
const client = new JITPhoneClient(options);
```

**Options:**
- `baseURL` (string): Server URL (default: 'http://localhost:3000')
- `timeout` (number): Request timeout in ms (default: 30000)
- `apiKey` (string): API key for authentication (optional)
- `retries` (number): Number of retry attempts (default: 3)
- `cache` (boolean): Enable client-side caching (default: true)

#### Methods

##### compile(code, options)

Compile JavaScript or Objective-C code with JIT optimizations.

```javascript
const result = await client.compile(code, {
  optimizationLevel: 'O2',        // O0, O1, O2, O3
  target: 'shortcuts',            // shortcuts, webview, jsc
  timeout: 30000,                 // Compilation timeout
  enableJIT: true,                // Enable JIT optimizations
  preservePerformance: true,      // Maintain performance in translation
  optimizeForSize: false,         // Optimize for code size vs performance
  language: 'javascript'          // 'javascript' or 'objectivec'
});
```

##### compileObjectiveC(objectiveCCode, options)

Shorthand method to compile Objective-C code to JavaScript with JIT optimizations.

```javascript
const result = await client.compileObjectiveC(objcCode, {
  optimizationLevel: 'O3',
  target: 'shortcuts'
});
```

##### convertObjectiveC(objectiveCCode, options)

Convert Objective-C code to JavaScript without JIT compilation.

```javascript
const result = await client.convertObjectiveC(objcCode, {
  enableFoundationPolyfills: true,   // Include Foundation framework polyfills
  preserveComments: false,           // Keep original comments
  targetFormat: 'javascript'        // Output format
});
```

**Response:**
```javascript
{
  success: true,
  requestId: "uuid",
  result: {
    code: "// JavaScript equivalent code",
    metadata: {
      originalLines: 25,
      convertedLines: 35,
      classes: 1,
      methods: 3,
      conversionTime: 1640995200000
    },
    warnings: ["Optional warnings about conversion"]
  }
}
```

##### runObjectiveC(objectiveCCode, input, options)

Compile and execute Objective-C code in one call.

```javascript
const result = await client.runObjectiveC(objcCode, input, {
  optimizationLevel: 'O2'
});
```

##### execute(compiledCode, input, options)

Execute compiled code in a sandboxed environment.

```javascript
const result = await client.execute(compiledCode, input, {
  timeout: 10000,                 // Execution timeout
  memoryLimit: 128 * 1024 * 1024, // Memory limit in bytes
  sandbox: true                   // Enable sandboxing
});
```

##### run(code, input, options)

Compile and execute in one call.

```javascript
const result = await client.run(code, input, {
  optimizationLevel: 'O2',
  target: 'shortcuts'
});
```

##### convertJITInstructions(instructions, sourceFormat, options)

Convert JIT instructions from other platforms to Node.js format.

```javascript
const result = await client.convertJITInstructions(
  instructions,
  'ios-llvm',
  {
    targetFormat: 'nodejs',        // Target format
    optimizationLevel: 'O2',       // Optimization level
    preserveSemantics: true        // Preserve original semantics
  }
);
```

##### batchCompile(codeArray, options)

Compile multiple code snippets in parallel.

```javascript
const results = await client.batchCompile([
  'Math.sqrt(16)',
  'function add(a, b) { return a + b; }'
], { optimizationLevel: 'O2' });
```

##### streamCompile(codeChunks, options)

Stream compilation for large codebases.

```javascript
for await (const result of client.streamCompile(codeChunks)) {
  console.log(`Chunk ${result.index}: ${result.success ? 'OK' : result.error}`);
}
```

##### getOptimizationSuggestions(code, options)

Get performance and compatibility suggestions.

```javascript
const analysis = await client.getOptimizationSuggestions(code, {
  target: 'shortcuts',
  analysisDepth: 'standard'       // standard, deep
});
```

##### health()

Check server health status.

```javascript
const health = await client.health();
```

##### info()

Get JIT engine information.

```javascript
const info = await client.info();
```

## JIT Conversion API

### Supported Source Formats

| Format | Description | Example |
|--------|-------------|---------|
| `ios-llvm` | iOS LLVM Intermediate Representation | LLVM IR from Xcode |
| `android-art` | Android ART Runtime bytecode | Dalvik bytecode |
| `wasm` | WebAssembly text or binary format | WAT/WASM files |
| `java-hotspot` | Java HotSpot JVM bytecode | Java class files |
| `dotnet-clr` | .NET CLR Intermediate Language | IL from .NET |
| `v8-bytecode` | V8 JavaScript engine bytecode | V8 compilation output |
| `spidermonkey` | SpiderMonkey JavaScript engine bytecode | Firefox JS engine |
| `chakra` | Chakra JavaScript engine bytecode | Edge JS engine |
| `assembly` | Native assembly code | x86, ARM, etc. |
| `objectivec` | Objective-C source code | iOS/macOS Objective-C |
| `objc` | Objective-C source code (alias) | iOS/macOS Objective-C |

### Conversion Examples

#### iOS LLVM to Node.js

```javascript
const llvmCode = `
define i32 @fibonacci(i32 %n) #0 {
entry:
  %cmp = icmp sle i32 %n, 1
  br i1 %cmp, label %return, label %if.end

if.end:
  %sub = sub nsw i32 %n, 1
  %call = call i32 @fibonacci(i32 %sub)
  %sub1 = sub nsw i32 %n, 2
  %call2 = call i32 @fibonacci(i32 %sub1)
  %add = add nsw i32 %call, %call2
  ret i32 %add

return:
  ret i32 %n
}`;

const result = await client.convertJITInstructions(llvmCode, 'ios-llvm');
```

#### Objective-C to JavaScript

```javascript
const objcCode = `
@interface Calculator : NSObject
@property (nonatomic, assign) NSInteger result;
- (void)add:(NSInteger)value;
- (NSInteger)getResult;
@end

@implementation Calculator
- (void)add:(NSInteger)value {
    self.result += value;
    NSLog(@"Added %ld, result: %ld", (long)value, (long)self.result);
}

- (NSInteger)getResult {
    return self.result;
}
@end`;

const result = await client.convertJITInstructions(objcCode, 'objectivec');
```

**Generated JavaScript:**
```javascript
// Foundation Framework Polyfills for JavaScript
// ... (polyfills code)

// Converted from Objective-C by JITPhone
'use strict';

class Calculator extends NSObject {
  constructor() {
    super();
    this.result = 0;
  }

  add(value) {
    this.result += value;
    console.log('Added ' + value + ', result: ' + this.result);
  }

  getResult() {
    return this.result;
  }
}
```

#### Foundation Framework Features

The Objective-C converter automatically handles common Foundation framework patterns:

| Objective-C | JavaScript Equivalent |
|-------------|---------------------|
| `@"string"` | `"string"` |
| `YES` / `NO` | `true` / `false` |
| `nil` | `null` |
| `NSLog(@"text")` | `console.log("text")` |
| `NSString` | `String` |
| `NSArray` | `Array` |
| `NSDictionary` | `Object` |
| `[obj method]` | `obj.method()` |
| `[obj method:param]` | `obj.method(param)` |

#### Method Call Conversion

```javascript
// Objective-C
const objcCode = `
NSString *message = [NSString stringWithFormat:@"Hello %@", name];
NSArray *items = @[@"one", @"two", @"three"];
NSInteger count = [items count];
id firstItem = [items objectAtIndex:0];
`;

// Converts to JavaScript
const jsResult = `
let message = String.format("Hello %s", name);
let items = ["one", "two", "three"];
let count = items.length;
let firstItem = items.at(0);
`;
```

## Code Analysis

### Analysis Results

```javascript
const analysis = await client.getOptimizationSuggestions(code);

// Analysis structure:
{
  complexity: {
    lines: 25,
    functions: 3,
    loops: 2,
    conditionals: 4,
    recursion: true,
    cyclomaticComplexity: 7,
    maintainabilityIndex: 68.5
  },
  optimizationSuggestions: [
    {
      type: 'performance',
      message: 'Consider optimizing for better performance',
      severity: 'medium',
      suggestions: ['Use memoization', 'Avoid nested loops']
    }
  ],
  iosCompatibility: {
    compatible: true,
    issues: [],
    warnings: ['Arrow functions may not work in older iOS versions'],
    confidence: 0.85
  },
  performance: {
    estimatedTime: 12.5,
    memoryUsage: 2048,
    jitFriendly: true,
    hotspots: [
      { type: 'recursion', line: 15, impact: 'medium' }
    ]
  },
  security: {
    safe: true,
    vulnerabilities: [],
    warnings: [],
    score: 95
  }
}
```

### Optimization Suggestions

The analysis engine provides suggestions for:

- **Performance**: Algorithm improvements, loop optimizations, memoization
- **Compatibility**: iOS version compatibility, API restrictions
- **Security**: Dangerous patterns, injection vulnerabilities
- **Maintainability**: Code complexity, function size, readability

## Examples

### Basic Usage

```javascript
const { JITPhoneClient } = require('jitphone-client');

const client = new JITPhoneClient();

// Compile and run
const result = await client.run(`
  function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
  }
  factorial(input.n);
`, { n: 5 });

console.log('Result:', result.result); // 120
```

### Batch Processing

```javascript
const codes = [
  'Math.sqrt(16)',
  'Math.pow(2, 8)',
  'Math.PI * 2'
];

const results = await client.batchCompile(codes);
results.forEach((result, i) => {
  console.log(`Code ${i}: ${result.success ? 'OK' : result.error}`);
});
```

### Platform Conversion

```javascript
// Convert iOS Swift compilation output to Node.js
const swiftLLVM = `
define swiftcc i64 @"$s4main3addS2i_SitF"(i64, i64) #0 {
entry:
  %2 = add nsw i64 %0, %1
  ret i64 %2
}`;

const nodeJS = await client.convertJITInstructions(swiftLLVM, 'ios-llvm');
console.log('Converted to JavaScript:', nodeJS.result.code);
```

### Objective-C to JavaScript Conversion

```javascript
// Basic Objective-C class conversion
const objcClass = `
@interface Person : NSObject
@property (nonatomic, strong) NSString *name;
@property (nonatomic, assign) NSInteger age;
- (instancetype)initWithName:(NSString *)name age:(NSInteger)age;
- (NSString *)description;
@end

@implementation Person
- (instancetype)initWithName:(NSString *)name age:(NSInteger)age {
    self = [super init];
    if (self) {
        _name = name;
        _age = age;
    }
    return self;
}

- (NSString *)description {
    return [NSString stringWithFormat:@"Person: %@ (%ld years old)", 
            self.name, (long)self.age];
}
@end`;

// Convert to JavaScript
const jsClass = await client.convertObjectiveC(objcClass);
console.log('JavaScript class:', jsClass.result.code);

// Compile with JIT optimizations
const optimizedResult = await client.compileObjectiveC(objcClass, {
  optimizationLevel: 'O3',
  target: 'shortcuts'
});
console.log('JIT optimizations:', optimizedResult.result.metadata.optimizations);
```

### Foundation Framework Usage

```javascript
// Objective-C code using Foundation classes
const foundationCode = `
void processData() {
    NSMutableArray *numbers = [[NSMutableArray alloc] init];
    
    for (NSInteger i = 1; i <= 10; i++) {
        NSNumber *number = @(i * i);
        [numbers addObject:number];
    }
    
    NSArray *filtered = [numbers filteredArrayUsingPredicate:
        [NSPredicate predicateWithFormat:@"self > 25"]];
    
    NSLog(@"Numbers greater than 25: %@", filtered);
}`;

// Convert with Foundation polyfills
const result = await client.convertObjectiveC(foundationCode, {
  enableFoundationPolyfills: true
});

// The result includes JavaScript equivalents with polyfills
console.log('Converted with Foundation support:', result.result.code);
```

### Auto-Detection and Mixed Language Support

```javascript
const { JITPhoneUtils } = require('jitphone-client');

// Auto-detect language
const code = `
@interface Calculator : NSObject
- (NSInteger)add:(NSInteger)a to:(NSInteger)b;
@end`;

if (JITPhoneUtils.isObjectiveC(code)) {
  console.log('Detected Objective-C code');
  
  // Validate syntax
  const validation = JITPhoneUtils.validateObjectiveC(code);
  if (validation.valid) {
    const result = await client.compile(code, { language: 'objectivec' });
    console.log('Compilation successful');
  } else {
    console.log('Validation errors:', validation.errors);
  }
}
```

### Performance Testing

```javascript
const testCode = `
  function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
    return arr;
  }
`;

// Analyze performance
const analysis = await client.getOptimizationSuggestions(testCode);
console.log('Performance hotspots:', analysis.performance.hotspots);

// Generate performance test
const { JITPhoneUtils } = require('jitphone-client');
const perfTest = JITPhoneUtils.generatePerformanceTest(testCode, 1000);
const perfResult = await client.run(perfTest);
console.log('Execution time:', perfResult.result, 'ms');

// Objective-C performance test
const objcOperation = `
NSInteger sum = 0;
for (NSInteger i = 0; i < 1000; i++) {
    sum += i * i;
}`;

const objcPerfTest = JITPhoneUtils.generateObjectiveCPerformanceTest(objcOperation, 100);
const objcResult = await client.runObjectiveC(objcPerfTest);
console.log('Objective-C execution time:', objcResult.result, 'ms');
```

### Code Generation and Templates

```javascript
// Generate Objective-C class template
const classTemplate = JITPhoneUtils.generateObjectiveCClass('DataProcessor', 'NSObject');
console.log('Generated class:');
console.log(classTemplate);

// Generate function template
const functionTemplate = JITPhoneUtils.generateObjectiveCFunction('calculateArea', 'CGFloat', [
  { type: 'CGFloat', name: 'width' },
  { type: 'CGFloat', name: 'height' }
]);
console.log('Generated function:');
console.log(functionTemplate);

// Convert templates to JavaScript
const convertedClass = await client.convertObjectiveC(classTemplate);
const convertedFunction = await client.convertObjectiveC(functionTemplate);
```

## Error Handling

### Error Types

```