import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    
    if (!tx_ref) {
      setStatus('error');
      setMessage('Invalid payment reference');
      setTimeout(() => navigate('/checkout'), 3000);
      return;
    }
    
    verifyPayment(tx_ref);
  }, []);

  const verifyPayment = async (tx_ref) => {
    try {
      const response = await fetch(`${API_URL}/payments/verify?tx_ref=${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.status === 'completed') {
        setStatus('success');
        setMessage('Payment verified successfully! Redirecting...');
        
        // Clear cart
        localStorage.removeItem('checkoutReservations');
        
        setTimeout(() => {
          navigate('/my-tickets');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Payment verification failed');
        setTimeout(() => navigate('/checkout'), 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please contact support.');
      setTimeout(() => navigate('/checkout'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {status === 'verifying' && (
          <>
            <Loader className="size-16 text-green-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your transaction...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="size-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="size-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
