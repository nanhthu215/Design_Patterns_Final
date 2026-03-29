/**
 * Data Export Strategy Pattern
 * Strategy Pattern for exporting data in different formats
 */

// Base Strategy Interface
class ExportStrategy {
  /**
   * Export data to specific format
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {string|Buffer} Exported data
   */
  async export(data, options = {}) {
    throw new Error('Export method must be implemented by subclass');
  }

  /**
   * Get content type for HTTP response
   */
  getContentType() {
    throw new Error('getContentType method must be implemented by subclass');
  }

  /**
   * Get file extension
   */
  getFileExtension() {
    throw new Error('getFileExtension method must be implemented by subclass');
  }
}

// CSV Export Strategy
class CSVExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { headers = [], delimiter = ',' } = options;

    if (!data || data.length === 0) {
      return '';
    }

    // Auto-detect headers if not provided
    const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);

    // Convert data to CSV rows
    const rows = data.map(item => {
      return csvHeaders.map(header => {
        const value = item[header] || '';
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        const stringValue = String(value);
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ].join('\n');

    return csvContent;
  }

  getContentType() {
    return 'text/csv';
  }

  getFileExtension() {
    return 'csv';
  }
}

// JSON Export Strategy
class JSONExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { pretty = true, rootKey = null } = options;

    let exportData = data;

    // Wrap in root key if specified
    if (rootKey) {
      exportData = { [rootKey]: data };
    }

    return JSON.stringify(exportData, null, pretty ? 2 : 0);
  }

  getContentType() {
    return 'application/json';
  }

  getFileExtension() {
    return 'json';
  }
}

// XML Export Strategy
class XMLExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { rootElement = 'data', itemElement = 'item' } = options;

    if (!data || data.length === 0) {
      return `<${rootElement}></${rootElement}>`;
    }

    const items = data.map(item => {
      const properties = Object.entries(item)
        .map(([key, value]) => `  <${key}>${this._escapeXml(String(value))}</${key}>`)
        .join('\n');

      return `  <${itemElement}>\n${properties}\n  </${itemElement}>`;
    }).join('\n');

    return `<${rootElement}>\n${items}\n</${rootElement}>`;
  }

  _escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  getContentType() {
    return 'application/xml';
  }

  getFileExtension() {
    return 'xml';
  }
}

// Excel Export Strategy (Simplified - creates basic Excel XML)
class ExcelExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { sheetName = 'Sheet1' } = options;

    if (!data || data.length === 0) {
      return this._createEmptyExcel(sheetName);
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => item[header] || '').join('\t')
    );

    const excelContent = [
      headers.join('\t'),
      ...rows
    ].join('\n');

    return excelContent;
  }

  _createEmptyExcel(sheetName) {
    return `Sheet: ${sheetName}\nNo data available`;
  }

  getContentType() {
    return 'application/vnd.ms-excel';
  }

  getFileExtension() {
    return 'xls';
  }
}

// Export Strategy Factory
class ExportStrategyFactory {
  static createStrategy(format) {
    switch (format.toLowerCase()) {
      case 'csv':
        return new CSVExportStrategy();
      case 'json':
        return new JSONExportStrategy();
      case 'xml':
        return new XMLExportStrategy();
      case 'excel':
      case 'xls':
        return new ExcelExportStrategy();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  static getSupportedFormats() {
    return ['csv', 'json', 'xml', 'excel'];
  }
}

// Export Service - Context class that uses strategies
class DataExportService {
  constructor() {
    this.strategies = new Map();
  }

  /**
   * Register a custom export strategy
   */
  registerStrategy(format, strategy) {
    if (!(strategy instanceof ExportStrategy)) {
      throw new Error('Strategy must extend ExportStrategy');
    }
    this.strategies.set(format.toLowerCase(), strategy);
  }

  /**
   * Export data using specified format
   */
  async exportData(data, format, options = {}) {
    const strategy = this.strategies.get(format.toLowerCase()) ||
                     ExportStrategyFactory.createStrategy(format);

    const exportedData = await strategy.export(data, options);

    return {
      data: exportedData,
      contentType: strategy.getContentType(),
      fileExtension: strategy.getFileExtension(),
      format: format.toLowerCase()
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    const factoryFormats = ExportStrategyFactory.getSupportedFormats();
    const customFormats = Array.from(this.strategies.keys());
    return [...new Set([...factoryFormats, ...customFormats])];
  }
}

module.exports = {
  ExportStrategy,
  CSVExportStrategy,
  JSONExportStrategy,
  XMLExportStrategy,
  ExcelExportStrategy,
  ExportStrategyFactory,
  DataExportService
};