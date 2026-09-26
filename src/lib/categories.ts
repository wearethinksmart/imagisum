export interface Category {
    slug: string;
    name: string;
    /** What we actually send to Unsplash — often broader than the display name. */
    query: string;
    description: string;
    /** Accent gradient for the category. */
    gradient: string;
}

export const categories: Category[] = [
    {
        slug: "nature",
        name: "Nature",
        query: "nature landscape",
        description: "Forests, mountains, coastlines and everything wild in between.",
        gradient: "from-emerald-500 to-teal-700"
    },
    {
        slug: "business",
        name: "Business",
        query: "business office work",
        description: "Offices, meetings and the quiet choreography of modern work.",
        gradient: "from-slate-500 to-slate-800"
    },
    {
        slug: "technology",
        name: "Technology",
        query: "technology computer code",
        description: "Screens, circuitry and the machines running everything.",
        gradient: "from-sky-500 to-indigo-700"
    },
    {
        slug: "people",
        name: "People",
        query: "people portrait",
        description: "Portraits and candid moments with real human texture.",
        gradient: "from-rose-400 to-fuchsia-700"
    },
    {
        slug: "travel",
        name: "Travel",
        query: "travel destination",
        description: "Places worth the flight, from street corners to summits.",
        gradient: "from-amber-400 to-orange-600"
    },
    {
        slug: "food",
        name: "Food",
        query: "food cooking",
        description: "Plated, poured and photographed at exactly the right moment.",
        gradient: "from-orange-400 to-red-600"
    },
    {
        slug: "animals",
        name: "Animals",
        query: "animals wildlife",
        description: "Wildlife, pets and everything with fur, feathers or fins.",
        gradient: "from-lime-500 to-emerald-700"
    },
    {
        slug: "architecture",
        name: "Architecture",
        query: "architecture building",
        description: "Facades, interiors and geometry that holds a city up.",
        gradient: "from-zinc-400 to-zinc-700"
    },
    {
        slug: "abstract",
        name: "Abstract",
        query: "abstract texture pattern",
        description: "Shape, colour and texture with nothing to explain.",
        gradient: "from-violet-500 to-purple-800"
    },
    {
        slug: "backgrounds",
        name: "Backgrounds",
        query: "background wallpaper minimal",
        description: "Clean surfaces built to sit behind your content.",
        gradient: "from-cyan-400 to-blue-700"
    },
    {
        slug: "fashion",
        name: "Fashion",
        query: "fashion style model",
        description: "Editorial styling, streetwear and studio lighting.",
        gradient: "from-pink-400 to-rose-700"
    },
    {
        slug: "sports",
        name: "Sports",
        query: "sports fitness athlete",
        description: "Motion, effort and the split second before the finish.",
        gradient: "from-red-500 to-rose-800"
    },
    {
        slug: "cars",
        name: "Cars",
        query: "car automotive",
        description: "Classics, concepts and chrome under good light.",
        gradient: "from-neutral-500 to-neutral-800"
    },
    {
        slug: "space",
        name: "Space",
        query: "space galaxy astronomy",
        description: "Stars, nebulae and the very large dark around them.",
        gradient: "from-indigo-600 to-slate-900"
    },
    {
        slug: "ocean",
        name: "Ocean",
        query: "ocean sea underwater",
        description: "Waves, reefs and the blue that covers most of the planet.",
        gradient: "from-cyan-500 to-blue-800"
    },
    {
        slug: "city",
        name: "City",
        query: "city urban street",
        description: "Skylines, side streets and neon after dark.",
        gradient: "from-slate-600 to-gray-900"
    },
    {
        slug: "flowers",
        name: "Flowers",
        query: "flowers botanical",
        description: "Blooms, petals and botanical close-ups.",
        gradient: "from-pink-400 to-fuchsia-700"
    },
    {
        slug: "minimal",
        name: "Minimal",
        query: "minimal simple clean",
        description: "Negative space doing most of the work.",
        gradient: "from-stone-300 to-stone-600"
    }
];

export const categoryMap = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
    return categoryMap.get(slug.toLowerCase());
}

/** Shown as quick-search chips under the hero and in the empty search state. */
export const popularSearches = [
    "wallpaper",
    "nature",
    "office",
    "coffee",
    "city",
    "texture",
    "sunset",
    "portrait",
    "food",
    "abstract"
];
