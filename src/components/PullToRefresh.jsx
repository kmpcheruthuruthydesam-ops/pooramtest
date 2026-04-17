import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Haptics } from '../lib/haptics';

const PullToRefresh = ({ children, onRefresh }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const y = useMotionValue(0);
    const threshold = 80;
    const containerRef = useRef(null);

    // Track vertical pull
    const handleDrag = (_, info) => {
        if (isRefreshing) return;
        
        const scrollAtTop = containerRef.current?.scrollTop === 0;
        if (!scrollAtTop && info.offset.y > 0) {
            y.set(0);
            return;
        }

        const progress = Math.min(info.offset.y / threshold, 1.2);
        setPullProgress(progress);
        
        // Haptic feedback when threshold reached
        if (info.offset.y >= threshold && pullProgress < 1) {
            Haptics.lightTick();
        }
    };

    const handleDragEnd = (_, info) => {
        if (info.offset.y >= threshold && !isRefreshing) {
            triggerRefresh();
        } else {
            y.set(0);
            setPullProgress(0);
        }
    };

    const triggerRefresh = () => {
        setIsRefreshing(true);
        Haptics.heavyTap();
        
        // Trigger the refresh action
        if (onRefresh) {
            onRefresh();
        } else {
            window.location.reload();
        }

        // Reset after a delay if not reloaded (fallback)
        setTimeout(() => {
            setIsRefreshing(false);
            y.set(0);
            setPullProgress(0);
        }, 3000);
    };

    const rotation = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2], [0, 1]);
    const scale = useTransform(y, [0, threshold], [0.5, 1]);

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden">
            {/* Refresh Indicator Overlay */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-[60]" style={{ height: threshold }}>
                <motion.div
                    style={{ y, opacity, scale }}
                    className="mt-4 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center justify-center border border-white/50"
                >
                    <motion.div style={{ rotate: isRefreshing ? undefined : rotation }}>
                        <RefreshCw 
                            size={20} 
                            className={`text-orange-500 ${isRefreshing ? 'animate-spin' : ''}`} 
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Draggable Content Layer */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: threshold + 20 }}
                dragElastic={0.4}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ y }}
                className="h-full w-full bg-[#f8f9fc]"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
