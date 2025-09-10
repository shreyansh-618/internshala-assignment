"use client";
import { useState } from "react";
import "./ProductFilters.css";

const ProductFilters = ({ filters, setFilters, categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false); // mobile toggle

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleCategoryChange = (e) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const handlePriceChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All",
      minPrice: "",
      maxPrice: "",
      selectedCategories: [],
    });
  };

  return (
    <div className="filters-wrapper">
      {/* Hamburger button only on mobile */}
      <button
        className="hamburger-btn sm:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"} Filters
      </button>

      {/* Filters panel */}
      <div
        className={`filters-container ${isOpen ? "open" : "closed"} sm:block`} // always visible on desktop
      >
        {/* Top row filters */}
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={handleSearchChange}
              className="filter-input search-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              value={filters.category}
              onChange={handleCategoryChange}
              className="filter-select"
            >
              <option value="All">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Min Price</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => handlePriceChange("minPrice", e.target.value)}
              className="filter-input price-input"
              min="0"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Max Price</label>
            <input
              type="number"
              placeholder="1000"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
              className="filter-input price-input"
              min="0"
            />
          </div>
        </div>

        {/* Category buttons */}
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`category-btn ${
                filters.selectedCategories.includes(category) ? "active" : ""
              }`}
            >
              {category}
            </button>
          ))}
          <button onClick={clearFilters} className="clear-btn">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
