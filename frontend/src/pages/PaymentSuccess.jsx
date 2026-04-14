import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, Download, QrCode, Ticket } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [tickets, setTickets] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    
    console.log('Payment success page - tx_ref:', tx_ref);
    
    if (!tx_ref) {
      setErrorMessage('No transaction reference found');
      setVerifying(false);
      return;
    }
    
    verifyPayment(tx_ref);
  }, []);

  const verifyPayment = async (tx_ref) => {
    try {
      console.log('Verifying payment with backend:', tx_ref);
      
      const response = await fetch(`${API_URL}/payments/verify?tx_ref=${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      console.log('Verification response:', data);
      
      if (data.success && data.status === 'completed') {
        setSuccess(true);
        setOrderNumber(data.order_number || tx_ref);

        const issuedTickets = Array.isArray(data.tickets) ? data.tickets : [];
        setTickets(issuedTickets);
        localStorage.removeItem('checkoutReservations');
      } else {
        setSuccess(false);
        setErrorMessage(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setSuccess(false);
      setErrorMessage('Failed to verify payment. Please contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const downloadTicket = (ticket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const eventTitle = ticket.event?.title || 'Event Ticket';
    const ticketType = ticket.ticket_type?.tier_name || 'General';
    const qrCodeImage = ticket.qr_code_data_url || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${eventTitle} - Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .ticket { border: 2px solid #10b981; border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; }
          .qr { text-align: center; margin: 20px 0; }
          .details { margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>DEMS Digital Ticket</h2>
          </div>
          <div class="qr">
            ${
              qrCodeImage
                ? `<img src="${qrCodeImage}" alt="Ticket QR" style="width: 170px; height: 170px; object-fit: contain;" />`
                : '<p>QR image unavailable</p>'
            }
          </div>
          <div class="details">
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Ticket Type:</strong> ${ticketType}</p>
            <p><strong>Ticket Code:</strong> ${ticket.ticket_code}</p>
            <p><strong>Purchase Date:</strong> ${new Date(ticket.purchase_date).toLocaleDateString()}</p>
          </div>
          <div class="footer">
            <p>Scan this QR code at the event entrance</p>
            <p>© DEMS Event Platform</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.print();
  };

  const downloadAllTickets = () => {
    tickets.forEach(ticket => downloadTicket(ticket));
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="size-16 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your transaction...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="size-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your tickets have been saved to your account.</p>
            <p className="text-sm text-gray-500 mt-2">Reference: {orderNumber}</p>
            
            {tickets.length > 0 && (
              <button 
                onClick={downloadAllTickets}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg inline-flex items-center gap-2 hover:bg-green-700 transition"
              >
                <Download className="size-4" /> Download All Tickets ({tickets.length})
              </button>
            )}
          </div>

          {tickets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={ticket.event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'} 
                      alt={ticket.event.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Valid</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{ticket.event.title}</h3>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Ticket Type</span>
                        <span className="font-semibold">{ticket.ticket_type.tier_name}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">{ticket.ticket_code}</code>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-4 mb-4 border">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center">
                          {ticket.qr_code_data_url ? (
                            <img src={ticket.qr_code_data_url} alt="Ticket QR" className="w-full h-full object-contain p-1" />
                          ) : (
                            <QrCode className="size-10 text-gray-800" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Scan this QR code at the event entrance</p>
                          <p className="text-xs font-mono text-green-600">{ticket.ticket_code}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => downloadTicket(ticket)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition">
                        <Download className="size-4" /> Download
                      </button>
                      <button onClick={() => navigate('/discover')} className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">
                        Browse More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => navigate('/discover')} className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition">
              Continue Browsing Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <XCircle className="size-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-4">{errorMessage || 'Something went wrong. Please try again.'}</p>
        <button 
          onClick={() => navigate('/checkout')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Go Back to Checkout
        </button>
      </div>
    </div>
  );
}
