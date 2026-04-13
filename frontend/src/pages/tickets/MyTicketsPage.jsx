import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Download, QrCode, CheckCircle, Clock } from 'lucide-react';
import { ticketAPI } from '../../api/client';

export function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await ticketAPI.getMyTickets();
        if (response.success) {
          setTickets(response.tickets || []);
        }
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const downloadTicket = (ticket) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${ticket.event.title} - Ticket</title>
      <style>body{font-family:Arial;padding:40px}.ticket{border:2px solid #10b981;border-radius:12px;padding:20px;max-width:500px;margin:0 auto}.qr{text-align:center;margin:20px}</style>
      </head><body>
      <div class="ticket"><div class="header"><h2>DEMS Digital Ticket</h2><p>${ticket.event.title}</p></div>
      <div class="qr">${ticket.qr_code_data_url ? `<img src="${ticket.qr_code_data_url}" alt="Ticket QR" style="width:170px;height:170px;object-fit:contain;" />` : `<div style="display:inline-block;padding:10px;background:#f0f0f0"><div style="width:150px;height:150px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center">QR</div></div>`}</div>
      <div><p><strong>Date:</strong> ${new Date(ticket.event.start_datetime).toLocaleDateString()}</p><p><strong>Location:</strong> ${ticket.event.venue_name || ''}, ${ticket.event.city || ''}</p><p><strong>Ticket Type:</strong> ${ticket.ticket_type.tier_name}</p><p><strong>Ticket Code:</strong> ${ticket.ticket_code}</p></div>
      <div class="footer"><p>Scan this QR code at the event entrance</p><p>© DEMS Event Platform</p></div></div>
      </body></html>
    `);
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Clock className="size-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-6xl mx-auto">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl shadow-lg mb-4"><Ticket className="size-8 text-white" /></div><h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1><p className="text-gray-600">Your digital ticket wallet</p></div>
        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"><Ticket className="size-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3><p className="text-gray-500 mb-6">You haven't purchased any tickets yet</p><Link to="/discover" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl">Browse Events</Link></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-40 overflow-hidden"><img src={ticket.event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'} alt={ticket.event.title} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><span className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full"><CheckCircle className="size-3 inline mr-1" />Valid</span></div>
                <div className="p-5"><h3 className="font-bold text-lg text-gray-900 mb-2">{ticket.event.title}</h3><div className="space-y-2 mb-4"><div className="flex items-center gap-2 text-sm"><Calendar className="size-4 text-green-600" /><span>{new Date(ticket.purchase_date).toLocaleDateString()}</span></div><div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-red-500" /><span>{ticket.event.venue_name || 'Venue TBD'}, {ticket.event.city || 'Addis Ababa'}</span></div></div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4"><div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Ticket Type</span><span className="font-semibold">{ticket.ticket_type.tier_name}</span></div><div className="mt-3 pt-3 border-t"><code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">{ticket.ticket_code}</code></div></div>
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-4 mb-4 border"><div className="flex items-center gap-4"><div className="w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">{ticket.qr_code_data_url ? <img src={ticket.qr_code_data_url} alt="Ticket QR" className="w-full h-full object-contain p-1" /> : <QrCode className="size-12 text-gray-800" />}</div><div><p className="text-xs text-gray-600 mb-1">Scan this QR code at the event entrance</p><p className="text-xs font-mono text-green-600">{ticket.ticket_code}</p></div></div></div>
                <div className="flex gap-3"><Link to={`/event/${ticket.event.id}`} className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-lg text-center">View Event</Link><button onClick={() => downloadTicket(ticket)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"><Download className="size-4" />Download</button></div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): implement JWT-signed QR payload generation for digital tickets
// Update for: feat(frontdoor): coordinate frontdoor integration and resolve merge conflicts
// Update for: feat(frontdoor): implement filter system and category chips
// Update for: feat(frontdoor): add POST /api/staff/scan flow for QR validation and check-in
// Update for: chore(frontdoor): update frontend flow documentation and API specs