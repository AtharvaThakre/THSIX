import type {Route} from './+types/about';
import {AboutPage} from '~/pages/AboutPage';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({matches}) =>
  seoMeta({matches, path: '/about', title: 'About THSIX | THSIX'});

export default AboutPage;
