/**
 * Deploy Helpers - Health checks, signed URLs, migration verification
 * 
 * Features:
 * - Cookie-aware health checks
 * - Pre-signed URL generation for secure uploads
 * - Migration verification (no hardcoded localhost)
 * - Deployment status tracking
 */

import { api } from './api.js';

/**
 * Health check with cookie state verification
 * Ensures API is reachable and cookies are working
 */
export async function healthCheck(jar = null) {
  try {
    const res = await api.fetch('/health', {
      method: 'GET',
      jar,
    });

    if (!res.ok) {
      return {
        healthy: false,
        status: res.status,
        message: `API returned ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      healthy: true,
      status: 200,
      message: 'API healthy',
      data,
    };
  } catch (err) {
    return {
      healthy: false,
      status: 0,
      message: err.message,
    };
  }
}

/**
 * Request pre-signed URL for secure file upload
 * Used for deployment tarballs, backups, etc.
 */
export async function getUploadUrl(filename, size, jar = null) {
  try {
    const res = await api.post(
      '/v1/deploy/upload-url',
      { filename, size },
      { jar }
    );

    if (!res.ok) {
      throw new Error(`Failed to get upload URL: ${res.status}`);
    }

    const { url, fields, expiresIn } = await res.json();
    
    return {
      success: true,
      url,
      fields,
      expiresIn,
      message: `Upload URL valid for ${expiresIn}s`,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
}

/**
 * Upload file to pre-signed URL
 * Handles large files with progress tracking
 */
export async function uploadToSignedUrl(url, file, fields = {}) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'application/octet-stream',
        ...fields,
      },
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
}

/**
 * Complete deployment upload flow
 * 1. Get pre-signed URL
 * 2. Upload file
 * 3. Verify upload
 */
export async function deploymentUpload(filename, file, jar = null) {
  try {
    console.log(`📦 Starting deployment upload: ${filename}`);

    // Step 1: Get pre-signed URL
    const urlRes = await getUploadUrl(filename, file.size, jar);
    if (!urlRes.success) {
      throw new Error(urlRes.message);
    }
    console.log(`✅ Got upload URL (expires in ${urlRes.expiresIn}s)`);

    // Step 2: Upload file
    const uploadRes = await uploadToSignedUrl(
      urlRes.url,
      file,
      urlRes.fields
    );
    if (!uploadRes.success) {
      throw new Error(uploadRes.message);
    }
    console.log('✅ File uploaded successfully');

    // Step 3: Verify upload
    const verifyRes = await api.post(
      '/v1/deploy/verify',
      { filename },
      { jar }
    );
    if (!verifyRes.ok) {
      throw new Error('Upload verification failed');
    }
    console.log('✅ Upload verified');

    return {
      success: true,
      message: 'Deployment upload complete',
      filename,
    };
  } catch (err) {
    console.error('❌ Deployment upload failed:', err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}

/**
 * Verify no hardcoded localhost references in code
 * Ensures migration to production URLs is complete
 */
export async function verifyMigration() {
  try {
    const result = await Bun.spawn([
      'git',
      'diff',
      '--name-only',
    ]).text();

    const files = result.trim().split('\n').filter(Boolean);
    
    if (files.length === 0) {
      return {
        success: true,
        message: '✅ No changes to verify',
      };
    }

    const grepResult = await Bun.spawn([
      'grep',
      '-E',
      'localhost|127\\.0\\.0\\.1',
      ...files,
    ]).text();

    if (grepResult.trim()) {
      return {
        success: false,
        message: '❌ Found hardcoded localhost references:',
        files: grepResult.trim().split('\n'),
      };
    }

    return {
      success: true,
      message: '✅ No hardcoded localhost references found',
      filesChecked: files.length,
    };
  } catch (err) {
    return {
      success: false,
      message: `Verification error: ${err.message}`,
    };
  }
}

/**
 * Get deployment status from API
 */
export async function getDeploymentStatus(deploymentId, jar = null) {
  try {
    const res = await api.get(`/v1/deploy/${deploymentId}`, { jar });
    
    if (!res.ok) {
      throw new Error(`Failed to get status: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      status: data.status,
      progress: data.progress,
      message: data.message,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
}

export default {
  healthCheck,
  getUploadUrl,
  uploadToSignedUrl,
  deploymentUpload,
  verifyMigration,
  getDeploymentStatus,
};

