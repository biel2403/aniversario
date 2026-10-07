import React from 'react';
import { createRoot } from 'react-dom/client';
import { domMax, LazyMotion, MotionConfig } from 'framer-motion';
import App from './App';
import { SpotifyProvider } from './hooks/SpotifyProvider';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user"><LazyMotion features={domMax} strict><SpotifyProvider><App /></SpotifyProvider></LazyMotion></MotionConfig>,
);
