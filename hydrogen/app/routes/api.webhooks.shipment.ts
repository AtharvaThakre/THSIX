import type {Route} from './+types/api.webhooks.shipment';
import handler from '~/server/handlers/webhook-shipment.js';
import {handleApi} from '~/server/lib/http.js';

// POST /api/webhooks/shipment
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
