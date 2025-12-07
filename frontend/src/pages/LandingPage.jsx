import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Mail, Zap, Target, BarChart3, Send, CheckCircle2, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Target,
      title: 'Smart Targeting',
      description: 'AI finds the right contacts from your target companies automatically'
    },
    {
      icon: Mail,
      title: 'Personalized Emails',
      description: 'Context-aware emails crafted for each prospect\'s company'
    },
    {
      icon: Send,
      title: 'Auto Send',
      description: 'Automated sending with smart scheduling and follow-ups'
    },
    {
      icon: BarChart3,
      title: 'Response Tracking',
      description: 'Track opens, replies, and categorize responses automatically'
    }
  ];

  const steps = [
    { num: '01', title: 'Enter Details', desc: 'Your name, work description, and target count' },
    { num: '02', title: 'AI Finds Emails', desc: 'Agent searches and validates email addresses' },
    { num: '03', title: 'Send Campaigns', desc: 'Personalized emails sent automatically' },
    { num: '04', title: 'Track Results', desc: 'Monitor responses and positive leads' }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Outreach</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Cold Emailing
                <br />
                <span className="text-primary">Automated</span> by AI
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Let our AI agent find emails, personalize messages, and send campaigns while you focus on closing deals. Track responses in real-time.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary group" data-testid="hero-cta-btn">
                    Start Free Campaign
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-border hover:bg-muted" data-testid="hero-login-btn">
                    Sign In
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 mt-12">
                <div>
                  <div className="text-3xl font-bold text-primary">10x</div>
                  <div className="text-sm text-muted-foreground">Faster Outreach</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">85%</div>
                  <div className="text-sm text-muted-foreground">Delivery Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Working</div>
                </div>
              </div>
            </motion.div>
            
            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:col-span-5"
            >
              <div className="relative">
                <div className="glass-card rounded-2xl p-6 scan-effect">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Campaign Active</div>
                      <div className="text-sm text-muted-foreground">Processing 50 emails</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Finding emails...</div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full w-3/4 bg-accent rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                      <Send className="w-5 h-5 text-secondary" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Sending emails...</div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full w-1/2 bg-secondary rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Tracking responses...</div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full w-1/4 bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium"
                >
                  +5 Positive Replies
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run successful cold email campaigns
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card glass-card rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Simple 4-step process to start your outreach</p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="glass-card rounded-xl p-6">
                  <div className="text-4xl font-bold text-primary/20 mb-4 font-mono">{step.num}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="text-primary">Automate</span> Your Outreach?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start sending personalized cold emails today. No credit card required.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary" data-testid="cta-start-btn">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              <span className="text-primary">Cold</span>E.<span className="text-secondary">AI</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ColdE.AI. AI-Powered Cold Email Agent.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
