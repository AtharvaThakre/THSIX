import {redirect} from 'react-router';
import type {Route} from './+types/products.$handle';

export async function loader({params, request}: Route.LoaderArgs) {
  const {search} = new URL(request.url);
  return redirect(`/product/${params.handle}${search}`, 301);
}
