import { AiRecommendations } from "@/components/home/ai-recommendations";
import { ApplicationFlow } from "@/components/home/application-flow";
import { HeroSection } from "@/components/home/hero-section";
import { PulseCommandCenter } from "@/components/home/pulse-command-center";
import { TrendingSection } from "@/components/home/trending-section";
import { VibeSelector } from "@/components/home/vibe-selector";
import { WeatherStrip } from "@/components/home/weather-strip";
import { events } from "@/data/kosovo-data";
import { getHomepageMapPlaces } from "@/services/location-layer";

export default async function HomePage() {
  const homepageMapPlaces = await getHomepageMapPlaces();
  const homepagePlaces = homepageMapPlaces.filter((place) => place.category.type !== "EVENT");

  return (
    <>
      <HeroSection featuredPlaces={homepageMapPlaces} featuredEvents={events} />
      <WeatherStrip />
      <PulseCommandCenter />
      <VibeSelector />
      <AiRecommendations />
      <TrendingSection places={homepagePlaces} />
      <ApplicationFlow />
    </>
  );
}
