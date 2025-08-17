// Mock Pokemon data for when API is down
export const mockPokemonCards = [
  {
    id: "base1-1",
    name: "Alakazam",
    setName: "Base Set",
    setNumber: "1",
    rarity: "Rare Holo",
    types: ["Psychic"],
    hp: "80",
    artist: "Ken Sugimori",
    images: {
      small: "https://images.pokemontcg.io/base1/1.png",
      large: "https://images.pokemontcg.io/base1/1_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 45.00
        }
      }
    }
  },
  {
    id: "base1-4",
    name: "Charizard",
    setName: "Base Set",
    setNumber: "4",
    rarity: "Rare Holo",
    types: ["Fire"],
    hp: "120",
    artist: "Mitsuhiro Arita",
    images: {
      small: "https://images.pokemontcg.io/base1/4.png",
      large: "https://images.pokemontcg.io/base1/4_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 400.00
        }
      }
    }
  },
  {
    id: "base1-58",
    name: "Pikachu",
    setName: "Base Set",
    setNumber: "58",
    rarity: "Common",
    types: ["Lightning"],
    hp: "40",
    artist: "Mitsuhiro Arita",
    images: {
      small: "https://images.pokemontcg.io/base1/58.png",
      large: "https://images.pokemontcg.io/base1/58_hires.png"
    },
    tcgplayer: {
      prices: {
        normal: {
          market: 8.00
        }
      }
    }
  },
  {
    id: "base1-15",
    name: "Venusaur",
    setName: "Base Set",
    setNumber: "15",
    rarity: "Rare Holo",
    types: ["Grass"],
    hp: "100",
    artist: "Mitsuhiro Arita",
    images: {
      small: "https://images.pokemontcg.io/base1/15.png",
      large: "https://images.pokemontcg.io/base1/15_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 55.00
        }
      }
    }
  },
  {
    id: "base1-2",
    name: "Blastoise",
    setName: "Base Set",
    setNumber: "2",
    rarity: "Rare Holo",
    types: ["Water"],
    hp: "100",
    artist: "Ken Sugimori",
    images: {
      small: "https://images.pokemontcg.io/base1/2.png",
      large: "https://images.pokemontcg.io/base1/2_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 100.00
        }
      }
    }
  },
  {
    id: "base1-16",
    name: "Zapdos",
    setName: "Base Set",
    setNumber: "16",
    rarity: "Rare Holo",
    types: ["Lightning"],
    hp: "90",
    artist: "Ken Sugimori",
    images: {
      small: "https://images.pokemontcg.io/base1/16.png",
      large: "https://images.pokemontcg.io/base1/16_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 25.00
        }
      }
    }
  },
  {
    id: "jungle-1",
    name: "Clefable",
    setName: "Jungle",
    setNumber: "1",
    rarity: "Rare Holo",
    types: ["Colorless"],
    hp: "70",
    artist: "Mitsuhiro Arita",
    images: {
      small: "https://images.pokemontcg.io/jungle/1.png",
      large: "https://images.pokemontcg.io/jungle/1_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 15.00
        }
      }
    }
  },
  {
    id: "fossil-1",
    name: "Aerodactyl",
    setName: "Fossil",
    setNumber: "1",
    rarity: "Rare Holo",
    types: ["Fighting"],
    hp: "60",
    artist: "Kagemaru Himeno",
    images: {
      small: "https://images.pokemontcg.io/fossil/1.png",
      large: "https://images.pokemontcg.io/fossil/1_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 20.00
        }
      }
    }
  },
  {
    id: "base1-7",
    name: "Hitmonchan",
    setName: "Base Set",
    setNumber: "7",
    rarity: "Rare Holo",
    types: ["Fighting"],
    hp: "70",
    artist: "Ken Sugimori",
    images: {
      small: "https://images.pokemontcg.io/base1/7.png",
      large: "https://images.pokemontcg.io/base1/7_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 18.00
        }
      }
    }
  },
  {
    id: "base1-11",
    name: "Nidoking",
    setName: "Base Set",
    setNumber: "11",
    rarity: "Rare Holo",
    types: ["Grass"],
    hp: "90",
    artist: "Ken Sugimori",
    images: {
      small: "https://images.pokemontcg.io/base1/11.png",
      large: "https://images.pokemontcg.io/base1/11_hires.png"
    },
    tcgplayer: {
      prices: {
        holofoil: {
          market: 22.00
        }
      }
    }
  }
];

export function searchMockCards(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  const term = searchTerm.toLowerCase();
  return mockPokemonCards.filter(card => 
    card.name.toLowerCase().includes(term) ||
    card.setName.toLowerCase().includes(term)
  );
}