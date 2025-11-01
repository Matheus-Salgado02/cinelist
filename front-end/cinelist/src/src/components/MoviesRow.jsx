import React from 'react';
import MovieCard from './MovieCard';
import './movies_row.css';

export default function MoviesRow({ title, movies = [], imageBase }) {
  return (
    <div className="movies-row">
      <div className="row-header">
        <h3 className="row-title">{title}</h3>
      </div>
      <div className="row-list">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} imageBase={imageBase} />
        ))}
      </div>
    </div>
  );
}
