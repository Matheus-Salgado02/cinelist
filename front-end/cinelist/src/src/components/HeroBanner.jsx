import React from 'react';
import './hero_banner.css';

export default function HeroBanner({ movie, imageBase }) {
  if (!movie) return null;

  const backdrop = movie.backdrop_path ? `${(imageBase ? imageBase.replace('/w342', '/original') : '')}${movie.backdrop_path}` : '';

  return (
    <section className="hero-banner" style={{ backgroundImage: `url(${backdrop})` }}>
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-title">{movie.title || movie.name}</h1>
          <p className="hero-tagline">{movie.overview}</p>
          <div className="hero-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
