export const CAROUSEL_STRUCTURE_FIELDS = [
  'enableImage',
  'enableTitle',
  'enableContent',
  'enablePrice',
  'enableImageUrl',
  'enableButton1',
  'enableButton2',
  'enableButton3',
  'enableButton4',
] as const;

export type CarouselStructureField = typeof CAROUSEL_STRUCTURE_FIELDS[number];
