import type {Route} from './+types/payment-policy';
import {PolicyPage, loadPolicy, policyMeta} from '~/pages/PolicyPage';

export async function loader({context}: Route.LoaderArgs) {
  return loadPolicy(context, 'termsOfService');
}

export const meta: Route.MetaFunction = ({data, matches}) =>
  // Same document as /terms (scrolled to Payment), so it canonicalises there
  policyMeta(data?.policy, '/terms', matches);

export default function Policy({loaderData}: Route.ComponentProps) {
  return <PolicyPage policy={loaderData.policy} section="Payment" />;
}
