import {redirect} from 'react-router';

// /cart and /cart/* (Shopify cart permalinks) go back to the home page
export async function loader() {
  return redirect('/');
}
