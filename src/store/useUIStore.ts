import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UIState {
  toasts: Toast[];
  confirmState: ConfirmState;
  
  // Actions
  showAlert: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  confirmState: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },

  showAlert: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    // Auto remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  showConfirm: (title, message, onConfirm, onCancel) => {
    set({
      confirmState: {
        isOpen: true,
        title,
        message,
        onConfirm,
        onCancel
      }
    });
  },

  closeConfirm: () => {
    set((state) => ({
      confirmState: {
        ...state.confirmState,
        isOpen: false
      }
    }));
  }
}));
