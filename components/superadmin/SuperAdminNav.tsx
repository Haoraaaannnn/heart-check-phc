'use client';

import { useState } from 'react';

export default function SuperAdminNav() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <header className="flex items-center justify-between px-8 py-4 bg-red-500 border-b">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <span className="font-black text-2xl text-white">
                        Super Admin
                    </span>
                </div>

                {/* Navigation Section */}
                <nav className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-gray-400 transition-colors rounded"
                    >
                        Add user
                    </button>
                </nav>
            </header>

            {/* Modal Overlay & Content */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Modal Box */}
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl border border-black ">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Add New User</h2>
                        
                        {/* Input Form */}
                        <form className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter full name" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input 
                                    type="email" 
                                    placeholder="Enter email address" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Add your submit logic here
                                        setIsModalOpen(false);
                                    }}
                                >
                                    Save User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}