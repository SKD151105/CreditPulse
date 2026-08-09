import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Plus, Trash2, Power, PowerOff, AlertCircle, Copy, Check } from 'lucide-react';
import axiosInstance from '../api/axios';

interface Webhook {
  _id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  failureCount: number;
  lastDeliveredAt?: string;
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['loan.approved']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const availableEvents = ['loan.submitted', 'loan.approved', 'loan.rejected', 'loan.disbursed'];

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/webhooks');
      setWebhooks(response.data.data);
    } catch (error) {
      console.error('Failed to fetch webhooks', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWebhooks();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWebhooks]);

  const handleToggle = async (id: string) => {
    try {
      await axiosInstance.patch(`/webhooks/${id}/toggle`);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || selectedEvents.length === 0) return;

    try {
      await axiosInstance.post('/webhooks', {
        url: newUrl,
        events: selectedEvents
      });
      setNewUrl('');
      setSelectedEvents(['loan.approved']);
      setShowAddForm(false);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to add webhook', error);
      alert('Failed to add webhook. Ensure URL is valid.');
    }
  };

  const toggleEventSelection = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-700 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-700 rounded"></div><div className="h-4 bg-gray-700 rounded w-5/6"></div></div></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Partner Webhooks</h2>
          <p className="text-sm text-gray-400">Configure endpoints to receive real-time loan updates.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center"
        >
          {showAddForm ? <Trash2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="glass border border-white/10 rounded-xl p-6 overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payload URL</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://partner-crm.com/api/webhooks/creditpulse"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Events to send</label>
                <div className="flex flex-wrap gap-2">
                  {availableEvents.map(evt => (
                    <button
                      key={evt}
                      type="button"
                      onClick={() => toggleEventSelection(evt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedEvents.includes(evt) 
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' 
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {evt}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!newUrl || selectedEvents.length === 0}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Save Webhook
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 glass border border-white/10 rounded-xl">
            <Globe className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No webhooks configured yet.</p>
          </div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh._id} className={`glass border rounded-xl p-5 transition-all ${wh.isActive ? 'border-indigo-500/30' : 'border-gray-700 opacity-75'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`flex items-center text-sm font-medium ${wh.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {wh.isActive ? <Power className="h-4 w-4 mr-1" /> : <PowerOff className="h-4 w-4 mr-1" />}
                      {wh.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <h3 className="text-lg font-mono truncate text-white">{wh.url}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {wh.events.map(evt => (
                      <span key={evt} className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-white/10 text-gray-300">
                        {evt}
                      </span>
                    ))}
                  </div>

                  <div className="bg-black/40 rounded-lg p-3 flex justify-between items-center group">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Secret Key (HMAC SHA-256)</p>
                      <p className="font-mono text-sm text-gray-300 select-all">{wh.secret}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(wh.secret, wh._id)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-md text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy Secret"
                    >
                      {copiedId === wh._id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-between items-center md:items-end min-w-[140px] pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-4 gap-4 md:gap-0">
                  <button
                    onClick={() => handleToggle(wh._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full ${
                      wh.isActive 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {wh.isActive ? 'Disable' : 'Enable'}
                  </button>
                  
                  <div className="text-right text-xs md:mt-4">
                    {wh.failureCount > 0 && (
                      <p className="text-red-400 flex items-center justify-end mb-1">
                        <AlertCircle className="h-3 w-3 mr-1" /> {wh.failureCount} Failures
                      </p>
                    )}
                    <p className="text-gray-500">
                      Last delivery: {wh.lastDeliveredAt ? new Date(wh.lastDeliveredAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
