import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../services/productService'; // Assuming productService is set up
import { debounce } from 'lodash'; // yarn add lodash

const OrderModal = ({ isOpen, onClose, onSaveOrder }) => {
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState('');

  // Debounced product search function
  const debouncedSearchProducts = useCallback(
    debounce(async (term) => {
      if (term.length < 2) {
        setSearchedProducts([]);
        return;
      }
      setIsLoadingProducts(true);
      try {
        const response = await getProducts({ search: term, limit: 10 });
        setSearchedProducts(response.data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setSearchedProducts([]);
      }
      setIsLoadingProducts(false);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearchProducts(searchTerm);
  }, [searchTerm, debouncedSearchProducts]);

  const handleAddProductToOrder = (product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      // Optionally, you could increase quantity here or show a message
      alert('Product already added. You can adjust the quantity.');
      return;
    }
    setOrderItems([...orderItems, { 
      product_id: product.id, 
      name: product.name, 
      quantity: 1, 
      price_per_unit: parseFloat(product.price),
      stock: product.stock 
    }]);
    setSearchTerm('');
    setSearchedProducts([]);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    setOrderItems(orderItems.map(item => 
      item.product_id === productId ? { ...item, quantity: quantity > 0 ? quantity : 1 } : item
    ));
  };

  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateSubtotal = (item) => {
    return item.quantity * item.price_per_unit;
  };

  const calculateTotalOrderAmount = () => {
    return orderItems.reduce((total, item) => total + calculateSubtotal(item), 0);
  };

  const resetForm = () => {
    setCustomerName('');
    setSearchTerm('');
    setSearchedProducts([]);
    setOrderItems([]);
    setError('');
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (orderItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    let formValid = true;
    orderItems.forEach(item => {
      if(item.quantity > item.stock) {
        setError(`Not enough stock for ${item.name}. Available: ${item.stock}`);
        formValid = false;
      }
    });

    if (!formValid) return;

    setError('');
    const orderData = {
      customer_name: customerName,
      items: orderItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      // total_amount will be calculated backend side based on current prices, or pass it if required by API
    };
    try {
      await onSaveOrder(orderData);
      resetForm();
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save order.');
    }
  };
  
  // When modal closes, reset its state
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => { resetForm(); onClose(); }}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-poppins font-medium leading-6 text-neutral-text-primary flex justify-between items-center">
                  Create New Order
                  <button onClick={() => { resetForm(); onClose(); }} className="text-neutral-text-secondary hover:text-neutral-text-primary">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </Dialog.Title>
                
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-4 space-y-4">
                  {error && <div className="mb-4 p-3 bg-error/10 text-error text-sm rounded-md">{error}</div>}
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-neutral-text-primary">Customer Name</label>
                    <input 
                      type="text" 
                      id="customerName" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="productSearch" className="block text-sm font-medium text-neutral-text-primary">Search Products</label>
                    <div className="relative mt-1">
                      <input 
                        type="text" 
                        id="productSearch" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full px-3 py-2 pr-10 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Type to search products (min 2 chars)"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-neutral-text-secondary" aria-hidden="true" />
                      </div>
                    </div>
                    {isLoadingProducts && <p className="text-sm text-neutral-text-secondary mt-1">Searching...</p>}
                    {searchedProducts.length > 0 && (
                      <ul className="mt-2 border border-neutral-border rounded-md max-h-40 overflow-y-auto bg-white shadow-lg">
                        {searchedProducts.map(product => (
                          <li 
                            key={product.id}
                            className="px-3 py-2 hover:bg-primary-light hover:text-white cursor-pointer text-sm flex justify-between items-center"
                            onClick={() => handleAddProductToOrder(product)}
                          >
                            <span>{product.name} (SKU: {product.sku}) - Stock: {product.stock}</span>
                            <PlusCircleIcon className="w-5 h-5" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {orderItems.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-neutral-text-primary mb-2">Order Items</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {orderItems.map(item => (
                          <div key={item.product_id} className="p-3 border border-neutral-border rounded-md bg-neutral-bg/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-neutral-text-primary text-sm">{item.name}</p>
                                <p className="text-xs text-neutral-text-secondary">Price: ${parseFloat(item.price_per_unit).toFixed(2)} / unit</p>
                                {item.quantity > item.stock && <p className='text-xs text-error'>Warning: Not enough stock! Available: {item.stock}</p>}
                              </div>
                              <button type="button" onClick={() => handleRemoveItem(item.product_id)} className="text-error hover:text-red-700">
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="mt-2 flex items-center space-x-2">
                              <label htmlFor={`quantity-${item.product_id}`} className="text-sm text-neutral-text-secondary">Quantity:</label>
                              <input 
                                type="number"
                                id={`quantity-${item.product_id}`}
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                                min="1"
                                max={item.stock} // Set max to available stock
                                className="w-20 px-2 py-1 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              />
                              <p className="text-sm font-medium text-neutral-text-primary">Subtotal: ${calculateSubtotal(item).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-border text-right">
                        <p className="text-lg font-semibold text-neutral-text-primary">
                          Total Order Amount: ${calculateTotalOrderAmount().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { resetForm(); onClose(); }}
                      className="px-4 py-2 text-sm font-medium text-neutral-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                      disabled={orderItems.length === 0 || !customerName.trim() || orderItems.some(item => item.quantity > item.stock)}
                    >
                      Create Order
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

export default OrderModal;
