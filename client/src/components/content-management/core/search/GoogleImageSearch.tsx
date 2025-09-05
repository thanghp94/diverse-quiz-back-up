import React, { useState } from 'react';

interface GoogleImageSearchProps {
  onSelectImage: (imageUrl: string) => void;
}

export const GoogleImageSearch: React.FC<GoogleImageSearchProps> = ({ onSelectImage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Google Custom Search API call
      // For now, simulate with placeholder images
      const simulatedResults = [
        'https://via.placeholder.com/150?text=Image+1',
        'https://via.placeholder.com/150?text=Image+2',
        'https://via.placeholder.com/150?text=Image+3',
      ];
      setResults(simulatedResults);
    } catch (err) {
      setError('Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <label htmlFor="google-image-search" className="block font-medium mb-2">
        Google Image Search
      </label>
      <div className="flex gap-2 mb-4">
        <input
          id="google-image-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search images..."
          className="flex-grow border rounded px-2 py-1"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Search
        </button>
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <div className="grid grid-cols-3 gap-2">
        {results.map((url) => (
          <img
            key={url}
            src={url}
            alt="Search result"
            className="cursor-pointer border rounded hover:ring-2 hover:ring-blue-500"
            onClick={() => onSelectImage(url)}
          />
        ))}
      </div>
    </div>
  );
};

export default GoogleImageSearch;
