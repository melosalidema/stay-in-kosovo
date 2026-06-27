import { ExternalLink, MapPin, Route, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { GooglePlacesMap } from "@/components/maps/google-places-map";
import { PlaceImageCarousel } from "@/components/places/place-image-carousel";
import { ResilientPlaceImage } from "@/components/places/resilient-place-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from "@/lib/geo";
import { getPlaceBySlugOrId } from "@/services/place-service";

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlugOrId(slug);

  if (!place) notFound();

  return (
    <section className="section-band">
      <div className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-glass">
          <div className="relative aspect-[16/8] min-h-72">
            {place.images.length > 1 ? (
              <PlaceImageCarousel place={place} />
            ) : (
              <>
                <ResilientPlaceImage
                  place={place}
                  fill
                  imageWidth={1600}
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              </>
            )}
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="glass">{place.category.name}</Badge>
                {place.business?.verified && <Badge variant="green">Verified business</Badge>}
              </div>
              <h1 className="text-3xl font-black tracking-normal sm:text-5xl">{place.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/78">
                <MapPin className="h-4 w-4" />
                {place.address}, {place.city}
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                <Star className="h-4 w-4 fill-current" />
                {place.rating} · {place.reviewCount} reviews
              </span>
              {place.vibeTags.map((vibe) => (
                <Badge key={vibe} variant="outline">
                  {vibe}
                </Badge>
              ))}
            </div>

            <p className="max-w-3xl text-base leading-7 text-muted-foreground">{place.description}</p>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <a href={googleMapsDirectionsUrl(place.coordinates)} target="_blank" rel="noreferrer">
                  <Route className="h-4 w-4" />
                  Get directions
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={googleMapsSearchUrl(place.coordinates)} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View in Google Maps
                </a>
              </Button>
            </div>
          </div>
        </article>

        <GooglePlacesMap
          places={[place]}
          title="Exact business location"
          subtitle={`${place.coordinates.lat}, ${place.coordinates.lng}`}
          className="min-h-[520px] lg:sticky lg:top-24"
          variant="card"
          defaultZoom={14}
          focusZoom={15}
          fitPadding={72}
          defaultSelectedPlaceId={place.id}
        />
      </div>
    </section>
  );
}
