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

  const priceHint = "€".repeat(Math.max(1, Math.min(4, place.priceLevel)));

  return (
    <section className="section-band">
      <div className="page-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <article>
          <div className="media-frame aspect-[16/10]">
            {place.images.length > 1 ? (
              <PlaceImageCarousel place={place} />
            ) : (
              <>
                <ResilientPlaceImage
                  place={place}
                  fill
                  imageWidth={1600}
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </>
            )}
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{place.category.name}</Badge>
              {place.business?.verified && <Badge variant="green">Verified by us</Badge>}
              {place.openNow && <Badge variant="outline">Open now</Badge>}
            </div>

            <h1 className="display-2 mt-4">{place.title}</h1>

            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {place.address}, {place.city}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                <span className="text-foreground">{place.rating}</span>
                <span>· {place.reviewCount} reviews</span>
              </span>
              <span>{priceHint}</span>
              <span>About {place.avgStayMinutes} min</span>
              {place.transportation.walkingFriendly && <span>Walkable</span>}
            </div>

            <p className="lede mt-7 max-w-2xl">{place.description}</p>

            {place.vibeTags.length > 0 && (
              <div className="mt-7 border-t border-border pt-5">
                <p className="text-sm font-medium">Good for</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {place.vibeTags.map((vibe) => (
                    <Badge key={vibe} variant="outline">
                      {vibe}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {place.atmosphereTags.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium">What people mention</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {place.atmosphereTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href={googleMapsDirectionsUrl(place.coordinates)} target="_blank" rel="noreferrer">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  Get directions
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={googleMapsSearchUrl(place.coordinates)} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open in Google Maps
                </a>
              </Button>
            </div>
          </div>
        </article>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <GooglePlacesMap
            places={[place]}
            title={place.title}
            subtitle={`${place.address}, ${place.city}`}
            className="min-h-[380px] lg:min-h-[460px]"
            variant="card"
            defaultZoom={14}
            focusZoom={15}
            fitPadding={72}
            defaultSelectedPlaceId={place.id}
          />
        </div>
      </div>
    </section>
  );
}
