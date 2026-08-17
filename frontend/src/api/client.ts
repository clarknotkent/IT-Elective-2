import type {
  ApiResponse,
  DashboardStats,
  Ingredient,
  InventoryItem,
  StockResponse,
  PreparationTransfer,
} from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.error || data.message || `Request failed (${response.status})` };
      }
      return { data, error: null };
    }

    if (!response.ok) {
      return { data: null, error: `Request failed (${response.status})` };
    }

    return { data: (await response.text()) as unknown as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// Dashboard
export async function getDashboard(): Promise<ApiResponse<DashboardStats>> {
  return request<DashboardStats>('/dashboard');
}

// Ingredients (backend returns flat array)
export async function getIngredients(search = ''): Promise<ApiResponse<Ingredient[]>> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<Ingredient[]>(`/ingredients/${params}`);
}

export async function createIngredient(data: { name: string; ingredient_type: string }): Promise<ApiResponse<unknown>> {
  return request('/ingredients/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIngredient(id: number | string, data: { name: string; ingredient_type: string }): Promise<ApiResponse<unknown>> {
  return request(`/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteIngredient(id: number): Promise<ApiResponse<unknown>> {
  return request(`/ingredients/${id}`, { method: 'DELETE' });
}

// Inventory (backend returns flat array)
export async function getInventory(search = ''): Promise<ApiResponse<InventoryItem[]>> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<InventoryItem[]>(`/inventory/${params}`);
}

export async function createItem(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  return request('/inventory/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateItem(id: number | string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  return request(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteItem(id: number): Promise<ApiResponse<unknown>> {
  return request(`/inventory/${id}`, { method: 'DELETE' });
}

export async function transferItem(id: number, data: { quantity: number; booking_date: string }): Promise<ApiResponse<unknown>> {
  return request(`/inventory/${id}/transfer`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Stock
export async function getStock(): Promise<ApiResponse<StockResponse>> {
  return request<StockResponse>('/stock/');
}

export async function stockIn(id: number, data: { quantity: number; note: string }): Promise<ApiResponse<unknown>> {
  return request(`/stock/${id}/in`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function stockOut(id: number, data: { quantity: number; note: string }): Promise<ApiResponse<unknown>> {
  return request(`/stock/${id}/out`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Preparation (backend returns flat array)
export async function getPreparation(search = ''): Promise<ApiResponse<PreparationTransfer[]>> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<PreparationTransfer[]>(`/preparation/${params}`);
}

export async function updateTransfer(id: number, data: { quantity: number }): Promise<ApiResponse<unknown>> {
  return request(`/preparation/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTransfer(id: number): Promise<ApiResponse<unknown>> {
  return request(`/preparation/${id}`, { method: 'DELETE' });
}

export async function returnTransfer(id: number): Promise<ApiResponse<unknown>> {
  return request(`/preparation/${id}/return`, { method: 'POST' });
}

// Reports
export function getReportUrl(): string {
  return '/api/reports/inventory.pdf';
}
