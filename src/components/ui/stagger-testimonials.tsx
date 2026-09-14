"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

export interface TestimonialItem {
  tempId: number;
  testimonial: string;
  by: string;
  imgSrc: string;
}

export const shoeTestimonials: TestimonialItem[] = [
  {
    tempId: 0,
    testimonial: "The silhouette on the THSIX Phantom Lows is unreal in hand. The suede craftsmanship beats anything from mainstream drops.",
    by: "Marcus, Sneaker Collector",
    imgSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 1,
    testimonial: "Wore these all day across Milan Fashion Week. Immaculate arch support and zero creasing in the toe box.",
    by: "Elena, Streetwear Stylist",
    imgSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 2,
    testimonial: "The buttery Italian leather and distressed edge treatment feel like true bespoke luxury. Worth every single penny.",
    by: "David, Verified Buyer",
    imgSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 3,
    testimonial: "Packaging was pristine, double-boxed with premium dust bags. The sole geometry turns heads everywhere I walk.",
    by: "Chloe, Creative Director",
    imgSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 4,
    testimonial: "If I could give these sneakers 11 stars, I'd give 12. The heel cup lock-in is the best in my entire 40-pair collection.",
    by: "Andre, Footwear Designer",
    imgSrc: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 5,
    testimonial: "SO GLAD I CAUGHT THE DROP! The chunky brutalist sole is surprisingly light and ridiculously comfortable.",
    by: "Jeremy, Sneaker Enthusiast",
    imgSrc: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 6,
    testimonial: "Was skeptical about sizing, but customer support guided me to size down half a size. Fits like a custom glove.",
    by: "Pam, Apparel Curator",
    imgSrc: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 7,
    testimonial: "The textural contrast between the ballistic nylon and nubuck is pure artistry. Easily my sneaker of the year.",
    by: "Daniel, Fashion Editor",
    imgSrc: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 8,
    testimonial: "The cleanest monochrome colorway I own. They elevate simple raw denim or tailored trousers effortlessly.",
    by: "Fernando, Visual Artist",
    imgSrc: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 9,
    testimonial: "Switched to THSIX footwear two seasons ago and never looked back. The durability on concrete is exceptional.",
    by: "Andy, Urban Architect",
    imgSrc: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 10,
    testimonial: "Been searching for an avant-garde silhouette that doesn't sacrifice walking comfort. This is the holy grail.",
    by: "Pete, Brand Director",
    imgSrc: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 11,
    testimonial: "The waxed laces, metal aglets, and debossed branding on the tongue demonstrate insane attention to detail.",
    by: "Marina, Product Stylist",
    imgSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 12,
    testimonial: "THSIX shipping to London took only 3 business days. Arrived in showroom condition. 10/10 service.",
    by: "Olivia, Studio Lead",
    imgSrc: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 13,
    testimonial: "The ergonomic footbed is incredible. Logged 18,000 steps during Tokyo Art Fair with zero heel fatigue.",
    by: "Raj, Industrial Designer",
    imgSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 14,
    testimonial: "The matte rubber sole compound grips like motorsport tires on slick wet streets. Utter perfection.",
    by: "Lila, Graphic Designer",
    imgSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 15,
    testimonial: "Distinctive angular profile without being gimmicky. THSIX continues to define modern luxury streetwear.",
    by: "Trevor, Streetwear Enthusiast",
    imgSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 16,
    testimonial: "The contrast paneling catches light dynamically. Everyone at the studio stopped me to ask where I got them.",
    by: "Naomi, Trend Forecaster",
    imgSrc: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 17,
    testimonial: "Quality that easily rivals four-figure Parisian runway sneakers at a fraction of the cost.",
    by: "Victor, Fashion Collector",
    imgSrc: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 18,
    testimonial: "Robust construction, breathable perforated vamp, and supple lining. You can wear them all day without socks.",
    by: "Yuki, Concept Designer",
    imgSrc: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
  },
  {
    tempId: 19,
    testimonial: "Standout silhouette in an oversaturated market. THSIX sets the bar for what modern sneaker design should be.",
    by: "Zoe, Creative Producer",
    imgSrc: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
  }
];

interface TestimonialCardProps {
  position: number;
  testimonial: TestimonialItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  position, 
  testimonial, 
  handleMove, 
  cardSize 
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out select-none",
        isCenter 
          ? "z-10 bg-primary text-primary-foreground border-primary" 
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={`${testimonial.by.split(',')[0]}`}
        className="mb-4 h-14 w-12 bg-muted object-cover object-top"
        style={{
          boxShadow: "3px 3px 0px hsl(var(--background))"
        }}
      />
      <h3 className={cn(
        "text-base sm:text-xl font-medium line-clamp-4",
        isCenter ? "text-primary-foreground" : "text-foreground"
      )}>
        "{testimonial.testimonial}"
      </h3>
      <p className={cn(
        "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
        isCenter ? "text-primary-foreground/80" : "text-muted-foreground"
      )}>
        - {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC<{ items?: TestimonialItem[] }> = ({ items = shoeTestimonials }) => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(items);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-muted/30"
      style={{ height: 600 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-20">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default StaggerTestimonials;
