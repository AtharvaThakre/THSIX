import type {Route} from './+types/api.webhooks.shipment';
import handler from '~/server/handlers/webhook-shipment.js';
import {runApiHandler} from '~/server/run-api-handler';

// POST /api/webhooks/shipment
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return runApiHandler(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return runApiHandler(handler, request, context.env);
}
