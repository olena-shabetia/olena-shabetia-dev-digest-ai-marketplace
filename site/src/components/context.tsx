import { createContext, useContext } from 'react';
import type { SearchIndex } from '../search';
import type { Catalog } from '../types';

export interface CatalogCtx {
  catalog: Catalog;
  index: SearchIndex;
}

const Ctx = createContext<CatalogCtx | null>(null);
export const CatalogProvider = Ctx.Provider;

export function useCatalogCtx(): CatalogCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('CatalogProvider is missing');
  return v;
}
