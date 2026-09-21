import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import App from './App';
import './index.css';

// RainbowKit & Wagmi Configuration - Sepolia Only
const config = getDefaultConfig({
  appName: 'KaySwap DEX',
  projectId: '5c499eda8e4b1a80534ed01c77f121dd', // Standard demo Project ID for RainbowKit
  chains: [sepolia],
});

const queryClient = new QueryClient();

// Custom Sharp RainbowKit Theme matching KaySwap palette (#450C3F, #165823, #FCECD8)
const customSharpTheme = darkTheme({
  accentColor: '#165823',
  accentColorForeground: '#ffffff',
  borderRadius: 'none',
  fontStack: 'system',
  overlayBlur: 'small',
});

customSharpTheme.colors.modalBackground = '#450C3F';
customSharpTheme.colors.modalText = '#FCECD8';
customSharpTheme.colors.modalBorder = '#FCECD8';
customSharpTheme.colors.profileAction = '#165823';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customSharpTheme}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
