import React, { useState, useEffect, useCallback } from "react";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { getProducts, seedProducts } from "../services/api";
import { PackageSearch, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";

const CATEGORIES = ["Electronics", "Fashion", "Books", "Home"];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const fetchProductList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category && category !== "All") params.category = category;
      if (sort && sort !== "default") params.sort = sort;

      let data = await getProducts(params);

      // If database is empty on first run, auto seed sample products
      if ((!data.products || data.products.length === 0) && !search && category === "All") {
        await seedProducts();
        data = await getProducts(params);
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Something went wrong while loading products. Please check server connection.");
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductList();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProductList]);

  return (
    <div className="products-page-container">
      {/* Header Banner */}
      <div className="products-hero glass-card">
        <div className="hero-content">
          <span className="hero-pill">
            <Sparkles size={14} /> ShopKart Catalogue
          </span>
          <h1>Discover Amazing Products</h1>
          <p>Browse through our collection of premium electronics, fashion, books, and home essentials.</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchBar
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        categories={CATEGORIES}
      />

      {/* Main Content Area */}
      <div className="products-content">
        {/* LOADING STATE */}
        {loading && (
          <div className="loading-state glass-card">
            <div className="spinner-lg"></div>
            <h3>Loading products...</h3>
            <p>Fetching the latest product catalogue from ShopKart backend</p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="error-state glass-card">
            <AlertTriangle size={48} className="error-icon" />
            <h3>Failed to load products</h3>
            <p>{error}</p>
            <button onClick={fetchProductList} className="btn-primary" style={{ marginTop: "1rem" }}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
          <div className="empty-state glass-card">
            <PackageSearch size={54} className="empty-icon" />
            <h3>No products found</h3>
            <p>We couldn't find any products matching your current search or category filter.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setSort("default");
              }}
              className="btn-outline"
              style={{ marginTop: "1.25rem" }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* DYNAMIC PRODUCT GRID */}
        {!loading && !error && products.length > 0 && (
          <>
            <div style={{ marginBottom: "1.25rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Showing <strong>{products.length}</strong> {products.length === 1 ? "product" : "products"}
            </div>

            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
