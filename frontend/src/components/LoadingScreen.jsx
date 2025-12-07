import { motion } from 'framer-motion';
import { Mail, Zap } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="loading-screen fixed inset-0 flex items-center justify-center z-50">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          
          {/* Orbiting element */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <Zap className="w-4 h-4 text-accent" />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-2xl font-bold tracking-tight"
        >
          <span className="text-primary">Cold</span>
          <span className="text-foreground">E.</span>
          <span className="text-secondary">AI</span>
        </motion.h1>
        
        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-2"
        >
          <div className="w-8 h-8 loading-ring rounded-full" />
          <span className="text-muted-foreground font-mono text-sm">Initializing...</span>
        </motion.div>
        
        {/* Terminal-style text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 font-mono text-xs text-muted-foreground"
        >
          <span className="text-accent">&gt;</span> Loading AI Agent...
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
