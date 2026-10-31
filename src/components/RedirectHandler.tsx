import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const product = params.get('product') || params.get('p');

    if (product) {
      navigate(`/product/${product}`, { replace: true });
    } else if (tab) {
      const tabToPath: Record<string, string> = {
        'home': '/',
        'store': '/store',
        'best-sellers': '/best-sellers',
        'offers': '/offers',
        'new-arrivals': '/new-arrivals',
        'about': '/about',
        'contact': '/contact',
        'account': '/account',
        'track-order': '/track-order',
        'dashboard': '/dashboard'
      };

      if (tabToPath[tab]) {
        navigate(tabToPath[tab], { replace: true });
      }
    }

  }, [location, navigate]);

  return null;
};

export default RedirectHandler;
