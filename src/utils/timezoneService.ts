import {
  LOCATION_TIMEZONE_MAP,
  TimezoneApiResponse,
  TimezoneCacheEntry,
} from '@/types/receiver';

const CACHE_KEY = 'timezone_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Timezone detection service with caching and external API support
 */
class TimezoneService {
  private cache: Map<string, TimezoneCacheEntry> = new Map();
  private cacheLoaded = false;

  constructor() {
    // Don't load cache during construction to avoid SSR issues
    // Cache will be loaded lazily when first accessed
  }

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Load cache from localStorage (only in browser)
   */
  private loadCache(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const cacheData = JSON.parse(stored);
        Object.entries(cacheData).forEach(([key, value]) => {
          this.cache.set(key, value as TimezoneCacheEntry);
        });
      }
      this.cacheLoaded = true;
    } catch (error) {
      console.error('Failed to load timezone cache:', error);
      this.cacheLoaded = true; // Mark as loaded even if failed to prevent repeated attempts
    }
  }

  /**
   * Save cache to localStorage (only in browser)
   */
  private saveCache(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save timezone cache:', error);
    }
  }

  /**
   * Ensure cache is loaded (lazy loading)
   */
  private ensureCacheLoaded(): void {
    if (!this.cacheLoaded) {
      this.loadCache();
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isCacheValid(entry: TimezoneCacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  /**
   * Normalize location string for consistent caching
   */
  private normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .trim()
      .replace(/[,\s]+/g, ' ');
  }

  /**
   * Extract main location components for API call
   */
  private extractLocationForApi(location: string): string {
    // Clean and extract the most relevant part
    const cleaned = location.replace(/['"]/g, '').trim();

    // If it contains "United States", try to extract state/city
    if (cleaned.toLowerCase().includes('united states')) {
      const parts = cleaned.split(',').map((p) => p.trim());
      if (parts.length > 1) {
        // Return the most specific part before "United States"
        const relevantPart = parts[parts.length - 2];
        if (
          relevantPart &&
          !relevantPart.toLowerCase().includes('united states')
        ) {
          return relevantPart;
        }
      }
    }

    // For other locations, return the first meaningful part
    const parts = cleaned.split(',').map((p) => p.trim());
    return parts[0] || cleaned;
  }

  /**
   * Try to detect timezone from local mapping first
   */
  private detectFromLocalMapping(location: string): string | null {
    const normalized = this.normalizeLocation(location);

    // Direct match
    if (LOCATION_TIMEZONE_MAP[normalized]) {
      return LOCATION_TIMEZONE_MAP[normalized];
    }

    // Partial match - check if location contains any known city/country
    for (const [key, timezone] of Object.entries(LOCATION_TIMEZONE_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return timezone;
      }
    }

    return null;
  }

  /**
   * Call external timezone API
   */
  private async callTimezoneApi(
    location: string
  ): Promise<TimezoneApiResponse> {
    try {
      // Using a free timezone API - you can replace with your preferred service
      // Example: TimeZoneDB, GeoNames, or Google Maps Timezone API
      const apiLocation = this.extractLocationForApi(location);

      // For demo purposes, using a mock API call
      // Replace this with actual API integration
      const response = await this.mockTimezoneApi(apiLocation);

      return response;
    } catch (error) {
      console.error('Timezone API call failed:', error);
      return {
        timezone: 'UTC',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mock API call - replace with real API integration
   */
  private async mockTimezoneApi(
    location: string
  ): Promise<TimezoneApiResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock responses based on common patterns
    const locationLower = location.toLowerCase();

    if (locationLower.includes('california') || locationLower.includes('ca')) {
      return { timezone: 'America/Los_Angeles', success: true };
    }
    if (locationLower.includes('new york') || locationLower.includes('ny')) {
      return { timezone: 'America/New_York', success: true };
    }
    if (locationLower.includes('washington')) {
      return { timezone: 'America/Los_Angeles', success: true };
    }
    if (locationLower.includes('georgia') || locationLower.includes('ga')) {
      return { timezone: 'America/New_York', success: true };
    }
    if (locationLower.includes('alabama')) {
      return { timezone: 'America/Chicago', success: true };
    }
    if (locationLower.includes('wisconsin') || locationLower.includes('wi')) {
      return { timezone: 'America/Chicago', success: true };
    }
    if (locationLower.includes('pittsburgh')) {
      return { timezone: 'America/New_York', success: true };
    }
    if (locationLower.includes('seattle')) {
      return { timezone: 'America/Los_Angeles', success: true };
    }
    if (locationLower.includes('hawaii')) {
      return { timezone: 'Pacific/Honolulu', success: true };
    }

    // Default for United States
    if (locationLower.includes('united states')) {
      return { timezone: 'America/New_York', success: true };
    }

    return {
      timezone: 'UTC',
      success: false,
      error: 'Location not found in mock API',
    };
  }

  /**
   * Main method to detect timezone with caching and API fallback
   */
  async detectTimezone(location: string): Promise<{
    timezone: string;
    source: 'cache' | 'api' | 'fallback';
  }> {
    if (!location?.trim()) {
      return { timezone: 'UTC', source: 'fallback' };
    }

    // Ensure cache is loaded before using it
    this.ensureCacheLoaded();

    const normalizedLocation = this.normalizeLocation(location);

    // 1. Check cache first
    const cached = this.cache.get(normalizedLocation);
    if (cached && this.isCacheValid(cached)) {
      return { timezone: cached.timezone, source: 'cache' };
    }

    // 2. Try local mapping
    const localTimezone = this.detectFromLocalMapping(location);
    if (localTimezone) {
      // Cache the result
      this.cache.set(normalizedLocation, {
        location: normalizedLocation,
        timezone: localTimezone,
        timestamp: Date.now(),
        source: 'fallback',
      });
      this.saveCache();
      return { timezone: localTimezone, source: 'fallback' };
    }

    // 3. Try API call
    const apiResult = await this.callTimezoneApi(location);
    const timezone = apiResult.success ? apiResult.timezone : 'UTC';
    const source = apiResult.success ? 'api' : 'fallback';

    // Cache the result
    this.cache.set(normalizedLocation, {
      location: normalizedLocation,
      timezone,
      timestamp: Date.now(),
      source,
    });
    this.saveCache();

    return { timezone, source };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    this.ensureCacheLoaded();

    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
    this.saveCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; validEntries: number } {
    this.ensureCacheLoaded();

    const now = Date.now();
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp < CACHE_DURATION) {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
    };
  }
}

// Export singleton instance
export const timezoneService = new TimezoneService();
