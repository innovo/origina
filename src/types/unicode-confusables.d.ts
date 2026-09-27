declare module "unicode-confusables" {
  export interface ConfusablePoint {
    point: string;
    similarTo?: string;
  }
  export function isConfusing(input: string): boolean;
  export function confusables(input: string): ConfusablePoint[];
  export function rectifyConfusion(input: string): string;
}
