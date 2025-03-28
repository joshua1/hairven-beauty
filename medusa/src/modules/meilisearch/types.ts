import { SearchTypes } from '@medusajs/types';
import type { Config, Settings } from 'meilisearch';

export interface MeiliSearchPluginOptions {
  /**
   * MeiliSearch client configuration
   */
  config: Config;

  /**
   * MeiliSearch index settings
   */
  settings?: Record<
    string,
    SearchTypes.IndexSettings & { indexSettings: Settings }
  >;
}
