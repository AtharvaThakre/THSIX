import React from 'react';
import './ProductDescription.css';

interface ProductDescriptionProps {
  html: string;
}

export const ProductDescription: React.FC<ProductDescriptionProps> = ({ html }) => {
  if (!html || html.trim() === '') {
    return null;
  }

  return (
    <div 
      className="product-description"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
