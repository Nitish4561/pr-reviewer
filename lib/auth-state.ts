/**
 * Client-side auth state management
 * This helps ensure consistent state across components
 */

// Simple event emitter for auth state changes
class AuthStateManager {
  private listeners: Array<() => void> = [];

  // Notify all listeners that auth state has changed
  notifyAuthChange() {
    console.log("🔄 Auth state change notified to", this.listeners.length, "listeners");
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error("Error in auth state listener:", error);
      }
    });
  }

  // Subscribe to auth state changes
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Force logout state
  forceLogout() {
    console.log("🚪 Forcing logout state...");
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastCheckedEmail');
    }
    
    // Notify all components
    this.notifyAuthChange();
  }
}

export const authStateManager = new AuthStateManager();
