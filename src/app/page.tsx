import { ApplicationFlow } from "@/components/home/application-flow";
import { ExploreSection } from "@/components/home/explore-section";
import { HeroSection } from "@/components/home/hero-section";
import { PulseCommandCenter } from "@/components/home/pulse-command-center";
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
      <ApplicationFlow />
      <ExploreSection places={homepagePlaces} />
      <PulseCommandCenter />
    </>
  );
}
