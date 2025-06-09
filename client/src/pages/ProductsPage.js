import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductModal from '../components/ProductModal';
import productService from '../services/productService'; // Updated import
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(''); // Example filter
  const [sortOption, setSortOption] = useState('name_asc'); // Example: name_asc, price_desc

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10; // Products per page

  const location = useLocation();
  const navigate = useNavigate();

  const fetchProductsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        category: filterCategory,
        // Correctly parse sortOption for API: sort by 'name', 'price' etc. and order 'ASC'/'DESC'
        sortBy: sortOption.split('_')[0], // API uses 'sortBy'
        sortOrder: sortOption.split('_')[1]?.toUpperCase() || 'ASC',
      };
      const data = await productService.getProducts(params); // Updated usage
      setProducts(data.products || []);
      setTotalPages(Math.ceil(data.total / limit) || 1); // API returns 'total' for total products
      setTotalProducts(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch products. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, sortOption, limit]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  useEffect(() => {
    if (location.hash === '#add-new') {
      setEditingProduct(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true }); // Clear hash
    }
    // Check for low_stock filter from query params (e.g. from Dashboard)
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('filter') === 'low_stock') {
        // This would require the backend to support a 'lowStock' boolean filter or similar
        // For now, this is a placeholder. If backend supports `lowStock=true`:
        // fetchProductsData({ lowStock: 'true' }); 
        // Or adjust filtering logic if it's purely client-side (not ideal for pagination)
        console.log('Low stock filter detected, implement accordingly if backend supports.');
    }

  }, [location, navigate]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId); // Updated usage
        fetchProductsData(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to delete product.');
        alert(err.response?.data?.message || err.message || 'Failed to delete product. It might be associated with existing orders.');
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData); // Updated usage
      } else {
        await productService.addProduct(productData); // Updated usage
      }
      fetchProductsData(); // Refresh list
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setError(err.message || 'Failed to save product.');
      // The modal should display its own errors for specific fields
      // This error is for general save failures (e.g. network)
      alert(err.response?.data?.message || err.message || 'Failed to save product.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const categoryOptions = ['Electronics', 'Groceries', 'Apparel', 'Hardware', 'Other']; // Example categories

  return (
    <Layout pageTitle="Product Management">
      <div className="p-6 space-y-6">
        {/* Search and Filters */} 
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="relative flex-grow md:col-span-1">
              <label htmlFor="search-products" className="sr-only">Search products</label>
              <input
                type="text"
                id="search-products"
                placeholder="Search products by name, SKU..."
                className="w-full px-4 py-2.5 pr-10 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-neutral-text-secondary" />
              </span>
            </div>
            <div>
              <label htmlFor="filterCategory" className="block text-sm font-medium text-neutral-text-primary mb-1">Category</label>
              <select 
                id="filterCategory" 
                className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sortOption" className="block text-sm font-medium text-neutral-text-primary mb-1">Sort By</label>
              <select 
                id="sortOption"
                className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="stock_asc">Stock (Low to High)</option>
                <option value="stock_desc">Stock (High to Low)</option>
                <option value="created_at_desc">Date Added (Newest)</option>
                <option value="created_at_asc">Date Added (Oldest)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-text-primary">Product List ({totalProducts})</h2>
            <button 
                onClick={handleAddProduct} 
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                Add New Product
            </button>
        </div>

        {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}

        {/* Products Table */} 
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <p className="p-4 text-center text-neutral-text-secondary">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="p-4 text-center text-neutral-text-secondary">No products found. Try adjusting your search or filters.</p>
          ) : (
            <table className="min-w-full divide-y divide-neutral-border">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <img className="w-10 h-10 rounded-md object-cover" src={product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=E5E7EB&color=1F2937&font-size=0.4`} alt={product.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-text-primary">{product.name}</div>
                          <div className="text-xs text-neutral-text-secondary truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">${parseFloat(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">{product.stock} units</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 10 ? 'bg-success text-white' : product.stock > 0 ? 'bg-warning text-white' : 'bg-error text-white'}`}>
                        {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditProduct(product)} className="text-primary hover:text-primary-light mr-2" title="Edit">
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-error hover:text-red-700" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */} 
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-border sm:px-6 rounded-b-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-neutral-border text-sm font-medium rounded-md text-neutral-text-secondary bg-white hover:bg-gray-50 disabled:opacity-50"> Previous </button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-border text-sm font-medium rounded-md text-neutral-text-secondary bg-white hover:bg-gray-50 disabled:opacity-50"> Next </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-neutral-text-secondary">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalProducts)}</span> of <span className="font-medium">{totalProducts}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                  </button>
                  {/* Page numbers could be dynamically generated here for larger sets */} 
                  {[...Array(totalPages).keys()].map(num => (
                     <button 
                        key={num+1} 
                        onClick={() => handlePageChange(num+1)} 
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === num+1 ? 'z-10 bg-primary-light border-primary text-neutral-text-primary' : 'bg-white border-neutral-border text-neutral-text-secondary hover:bg-gray-50'}`}
                      >
                        {num+1}
                      </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010-1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </Layout>
  );
};

export default ProductsPage;
