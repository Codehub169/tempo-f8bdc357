import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

const BillModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const handlePrint = () => {
    // Temporarily hide non-bill elements for printing
    const elementsToHide = document.querySelectorAll('body > *:not(.bill-modal-print-area)');
    elementsToHide.forEach(el => el.classList.add('print:hidden'));
    
    // Ensure the bill modal itself is marked for printing if it's not already the root
    // This logic might need adjustment based on how it's rendered in the DOM
    const billPrintArea = document.querySelector('.bill-modal-print-area');
    if (billPrintArea && !billPrintArea.classList.contains('print:block')) {
        billPrintArea.classList.add('print:block'); // Ensure it's visible for printing
    }

    window.print();

    // Restore visibility after printing
    elementsToHide.forEach(el => el.classList.remove('print:hidden'));
     if (billPrintArea) {
        billPrintArea.classList.remove('print:block');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20 bill-modal-print-area" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
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
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all bill-modal-content">
                <Dialog.Title as="h3" className="text-xl font-poppins font-semibold leading-6 text-neutral-text-primary flex justify-between items-center print:text-2xl print:mb-6">
                  Invoice / Bill
                  <button onClick={onClose} className="text-neutral-text-secondary hover:text-neutral-text-primary print:hidden">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </Dialog.Title>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4 border-neutral-border print:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-neutral-text-primary">WholesaleApp Inc.</h4>
                      <p className="text-sm text-neutral-text-secondary">123 Business Rd, Suite 456</p>
                      <p className="text-sm text-neutral-text-secondary">Businesstown, BS 7890</p>
                      <p className="text-sm text-neutral-text-secondary">Phone: (123) 456-7890</p>
                    </div>
                    <div className="text-right print:text-left">
                      <h4 className="text-lg font-semibold text-neutral-text-primary">Order #{order.id}</h4>
                      <p className="text-sm text-neutral-text-secondary">Date: {formatDate(order.order_date || order.created_at)}</p>
                      <p className="text-sm text-neutral-text-secondary">Status: <span className={`font-medium ${order.status === 'Completed' ? 'text-success' : 'text-warning'}`}>{order.status}</span></p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-neutral-text-primary mb-1">Bill To:</h5>
                    <p className="text-sm text-neutral-text-primary font-semibold">{order.customer_name}</p>
                    {/* Add more customer details if available/needed */}
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium text-neutral-text-primary mb-2">Order Items:</h5>
                    <table className="min-w-full divide-y divide-neutral-border">
                      <thead className="bg-gray-50 print:bg-gray-100">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Product</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Quantity</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Unit Price</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-border">
                        {order.items && order.items.map((item, index) => (
                          <tr key={item.product_id || index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-text-primary">{item.product_name || 'N/A'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-text-secondary">{item.quantity}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-text-secondary">${parseFloat(item.price_per_unit).toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-text-primary text-right font-medium">${parseFloat(item.total_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-border text-right space-y-1 print:mt-8">
                     {/* Optional: Add subtotal, tax, discount if applicable */}
                    <p className="text-sm text-neutral-text-secondary">Subtotal: <span className="font-medium text-neutral-text-primary">${parseFloat(order.total_amount).toFixed(2)}</span></p>
                    <p className="text-sm text-neutral-text-secondary">Tax (0%): <span className="font-medium text-neutral-text-primary">$0.00</span></p>
                    <p className="text-lg font-bold text-neutral-text-primary">Total Amount Due: ${parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>

                  <div className="mt-8 text-center text-xs text-neutral-text-secondary print:mt-12">
                    <p>Thank you for your business!</p>
                    <p>Payments due within 30 days.</p>
                  </div>

                </div>

                <div className="mt-8 flex justify-end space-x-3 print:hidden">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-neutral-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-border"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                  >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print Bill
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BillModal;
