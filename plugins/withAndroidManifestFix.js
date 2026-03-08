const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to fix Android manifest merger conflicts with AppsFlyer SDK
 * Ensures allowBackup, dataExtractionRules, and fullBackupContent are properly merged
 */
const withAndroidManifestFix = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Find the application element
    const application = androidManifest.manifest.application?.[0];
    
    if (application) {
      // Ensure tools namespace is declared
      if (!androidManifest.manifest.$) {
        androidManifest.manifest.$ = {};
      }
      if (!androidManifest.manifest.$['xmlns:tools']) {
        androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
      }
      
      // Add tools:replace to application element
      if (!application.$) {
        application.$ = {};
      }
      
      // Merge existing tools:replace if present
      const existingReplace = application.$['tools:replace'] || '';
      const replaceAttrs = new Set([
        'android:allowBackup',
        'android:dataExtractionRules',
        'android:fullBackupContent'
      ]);
      
      if (existingReplace) {
        existingReplace.split(',').forEach(attr => {
          if (attr.trim()) replaceAttrs.add(attr.trim());
        });
      }
      
      application.$['tools:replace'] = Array.from(replaceAttrs).join(',');
      
      // Ensure our values are set
      application.$['android:allowBackup'] = 'false';
      application.$['android:dataExtractionRules'] = '@xml/secure_store_data_extraction_rules';
      application.$['android:fullBackupContent'] = '@xml/secure_store_backup_rules';
    }
    
    return config;
  });
};

module.exports = withAndroidManifestFix;
