import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "THSIX Verified",
    a: "All items are verified by THSIX, confirming their authenticity and quality through rigorous testing and verification processes.",
  },
  {
    q: "Our Promise",
    a: "We guarantee authenticity on every purchase. If any item is found to be inauthentic, we offer a full refund with no questions asked.",
  },
  {
    q: "Money Back Guarantee",
    a: "Shop with confidence knowing that all purchases are backed by our money-back guarantee. Your satisfaction is our priority.",
  },
  {
    q: "Shippings & EMIs",
    a: "We offer flexible shipping options and easy EMI plans to make your purchase convenient. Free standard shipping on all orders.",
  },
  {
    q: "FAQ",
    a: "Have more questions? Visit our FAQ page or contact our customer support team for detailed answers to common inquiries.",
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
