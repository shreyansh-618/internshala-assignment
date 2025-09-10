// API service for backend communication
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://internshala-assignment-fuea.onrender.com";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem("shopeasy-token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      // If your backend expects "x-auth-token", replace line above with:
      // ...(token && { "x-auth-token": token }),
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Auto-logout on unauthorized
        if (response.status === 401) {
          localStorage.removeItem("shopeasy-token");
        }
        throw new Error(data.message || data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // ---------------- AUTH METHODS ----------------
  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // ✅ Safely handle different token key names
    const token = response.token || response.accessToken || response.jwt;

    if (token) {
      localStorage.setItem("shopeasy-token", token);
    } else {
      console.error("⚠️ No token found in login response:", response);
    }

    return response;
  }

  async logout() {
    localStorage.removeItem("shopeasy-token");
    return Promise.resolve();
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  async verifyToken() {
    return this.request("/auth/verify");
  }

  // ---------------- PRODUCT METHODS ----------------
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getCategories() {
    return this.request("/products/categories/list");
  }

  // ---------------- CART METHODS ----------------
  async getCart() {
    return this.request("/cart");
  }

  async addToCart(productId, quantity = 1) {
    return this.request("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(cartItemId, quantity) {
    return this.request(`/cart/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(cartItemId) {
    return this.request(`/cart/${cartItemId}`, {
      method: "DELETE",
    });
  }

  async clearCart() {
    return this.request("/cart", {
      method: "DELETE",
    });
  }
}

export const apiService = new ApiService();
