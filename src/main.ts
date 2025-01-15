import { Server } from './server/server';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

// Start the server
const server = new Server();
server.start();

// Start the React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      MantineProvider,
      null,
      React.createElement(App)
    )
  )
); 