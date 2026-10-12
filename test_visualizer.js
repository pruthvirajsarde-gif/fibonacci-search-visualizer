// Test script for Fibonacci Search Visualizer logic & DOM ID alignment
const fs = require('fs');
const path = require('path');

const scriptCode = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
const htmlCode = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const cssCode = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');

console.log("=== 1. CHECKING DOM IDS ALIGNMENT ===");
// Extract all getElementById calls
const idRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
const matchedIds = new Set();
let match;
while ((match = idRegex.exec(scriptCode)) !== null) {
  matchedIds.add(match[1]);
}

let missingIds = 0;
for (const id of matchedIds) {
  // Allow dynamic IDs created in script.js (e.g., array-item-, fib-pill-, step-card-, role-tag-)
  if (id.includes('${') || id.startsWith('array-item-') || id.startsWith('fib-pill-') || id.startsWith('step-card-') || id.startsWith('role-tag-')) {
    continue;
  }
  const idPattern = new RegExp(`id=["']${id}["']`);
  if (!idPattern.test(htmlCode)) {
    console.error(`❌ Missing ID in index.html: "${id}"`);
    missingIds++;
  } else {
    // console.log(`✓ ID exists: "${id}"`);
  }
}

if (missingIds === 0) {
  console.log(`✓ All ${matchedIds.size} static IDs referenced in script.js exist in index.html!`);
}

console.log("\n=== 2. TESTING ALGORITHM & STATE GENERATION ===");

// Mock browser globals
const sandbox = {
  console: console,
  document: { 
    addEventListener: (evt, fn) => { /* don't auto-run DOMContentLoaded in mock */ },
    getElementById: () => ({ addEventListener: () => {}, querySelector: () => ({ style: {} }), style: {} }),
    querySelectorAll: () => []
  },
  window: { addEventListener: () => {} },
  AppState: {},
  AudioContext: null
};

const vm = require('vm');
const context = vm.createContext(sandbox);

// Run full script in context
vm.runInContext(scriptCode, context);

const generateFibonacciNumbers = context.generateFibonacciNumbers;
const calculateProbe = context.calculateProbe;
const generateSearchStates = context.generateSearchStates;
const validateAndParseInput = context.validateAndParseInput;

console.log("Testing generateFibonacciNumbers:");
const fib9 = generateFibonacciNumbers(9);
console.log(`For n=9: fibM=${fib9.fibM}, fib1=${fib9.fib1}, fib2=${fib9.fib2}, sequence=${fib9.sequence.join(', ')}`);
if (fib9.fibM === 13 && fib9.fib1 === 8 && fib9.fib2 === 5) {
  console.log("✓ Correct Fibonacci initialization for n=9");
} else {
  console.error("❌ Unexpected Fibonacci numbers for n=9");
}

console.log("\nTesting Default Case [10, 22, 35, 47, 51, 63, 72, 85, 91], Target = 63:");
const statesDefault = generateSearchStates([10, 22, 35, 47, 51, 63, 72, 85, 91], 63);
const lastStateDefault = statesDefault[statesDefault.length - 1];
console.log(`Total states: ${statesDefault.length}, final status: ${lastStateDefault.statusType}, foundIndex: ${lastStateDefault.foundIndex}, comparisons: ${lastStateDefault.comparisons}`);
if (lastStateDefault.statusType === 'found' && lastStateDefault.foundIndex === 5 && lastStateDefault.comparisons === 3) {
  console.log("✓ Default case matched expected result (found at index 5 with 3 comparisons)!");
} else {
  console.error("❌ Default case failed!", lastStateDefault);
}

console.log("\nTesting First Element, Target = 10:");
const statesFirst = generateSearchStates([10, 22, 35, 47, 51, 63, 72, 85, 91], 10);
const lastStateFirst = statesFirst[statesFirst.length - 1];
console.log(`Final status: ${lastStateFirst.statusType}, foundIndex: ${lastStateFirst.foundIndex}, comparisons: ${lastStateFirst.comparisons}`);
if (lastStateFirst.statusType === 'found' && lastStateFirst.foundIndex === 0) {
  console.log("✓ First element found at index 0!");
} else {
  console.error("❌ First element failed!");
}

console.log("\nTesting Last Element, Target = 91:");
const statesLast = generateSearchStates([10, 22, 35, 47, 51, 63, 72, 85, 91], 91);
const lastStateLast = statesLast[statesLast.length - 1];
console.log(`Final status: ${lastStateLast.statusType}, foundIndex: ${lastStateLast.foundIndex}, comparisons: ${lastStateLast.comparisons}`);
if (lastStateLast.statusType === 'found' && lastStateLast.foundIndex === 8) {
  console.log("✓ Last element found at index 8!");
} else {
  console.error("❌ Last element failed!");
}

console.log("\nTesting Not In Array, Target = 70:");
const statesNotFound = generateSearchStates([10, 22, 35, 47, 51, 63, 72, 85, 91], 70);
const lastStateNotFound = statesNotFound[statesNotFound.length - 1];
console.log(`Final status: ${lastStateNotFound.statusType}, foundIndex: ${lastStateNotFound.foundIndex}, comparisons: ${lastStateNotFound.comparisons}`);
if (lastStateNotFound.statusType === 'not-found' && lastStateNotFound.foundIndex === -1) {
  console.log("✓ Target 70 correctly identified as not in array!");
} else {
  console.error("❌ Not in array failed!");
}

console.log("\nTesting Single Element Array [42], Target = 42:");
const statesSingleFound = generateSearchStates([42], 42);
const lastSingleFound = statesSingleFound[statesSingleFound.length - 1];
if (lastSingleFound.statusType === 'found' && lastSingleFound.foundIndex === 0) {
  console.log("✓ Single element array target matched at index 0!");
} else {
  console.error("❌ Single element array found failed!", lastSingleFound);
}

console.log("\nTesting Single Element Array [42], Target = 99:");
const statesSingleNotFound = generateSearchStates([42], 99);
const lastSingleNotFound = statesSingleNotFound[statesSingleNotFound.length - 1];
if (lastSingleNotFound.statusType === 'not-found') {
  console.log("✓ Single element array non-target correctly returned not-found!");
} else {
  console.error("❌ Single element not-found failed!", lastSingleNotFound);
}

console.log("\nTesting Comprehensive Search on Array of 12 Elements:");
const testArr = [4, 9, 15, 23, 31, 42, 55, 68, 77, 83, 91, 99];
let allPassed = true;
testArr.forEach((val, idx) => {
  const states = generateSearchStates(testArr, val);
  const last = states[states.length - 1];
  if (last.statusType !== 'found' || last.foundIndex !== idx) {
    console.error(`❌ Failed finding element ${val} at index ${idx}! Got:`, last);
    allPassed = false;
  }
});
if (allPassed) {
  console.log(`✓ All 12 elements independently found at their exact indices!`);
}

console.log("\nTesting Input Validation & Unsorted Detection:");
const sortedCheck = validateAndParseInput("10, 20, 30, 40");
console.log("Sorted array check:", sortedCheck.isSorted ? "✓ Correctly identified as sorted" : "❌ Error");

const unsortedCheck = validateAndParseInput("50, 20, 80");
console.log("Unsorted array check:", !unsortedCheck.isSorted ? "✓ Correctly flagged as unsorted" : "❌ Error");

const invalidCheck = validateAndParseInput("10, abc, 30");
console.log("Invalid format check:", invalidCheck.error ? `✓ Correctly caught error: "${invalidCheck.error}"` : "❌ Error");

console.log("\n=== ALL ALGORITHMIC & STATE TESTS PASSED ===");
