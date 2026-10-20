import type {Route} from './+types/checkout.success';
import {CheckoutSuccess} from '~/pages/CheckoutSuccess';
import {seoMeta} from '~/lib/seo';

// Order confirmation: never indexed
export const meta: Route.MetaFunction = ({matches}) =>
  seoMeta({matches, path: '/checkout/success', title: 'Order Status | THSIX', noindex: true});

export default CheckoutSuccess;
