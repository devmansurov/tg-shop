import { useEffect } from 'react';
import { Navigate, Route, Routes, HashRouter, useLocation } from 'react-router-dom';
import { useLaunchParams, useSignal, miniApp } from '@tma.js/sdk-react';

import { routes } from '@/navigation/routes.tsx';
import { CartProvider } from '@/store/cart.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/') window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  return (
    <div className={['app', isDark ? 'dark' : 'light', ['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : ''].join(' ')}>
      <CartProvider>
        <HashRouter>
          <ScrollToTop/>
          <Routes>
            {routes.map((route) => <Route key={route.path} {...route} />)}
            <Route path="*" element={<Navigate to="/"/>}/>
          </Routes>
        </HashRouter>
      </CartProvider>
    </div>
  );
}
