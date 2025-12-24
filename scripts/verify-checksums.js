#!/usr/bin/env node

/**
 * Checksum Verification Script
 * Verifies the integrity of distribution packages
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = {
  version: require('../package.json').version,
  releaseDir: 'releases',
  checksumsFile: null
};

config.checksumsFile = path.join(config.releaseDir, `checksums-${config.version}.json`);

console.log('🔐 Schemock Checksum Verification');
console.log(`📦 Version: ${config.version}\n`);

/**
 * Calculate SHA-256 hash of a file
 */
function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Verify a single file
 */
async function verifyFile(filename, expectedHash) {
  const filePath = path.join(config.releaseDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return {
      filename,
      status: 'missing',
      message: 'File not found'
    };
  }
  
  try {
    const actualHash = await calculateHash(filePath);
    
    if (actualHash === expectedHash) {
      return {
        filename,
        status: 'valid',
        hash: actualHash,
        message: 'Checksum verified'
      };
    } else {
      return {
        filename,
        status: 'invalid',
        expected: expectedHash,
        actual: actualHash,
        message: 'Checksum mismatch!'
      };
    }
  } catch (error) {
    return {
      filename,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Main verification process
 */
async function main() {
  try {
    // Load checksums file
    if (!fs.existsSync(config.checksumsFile)) {
      console.error(`❌ Checksums file not found: ${config.checksumsFile}`);
      console.error('   Run npm run build:distribution first.\n');
      process.exit(1);
    }
    
    console.log(`📄 Loading checksums from: ${config.checksumsFile}\n`);
    
    const checksums = JSON.parse(fs.readFileSync(config.checksumsFile, 'utf8'));
    
    console.log(`Algorithm: ${checksums.algorithm}`);
    console.log(`Build Date: ${checksums.buildDate}`);
    console.log(`Files to verify: ${Object.keys(checksums.files).length}\n`);
    
    console.log('🔍 Verifying files...\n');
    
    // Verify each file
    const results = [];
    for (const [filename, info] of Object.entries(checksums.files)) {
      process.stdout.write(`  Checking ${filename}... `);
      
      const result = await verifyFile(filename, info.sha256);
      results.push(result);
      
      // Display result
      if (result.status === 'valid') {
        console.log('✅ Valid');
      } else if (result.status === 'missing') {
        console.log('⚠️  Missing');
      } else if (result.status === 'invalid') {
        console.log('❌ Invalid');
      } else {
        console.log(`❌ Error: ${result.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60) + '\n');
    
    const valid = results.filter(r => r.status === 'valid').length;
    const invalid = results.filter(r => r.status === 'invalid').length;
    const missing = results.filter(r => r.status === 'missing').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Valid:   ${valid}`);
    console.log(`❌ Invalid: ${invalid}`);
    console.log(`⚠️  Missing: ${missing}`);
    console.log(`⚠️  Errors:  ${errors}`);
    console.log(`📊 Total:   ${results.length}\n`);
    
    // Display details for failures
    const failures = results.filter(r => r.status !== 'valid');
    if (failures.length > 0) {
      console.log('❌ FAILURES:\n');
      failures.forEach(f => {
        console.log(`  ${f.filename}:`);
        console.log(`    Status: ${f.status}`);
        console.log(`    Message: ${f.message}`);
        if (f.expected) {
          console.log(`    Expected: ${f.expected.substring(0, 32)}...`);
          console.log(`    Actual:   ${f.actual.substring(0, 32)}...`);
        }
        console.log('');
      });
    }
    
    // Exit code
    if (invalid > 0 || errors > 0) {
      console.log('❌ Verification FAILED!\n');
      process.exit(1);
    } else if (missing > 0) {
      console.log('⚠️  Verification completed with warnings (missing files)\n');
      process.exit(0);
    } else {
      console.log('✅ All checksums verified successfully!\n');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed!');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, calculateHash, verifyFile };
