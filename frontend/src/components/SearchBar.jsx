import React from "react";
import { Search, Filter, ArrowUpDown, X, ChevronDown, Sparkles } from "lucide-react";

const SearchBar = ({ search, setSearch, category, setCategory, sort, setSort, categories }) => {
  const handleClear = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
  };

  const isFiltered = search !== "" || category !== "All" || sort !== "default";
  const allCategories = ["All", ...categories];

  return (
    <div className="search-filter-section">
      <div className="search-filter-container glass-card">
        {/* Search Input Row */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Search products"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="clear-search-btn"
              title="Clear search"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Controls (Category & Sort) */}
        <div className="filter-controls">
          {/* Category Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={15} className="select-icon" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="filter-select"
              aria-label="Filter by Category"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* Sort Dropdown */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={15} className="select-icon" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
              aria-label="Sort products"
            >
              <option value="default">Default Sort</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* Reset Filters Desktop Button */}
          {isFiltered && (
            <button
              onClick={handleClear}
              className="btn-outline reset-filters-desktop-btn"
              title="Reset all filters"
              type="button"
            >
              <X size={14} /> <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Category Chips / Pills (Smooth horizontal scroll on mobile) */}
      <div className="category-chips-wrapper">
        <div className="category-chips-container">
          {allCategories.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`category-chip ${isActive ? "active" : ""}`}
              >
                {cat === "All" && <Sparkles size={12} style={{ marginRight: 4 }} />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Chips & Feedback Bar */}
      {isFiltered && (
        <div className="active-filters-bar">
          <span className="active-filters-label">Active:</span>
          {search && (
            <span className="active-filter-tag">
              "{search}"
              <button
                onClick={() => setSearch("")}
                type="button"
                aria-label="Remove search filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {category !== "All" && (
            <span className="active-filter-tag">
              {category}
              <button
                onClick={() => setCategory("All")}
                type="button"
                aria-label="Remove category filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sort !== "default" && (
            <span className="active-filter-tag">
              {sort === "price_asc" ? "Price: Low to High" : "Price: High to Low"}
              <button
                onClick={() => setSort("default")}
                type="button"
                aria-label="Remove sort filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button onClick={handleClear} type="button" className="clear-all-link">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
