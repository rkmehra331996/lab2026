import React from 'react';
import { AppView, SeoPost } from '../types';
import { SeoPostCardsSection } from './SeoPostCardsSection';

interface FooterProps {
  onSelectView?: (view: AppView) => void;
  onOpenDemo?: () => void;
  onSelectPost?: (post: SeoPost) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectPost }) => {
  return (
    <>
      {/* Published SEO Knowledge & Diagnostic Guides Post Cards - Replaced Marquee */}
      <SeoPostCardsSection onSelectPost={onSelectPost} theme="dark" />
    </>
  );
};
