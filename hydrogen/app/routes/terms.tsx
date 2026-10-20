import type {Route} from './+types/terms';
import {PolicyPage, loadPolicy, policyMeta} from '~/pages/PolicyPage';

export async function loader({context}: Route.LoaderArgs) {
  return loadPolicy(context, 'termsOfService');
}

export const meta: Route.MetaFunction = ({data, matches}) =>
  policyMeta(data?.policy, '/terms', matches);

export default function Policy({loaderData}: Route.ComponentProps) {
  return <PolicyPage policy={loaderData.policy} />;
}
