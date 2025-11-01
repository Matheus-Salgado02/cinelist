import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import HomePage from './src/pages/home_page';
import LoginPage from './src/pages/LoginPage';
import AccountPage from './src/pages/AccountPage';
import MovieDetails from './src/pages/MovieDetails';
import SearchResults from './src/pages/SearchResults';
import Watchlist from './src/pages/Watchlist';
import BrowseMovies from './src/pages/BrowseMovies';
import PrivateRoute from './src/components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/browse" element={<BrowseMovies />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/search" element={<SearchResults />} />
            <Route 
              path="/account" 
              element={
                <PrivateRoute>
                  <AccountPage />
                </PrivateRoute>
              } 
            />
            <Route
              path="/watchlist"
              element={
                <PrivateRoute>
                  <Watchlist />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
