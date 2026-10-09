import type { SourceType } from "./types";

export type CorpusDoc = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceRef: string;
  body: string;
};

/**
 * Built-in reference documents shared by every institution. Empty: matching
 * runs against each institution's own source library and earlier submissions.
 */
export const CORPUS: CorpusDoc[] = [];
