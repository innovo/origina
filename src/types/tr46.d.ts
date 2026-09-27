declare module "tr46" {
  export interface ProcessingOptions {
    checkHyphens?: boolean;
    checkBidi?: boolean;
    checkJoiners?: boolean;
    useSTD3ASCIIRules?: boolean;
    verifyDNSLength?: boolean;
    transitionalProcessing?: boolean;
    ignoreInvalidPunycode?: boolean;
  }
  export function toASCII(domain: string, options?: ProcessingOptions): string | null;
  export function toUnicode(
    domain: string,
    options?: ProcessingOptions,
  ): { domain: string; error: boolean };
}
