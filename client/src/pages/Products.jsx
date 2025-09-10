"use client";

import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { apiService } from "../services/api";
import "./Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    minPrice: "",
    maxPrice: "",
    selectedCategories: [],
  });

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getProducts();
        setProducts(response.products || []);
        setFilteredProducts(response.products || []);

        // Get categories
        const categoriesResponse = await apiService.getCategories();
        setCategories(categoriesResponse.categories || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    // Category filter (dropdown)
    if (filters.category && filters.category !== "All") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Selected categories filter (buttons)
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        filters.selectedCategories.includes(product.category)
      );
    }

    // Price range filter
    if (filters.minPrice) {
      filtered = filtered.filter(
        (product) => product.price >= Number.parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (product) => product.price <= Number.parseFloat(filters.maxPrice)
      );
    }

    setFilteredProducts(filtered);
  }, [filters, products]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="products-container">
        <div className="container">
          <div className="loading">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-container">
        <div className="container">
          <div className="error-message">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="container">
        <div className="products-header">
          <h1 className="products-title">
            Products ({filteredProducts.length})
          </h1>
        </div>

        <ProductFilters
          filters={filters}
          setFilters={setFilters}
          categories={categories}
        />

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
