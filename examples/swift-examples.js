/**
 * JITPhone Swift to JavaScript Conversion Examples
 * Shows how to convert and execute Swift code using the JITPhone server
 */

const { JITPhoneClient, JITPhoneUtils } = require('../client/jitphone-client');

// Example 1: Basic Swift Class Conversion
async function basicSwiftClassExample() {
  console.log('=== Basic Swift Class Conversion ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    class Calculator {
        var result: Int
        
        init(initialValue: Int = 0) {
            self.result = initialValue
        }
        
        func add(_ value: Int) {
            result += value
            print("Added \\(value), result is now \\(result)")
        }
        
        func multiply(by value: Int) {
            result *= value
            print("Multiplied by \\(value), result is now \\(result)")
        }
        
        func getResult() -> Int {
            return result
        }
    }
  `;

  try {
    const result = await client.convertSwift(swiftCode);
    console.log('Conversion successful!');
    console.log('Generated JavaScript:');
    console.log(result.result.code.substring(0, 500) + '...');
    console.log('\nMetadata:', result.result.metadata);

  } catch (error) {
    console.error('Conversion failed:', error.message);
  }
}

// Example 2: Swift Struct with Properties
async function swiftStructExample() {
  console.log('\n=== Swift Struct Conversion ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    struct Person {
        var name: String
        var age: Int
        let id: String
        
        init(name: String, age: Int, id: String) {
            self.name = name
            self.age = age
            self.id = id
        }
        
        func greet() -> String {
            return "Hello, I'm \\(name) and I'm \\(age) years old"
        }
        
        mutating func celebrate() {
            age += 1
            print("Happy birthday! Now \\(age) years old")
        }
    }
  `;

  try {
    const result = await client.compileSwift(swiftCode, {
      optimizationLevel: 'O2',
      target: 'shortcuts'
    });

    console.log('Compilation successful!');
    console.log('JIT optimizations applied:', result.result.metadata.optimizations);
    console.log('Swift conversion metadata:', result.result.metadata.swiftConversion || 'Available');

  } catch (error) {
    console.error('Compilation failed:', error.message);
  }
}

// Example 3: Swift Enum and Optional Handling
async function swiftEnumExample() {
  console.log('\n=== Swift Enum and Optional Handling ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    enum Color: String {
        case red = "red"
        case green = "green"
        case blue = "blue"
        
        func description() -> String {
            return "Color: \\(self.rawValue)"
        }
    }
    
    class ColoredShape {
        var color: Color?
        var name: String
        
        init(name: String, color: Color? = nil) {
            self.name = name
            self.color = color
        }
        
        func describe() -> String {
            if let color = color {
                return "\\(name) with \\(color.description())"
            } else {
                return "\\(name) with no color"
            }
        }
        
        func setColor(_ newColor: Color) {
            color = newColor
        }
    }
  `;

  try {
    const result = await client.convertSwift(swiftCode, {
      enableFoundationPolyfills: true
    });

    console.log('Enum and optional conversion successful!');
    console.log('Classes found:', result.result.metadata.classes);
    console.log('Enums found:', result.result.metadata.enums || 0);
    
    if (result.result.warnings && result.result.warnings.length > 0) {
      console.log('Warnings:', result.result.warnings);
    }

  } catch (error) {
    console.error('Enum conversion failed:', error.message);
  }
}

// Example 4: Swift Protocol and Extension
async function swiftProtocolExtensionExample() {
  console.log('\n=== Swift Protocol and Extension ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    protocol Drawable {
        func draw() -> String
        var area: Double { get }
    }
    
    struct Rectangle: Drawable {
        var width: Double
        var height: Double
        
        func draw() -> String {
            return "Drawing rectangle \\(width)x\\(height)"
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
  `;

  try {
    const result = await client.runSwift(swiftCode);
    console.log('Protocol and extension execution successful!');
    console.log('Result:', result.result);

  } catch (error) {
    console.error('Protocol execution failed:', error.message);
  }
}

// Example 5: Swift Closures and Functional Programming
async function swiftClosuresExample() {
  console.log('\n=== Swift Closures and Functional Programming ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    func processNumbers() {
        let numbers = [1, 2, 3, 4, 5]
        
        let doubled = numbers.map { $0 * 2 }
        let filtered = numbers.filter { $0 > 2 }
        let sum = numbers.reduce(0) { $0 + $1 }
        
        print("Original: \\(numbers)")
        print("Doubled: \\(doubled)")
        print("Filtered (>2): \\(filtered)")
        print("Sum: \\(sum)")
        
        let customOperation = { (a: Int, b: Int) -> Int in
            return a * b + 1
        }
        
        let result = customOperation(3, 4)
        print("Custom operation result: \\(result)")
    }
  `;

  try {
    const result = await client.compileSwift(swiftCode, {
      optimizationLevel: 'O3'
    });

    console.log('Closures compilation successful!');
    console.log('Optimizations applied:', result.result.metadata.optimizations);

  } catch (error) {
    console.error('Closures compilation failed:', error.message);
  }
}

// Example 6: Swift Guard and Error Handling
async function swiftGuardErrorExample() {
  console.log('\n=== Swift Guard and Error Handling ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    enum ValidationError: Error {
        case invalidEmail
        case tooShort
        case tooLong
    }
    
    class UserValidator {
        func validateEmail(_ email: String) throws -> Bool {
            guard !email.isEmpty else {
                throw ValidationError.tooShort
            }
            
            guard email.count <= 100 else {
                throw ValidationError.tooLong
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
                return "User \\(userName) validated successfully"
            } catch ValidationError.invalidEmail {
                return "Invalid email format"
            } catch ValidationError.tooShort {
                return "Email too short"
            } catch ValidationError.tooLong {
                return "Email too long"
            } catch {
                return "Unknown error"
            }
        }
    }
  `;

  try {
    const result = await client.convertSwift(swiftCode);
    console.log('Guard and error handling conversion successful!');
    console.log('Classes converted:', result.result.metadata.classes);

  } catch (error) {
    console.error('Guard/error conversion failed:', error.message);
  }
}

// Example 7: Auto-Detection and Validation
async function swiftAutoDetectionExample() {
  console.log('\n=== Swift Auto-Detection and Validation ===');
  
  const client = new JITPhoneClient();

  const swiftCode = `
    struct Point {
        var x: Double
        var y: Double
        
        func distance(to other: Point) -> Double {
            let dx = x - other.x
            let dy = y - other.y
            return sqrt(dx * dx + dy * dy)
        }
    }
  `;

  // Test auto-detection
  const isSwift = JITPhoneUtils.isSwift(swiftCode);
  console.log('Code detected as Swift:', isSwift);

  if (isSwift) {
    const validation = JITPhoneUtils.validateSwift(swiftCode);
    console.log('Valid:', validation.valid);
    console.log('Errors:', validation.errors);
    console.log('Warnings:', validation.warnings);

    if (validation.valid) {
      try {
        const result = await client.compile(swiftCode, {
          language: 'swift',
          optimizationLevel: 'O2'
        });

        console.log('Auto-detected compilation successful!');
        console.log('Source language:', result.result.metadata.sourceLanguage);

      } catch (error) {
        console.error('Auto-detected compilation failed:', error.message);
      }
    }
  }
}

// Example 8: Basic Conversion Utility
async function basicSwiftConversionExample() {
  console.log('\n=== Basic Swift Conversion Utility ===');

  const simpleSwiftCode = `
    let message = "Hello Swift!"
    var count = 42
    let isActive = true
    print("Message: \\(message), Count: \\(count), Active: \\(isActive)")
  `;

  // Use utility for basic conversion
  const basicConverted = JITPhoneUtils.convertSwiftBasics(simpleSwiftCode);
  console.log('Basic conversion result:');
  console.log(basicConverted);

  // Test with server for full conversion
  const client = new JITPhoneClient();
  
  try {
    const serverResult = await client.convertSwift(simpleSwiftCode);
    console.log('\nServer conversion successful!');
    console.log('Full converted code (last 10 lines):');
    const lines = serverResult.result.code.split('\n');
    console.log(lines.slice(-10).join('\n'));

  } catch (error) {
    console.error('Server conversion failed:', error.message);
  }
}

// Example 9: Template Generation
async function swiftTemplateGenerationExample() {
  console.log('\n=== Swift Template Generation ===');

  // Generate class template
  const classTemplate = JITPhoneUtils.generateSwiftClass('NetworkManager', 'NSObject', ['URLSessionDelegate']);
  console.log('Generated class template:');
  console.log(classTemplate.substring(0, 300) + '...');

  // Generate struct template
  const structTemplate = JITPhoneUtils.generateSwiftStruct('User', [
    { name: 'id', type: 'String' },
    { name: 'name', type: 'String' },
    { name: 'email', type: 'String' }
  ]);
  console.log('\nGenerated struct template:');
  console.log(structTemplate);

  // Generate function template
  const functionTemplate = JITPhoneUtils.generateSwiftFunction('calculateDistance', [
    { name: 'from', type: 'Point' },
    { name: 'to', type: 'Point' }
  ], 'Double');
  console.log('\nGenerated function template:');
  console.log(functionTemplate);

  // Test the generated code
  const client = new JITPhoneClient();
  
  try {
    const result = await client.convertSwift(classTemplate);
    console.log('\nTemplate conversion successful!');
    console.log('Classes found:', result.result.metadata.classes);

  } catch (error) {
    console.error('Template conversion failed:', error.message);
  }
}

// Example 10: Performance Testing
async function swiftPerformanceTestExample() {
  console.log('\n=== Swift Performance Testing ===');
  
  const client = new JITPhoneClient();

  // Generate performance test code
  const simpleOperation = `
    var sum = 0
    for i in 0..<1000 {
        sum += i * i
    }
  `;

  const perfTestCode = JITPhoneUtils.generateSwiftPerformanceTest(simpleOperation, 100);
  
  try {
    const result = await client.compileSwift(perfTestCode, {
      optimizationLevel: 'O3'
    });

    console.log('Performance test compiled successfully!');
    console.log('Optimizations applied:', result.result.metadata.optimizations);

    // Analyze the original code complexity
    const complexity = JITPhoneUtils.analyzeComplexity(simpleOperation);
    console.log('Code complexity analysis:', complexity);

    // Get Swift-specific suggestions
    const suggestions = JITPhoneUtils.getSwiftSuggestions(simpleOperation);
    console.log('Swift suggestions:', suggestions);

  } catch (error) {
    console.error('Performance test failed:', error.message);
  }
}

// Example 11: Mixed Language Detection
async function mixedLanguageDetectionExample() {
  console.log('\n=== Mixed Language Detection ===');

  const codes = [
    'let x = 42\nprint("Hello Swift")',  // Swift
    'NSString *msg = @"Hello";',         // Objective-C
    'function test() { return 42; }'     // JavaScript
  ];

  for (const [index, code] of codes.entries()) {
    console.log(`\nCode ${index + 1}:`);
    console.log(code);
    
    const isSwift = JITPhoneUtils.isSwift(code);
    const isObjC = JITPhoneUtils.isObjectiveC(code);
    
    console.log(`Swift: ${isSwift}, Objective-C: ${isObjC}`);
    
    if (isSwift) {
      console.log('Detected as Swift - would use Swift converter');
    } else if (isObjC) {
      console.log('Detected as Objective-C - would use Objective-C converter');
    } else {
      console.log('Detected as JavaScript - would use direct compilation');
    }
  }
}

// Run all examples
async function runAllSwiftExamples() {
  console.log('🚀 JITPhone Swift Conversion Examples\n');
  
  try {
    await basicSwiftClassExample();
    await swiftStructExample();
    await swiftEnumExample();
    await swiftProtocolExtensionExample();
    await swiftClosuresExample();
    await swiftGuardErrorExample();
    await swiftAutoDetectionExample();
    await basicSwiftConversionExample();
    await swiftTemplateGenerationExample();
    await swiftPerformanceTestExample();
    await mixedLanguageDetectionExample();
    
    console.log('\n✅ All Swift examples completed!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicSwiftClassExample,
    swiftStructExample,
    swiftEnumExample,
    swiftProtocolExtensionExample,
    swiftClosuresExample,
    swiftGuardErrorExample,
    swiftAutoDetectionExample,
    basicSwiftConversionExample,
    swiftTemplateGenerationExample,
    swiftPerformanceTestExample,
    mixedLanguageDetectionExample,
    runAllSwiftExamples
  };
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllSwiftExamples().catch(console.error);
} 