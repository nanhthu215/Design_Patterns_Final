/**
 * AddressRepository - Data access layer for Address/Geographic data
 */
const https = require('https');
const http = require('http');

class AddressRepository {
  constructor() {
    // Cache for API responses
    this.cache = {
      countries: { data: null, time: null },
      cities: {},
      districts: {},
      wards: {},
    };
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'k217';
  }

  /**
   * Make HTTP/HTTPS request
   */
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const timeout = options.timeout || 10000;

      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (err) {
            reject(new Error('Failed to parse JSON response'));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Get cached data
   */
  getCached(key, cacheObj) {
    if (
      cacheObj[key] &&
      cacheObj[key].time &&
      Date.now() - cacheObj[key].time < this.CACHE_DURATION
    ) {
      return cacheObj[key].data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  setCached(key, data, cacheObj) {
    cacheObj[key] = { data, time: Date.now() };
  }

  /**
   * Get all countries
   */
  async getCountries() {
    try {
      // Check cache first
      const cached = this.getCached('countries', this.cache);
      if (cached) {
        return cached;
      }

      // Fetch from REST Countries API
      const apiUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3';
      const countriesData = await this.makeRequest(apiUrl);

      // Transform to our format
      const countries = countriesData
        .map((country) => ({
          code: country.cca2,
          name: country.name.common || country.name.official,
          code3: country.cca3,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Update cache
      this.setCached('countries', countries, this.cache);

      return countries;
    } catch (error) {
      // Return default data on error
      return [{ code: 'VN', name: 'Vietnam', code3: 'VNM' }];
    }
  }

  /**
   * Get cities/provinces
   */
  async getCities(country = null) {
    try {
      if (!country) country = 'VN';

      // Check cache first
      const cached = this.getCached(country, this.cache.cities);
      if (cached) {
        return cached;
      }

      // For Vietnam, return hardcoded cities
      if (country === 'VN') {
        const vietnamCities = [
          'An Giang',
          'Bac Lieu',
          'Bac Kan',
          'Bac Giang',
          'Ba Ria-Vung Tau',
          'Ben Tre',
          'Binh Duong',
          'Binh Phuoc',
          'Binh Thuan',
          'Ca Mau',
          'Cao Bang',
          'Da Lat',
          'Da Nang',
          'Dien Bien',
          'Dong Nai',
          'Dong Thap',
          'Gia Lai',
          'Ha Giang',
          'Ha Nam',
          'Ha Noi',
          'Ha Tay',
          'Ha Tinh',
          'Hai Duong',
          'Hai Phong',
          'Hau Giang',
          'Ho Chi Minh City',
          'Hoa Binh',
          'Hung Yen',
          'Kien Giang',
          'Kon Tum',
          'Lai Chau',
          'Lam Dong',
          'Lang Son',
          'Lao Cai',
          'Long An',
          'Nam Dinh',
          'Nghe An',
          'Ninh Binh',
          'Ninh Thuan',
          'Phu Tho',
          'Phu Yen',
          'Quang Binh',
          'Quang Nam',
          'Quang Ngai',
          'Quang Ninh',
          'Quang Tri',
          'Soc Trang',
          'Son La',
          'Tay Ninh',
          'Thai Binh',
          'Thai Nguyen',
          'Thanh Hoa',
          'Thua Thien-Hue',
          'Tien Giang',
          'Tra Vinh',
          'Tuyen Quang',
          'Vinh Long',
          'Vinh Phuc',
          'Yen Bai',
        ];

        this.setCached(country, vietnamCities, this.cache.cities);
        return vietnamCities;
      }

      // For other countries, return empty array
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get districts for a city
   */
  async getDistricts(city) {
    // Return empty array - this would require a detailed API or database
    // In production, you would fetch from a geographic API or database
    return [];
  }

  /**
   * Get wards for a district
   */
  async getWards(district) {
    // Return empty array - this would require a detailed API or database
    return [];
  }

  /**
   * Validate address components
   */
  async validateAddress(country, city, district, ward) {
    const countries = await this.getCountries();
    const countryNames = countries.map((c) =>
      typeof c === 'string' ? c : c.code
    );
    if (!countryNames.includes(country)) {
      return { valid: false, error: 'Invalid country' };
    }

    const cities = await this.getCities(country);
    if (!cities.includes(city)) {
      return { valid: false, error: 'Invalid city' };
    }

    // District and ward validation would need a database
    // For now, just validate country and city
    return { valid: true };
  }

  /**
   * Get full address hierarchy
   */
  async getFullHierarchy(country, city, district) {
    return {
      countries: await this.getCountries(),
      cities: city ? await this.getCities(country) : [],
      districts: district ? await this.getDistricts(city) : [],
      wards: district ? await this.getWards(district) : [],
    };
  }

  /**
   * Search location by query
   */
  async searchLocation(query) {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const countries = await this.getCountries();
    const cities = await this.getCities('VN');

    const results = [];

    // Search countries
    countries.forEach((country) => {
      const countryName = typeof country === 'string' ? country : country.name;
      if (countryName.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'country',
          value: typeof country === 'string' ? country : country.code,
          name: countryName,
        });
      }
    });

    // Search cities
    cities.forEach((city) => {
      if (city.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'city',
          value: city,
          name: city,
        });
      }
    });

    return results.slice(0, 20); // Limit to 20 results
  }
}

module.exports = AddressRepository;
