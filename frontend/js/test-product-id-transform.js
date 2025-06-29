/**
 * Test script to verify product ID transformation logic
 * Specifically for "IE-SP4T-1025-1095-1.5-Ni-RI%20Switch"
 */

// Test cases for product ID transformation
const testCases = [
    "IE-SP4T-1025-1095-1.5-Ni-RI%20Switch",
    "IE-SP4T-1025-1095-1.5-Ni-RI Switch",
    "ie-sp4t-1025-1095-1.5-ni-ri_switch",
    "IE-SP4T-1025-1095-1.5-Ni-RI_Switch",
    "Test Product Name",
    "test_product_name",
    "Product With Spaces",
    "product_with_underscores"
];

// Transformation function (same as used in the main scripts)
function transformProductId(productId) {
    // Decode URL encoding first
    let decoded = decodeURIComponent(productId);
    
    // Convert to lowercase and replace spaces with underscores
    return decoded.toLowerCase().replace(/\s+/g, '_');
}

// Test the transformation
console.log('=== Product ID Transformation Test ===\n');

testCases.forEach((testCase, index) => {
    const transformed = transformProductId(testCase);
    console.log(`Test ${index + 1}:`);
    console.log(`  Original: "${testCase}"`);
    console.log(`  Transformed: "${transformed}"`);
    console.log(`  URL Encoded: "${encodeURIComponent(transformed)}"`);
    console.log('');
});

// Specific test for the target product
console.log('=== Target Product Test ===');
const targetProduct = "IE-SP4T-1025-1095-1.5-Ni-RI%20Switch";
const transformedTarget = transformProductId(targetProduct);
console.log(`Target Product: "${targetProduct}"`);
console.log(`Transformed: "${transformedTarget}"`);
console.log(`URL Encoded: "${encodeURIComponent(transformedTarget)}"`);
console.log(`Expected API URL: /api/products/category/switches/product/${encodeURIComponent(transformedTarget)}`);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { transformProductId };
} else {
    window.transformProductId = transformProductId;
} 