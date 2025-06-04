/**
 * JITPhone Objective-C to JavaScript Conversion Examples
 * Shows how to convert and execute Objective-C code using the JITPhone server
 */

const { JITPhoneClient, JITPhoneUtils } = require('../client/jitphone-client');

// Example 1: Basic Objective-C Class Conversion
async function basicClassExample() {
  console.log('=== Basic Objective-C Class Conversion ===');
  
  const client = new JITPhoneClient();

  const objectiveCCode = `
    @interface Calculator : NSObject
    @property (nonatomic, assign) NSInteger result;
    - (instancetype)init;
    - (void)add:(NSInteger)value;
    - (void)multiply:(NSInteger)value;
    - (NSInteger)getResult;
    @end

    @implementation Calculator
    - (instancetype)init {
        self = [super init];
        if (self) {
            _result = 0;
        }
        return self;
    }

    - (void)add:(NSInteger)value {
        self.result += value;
        NSLog(@"Added %ld, result is now %ld", (long)value, (long)self.result);
    }

    - (void)multiply:(NSInteger)value {
        self.result *= value;
        NSLog(@"Multiplied by %ld, result is now %ld", (long)value, (long)self.result);
    }

    - (NSInteger)getResult {
        return self.result;
    }
    @end
  `;

  try {
    const result = await client.convertObjectiveC(objectiveCCode);
    console.log('Conversion successful!');
    console.log('Generated JavaScript:');
    console.log(result.result.code.substring(0, 500) + '...');
    console.log('\nMetadata:', result.result.metadata);

  } catch (error) {
    console.error('Conversion failed:', error.message);
  }
}

// Example 2: Simple Objective-C Function
async function simpleFunctionExample() {
  console.log('\n=== Simple Objective-C Function ===');
  
  const client = new JITPhoneClient();

  const objectiveCCode = `
    NSInteger fibonacci(NSInteger n) {
        if (n <= 1) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    void testFibonacci() {
        for (NSInteger i = 0; i < 10; i++) {
            NSInteger result = fibonacci(i);
            NSLog(@"fibonacci(%ld) = %ld", (long)i, (long)result);
        }
    }
  `;

  try {
    // Convert and compile with JIT optimizations
    const result = await client.compileObjectiveC(objectiveCCode, {
      optimizationLevel: 'O3',
      target: 'shortcuts'
    });

    console.log('Compilation successful!');
    console.log('JIT optimizations applied:', result.result.metadata.optimizations);
    console.log('Objective-C conversion metadata:', result.result.metadata.objectiveCConversion);

  } catch (error) {
    console.error('Compilation failed:', error.message);
  }
}

// Example 3: Foundation Framework Usage
async function foundationFrameworkExample() {
  console.log('\n=== Foundation Framework Usage ===');
  
  const client = new JITPhoneClient();

  const objectiveCCode = `
    @interface Person : NSObject
    @property (nonatomic, strong) NSString *name;
    @property (nonatomic, strong) NSArray *hobbies;
    @property (nonatomic, assign) NSInteger age;
    - (instancetype)initWithName:(NSString *)name age:(NSInteger)age;
    - (void)addHobby:(NSString *)hobby;
    - (NSString *)description;
    @end

    @implementation Person
    - (instancetype)initWithName:(NSString *)name age:(NSInteger)age {
        self = [super init];
        if (self) {
            _name = name;
            _age = age;
            _hobbies = @[];
        }
        return self;
    }

    - (void)addHobby:(NSString *)hobby {
        NSMutableArray *mutableHobbies = [self.hobbies mutableCopy];
        [mutableHobbies addObject:hobby];
        self.hobbies = [mutableHobbies copy];
        NSLog(@"Added hobby: %@", hobby);
    }

    - (NSString *)description {
        return [NSString stringWithFormat:@"Person: %@ (age %ld), hobbies: %@", 
                self.name, (long)self.age, self.hobbies];
    }
    @end
  `;

  try {
    const result = await client.convertObjectiveC(objectiveCCode, {
      enableFoundationPolyfills: true
    });

    console.log('Foundation framework conversion successful!');
    console.log('Classes found:', result.result.metadata.classes);
    console.log('Methods converted:', result.result.metadata.methods);
    
    if (result.result.warnings && result.result.warnings.length > 0) {
      console.log('Warnings:', result.result.warnings);
    }

  } catch (error) {
    console.error('Foundation conversion failed:', error.message);
  }
}

// Example 4: Method Call Patterns
async function methodCallExample() {
  console.log('\n=== Method Call Patterns ===');
  
  const client = new JITPhoneClient();

  const objectiveCCode = `
    void demonstrateMethodCalls() {
        // String operations
        NSString *greeting = @"Hello";
        NSString *name = @"World";
        NSString *message = [NSString stringWithFormat:@"%@ %@!", greeting, name];
        NSLog(@"Message: %@", message);

        // Array operations
        NSArray *numbers = @[@1, @2, @3, @4, @5];
        NSInteger count = [numbers count];
        NSNumber *firstNumber = [numbers objectAtIndex:0];
        NSLog(@"First number: %@, total count: %ld", firstNumber, (long)count);

        // Dictionary operations
        NSDictionary *info = @{@"name": @"John", @"age": @30};
        NSString *personName = [info objectForKey:@"name"];
        NSLog(@"Person name: %@", personName);
    }
  `;

  try {
    const result = await client.runObjectiveC(objectiveCCode);
    console.log('Execution successful!');
    console.log('Result:', result.result);

  } catch (error) {
    console.error('Execution failed:', error.message);
  }
}

// Example 5: Performance Testing
async function performanceTestExample() {
  console.log('\n=== Performance Testing ===');
  
  const client = new JITPhoneClient();

  // Generate performance test code
  const simpleOperation = `
    NSInteger sum = 0;
    for (NSInteger i = 0; i < 1000; i++) {
        sum += i;
    }
  `;

  const perfTestCode = JITPhoneUtils.generateObjectiveCPerformanceTest(simpleOperation, 100);
  
  try {
    const result = await client.compileObjectiveC(perfTestCode, {
      optimizationLevel: 'O3'
    });

    console.log('Performance test compiled successfully!');
    console.log('Optimizations applied:', result.result.metadata.optimizations);

    // Analyze the original code complexity
    const complexity = JITPhoneUtils.analyzeComplexity(simpleOperation);
    console.log('Code complexity analysis:', complexity);

  } catch (error) {
    console.error('Performance test failed:', error.message);
  }
}

// Example 6: Validation and Suggestions
async function validationExample() {
  console.log('\n=== Code Validation and Suggestions ===');

  const validCode = `
    @interface MyClass : NSObject
    @property (nonatomic, strong) NSString *title;
    - (void)doSomething;
    @end

    @implementation MyClass
    - (void)doSomething {
        NSLog(@"Doing something...");
    }
    @end
  `;

  const invalidCode = `
    @interface BrokenClass : NSObject
    - (void)missingImplementation;
    @end
    
    @implementation BrokenClass
    - (void)anotherMethod {
        NSLog(@"This method wasn't declared");
        // Missing closing bracket
  `;

  // Test validation
  console.log('Validating correct code:');
  const validResult = JITPhoneUtils.validateObjectiveC(validCode);
  console.log('Valid:', validResult.valid);
  console.log('Errors:', validResult.errors);
  console.log('Warnings:', validResult.warnings);

  console.log('\nValidating incorrect code:');
  const invalidResult = JITPhoneUtils.validateObjectiveC(invalidCode);
  console.log('Valid:', invalidResult.valid);
  console.log('Errors:', invalidResult.errors);
  console.log('Warnings:', invalidResult.warnings);

  // Test Foundation suggestions
  const foundationCode = `
    NSMutableArray *array = [[NSMutableArray alloc] init];
    NSString *formatted = [NSString stringWithFormat:@"Hello %@", name];
    [object retain];
  `;

  console.log('\nFoundation framework suggestions:');
  const suggestions = JITPhoneUtils.getFoundationSuggestions(foundationCode);
  suggestions.forEach(suggestion => {
    console.log(`- ${suggestion.type}: ${suggestion.message}`);
  });
}

// Example 7: Auto-Detection and Conversion
async function autoDetectionExample() {
  console.log('\n=== Auto-Detection and Conversion ===');
  
  const client = new JITPhoneClient();

  const mixedCode = `
    @interface Calculator : NSObject
    - (NSInteger)addNumbers:(NSInteger)a and:(NSInteger)b;
    @end

    @implementation Calculator
    - (NSInteger)addNumbers:(NSInteger)a and:(NSInteger)b {
        return a + b;
    }
    @end
  `;

  // Test auto-detection
  const isObjC = JITPhoneUtils.isObjectiveC(mixedCode);
  console.log('Code detected as Objective-C:', isObjC);

  if (isObjC) {
    try {
      // Use the general compile method with auto-detected language
      const result = await client.compile(mixedCode, {
        language: 'objectivec',
        optimizationLevel: 'O2'
      });

      console.log('Auto-detected compilation successful!');
      console.log('Source language:', result.result.metadata.sourceLanguage);

    } catch (error) {
      console.error('Auto-detected compilation failed:', error.message);
    }
  }
}

// Example 8: Basic Conversion Utility
async function basicConversionExample() {
  console.log('\n=== Basic Conversion Utility ===');

  const simpleObjCCode = `
    NSString *message = @"Hello World";
    BOOL isValid = YES;
    NSLog(@"Message: %@, Valid: %@", message, isValid ? @"YES" : @"NO");
  `;

  // Use utility for basic conversion
  const basicConverted = JITPhoneUtils.convertObjectiveCBasics(simpleObjCCode);
  console.log('Basic conversion result:');
  console.log(basicConverted);

  // Test with server for full conversion
  const client = new JITPhoneClient();
  
  try {
    const serverResult = await client.convertObjectiveC(simpleObjCCode);
    console.log('\nServer conversion successful!');
    console.log('Full converted code:');
    console.log(serverResult.result.code);

  } catch (error) {
    console.error('Server conversion failed:', error.message);
  }
}

// Example 9: Template Generation
async function templateGenerationExample() {
  console.log('\n=== Template Generation ===');

  // Generate class template
  const classTemplate = JITPhoneUtils.generateObjectiveCClass('MyCustomClass', 'UIViewController');
  console.log('Generated class template:');
  console.log(classTemplate.substring(0, 300) + '...');

  // Generate function template
  const functionTemplate = JITPhoneUtils.generateObjectiveCFunction('calculateSum', 'NSInteger', [
    { type: 'NSInteger', name: 'a' },
    { type: 'NSInteger', name: 'b' }
  ]);
  console.log('\nGenerated function template:');
  console.log(functionTemplate);

  // Test the generated code
  const client = new JITPhoneClient();
  
  try {
    const result = await client.convertObjectiveC(classTemplate);
    console.log('\nTemplate conversion successful!');
    console.log('Classes found:', result.result.metadata.classes);

  } catch (error) {
    console.error('Template conversion failed:', error.message);
  }
}

// Run all examples
async function runAllObjectiveCExamples() {
  console.log('🚀 JITPhone Objective-C Conversion Examples\n');
  
  try {
    await basicClassExample();
    await simpleFunctionExample();
    await foundationFrameworkExample();
    await methodCallExample();
    await performanceTestExample();
    await validationExample();
    await autoDetectionExample();
    await basicConversionExample();
    await templateGenerationExample();
    
    console.log('\n✅ All Objective-C examples completed!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicClassExample,
    simpleFunctionExample,
    foundationFrameworkExample,
    methodCallExample,
    performanceTestExample,
    validationExample,
    autoDetectionExample,
    basicConversionExample,
    templateGenerationExample,
    runAllObjectiveCExamples
  };
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllObjectiveCExamples().catch(console.error);
} 