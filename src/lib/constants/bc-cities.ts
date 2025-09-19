export interface BCCity {
  value: string;
  label: string;
  placeId: string;
  region: string;
}

export const BC_CITIES: BCCity[] = [
  // Metro Vancouver
  {
    value: "vancouver",
    label: "Vancouver",
    placeId: "vancouver",
    region: "Metro Vancouver",
  },
  {
    value: "surrey",
    label: "Surrey",
    placeId: "surrey",
    region: "Metro Vancouver",
  },
  {
    value: "burnaby",
    label: "Burnaby",
    placeId: "burnaby",
    region: "Metro Vancouver",
  },
  {
    value: "richmond",
    label: "Richmond",
    placeId: "richmond",
    region: "Metro Vancouver",
  },
  {
    value: "coquitlam",
    label: "Coquitlam",
    placeId: "coquitlam",
    region: "Metro Vancouver",
  },
  {
    value: "langley",
    label: "Langley",
    placeId: "langley",
    region: "Metro Vancouver",
  },
  {
    value: "delta",
    label: "Delta",
    placeId: "delta",
    region: "Metro Vancouver",
  },
  {
    value: "new-westminster",
    label: "New Westminster",
    placeId: "new-westminster",
    region: "Metro Vancouver",
  },
  {
    value: "maple-ridge",
    label: "Maple Ridge",
    placeId: "maple-ridge",
    region: "Metro Vancouver",
  },
  {
    value: "white-rock",
    label: "White Rock",
    placeId: "white-rock",
    region: "Metro Vancouver",
  },
  {
    value: "port-coquitlam",
    label: "Port Coquitlam",
    placeId: "port-coquitlam",
    region: "Metro Vancouver",
  },
  {
    value: "north-vancouver",
    label: "North Vancouver",
    placeId: "north-vancouver",
    region: "Metro Vancouver",
  },
  {
    value: "west-vancouver",
    label: "West Vancouver",
    placeId: "west-vancouver",
    region: "Metro Vancouver",
  },
  {
    value: "port-moody",
    label: "Port Moody",
    placeId: "port-moody",
    region: "Metro Vancouver",
  },
  {
    value: "pitt-meadows",
    label: "Pitt Meadows",
    placeId: "pitt-meadows",
    region: "Metro Vancouver",
  },

  // Vancouver Island
  {
    value: "victoria",
    label: "Victoria",
    placeId: "victoria",
    region: "Vancouver Island",
  },
  {
    value: "nanaimo",
    label: "Nanaimo",
    placeId: "nanaimo",
    region: "Vancouver Island",
  },
  {
    value: "campbell-river",
    label: "Campbell River",
    placeId: "campbell-river",
    region: "Vancouver Island",
  },
  {
    value: "courtenay",
    label: "Courtenay",
    placeId: "courtenay",
    region: "Vancouver Island",
  },
  {
    value: "comox",
    label: "Comox",
    placeId: "comox",
    region: "Vancouver Island",
  },
  {
    value: "duncan",
    label: "Duncan",
    placeId: "duncan",
    region: "Vancouver Island",
  },
  {
    value: "ladysmith",
    label: "Ladysmith",
    placeId: "ladysmith",
    region: "Vancouver Island",
  },
  {
    value: "parksville",
    label: "Parksville",
    placeId: "parksville",
    region: "Vancouver Island",
  },
  {
    value: "qualicum-beach",
    label: "Qualicum Beach",
    placeId: "qualicum-beach",
    region: "Vancouver Island",
  },
  {
    value: "port-alberni",
    label: "Port Alberni",
    placeId: "port-alberni",
    region: "Vancouver Island",
  },
  {
    value: "saanich",
    label: "Saanich",
    placeId: "saanich",
    region: "Vancouver Island",
  },

  // Okanagan Valley
  {
    value: "kelowna",
    label: "Kelowna",
    placeId: "kelowna",
    region: "Okanagan Valley",
  },
  {
    value: "vernon",
    label: "Vernon",
    placeId: "vernon",
    region: "Okanagan Valley",
  },
  {
    value: "penticton",
    label: "Penticton",
    placeId: "penticton",
    region: "Okanagan Valley",
  },
  {
    value: "west-kelowna",
    label: "West Kelowna",
    placeId: "west-kelowna",
    region: "Okanagan Valley",
  },
  {
    value: "lake-country",
    label: "Lake Country",
    placeId: "lake-country",
    region: "Okanagan Valley",
  },
  {
    value: "peachland",
    label: "Peachland",
    placeId: "peachland",
    region: "Okanagan Valley",
  },
  {
    value: "summerland",
    label: "Summerland",
    placeId: "summerland",
    region: "Okanagan Valley",
  },
  {
    value: "oliver",
    label: "Oliver",
    placeId: "oliver",
    region: "Okanagan Valley",
  },
  {
    value: "osoyoos",
    label: "Osoyoos",
    placeId: "osoyoos",
    region: "Okanagan Valley",
  },

  // Fraser Valley
  {
    value: "abbotsford",
    label: "Abbotsford",
    placeId: "abbotsford",
    region: "Fraser Valley",
  },
  {
    value: "chilliwack",
    label: "Chilliwack",
    placeId: "chilliwack",
    region: "Fraser Valley",
  },
  {
    value: "mission",
    label: "Mission",
    placeId: "mission",
    region: "Fraser Valley",
  },
  { value: "hope", label: "Hope", placeId: "hope", region: "Fraser Valley" },
  {
    value: "agassiz",
    label: "Agassiz",
    placeId: "agassiz",
    region: "Fraser Valley",
  },
  {
    value: "harrison-hot-springs",
    label: "Harrison Hot Springs",
    placeId: "harrison-hot-springs",
    region: "Fraser Valley",
  },

  // Interior BC
  {
    value: "kamloops",
    label: "Kamloops",
    placeId: "kamloops",
    region: "Interior BC",
  },
  {
    value: "cranbrook",
    label: "Cranbrook",
    placeId: "cranbrook",
    region: "Interior BC",
  },
  { value: "trail", label: "Trail", placeId: "trail", region: "Interior BC" },
  {
    value: "castlegar",
    label: "Castlegar",
    placeId: "castlegar",
    region: "Interior BC",
  },
  {
    value: "nelson",
    label: "Nelson",
    placeId: "nelson",
    region: "Interior BC",
  },
  {
    value: "revelstoke",
    label: "Revelstoke",
    placeId: "revelstoke",
    region: "Interior BC",
  },
  {
    value: "salmon-arm",
    label: "Salmon Arm",
    placeId: "salmon-arm",
    region: "Interior BC",
  },
  {
    value: "sicamous",
    label: "Sicamous",
    placeId: "sicamous",
    region: "Interior BC",
  },
  {
    value: "golden",
    label: "Golden",
    placeId: "golden",
    region: "Interior BC",
  },
  {
    value: "invermere",
    label: "Invermere",
    placeId: "invermere",
    region: "Interior BC",
  },
  {
    value: "kimberley",
    label: "Kimberley",
    placeId: "kimberley",
    region: "Interior BC",
  },
  {
    value: "fernie",
    label: "Fernie",
    placeId: "fernie",
    region: "Interior BC",
  },

  // Northern BC
  {
    value: "prince-george",
    label: "Prince George",
    placeId: "prince-george",
    region: "Northern BC",
  },
  {
    value: "fort-st-john",
    label: "Fort St. John",
    placeId: "fort-st-john",
    region: "Northern BC",
  },
  {
    value: "dawson-creek",
    label: "Dawson Creek",
    placeId: "dawson-creek",
    region: "Northern BC",
  },
  {
    value: "fort-nelson",
    label: "Fort Nelson",
    placeId: "fort-nelson",
    region: "Northern BC",
  },
  {
    value: "terrace",
    label: "Terrace",
    placeId: "terrace",
    region: "Northern BC",
  },
  {
    value: "prince-rupert",
    label: "Prince Rupert",
    placeId: "prince-rupert",
    region: "Northern BC",
  },
  {
    value: "smithers",
    label: "Smithers",
    placeId: "smithers",
    region: "Northern BC",
  },
  {
    value: "hazelton",
    label: "Hazelton",
    placeId: "hazelton",
    region: "Northern BC",
  },
  {
    value: "houston",
    label: "Houston",
    placeId: "houston",
    region: "Northern BC",
  },
  {
    value: "burns-lake",
    label: "Burns Lake",
    placeId: "burns-lake",
    region: "Northern BC",
  },
  {
    value: "williams-lake",
    label: "Williams Lake",
    placeId: "williams-lake",
    region: "Northern BC",
  },
  {
    value: "quesnel",
    label: "Quesnel",
    placeId: "quesnel",
    region: "Northern BC",
  },
  {
    value: "100-mile-house",
    label: "100 Mile House",
    placeId: "100-mile-house",
    region: "Northern BC",
  },
  {
    value: "mackenzie",
    label: "Mackenzie",
    placeId: "mackenzie",
    region: "Northern BC",
  },
  {
    value: "chetwynd",
    label: "Chetwynd",
    placeId: "chetwynd",
    region: "Northern BC",
  },
  {
    value: "tumbler-ridge",
    label: "Tumbler Ridge",
    placeId: "tumbler-ridge",
    region: "Northern BC",
  },
];

// Helper function to get cities by region
export const getCitiesByRegion = (region: string): BCCity[] => {
  return BC_CITIES.filter((city) => city.region === region);
};

// Helper function to search cities
export const searchBCCities = (query: string): BCCity[] => {
  if (!query.trim()) return BC_CITIES;

  const searchTerm = query.toLowerCase();
  return BC_CITIES.filter(
    (city) =>
      city.label.toLowerCase().includes(searchTerm) ||
      city.region.toLowerCase().includes(searchTerm),
  );
};

// Helper function to get all regions
export const getBCRegions = (): string[] => {
  return [...new Set(BC_CITIES.map((city) => city.region))];
};
