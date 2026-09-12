export interface LookbookItem {
  id: string;
  title: string;
  image: string;
  alt: string;
}

export const lookbookItems: LookbookItem[] = [
  {
    id: '01',
    title: 'CITY MOVES',
    image: '/assets/lookbook/city-moves.jpg',
    alt: 'City Moves THSIX lookbook',
  },
  {
    id: '02',
    title: 'EVERYDAY ESSENTIALS',
    image: '/assets/lookbook/everyday-essentials.jpg',
    alt: 'Everyday Essentials THSIX lookbook',
  },
  {
    id: '03',
    title: 'CLEAN & CLASSIC',
    image: '/assets/lookbook/clean-and-classic.jpg',
    alt: 'Clean & Classic THSIX lookbook',
  },
  {
    id: '04',
    title: 'STYLE BEYOND BASICS',
    image: '/assets/lookbook/style-beyond-basics.jpg',
    alt: 'Style Beyond Basics THSIX lookbook',
  },
];
