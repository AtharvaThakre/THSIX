import type {Route} from './+types/contactus';
import {ContactPage} from '~/pages/ContactPage';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({matches}) =>
  seoMeta({matches, path: '/contactus', title: 'Contact Us | THSIX'});

export default ContactPage;
