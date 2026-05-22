import { describe, expect, it } from "vitest";

import { places } from "@/data/kosovo-data";
import { buildPreferenceProfile, scorePlaceForProfile } from "@/services/profile-engine";

describe("profile engine", () => {
  it("turns engagement events into recommendation signals", () => {
    const profile = buildPreferenceProfile(
      [
        {
          type: "SAVE",
          placeId: "dita-e-nat",
          city: "Prishtina",
          vibe: "Hidden Gems",
          metadata: { transportPreference: "WALKING" }
        }
      ],
      places
    );
    const dita = places.find((place) => place.slug === "dita-e-nat");

    expect(profile.preferredVibes["Hidden Gems"]).toBeGreaterThan(0);
    expect(profile.mobilityBias.WALKING).toBeGreaterThan(0);
    expect(dita ? scorePlaceForProfile(dita, profile) : 0).toBeGreaterThan(0.4);
  });
});
