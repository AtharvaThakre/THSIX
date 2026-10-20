import type {Route} from './+types/api.webhooks.order';
import handler from '~/server/handlers/webhook-order.js';
import {runApiHandler} from '~/server/run-api-handler';

// POST /api/webhooks/order
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return runApiHandler(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return runApiHandler(handler, request, context.env);
}
