import { Prisma, PrismaClient, Role, TransportType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

async function main() {
  const password = await bcrypt.hash("Password123!", 12);

  const [tourist, owner, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "tourist@staykosovo.dev" },
      update: {},
      create: {
        name: "Arta Visitor",
        email: "tourist@staykosovo.dev",
        hashedPassword: password,
        role: Role.USER,
        homeCity: "Prishtina",
        preferences: {
          vibes: ["Local Food", "Hidden Gems"],
          budget: 3,
          transport: "WALKING"
        }
      }
    }),
    prisma.user.upsert({
      where: { email: "owner@staykosovo.dev" },
      update: {},
      create: {
        name: "Driton Business",
        email: "owner@staykosovo.dev",
        hashedPassword: password,
        role: Role.BUSINESS_OWNER,
        homeCity: "Prizren"
      }
    }),
    prisma.user.upsert({
      where: { email: "admin@staykosovo.dev" },
      update: {},
      create: {
        name: "Stay Kosovo Admin",
        email: "admin@staykosovo.dev",
        hashedPassword: password,
        role: Role.ADMIN,
        homeCity: "Prishtina"
      }
    })
  ]);

  const categories = await Promise.all(
    [
      ["Restaurants", "restaurants", "FOOD", "Utensils"],
      ["Cafes", "cafes", "FOOD", "Coffee"],
      ["Nightlife", "nightlife", "NIGHTLIFE", "Music"],
      ["Nature", "nature", "NATURE", "Mountain"],
      ["Culture", "culture", "CULTURE", "Landmark"],
      ["Events", "events", "EVENT", "Calendar"],
      ["Parks", "parks", "NATURE", "Trees"],
      ["Hotels", "hotels", "STAY", "Hotel"],
      ["Shopping", "shopping", "SHOPPING", "ShoppingBag"]
    ].map(([name, slug, type, icon]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name, icon },
        create: { name, slug, type: type as never, icon }
      })
    )
  );

  await Promise.all(
    [
      { name: "Chill", slug: "chill", description: "Slow cafes, calm parks, soft views", color: "#14b8a6", weight: 0.88 },
      { name: "Nightlife", slug: "nightlife", description: "Bars, live music, late movement", color: "#ec4899", weight: 1.08 },
      { name: "Romantic", slug: "romantic", description: "Scenic dinners, walks, warm lighting", color: "#f43f5e", weight: 0.92 },
      { name: "Adventure", slug: "adventure", description: "Mountains, routes, high-energy days", color: "#f59e0b", weight: 1.04 },
      { name: "Local Food", slug: "local-food", description: "Traditional kitchens and modern bistros", color: "#22c55e", weight: 1.1 },
      { name: "Hidden Gems", slug: "hidden-gems", description: "Less obvious local favorites", color: "#8b5cf6", weight: 1.12 },
      { name: "Family Friendly", slug: "family-friendly", description: "Easy access, safe spaces, daytime energy", color: "#3b82f6", weight: 0.94 }
    ].map(({ name, slug, description, color, weight }) =>
      prisma.vibe.upsert({
        where: { slug },
        update: { description, color, weight },
        create: { name, slug, description, color, weight }
      })
    )
  );

  const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  const soma = await prisma.business.upsert({
    where: { slug: "soma-book-station" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Soma Book Station",
      slug: "soma-book-station",
      description: "Book-lined bistro, cafe, and evening music spot in central Prishtina.",
      city: "Prishtina",
      address: "Fazli Grajqevci, Prishtina",
      status: "APPROVED",
      verified: true,
      boostScore: 74,
      photos: [image("photo-1517248135467-4c7edcad34c4")],
      schedule: {
        mon: "08:00-23:00",
        fri: "08:00-01:00",
        sat: "09:00-01:00"
      },
      contact: {
        phone: "+38344111222",
        instagram: "@somabookstation"
      },
      analytics: {
        monthlyViews: 18420,
        saves: 1420,
        routeRequests: 812
      }
    }
  });

  const hatch = await prisma.business.upsert({
    where: { slug: "hatch-prizren" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Hatch Prizren",
      slug: "hatch-prizren",
      description: "Creative rooftop food and cocktails near the old city.",
      city: "Prizren",
      address: "Shadervan, Prizren",
      status: "APPROVED",
      verified: true,
      boostScore: 66,
      photos: [image("photo-1552566626-52f8b828add9")],
      schedule: {
        tue: "10:00-00:00",
        sat: "10:00-02:00"
      },
      contact: {
        phone: "+38349123456",
        instagram: "@hatchprizren"
      },
      analytics: {
        monthlyViews: 9210,
        saves: 708,
        routeRequests: 402
      }
    }
  });

  const ditaNat = await prisma.business.upsert({
    where: { slug: "dita-e-nat" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Dit' e Nat'",
      slug: "dita-e-nat",
      description: "Cafe-bookshop with vegetarian plates, music nights, and a creative local crowd in Prishtina.",
      city: "Prishtina",
      address: "Fazli Grajqevci, Prishtina",
      status: "APPROVED",
      verified: true,
      boostScore: 58,
      photos: [image("photo-1495474472287-4d71bcdd2085")],
      schedule: {
        mon: "08:00-23:00",
        fri: "08:00-00:00",
        sat: "09:00-00:00"
      },
      contact: {
        phone: "+38344111999",
        instagram: "@ditenat"
      },
      analytics: {
        monthlyViews: 12180,
        saves: 968,
        routeRequests: 504
      }
    }
  });

  const places = [
    {
      slug: "germia-park",
      title: "Germia Park",
      city: "Prishtina",
      address: "Germia, Prishtina",
      categorySlug: "parks",
      description: "Forest trails, swimming pools, cycling paths, and one of Prishtina's easiest nature escapes.",
      latitude: 42.6762,
      longitude: 21.2041,
      priceLevel: 1,
      rating: 4.8,
      reviewCount: 489,
      avgStayMinutes: 120,
      vibeTags: ["Chill", "Adventure", "Family Friendly"],
      atmosphereTags: ["green", "fresh air", "morning walks"],
      crowdLevel: "Balanced",
      musicVibe: "Nature",
      popularityScore: 91,
      hiddenGemScore: 48,
      images: [image("photo-1500534314209-a25ddb2bd429"), image("photo-1441974231531-c6227db76b6e")]
    },
    {
      slug: "soma-book-station",
      businessSlug: "soma-book-station",
      title: "Soma Book Station",
      city: "Prishtina",
      address: "Fazli Grajqevci, Prishtina",
      categorySlug: "cafes",
      description: "A layered cafe, bistro, library, and evening hangout for people who want culture with their coffee.",
      latitude: 42.6636,
      longitude: 21.1592,
      priceLevel: 3,
      rating: 4.7,
      reviewCount: 372,
      avgStayMinutes: 95,
      vibeTags: ["Chill", "Local Food", "Hidden Gems", "Nightlife"],
      atmosphereTags: ["books", "warm", "creative"],
      crowdLevel: "Lively",
      musicVibe: "Indie jazz",
      popularityScore: 88,
      hiddenGemScore: 62,
      images: [image("photo-1517248135467-4c7edcad34c4"), image("photo-1504674900247-0877df9cc836")]
    },
    {
      slug: "liburnia-restaurant",
      title: "Liburnia Restaurant",
      city: "Prishtina",
      address: "Metush Krasniqi, Prishtina",
      categorySlug: "restaurants",
      description: "Traditional Kosovo food in a garden-like setting, known for flija, grilled dishes, and slow dinners.",
      latitude: 42.6659,
      longitude: 21.1627,
      priceLevel: 3,
      rating: 4.6,
      reviewCount: 521,
      avgStayMinutes: 110,
      vibeTags: ["Local Food", "Romantic", "Family Friendly"],
      atmosphereTags: ["traditional", "garden", "slow dining"],
      crowdLevel: "Cozy",
      musicVibe: "Acoustic",
      popularityScore: 84,
      hiddenGemScore: 52,
      images: [image("photo-1555396273-367ea4eb4db5"), image("photo-1414235077428-338989a2e8c0")]
    },
    {
      slug: "newborn-monument",
      title: "NEWBORN Monument",
      city: "Prishtina",
      address: "Luan Haradinaj, Prishtina",
      categorySlug: "culture",
      description: "The iconic independence monument and a practical starting point for a city walk.",
      latitude: 42.6613,
      longitude: 21.1577,
      priceLevel: 1,
      rating: 4.4,
      reviewCount: 683,
      avgStayMinutes: 35,
      vibeTags: ["Culture", "Family Friendly", "Hidden Gems"],
      atmosphereTags: ["urban", "symbolic", "photo stop"],
      crowdLevel: "Busy",
      musicVibe: "Street",
      popularityScore: 93,
      hiddenGemScore: 34,
      images: [image("photo-1500530855697-b586d89ba3ee")]
    },
    {
      slug: "prizren-fortress",
      title: "Prizren Fortress",
      city: "Prizren",
      address: "Kalaja, Prizren",
      categorySlug: "culture",
      description: "Historic fortress above Prizren with a sunset view over the old town, river, and minarets.",
      latitude: 42.2081,
      longitude: 20.7425,
      priceLevel: 1,
      rating: 4.9,
      reviewCount: 812,
      avgStayMinutes: 100,
      vibeTags: ["Adventure", "Romantic", "Culture"],
      atmosphereTags: ["sunset", "historic", "panoramic"],
      crowdLevel: "Balanced",
      musicVibe: "Ambient",
      popularityScore: 96,
      hiddenGemScore: 45,
      images: [image("photo-1501785888041-af3ef285b470"), image("photo-1470770841072-f978cf4d019e")]
    },
    {
      slug: "hatch-prizren-rooftop",
      businessSlug: "hatch-prizren",
      title: "Hatch Prizren Rooftop",
      city: "Prizren",
      address: "Shadervan, Prizren",
      categorySlug: "nightlife",
      description: "A social rooftop with cocktails, comfort food, and late-night energy close to the old bridge.",
      latitude: 42.2102,
      longitude: 20.7399,
      priceLevel: 3,
      rating: 4.5,
      reviewCount: 186,
      avgStayMinutes: 130,
      vibeTags: ["Nightlife", "Romantic", "Local Food"],
      atmosphereTags: ["rooftop", "social", "warm lights"],
      crowdLevel: "Lively",
      musicVibe: "Deep house",
      popularityScore: 78,
      hiddenGemScore: 64,
      images: [image("photo-1514933651103-005eec06c04b"), image("photo-1528605248644-14dd04022da1")]
    },
    {
      slug: "rugova-canyon",
      title: "Rugova Canyon",
      city: "Peja",
      address: "Rugova Valley, Peja",
      categorySlug: "nature",
      description: "Dramatic canyon routes, climbing, zipline stops, and mountain air near Peja.",
      latitude: 42.6901,
      longitude: 20.1783,
      priceLevel: 2,
      rating: 4.9,
      reviewCount: 932,
      avgStayMinutes: 240,
      vibeTags: ["Adventure", "Hidden Gems", "Family Friendly"],
      atmosphereTags: ["canyon", "mountain", "active"],
      crowdLevel: "Seasonal",
      musicVibe: "Nature",
      popularityScore: 90,
      hiddenGemScore: 74,
      images: [image("photo-1464822759023-fed622ff2c3b"), image("photo-1447752875215-b2761acb3c5d")]
    },
    {
      slug: "brezovica-resort",
      title: "Brezovica Mountain Resort",
      city: "Brezovica",
      address: "Sharr Mountains, Brezovica",
      categorySlug: "nature",
      description: "Ski slopes, mountain cabins, hiking starts, and one of Kosovo's strongest winter adventure bases.",
      latitude: 42.2208,
      longitude: 21.0075,
      priceLevel: 3,
      rating: 4.6,
      reviewCount: 604,
      avgStayMinutes: 300,
      vibeTags: ["Adventure", "Romantic", "Family Friendly"],
      atmosphereTags: ["snow", "cabins", "views"],
      crowdLevel: "Seasonal",
      musicVibe: "Lodge",
      popularityScore: 82,
      hiddenGemScore: 68,
      images: [image("photo-1483728642387-6c3bdd6c93e5"), image("photo-1498855926480-d98e83099315")]
    },
    {
      slug: "mirusha-waterfalls",
      title: "Mirusha Waterfalls",
      city: "Gjakova",
      address: "Mirusha Park Trailhead",
      categorySlug: "nature",
      description: "Layered waterfall pools and canyon paths for a compact nature trip between Gjakova and Prishtina.",
      latitude: 42.5242,
      longitude: 20.6089,
      priceLevel: 2,
      rating: 4.8,
      reviewCount: 544,
      avgStayMinutes: 180,
      vibeTags: ["Adventure", "Hidden Gems", "Family Friendly"],
      atmosphereTags: ["waterfalls", "canyon", "day trip"],
      crowdLevel: "Seasonal",
      musicVibe: "Nature",
      popularityScore: 87,
      hiddenGemScore: 82,
      images: [image("photo-1500534314209-a25ddb2bd429"), image("photo-1501785888041-af3ef285b470")]
    },
    {
      slug: "gjakova-old-bazaar",
      title: "Gjakova Old Bazaar",
      city: "Gjakova",
      address: "Grand Bazaar, Gjakova",
      categorySlug: "culture",
      description: "Craft shops, coffee courtyards, slow meals, and a strong local culture signal in the old market.",
      latitude: 42.3801,
      longitude: 20.4277,
      priceLevel: 2,
      rating: 4.7,
      reviewCount: 398,
      avgStayMinutes: 140,
      vibeTags: ["Chill", "Local Food", "Culture", "Hidden Gems"],
      atmosphereTags: ["craft", "heritage", "courtyards"],
      crowdLevel: "Balanced",
      musicVibe: "Acoustic",
      popularityScore: 79,
      hiddenGemScore: 76,
      images: [image("photo-1523906834658-6e24ef2386f9"), image("photo-1517248135467-4c7edcad34c4")]
    },
    {
      slug: "dita-e-nat",
      businessSlug: "dita-e-nat",
      title: "Dit' e Nat'",
      city: "Prishtina",
      address: "Fazli Grajqevci, Prishtina",
      categorySlug: "cafes",
      description: "A central Prishtina cafe-bookshop with vegetarian plates, music nights, and a creative local crowd.",
      latitude: 42.6641,
      longitude: 21.1588,
      priceLevel: 2,
      rating: 4.6,
      reviewCount: 441,
      avgStayMinutes: 90,
      vibeTags: ["Chill", "Local Food", "Hidden Gems"],
      atmosphereTags: ["books", "vegetarian", "creative"],
      crowdLevel: "Lively",
      musicVibe: "Indie",
      popularityScore: 83,
      hiddenGemScore: 69,
      images: [image("photo-1495474472287-4d71bcdd2085"), image("photo-1509042239860-f550ce710b93")]
    },
    {
      slug: "peja-old-bazaar",
      title: "Peja Old Bazaar",
      city: "Peja",
      address: "Old Bazaar, Peja",
      categorySlug: "culture",
      description: "Coffee, traditional shops, and an easy cultural base before heading toward Rugova.",
      latitude: 42.6596,
      longitude: 20.2889,
      priceLevel: 2,
      rating: 4.5,
      reviewCount: 277,
      avgStayMinutes: 95,
      vibeTags: ["Chill", "Culture", "Local Food"],
      atmosphereTags: ["market", "coffee", "heritage"],
      crowdLevel: "Balanced",
      musicVibe: "Street",
      popularityScore: 74,
      hiddenGemScore: 63,
      images: [image("photo-1523906834658-6e24ef2386f9"), image("photo-1555396273-367ea4eb4db5")]
    },
    {
      slug: "sunny-hill-festival-grounds",
      title: "Sunny Hill Festival Grounds",
      city: "Prishtina",
      address: "Berni Park, Prishtina",
      categorySlug: "events",
      description: "Seasonal open-air music energy, pop culture, food stands, and high-demand taxi routing.",
      latitude: 42.6424,
      longitude: 21.1272,
      priceLevel: 4,
      rating: 4.4,
      reviewCount: 712,
      avgStayMinutes: 240,
      vibeTags: ["Nightlife", "Adventure"],
      atmosphereTags: ["festival", "music", "outdoor"],
      crowdLevel: "Busy",
      musicVibe: "Pop and electronic",
      popularityScore: 94,
      hiddenGemScore: 31,
      images: [image("photo-1492684223066-81342ee5ff30"), image("photo-1501386761578-eac5c94b800a")]
    },
    {
      slug: "pogragja-fortress",
      title: "Pogragja Fortress",
      city: "Gjilan",
      address: "Pogragje, Gjilan",
      categorySlug: "culture",
      description: "Sixth-century hill fortress near Pogragje, with ruined walls and views over the Morava e Binces valley southeast of Gjilan.",
      latitude: 42.42694,
      longitude: 21.55389,
      priceLevel: 1,
      rating: 4.6,
      reviewCount: 94,
      avgStayMinutes: 80,
      vibeTags: ["Culture", "Adventure", "Hidden Gems"],
      atmosphereTags: ["fortress", "heritage", "viewpoint"],
      crowdLevel: "Calm",
      musicVibe: "Ambient",
      popularityScore: 73,
      hiddenGemScore: 82,
      images: ["https://upload.wikimedia.org/wikipedia/commons/3/38/Kalaja_e_Pogragj%C3%ABs.JPG"]
    },
    {
      slug: "draganac-monastery",
      title: "Draganac Monastery",
      city: "Gjilan",
      address: "Draganac, Gjilan",
      categorySlug: "culture",
      description: "Serbian Orthodox monastery dedicated to the Holy Archangels, set in quiet countryside north of Gjilan.",
      latitude: 42.54597,
      longitude: 21.45944,
      priceLevel: 1,
      rating: 4.7,
      reviewCount: 128,
      avgStayMinutes: 70,
      vibeTags: ["Culture", "Chill", "Hidden Gems"],
      atmosphereTags: ["monastery", "pilgrimage", "rural"],
      crowdLevel: "Calm",
      musicVibe: "Quiet",
      popularityScore: 70,
      hiddenGemScore: 79,
      images: ["https://upload.wikimedia.org/wikipedia/commons/3/35/Manastir_draganac.jpg"]
    },
    {
      slug: "livoq-lake",
      title: "Livoq Lake",
      city: "Gjilan",
      address: "Livoq i Eperm, Gjilan",
      categorySlug: "nature",
      description: "Small artificial lake west of Gjilan, bordered by the Gollak hills and used for quiet nature stops.",
      latitude: 42.4644,
      longitude: 21.4158,
      priceLevel: 1,
      rating: 4.5,
      reviewCount: 76,
      avgStayMinutes: 90,
      vibeTags: ["Chill", "Family Friendly", "Hidden Gems"],
      atmosphereTags: ["lake", "picnic", "hills"],
      crowdLevel: "Calm",
      musicVibe: "Nature",
      popularityScore: 66,
      hiddenGemScore: 84,
      images: ["https://upload.wikimedia.org/wikipedia/commons/e/e5/Liqeni_i_Livoqit_-_Gjilan_%28Xhemail_Shabani%29.jpg"]
    },
    {
      slug: "great-mosque-orthodox-church-ferizaj",
      title: "Great Mosque and Orthodox Church Courtyard",
      city: "Ferizaj",
      address: "Latif Hasani, Ferizaj",
      categorySlug: "culture",
      description: "Ferizaj city-center landmark where the Great Mosque and the Church of the Holy Emperor Uros share the same courtyard.",
      latitude: 42.37042,
      longitude: 21.15042,
      priceLevel: 1,
      rating: 4.6,
      reviewCount: 211,
      avgStayMinutes: 45,
      vibeTags: ["Culture", "Family Friendly", "Hidden Gems"],
      atmosphereTags: ["religious sites", "city center", "architecture"],
      crowdLevel: "Balanced",
      musicVibe: "Street",
      popularityScore: 82,
      hiddenGemScore: 57,
      images: ["https://upload.wikimedia.org/wikipedia/commons/b/bc/Ferizaj_Church_and_Mosque.JPG"]
    },
    {
      slug: "nerodime-river-bifurcation",
      title: "Nerodime River Bifurcation",
      city: "Ferizaj",
      address: "Nerodime, Ferizaj",
      categorySlug: "nature",
      description: "Protected river bifurcation near Ferizaj where the Nerodime splits toward two different sea basins.",
      latitude: 42.37167,
      longitude: 21.13306,
      priceLevel: 1,
      rating: 4.5,
      reviewCount: 103,
      avgStayMinutes: 65,
      vibeTags: ["Adventure", "Family Friendly", "Hidden Gems"],
      atmosphereTags: ["river", "nature reserve", "geography"],
      crowdLevel: "Calm",
      musicVibe: "Nature",
      popularityScore: 72,
      hiddenGemScore: 86,
      images: ["https://upload.wikimedia.org/wikipedia/commons/b/b8/Nerodime_bifurcation.jpg"]
    },
    {
      slug: "batllava-lake",
      title: "Batllava Lake",
      city: "Podujeva",
      address: "Batllava, Podujeva",
      categorySlug: "nature",
      description: "Large northeastern Kosovo lake near Podujeva and Orllan, popular for summer swimming, views, and lakeside meals.",
      latitude: 42.82111,
      longitude: 21.30778,
      priceLevel: 1,
      rating: 4.7,
      reviewCount: 286,
      avgStayMinutes: 160,
      vibeTags: ["Chill", "Family Friendly", "Romantic"],
      atmosphereTags: ["lake", "summer", "waterfront"],
      crowdLevel: "Seasonal",
      musicVibe: "Nature",
      popularityScore: 84,
      hiddenGemScore: 65,
      images: ["https://upload.wikimedia.org/wikipedia/commons/4/43/Liqeni_i_Batllaves_2.jpg"]
    },
    {
      slug: "zahir-pajaziti-memorial-complex",
      title: "Zahir Pajaziti Memorial Complex",
      city: "Podujeva",
      address: "Orllan, Podujeva",
      categorySlug: "culture",
      description: "Memorial complex in Orllan honoring Zahir Pajaziti, with monuments, museum elements, and civic gathering space.",
      latitude: 42.83591,
      longitude: 21.33638,
      priceLevel: 1,
      rating: 4.8,
      reviewCount: 112,
      avgStayMinutes: 60,
      vibeTags: ["Culture", "Family Friendly", "Hidden Gems"],
      atmosphereTags: ["memorial", "modern history", "heritage"],
      crowdLevel: "Calm",
      musicVibe: "Quiet",
      popularityScore: 76,
      hiddenGemScore: 73,
      images: [
        "https://static.wixstatic.com/media/d77597_04c0684753104225aac78374d21b534d~mv2.jpg/v1/fill/w_800,h_800,al_c,q_85/Zahir%20Pajaziti%20Memorial%20Complex%20%284%29.jpg"
      ]
    },
    {
      slug: "ibar-bridge-mitrovica",
      title: "Ibar Bridge",
      city: "Mitrovica",
      address: "Ura e Ibrit, Mitrovica",
      categorySlug: "culture",
      description: "Mitrovica's central bridge over the Ibar River, a major urban landmark and symbol of the divided city.",
      latitude: 42.8909,
      longitude: 20.8651,
      priceLevel: 1,
      rating: 4.4,
      reviewCount: 197,
      avgStayMinutes: 35,
      vibeTags: ["Culture", "Hidden Gems"],
      atmosphereTags: ["bridge", "river", "urban history"],
      crowdLevel: "Balanced",
      musicVibe: "Street",
      popularityScore: 81,
      hiddenGemScore: 49,
      images: [
        "https://upload.wikimedia.org/wikipedia/commons/7/7e/Panorama_of_Ibar_River_Bridge_-_Looking_toward_Serb_Side_of_Town_-_Mitrovica_-_Kosovo.jpg"
      ]
    },
    {
      slug: "miners-monument-mitrovica",
      title: "Miners' Monument",
      city: "Mitrovica",
      address: "Miners' Hill, Mitrovica",
      categorySlug: "culture",
      description: "Brutalist hilltop memorial honoring Albanian and Serbian partisan miners from World War II.",
      latitude: 42.89578,
      longitude: 20.86021,
      priceLevel: 1,
      rating: 4.5,
      reviewCount: 166,
      avgStayMinutes: 55,
      vibeTags: ["Culture", "Adventure", "Hidden Gems"],
      atmosphereTags: ["monument", "brutalist", "viewpoint"],
      crowdLevel: "Calm",
      musicVibe: "Ambient",
      popularityScore: 78,
      hiddenGemScore: 72,
      images: ["https://upload.wikimedia.org/wikipedia/commons/e/ee/Kosovska_Mitrovica_monument.jpg"]
    },
    {
      slug: "kacanik-gorge",
      title: "Kacanik Gorge",
      city: "Kacanik",
      address: "Kacanik Gorge, Kacanik",
      categorySlug: "nature",
      description: "Southern Kosovo gorge carved by the Lepenac River between Kacanik and the North Macedonia border.",
      latitude: 42.188,
      longitude: 21.268,
      priceLevel: 1,
      rating: 4.7,
      reviewCount: 142,
      avgStayMinutes: 90,
      vibeTags: ["Adventure", "Romantic", "Hidden Gems"],
      atmosphereTags: ["gorge", "river", "mountains"],
      crowdLevel: "Calm",
      musicVibe: "Nature",
      popularityScore: 74,
      hiddenGemScore: 85,
      images: ["https://upload.wikimedia.org/wikipedia/commons/2/2a/Kaqanik_from_Rakoci_Gorge.jpg"]
    },
    {
      slug: "kacanik-fortress",
      title: "Kacanik Fortress",
      city: "Kacanik",
      address: "Kalaja e Kacanikut, Kacanik",
      categorySlug: "culture",
      description: "Ottoman-era fortress above Kacanik, guarding the strategic route through the gorge toward Skopje.",
      latitude: 42.22812,
      longitude: 21.25584,
      priceLevel: 1,
      rating: 4.5,
      reviewCount: 88,
      avgStayMinutes: 60,
      vibeTags: ["Culture", "Adventure", "Hidden Gems"],
      atmosphereTags: ["fortress", "ottoman", "viewpoint"],
      crowdLevel: "Calm",
      musicVibe: "Ambient",
      popularityScore: 69,
      hiddenGemScore: 82,
      images: ["https://upload.wikimedia.org/wikipedia/commons/d/db/Kalaja_ne_Kacanik.jpg"]
    },
    {
      slug: "koca-sinan-pasha-mosque-kacanik",
      title: "Koca Sinan Pasha Mosque",
      city: "Kacanik",
      address: "Koca Sinan Pasha Mosque, Kacanik",
      categorySlug: "culture",
      description: "Sixteenth-century Ottoman mosque in Kacanik, associated with grand vizier Koca Sinan Pasha.",
      latitude: 42.22772,
      longitude: 21.25745,
      priceLevel: 1,
      rating: 4.6,
      reviewCount: 71,
      avgStayMinutes: 35,
      vibeTags: ["Culture", "Chill", "Hidden Gems"],
      atmosphereTags: ["mosque", "ottoman", "old town"],
      crowdLevel: "Calm",
      musicVibe: "Quiet",
      popularityScore: 68,
      hiddenGemScore: 78,
      images: ["https://upload.wikimedia.org/wikipedia/commons/3/35/Kacanik%2C_Koca_Sinan_Pasha_mosque_%281969%29.jpg"]
    }
  ];

  const businessBySlug: Record<string, { id: string }> = {
    "soma-book-station": soma,
    "hatch-prizren": hatch,
    "dita-e-nat": ditaNat
  };

  const createdPlaces = [];
  for (const place of places) {
    const created = await prisma.place.upsert({
      where: { slug: place.slug },
      update: {
        rating: place.rating,
        reviewCount: place.reviewCount,
        popularityScore: place.popularityScore,
        hiddenGemScore: place.hiddenGemScore
      },
      create: {
        title: place.title,
        slug: place.slug,
        description: place.description,
        city: place.city,
        address: place.address,
        categoryId: categoryBySlug[place.categorySlug].id,
        businessId: place.businessSlug ? businessBySlug[place.businessSlug].id : undefined,
        latitude: new Prisma.Decimal(place.latitude),
        longitude: new Prisma.Decimal(place.longitude),
        priceLevel: place.priceLevel,
        rating: place.rating,
        reviewCount: place.reviewCount,
        avgStayMinutes: place.avgStayMinutes,
        vibeTags: place.vibeTags,
        atmosphereTags: place.atmosphereTags,
        crowdLevel: place.crowdLevel,
        musicVibe: place.musicVibe,
        popularityScore: place.popularityScore,
        hiddenGemScore: place.hiddenGemScore,
        images: place.images,
        transportation: {
          walkingFriendly: place.city !== "Brezovica",
          taxiMinutes: place.city === "Prishtina" ? 8 : 15,
          busAvailable: place.city !== "Brezovica",
          parking: place.priceLevel > 2 ? "limited" : "easy"
        },
        accessibility: {
          familyFriendly: place.vibeTags.includes("Family Friendly"),
          wheelchairNotes: place.categorySlug === "nature" ? "Partial routes only" : "Street-level access nearby"
        }
      }
    });
    createdPlaces.push(created);
  }

  const now = new Date();
  const eventCategory = categoryBySlug.events;
  const cultureCategory = categoryBySlug.culture;
  await Promise.all([
    prisma.event.upsert({
      where: { id: "event-soma-jazz" },
      update: {},
      create: {
        id: "event-soma-jazz",
        businessId: soma.id,
        placeId: createdPlaces.find((place) => place.slug === "soma-book-station")?.id,
        categoryId: eventCategory.id,
        title: "Indie Jazz Night at Soma",
        description: "A small-stage evening for travelers who want a local social atmosphere.",
        startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 30),
        endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 34),
        city: "Prishtina",
        price: new Prisma.Decimal(8),
        vibeTags: ["Nightlife", "Chill", "Hidden Gems"],
        heatScore: 86,
        images: [image("photo-1511192336575-5a79af67a629")]
      }
    }),
    prisma.event.upsert({
      where: { id: "event-prizren-sunset" },
      update: {},
      create: {
        id: "event-prizren-sunset",
        placeId: createdPlaces.find((place) => place.slug === "prizren-fortress")?.id,
        categoryId: cultureCategory.id,
        title: "Sunset Story Walk",
        description: "Guided walk from Shadervan to the fortress with local stories and photo stops.",
        startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 52),
        endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 55),
        city: "Prizren",
        price: new Prisma.Decimal(12),
        vibeTags: ["Romantic", "Culture", "Adventure"],
        heatScore: 79,
        images: [image("photo-1500530855697-b586d89ba3ee")]
      }
    }),
    prisma.event.upsert({
      where: { id: "event-gjakova-craft-night" },
      update: {},
      create: {
        id: "event-gjakova-craft-night",
        placeId: createdPlaces.find((place) => place.slug === "gjakova-old-bazaar")?.id,
        categoryId: cultureCategory.id,
        title: "Gjakova Bazaar Craft Night",
        description: "Open ateliers, courtyard coffee, and traditional music in the old bazaar.",
        startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 44),
        endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 48),
        city: "Gjakova",
        price: new Prisma.Decimal(6),
        vibeTags: ["Culture", "Local Food", "Hidden Gems"],
        heatScore: 72,
        images: [image("photo-1523906834658-6e24ef2386f9")]
      }
    }),
    prisma.event.upsert({
      where: { id: "event-rugova-sunrise" },
      update: {},
      create: {
        id: "event-rugova-sunrise",
        placeId: createdPlaces.find((place) => place.slug === "rugova-canyon")?.id,
        categoryId: eventCategory.id,
        title: "Rugova Sunrise Hike",
        description: "Early guided route for travelers who want mountain air before lunch in Peja.",
        startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 20),
        endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 26),
        city: "Peja",
        price: new Prisma.Decimal(18),
        vibeTags: ["Adventure", "Hidden Gems", "Family Friendly"],
        heatScore: 81,
        images: [image("photo-1464822759023-fed622ff2c3b")]
      }
    })
  ]);

  const reviewPlace = createdPlaces.find((place) => place.slug === "soma-book-station");
  if (reviewPlace) {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: tourist.id,
        placeId: reviewPlace.id,
        comment: { startsWith: "Feels like a real local living room" }
      }
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          userId: tourist.id,
          placeId: reviewPlace.id,
          rating: 5,
          comment: "Feels like a real local living room: books, warm food, and people moving between coffee and music.",
          atmosphereTags: ["creative", "warm", "local"],
          crowdLevel: "Lively",
          musicVibe: "Indie jazz",
          localPopularity: "High"
        }
      });
    }
  }

  await Promise.all(
    [
      ["bus-prishtina-center", TransportType.BUS, "Prishtina Center Bus Stop", "Prishtina", 42.6626, 21.1653, 82],
      ["taxi-newborn", TransportType.TAXI, "NEWBORN Taxi Stand", "Prishtina", 42.6614, 21.1576, 88],
      ["bus-prizren-shadervan", TransportType.BUS, "Shadervan Minibus Stop", "Prizren", 42.2097, 20.7394, 74],
      ["taxi-peja-rugova", TransportType.TAXI, "Peja Rugova Taxi Point", "Peja", 42.6591, 20.2883, 71],
      ["bus-gjakova-bazaar", TransportType.BUS, "Gjakova Bazaar Bus Loop", "Gjakova", 42.3805, 20.429, 76],
      ["taxi-mirusha-trail", TransportType.TAXI, "Mirusha Trail Taxi Dispatch", "Gjakova", 42.5231, 20.6095, 69],
      ["bus-brezovica-base", TransportType.BUS, "Brezovica Seasonal Shuttle", "Brezovica", 42.2212, 21.0068, 61]
    ].map(([id, type, name, city, lat, lng, reliabilityScore]) =>
      prisma.transportationPoint.upsert({
        where: { id: id as string },
        update: {},
        create: {
          id: id as string,
          type: type as TransportType,
          name: name as string,
          city: city as string,
          latitude: new Prisma.Decimal(lat as number),
          longitude: new Prisma.Decimal(lng as number),
          reliabilityScore: reliabilityScore as number,
          schedule: {
            frequencyMinutes: type === TransportType.BUS ? 18 : 6,
            live: false
          }
        }
      })
    )
  );

  await Promise.all(
    [
      ["local-food-scout", "Local Food Scout", "Saved and reviewed three food places", "Utensils"],
      ["hidden-gem-finder", "Hidden Gem Finder", "Visited two places below the mainstream popularity curve", "Sparkles"],
      ["route-master", "Route Master", "Requested smart mobility routes across two cities", "Route"]
    ].map(([slug, name, description, icon]) =>
      prisma.badge.upsert({
        where: { slug },
        update: {},
        create: { slug, name, description, icon }
      })
    )
  );

  console.log(`Seeded Stay in Kosovo data for ${tourist.email}, ${owner.email}, and ${admin.email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
