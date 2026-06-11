import type { Metadata } from 'next';
import './gaming.css';
import { GamingExperience } from './_components/gaming-experience';

export const metadata: Metadata = {
  title: 'VOIDREALM — The arena never sleeps',
  description:
    'A dark neon gaming experience: giant clocks, purple lightning, parallax depths. Season VIII is counting down.',
  robots: { index: false, follow: false },
};

export default function GamingPage() {
  return <GamingExperience />;
}
