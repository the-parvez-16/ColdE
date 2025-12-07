import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Mail, Send, CheckCircle2, XCircle, Clock, 
  BarChart3, TrendingUp, Loader2, ChevronRight 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/campaigns`)
      ]);
      setStats(statsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-accent';
      case 'processing':
      case 'finding_emails':
      case 'sending': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
      case 'finding_emails':
      case 'sending': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Monitor your cold email campaigns</p>
            </div>
            <Link to="/campaign/new">
              <Button className="bg-primary hover:bg-primary/90 glow-primary" data-testid="new-campaign-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="stats-card rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold" data-testid="stat-campaigns">{stats?.total_campaigns || 0}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stats-card rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="text-2xl font-bold" data-testid="stat-emails-sent">{stats?.total_emails_sent || 0}</div>
              <div className="text-sm text-muted-foreground">Emails Sent</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stats-card rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold text-accent" data-testid="stat-positive">{stats?.total_positive || 0}</div>
              <div className="text-sm text-muted-foreground">Positive Replies</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="stats-card rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold" data-testid="stat-response-rate">{stats?.response_rate || 0}%</div>
              <div className="text-sm text-muted-foreground">Response Rate</div>
            </motion.div>
          </div>
          
          {/* Response Breakdown */}
          {stats && (stats.total_positive > 0 || stats.total_negative > 0 || stats.total_no_reply > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6 mb-8"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Response Breakdown
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="text-2xl font-bold text-accent">{stats.total_positive}</div>
                  <div className="text-sm text-muted-foreground">Positive</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">{stats.total_negative}</div>
                  <div className="text-sm text-muted-foreground">Negative</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.total_no_reply}</div>
                  <div className="text-sm text-muted-foreground">No Reply</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Campaigns List */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Recent Campaigns</h2>
            </div>
            
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">Create your first campaign to start sending emails</p>
                <Link to="/campaign/new">
                  <Button className="bg-primary hover:bg-primary/90" data-testid="empty-state-new-campaign-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/campaign/${campaign.id}`}
                      className="block p-6 hover:bg-muted/30 transition-colors"
                      data-testid={`campaign-item-${campaign.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold truncate">{campaign.name}</h3>
                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted ${getStatusColor(campaign.status)}`}>
                              {getStatusIcon(campaign.status)}
                              {formatStatus(campaign.status)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-3">
                            {campaign.work_description}
                          </p>
                          {campaign.status !== 'completed' && campaign.status !== 'draft' && (
                            <div className="flex items-center gap-3">
                              <Progress value={campaign.progress} className="h-2 flex-1 max-w-xs" />
                              <span className="text-xs text-muted-foreground">{campaign.progress}%</span>
                            </div>
                          )}
                          {campaign.status === 'completed' && campaign.stats && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                <Send className="w-3 h-3 inline mr-1" />
                                {campaign.stats.sent} sent
                              </span>
                              <span className="text-accent">
                                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                {campaign.stats.positive} positive
                              </span>
                              <span className="text-destructive">
                                <XCircle className="w-3 h-3 inline mr-1" />
                                {campaign.stats.negative} negative
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
