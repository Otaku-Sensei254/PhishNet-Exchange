// src/components/ProductList.js
import React from 'react';
import ProductItem from './ProductItem';
import Logo from '../src/logo192.png'
const products = [
  { id: 1, name: 'iPhone 12', price: 799 , image:Logo},
  { id: 2, name: 'iPhone 13', price: 899 },
  { id: 3, name: 'Samsung Galaxy S21', price: 799 },
  { id: 4, name: 'Google Pixel 6', price: 699 },
];

const ProductList = ({ addToCart }) => {
  return (
    <div>
      <h2>Products</h2>
      {products.map(product => (
        <ProductItem key={product.id} product={product} image={product.image}addToCart={addToCart} />
      ))}
    </div>
  );
};

export default ProductList;
