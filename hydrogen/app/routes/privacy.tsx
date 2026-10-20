import type {Route} from './+types/privacy';
import {PolicyPage, loadPolicy, policyMeta} from '~/pages/PolicyPage';

export async function loader({context}: Route.LoaderArgs) {
  return loadPolicy(context, 'privacyPolicy');
}

export const meta: Route.MetaFunction = ({data, matches}) =>
  policyMeta(data?.policy, '/privacy', matches);

export default function Policy({loaderData}: Route.ComponentProps) {
  return <PolicyPage policy={loaderData.policy} />;
}
