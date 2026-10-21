export interface LookbookItem {
  id: string;
  title: string;
  alt: string;
  /**
   * Asset stem under /assets/lookbook/. Files are
   * `<slug>-desk[@2x].{webp,avif}` (7:4 crop, shown on wider screens) and
   * `<slug>-mobile[@2x].{webp,avif}` (3:4 crop, shown at 640px and below).
   */
  slug: string;
  /** Pixel widths of the 1x and optional 2x desktop candidates. */
  desktopWidths: number[];
  /** Pixel widths of the 1x and optional 2x mobile candidates. */
  mobileWidths: number[];
}

export const lookbookItems: LookbookItem[] = [
  {
    id: '01',
    title: 'CITY MOVES',
    alt: 'City Moves THSIX lookbook',
    slug: 'city-moves',
    desktopWidths: [850, 1254],
    mobileWidths: [360, 720],
  },
  {
    id: '02',
    title: 'EVERYDAY ESSENTIALS',
    alt: 'Everyday Essentials THSIX lookbook',
    slug: 'everyday-essentials',
    desktopWidths: [850, 1254],
    mobileWidths: [360, 720],
  },
  {
    id: '03',
    title: 'CLEAN & CLASSIC',
    alt: 'Clean & Classic THSIX lookbook',
    slug: 'clean-and-classic',
    desktopWidths: [850, 1700],
    mobileWidths: [360, 720],
  },
  {
    id: '04',
    title: ' ',
    alt: 'Style Beyond Basics THSIX lookbook',
    slug: 'style-beyond-basics',
    desktopWidths: [736],
    mobileWidths: [360, 690],
  },
];
