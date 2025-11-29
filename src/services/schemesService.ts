import { Scheme, SchemesData } from '../types/schemes';
import schemesData from '../data/schemes.json';

class SchemesService {
  private schemes: Scheme[] = [];

  constructor() {
    this.schemes = (schemesData as SchemesData).schemes;
  }

  /**
   * Get all government schemes
   */
  getAllSchemes(): Scheme[] {
    return this.schemes;
  }

  /**
   * Get scheme by ID
   */
  getSchemeById(id: string): Scheme | undefined {
    return this.schemes.find(scheme => scheme.id === id);
  }

  /**
   * Get schemes by category
   */
  getSchemesByCategory(category: string): Scheme[] {
    return this.schemes.filter(scheme => scheme.category === category);
  }

  /**
   * Search schemes by name or description
   */
  searchSchemes(query: string, language: 'en' | 'ml' = 'en'): Scheme[] {
    const searchTerm = query.toLowerCase();
    return this.schemes.filter(scheme => {
      const name = scheme.name[language].toLowerCase();
      const description = scheme.description[language].toLowerCase();
      const eligibility = scheme.eligibility.toLowerCase();
      
      return name.includes(searchTerm) || 
             description.includes(searchTerm) || 
             eligibility.includes(searchTerm);
    });
  }

  /**
   * Get schemes categories
   */
  getCategories(): string[] {
    const categories = new Set(this.schemes.map(scheme => scheme.category));
    return Array.from(categories);
  }

  /**
   * Get scheme name by language
   */
  getSchemeName(scheme: Scheme, language: 'en' | 'ml'): string {
    return scheme.name[language];
  }

  /**
   * Get scheme description by language
   */
  getSchemeDescription(scheme: Scheme, language: 'en' | 'ml'): string {
    return scheme.description[language];
  }

  /**
   * Get scheme title by language
   */
  getSchemeTitle(scheme: Scheme, language: 'en' | 'ml'): string {
    return scheme.scheme[language];
  }
}

export const schemesService = new SchemesService();
export default schemesService;