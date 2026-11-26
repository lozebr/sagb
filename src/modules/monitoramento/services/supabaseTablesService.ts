import { supabaseObservedAssets } from './supabaseObservabilityCatalog';

interface TableUsage {
  tableName: string;
  modules: string[];
  usageCount: number;
  category: 'alta' | 'media' | 'baixa';
}

interface ModuleTableData {
  moduleId: string;
  moduleName: string;
  tables: string[];
}

/**
 * Serviço para análise de uso de tabelas Supabase entre módulos
 * Varre todos os module-doc.ts e monta mapa de tabela → módulos
 */
export class SupabaseTablesService {
  private moduleDocs: ModuleTableData[] = [];

  /**
   * Catálogo declarado pelo SagB, NÃO leitura ao vivo de todos os schemas.
   * Conserva a interface histórica sem simular importação de module-docs.
   * O inventário de incubadoras tem fonte e classe de projeto próprias.
   */
  async loadModuleDocs(): Promise<void> {
    const byModule = new Map<string, ModuleTableData>();
    for (const asset of supabaseObservedAssets) {
      if (asset.kind !== 'table') continue;
      const key = asset.moduleId;
      const existing = byModule.get(key) || {
        moduleId: key,
        moduleName: asset.moduleName,
        tables: []
      };
      if (!existing.tables.includes(asset.tableName)) existing.tables.push(asset.tableName);
      byModule.set(key, existing);
    }
    this.moduleDocs = Array.from(byModule.values());
  }

  /** Declarações do catálogo local, não garantia de existência física. */
  extractTableData(): ModuleTableData[] {
    return this.moduleDocs.map((item) => ({ ...item, tables: [...item.tables] }));
  }

  /**
   * Agrega uso de tabelas por módulo
   */
  aggregateTableUsage(): TableUsage[] {
    const moduleData = this.extractTableData();
    const tableMap = new Map<string, string[]>();

    // Construir mapa tabela → [módulos]
    moduleData.forEach(({ moduleName, tables }) => {
      tables.forEach(table => {
        if (!tableMap.has(table)) {
          tableMap.set(table, []);
        }
        tableMap.get(table)!.push(moduleName);
      });
    });

    // Converter para array de TableUsage
    return Array.from(tableMap.entries()).map(([tableName, modules]) => {
      const usageCount = modules.length;
      let category: 'alta' | 'media' | 'baixa' = 'baixa';
      
      if (usageCount >= 3) category = 'alta';
      else if (usageCount === 2) category = 'media';

      return {
        tableName,
        modules,
        usageCount,
        category
      };
    });
  }

  /**
   * Retorna tabelas ordenadas por uso (mais usadas primeiro)
   */
  getTablesByUsage(): TableUsage[] {
    const usage = this.aggregateTableUsage();
    return usage.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Retorna tabelas usadas por apenas um módulo (potencialmente órfãs)
   */
  getOrphanTables(): TableUsage[] {
    const usage = this.aggregateTableUsage();
    return usage.filter(table => table.usageCount === 1);
  }

  /**
   * Retorna tabelas usadas por múltiplos módulos (dependências críticas)
   */
  getSharedTables(): TableUsage[] {
    const usage = this.aggregateTableUsage();
    return usage.filter(table => table.usageCount >= 2);
  }

  /**
   * Retorna módulos que usam uma tabela específica
   */
  getModulesUsingTable(tableName: string): string[] {
    const usage = this.aggregateTableUsage();
    const table = usage.find(t => t.tableName === tableName);
    return table?.modules || [];
  }

  /**
   * Retorna estatísticas gerais
   */
  getStats() {
    const usage = this.aggregateTableUsage();
    const totalTables = usage.length;
    const orphanTables = usage.filter(t => t.usageCount === 1).length;
    const sharedTables = usage.filter(t => t.usageCount >= 2).length;
    const highUsageTables = usage.filter(t => t.category === 'alta').length;

    return {
      totalTables,
      orphanTables,
      sharedTables,
      highUsageTables,
      modulesAnalyzed: this.moduleDocs.length
    };
  }
}

// Instância singleton para uso global
export const supabaseTablesService = new SupabaseTablesService();