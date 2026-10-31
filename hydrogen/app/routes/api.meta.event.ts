import type {Route} from './+types/api.meta.event';
import handler from '~/server/handlers/meta-event.js';
import {handleApi} from '~/server/lib/http.js';

// POST /api/meta/event
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
