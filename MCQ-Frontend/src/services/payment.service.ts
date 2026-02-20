import { axiosInstance } from './http';

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  user: Record<string, unknown>;
}

export async function createOrder(planId: 'PCM' | 'PCB' | 'PCMB'): Promise<CreateOrderResponse> {
  const { data } = await axiosInstance.post<CreateOrderResponse>('/api/payment/create-order', {
    planId,
  });
  if (!data.success || !data.orderId) {
    throw new Error('Failed to create order');
  }
  return data;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  const { data } = await axiosInstance.post<VerifyPaymentResponse>('/api/payment/verify', payload);
  if (!data.success) {
    throw new Error(data.message || 'Verification failed');
  }
  return data;
}

export interface PaymentHistoryItem {
  _id: string;
  event: string;
  source: string;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  planId?: string;
  createdAt: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: {
    history: PaymentHistoryItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export async function getMyPaymentHistory(params?: { page?: number; limit?: number }): Promise<PaymentHistoryResponse['data']> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const { data } = await axiosInstance.get<PaymentHistoryResponse>(
    `/api/payment/me/history${query ? `?${query}` : ''}`
  );
  if (!data.success || !data.data) {
    throw new Error('Failed to load payment history');
  }
  return data.data;
}
