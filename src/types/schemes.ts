export interface Scheme {
  id: string;
  name: {
    en: string;
    ml: string;
  };
  description: {
    en: string;
    ml: string;
  };
  scheme: {
    en: string;
    ml: string;
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