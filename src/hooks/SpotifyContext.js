import { createContext, useContext } from 'react';

// Stable across component refreshes while the story is being edited.
export const SpotifyContext = createContext(null);
export const SpotifyConnectionContext = createContext(null);
export function useSpotify() { return useContext(SpotifyContext); }
export function useSpotifyConnection() { return useContext(SpotifyConnectionContext); }
