// services/cableTvPackagesService.js
import { apiClient } from '../services/apiClient';

export const cableTvPackagesService = {
  /**
   * Get available cable TV packages for a provider
   * @param {string} serviceId - TV provider (dstv, gotv, startimes, showmax)
   * @returns {Promise<Object>} Available cable TV packages
   */
  async getCableTvPackages(serviceId) {
    try {
      console.log('📺 Fetching cable TV packages for:', this.getProviderDisplayName(serviceId));

      // POST request with JSON body - service_id in lowercase
      const response = await apiClient.post('/cable-packages/packages', {
        service_id: serviceId.toLowerCase()
      });

      if (response.success && response.data) {
        // ✅ FIXED: Access the nested data object
        const apiData = response.data.data || response.data; // Handle both structures
        
        console.log('✅ Cable TV packages fetched successfully:', {
          provider: this.getProviderDisplayName(serviceId),
          packages_count: apiData.packages_by_provider?.[serviceId.toLowerCase()]?.length || 0,
          total_available: apiData.total_available_packages,
          total_all: apiData.total_all_packages
        });

        // Extract packages for the specific service from the grouped response
        const servicePackages = apiData.packages_by_provider?.[serviceId.toLowerCase()] || [];

        // Transform the packages from API format to client format
        const transformedPackages = servicePackages.map(pkg => ({
          variationId: pkg.variation_id,
          serviceName: pkg.service_name,
          serviceId: pkg.service_id,
          name: pkg.package_bouquet,
          description: pkg.package_bouquet,
          channels: this.extractChannelCount(pkg.package_bouquet),
          price: pkg.price,
          formattedPrice: pkg.price_formatted,
          formattedChannels: this.formatChannelCount(pkg.package_bouquet),
          availability: pkg.availability,
          provider: serviceId.toLowerCase(),
          subscriptionType: this.extractSubscriptionType(pkg.package_bouquet),
          features: this.extractFeatures(pkg.package_bouquet),
          category: this.categorizePackage(pkg.package_bouquet),
          originalData: pkg // Keep original for reference
        }));

        // Categorize packages for modal display
        const categorizedPackages = this.categorizePackages(transformedPackages);

        return {
          success: true,
          data: transformedPackages,
          categorized: categorizedPackages,
          meta: {
            totalPackages: transformedPackages.length,
            serviceId: serviceId.toLowerCase(),
            serviceName: servicePackages[0]?.service_name || this.getProviderDisplayName(serviceId),
            totalAvailable: apiData.total_available_packages,
            totalAll: apiData.total_all_packages,
            filterApplied: apiData.filter_applied,
            providersAvailable: apiData.providers_available
          },
          message: response.data.message || response.message || 'Cable TV packages loaded successfully'
        };
      } else {
        const backendMessage = response.error || response.message || 'Failed to load cable TV packages';
        const errorCode = this.generateErrorCode(backendMessage);
        
        console.log('❌ Failed to fetch cable TV packages:', {
          backend_message: backendMessage,
          error_code: errorCode,
          provider: serviceId
        });

        return {
          success: false,
          error: errorCode,
          message: backendMessage,
          data: []
        };
      }

    } catch (error) {
      console.error('❌ Cable TV packages fetch network error:', {
        error: error.message,
        provider: serviceId,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      // Handle specific backend error responses
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorCode = this.generateErrorCode(errorData.error || errorData.message);
        
        return {
          success: false,
          error: errorCode,
          message: errorData.message || 'Failed to load cable TV packages',
          data: []
        };
      }
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to load cable TV packages. Please check your connection.',
        data: []
      };
    }
  },

  /**
   * Extract subscription type from package bouquet name
   * @param {string} packageBouquet - Package bouquet name from API
   * @returns {string} Extracted subscription type
   */
  extractSubscriptionType(packageBouquet) {
    if (!packageBouquet) return 'monthly'; // Default
    
    const name = packageBouquet.toLowerCase();
    
    // Look for subscription type patterns in package names
    if (name.includes('monthly') || name.includes('month') || name.includes('30 days')) {
      return 'monthly';
    }
    if (name.includes('quarterly') || name.includes('3 months') || name.includes('90 days')) {
      return 'quarterly';
    }
    if (name.includes('yearly') || name.includes('annual') || name.includes('12 months') || name.includes('365 days')) {
      return 'yearly';
    }
    if (name.includes('weekly') || name.includes('week') || name.includes('7 days')) {
      return 'weekly';
    }
    
    return 'monthly'; // Default fallback
  },

  /**
   * Extract channel count from package bouquet name
   * @param {string} packageBouquet - Package bouquet name
   * @returns {number} Number of channels
   */
  extractChannelCount(packageBouquet) {
    if (!packageBouquet) return 50; // Default
    
    const text = packageBouquet.toLowerCase();
    
    // Look for channel count patterns
    const channelPattern = /(\d+)\s*(?:channels?|chs?)/i;
    const match = text.match(channelPattern);
    
    if (match) {
      return parseInt(match[1]);
    }
    
    // DStv package estimates
    if (text.includes('premium')) return 150;
    if (text.includes('compact') && text.includes('plus')) return 110;
    if (text.includes('compact')) return 90;
    if (text.includes('family')) return 70;
    if (text.includes('access')) return 45;
    if (text.includes('yanga')) return 40;
    if (text.includes('padi')) return 35;
    
    // GOtv package estimates
    if (text.includes('supa') && text.includes('plus')) return 70;
    if (text.includes('supa')) return 60;
    if (text.includes('max')) return 50;
    if (text.includes('jolli')) return 45;
    if (text.includes('jinja')) return 35;
    if (text.includes('smallie')) return 25;
    
    // StarTimes package estimates
    if (text.includes('super')) return 80;
    if (text.includes('smart')) return 60;
    if (text.includes('basic')) return 40;
    if (text.includes('nova')) return 30;
    
    // Showmax estimates
    if (text.includes('pro')) return 0; // Streaming service
    if (text.includes('standard')) return 0; // Streaming service
    
    // Default estimates based on package tier keywords
    if (text.includes('basic') || text.includes('lite') || text.includes('starter')) {
      return 30;
    }
    if (text.includes('premium') || text.includes('max') || text.includes('ultimate')) {
      return 100;
    }
    if (text.includes('family') || text.includes('standard')) {
      return 60;
    }
    
    return 50; // Default fallback
  },

  /**
   * Format channel count for display
   * @param {string} packageBouquet - Package bouquet name
   * @returns {string} Formatted channel count
   */
  formatChannelCount(packageBouquet) {
    if (!packageBouquet) return '50+ channels';
    
    const text = packageBouquet.toLowerCase();
    
    // Special handling for streaming services
    if (text.includes('showmax')) {
      return 'Streaming Service';
    }
    
    const channelCount = this.extractChannelCount(packageBouquet);
    return `${channelCount}+ channels`;
  },

  /**
   * Extract features from package bouquet name
   * @param {string} packageBouquet - Package bouquet name
   * @returns {Array} Array of features
   */
  extractFeatures(packageBouquet) {
    if (!packageBouquet) return [];
    
    const features = [];
    const desc = packageBouquet.toLowerCase();
    
    // Common cable TV features
    if (desc.includes('hd') || desc.includes('high definition')) {
      features.push('HD Channels');
    }
    
    // DStv specific features
    if (desc.includes('premium')) {
      features.push('Premium Sports', 'Movie Channels', 'International Channels', 'HD Channels');
    }
    if (desc.includes('compact')) {
      features.push('Sports Channels', 'Movie Channels', 'News Channels');
    }
    if (desc.includes('family')) {
      features.push('Family Entertainment', 'Kids Channels', 'Educational Content');
    }
    if (desc.includes('access')) {
      features.push('Basic Entertainment', 'News Channels');
    }
    
    // GOtv specific features
    if (desc.includes('supa')) {
      features.push('Sports Channels', 'Movie Channels', 'Music Channels');
    }
    if (desc.includes('max')) {
      features.push('Entertainment Channels', 'News Channels');
    }
    if (desc.includes('jolli')) {
      features.push('Basic Entertainment', 'Educational Content');
    }
    
    // StarTimes specific features
    if (desc.includes('super')) {
      features.push('Sports Channels', 'Movie Channels', 'International Channels');
    }
    if (desc.includes('smart')) {
      features.push('Entertainment Channels', 'News Channels');
    }
    if (desc.includes('basic')) {
      features.push('Basic Entertainment');
    }
    
    // Showmax specific features
    if (desc.includes('showmax')) {
      features.push('On-Demand Streaming', 'Original Content', 'Mobile Access');
      if (desc.includes('pro')) {
        features.push('Live Sports', 'Premier League');
      }
    }
    
    // Generic feature detection
    if (desc.includes('sports') || desc.includes('sport')) {
      features.push('Sports Channels');
    }
    if (desc.includes('movie') || desc.includes('cinema')) {
      features.push('Movie Channels');
    }
    if (desc.includes('news')) {
      features.push('News Channels');
    }
    if (desc.includes('kids') || desc.includes('children') || desc.includes('cartoon')) {
      features.push('Kids Channels');
    }
    if (desc.includes('music')) {
      features.push('Music Channels');
    }
    if (desc.includes('documentary') || desc.includes('education')) {
      features.push('Educational Content');
    }
    if (desc.includes('international') || desc.includes('foreign')) {
      features.push('International Channels');
    }
    
    // Remove duplicates and return
    return [...new Set(features)];
  },

  /**
   * Categorize a single package
   * @param {string} packageBouquet - Package bouquet name
   * @returns {string} Package category
   */
  categorizePackage(packageBouquet) {
    if (!packageBouquet) return 'standard';
    
    const text = packageBouquet.toLowerCase();
    
    // Provider-specific categorization
    if (text.includes('showmax')) {
      return 'streaming';
    }
    
    // Premium tier
    if (text.includes('premium') || text.includes('supa plus') || text.includes('super')) {
      return 'premium';
    }
    
    // Sports tier
    if (text.includes('sport') || (text.includes('showmax') && text.includes('pro'))) {
      return 'sports';
    }
    
    // Basic tier
    if (text.includes('access') || text.includes('padi') || text.includes('smallie') || 
        text.includes('jinja') || text.includes('basic') || text.includes('nova')) {
      return 'basic';
    }
    
    // Family tier
    if (text.includes('family') || text.includes('jolli')) {
      return 'family';
    }
    
    // Entertainment tier
    if (text.includes('compact') || text.includes('supa') || text.includes('max') || 
        text.includes('smart') || text.includes('yanga')) {
      return 'entertainment';
    }
    
    // Generic categorization
    if (text.includes('lite') || text.includes('starter')) {
      return 'basic';
    }
    if (text.includes('deluxe') || text.includes('ultimate')) {
      return 'premium';
    }
    if (text.includes('international') || text.includes('foreign')) {
      return 'international';
    }
    if (text.includes('kids') || text.includes('children') || text.includes('junior')) {
      return 'kids';
    }
    if (text.includes('movie') || text.includes('cinema') || text.includes('film')) {
      return 'movies';
    }
    
    return 'standard'; // Default category
  },

  /**
   * Categorize packages by type for modal display
   * @param {Array} packages - Array of cable TV packages
   * @returns {Object} Categorized packages
   */
  categorizePackages(packages) {
    const categorized = {
      basic: [],
      standard: [],
      entertainment: [],
      family: [],
      premium: [],
      sports: [],
      streaming: [],
      international: [],
      kids: [],
      movies: [],
      other: []
    };

    packages.forEach(pkg => {
      const category = pkg.category;
      
      if (categorized[category]) {
        categorized[category].push(pkg);
      } else {
        categorized.other.push(pkg);
      }
    });

    return categorized;
  },

  /**
   * Generate standardized error code from backend error message
   * @param {string} errorMessage - Error message from backend
   * @returns {string} Standardized error code
   */
  generateErrorCode(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'FETCH_FAILED';
    }
    
    const message = errorMessage.toLowerCase().trim();
    
    // Service ID related errors
    if (message.includes('invalid service id') || message.includes('invalid service_id')) {
      return 'INVALID_SERVICE_ID';
    }
    
    // No packages available
    if (message.includes('no product') || message.includes('no packages') || 
        message.includes('no cable tv packages') || message.includes('no_product')) {
      return 'NO_PACKAGES_AVAILABLE';
    }
    
    // Provider specific errors
    if (message.includes('provider unavailable') || message.includes('provider not supported')) {
      return 'PROVIDER_UNAVAILABLE';
    }
    
    // eBills API related errors
    if (message.includes('ebills') || message.includes('ebills api')) {
      return 'EBILLS_API_ERROR';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || message.includes('econnaborted')) {
      return 'REQUEST_TIMEOUT';
    }
    
    // Service unavailable
    if (message.includes('service unavailable') || 
        message.includes('temporarily unavailable') ||
        message.includes('service error')) {
      return 'SERVICE_ERROR';
    }
    
    // Authentication related
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'UNAUTHORIZED';
    }
    
    // Network related errors
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    // Server errors
    if (message.includes('internal server error') || message.includes('server error')) {
      return 'SERVER_ERROR';
    }
    
    // Default fallback
    return 'FETCH_FAILED';
  },

  /**
   * Get cable TV provider display name
   * @param {string} serviceId - Service ID (dstv, gotv, startimes, showmax)
   * @returns {string} Display name
   */
  getProviderDisplayName(serviceId) {
    const providerNames = {
      'dstv': 'DStv',
      'gotv': 'GOtv',
      'startimes': 'StarTimes',
      'showmax': 'Showmax'
    };
    
    return providerNames[serviceId?.toLowerCase()] || (serviceId || 'Unknown');
  },

  /**
   * Get formatted packages for modal display
   * @param {Array} packages - Array of cable TV packages
   * @returns {Object} Formatted packages by category
   */
  getModalFormattedPackages(packages) {
    const categorized = this.categorizePackages(packages);
    
    const formatPackagesForModal = (packageArray) => packageArray.map(pkg => ({
      id: pkg.variationId,
      name: pkg.name,
      channels: pkg.formattedChannels,
      subscriptionType: pkg.subscriptionType,
      price: pkg.price,
      formattedPrice: pkg.formattedPrice,
      features: pkg.features,
      category: pkg.category,
      originalPackage: pkg
    }));

    return {
      basic: formatPackagesForModal(categorized.basic),
      standard: formatPackagesForModal(categorized.standard),
      entertainment: formatPackagesForModal(categorized.entertainment),
      family: formatPackagesForModal(categorized.family),
      premium: formatPackagesForModal(categorized.premium),
      sports: formatPackagesForModal(categorized.sports),
      streaming: formatPackagesForModal(categorized.streaming),
      international: formatPackagesForModal(categorized.international),
      kids: formatPackagesForModal(categorized.kids),
      movies: formatPackagesForModal(categorized.movies),
      other: formatPackagesForModal(categorized.other)
    };
  },

  /**
   * Search cable TV packages by query
   * @param {Array} packages - Array of cable TV packages
   * @param {string} query - Search query
   * @returns {Array} Filtered cable TV packages
   */
  searchPackages(packages, query) {
    if (!query || !query.trim()) {
      return packages;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchTerm) ||
      pkg.description.toLowerCase().includes(searchTerm) ||
      pkg.formattedChannels.toLowerCase().includes(searchTerm) ||
      pkg.formattedPrice.toLowerCase().includes(searchTerm) ||
      pkg.subscriptionType.toLowerCase().includes(searchTerm) ||
      pkg.category.toLowerCase().includes(searchTerm) ||
      pkg.features.some(feature => feature.toLowerCase().includes(searchTerm)) ||
      pkg.price.toString().includes(searchTerm) ||
      pkg.provider.toLowerCase().includes(searchTerm) ||
      pkg.serviceName.toLowerCase().includes(searchTerm)
    );
  },

  /**
   * Get packages by price range
   * @param {Array} packages - Array of cable TV packages
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} Filtered packages
   */
  getPackagesByPriceRange(packages, minPrice = 0, maxPrice = Infinity) {
    return packages.filter(pkg => pkg.price >= minPrice && pkg.price <= maxPrice);
  },

  /**
   * Sort packages by criteria
   * @param {Array} packages - Array of cable TV packages
   * @param {string} sortBy - Sort criteria (price, name, channels, category)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Array} Sorted packages
   */
  sortPackages(packages, sortBy = 'price', order = 'asc') {
    const sortedPackages = [...packages].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'channels':
          valueA = a.channels;
          valueB = b.channels;
          break;
        case 'category':
          valueA = a.category.toLowerCase();
          valueB = b.category.toLowerCase();
          break;
        default:
          valueA = a.price;
          valueB = b.price;
      }
      
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedPackages;
  },

  /**
   * Get user-friendly error message
   * @param {string} errorCode - Error code
   * @param {string} fallbackMessage - Fallback message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorCode, fallbackMessage = 'Something went wrong') {
    const errorMessages = {
      'INVALID_SERVICE_ID': 'Invalid provider selected. Please choose a different provider.',
      'NO_PACKAGES_AVAILABLE': 'No cable TV packages are available for this provider at the moment.',
      'PROVIDER_UNAVAILABLE': 'This cable TV provider is currently unavailable.',
      'EBILLS_API_ERROR': 'Cable TV packages service is temporarily unavailable.',
      'REQUEST_TIMEOUT': 'Request timed out. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'SERVICE_ERROR': 'Service is temporarily unavailable.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'FETCH_FAILED': 'Failed to load cable TV packages. Please try again.',
      'UNAUTHORIZED': 'Authentication required. Please log in again.'
    };
    
    return errorMessages[errorCode] || fallbackMessage;
  }
};