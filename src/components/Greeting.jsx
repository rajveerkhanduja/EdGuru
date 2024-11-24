import { useEffect, useState } from 'react';

const Greeting = () => {
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay('Morning');
      else if (hour >= 12 && hour < 17) setTimeOfDay('Afternoon');
      else setTimeOfDay('Evening'); // "Evening" for hours >= 17
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="greeting-container">
      <div className="greeting">
        <h1>Good {timeOfDay}! What can I help you with?</h1>
      </div>
    </div>
  );
};

export default Greeting;
