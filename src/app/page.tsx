import { AiRecommendations } from "@/components/home/ai-recommendations";
import { ApplicationFlow } from "@/components/home/application-flow";
import { HeroSection } from "@/components/home/hero-section";
import { PulseCommandCenter } from "@/components/home/pulse-command-center";
import { TrendingSection } from "@/components/home/trending-section";
import { VibeSelector } from "@/components/home/vibe-selector";
import { WeatherStrip } from "@/components/home/weather-strip";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WeatherStrip />
      <PulseCommandCenter />
      <VibeSelector />
      <AiRecommendations />
      <TrendingSection />
      <ApplicationFlow />
    </>
  );
}
