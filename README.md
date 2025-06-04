# JITPhone Server 🚀📱

**Bring Node.js JIT performance to iOS Shortcuts!**

JITPhone is a server that enables JIT (Just-In-Time) compilation capabilities for non-jailbroken iOS devices by translating Node.js JIT optimizations into iOS-compatible JavaScript code that can be executed through Apple Shortcuts.

## 🌟 Features

- **JIT Compilation**: Leverages V8's TurboFan and Ignition for optimal performance
- **iOS Translation**: Automatically adapts JIT-compiled code for iOS compatibility
- **Shortcuts Integration**: Designed specifically for Apple Shortcuts workflows
- **Multiple Targets**: Supports Shortcuts, WebView, and JavaScriptCore execution
- **Safety First**: Sandboxed execution with security controls
- **Performance Optimization**: Multiple optimization levels (O0-O3)
- **Caching**: Intelligent caching for faster repeated compilations
- **Objective-C Support**: Convert Objective-C code to JavaScript with JIT optimizations
- **Foundation Framework**: Automatic polyfills for iOS Foundation classes
- **Client Library**: Full-featured JavaScript client for easy integration
- **Cross-Platform JIT Conversion**: Convert JIT instructions between platforms
- **Code Analysis**: Performance analysis and optimization suggestions
- **Real-time Analytics**: Performance monitoring and statistics

## 🏗️ Architecture

```
JavaScript Code → JIT Engine → iOS Translator → iOS-Compatible Code
                     ↓              ↓              ↓
                  V8 Optimized   iOS Polyfills   Shortcuts Ready
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/jitphone.git
cd jitphone

# Install dependencies
npm install

# Start the server
npm start
```

### 2. Server Endpoints

The server runs on `http://localhost:3000` and provides these endpoints:

- `GET /health` - Health check and capabilities
- `GET /jit/info` - JIT engine information
- `POST /jit/compile` - Compile JavaScript with JIT optimizations
- `POST /jit/execute` - Execute compiled code

### 3. Basic Usage

#### Compile JavaScript Code

```bash
curl -X POST http://localhost:3000/jit/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
    "optimizationLevel": "O2",
    "target": "shortcuts"
  }'
```

#### Execute Compiled Code

```bash
curl -X POST http://localhost:3000/jit/execute \
  -H "Content-Type: application/json" \
  -d '{
    "compiledCode": "// Your compiled code here",
    "input": { "n": 10 }
  }'
```

## 📱 iOS Shortcuts Integration

### Setting Up Your Shortcut

1. **Open Shortcuts App** on your iOS device
2. **Create New Shortcut**
3. **Add "Get Contents of URL" action**
4. **Configure the request:**

```
URL: http://your-server:3000/jit/compile
Method: POST
Headers: Content-Type: application/json
Request Body: {
  "code": "YOUR_JAVASCRIPT_CODE_HERE",
  "target": "shortcuts",
  "optimizationLevel": "O2"
}
```

5. **Add "Get Value from Dictionary"** to extract the compiled code
6. **Use the result in your workflow**

### Example Shortcut Workflow

```javascript
// Example: Performance-critical calculation
function complexCalculation(data) {
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    result += Math.sin(data[i]) * Math.cos(data[i] * 2);
  }
  return result;
}

// This gets JIT-compiled for maximum performance
complexCalculation([1, 2, 3, 4, 5]);
```

## 🎯 Optimization Levels

| Level | JIT | Optimizations | Use Case |
|-------|-----|---------------|----------|
| O0 | ❌ | None | Development/Debugging |
| O1 | ✅ | Basic (inline, const-fold) | Light optimization |
| O2 | ✅ | Standard (+ dead-code, loop-opt) | **Recommended** |
| O3 | ✅ | Aggressive (+ vectorization) | Maximum performance |

## 🔧 Configuration Options

### Compilation Options

```javascript
{
  "code": "your_javascript_code",
  "optimizationLevel": "O2",        // O0, O1, O2, O3
  "target": "shortcuts",            // shortcuts, webview, jsc
  "timeout": 30000,                 // Compilation timeout (ms)
  "enableJIT": true,                // Enable JIT optimizations
  "preservePerformance": true,      // Maintain performance in translation
  "optimizeForSize": false          // Optimize for code size vs performance
}
```

### Execution Options

```javascript
{
  "compiledCode": "compiled_code_here",
  "input": {},                      // Input data for your code
  "timeout": 10000,                 // Execution timeout (ms)
  "memoryLimit": 134217728,         // Memory limit (128MB)
  "sandbox": true                   // Enable sandboxed execution
}
```

## 🛡️ Security Features

- **Sandboxed Execution**: Code runs in isolated VM contexts
- **API Restrictions**: Dangerous APIs are blocked or replaced
- **Rate Limiting**: Prevents abuse with configurable limits
- **Timeout Protection**: Automatic termination of long-running code
- **Memory Limits**: Prevents memory exhaustion attacks
- **Input Validation**: Comprehensive input sanitization

## 📊 Performance Benefits

### JIT Compilation Advantages

- **2-10x faster execution** for compute-heavy tasks
- **Optimized loops** with unrolling and vectorization  
- **Inline functions** for reduced call overhead
- **Constant folding** eliminates redundant calculations
- **Dead code elimination** reduces runtime overhead

### iOS Adaptation

While iOS doesn't support true JIT compilation, JITPhone provides:
- **Pre-optimized code** structure
- **Reduced interpretation overhead**
- **Efficient algorithm patterns**
- **Memory-conscious implementations**

## 🔍 Monitoring & Debugging

### Server Statistics

```bash
# Check server health
curl http://localhost:3000/health

# Get JIT engine info
curl http://localhost:3000/jit/info
```

### Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All server activity
- `error.log` - Error messages only

## 🚨 Limitations & Considerations

### iOS Restrictions

- No true JIT compilation on iOS (security limitation)
- Limited API access in Shortcuts context
- Code size limits (1MB max)
- Execution time limits (30s max)
- No direct DOM manipulation

### Workarounds Provided

- **API Polyfills**: Safe replacements for restricted APIs
- **ES6+ Transpilation**: Compatibility with older iOS versions
- **Code Optimization**: Size and performance optimizations
- **Error Handling**: Graceful degradation for unsupported features

## 📝 Example Use Cases

### 1. Mathematical Computations

```javascript
// Prime number calculation with JIT optimization
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}
```

### 2. Data Processing

```javascript
// Array processing with vectorization
function processData(data) {
  return data
    .filter(x => x > 0)
    .map(x => Math.sqrt(x))
    .reduce((sum, x) => sum + x, 0);
}
```

### 3. Algorithm Implementation

```javascript
// Sorting algorithm with loop optimizations
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev  # Uses nodemon for auto-restart
```

### Testing

```bash
npm test     # Run test suite
```

### Project Structure

```
jitphone/
├── server.js              # Main server file
├── package.json           # Dependencies
├── src/
│   ├── JITEngine.js      # JIT compilation engine
│   └── IOSTranslator.js  # iOS adaptation layer
├── logs/                 # Server logs
├── examples/             # Usage examples
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 FAQ

**Q: Does this actually enable JIT on iOS?**
A: No, iOS security prevents true JIT compilation. Instead, we pre-optimize code using Node.js JIT and translate it for iOS compatibility.

**Q: Is this safe to use?**  
A: Yes, the server includes comprehensive security measures including sandboxing, rate limiting, and input validation.

**Q: What iOS versions are supported?**
A: iOS 12+ for Shortcuts, iOS 9+ for WebView, iOS 8+ for JavaScriptCore

**Q: Can I host this publicly?**
A: Yes, but ensure proper security measures including HTTPS, authentication, and firewall configuration.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/jitphone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/jitphone/discussions)
- **Email**: support@jitphone.dev

---

**Made with ❤️ for the iOS development community**

## Objective-C to JavaScript Conversion

JITPhone now supports converting Objective-C code to JavaScript, enabling you to run native iOS code patterns in JavaScript environments with JIT optimizations.

### Supported Objective-C Features

- **Variable Declarations**: `NSString`, `NSInteger`, `BOOL`, etc.
- **Class Interfaces**: `@interface` and `@property` declarations
- **Class Implementations**: `@implementation` with method bodies
- **Protocols**: `@protocol` declarations with method requirements
- **Categories**: Class extensions via `@interface Class (Category)`
- **Foundation Types**: `NSArray`, `NSDictionary`, `NSString`, etc.
- **Method Implementations**: Complex method bodies with proper parsing
- **Properties**: `@property` with getters/setters and `@synthesize`
- **Literals**: String literals (`@"text"`), array literals (`@[...]`), dictionary literals (`@{...}`)
- **Method Calls**: All forms of Objective-C message passing
- **Memory Management**: ARC patterns and property attributes
- **Blocks**: Basic block syntax conversion
- **Auto-Detection**: Automatic language detection
- **Foundation Polyfills**: JavaScript equivalents for Foundation framework

### Swift to JavaScript Conversion

JITPhone also supports converting Swift code to JavaScript, bringing modern Swift language features to JavaScript environments with JIT optimizations.

### Supported Swift Features

- **Variable Declarations**: `let`, `var` with type inference
- **Classes**: Full class definitions with inheritance
- **Structs**: Value types converted to JavaScript classes
- **Enums**: Enumeration types with raw values
- **Protocols**: Protocol definitions and conformance
- **Extensions**: Type extensions and protocol conformance
- **Functions**: Functions with parameters and return types
- **Initializers**: `init` methods with custom parameters
- **Properties**: Stored and computed properties with getters/setters
- **Optionals**: Optional chaining (`?.`) and nil coalescing (`??`)
- **Guard Statements**: Swift guard converted to JavaScript if statements
- **String Interpolation**: `\(variable)` converted to template literals
- **Closures**: Basic closure syntax conversion
- **Error Handling**: `do-try-catch` and `throws` functions
- **Control Flow**: `if let`, `guard let` binding
- **Auto-Detection**: Automatic Swift language detection
- **Type Safety**: Swift type system mapped to JavaScript equivalents
- **Foundation Support**: Swift standard library polyfills

### Quick Start with Objective-C

```bash
# Run the Objective-C demo
npm run demo-objc

# Run comprehensive Objective-C examples
npm run objc
```

### Quick Start with Swift

```bash
# Run the Swift demo
npm run demo-swift

# Run comprehensive Swift examples
npm run swift
```

### Objective-C Examples

#### Enhanced Class Implementation

```objective-c
// Objective-C
@interface Calculator : NSObject
@property (nonatomic, assign) NSInteger result;
- (instancetype)initWithInitialValue:(NSInteger)value;
- (void)add:(NSInteger)value;
- (void)multiply:(NSInteger)value;
- (NSInteger)getResult;
@end

@implementation Calculator
- (instancetype)initWithInitialValue:(NSInteger)value {
    self = [super init];
    if (self) {
        _result = value;
    }
    return self;
}

- (void)add:(NSInteger)value {
    self.result += value;
    NSLog(@"Added %ld, result: %ld", (long)value, (long)self.result);
}

- (void)multiply:(NSInteger)value {
    self.result *= value;
    NSLog(@"Multiplied by %ld, result: %ld", (long)value, (long)self.result);
}

- (NSInteger)getResult {
    return self.result;
}
@end
```

Converts to:

```javascript
// JavaScript
class Calculator {
  constructor(value = 0) {
    this.result = value;
  }

  add(value) {
    this.result += value;
    console.log(`Added ${value}, result: ${this.result}`);
  }

  multiply(value) {
    this.result *= value;
    console.log(`Multiplied by ${value}, result: ${this.result}`);
  }

  getResult() {
    return this.result;
  }
}
```

#### Protocol and Category Support

```objective-c
// Objective-C Protocol
@protocol Drawable
- (void)draw;
- (NSString *)description;
@end

// Category Extension
@interface NSString (Utilities)
- (BOOL)isValidEmail;
- (NSString *)reversed;
@end

@implementation NSString (Utilities)
- (BOOL)isValidEmail {
    return [self containsString:@"@"];
}

- (NSString *)reversed {
    // Implementation here
    return reversedString;
}
@end
```

### Swift Examples

#### Basic Swift Class

```swift
// Swift
class Calculator {
    var result: Int
    
    init(initialValue: Int = 0) {
        self.result = initialValue
    }
    
    func add(_ value: Int) {
        result += value
        print("Added \(value), result is now \(result)")
    }
    
    func multiply(by value: Int) {
        result *= value
        print("Multiplied by \(value), result is now \(result)")
    }
    
    func getResult() -> Int {
        return result
    }
}
```

Converts to:

```javascript
// JavaScript
class Calculator {
  constructor(initialValue = 0) {
    this.result = initialValue;
  }

  add(value) {
    this.result += value;
    console.log(`Added ${value}, result is now ${this.result}`);
  }

  multiplyBy(value) {
    this.result *= value;
    console.log(`Multiplied by ${value}, result is now ${this.result}`);
  }

  getResult() {
    return this.result;
  }
}
```

#### Swift Struct and Protocols

```swift
// Swift
protocol Drawable {
    func draw() -> String
    var area: Double { get }
}

struct Rectangle: Drawable {
    var width: Double
    var height: Double
    
    func draw() -> String {
        return "Drawing rectangle \(width)x\(height)"
    }
    
    var area: Double {
        return width * height
    }
}

extension Rectangle {
    func perimeter() -> Double {
        return 2 * (width + height)
    }
    
    func isSquare() -> Bool {
        return width == height
    }
}
```

#### Swift Optionals and Error Handling

```swift
// Swift
enum ValidationError: Error {
    case invalidEmail
    case tooShort
}

class UserValidator {
    func validateEmail(_ email: String) throws -> Bool {
        guard !email.isEmpty else {
            throw ValidationError.tooShort
        }
        
        guard email.contains("@") else {
            throw ValidationError.invalidEmail
        }
        
        return true
    }
    
    func processUser(name: String?, email: String) -> String {
        guard let userName = name, !userName.isEmpty else {
            return "Invalid name"
        }
        
        do {
            try validateEmail(email)
            return "User \(userName) validated successfully"
        } catch ValidationError.invalidEmail {
            return "Invalid email format"
        } catch ValidationError.tooShort {
            return "Email too short"
        } catch {
            return "Unknown error"
        }
    }
}
```

### Using the Client Library with Objective-C and Swift

```javascript
const { JITPhoneClient, JITPhoneUtils } = require('jitphone-client');

const client = new JITPhoneClient();

// Convert Objective-C to JavaScript
const objcCode = `
  @interface Calculator : NSObject
  @property (nonatomic, assign) NSInteger result;
  - (void)add:(NSInteger)value;
  @end
`;

// Method 1: Convert only
const objcConverted = await client.convertObjectiveC(objcCode);
console.log('JavaScript:', objcConverted.result.code);

// Method 2: Convert and compile with JIT optimizations
const objcCompiled = await client.compileObjectiveC(objcCode, {
  optimizationLevel: 'O3',
  target: 'shortcuts'
});

// Method 3: Convert, compile, and execute
const objcResult = await client.runObjectiveC(objcCode);

// Swift conversion and compilation
const swiftCode = `
  struct Point {
      var x: Double
      var y: Double
      
      func distance() -> Double {
          return sqrt(x * x + y * y)
      }
  }
`;

// Convert Swift to JavaScript
const swiftConverted = await client.convertSwift(swiftCode);
console.log('JavaScript:', swiftConverted.result.code);

// Compile Swift with JIT optimizations
const swiftCompiled = await client.compileSwift(swiftCode, {
  optimizationLevel: 'O2',
  target: 'shortcuts'
});

// Run Swift code directly
const swiftResult = await client.runSwift(swiftCode);

// Auto-detection for mixed codebases
if (JITPhoneUtils.isObjectiveC(someCode)) {
  const result = await client.compile(someCode, { language: 'objectivec' });
} else if (JITPhoneUtils.isSwift(someCode)) {
  const result = await client.compile(someCode, { language: 'swift' });
}
```

### API Endpoints for Objective-C and Swift

```bash
# Convert Objective-C to JavaScript
curl -X POST http://localhost:3000/jit/convert-objc \
  -H "Content-Type: application/json" \
  -d '{"code": "NSString *msg = @\"Hello\";", "enableFoundationPolyfills": true}'

# Convert Swift to JavaScript
curl -X POST http://localhost:3000/jit/convert-swift \
  -H "Content-Type: application/json" \
  -d '{"code": "let message = \"Hello Swift!\"", "enableFoundationPolyfills": true}'

# Compile Objective-C with JIT optimizations
curl -X POST http://localhost:3000/jit/compile \
  -H "Content-Type: application/json" \
  -d '{"code": "NSString *msg = @\"Hello\";", "language": "objectivec", "optimizationLevel": "O2"}'

# Compile Swift with JIT optimizations
curl -X POST http://localhost:3000/jit/compile \
  -H "Content-Type: application/json" \
  -d '{"code": "let x = 42", "language": "swift", "optimizationLevel": "O2"}'

# Convert via JIT instruction converter
curl -X POST http://localhost:3000/jit/convert \
  -H "Content-Type: application/json" \
  -d '{"instructions": "let x = 42", "sourceFormat": "swift"}'
```

### Language Detection and Validation

```javascript
const { JITPhoneUtils } = require('jitphone-client');

// Objective-C detection and validation
const objcCode = `
  @interface MyClass : NSObject
  @property (nonatomic, strong) NSString *name;
  @end
`;

if (JITPhoneUtils.isObjectiveC(objcCode)) {
  const validation = JITPhoneUtils.validateObjectiveC(objcCode);
  console.log('Valid Objective-C:', validation.valid);
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}

// Swift detection and validation
const swiftCode = `
  struct Point {
      var x: Double
      var y: Double
  }
`;

if (JITPhoneUtils.isSwift(swiftCode)) {
  const validation = JITPhoneUtils.validateSwift(swiftCode);
  console.log('Valid Swift:', validation.valid);
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}
```

### Template Generation

```javascript
// Generate Objective-C templates
const objcClass = JITPhoneUtils.generateObjectiveCClass('DataProcessor', 'NSObject');
const objcFunction = JITPhoneUtils.generateObjectiveCFunction('processData', 'NSArray*', [
  { type: 'NSArray*', name: 'input' }
]);

// Generate Swift templates
const swiftClass = JITPhoneUtils.generateSwiftClass('NetworkManager', 'NSObject', ['URLSessionDelegate']);
const swiftStruct = JITPhoneUtils.generateSwiftStruct('User', [
  { name: 'id', type: 'String' },
  { name: 'name', type: 'String' }
]);
const swiftFunction = JITPhoneUtils.generateSwiftFunction('calculateArea', [
  { name: 'width', type: 'Double' },
  { name: 'height', type: 'Double' }
], 'Double');
```

### Performance Analysis and Suggestions

```javascript
// Get Objective-C specific suggestions
const objcSuggestions = JITPhoneUtils.getFoundationSuggestions(objcCode);
objcSuggestions.forEach(suggestion => {
  console.log(`${suggestion.type}: ${suggestion.message}`);
});

// Get Swift specific suggestions
const swiftSuggestions = JITPhoneUtils.getSwiftSuggestions(swiftCode);
swiftSuggestions.forEach(suggestion => {
  console.log(`${suggestion.type}: ${suggestion.message}`);
});

// Generate performance tests
const objcPerfTest = JITPhoneUtils.generateObjectiveCPerformanceTest(objcOperation, 1000);
const swiftPerfTest = JITPhoneUtils.generateSwiftPerformanceTest(swiftOperation, 1000);
```

### Advanced Features

#### Protocol and Extension Support

Both Objective-C protocols and Swift protocols are converted to JavaScript mixins and interfaces, enabling similar design patterns in JavaScript.

#### Foundation Framework Integration

- **Objective-C**: Full NSFoundation class mappings and method conversions
- **Swift**: Standard library extensions and type mappings
- **Automatic Polyfills**: JavaScript equivalents for common framework methods

#### Modern Language Features

- **Swift Optionals**: Converted to nullable JavaScript types with safe access patterns
- **String Interpolation**: Template literal conversion
- **Guard Statements**: Early return pattern conversion
- **Error Handling**: try-catch pattern mapping
- **Closures**: Arrow function conversion with proper scope handling

#### IDE Integration Ready

The conversion system provides rich metadata and suggestions suitable for integration into development environments and build systems. 