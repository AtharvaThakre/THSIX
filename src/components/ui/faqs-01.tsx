import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is THSIX?",
    a: "THSIX is a youth-focused footwear and culture brand built around self-expression, contemporary fashion, street culture, and modern styling. Our collection features *Premium inspired sneakers*, selected for customers who appreciate distinctive silhouettes and contemporary designs.",
  },
  {
    q: "What does “Premium inspired sneakers” mean?",
    a: "“Premium inspired sneakers” refers to footwear designed with contemporary silhouettes, colour combinations, and styling influences from modern sneaker culture. THSIX products are presented under the THSIX brand and are not represented as products of any unrelated third-party brand.",
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes, COD is available on every THSIX product. Our COD orders follow a partial-payment model, where a fixed advance amount of ₹199 is paid at the time of placing the order and the remaining amount is payable at the time of delivery, if a product is priced at *₹3,499, you pay *₹199 online while placing the order*, and the remaining *₹3,300** is payable to the delivery partner upon delivery.The ₹199 advance is part of the order payment and is adjusted against the total product price.",
  },
  {
    q: "How does shipping work?",
    a: "Orders are processed after successful order confirmation and are shipped to the delivery address provided by the customer. Delivery timelines may vary depending on the destination, courier service, weather, operational conditions, and other circumstances. Tracking details will be provided where available.",
  },
  {
    q: "Can I cancel my order?",
    a: "Cancellation may be requested before the order enters the shipping or fulfilment process. Once an order has been dispatched, cancellation may no longer be possible and the applicable return or delivery procedure will apply. Customers should contact THSIX support as soon as possible for cancellation requests.",
  },
  {
    q: "What is your return or exchange policy?",
    a: "Returns or exchanges are subject to the eligibility conditions applicable to the order. Products generally need to be unused, in their original condition, and accompanied by the required packaging and order details. Damaged, incorrect, or defective products should be reported to THSIX within the specified timeframe with appropriate photographs or supporting information.",
  },
  {
    q: "Where can I contact THSIX for support?",
    a: "For questions regarding orders, shipping, cancellations, returns, payments, or other website-related matters, customers can contact the THSIX support team through *[support@thsix.com](mailto:support@thsix.com)*. Please include your order number and relevant details so that the team can assist efficiently.",
  },
];

export default function Faqs01({ defaultValue }: { defaultValue?: string }) {
  return (
    <section className="product-detail__section" style={{ borderBottom: 'none', paddingBottom: '48px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          background: '#f8f8f8',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#666',
          marginBottom: '16px'
        }}>
          
        </span>
        <h2 style={{
          fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
          fontWeight: '700',
          letterSpacing: '-0.02em',
          lineHeight: '1.1',
          color: '#111',
          marginBottom: '12px'
        }}>
          Most Asked Questions
        </h2>
        <p style={{
          maxWidth: '600px',
          margin: '0 auto',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6'
        }}>
          Quick answers to the questions we get the most. Can't find yours? Write to{" "}
          <a
            href="mailto:support@thsix.com"
            style={{
              fontWeight: '600',
              color: '#111',
              textDecoration: 'underline',
              textUnderlineOffset: '3px'
            }}
          >
            support@thsix.com
          </a>
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue={defaultValue}
        style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {faqs.map((f, i) => (
          <AccordionItem 
            key={f.q} 
            value={`item-${i}`}
            style={{
              borderBottom: '1px solid #f0f0ed',
              padding: '4px 0'
            }}
          >
            <AccordionTrigger style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111',
              textAlign: 'left',
              padding: '16px 0'
            }}>
              {f.q}
            </AccordionTrigger>
            <AccordionContent style={{
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.7',
              paddingBottom: '16px'
            }}>
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
