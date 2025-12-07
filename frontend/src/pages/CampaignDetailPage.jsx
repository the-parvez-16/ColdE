import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Send,
  Mail, Building2, Trash2, RefreshCw, Search, Filter
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCampaign();
    const interval = setInterval(fetchCampaign, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`${API}/campaigns/${id}`);
      setCampaign(response.data);
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      if (error.response?.status === 404) {
        toast.error('Campaign not found');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/campaigns/${id}`);
      toast.success('Campaign deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'processing':
        return { text: 'Initializing...', color: 'text-secondary', icon: <Loader2 className="w-5 h-5 animate-spin" /> };
      case 'finding_emails':
        return { text: 'Finding Emails', color: 'text-secondary', icon: <Search className="w-5 h-5 animate-pulse" /> };
      case 'sending':
        return { text: 'Sending Emails', color: 'text-primary', icon: <Send className="w-5 h-5" /> };
      case 'completed':
        return { text: 'Completed', color: 'text-accent', icon: <CheckCircle2 className="w-5 h-5" /> };
      default:
        return { text: status, color: 'text-muted-foreground', icon: <Clock className="w-5 h-5" /> };
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'positive':
        return <span className="badge-positive px-2 py-1 rounded-full text-xs font-medium">Positive</span>;
      case 'negative':
        return <span className="badge-negative px-2 py-1 rounded-full text-xs font-medium">Negative</span>;
      case 'no_reply':
        return <span className="badge-no-reply px-2 py-1 rounded-full text-xs font-medium">No Reply</span>;
      default:
        return null;
    }
  };

  const filteredTargets = campaign?.targets?.filter(t => {
    if (filter === 'all') return true;
    return t.response_category === filter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) return null;

  const statusInfo = getStatusInfo(campaign.status);
  const isProcessing = ['processing', 'finding_emails', 'sending'].includes(campaign.status);

  return (
    <div className="min-h-screen" data-testid="campaign-detail-page">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold" data-testid="campaign-title">{campaign.name}</h1>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span className="text-sm font-medium">{statusInfo.text}</span>
                  </span>
                </div>
                <p className="text-muted-foreground mb-4">{campaign.work_description}</p>
                
                {/* Progress */}
                {isProcessing && (
                  <div className="flex items-center gap-4">
                    <Progress value={campaign.progress} className="h-3 flex-1 max-w-md" />
                    <span className="text-sm font-mono text-primary" data-testid="campaign-progress">{campaign.progress}%</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={fetchCampaign} data-testid="refresh-btn">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" data-testid="delete-campaign-btn">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All campaign data will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        disabled={deleting}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
          
          {/* Stats */}
          {campaign.status === 'completed' && campaign.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            >
              <div className="stats-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold" data-testid="stat-total">{campaign.stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Emails</div>
              </div>
              <div className="stats-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-accent" data-testid="stat-positive-detail">{campaign.stats.positive}</div>
                <div className="text-sm text-muted-foreground">Positive</div>
              </div>
              <div className="stats-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-destructive" data-testid="stat-negative-detail">{campaign.stats.negative}</div>
                <div className="text-sm text-muted-foreground">Negative</div>
              </div>
              <div className="stats-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground" data-testid="stat-no-reply-detail">{campaign.stats.no_reply}</div>
                <div className="text-sm text-muted-foreground">No Reply</div>
              </div>
            </motion.div>
          )}
          
          {/* Targets List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold">Email Targets ({campaign.targets?.length || 0})</h2>
              
              {/* Filter */}
              {campaign.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-muted border-none rounded-lg px-3 py-1.5 text-sm"
                    data-testid="filter-select"
                  >
                    <option value="all">All</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="no_reply">No Reply</option>
                  </select>
                </div>
              )}
            </div>
            
            {filteredTargets.length === 0 ? (
              <div className="p-12 text-center">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Finding email targets...</p>
                  </>
                ) : (
                  <>
                    <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No targets found</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTargets.map((target, index) => (
                  <motion.div
                    key={`${target.email}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-muted/20 transition-colors"
                    data-testid={`target-item-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-sm" data-testid={`target-email-${index}`}>{target.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            {target.company}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {target.status === 'sent' && (
                          <span className="text-xs text-secondary flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Sent
                          </span>
                        )}
                        {target.status === 'delivered' && !target.response_category && (
                          <span className="text-xs text-accent flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Delivered
                          </span>
                        )}
                        {target.response_category && getCategoryBadge(target.response_category)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetailPage;
