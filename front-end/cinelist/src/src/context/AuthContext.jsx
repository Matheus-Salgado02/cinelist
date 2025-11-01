import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se há um usuário logado ao carregar a aplicação
    const initializeAuth = async () => {
      try {
        const isValid = await authService.validateToken();
        if (isValid) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await authService.login(email, password);
      setUser(authData.user);
      return authData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name = '') => {
    try {
      const authData = await authService.register(email, password, name);
      setUser(authData.user);
      return authData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const addToWatchlist = async (movie) => {
    if (!movie) throw new Error('movie required');
    // optimistic update: add id locally first
    const id = movie.id || movie.movieId || movie;
    setUser((prev) => {
      if (!prev) return prev;
      const prevWatch = Array.isArray(prev.watchlist) ? prev.watchlist : [];
      if (prevWatch.map(Number).includes(Number(id))) return prev; // already present
      return { ...prev, watchlist: [...prevWatch, String(id)] };
    });

    try {
      const updatedUser = await authService.addToWatchlist({ id });
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      // revert optimistic change
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, watchlist: (prev.watchlist || []).filter((x) => Number(x) !== Number(id)) };
      });
      throw error;
    }
  };

  const removeFromWatchlist = async (movieId) => {
    // optimistic remove: remove id locally first
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, watchlist: (prev.watchlist || []).filter((x) => Number(x) !== Number(movieId)) };
    });

    try {
      const updatedUser = await authService.removeFromWatchlist(movieId);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      // revert optimistic change: add it back
      setUser((prev) => {
        if (!prev) return prev;
        const prevWatch = Array.isArray(prev.watchlist) ? prev.watchlist : [];
        if (prevWatch.map(Number).includes(Number(movieId))) return prev;
        return { ...prev, watchlist: [...prevWatch, String(movieId)] };
      });
      throw error;
    }
  };

  const addOrUpdateReview = async (movieId, rating, text) => {
    try {
      const review = await authService.addOrUpdateReview(movieId, rating, text);
      // refresh user from storage
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
      return review;
    } catch (error) {
      throw error;
    }
  };

  const removeReview = async (reviewId) => {
    try {
      await authService.removeReview(reviewId);
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const getReviewsForMovie = async (movieId) => {
    try {
      return await authService.getReviewsForMovie(movieId);
    } catch (error) {
      throw error;
    }
  };

  // reviews feature removed

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    addToWatchlist,
    removeFromWatchlist,
    addOrUpdateReview,
    removeReview,
    getReviewsForMovie,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};