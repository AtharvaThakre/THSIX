import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateWebhook } from '../lib/auth';
import { sendSuccess, sendAuthError, sendValidationError } from '../lib/response';
import { config } from '../lib/config';
import type { OrderWebhookPayload } from '../lib/types';

/**
 * POST /api/webhooks/order
 * Webhook endpoint to receive order details from Shiprocket after checkout
 * This is called by Shiprocket when an order is placed
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authentication headers
    const apiKey = req.headers['x-api-key'] as string;
    const hmacSignature = req.headers['x-api-hmac-sha256'] as string;

    // Authenticate the webhook request
    const auth = authenticateWebhook(
      apiKey,
      hmacSignature,
      req.body,
      config.shiprocketApiKey,
      config.shiprocketApiSecret
    );

    if (!auth.authenticated) {
      console.error('Webhook authentication failed:', auth.error);
      return sendAuthError(res, auth.error);
    }

    // Parse webhook payload
    const orderData: OrderWebhookPayload = req.body;

    // Validate required fields
    if (!orderData.order_id) {
      return sendValidationError(res, 'order_id is required');
    }

    if (!orderData.cart_data || !orderData.cart_data.items) {
      return sendValidationError(res, 'cart_data.items is required');
    }

    console.log('Received order webhook:', {
      order_id: orderData.order_id,
      status: orderData.status,
      email: orderData.email,
      phone: orderData.phone,
      payment_type: orderData.payment_type,
      payment_status: orderData.payment_status,
      total_amount: orderData.total_amount_payable
    });

    // TODO: Process the order in your system
    // This is where you would:
    // 1. Create order in your database
    // 2. Update inventory
    // 3. Send confirmation email
    // 4. Trigger any other business logic
    
    // Example order processing:
    await processOrder(orderData);

    // Acknowledge receipt of webhook
    return sendSuccess(res, {
      received: true,
      order_id: orderData.order_id,
      message: 'Order webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing order webhook:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Process the order - implement your business logic here
 */
async function processOrder(orderData: OrderWebhookPayload): Promise<void> {
  // TODO: Implement your order processing logic
  // Examples:
  
  // 1. Save order to database
  console.log('Saving order to database:', orderData.order_id);
  // await saveOrderToDatabase(orderData);
  
  // 2. Update product inventory
  console.log('Updating inventory for items:', orderData.cart_data.items.length);
  // for (const item of orderData.cart_data.items) {
  //   await updateInventory(item.variant_id, -item.quantity);
  // }
  
  // 3. Send confirmation email
  if (orderData.email) {
    console.log('Sending confirmation email to:', orderData.email);
    // await sendOrderConfirmationEmail(orderData.email, orderData);
  }
  
  // 4. Send SMS notification
  if (orderData.phone) {
    console.log('Sending SMS notification to:', orderData.phone);
    // await sendOrderSMS(orderData.phone, orderData);
  }
  
  // 5. Create shipping label (if applicable)
  if (orderData.status === 'SUCCESS' && orderData.payment_status === 'Success') {
    console.log('Order paid successfully, ready for fulfillment');
    // await createShippingLabel(orderData);
  }
  
  // 6. Log for analytics
  console.log('Order processed successfully:', {
    order_id: orderData.order_id,
    revenue: orderData.total_amount_payable,
    items_count: orderData.cart_data.items.length,
    payment_type: orderData.payment_type
  });
}
