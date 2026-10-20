import type {Route} from './+types/returns';
import {PolicyPage, loadPolicy, policyMeta} from '~/pages/PolicyPage';

export async function loader({context}: Route.LoaderArgs) {
  return loadPolicy(context, 'refundPolicy');
}

export const meta: Route.MetaFunction = ({data, matches}) =>
  policyMeta(data?.policy, '/returns', matches);

export default function Policy({loaderData}: Route.ComponentProps) {
  return <PolicyPage policy={loaderData.policy} />;
}
