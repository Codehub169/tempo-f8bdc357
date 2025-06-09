import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

/**
 * ProductModal component
 * A modal dialog for adding or editing product information.
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {Function} props.onClose - Function to call when the modal should be closed.
 * @param {Function} props.onSave - Function to call when saving product data. Receives product data object.
 * @param {object|null} props.product - The product object to edit. If null, assumes adding a new product.
 */
const ProductModal = ({ isOpen, onClose, onSave, product }) => {
  // State for form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics'); // Default category
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Effect to populate form when a product is passed for editing
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setCategory(product.category || 'Electronics');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setStock(product.stock?.toString() || '');
      setImageUrl(product.image_url || '');
      setFormErrors({}); // Clear errors when product changes
    } else {
      // Reset form for new product
      setName('');
      setSku('');
      setCategory('Electronics');
      setDescription('');
      setPrice('');
      setStock('');
      setImageUrl('');
      setFormErrors({});
    }
  }, [product, isOpen]); // Rerun if product changes or modal opens

  // Form validation logic
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Product name is required.';
    if (!sku.trim()) errors.sku = 'SKU is required.';
    if (!category) errors.category = 'Category is required.';
    if (price === '' || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      errors.price = 'Valid price is required.';
    }
    if (stock === '' || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      errors.stock = 'Valid stock quantity is required.';
    }
    if (imageUrl && !imageUrl.startsWith('http')) {
        errors.imageUrl = 'Please enter a valid URL.'
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const productData = {
        name,
        sku,
        category,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        image_url: imageUrl || null, // Send null if empty
      };
      // If editing, include product ID
      if (product && product.id) {
        productData.id = product.id;
      }
      onSave(productData);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Modal backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-border">
                  <Dialog.Title as="h3" className="text-xl font-semibold font-poppins text-neutral-text-primary">
                    {product ? 'Edit Product' : 'Add New Product'}
                  </Dialog.Title>
                  <button 
                    onClick={onClose} 
                    className="text-neutral-text-secondary hover:text-neutral-text-primary"
                    aria-label="Close product modal"
                  >
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                {/* Product form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-neutral-text-primary">Product Name</label>
                    <input type="text" name="productName" id="productName" value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.name ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`} placeholder="e.g., Wireless Headphones" />
                    {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="productSKU" className="block text-sm font-medium text-neutral-text-primary">SKU</label>
                    <input type="text" name="productSKU" id="productSKU" value={sku} onChange={(e) => setSku(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.sku ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`} placeholder="e.g., WH-1000XM4" />
                    {formErrors.sku && <p className="text-xs text-error mt-1">{formErrors.sku}</p>}
                  </div>
                  <div>
                    <label htmlFor="productCategory" className="block text-sm font-medium text-neutral-text-primary">Category</label>
                    <select id="productCategory" name="productCategory" value={category} onChange={(e) => setCategory(e.target.value)} className={`mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.category ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`}>
                      <option>Electronics</option>
                      <option>Groceries</option>
                      <option>Apparel</option>
                      <option>Hardware</option>
                      <option>Other</option>
                    </select>
                    {formErrors.category && <p className="text-xs text-error mt-1">{formErrors.category}</p>}
                  </div>
                  <div>
                    <label htmlFor="productDescription" className="block text-sm font-medium text-neutral-text-primary">Description</label>
                    <textarea id="productDescription" name="productDescription" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Brief description of the product"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="productPrice" className="block text-sm font-medium text-neutral-text-primary">Price ($)</label>
                      <input type="number" name="productPrice" id="productPrice" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.price ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`} placeholder="e.g., 299.99" />
                      {formErrors.price && <p className="text-xs text-error mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                      <label htmlFor="productStock" className="block text-sm font-medium text-neutral-text-primary">Stock Quantity</label>
                      <input type="number" name="productStock" id="productStock" value={stock} onChange={(e) => setStock(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.stock ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`} placeholder="e.g., 150" />
                      {formErrors.stock && <p className="text-xs text-error mt-1">{formErrors.stock}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="productImage" className="block text-sm font-medium text-neutral-text-primary">Product Image URL (Optional)</label>
                    <input type="url" name="productImage" id="productImage" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm ${formErrors.imageUrl ? 'border-error focus:border-error' : 'border-neutral-border focus:border-primary'}`} placeholder="https://example.com/image.jpg" />
                     {formErrors.imageUrl && <p className="text-xs text-error mt-1">{formErrors.imageUrl}</p>}
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-border">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      {product ? 'Save Changes' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProductModal;
