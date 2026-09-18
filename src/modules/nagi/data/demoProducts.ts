import { PublishedAppLink, PUBLISHED_APP_LINKS } from './publishedLinks';

export type DemoProductStatus = 'validated' | 'review' | 'blocked' | 'not_verified';

export interface DemoProduct {
  productId: string;
  name: string;
  company: string;
  description?: string;
  version?: string;
  demoUrl?: string;
  status: DemoProductStatus;
  aliases: string[];
  legacyLinks: PublishedAppLink[];
  note?: string;
}

const PRODUCT_ID_BY_LINK_ID: Record<string, string> = {
  sagbapp: 'sagb',
  '3forb': 'site-3forb',
  'site-3forb-testes': 'site-3forb',
  'eda-360': 'eda-360',
  eda360: 'eda-360',
  'qg-3forb-novo': 'qg-3forb',
  'qg-3forb': 'qg-3forb',
  'capscan-loze': 'radscan',
  'crm-loze': 'crm-loze',
  zipliacrm: 'crm-loze',
  'loze-nexo-web': 'livze',
  'loze-taskzei-web': 'taskzei',
  'taskzei-loze-web': 'taskzei',
  taskzei: 'taskzei',
};

const PRODUCT_OVERRIDES: Partial<Record<string, Partial<Omit<DemoProduct, 'productId' | 'aliases' | 'legacyLinks'>>>> = {
  sagb: {
    name: 'SagB',
    company: 'GrupoB',
    description: 'Sistema Autônomo GrupoB',
  },
  'site-3forb': {
    name: 'Site 3forB',
    company: '3forB',
    description: 'Site institucional',
  },
  'qg-3forb': {
    name: 'QG 3forB',
    company: '3forB',
    description: 'QG operacional',
  },
  radscan: {
    name: 'RADSCAN',
    company: 'Loze',
    description: 'Prospecção',
    note: 'Registro histórico do CapScan consolidado sob a identidade de produto RADSCAN.',
  },
  'crm-loze': {
    name: 'CRM LOZE',
    company: 'Loze',
    description: 'Gestão CRM',
    note: 'CRM Ziplia preservado como histórico do CRM LOZE consolidado.',
  },
  livze: {
    name: 'LIVZE',
    company: 'Loze',
    description: 'Memória Viva de Saúde',
    note: 'NEXO é referência legada do produto oficial LIVZE.',
  },
  taskzei: {
    name: 'TaskZei',
    company: 'Loze',
    description: 'Produtividade e execução',
    demoUrl: 'https://deploy-preview-3--loze-taskzei-web.netlify.app',
    status: 'validated',
    note: 'Deploy Preview de homologação informado no README oficial do produto.',
  },
};

const byProduct = PUBLISHED_APP_LINKS.reduce<Record<string, PublishedAppLink[]>>((acc, link) => {
  const productId = PRODUCT_ID_BY_LINK_ID[link.id] || link.id;
  if (!acc[productId]) acc[productId] = [];
  acc[productId].push(link);
  return acc;
}, {});

export const DEMO_PRODUCTS: DemoProduct[] = Object.entries(byProduct)
  .map(([productId, legacyLinks]) => {
    const primary = legacyLinks[0];
    const override = PRODUCT_OVERRIDES[productId] || {};
    const aliases = Array.from(new Set(
      legacyLinks.flatMap((link) => [link.title, link.siteName]).filter(Boolean),
    ));

    return {
      productId,
      name: override.name || primary.title,
      company: override.company || primary.company,
      description: override.description,
      version: override.version,
      demoUrl: override.demoUrl,
      status: override.status || 'not_verified',
      aliases,
      legacyLinks,
      note: override.note,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

export const getDemoProductCompanies = (products: DemoProduct[] = DEMO_PRODUCTS) =>
  Array.from(new Set(products.map((product) => product.company)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const DEMO_REGISTRY_AUDIT = {
  legacyRecordCount: PUBLISHED_APP_LINKS.length,
  uniqueProductCount: DEMO_PRODUCTS.length,
  hiddenDuplicateCards: PUBLISHED_APP_LINKS.length - DEMO_PRODUCTS.length,
};
