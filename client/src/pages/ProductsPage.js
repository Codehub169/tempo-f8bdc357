import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductModal from '../components/ProductModal';
import productService from '../services/productService';
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOption, setSortOption] = useState('created_at_desc'); // e.g. name_asc, price_desc
  const [isLowStockFilterActive, setIsLowStockFilterActive] = useState(false);

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
        sortBy: sortOption.split('_')[0],
        sortOrder: sortOption.split('_')[1]?.toUpperCase() || 'ASC',
        lowStock: isLowStockFilterActive ? 'true' : undefined,
      };
      const data = await productService.getProducts(params);
      setProducts(data.products || []);
      setTotalPages(Math.ceil(data.total / limit) || 1);
      setTotalProducts(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, sortOption, isLowStockFilterActive, limit]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const lowStockQuery = queryParams.get('filter') === 'low_stock';

    if (location.hash === '#add-new') {
      setEditingProduct(null);
      setIsModalOpen(true);
      navigate(location.pathname + location.search, { replace: true }); // Clear hash
    }
    
    if (lowStockQuery) {
      setIsLowStockFilterActive(true);
      // Reset to first page if filter applied via URL and not already on first page
      if (currentPage !== 1) setCurrentPage(1); 
    } else {
      // If the query param is removed, turn off the filter
      // Check if it was active to avoid unnecessary state updates
      if (isLowStockFilterActive && !lowStockQuery) {
          setIsLowStockFilterActive(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]); // Dependencies are location and navigate. State setters inside will trigger fetchProductsData if their states are dependencies of it.

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct && editingProduct.id) {
        await productService.updateProduct(editingProduct.id, productData);
      } else {
        await productService.addProduct(productData);
      }
      fetchProductsData();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save product.';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productService.deleteProduct(productId);
        // If on last page and it becomes empty after deletion, go to previous page
        if (products.length === 1 && currentPage > 1 && (totalProducts - 1) <= (currentPage - 1) * limit ) {
            // Fetch data for the new current page *after* state update
            setCurrentPage(prevCurrentPage => prevCurrentPage - 1);
        } else {
            fetchProductsData(); // Refresh list for the current page
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete product. It might be part of an existing order.';
        setError(errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const productCategories = ['Electronics', 'Groceries', 'Apparel', 'Hardware', 'Other'];
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5; 
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    pageNumbers.push(1);

    if (currentPage > halfMaxPages + 2 && totalPages > maxPagesToShow + 1 ) {
        pageNumbers.push('...');
    }

    let startPage = Math.max(2, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

    if (currentPage <= halfMaxPages + 1 ) {
        endPage = Math.min(totalPages -1, maxPagesToShow);
    }
    if (currentPage >= totalPages - halfMaxPages) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    if (currentPage < totalPages - halfMaxPages - 1 && totalPages > maxPagesToShow + 1) {
        pageNumbers.push('...');
    }
    
    if (totalPages > 1) {
        pageNumbers.push(totalPages);
    }

    // Filter out consecutive '...' or '...' next to 1 or totalPages if logic results in it (edge cases)
    const filteredPageNumbers = pageNumbers.filter((num, index, arr) => {
        if (num === '...') {
            // Avoid consecutive '...' or '...' next to actual page numbers if they are adjacent
            if (index > 0 && arr[index-1] === '...') return false;
            if (index > 0 && typeof arr[index-1] === 'number' && typeof arr[index+1] === 'number' && arr[index+1] - arr[index-1] <=2 ) return false;
        }
        return true;
    });

    return filteredPageNumbers.map((num, index) => (
        <button
            key={typeof num === 'number' ? `page-${num}` : `ellipsis-${index}`}
            onClick={() => typeof num === 'number' && handlePageChange(num)}
            disabled={typeof num !== 'number' || currentPage === num}
            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                ${currentPage === num ? 'z-10 bg-primary-light border-primary text-neutral-text-primary' : 'bg-white border-neutral-border text-neutral-text-secondary hover:bg-gray-50'}
                ${typeof num !== 'number' ? 'cursor-default' : ''}`}
            aria-current={currentPage === num ? 'page' : undefined}
            aria-label={typeof num === 'number' ? `Go to page ${num}` : 'Page range separator'}
        >
            {num}
        </button>
    ));
  };

  return (
    <Layout pageTitle="Product Management">
      <div className="p-6 space-y-6">
        {/* Filters and Search */} 
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="relative lg:col-span-1">
                <label htmlFor="search-products" className="sr-only">Search products</label>
                <input
                    type="text"
                    id="search-products"
                    name="search"
                    placeholder="Search by Name, SKU..."
                    className="w-full px-4 py-2.5 pr-10 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-neutral-text-secondary" />
                </span>
            </div>
            <div>
                <label htmlFor="filterCategory" className="block text-sm font-medium text-neutral-text-primary mb-1">Category</label>
                <select 
                    id="filterCategory" 
                    name="category"
                    className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">All Categories</option>
                    {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="sortProducts" className="block text-sm font-medium text-neutral-text-primary mb-1">Sort By</label>
                <select 
                    id="sortProducts" 
                    name="sort"
                    className="w-full px-4 py-2.5 border rounded-lg shadow-sm border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                >
                    <option value="created_at_desc">Date Added (Newest)</option>
                    <option value="created_at_asc">Date Added (Oldest)</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                    <option value="stock_asc">Stock (Low to High)</option>
                    <option value="stock_desc">Stock (High to Low)</option>
                </select>
            </div>
            <div className="flex items-center justify-start lg:justify-self-end h-full pb-1">
                <label htmlFor="lowStockFilter" className="flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="lowStockFilter" 
                        name="lowStock"
                        className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary-light border-neutral-border shadow-sm"
                        checked={isLowStockFilterActive}
                        onChange={(e) => { 
                            setIsLowStockFilterActive(e.target.checked); 
                            setCurrentPage(1);
                            navigate(e.target.checked ? `${location.pathname}?filter=low_stock${location.hash}` : `${location.pathname}${location.hash}`, {replace: true});
                        }}
                    />
                    <span className="ml-2 text-sm text-neutral-text-primary">Low Stock (&lt;10)</span>
                </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-text-primary">Product List ({totalProducts})</h2>
            <button 
                onClick={handleAddNewProduct} 
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                Add New Product
            </button>
        </div>

        {error && <div className="p-4 text-sm text-error bg-red-100 rounded-lg" role="alert">{error}</div>}

        {/* Products Table */} 
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <p className="p-4 text-center text-neutral-text-secondary">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="p-4 text-center text-neutral-text-secondary">No products found. Try adjusting your search or filters, or add a new product.</p>
          ) : (
            <table className="min-w-full divide-y divide-neutral-border">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Image</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-border">
                {products.map((product) => (
                  <tr key={product.id} className={`${product.stock < 10 ? 'bg-warning/10' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <img src={product.image_url || 'https://via.placeholder.com/60x60.png?text=No+Image'} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-text-primary">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-secondary">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-text-primary">${parseFloat(product.price).toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${product.stock < 10 ? 'text-warning' : 'text-neutral-text-primary'}`}>
                        {product.stock}
                        {product.stock < 10 && <ExclamationTriangleIcon className="w-4 h-4 inline ml-1 text-warning" title="Low Stock"/>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleEditProduct(product)} className="text-primary hover:text-primary-light p-1" title="Edit Product">
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-error hover:text-red-700 p-1" title="Delete Product">
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
                  Showing <span className="font-medium">{totalProducts === 0 ? 0 : (currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalProducts)}</span> of <span className="font-medium">{totalProducts}</span> results
                </p>
              </div>
              <div className="flex items-center">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50" aria-label="Previous page">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                </button>
                {renderPagination()}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-border bg-white text-sm font-medium text-neutral-text-secondary hover:bg-gray-50 disabled:opacity-50" aria-label="Next page">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010-1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                </button>
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
            // Clear #add-new from URL if present
            if (location.hash === '#add-new') {
                navigate(location.pathname + location.search, { replace: true });
            }
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </Layout>
  );
};

export default ProductsPage;
