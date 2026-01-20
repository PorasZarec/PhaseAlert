import React from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

// Define libraries outside to prevent re-renders
const libraries = ["places"];

export const GoogleMapsLoader = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 text-red-600 rounded-xl border border-red-100">
        <p>Error loading Google Maps. Please check your internet or API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return children;
};
