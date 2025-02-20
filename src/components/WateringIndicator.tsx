import React, { useEffect, useState } from 'react';
import { Droplet } from 'lucide-react';

interface WateringIndicatorProps {
  lastWatered: string;
  wateringDays: number;
  wateringHours: number;
  onWater: () => void;
}

const WateringIndicator: React.FC<WateringIndicatorProps> = ({
  lastWatered,
  wateringDays,
  wateringHours,
  onWater,
}) => {
  const [percentage, setPercentage] = useState(100);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimes = () => {
      const now = new Date();
      const lastWateredDate = new Date(lastWatered);
      const totalWateringTime = (wateringDays * 24 + wateringHours) * 60 * 60 * 1000;
      const timeSinceWatering = now.getTime() - lastWateredDate.getTime();
      const newPercentage = Math.max(0, 100 - (timeSinceWatering / totalWateringTime) * 100);
      
      // Only update if not already at 0%
      if (percentage !== 0 || newPercentage > 0) {
        setPercentage(newPercentage);
      }

      // Calculate time left
      const timeLeftMs = Math.max(0, totalWateringTime - timeSinceWatering);
      const hours = Math.floor(timeLeftMs / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeLeft(`${days}d ${remainingHours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m`);
      } else {
        setTimeLeft('Time to water!');
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastWatered, wateringDays, wateringHours, percentage]);

  const getBarColor = () => {
    if (percentage <= 5) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mr-2">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-1000 ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white z-10 mix-blend-difference">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        <button
          onClick={onWater}
          className={`flex items-center justify-center h-6 w-6 rounded ${
            percentage === 0
              ? 'text-white bg-blue-500 hover:bg-blue-600'
              : 'text-blue-500 hover:text-blue-600'
          }`}
          title="Water plant"
        >
          <Droplet className="h-4 w-4" />
        </button>
      </div>
      <div className="text-sm text-gray-600 text-center">
        {timeLeft}
      </div>
    </div>
  );
};

export default WateringIndicator;
