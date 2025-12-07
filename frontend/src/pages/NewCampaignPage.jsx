import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Rocket, User, FileText, Users, ArrowRight, 
  Loader2, Terminal, Zap 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NewCampaignPage = () => {
  const [name, setName] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [emailLimit, setEmailLimit] = useState([20]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    if (!workDescription.trim()) {
      toast.error('Please describe your work');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/campaigns`, {
        name: name.trim(),
        work_description: workDescription.trim(),
        email_limit: emailLimit[0]
      });
      
      toast.success('Campaign started! AI Agent is working...');
      navigate(`/campaign/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="new-campaign-page">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 glow-primary">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Launch New Campaign</h1>
            <p className="text-muted-foreground">Tell us about your outreach goals</p>
          </motion.div>
          
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Campaign Name */}
              <div className="space-y-3">
                <Label htmlFor="name" className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-primary" />
                  Campaign Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Q4 Tech Startup Outreach"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="terminal-input h-12 text-base"
                  data-testid="campaign-name-input"
                />
                <p className="text-xs text-muted-foreground">Give your campaign a memorable name</p>
              </div>
              
              {/* Work Description */}
              <div className="space-y-3">
                <Label htmlFor="work" className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  What do you do?
                </Label>
                <Textarea
                  id="work"
                  placeholder="e.g., I'm a freelance web developer specializing in React and Node.js. I help startups build MVPs quickly..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="terminal-input min-h-[120px] text-base"
                  data-testid="campaign-work-input"
                />
                <p className="text-xs text-muted-foreground">AI will use this to personalize your emails</p>
              </div>
              
              {/* Email Limit */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-primary" />
                  How many emails?
                </Label>
                <div className="px-2">
                  <Slider
                    value={emailLimit}
                    onValueChange={setEmailLimit}
                    min={5}
                    max={100}
                    step={5}
                    className="py-4"
                    data-testid="campaign-limit-slider"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">5</span>
                  <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                    <span className="text-2xl font-bold text-primary" data-testid="email-limit-value">{emailLimit[0]}</span>
                    <span className="text-sm text-muted-foreground ml-1">emails</span>
                  </div>
                  <span className="text-sm text-muted-foreground">100</span>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">What happens next?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-accent" />
                        AI finds relevant email addresses
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-accent" />
                        Personalizes emails for each company
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-accent" />
                        Sends and tracks responses
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 glow-primary"
                data-testid="launch-campaign-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting Agent...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Launch Campaign
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default NewCampaignPage;
