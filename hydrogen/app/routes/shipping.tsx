import type {Route} from './+types/shipping';
import {PolicyPage, loadPolicy, policyMeta} from '~/pages/PolicyPage';

export async function loader({context}: Route.LoaderArgs) {
  return loadPolicy(context, 'shippingPolicy');
}

export const meta: Route.MetaFunction = ({data, matches}) =>
  policyMeta(data?.policy, '/shipping', matches);

export default function Policy({loaderData}: Route.ComponentProps) {
  return <PolicyPage policy={loaderData.policy} />;
}
