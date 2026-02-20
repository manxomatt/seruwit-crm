
import React, { createContext, useContext, useState } from 'react';

export interface LandingContent {
  hero: {
    badge: string;
    title: string;
    description: string;
    primaryBtn: string;
    secondaryBtn: string;
  };
  stats: Array<{ value: string; label: string }>;
  pricing: Array<{
    name: string;
    price: string;
    description: string;
    features: string[];
    isFeatured?: boolean;
    btnText: string;
  }>;
}

const defaultContent: LandingContent = {
  hero: {
    badge: "✨ New: Tracking Joy V3 is Live!",
    title: "Track with Joy, Live with Peace",
    description: "Keep what you love close. Experience real-time freedom with the world's most vibrant and reliable GPS tracking community.",
    primaryBtn: "Unlock Your Freedom",
    secondaryBtn: "See the Magic"
  },
  stats: [
    { value: '99.9%', label: 'Always On' },
    { value: '120+', label: 'Global Reach' },
    { value: '<1s', label: 'Swift Sync' },
    { value: '24/7', label: 'Here for You' },
  ],
  pricing: [
    {
      name: "Starter",
      price: "19",
      description: "Perfect for home heroes",
      features: ["2 Friendly Devices", "Real-time Happiness", "30-Day History"],
      btnText: "Start Here"
    },
    {
      name: "Pro",
      price: "49",
      description: "For growing adventures",
      features: ["15 Super Devices", "Turbo-Speed Updates", "1-Year Memory", "Full App Control"],
      isFeatured: true,
      btnText: "Get Pro Now"
    },
    {
      name: "Universe",
      price: "Custom",
      description: "Unlimited possibilities",
      features: ["Unlimited Connections", "Custom Setup", "Personal Joy Manager"],
      btnText: "Contact Us"
    }
  ]
};

interface ContentContextType {
  content: LandingContent;
  updateContent: (newContent: Partial<LandingContent>) => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<LandingContent>(defaultContent);

  const updateContent = (newContent: Partial<LandingContent>) => {
    setContent(prev => ({ ...prev, ...newContent }));
  };

  return (
    <ContentContext.Provider value={{ content, updateContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within a ContentProvider');
  return context;
};
