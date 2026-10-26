import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Delete", 
    cancelText = "Cancel" 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-oled-card rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-oled-border overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full flex-shrink-0 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-oled-popover border-t border-gray-200 dark:border-oled-border flex justify-end gap-3 transition-colors">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-oled-popover"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;