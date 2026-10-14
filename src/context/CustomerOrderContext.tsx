'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, MenuItem, MeatType, OrderType, PaymentMethod } from '@/lib/supabase/types';

export interface SelectedOrderItem {
  menuId: string;
  name: string;
  unitPrice: number;
  meatType: MeatType;
  gramPerPortion: number;
  qty: number;
  totalGram: number;
  subtotal: number;
  isFixedGram: boolean;
  imageUrl?: string | null;
}

export interface LodgingSelection {
  roomId: string | null;
  roomName: string | null;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adultCount: number;
  teenCount: number;
  childCount: number;
  pricePerPerson: number; // default Rp 200.000
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface CustomerOrderContextType {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  lodging: LodgingSelection;
  setLodging: React.Dispatch<React.SetStateAction<LodgingSelection>>;
  updateLodgingRoom: (room: Room | null) => void;
  updateLodgingDates: (checkIn: string, checkOut: string) => void;
  updateGuestsCount: (adults: number, teens: number, children: number) => void;
  cartItems: SelectedOrderItem[];
  addMenuItem: (item: MenuItem, gram: number, qty: number) => void;
  updateCartItemQty: (menuId: string, qty: number) => void;
  removeCartItem: (menuId: string) => void;
  clearCart: () => void;
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  downPayment: number;
  setDownPayment: (dp: number) => void;
  lodgingNights: number;
  lodgingSubtotal: number;
  restaurantSubtotal: number;
  grandTotal: number;
  resetAll: () => void;
}

const DEFAULT_LODGING_PRICE_PER_PERSON = 200000;

const CustomerOrderContext = createContext<CustomerOrderContextType | undefined>(undefined);

export function CustomerOrderProvider({ children }: { children: React.ReactNode }) {
  const [orderType, setOrderType] = useState<OrderType>('restaurant');
  const [lodging, setLodging] = useState<LodgingSelection>({
    roomId: null,
    roomName: null,
    checkInDate: '',
    checkOutDate: '',
    adultCount: 1,
    teenCount: 0,
    childCount: 0,
    pricePerPerson: DEFAULT_LODGING_PRICE_PER_PERSON,
  });

  const [cartItems, setCartItems] = useState<SelectedOrderItem[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [downPayment, setDownPayment] = useState<number>(0);

  // Load draft from localStorage on mount (USER CHOOSES ONCE)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('asap_order_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderType) setOrderType(parsed.orderType);
        if (parsed.lodging) setLodging(parsed.lodging);
        if (parsed.cartItems) setCartItems(parsed.cartItems);
        if (parsed.customer) setCustomer(parsed.customer);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.downPayment) setDownPayment(parsed.downPayment);
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    try {
      const draft = {
        orderType,
        lodging,
        cartItems,
        customer,
        paymentMethod,
        downPayment,
      };
      localStorage.setItem('asap_order_draft', JSON.stringify(draft));
    } catch {
      // Ignore storage write errors
    }
  }, [orderType, lodging, cartItems, customer, paymentMethod, downPayment]);

  const updateLodgingRoom = (room: Room | null) => {
    setLodging((prev) => ({
      ...prev,
      roomId: room ? room.id : null,
      roomName: room ? `${room.room_number} - ${room.room_name}` : null,
    }));
    if (room && orderType === 'restaurant') {
      setOrderType('lodging');
    }
  };

  const updateLodgingDates = (checkIn: string, checkOut: string) => {
    setLodging((prev) => ({
      ...prev,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    }));
  };

  const updateGuestsCount = (adults: number, teens: number, children: number) => {
    setLodging((prev) => ({
      ...prev,
      adultCount: Math.max(1, adults),
      teenCount: Math.max(0, teens),
      childCount: Math.max(0, children),
    }));
  };

  const addMenuItem = (item: MenuItem, gram: number, qty: number) => {
    const isPer100g = item.price_basis === 'per_100g' || item.price_basis === 'per_gram' || (item.meat_type !== 'none' && !item.is_fixed_gram && item.price_basis !== 'per_ekor');
    const isPerEkor = item.price_basis === 'per_ekor';

    const chosenGram = item.is_fixed_gram
      ? item.standard_meat_gram
      : isPer100g
      ? Math.max(100, gram || item.standard_meat_gram || 100)
      : 0;

    // Price calculation: per 100gr, per ekor, per porsi
    let unitPrice = item.price;
    if (isPer100g) {
      unitPrice = Math.round((item.price * chosenGram) / 100);
    } else {
      unitPrice = item.price;
    }

    const subtotal = unitPrice * qty;
    const totalGram = isPer100g || item.is_fixed_gram ? chosenGram * qty : 0;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) => ci.menuId === item.id && ci.gramPerPortion === chosenGram
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].qty + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          totalGram: chosenGram * newQty,
          subtotal: unitPrice * newQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          menuId: item.id,
          name: item.name,
          unitPrice,
          meatType: item.meat_type,
          gramPerPortion: chosenGram,
          qty,
          totalGram,
          subtotal,
          isFixedGram: item.is_fixed_gram,
          imageUrl: item.image_url,
        },
      ];
    });

    if (orderType === 'lodging') {
      setOrderType('combined');
    }
  };

  const updateCartItemQty = (menuId: string, qty: number) => {
    if (qty <= 0) {
      removeCartItem(menuId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.menuId === menuId) {
          return {
            ...item,
            qty,
            totalGram: item.gramPerPortion * qty,
            subtotal: item.unitPrice * qty,
          };
        }
        return item;
      })
    );
  };

  const removeCartItem = (menuId: string) => {
    setCartItems((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const resetAll = () => {
    setCartItems([]);
    setLodging({
      roomId: null,
      roomName: null,
      checkInDate: '',
      checkOutDate: '',
      adultCount: 1,
      teenCount: 0,
      childCount: 0,
      pricePerPerson: DEFAULT_LODGING_PRICE_PER_PERSON,
    });
    setCustomer({ name: '', phone: '', email: '', notes: '' });
    setOrderType('restaurant');
    setDownPayment(0);
    try {
      localStorage.removeItem('asap_order_draft');
    } catch {
      // Ignore
    }
  };

  // Calculations
  const calculateNights = () => {
    if (!lodging.checkInDate || !lodging.checkOutDate) return 1;
    const start = new Date(lodging.checkInDate);
    const end = new Date(lodging.checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const lodgingNights = calculateNights();
  const totalGuests = lodging.adultCount + lodging.teenCount + lodging.childCount;
  const lodgingSubtotal =
    orderType === 'lodging' || orderType === 'combined'
      ? totalGuests * lodging.pricePerPerson * lodgingNights
      : 0;

  const restaurantSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const grandTotal = lodgingSubtotal + restaurantSubtotal;

  return (
    <CustomerOrderContext.Provider
      value={{
        orderType,
        setOrderType,
        lodging,
        setLodging,
        updateLodgingRoom,
        updateLodgingDates,
        updateGuestsCount,
        cartItems,
        addMenuItem,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        customer,
        setCustomer,
        paymentMethod,
        setPaymentMethod,
        downPayment,
        setDownPayment,
        lodgingNights,
        lodgingSubtotal,
        restaurantSubtotal,
        grandTotal,
        resetAll,
      }}
    >
      {children}
    </CustomerOrderContext.Provider>
  );
}

export function useCustomerOrder() {
  const context = useContext(CustomerOrderContext);
  if (!context) {
    throw new Error('useCustomerOrder must be used within a CustomerOrderProvider');
  }
  return context;
}
