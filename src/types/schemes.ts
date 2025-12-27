export interface Scheme {
  id: string;
  name: {
    en: string;
    ta: string;
  };
  description: {
    en: string;
    ta: string;
  };
  scheme: {
    en: string;
    ta: string;
  };
  component: string;
  eligibility: string;
  how_to_avail: string;
  contact: string;
  online_url: string;
  category: 'insurance' | 'pricing' | 'subsidy' | 'testing';
  icon: string;
}

export interface SchemesData {
  schemes: Scheme[];
}