import { IModuleSettingsDefinition } from './IModuleSettings';

/**
 * Webakus - Merkezi Modül Ayarları Kayıt ve Keşif Kütüphanesi
 * Herhangi bir modülün kendi sektörel ayar bileşenini sisteme kaydetmesini
 * ve Faaliyet Formu gibi genel yapılardan bu ayarlara dinamik erişilmesini sağlar.
 */
class ModuleSettingsRegistryImpl {
  private definitions: Map<string, IModuleSettingsDefinition> = new Map();
  private aliasMap: Map<string, string> = new Map();

  /**
   * Modül ayar tanımını sisteme kaydeder
   */
  public register(definition: IModuleSettingsDefinition): void {
    if (!definition || !definition.moduleId) return;
    const normalizedKey = definition.moduleId.trim().toLowerCase();
    this.definitions.set(normalizedKey, definition);
    this.aliasMap.set(normalizedKey, normalizedKey);

    if (definition.aliases && Array.isArray(definition.aliases)) {
      for (const alias of definition.aliases) {
        if (alias) {
          this.aliasMap.set(alias.trim().toLowerCase(), normalizedKey);
        }
      }
    }
  }

  /**
   * Modül koduna veya alias'ına göre ayar tanımını döner
   */
  public get(moduleIdOrAlias: string): IModuleSettingsDefinition | undefined {
    if (!moduleIdOrAlias) return undefined;
    const query = moduleIdOrAlias.trim().toLowerCase();
    const primaryKey = this.aliasMap.get(query) || query;
    return this.definitions.get(primaryKey);
  }

  /**
   * Belirtilen modül için bir ayar bileşeni kayıtlı mı?
   */
  public has(moduleIdOrAlias: string): boolean {
    if (!moduleIdOrAlias) return false;
    const query = moduleIdOrAlias.trim().toLowerCase();
    const primaryKey = this.aliasMap.get(query) || query;
    return this.definitions.has(primaryKey);
  }

  /**
   * Kayıtlı tüm modül ayar tanımlarını dizi olarak döner
   */
  public getAll(): IModuleSettingsDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Kayıtları temizler (testler için)
   */
  public clear(): void {
    this.definitions.clear();
    this.aliasMap.clear();
  }
}

export const ModuleSettingsRegistry = new ModuleSettingsRegistryImpl();
export default ModuleSettingsRegistry;
