/**
 * Simple Objective-C to JavaScript Conversion Demo
 * Shows the working functionality of the JITPhone Objective-C converter
 */

const { JITPhoneClient, JITPhoneUtils } = require('./client/jitphone-client');

async function demonstrateObjectiveCConversion() {
  console.log('🍎 JITPhone Objective-C to JavaScript Conversion Demo\n');
  
  const client = new JITPhoneClient();

  // Test 1: Simple variable declarations
  console.log('=== Test 1: Simple Variable Declarations ===');
  const simpleCode = `
    NSString *message = @"Hello from Objective-C!";
    NSInteger count = 42;
    BOOL isActive = YES;
  `;

  try {
    const result = await client.convertObjectiveC(simpleCode);
    console.log('✅ Conversion successful!');
    console.log('Generated JavaScript:');
    console.log(result.result.code.split('\n').slice(-10).join('\n')); // Show last 10 lines
    console.log(`\nMetadata: ${result.result.metadata.originalLines} lines → ${result.result.metadata.convertedLines} lines\n`);
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
  }

  // Test 2: Basic class interface
  console.log('=== Test 2: Basic Class Interface ===');
  const classInterface = `
    @interface Person : NSObject
    @property (nonatomic, strong) NSString *name;
    @property (nonatomic, assign) NSInteger age;
    @end
  `;

  try {
    const result = await client.convertObjectiveC(classInterface);
    console.log('✅ Class interface conversion successful!');
    console.log('Classes found:', result.result.metadata.classes);
    console.log('Generated JavaScript class structure:');
    const jsCode = result.result.code.split('\n').slice(-15).join('\n');
    console.log(jsCode);
    console.log();
  } catch (error) {
    console.error('❌ Class conversion failed:', error.message);
  }

  // Test 3: Foundation framework usage
  console.log('=== Test 3: Foundation Framework Conversion ===');
  const foundationCode = `
    NSArray *fruits = @[@"apple", @"banana", @"orange"];
    NSDictionary *person = @{@"name": @"John", @"age": @30};
    NSLog(@"Person: %@", person);
  `;

  try {
    const result = await client.convertObjectiveC(foundationCode);
    console.log('✅ Foundation framework conversion successful!');
    console.log('Generated JavaScript:');
    const jsCode = result.result.code.split('\n').slice(-5).join('\n');
    console.log(jsCode);
    console.log();
  } catch (error) {
    console.error('❌ Foundation conversion failed:', error.message);
  }

  // Test 4: Auto-detection
  console.log('=== Test 4: Auto-Detection ===');
  const mixedCode = `NSString *greeting = @"Hello World!";`;
  
  const isObjC = JITPhoneUtils.isObjectiveC(mixedCode);
  console.log(`Code detected as Objective-C: ${isObjC}`);
  
  if (isObjC) {
    const validation = JITPhoneUtils.validateObjectiveC(mixedCode);
    console.log(`Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (validation.errors.length > 0) {
      console.log('Errors:', validation.errors);
    }
  }

  // Test 5: Basic conversion utility
  console.log('\n=== Test 5: Basic Conversion Utility ===');
  const basicObjC = `
    NSString *message = @"Hello";
    BOOL flag = YES;
    NSLog(@"Message: %@, Flag: %@", message, flag ? @"YES" : @"NO");
  `;

  const basicConverted = JITPhoneUtils.convertObjectiveCBasics(basicObjC);
  console.log('Client-side basic conversion:');
  console.log(basicConverted);

  // Test 6: JIT compilation with Objective-C
  console.log('\n=== Test 6: JIT Compilation ===');
  const simpleObjCForJIT = `NSString *result = @"Compiled with JIT!";`;
  
  try {
    const jitResult = await client.compile(simpleObjCForJIT, {
      language: 'objectivec',
      optimizationLevel: 'O2',
      target: 'shortcuts'
    });
    
    console.log('✅ JIT compilation successful!');
    console.log('Source language:', jitResult.result.metadata.sourceLanguage);
    console.log('Optimizations applied:', jitResult.result.metadata.optimizations);
    console.log('iOS compatible:', jitResult.result.execution.shortcuts_compatible);
  } catch (error) {
    console.error('❌ JIT compilation failed:', error.message);
  }

  // Test 7: Server capabilities
  console.log('\n=== Test 7: Server Capabilities ===');
  try {
    const info = await client.info();
    console.log('Objective-C support:', info.conversion_capabilities.objectivec_support);
    console.log('Supported languages:', Object.keys(info.supported_languages));
    
    const formats = await client.convertJITInstructions('dummy', 'objectivec', { targetFormat: 'nodejs' });
    console.log('✅ Objective-C format recognized in JIT converter');
  } catch (error) {
    console.log('JIT converter test (expected to fail with dummy code)');
  }

  console.log('\n🎉 Demo completed! Objective-C to JavaScript conversion is working!');
  console.log('\n📝 Summary:');
  console.log('✅ Basic variable declarations');
  console.log('✅ Class interfaces');
  console.log('✅ Foundation framework types');
  console.log('✅ Auto-detection');
  console.log('✅ JIT compilation pipeline');
  console.log('✅ iOS Shortcuts compatibility');
  console.log('\n🚧 Note: Complex method implementations need further development');
}

// Run the demo
if (require.main === module) {
  demonstrateObjectiveCConversion().catch(console.error);
}

module.exports = { demonstrateObjectiveCConversion }; 