export interface LookbookItem {
  id: string;
  title: string;
  image: string;
  alt: string;
  webp?: string;
  webp2x?: string;
  fallback?: string;
}

export const lookbookItems: LookbookItem[] = [
  {
    id: '01',
    title: 'CITY MOVES',
    image: '/assets/lookbook/city-moves.jpg?v=2',
    webp: '/assets/lookbook/city-moves.webp',
    webp2x: '/assets/lookbook/city-moves@2x.webp',
    alt: 'City Moves THSIX lookbook',
  },
  {
    id: '02',
    title: 'EVERYDAY ESSENTIALS',
    image: '/assets/lookbook/everyday-essentials.jpg?v=2',
    webp: '/assets/lookbook/everyday-essentials.webp',
    webp2x: '/assets/lookbook/everyday-essentials@2x.webp',
    alt: 'Everyday Essentials THSIX lookbook',
  },
  {
    id: '03',
    title: 'CLEAN & CLASSIC',
    image: '/assets/lookbook/clean-and-classic.jpg?v=2',
    webp: '/assets/lookbook/clean-and-classic.webp',
    webp2x: '/assets/lookbook/clean-and-classic@2x.webp',
    fallback: '/assets/lookbook/clean-and-classic-fallback.jpg',
    alt: 'Clean & Classic THSIX lookbook',
  },
  {
    id: '04',
    title: 'STYLE BEYOND BASICS',
    image: '/assets/lookbook/style-beyond-basics.jpg?v=2',
    webp: '/assets/lookbook/style-beyond-basics.webp',
    webp2x: '/assets/lookbook/style-beyond-basics@2x.webp',
    alt: 'Style Beyond Basics THSIX lookbook',
  },
];
