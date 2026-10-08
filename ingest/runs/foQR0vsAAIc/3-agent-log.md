# Agent log: How did cities get their names? (foQR0vsAAIc)

Model: claude-opus-5-5. Started 2026-10-08T16:27:39.858Z.

Session: model claude-opus-5-5, MCP servers: wordhoard (connected).
Tools offered: mcp__wordhoard__add, mcp__wordhoard__complain, mcp__wordhoard__edit, mcp__wordhoard__entry, mcp__wordhoard__finish, mcp__wordhoard__list, mcp__wordhoard__merge, mcp__wordhoard__remove, mcp__wordhoard__search, mcp__wordhoard__set_gloss, mcp__wordhoard__submit.

---

I'm starting with a batch search for the main candidate cities and elements from this episode, to find existing entries before drafting.

**→ search** (call 1)

```json
{
 "queries": [
  "polis",
  "-polis",
  "Byzantium",
  "Constantinople",
  "Istanbul",
  "Naples",
  "Neapolis",
  "Parthenope",
  "Sevastopol",
  "Minneapolis",
  "Tripoli",
  "Budapest",
  "Paris",
  "Medina",
  "Algiers",
  "al-",
  "Almería",
  "Alicante",
  "leukemia",
  "Guadalajara",
  "wadi",
  "Gibraltar",
  "Benidorm",
  "Granada",
  "pomegranate",
  "grenade",
  "orange",
  "Grenada",
  "Buenos Aires",
  "malaria",
  "Santiago",
  "São Paulo",
  "Rio de Janeiro"
 ],
 "limit": 5
}
```

**← search**

```json
{
 "ok": true,
 "results": [
  {
   "query": "polis",
   "total": 10,
   "offset": 0,
   "results": [
    {
     "slug": "philippopolis",
     "name": "Philippopolis",
     "language": "Greek",
     "category": "name",
     "original": "Philippopolis",
     "translation": "Philip's town",
     "episodes": 1
    },
    {
     "slug": "monopolist",
     "name": "Monopolist",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "copulist",
     "name": "copulist",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "impolite",
     "name": "impolite",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "poison",
     "name": "poison",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "-polis",
   "total": 10,
   "offset": 0,
   "results": [
    {
     "slug": "philippopolis",
     "name": "Philippopolis",
     "language": "Greek",
     "category": "name",
     "original": "Philippopolis",
     "translation": "Philip's town",
     "episodes": 1
    },
    {
     "slug": "monopolist",
     "name": "Monopolist",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "copulist",
     "name": "copulist",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "impolite",
     "name": "impolite",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "poison",
     "name": "poison",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Byzantium",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "aristophanes-of-byzantium",
     "name": "Aristophanes of Byzantium",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Constantinople",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "siege-of-constantinople",
     "name": "siege of Constantinople",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Istanbul",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Naples",
   "total": 101,
   "offset": 0,
   "results": [
    {
     "slug": "see-naples-and-die",
     "name": "see Naples and die",
     "language": "English",
     "category": "expression",
     "episodes": 1
    },
    {
     "slug": "schnapsidee",
     "name": "Schnapsidee",
     "language": "German",
     "category": "word",
     "original": "Schnapsidee",
     "translation": "schnapps idea",
     "episodes": 1
    },
    {
     "slug": "journalese",
     "name": "journalese",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "unmentionables",
     "name": "unmentionables",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "choraules",
     "name": "choraules",
     "language": "Greek",
     "category": "word",
     "original": "choraulēs",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Neapolis",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "monopolist",
     "name": "Monopolist",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Parthenope",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Sevastopol",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Minneapolis",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Tripoli",
   "total": 7,
   "offset": 0,
   "results": [
    {
     "slug": "crinoline",
     "name": "crinoline",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "rantipole",
     "name": "rantipole",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "trilliard",
     "name": "trilliard",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "trillion",
     "name": "trillion",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "tripod",
     "name": "tripod",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Budapest",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Paris",
   "total": 33,
   "offset": 0,
   "results": [
    {
     "slug": "paris",
     "name": "Paris",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "parisii",
     "name": "Parisii",
     "language": "Latin",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "lutetia-parisiorum",
     "name": "Lutetia Parisiorum",
     "language": "Latin",
     "category": "name",
     "original": "Lutetia Parisiorum",
     "translation": "swamp of the Parisii",
     "episodes": 1
    },
    {
     "slug": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "name": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "language": "Greek",
     "category": "word",
     "original": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "episodes": 1
    },
    {
     "slug": "paisan",
     "name": "paisan",
     "language": "Italian",
     "category": "word",
     "original": "paisan",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Medina",
   "total": 65,
   "offset": 0,
   "results": [
    {
     "slug": "commedia-dellarte",
     "name": "commedia dell'arte",
     "language": "Italian",
     "category": "word",
     "original": "commedia dell'arte",
     "episodes": 1
    },
    {
     "slug": "molinari",
     "name": "Molinari",
     "language": "Italian",
     "category": "name",
     "original": "Molinari",
     "translation": "miller",
     "episodes": 1
    },
    {
     "slug": "ordinateur",
     "name": "ordinateur",
     "language": "French",
     "category": "word",
     "original": "ordinateur",
     "episodes": 1
    },
    {
     "slug": "regina",
     "name": "regina",
     "language": "Latin",
     "category": "word",
     "original": "regina",
     "translation": "queen",
     "episodes": 1
    },
    {
     "slug": "vergissmeinnicht",
     "name": "Vergissmeinnicht",
     "language": "German",
     "category": "word",
     "original": "Vergissmeinnicht",
     "translation": "forget me not",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Algiers",
   "total": 10,
   "offset": 0,
   "results": [
    {
     "slug": "chevalier",
     "name": "chevalier",
     "language": "English",
     "category": "word",
     "original": "chevalier",
     "translation": "knight",
     "episodes": 2
    },
    {
     "slug": "escalier",
     "name": "escalier",
     "language": "French",
     "category": "word",
     "original": "escalier",
     "translation": "staircase",
     "episodes": 1
    },
    {
     "slug": "cavalier",
     "name": "cavalier",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "lallies",
     "name": "lallies",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "rangers",
     "name": "Rangers",
     "language": "English",
     "category": "word-part",
     "episodes": 1
    }
   ]
  },
  {
   "query": "al-",
   "total": 844,
   "offset": 0,
   "results": [
    {
     "slug": "al-khwarizmi",
     "name": "al-Khwarizmi",
     "language": "English",
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "eid-al-adha",
     "name": "Eid al-Adha",
     "language": "Arabic",
     "category": "word",
     "original": "Eid al-Adha",
     "episodes": 1
    },
    {
     "slug": "eid-al-fitr",
     "name": "Eid al-Fitr",
     "language": "Arabic",
     "category": "word",
     "original": "Eid al-Fitr",
     "episodes": 1
    },
    {
     "slug": "cairo",
     "name": "Cairo",
     "language": "English",
     "category": "name",
     "original": "Al-Qahira",
     "translation": "the conqueror",
     "episodes": 3
    },
    {
     "slug": "commander-of-the-faithful",
     "name": "commander of the faithful",
     "language": "Arabic",
     "category": "word",
     "original": "amir al-mu'minin",
     "translation": "commander of the faithful",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Almería",
   "total": 23,
   "offset": 0,
   "results": [
    {
     "slug": "alderman",
     "name": "alderman",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "amelia",
     "name": "Amelia",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "america",
     "name": "America",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "americium",
     "name": "americium",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "cambria",
     "name": "Cambria",
     "language": "English",
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Alicante",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "spifflicated",
     "name": "spifflicated",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "alcanter-de-brahm",
     "name": "Alcanter de Brahm",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "leukemia",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Guadalajara",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "wadi",
   "total": 55,
   "offset": 0,
   "results": [
    {
     "slug": "adidas",
     "name": "Adidas",
     "language": "German",
     "category": "name",
     "original": "Adidas",
     "episodes": 2
    },
    {
     "slug": "adieu",
     "name": "adieu",
     "language": "French",
     "category": "word",
     "original": "adieu",
     "episodes": 1
    },
    {
     "slug": "adios",
     "name": "adiós",
     "language": "Spanish",
     "category": "word",
     "original": "adiós",
     "episodes": 1
    },
    {
     "slug": "radix",
     "name": "radix",
     "language": "Latin",
     "category": "word",
     "original": "radix",
     "translation": "root",
     "episodes": 1
    },
    {
     "slug": "wai",
     "name": "wai",
     "language": "Thai",
     "category": "word",
     "original": "wai",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Gibraltar",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Benidorm",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Granada",
   "total": 17,
   "offset": 0,
   "results": [
    {
     "slug": "embaracada",
     "name": "embaraçada",
     "language": "Portuguese",
     "category": "word",
     "original": "embaraçada",
     "episodes": 1
    },
    {
     "slug": "embarazada",
     "name": "embarazada",
     "language": "Spanish",
     "category": "word",
     "original": "embarazada",
     "episodes": 1
    },
    {
     "slug": "granddaddy-longlegs",
     "name": "granddaddy longlegs",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "abracadabra",
     "name": "abracadabra",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "canada",
     "name": "Canada",
     "language": "English",
     "category": "name",
     "episodes": 2
    }
   ]
  },
  {
   "query": "pomegranate",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "pomegranate",
     "name": "pomegranate",
     "language": "English",
     "category": "word",
     "episodes": 3
    }
   ]
  },
  {
   "query": "grenade",
   "total": 11,
   "offset": 0,
   "results": [
    {
     "slug": "grenade",
     "name": "grenade",
     "language": "English",
     "category": "word",
     "episodes": 3
    },
    {
     "slug": "gender",
     "name": "gender",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "greaves",
     "name": "greaves",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "pomegranate",
     "name": "pomegranate",
     "language": "English",
     "category": "word",
     "episodes": 3
    },
    {
     "slug": "rendezvous",
     "name": "rendezvous",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "orange",
   "total": 148,
   "offset": 0,
   "results": [
    {
     "slug": "orange",
     "name": "orange",
     "language": "English",
     "category": "word",
     "episodes": 4
    },
    {
     "slug": "orange-town",
     "name": "Orange (town)",
     "language": "French",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "orange-apple",
     "name": "orange apple",
     "language": "French",
     "category": "word",
     "original": "pomme d'orange",
     "translation": "orange apple",
     "episodes": 1
    },
    {
     "slug": "apple-of-orange",
     "name": "apple of orange",
     "language": "Latin",
     "category": "word",
     "original": "pomum de orenge",
     "translation": "apple of orange",
     "episodes": 1
    },
    {
     "slug": "apples-and-oranges",
     "name": "apples and oranges",
     "language": "English",
     "category": "expression",
     "episodes": 2
    }
   ]
  },
  {
   "query": "Grenada",
   "total": 6,
   "offset": 0,
   "results": [
    {
     "slug": "grenade",
     "name": "grenade",
     "language": "English",
     "category": "word",
     "episodes": 3
    },
    {
     "slug": "rendaku",
     "name": "rendaku",
     "language": "Japanese",
     "category": "about-language",
     "original": "rendaku",
     "episodes": 1
    },
    {
     "slug": "agenda",
     "name": "agenda",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "haagen-dazs",
     "name": "Häagen-Dazs",
     "language": "English",
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "granddaddy-longlegs",
     "name": "granddaddy longlegs",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Buenos Aires",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "malaria",
   "total": 9,
   "offset": 0,
   "results": [
    {
     "slug": "maria",
     "name": "Maria",
     "language": "Italian",
     "category": "name",
     "original": "Maria",
     "episodes": 1
    },
    {
     "slug": "fustilarian",
     "name": "fustilarian",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "malayalam",
     "name": "Malayalam",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "marianne",
     "name": "Marianne",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "pastafarianism",
     "name": "Pastafarianism",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Santiago",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "santiago",
     "name": "Santiago",
     "language": "Spanish",
     "category": "name",
     "original": "Santiago",
     "episodes": 1
    },
    {
     "slug": "antagonym",
     "name": "antagonym",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "São Paulo",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Rio de Janeiro",
   "total": 0,
   "offset": 0,
   "results": []
  }
 ]
}
```

Checking existing entries that may match: Santiago, Paris, Orange (town), pomegranate, grenade, orange.

**→ entry** (call 2)

```json
{
 "slug": "santiago"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "santiago",
 "name": "Santiago",
 "language": "Spanish",
 "category": "name",
 "original": "Santiago",
 "episodes": 1,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "P7OrRqykwWc",
   "episode": "Where do first names come from?",
   "date": "2025-11-05",
   "timestamp": "00:18:04",
   "role": "subject",
   "note": "A form of [[same-root:James]].",
   "confidence": "high"
  }
 ],
 "backlinks": []
}
```

**→ entry** (call 3)

```json
{
 "slug": "paris"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "paris",
 "name": "Paris",
 "language": "English",
 "category": "name",
 "episodes": 1,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "p4bB1fOPtXI",
   "episode": "The literal meanings of city names",
   "date": "2026-04-08",
   "timestamp": "00:35:56",
   "role": "subject",
   "note": "Named after the [[from:Parisii]]; Romans recorded it as [[from:Lutetia Parisiorum]], later shortened; like Berlin, it's named for a swamp.",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "lutetia",
   "name": "Lutetia"
  },
  {
   "slug": "lutetia-parisiorum",
   "name": "Lutetia Parisiorum"
  },
  {
   "slug": "parisii",
   "name": "Parisii"
  }
 ]
}
```

**→ entry** (call 4)

```json
{
 "slug": "pomegranate"
}
```

**→ entry** (call 5)

```json
{
 "slug": "grenade"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "pomegranate",
 "name": "pomegranate",
 "language": "English",
 "category": "word",
 "episodes": 3,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "cpbX99gYP4M",
   "episode": "Do \"vegetables\" technically exist? | FOOD WORDS",
   "date": "2024-07-31",
   "timestamp": "00:20:57",
   "role": "subject",
   "note": "Literally an apple with many seeds, from Latin [[from:pomum granatum]]; related to [[same-root:grenade]].",
   "confidence": "high"
  },
  {
   "episode_id": "4CJRYBxDdGg",
   "episode": "How do you pronounce lieutenant? | MILITARY WORDS",
   "date": "2025-04-02",
   "timestamp": "00:35:46",
   "role": "subject",
   "note": "Literally a seedy apple, from Latin granatum, seeded; related to [[same-root:grenade]].",
   "confidence": "high"
  },
  {
   "episode_id": "6Rr6qfIIapY",
   "episode": "Who was the first to 'spill the beans'? | SAYINGS EXPLAINED",
   "date": "2025-09-17",
   "timestamp": "00:25:42",
   "role": "subject",
   "note": "Means grainy apple, its first part being French [[from:pomme]], apple; it gave [[gave:grenade]].",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "grenade",
   "name": "grenade"
  }
 ]
}
```

**→ entry** (call 6)

```json
{
 "slug": "orange-town"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "grenade",
 "name": "grenade",
 "language": "English",
 "category": "word",
 "episodes": 3,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "cpbX99gYP4M",
   "episode": "Do \"vegetables\" technically exist? | FOOD WORDS",
   "date": "2024-07-31",
   "timestamp": "00:21:05",
   "role": "aside",
   "note": "Related to [[same-root:pomegranate]].",
   "confidence": "high"
  },
  {
   "episode_id": "4CJRYBxDdGg",
   "episode": "How do you pronounce lieutenant? | MILITARY WORDS",
   "date": "2025-04-02",
   "timestamp": "00:35:46",
   "role": "subject",
   "note": "Related to [[same-root:pomegranate]], from Latin granatum, seeded; early grenades looked like pomegranates.",
   "confidence": "high"
  },
  {
   "episode_id": "6Rr6qfIIapY",
   "episode": "Who was the first to 'spill the beans'? | SAYINGS EXPLAINED",
   "date": "2025-09-17",
   "timestamp": "00:25:31",
   "role": "subject",
   "note": "Literally means [[from:pomegranate]], which grenades resemble in shape and in scattering fragments like seeds.",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "pomegranate",
   "name": "pomegranate"
  }
 ]
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "orange-town",
 "name": "Orange (town)",
 "language": "French",
 "category": "name",
 "episodes": 1,
 "new": false,
 "homographs": [
  {
   "slug": "orange",
   "name": "orange",
   "language": "English",
   "category": "word",
   "episodes": 4
  }
 ],
 "mentions": [
  {
   "episode_id": "7vwN3aiiBM4",
   "episode": "Words that are surprisingly from Arabic",
   "date": "2026-05-06",
   "timestamp": "00:15:41",
   "role": "aside",
   "note": "French place name, as in William of Orange, [[unrelated:orange]] the fruit, though their spellings influenced each other.",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "apple-of-orange",
   "name": "apple of orange"
  }
 ]
}
```

Existing Santiago is the given name, so I'll create "Santiago (city)". Paris is reusable. More searches next.

**→ search** (call 7)

```json
{
 "queries": [
  "Bogotá",
  "Lima",
  "Mexico",
  "Tenochtitlan",
  "Perth",
  "Pictish",
  "Brittonic",
  "Scottish Gaelic",
  "Goidelic",
  "Melbourne",
  "Batmania",
  "Bareberp",
  "bourne",
  "Brunnen",
  "Gesundbrunnen",
  "Bruinen",
  "Naarm",
  "Sydney",
  "Albion",
  "albus",
  "Canberra",
  "portmanteau",
  "compound",
  "Brisbane",
  "Meanjin",
  "Adelaide",
  "-hood",
  "Darwin",
  "Charles Darwin",
  "Palmerston",
  "binomial"
 ],
 "limit": 5
}
```

**← search**

```json
{
 "ok": true,
 "results": [
  {
   "query": "Bogotá",
   "total": 22,
   "offset": 0,
   "results": [
    {
     "slug": "aelfsogotha",
     "name": "ælfsogoþa",
     "language": "Old English",
     "category": "word",
     "original": "ælfsogoþa",
     "translation": "elf cough",
     "episodes": 1
    },
    {
     "slug": "boot",
     "name": "boot",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "bootiful",
     "name": "bootiful",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "bootstrapping",
     "name": "bootstrapping",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "booty",
     "name": "booty",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Lima",
   "total": 191,
   "offset": 0,
   "results": [
    {
     "slug": "climax",
     "name": "climax",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "gallimaufry",
     "name": "gallimaufry",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "sceamlim",
     "name": "sceamlim",
     "language": "Old English",
     "category": "word",
     "original": "sceamlim",
     "translation": "shame limb",
     "episodes": 1
    },
    {
     "slug": "allemagne",
     "name": "Allemagne",
     "language": "French",
     "category": "name",
     "original": "Allemagne",
     "episodes": 1
    },
    {
     "slug": "anima",
     "name": "anima",
     "language": "Latin",
     "category": "word",
     "original": "anima",
     "episodes": 2
    }
   ]
  },
  {
   "query": "Mexico",
   "total": 35,
   "offset": 0,
   "results": [
    {
     "slug": "lexicographer",
     "name": "lexicographer",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "flamenco",
     "name": "flamenco",
     "language": "Spanish",
     "category": "word",
     "original": "flamenco",
     "episodes": 2
    },
    {
     "slug": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "name": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "language": "Greek",
     "category": "word",
     "original": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "episodes": 1
    },
    {
     "slug": "ameliorate",
     "name": "ameliorate",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "amelioration",
     "name": "amelioration",
     "language": "English",
     "category": "about-language",
     "episodes": 4
    }
   ]
  },
  {
   "query": "Tenochtitlan",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Perth",
   "total": 13,
   "offset": 0,
   "results": [
    {
     "slug": "bertha",
     "name": "Bertha",
     "language": "German",
     "category": "name",
     "original": "Bertha",
     "episodes": 1
    },
    {
     "slug": "hapertas",
     "name": "hapertas",
     "language": "Anglo-French",
     "category": "word",
     "original": "hapertas",
     "episodes": 1
    },
    {
     "slug": "knusperhauschenwalzer",
     "name": "Knusperhäuschenwalzer",
     "language": "German",
     "category": "word",
     "original": "Knusperhäuschenwalzer",
     "translation": "gingerbread house waltz",
     "episodes": 1
    },
    {
     "slug": "apartheid",
     "name": "apartheid",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "apertly",
     "name": "apertly",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Pictish",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "british-isles",
     "name": "British Isles",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "british-latin",
     "name": "British Latin",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Brittonic",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "britannia",
     "name": "Britannia",
     "language": "Latin",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "brittany",
     "name": "Brittany",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Scottish Gaelic",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Goidelic",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Melbourne",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "james-gurney",
     "name": "James Gurney",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "sherborne-lane",
     "name": "Sherborne Lane",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "le-bourget-airport",
     "name": "Le Bourget Airport",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Batmania",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Bareberp",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "barber",
     "name": "barber",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "barbers-pole",
     "name": "barber's pole",
     "language": "English",
     "category": "word",
     "episodes": 2
    }
   ]
  },
  {
   "query": "bourne",
   "total": 91,
   "offset": 0,
   "results": [
    {
     "slug": "journey",
     "name": "journey",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "labourer",
     "name": "labourer",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "bearneacen",
     "name": "bearneacen",
     "language": "Old English",
     "category": "word",
     "original": "bearneacen",
     "translation": "child-increasing",
     "episodes": 1
    },
    {
     "slug": "cybernetique",
     "name": "cybernétique",
     "language": "French",
     "category": "word",
     "original": "cybernétique",
     "episodes": 1
    },
    {
     "slug": "foufoune",
     "name": "foufoune",
     "language": "French",
     "category": "word",
     "original": "foufoune",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Brunnen",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "runner",
     "name": "runner",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "showrunner",
     "name": "showrunner",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "bunsen-burner",
     "name": "Bunsen burner",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "running-interference",
     "name": "running interference",
     "language": "English",
     "category": "expression",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Gesundbrunnen",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Bruinen",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Naarm",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "great-heathen-army",
     "name": "Great Heathen Army",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "costs-an-arm-and-a-leg",
     "name": "costs an arm and a leg",
     "language": "English",
     "category": "expression",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Sydney",
   "total": 6,
   "offset": 0,
   "results": [
    {
     "slug": "busyness",
     "name": "busyness",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "fesynes",
     "name": "fesynes",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "kidney",
     "name": "kidney",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "synecdoche",
     "name": "synecdoche",
     "language": "English",
     "category": "about-language",
     "episodes": 2
    },
    {
     "slug": "synergy",
     "name": "synergy",
     "language": "English",
     "category": "word",
     "episodes": 5
    }
   ]
  },
  {
   "query": "Albion",
   "total": 226,
   "offset": 0,
   "results": [
    {
     "slug": "albion",
     "name": "Albion",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "albino",
     "name": "albino",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "rampallion",
     "name": "rampallion",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "rantallion",
     "name": "rantallion",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "stallion",
     "name": "stallion",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "albus",
   "total": 14,
   "offset": 0,
   "results": [
    {
     "slug": "albus-dumbledore",
     "name": "Albus Dumbledore",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "malus",
     "name": "malus",
     "language": "French",
     "category": "word",
     "original": "malus",
     "episodes": 1
    },
    {
     "slug": "abusion",
     "name": "abusion",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "abusive",
     "name": "abusive",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "ambush",
     "name": "ambush",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Canberra",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "cranberry",
     "name": "cranberry",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "cranberry-morpheme",
     "name": "cranberry morpheme",
     "language": "English",
     "category": "about-language",
     "episodes": 2
    }
   ]
  },
  {
   "query": "portmanteau",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "portmanteau",
     "name": "portmanteau",
     "language": "English",
     "category": "about-language",
     "episodes": 4
    },
    {
     "slug": "portmanteauization",
     "name": "portmanteauization",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "portmanteau-acronym",
     "name": "portmanteau acronym",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "compound",
   "total": 5,
   "offset": 0,
   "results": [
    {
     "slug": "compound-insult",
     "name": "compound insult",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "compendious",
     "name": "compendious",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "compendium",
     "name": "compendium",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "forever-is-composed-of-nows",
     "name": "Forever is composed of nows",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "the-compendious-book-on-calculation-by-completion-and-balancing",
     "name": "The Compendious Book on Calculation by Completion and Balancing",
     "language": null,
     "category": "name",
     "episodes": 2
    }
   ]
  },
  {
   "query": "Brisbane",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Meanjin",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "melanin",
     "name": "melanin",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "nanjing",
     "name": "Nanjing",
     "language": "English",
     "category": "name",
     "translation": "southern capital",
     "episodes": 1
    },
    {
     "slug": "when-im-cleaning-windows",
     "name": "When I'm Cleaning Windows",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "man-in-the-iron-mask",
     "name": "man in the iron mask",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Adelaide",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "-hood",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "doodle",
     "name": "-doodle",
     "language": "English",
     "category": "word-part",
     "episodes": 2
    },
    {
     "slug": "hood",
     "name": "hood",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "robin-hood",
     "name": "Robin Hood",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "cnihtscipe",
     "name": "cnihtscipe",
     "language": "Old English",
     "category": "word",
     "original": "cnihtscipe",
     "translation": "knighthood",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Darwin",
   "total": 85,
   "offset": 0,
   "results": [
    {
     "slug": "charles-darwin",
     "name": "Charles Darwin",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "martin-pecheur",
     "name": "martin-pêcheur",
     "language": "French",
     "category": "word",
     "original": "martin-pêcheur",
     "translation": "martin fisher",
     "episodes": 1
    },
    {
     "slug": "karkinos",
     "name": "karkinos",
     "language": "Greek",
     "category": "word",
     "original": "karkinos",
     "episodes": 2
    },
    {
     "slug": "le-parking",
     "name": "le parking",
     "language": "French",
     "category": "word",
     "original": "le parking",
     "episodes": 1
    },
    {
     "slug": "secunda-minuta",
     "name": "secunda minuta",
     "language": "Latin",
     "category": "word",
     "original": "secunda minuta",
     "translation": "second minute",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Charles Darwin",
   "total": 6,
   "offset": 0,
   "results": [
    {
     "slug": "charles-darwin",
     "name": "Charles Darwin",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "charles-darrow",
     "name": "Charles Darrow",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "charles-dickens",
     "name": "Charles Dickens",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "charles-miner",
     "name": "Charles Miner",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "charles-d-rice",
     "name": "Charles D. Rice",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Palmerston",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "palestine",
     "name": "Palestine",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "austin-m-patterson",
     "name": "Austin M. Patterson",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "binomial",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "frozen-binomials",
     "name": "frozen binomials",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  }
 ]
}
```

Checking Albion, and searching the remaining candidates (NZ, Canada, Italy) plus Edinburgh for the earlier-episode reference.

**→ entry** (call 8)

```json
{
 "slug": "albion"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "albion",
 "name": "Albion",
 "language": "English",
 "category": "name",
 "episodes": 1,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "ClRqFWMR15Y",
   "episode": "Which was the original 'football'? | SPORTS WORDS",
   "date": "2025-11-12",
   "timestamp": "00:37:04",
   "role": "subject",
   "note": "A word for Britain, used as a grand, patriotic name for clubs like West Bromwich Albion.",
   "confidence": "high"
  }
 ],
 "backlinks": []
}
```

**→ search** (call 9)

```json
{
 "queries": [
  "Edinburgh",
  "Dunedin",
  "Dùn Èideann",
  "Auckland",
  "Tāmaki Makaurau",
  "Wellington",
  "Christchurch",
  "Montreal",
  "Ville-Marie",
  "Virgin Mary",
  "Vancouver",
  "van",
  "Gastown",
  "Granville",
  "Toronto",
  "Ontario",
  "tautology",
  "Taranto",
  "tarantula",
  "tarantella",
  "Poseidon",
  "Lord of the Rings",
  "Algeria",
  "Al Jazeera",
  "Tariq",
  "Medina",
  "Mohawk",
  "Ojibwe",
  "Canterbury"
 ],
 "limit": 5
}
```

**← search**

```json
{
 "ok": true,
 "results": [
  {
   "query": "Edinburgh",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "edinburgh",
     "name": "Edinburgh",
     "language": "English",
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "hindenburg",
     "name": "Hindenburg",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "charlotte-of-mecklenburg-strelitz",
     "name": "Charlotte of Mecklenburg-Strelitz",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Dunedin",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "dunedin",
     "name": "Dunedin",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "pounding-it-down-their-throats",
     "name": "pounding it down their throats",
     "language": "English",
     "category": "expression",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Dùn Èideann",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Auckland",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "john-lackland",
     "name": "John Lackland",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "william-buckland",
     "name": "William Buckland",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "scratchland",
     "name": "Scratchland",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "lay-back-and-think-of-england",
     "name": "lay back and think of England",
     "language": "English",
     "category": "expression",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Tāmaki Makaurau",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Wellington",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "wellington-boot",
     "name": "Wellington boot",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "washington",
     "name": "Washington",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "george-washington",
     "name": "George Washington",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "washington-irving",
     "name": "Washington Irving",
     "language": null,
     "category": "name",
     "episodes": 5
    }
   ]
  },
  {
   "query": "Christchurch",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "christkind",
     "name": "Christkind",
     "language": "German",
     "category": "name",
     "original": "Christkind",
     "translation": "Christ child",
     "episodes": 1
    },
    {
     "slug": "christougenna",
     "name": "Christougenna",
     "language": "Greek",
     "category": "word",
     "original": "Χριστούγεννα",
     "translation": "Christ birth",
     "episodes": 1
    },
    {
     "slug": "christkindl",
     "name": "Christkindl",
     "language": "German",
     "category": "name",
     "original": "Christkindl",
     "translation": "little Christ child",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Montreal",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "montre",
     "name": "montre",
     "language": "French",
     "category": "word",
     "original": "montre",
     "translation": "show",
     "episodes": 1
    },
    {
     "slug": "montrer",
     "name": "montrer",
     "language": "French",
     "category": "word",
     "original": "montrer",
     "translation": "to show",
     "episodes": 2
    }
   ]
  },
  {
   "query": "Ville-Marie",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Virgin Mary",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "virgin-mary",
     "name": "Virgin Mary",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "virgin-mary-in-moon-orchid",
     "name": "Virgin Mary in moon orchid",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Vancouver",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "couvert",
     "name": "couvert",
     "language": "French",
     "category": "word",
     "original": "couvert",
     "translation": "covered",
     "episodes": 1
    },
    {
     "slug": "uncover-the-pink-pot",
     "name": "uncover the pink pot",
     "language": "French",
     "category": "expression",
     "original": "découvrir le pot rose",
     "translation": "uncover the pink pot",
     "episodes": 1
    },
    {
     "slug": "uncover-the-rose-pot",
     "name": "uncover the rose pot",
     "language": "French",
     "category": "expression",
     "original": "découvrir le pot aux roses",
     "translation": "uncover the rose pot",
     "episodes": 1
    }
   ]
  },
  {
   "query": "van",
   "total": 1480,
   "offset": 0,
   "results": [
    {
     "slug": "vanadium",
     "name": "vanadium",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "vandals",
     "name": "Vandals",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "vanguard",
     "name": "vanguard",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "vanilla",
     "name": "vanilla",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "van-gogh",
     "name": "Van Gogh",
     "language": "Dutch",
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Gastown",
   "total": 6,
   "offset": 0,
   "results": [
    {
     "slug": "aston",
     "name": "Aston",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "astonish",
     "name": "astonish",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "phlogiston",
     "name": "phlogiston",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "gaston-de-chasseloup-laubat",
     "name": "Gaston de Chasseloup-Laubat",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "kingston-mines",
     "name": "Kingston Mines",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Granville",
   "total": 13,
   "offset": 0,
   "results": [
    {
     "slug": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "name": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "language": "Greek",
     "category": "word",
     "original": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "episodes": 1
    },
    {
     "slug": "travailler",
     "name": "travailler",
     "language": "French",
     "category": "word",
     "original": "travailler",
     "episodes": 1
    },
    {
     "slug": "baskerville",
     "name": "Baskerville",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "grandiloquent",
     "name": "grandiloquent",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "jacksonville",
     "name": "Jacksonville",
     "language": "English",
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Toronto",
   "total": 13,
   "offset": 0,
   "results": [
    {
     "slug": "pronto",
     "name": "pronto",
     "language": "Italian",
     "category": "word",
     "original": "pronto",
     "translation": "ready",
     "episodes": 1
    },
    {
     "slug": "astronomy",
     "name": "astronomy",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "auto-antonym",
     "name": "auto-antonym",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "brontosaurus",
     "name": "brontosaurus",
     "language": "English",
     "category": "word",
     "translation": "thunder lizard",
     "episodes": 2
    },
    {
     "slug": "gerontocracy",
     "name": "gerontocracy",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Ontario",
   "total": 23,
   "offset": 0,
   "results": [
    {
     "slug": "septentriones",
     "name": "septentriones",
     "language": "Latin",
     "category": "word",
     "original": "septentriones",
     "translation": "seven ploughs",
     "episodes": 1
    },
    {
     "slug": "percontation-point",
     "name": "percontation point",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "antidisestablishmentarianism",
     "name": "antidisestablishmentarianism",
     "language": "English",
     "category": "word",
     "episodes": 4
    },
    {
     "slug": "centurion",
     "name": "centurion",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "container",
     "name": "container",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "tautology",
   "total": 22,
   "offset": 0,
   "results": [
    {
     "slug": "tautology",
     "name": "tautology",
     "language": "English",
     "category": "about-language",
     "episodes": 2
    },
    {
     "slug": "melittology",
     "name": "melittology",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "anthology",
     "name": "anthology",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "apiology",
     "name": "apiology",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "apology",
     "name": "apology",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Taranto",
   "total": 16,
   "offset": 0,
   "results": [
    {
     "slug": "amaranth",
     "name": "amaranth",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "amaranthine",
     "name": "amaranthine",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "araneology",
     "name": "araneology",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "auto-antonym",
     "name": "auto-antonym",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    },
    {
     "slug": "charactonym",
     "name": "charactonym",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "tarantula",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "gargantuan",
     "name": "gargantuan",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "gargantua-and-pantagruel",
     "name": "Gargantua and Pantagruel",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "caipirinha",
     "name": "caipirinha",
     "language": "Portuguese",
     "category": "word",
     "translation": "young peasant lady",
     "episodes": 1
    }
   ]
  },
  {
   "query": "tarantella",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "counterintelligence",
     "name": "counterintelligence",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Poseidon",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "poseidon",
     "name": "Poseidon",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Lord of the Rings",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "the-sword-of-the-knight",
     "name": "the sword of the knight",
     "language": "English",
     "category": "expression",
     "original": "l'épée du chevalier",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Algeria",
   "total": 13,
   "offset": 0,
   "results": [
    {
     "slug": "algebrista",
     "name": "algebrista",
     "language": "Italian",
     "category": "word",
     "original": "algebrista",
     "translation": "algebraist",
     "episodes": 1
    },
    {
     "slug": "alderman",
     "name": "alderman",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "algebra",
     "name": "algebra",
     "language": "English",
     "category": "word",
     "episodes": 3
    },
    {
     "slug": "algorithm",
     "name": "algorithm",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "galericulated",
     "name": "galericulated",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Al Jazeera",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Tariq",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "antidisestablishmentarianism",
     "name": "antidisestablishmentarianism",
     "language": "English",
     "category": "word",
     "episodes": 4
    },
    {
     "slug": "disestablishmentarianism",
     "name": "disestablishmentarianism",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "momentarily",
     "name": "momentarily",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "dictionnaire-comique-satyrique-critique-burlesque-libre-et-proverbial",
     "name": "Dictionnaire comique, satyrique, critique, burlesque, libre et proverbial",
     "language": "French",
     "category": "name",
     "translation": "comic, satirical, critical, burlesque, free and proverbial dictionary",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Medina",
   "total": 65,
   "offset": 0,
   "results": [
    {
     "slug": "commedia-dellarte",
     "name": "commedia dell'arte",
     "language": "Italian",
     "category": "word",
     "original": "commedia dell'arte",
     "episodes": 1
    },
    {
     "slug": "molinari",
     "name": "Molinari",
     "language": "Italian",
     "category": "name",
     "original": "Molinari",
     "translation": "miller",
     "episodes": 1
    },
    {
     "slug": "ordinateur",
     "name": "ordinateur",
     "language": "French",
     "category": "word",
     "original": "ordinateur",
     "episodes": 1
    },
    {
     "slug": "regina",
     "name": "regina",
     "language": "Latin",
     "category": "word",
     "original": "regina",
     "translation": "queen",
     "episodes": 1
    },
    {
     "slug": "vergissmeinnicht",
     "name": "Vergissmeinnicht",
     "language": "German",
     "category": "word",
     "original": "Vergissmeinnicht",
     "translation": "forget me not",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Mohawk",
   "total": 4,
   "offset": 0,
   "results": [
    {
     "slug": "ardi-shawki",
     "name": "ardi shawki",
     "language": "Arabic",
     "category": "word",
     "original": "ardi shawki",
     "translation": "earthy thorny",
     "episodes": 2
    },
    {
     "slug": "hawk",
     "name": "hawk",
     "language": "English",
     "category": "word",
     "episodes": 3
    },
    {
     "slug": "john-hawkins",
     "name": "John Hawkins",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "deaths-head-hawk-moth",
     "name": "death's head hawk moth",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Ojibwe",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "cobweb",
     "name": "cobweb",
     "language": "English",
     "category": "word",
     "episodes": 2
    },
    {
     "slug": "neoliberal",
     "name": "neoliberal",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "jibber-the-kibber",
     "name": "jibber the kibber",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Canterbury",
   "total": 2,
   "offset": 0,
   "results": [
    {
     "slug": "canterbury",
     "name": "Canterbury",
     "language": "English",
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "the-canterbury-tales",
     "name": "The Canterbury Tales",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  }
 ]
}
```

Looking at Dunedin, Edinburgh and Virgin Mary to see whether they match.

**→ entry** (call 10)

```json
{
 "slug": "dunedin"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "dunedin",
 "name": "Dunedin",
 "language": "English",
 "category": "name",
 "episodes": 1,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "fR7IIZAy4Js",
   "episode": "How cities got their names",
   "date": "2026-01-28",
   "timestamp": "00:46:00",
   "role": "subject",
   "note": "New Zealand city known for rugby, another rendering of the old name for Edinburgh, [[from:Din Eidyn]].",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "din-eidyn",
   "name": "Din Eidyn"
  }
 ]
}
```

**→ entry** (call 11)

```json
{
 "slug": "edinburgh"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "edinburgh",
 "name": "Edinburgh",
 "language": "English",
 "category": "name",
 "episodes": 2,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "KjQABENyZg0",
   "episode": "Who was the original \"goodfella\"? | CRIME WORDS",
   "date": "2025-02-05",
   "timestamp": "00:09:55",
   "role": "aside",
   "note": "A place name ending in [[from:burh]].",
   "confidence": "high"
  },
  {
   "episode_id": "fR7IIZAy4Js",
   "episode": "How cities got their names",
   "date": "2026-01-28",
   "timestamp": "00:44:31",
   "role": "subject",
   "note": "A Celtic–Anglo-Saxon hybrid: [[from:burh]] plus a Brittonic Edin-, possibly Welsh [[from?:eithin]], gorse; once called [[from:Din Eidyn]].",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "burh",
   "name": "burh"
  },
  {
   "slug": "din-eidyn",
   "name": "Din Eidyn"
  },
  {
   "slug": "eithin",
   "name": "eithin"
  },
  {
   "slug": "glasgow",
   "name": "Glasgow"
  }
 ]
}
```

**→ entry** (call 12)

```json
{
 "slug": "virgin-mary"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "virgin-mary",
 "name": "Virgin Mary",
 "language": "English",
 "category": "word",
 "episodes": 1,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "b5O7JqRT7u8",
   "episode": "Which cocktail means \"moist little thing\"? | BOOZY WORDS",
   "date": "2024-11-13",
   "timestamp": "00:28:21",
   "role": "subject",
   "note": "Non-alcoholic [[see:Bloody Mary]]; not the original 'virgin' drink, since virgin [[see:daiquiri]]s came first.",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "daiquiri",
   "name": "daiquiri"
  }
 ]
}
```

Virgin Mary is the cocktail, so I won't link to it. Dunedin and Edinburgh match, and I'll reuse them. A few more searches for link targets and element entries.

**→ search** (call 13)

```json
{
 "queries": [
  "definite article",
  "al (Arabic)",
  "leukos",
  "Lucentum",
  "jabal",
  "Adelheid",
  "granatum",
  "pomum granatum",
  "Constantine",
  "Muhammad",
  "Christopher Columbus",
  "Gaelic",
  "Brythonic",
  "Welsh",
  "Lake Ontario",
  "William Lamb",
  "Duke of Wellington",
  "mni",
  "Sebastos",
  "Tara"
 ],
 "limit": 4
}
```

**← search**

```json
{
 "ok": true,
 "results": [
  {
   "query": "definite article",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "al (Arabic)",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "classical-arabic",
     "name": "Classical Arabic",
     "language": null,
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "leukos",
   "total": 7,
   "offset": 0,
   "results": [
    {
     "slug": "glaukos",
     "name": "glaukos",
     "language": "Ancient Greek",
     "category": "word",
     "original": "glaukos",
     "translation": "gleaming",
     "episodes": 1
    },
    {
     "slug": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "name": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "language": "Greek",
     "category": "word",
     "original": "lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphiokarabomelitokatakechymenokichlepikossyphophattoperisteralektryonoptokephalliokinklopeleiolagoiosiraiobaphetraganopterygon",
     "episodes": 1
    },
    {
     "slug": "merveilleuses",
     "name": "Merveilleuses",
     "language": "French",
     "category": "word",
     "original": "Merveilleuses",
     "translation": "marvelouses",
     "episodes": 1
    },
    {
     "slug": "daleks",
     "name": "Daleks",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Lucentum",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "centum",
     "name": "centum",
     "language": "Latin",
     "category": "word",
     "original": "centum",
     "translation": "hundred",
     "episodes": 2
    }
   ]
  },
  {
   "query": "jabal",
   "total": 5,
   "offset": 0,
   "results": [
    {
     "slug": "caballero",
     "name": "caballero",
     "language": "Spanish",
     "category": "word",
     "original": "caballero",
     "translation": "knight",
     "episodes": 1
    },
    {
     "slug": "caballo",
     "name": "caballo",
     "language": "Spanish",
     "category": "word",
     "original": "caballo",
     "translation": "the horse",
     "episodes": 1
    },
    {
     "slug": "cabal",
     "name": "cabal",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "hullabaloo",
     "name": "hullabaloo",
     "language": "English",
     "category": "word",
     "episodes": 3
    }
   ]
  },
  {
   "query": "Adelheid",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "granatum",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "pomegranate",
     "name": "pomegranate",
     "language": "English",
     "category": "word",
     "episodes": 3
    }
   ]
  },
  {
   "query": "pomum granatum",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Constantine",
   "total": 3,
   "offset": 0,
   "results": [
    {
     "slug": "siege-of-constantinople",
     "name": "siege of Constantinople",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "container",
     "name": "container",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "constrained-writing",
     "name": "constrained writing",
     "language": "English",
     "category": "about-language",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Muhammad",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "muhammad",
     "name": "Muhammad",
     "language": "English",
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Christopher Columbus",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "christopher-columbus",
     "name": "Christopher Columbus",
     "language": "English",
     "category": "name",
     "episodes": 2
    }
   ]
  },
  {
   "query": "Gaelic",
   "total": 30,
   "offset": 0,
   "results": [
    {
     "slug": "gallic",
     "name": "Gallic",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "gesicht",
     "name": "Gesicht",
     "language": "German",
     "category": "word",
     "original": "Gesicht",
     "translation": "face",
     "episodes": 1
    },
    {
     "slug": "delicious",
     "name": "delicious",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "diegetic",
     "name": "diegetic",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Brythonic",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Welsh",
   "total": 7,
   "offset": 0,
   "results": [
    {
     "slug": "welsh",
     "name": "Welsh",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "welsh-flag",
     "name": "Welsh flag",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "belshazzar",
     "name": "Belshazzar",
     "language": null,
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "bowels",
     "name": "bowels",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Lake Ontario",
   "total": 1,
   "offset": 0,
   "results": [
    {
     "slug": "lake-tahoe",
     "name": "Lake Tahoe",
     "language": "English",
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "William Lamb",
   "total": 15,
   "offset": 0,
   "results": [
    {
     "slug": "william-camden",
     "name": "William Camden",
     "language": null,
     "category": "name",
     "episodes": 1
    },
    {
     "slug": "william-james",
     "name": "William James",
     "language": null,
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "william-barnes",
     "name": "William Barnes",
     "language": null,
     "category": "name",
     "episodes": 2
    },
    {
     "slug": "william-buckland",
     "name": "William Buckland",
     "language": null,
     "category": "name",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Duke of Wellington",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "mni",
   "total": 851,
   "offset": 0,
   "results": [
    {
     "slug": "amnis",
     "name": "amnis",
     "language": "Latin",
     "category": "word",
     "original": "amnis",
     "episodes": 1
    },
    {
     "slug": "omnes-omnibus",
     "name": "Omnès Omnibus",
     "language": "Latin",
     "category": "expression",
     "original": "Omnès Omnibus",
     "translation": "everything for everyone",
     "episodes": 1
    },
    {
     "slug": "alumni",
     "name": "alumni",
     "language": "English",
     "category": "word",
     "episodes": 1
    },
    {
     "slug": "damning",
     "name": "damning",
     "language": "English",
     "category": "word",
     "episodes": 1
    }
   ]
  },
  {
   "query": "Sebastos",
   "total": 0,
   "offset": 0,
   "results": []
  },
  {
   "query": "Tara",
   "total": 294,
   "offset": 0,
   "results": [
    {
     "slug": "ataraxia",
     "name": "ataraxia",
     "language": "Greek",
     "category": "word",
     "original": "ataraxia",
     "translation": "freedom from disturbance",
     "episodes": 1
    },
    {
     "slug": "petarader",
     "name": "pétarader",
     "language": "French",
     "category": "word",
     "original": "pétarader",
     "episodes": 1
    },
    {
     "slug": "avatar",
     "name": "avatar",
     "language": "English",
     "category": "word",
     "original": "avatara",
     "translation": "descent",
     "episodes": 1
    },
    {
     "slug": "albtraum",
     "name": "Albtraum",
     "language": "German",
     "category": "word",
     "original": "Albtraum",
     "translation": "elf dream",
     "episodes": 2
    }
   ]
  }
 ]
}
```

> Submitting the full list now, with Santiago glossed as "city" since the existing entry uses the given name, alternative place names like Nova Roma and Taybah given their own linked entries, and people mentioned only in a name's backstory treated as asides.

**→ submit** (call 14)

```json
{
 "entries": [
  {
   "entry": {
    "term": "polis",
    "original": null,
    "translation": "city",
    "language": "Greek",
    "category": "word"
   },
   "timestamp": "00:01:13",
   "role": "subject",
   "confidence": "high",
   "note": "Greek for city, hidden in many city names such as [[see:Constantinople]], [[see:Istanbul]], [[see:Naples]] and [[see:Tripoli]]; Rob jokes about 'undercover polis'."
  },
  {
   "entry": {
    "term": "Byzantium",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:58",
   "role": "subject",
   "confidence": "high",
   "note": "Greek settlement on the Bosphorus founded around 600 BC, supposedly named after legendary founder [[from?:Byzas]], or from a Thracian name; later renamed [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Byzas",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:02:06",
   "role": "aside",
   "confidence": "high",
   "note": "Legendary founder of [[see:Byzantium]], said to be the son of [[see:Poseidon]] and a nymph, after whom the city was supposedly named."
  },
  {
   "entry": {
    "term": "Nova Roma",
    "original": null,
    "translation": "New Rome",
    "language": "Latin",
    "category": "name"
   },
   "timestamp": "00:02:15",
   "role": "aside",
   "confidence": "high",
   "note": "Name meaning New Rome that Constantine gave to [[see:Byzantium]] before it became [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Constantinople",
    "original": null,
    "translation": "Constantine's city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:41",
   "role": "subject",
   "confidence": "high",
   "note": "Constantine's city, its ending from Greek [[from:polis]], city; earlier [[see:Byzantium]] and [[see:Nova Roma]], later [[see:Istanbul]]."
  },
  {
   "entry": {
    "term": "Istanbul",
    "original": null,
    "translation": null,
    "language": "Turkish",
    "category": "name"
   },
   "timestamp": "00:02:36",
   "role": "subject",
   "confidence": "high",
   "note": "Explained either as a shortening of [[from?:Constantinople]] or from medieval Greek [[from?:eis tin polin]], 'to the city', an everyday name for it; its -bul is [[from:polis]]."
  },
  {
   "entry": {
    "term": "Naples",
    "original": "Napoli",
    "translation": "new city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:03:46",
   "role": "subject",
   "confidence": "high",
   "note": "Italian Napoli, from Greek [[from:Neapolis]], new city, a settlement built near the older [[see:Palaeopolis]]; the area was earlier called [[see:Parthenope]]."
  },
  {
   "entry": {
    "term": "Palaeopolis",
    "original": null,
    "translation": "old town",
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:19",
   "role": "subject",
   "confidence": "low",
   "note": "The old settlement beside the new one that became [[see:Naples]]; its name means old town, with the palaeo- of paleontology."
  },
  {
   "entry": {
    "term": "Parthenope",
    "original": null,
    "translation": null,
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:10",
   "role": "aside",
   "confidence": "high",
   "note": "Early name of the area of [[see:Naples]], after one of the sirens of Greek mythology."
  },
  {
   "entry": {
    "term": "Sevastopol",
    "original": null,
    "translation": "venerable city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:41",
   "role": "subject",
   "confidence": "high",
   "note": "Means venerable city, from Greek [[from:Sebastos]], venerable, plus [[from:polis]]; the -pol suffix is common in Ukraine."
  },
  {
   "entry": {
    "term": "Minneapolis",
    "original": null,
    "translation": "city of water",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:50",
   "role": "subject",
   "confidence": "high",
   "note": "City of water, from Dakota [[from:mni]], water, plus Greek [[from:polis]]; US city names were covered in an earlier episode."
  },
  {
   "entry": {
    "term": "Tripoli",
    "original": null,
    "translation": "three cities",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:19",
   "role": "subject",
   "confidence": "high",
   "note": "Means three cities, the coastal settlements of Oea, Sabratha and Leptis Magna in the wider region of [[see:Tripolitania]]; from [[from:polis]]."
  },
  {
   "entry": {
    "term": "Tripolitania",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:29",
   "role": "aside",
   "confidence": "high",
   "note": "The wider region containing the three coastal settlements that gave [[see:Tripoli]] its name."
  },
  {
   "entry": {
    "term": "Budapest",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:38",
   "role": "subject",
   "confidence": "high",
   "note": "A city named after several cities, Buda, Óbuda and Pest, joined as a compound rather than a [[see:portmanteau]]; saying 'Budapesht' in English can sound pretentious."
  },
  {
   "slug": "paris",
   "timestamp": "00:06:42",
   "role": "aside",
   "confidence": "high",
   "note": "An established English name pronounced differently from the French, almost a different word."
  },
  {
   "entry": {
    "term": "Medina",
    "original": null,
    "translation": "the city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:09:43",
   "role": "subject",
   "confidence": "high",
   "note": "Saudi city whose name just means the city, also the word for an Arab city's old town; formerly Yathrib, renamed by [[see:Muhammad]]."
  },
  {
   "entry": {
    "term": "al-Madinah al-Munawwarah",
    "original": null,
    "translation": "the enlightened city",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:07",
   "role": "subject",
   "confidence": "low",
   "note": "The longer name of [[see:Medina]], meaning the enlightened city."
  },
  {
   "entry": {
    "term": "Taybah",
    "original": null,
    "translation": "the kind, the good",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:15",
   "role": "subject",
   "confidence": "low",
   "note": "A name [[see:Muhammad]] gave to [[see:Medina]], still used today, meaning the kind or the good."
  },
  {
   "entry": {
    "term": "Madinat an-Nabi",
    "original": null,
    "translation": "the city of the prophet",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:23",
   "role": "subject",
   "confidence": "low",
   "note": "A former name of [[see:Medina]], meaning the city of the prophet."
  },
  {
   "entry": {
    "term": "Algiers",
    "original": "al-Jazair",
    "translation": "the island, the peninsula",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:31",
   "role": "subject",
   "confidence": "low",
   "note": "Capital that gave its name to [[gave:Algeria]], from Arabic for the island or peninsula, the word also behind [[same-root:Al Jazeera]] and [[same-root:Algeciras]]."
  },
  {
   "entry": {
    "term": "Algeria",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:39",
   "role": "aside",
   "confidence": "high",
   "note": "Country named after its capital, [[from:Algiers]]."
  },
  {
   "entry": {
    "term": "Al Jazeera",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:47",
   "role": "aside",
   "confidence": "high",
   "note": "Arab television station whose name, the island or peninsula, is the same Arabic word as in [[same-root:Algiers]]."
  },
  {
   "entry": {
    "term": "Algeciras",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:10:55",
   "role": "subject",
   "confidence": "high",
   "note": "Place in southern Spain whose name, like [[same-root:Algiers]], comes from Arabic for the island or peninsula."
  },
  {
   "entry": {
    "term": "al-",
    "original": null,
    "translation": "the",
    "language": "Arabic",
    "category": "word-part"
   },
   "timestamp": "00:11:35",
   "role": "subject",
   "confidence": "high",
   "note": "The Arabic definite article, found at the start of many words and Spanish place names such as [[see:Almería]], [[see:Alicante]] and [[see:Algeciras]]."
  },
  {
   "entry": {
    "term": "Almería",
    "original": null,
    "translation": "the watchtower",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:51",
   "role": "subject",
   "confidence": "high",
   "note": "Coastal Spanish city from Arabic for the watchtower, a lookout over the sea, with the article [[from:al-]]."
  },
  {
   "entry": {
    "term": "Alicante",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:59",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Alakant, based on Latin [[from:Lucentum]], from Greek [[from:leukos]], white, as in [[same-root:leukemia]]."
  },
  {
   "entry": {
    "term": "leukemia",
    "original": null,
    "translation": "white blood",
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:12:16",
   "role": "aside",
   "confidence": "high",
   "note": "Means white blood, from Greek [[from:leukos]], white, the same root as in [[same-root:Alicante]]."
  },
  {
   "entry": {
    "term": "Guadalajara",
    "original": null,
    "translation": "valley of stones",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:12:36",
   "role": "subject",
   "confidence": "high",
   "note": "The Mexican city is named after the Spanish one, from Arabic [[from:wadi]], valley, meaning valley or river of stones."
  },
  {
   "entry": {
    "term": "Gibraltar",
    "original": "Jabal Tariq",
    "translation": "Tariq's mountain",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:13:08",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Jabal Tariq, the mountain of [[see:Tariq]], with jabal meaning mountain; controversially part of Britain, not Spain."
  },
  {
   "entry": {
    "term": "Tariq",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:14:25",
   "role": "aside",
   "confidence": "high",
   "note": "Berber commander whose mountain, Jabal Tariq, gave [[gave:Gibraltar]] its name."
  },
  {
   "entry": {
    "term": "beni",
    "original": null,
    "translation": "descendants of",
    "language": "Arabic",
    "category": "word-part"
   },
   "timestamp": "00:13:30",
   "role": "subject",
   "confidence": "high",
   "note": "Arabic for descendants of, found in Spanish place names such as [[see:Benidorm]] and [[see:Benicàssim]]."
  },
  {
   "entry": {
    "term": "Benidorm",
    "original": null,
    "translation": "descendants of Darim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "low",
   "note": "Spanish resort known to British tourists, from Arabic Banu Darim, descendants of Darim, with [[from:beni]]."
  },
  {
   "entry": {
    "term": "Benicàssim",
    "original": null,
    "translation": "descendants of Kasim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "high",
   "note": "Spanish resort whose name means descendants of Kasim, from Arabic [[from:beni]]."
  },
  {
   "entry": {
    "term": "Granada",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:14:33",
   "role": "subject",
   "confidence": "high",
   "note": "Its Arabic name may mean hill of strangers or pilgrims, but probably also relates to Latin for [[see?:pomegranate]], perhaps for its red soil and buildings."
  },
  {
   "slug": "pomegranate",
   "timestamp": "00:15:14",
   "role": "subject",
   "confidence": "high",
   "note": "From Latin pomum granatum, apple of many seeds; it gave [[gave:grenade]] and possibly influenced the name [[see?:Granada]]."
  },
  {
   "slug": "grenade",
   "timestamp": "00:15:22",
   "role": "subject",
   "confidence": "high",
   "note": "Powder-filled fragmenting bombs named after the [[from:pomegranate]] because they look like them."
  },
  {
   "slug": "orange-town",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "Like [[see:Granada]] and the pomegranate, its name and that of [[see:orange]] the fruit may have influenced each other."
  },
  {
   "slug": "orange",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "The fruit's name may have been influenced by the place [[see:Orange (town)]], or vice versa, as with [[see:Granada]] and the pomegranate."
  },
  {
   "entry": {
    "term": "Grenada",
    "original": "La Grenade",
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:16:19",
   "role": "subject",
   "confidence": "low",
   "note": "Caribbean island probably named after [[from?:Granada]]; the French kept the name as La Grenade; earlier Camerhogne, and Columbus's La Concepción."
  },
  {
   "entry": {
    "term": "Buenos Aires",
    "original": null,
    "translation": "good airs",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:17:13",
   "role": "subject",
   "confidence": "high",
   "note": "Not named for its air but after Santa Maria del Buen Ayre, the sailors' Madonna of [[from:Bonaria]], who brought fair winds."
  },
  {
   "entry": {
    "entry_placeholder": null
   }
  }
 ]
}
```

**← submit (error)**

```json
MCP error -32602: Input validation error: Invalid arguments for tool submit: Invalid input: expected string, received undefined at entries[40].entry.term
Invalid input: expected string, received undefined at entries[40].entry.original
Invalid input: expected string, received undefined at entries[40].entry.translation
Invalid input: expected string, received undefined at entries[40].entry.language
Invalid option: expected one of "word"|"name"|"expression"|"about-language"|"word-part" at entries[40].entry.category
Unrecognized key: "entry_placeholder" at entries[40].entry
Invalid input: expected string, received undefined at entries[40].timestamp
Invalid option: expected one of "subject"|"aside"|"mention" at entries[40].role
Invalid input: expected string, received undefined at entries[40].note
Invalid option: expected one of "high"|"low" at entries[40].confidence
```

I left a stray placeholder item in by mistake. Resubmitting the first half without it; I'll add the rest with `add`.

**→ submit** (call 15)

```json
{
 "entries": [
  {
   "entry": {
    "term": "polis",
    "original": null,
    "translation": "city",
    "language": "Greek",
    "category": "word"
   },
   "timestamp": "00:01:13",
   "role": "subject",
   "confidence": "high",
   "note": "Greek for city, hidden in many city names such as [[see:Constantinople]], [[see:Istanbul]], [[see:Naples]] and [[see:Tripoli]]; Rob jokes about 'undercover polis'."
  },
  {
   "entry": {
    "term": "Byzantium",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:58",
   "role": "subject",
   "confidence": "high",
   "note": "Greek settlement on the Bosphorus founded around 600 BC, supposedly named after legendary founder [[from?:Byzas]], or from a Thracian name; later renamed [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Byzas",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:02:06",
   "role": "aside",
   "confidence": "high",
   "note": "Legendary founder of [[see:Byzantium]], said to be the son of [[see:Poseidon]] and a nymph, after whom the city was supposedly named."
  },
  {
   "entry": {
    "term": "Nova Roma",
    "original": null,
    "translation": "New Rome",
    "language": "Latin",
    "category": "name"
   },
   "timestamp": "00:02:15",
   "role": "aside",
   "confidence": "high",
   "note": "Name meaning New Rome that Constantine gave to [[see:Byzantium]] before it became [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Constantinople",
    "original": null,
    "translation": "Constantine's city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:41",
   "role": "subject",
   "confidence": "high",
   "note": "Constantine's city, its ending from Greek [[from:polis]], city; earlier [[see:Byzantium]] and [[see:Nova Roma]], later [[see:Istanbul]]."
  },
  {
   "entry": {
    "term": "Istanbul",
    "original": null,
    "translation": null,
    "language": "Turkish",
    "category": "name"
   },
   "timestamp": "00:02:36",
   "role": "subject",
   "confidence": "high",
   "note": "Explained either as a shortening of [[from?:Constantinople]] or from medieval Greek [[from?:eis tin polin]], 'to the city', an everyday name for it; its -bul is [[from:polis]]."
  },
  {
   "entry": {
    "term": "Naples",
    "original": "Napoli",
    "translation": "new city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:03:46",
   "role": "subject",
   "confidence": "high",
   "note": "Italian Napoli, from Greek [[from:Neapolis]], new city, a settlement built near the older [[see:Palaeopolis]]; the area was earlier called [[see:Parthenope]]."
  },
  {
   "entry": {
    "term": "Palaeopolis",
    "original": null,
    "translation": "old town",
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:19",
   "role": "subject",
   "confidence": "low",
   "note": "The old settlement beside the new one that became [[see:Naples]]; its name means old town, with the palaeo- of paleontology."
  },
  {
   "entry": {
    "term": "Parthenope",
    "original": null,
    "translation": null,
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:10",
   "role": "aside",
   "confidence": "high",
   "note": "Early name of the area of [[see:Naples]], after one of the sirens of Greek mythology."
  },
  {
   "entry": {
    "term": "Sevastopol",
    "original": null,
    "translation": "venerable city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:41",
   "role": "subject",
   "confidence": "high",
   "note": "Means venerable city, from Greek [[from:Sebastos]], venerable, plus [[from:polis]]; the -pol suffix is common in Ukraine."
  },
  {
   "entry": {
    "term": "Minneapolis",
    "original": null,
    "translation": "city of water",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:50",
   "role": "subject",
   "confidence": "high",
   "note": "City of water, from Dakota [[from:mni]], water, plus Greek [[from:polis]]; US city names were covered in an earlier episode."
  },
  {
   "entry": {
    "term": "Tripoli",
    "original": null,
    "translation": "three cities",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:19",
   "role": "subject",
   "confidence": "high",
   "note": "Means three cities, the coastal settlements of Oea, Sabratha and Leptis Magna in the wider region of [[see:Tripolitania]]; from [[from:polis]]."
  },
  {
   "entry": {
    "term": "Tripolitania",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:29",
   "role": "aside",
   "confidence": "high",
   "note": "The wider region containing the three coastal settlements that gave [[see:Tripoli]] its name."
  },
  {
   "entry": {
    "term": "Budapest",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:38",
   "role": "subject",
   "confidence": "high",
   "note": "A city named after several cities, Buda, Óbuda and Pest, joined as a compound rather than a [[see:portmanteau]]; saying 'Budapesht' in English can sound pretentious."
  },
  {
   "slug": "paris",
   "timestamp": "00:06:42",
   "role": "aside",
   "confidence": "high",
   "note": "An established English name pronounced differently from the French, almost a different word."
  },
  {
   "entry": {
    "term": "Medina",
    "original": null,
    "translation": "the city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:09:43",
   "role": "subject",
   "confidence": "high",
   "note": "Saudi city whose name just means the city, also the word for an Arab city's old town; formerly Yathrib, renamed by [[see:Muhammad]]."
  },
  {
   "entry": {
    "term": "al-Madinah al-Munawwarah",
    "original": null,
    "translation": "the enlightened city",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:07",
   "role": "subject",
   "confidence": "low",
   "note": "The longer name of [[see:Medina]], meaning the enlightened city."
  },
  {
   "entry": {
    "term": "Taybah",
    "original": null,
    "translation": "the kind, the good",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:15",
   "role": "subject",
   "confidence": "low",
   "note": "A name [[see:Muhammad]] gave to [[see:Medina]], still used today, meaning the kind or the good."
  },
  {
   "entry": {
    "term": "Madinat an-Nabi",
    "original": null,
    "translation": "the city of the prophet",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:23",
   "role": "subject",
   "confidence": "low",
   "note": "A former name of [[see:Medina]], meaning the city of the prophet."
  },
  {
   "entry": {
    "term": "Algiers",
    "original": "al-Jazair",
    "translation": "the island, the peninsula",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:31",
   "role": "subject",
   "confidence": "low",
   "note": "Capital that gave its name to [[gave:Algeria]], from Arabic for the island or peninsula, the word also behind [[same-root:Al Jazeera]] and [[same-root:Algeciras]]."
  },
  {
   "entry": {
    "term": "Algeria",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:39",
   "role": "aside",
   "confidence": "high",
   "note": "Country named after its capital, [[from:Algiers]]."
  },
  {
   "entry": {
    "term": "Al Jazeera",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:47",
   "role": "aside",
   "confidence": "high",
   "note": "Arab television station whose name, the island or peninsula, is the same Arabic word as in [[same-root:Algiers]]."
  },
  {
   "entry": {
    "term": "Algeciras",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:10:55",
   "role": "subject",
   "confidence": "high",
   "note": "Place in southern Spain whose name, like [[same-root:Algiers]], comes from Arabic for the island or peninsula."
  },
  {
   "entry": {
    "term": "al-",
    "original": null,
    "translation": "the",
    "language": "Arabic",
    "category": "word-part"
   },
   "timestamp": "00:11:35",
   "role": "subject",
   "confidence": "high",
   "note": "The Arabic definite article, found at the start of many words and Spanish place names such as [[see:Almería]], [[see:Alicante]] and [[see:Algeciras]]."
  },
  {
   "entry": {
    "term": "Almería",
    "original": null,
    "translation": "the watchtower",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:51",
   "role": "subject",
   "confidence": "high",
   "note": "Coastal Spanish city from Arabic for the watchtower, a lookout over the sea, with the article [[from:al-]]."
  },
  {
   "entry": {
    "term": "Alicante",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:59",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Alakant, based on Latin [[from:Lucentum]], from Greek [[from:leukos]], white, as in [[same-root:leukemia]]."
  },
  {
   "entry": {
    "term": "leukemia",
    "original": null,
    "translation": "white blood",
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:12:16",
   "role": "aside",
   "confidence": "high",
   "note": "Means white blood, from Greek [[from:leukos]], white, the same root as in [[same-root:Alicante]]."
  },
  {
   "entry": {
    "term": "Guadalajara",
    "original": null,
    "translation": "valley of stones",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:12:36",
   "role": "subject",
   "confidence": "high",
   "note": "The Mexican city is named after the Spanish one, from Arabic [[from:wadi]], valley, meaning valley or river of stones."
  },
  {
   "entry": {
    "term": "Gibraltar",
    "original": "Jabal Tariq",
    "translation": "Tariq's mountain",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:13:08",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Jabal Tariq, the mountain of [[see:Tariq]], with jabal meaning mountain; controversially part of Britain, not Spain."
  },
  {
   "entry": {
    "term": "Tariq",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:14:25",
   "role": "aside",
   "confidence": "high",
   "note": "Berber commander whose mountain, Jabal Tariq, gave [[gave:Gibraltar]] its name."
  },
  {
   "entry": {
    "term": "beni",
    "original": null,
    "translation": "descendants of",
    "language": "Arabic",
    "category": "word-part"
   },
   "timestamp": "00:13:30",
   "role": "subject",
   "confidence": "high",
   "note": "Arabic for descendants of, found in Spanish place names such as [[see:Benidorm]] and [[see:Benicàssim]]."
  },
  {
   "entry": {
    "term": "Benidorm",
    "original": null,
    "translation": "descendants of Darim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "low",
   "note": "Spanish resort known to British tourists, from Arabic Banu Darim, descendants of Darim, with [[from:beni]]."
  },
  {
   "entry": {
    "term": "Benicàssim",
    "original": null,
    "translation": "descendants of Kasim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "high",
   "note": "Spanish resort whose name means descendants of Kasim, from Arabic [[from:beni]]."
  },
  {
   "entry": {
    "term": "Granada",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:14:33",
   "role": "subject",
   "confidence": "high",
   "note": "Its Arabic name may mean hill of strangers or pilgrims, but probably also relates to Latin for [[see?:pomegranate]], perhaps for its red soil and buildings."
  },
  {
   "slug": "pomegranate",
   "timestamp": "00:15:14",
   "role": "subject",
   "confidence": "high",
   "note": "From Latin pomum granatum, apple of many seeds; it gave [[gave:grenade]] and possibly influenced the name [[see?:Granada]]."
  },
  {
   "slug": "grenade",
   "timestamp": "00:15:22",
   "role": "subject",
   "confidence": "high",
   "note": "Powder-filled fragmenting bombs named after the [[from:pomegranate]] because they look like them."
  },
  {
   "slug": "orange-town",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "Like [[see:Granada]] and the pomegranate, its name and that of [[see:orange]] the fruit may have influenced each other."
  },
  {
   "slug": "orange",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "The fruit's name may have been influenced by the place [[see:Orange (town)]], or vice versa, as with [[see:Granada]] and the pomegranate."
  },
  {
   "entry": {
    "term": "Grenada",
    "original": "La Grenade",
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:16:19",
   "role": "subject",
   "confidence": "low",
   "note": "Caribbean island probably named after [[from?:Granada]]; the French kept the name as La Grenade; earlier Camerhogne, and Columbus's La Concepción."
  },
  {
   "entry": {
    "term": "Buenos Aires",
    "original": null,
    "translation": "good airs",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:17:13",
   "role": "subject",
   "confidence": "high",
   "note": "Not named for its air but after Santa Maria del Buen Ayre, the sailors' Madonna of [[from:Bonaria]], who brought fair winds."
  }
 ]
}
```

**← submit (error)**

```json
{
 "ok": false,
 "errors": [
  {
   "code": "entry-exists",
   "message": "Item 24: al already exists. Give \"slug\": \"al\" to add a mention of it, or a gloss if this is a different word."
  }
 ]
}
```

**→ entry** (call 16)

```json
{
 "slug": "al"
}
```

**← entry**

```json
{
 "ok": true,
 "slug": "al",
 "name": "al",
 "language": "Arabic",
 "category": "word",
 "original": "al",
 "translation": "the",
 "episodes": 2,
 "new": false,
 "homographs": [],
 "mentions": [
  {
   "episode_id": "L3Qepv4F5Yc",
   "episode": "Was an orange ever a \"norange\"? | PORTMANTEAUS & WORD MASHUPS",
   "date": "2024-05-22",
   "timestamp": "00:27:29",
   "role": "subject",
   "note": "The Arabic definite article; a word starting with al- of unclear origin is probably Arabic.",
   "confidence": "high"
  },
  {
   "episode_id": "7vwN3aiiBM4",
   "episode": "Words that are surprisingly from Arabic",
   "date": "2026-05-06",
   "timestamp": "00:03:29",
   "role": "subject",
   "note": "The Arabic definite article, still found at the start of many English loanwords such as [[see:alcove]], [[see:algebra]], [[see:alcohol]] and [[see:acton]].",
   "confidence": "high"
  }
 ],
 "backlinks": [
  {
   "slug": "acton",
   "name": "acton"
  },
  {
   "slug": "admiral",
   "name": "admiral"
  },
  {
   "slug": "albacore",
   "name": "albacore"
  },
  {
   "slug": "alcohol",
   "name": "alcohol"
  },
  {
   "slug": "alcoholic",
   "name": "alcoholic"
  },
  {
   "slug": "alcove",
   "name": "alcove"
  },
  {
   "slug": "alfalfa",
   "name": "alfalfa"
  },
  {
   "slug": "almanac",
   "name": "almanac"
  },
  {
   "slug": "azucar",
   "name": "azúcar"
  },
  {
   "slug": "elixir",
   "name": "elixir"
  }
 ]
}
```

Same thing (the Arabic article), so I'm reusing slug `al` and pointing the Almería link at "al".

**→ submit** (call 17)

```json
{
 "entries": [
  {
   "entry": {
    "term": "polis",
    "original": null,
    "translation": "city",
    "language": "Greek",
    "category": "word"
   },
   "timestamp": "00:01:13",
   "role": "subject",
   "confidence": "high",
   "note": "Greek for city, hidden in many city names such as [[see:Constantinople]], [[see:Istanbul]], [[see:Naples]] and [[see:Tripoli]]; Rob jokes about 'undercover polis'."
  },
  {
   "entry": {
    "term": "Byzantium",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:58",
   "role": "subject",
   "confidence": "high",
   "note": "Greek settlement on the Bosphorus founded around 600 BC, supposedly named after legendary founder [[from?:Byzas]], or from a Thracian name; later renamed [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Byzas",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:02:06",
   "role": "aside",
   "confidence": "high",
   "note": "Legendary founder of [[see:Byzantium]], said to be the son of [[see:Poseidon]] and a nymph, after whom the city was supposedly named."
  },
  {
   "entry": {
    "term": "Nova Roma",
    "original": null,
    "translation": "New Rome",
    "language": "Latin",
    "category": "name"
   },
   "timestamp": "00:02:15",
   "role": "aside",
   "confidence": "high",
   "note": "Name meaning New Rome that Constantine gave to [[see:Byzantium]] before it became [[see:Constantinople]]."
  },
  {
   "entry": {
    "term": "Constantinople",
    "original": null,
    "translation": "Constantine's city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:01:41",
   "role": "subject",
   "confidence": "high",
   "note": "Constantine's city, its ending from Greek [[from:polis]], city; earlier [[see:Byzantium]] and [[see:Nova Roma]], later [[see:Istanbul]]."
  },
  {
   "entry": {
    "term": "Istanbul",
    "original": null,
    "translation": null,
    "language": "Turkish",
    "category": "name"
   },
   "timestamp": "00:02:36",
   "role": "subject",
   "confidence": "high",
   "note": "Explained either as a shortening of [[from?:Constantinople]] or from medieval Greek [[from?:eis tin polin]], 'to the city', an everyday name for it; its -bul is [[from:polis]]."
  },
  {
   "entry": {
    "term": "Naples",
    "original": "Napoli",
    "translation": "new city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:03:46",
   "role": "subject",
   "confidence": "high",
   "note": "Italian Napoli, from Greek [[from:Neapolis]], new city, a settlement built near the older [[see:Palaeopolis]]; the area was earlier called [[see:Parthenope]]."
  },
  {
   "entry": {
    "term": "Palaeopolis",
    "original": null,
    "translation": "old town",
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:19",
   "role": "subject",
   "confidence": "low",
   "note": "The old settlement beside the new one that became [[see:Naples]]; its name means old town, with the palaeo- of paleontology."
  },
  {
   "entry": {
    "term": "Parthenope",
    "original": null,
    "translation": null,
    "language": "Greek",
    "category": "name"
   },
   "timestamp": "00:04:10",
   "role": "aside",
   "confidence": "high",
   "note": "Early name of the area of [[see:Naples]], after one of the sirens of Greek mythology."
  },
  {
   "entry": {
    "term": "Sevastopol",
    "original": null,
    "translation": "venerable city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:41",
   "role": "subject",
   "confidence": "high",
   "note": "Means venerable city, from Greek [[from:Sebastos]], venerable, plus [[from:polis]]; the -pol suffix is common in Ukraine."
  },
  {
   "entry": {
    "term": "Minneapolis",
    "original": null,
    "translation": "city of water",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:04:50",
   "role": "subject",
   "confidence": "high",
   "note": "City of water, from Dakota [[from:mni]], water, plus Greek [[from:polis]]; US city names were covered in an earlier episode."
  },
  {
   "entry": {
    "term": "Tripoli",
    "original": null,
    "translation": "three cities",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:19",
   "role": "subject",
   "confidence": "high",
   "note": "Means three cities, the coastal settlements of Oea, Sabratha and Leptis Magna in the wider region of [[see:Tripolitania]]; from [[from:polis]]."
  },
  {
   "entry": {
    "term": "Tripolitania",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:29",
   "role": "aside",
   "confidence": "high",
   "note": "The wider region containing the three coastal settlements that gave [[see:Tripoli]] its name."
  },
  {
   "entry": {
    "term": "Budapest",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:05:38",
   "role": "subject",
   "confidence": "high",
   "note": "A city named after several cities, Buda, Óbuda and Pest, joined as a compound rather than a [[see:portmanteau]]; saying 'Budapesht' in English can sound pretentious."
  },
  {
   "slug": "paris",
   "timestamp": "00:06:42",
   "role": "aside",
   "confidence": "high",
   "note": "An established English name pronounced differently from the French, almost a different word."
  },
  {
   "entry": {
    "term": "Medina",
    "original": null,
    "translation": "the city",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:09:43",
   "role": "subject",
   "confidence": "high",
   "note": "Saudi city whose name just means the city, also the word for an Arab city's old town; formerly Yathrib, renamed by [[see:Muhammad]]."
  },
  {
   "entry": {
    "term": "al-Madinah al-Munawwarah",
    "original": null,
    "translation": "the enlightened city",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:07",
   "role": "subject",
   "confidence": "low",
   "note": "The longer name of [[see:Medina]], meaning the enlightened city."
  },
  {
   "entry": {
    "term": "Taybah",
    "original": null,
    "translation": "the kind, the good",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:15",
   "role": "subject",
   "confidence": "low",
   "note": "A name [[see:Muhammad]] gave to [[see:Medina]], still used today, meaning the kind or the good."
  },
  {
   "entry": {
    "term": "Madinat an-Nabi",
    "original": null,
    "translation": "the city of the prophet",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:23",
   "role": "subject",
   "confidence": "low",
   "note": "A former name of [[see:Medina]], meaning the city of the prophet."
  },
  {
   "entry": {
    "term": "Algiers",
    "original": "al-Jazair",
    "translation": "the island, the peninsula",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:31",
   "role": "subject",
   "confidence": "low",
   "note": "Capital that gave its name to [[gave:Algeria]], from Arabic for the island or peninsula, the word also behind [[same-root:Al Jazeera]] and [[same-root:Algeciras]]."
  },
  {
   "entry": {
    "term": "Algeria",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:10:39",
   "role": "aside",
   "confidence": "high",
   "note": "Country named after its capital, [[from:Algiers]]."
  },
  {
   "entry": {
    "term": "Al Jazeera",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Arabic",
    "category": "name"
   },
   "timestamp": "00:10:47",
   "role": "aside",
   "confidence": "high",
   "note": "Arab television station whose name, the island or peninsula, is the same Arabic word as in [[same-root:Algiers]]."
  },
  {
   "entry": {
    "term": "Algeciras",
    "original": null,
    "translation": "the island, the peninsula",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:10:55",
   "role": "subject",
   "confidence": "high",
   "note": "Place in southern Spain whose name, like [[same-root:Algiers]], comes from Arabic for the island or peninsula."
  },
  {
   "slug": "al",
   "timestamp": "00:11:35",
   "role": "subject",
   "confidence": "high",
   "note": "The Arabic definite article, often seen at the start of Spanish place names such as [[see:Almería]], [[see:Alicante]] and [[see:Algeciras]], legacies of Arab rule."
  },
  {
   "entry": {
    "term": "Almería",
    "original": null,
    "translation": "the watchtower",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:51",
   "role": "subject",
   "confidence": "high",
   "note": "Coastal Spanish city from Arabic for the watchtower, a lookout over the sea, beginning with the article [[from:al]]."
  },
  {
   "entry": {
    "term": "Alicante",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:11:59",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Alakant, based on Latin [[from:Lucentum]], from Greek [[from:leukos]], white, as in [[same-root:leukemia]]."
  },
  {
   "entry": {
    "term": "leukemia",
    "original": null,
    "translation": "white blood",
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:12:16",
   "role": "aside",
   "confidence": "high",
   "note": "Means white blood, from Greek [[from:leukos]], white, the same root as in [[same-root:Alicante]]."
  },
  {
   "entry": {
    "term": "Guadalajara",
    "original": null,
    "translation": "valley of stones",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:12:36",
   "role": "subject",
   "confidence": "high",
   "note": "The Mexican city is named after the Spanish one, from Arabic [[from:wadi]], valley, meaning valley or river of stones."
  },
  {
   "entry": {
    "term": "Gibraltar",
    "original": "Jabal Tariq",
    "translation": "Tariq's mountain",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:13:08",
   "role": "subject",
   "confidence": "high",
   "note": "From Arabic Jabal Tariq, the mountain of [[see:Tariq]], with jabal meaning mountain; controversially part of Britain, not Spain."
  },
  {
   "entry": {
    "term": "Tariq",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:14:25",
   "role": "aside",
   "confidence": "high",
   "note": "Berber commander whose mountain, Jabal Tariq, gave [[gave:Gibraltar]] its name."
  },
  {
   "entry": {
    "term": "beni",
    "original": null,
    "translation": "descendants of",
    "language": "Arabic",
    "category": "word-part"
   },
   "timestamp": "00:13:30",
   "role": "subject",
   "confidence": "high",
   "note": "Arabic for descendants of, found in Spanish place names such as [[see:Benidorm]] and [[see:Benicàssim]]."
  },
  {
   "entry": {
    "term": "Benidorm",
    "original": null,
    "translation": "descendants of Darim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "low",
   "note": "Spanish resort known to British tourists, from Arabic Banu Darim, descendants of Darim, with [[from:beni]]."
  },
  {
   "entry": {
    "term": "Benicàssim",
    "original": null,
    "translation": "descendants of Kasim",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:13:38",
   "role": "subject",
   "confidence": "high",
   "note": "Spanish resort whose name means descendants of Kasim, from Arabic [[from:beni]]."
  },
  {
   "entry": {
    "term": "Granada",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:14:33",
   "role": "subject",
   "confidence": "high",
   "note": "Its Arabic name may mean hill of strangers or pilgrims, but probably also relates to Latin for [[see?:pomegranate]], perhaps for its red soil and buildings."
  },
  {
   "slug": "pomegranate",
   "timestamp": "00:15:14",
   "role": "subject",
   "confidence": "high",
   "note": "From Latin pomum granatum, apple of many seeds; it gave [[gave:grenade]] and possibly influenced the name [[see?:Granada]]."
  },
  {
   "slug": "grenade",
   "timestamp": "00:15:22",
   "role": "subject",
   "confidence": "high",
   "note": "Powder-filled fragmenting bombs named after the [[from:pomegranate]] because they look like them."
  },
  {
   "slug": "orange-town",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "Like [[see:Granada]] and the pomegranate, its name and that of [[see:orange]] the fruit may have influenced each other."
  },
  {
   "slug": "orange",
   "timestamp": "00:15:54",
   "role": "aside",
   "confidence": "high",
   "note": "The fruit's name may have been influenced by the place [[see:Orange (town)]], or vice versa, as with [[see:Granada]] and the pomegranate."
  },
  {
   "entry": {
    "term": "Grenada",
    "original": "La Grenade",
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:16:19",
   "role": "subject",
   "confidence": "low",
   "note": "Caribbean island probably named after [[from?:Granada]]; the French kept the name as La Grenade; earlier Camerhogne, and Columbus's La Concepción."
  },
  {
   "entry": {
    "term": "Buenos Aires",
    "original": null,
    "translation": "good airs",
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:17:13",
   "role": "subject",
   "confidence": "high",
   "note": "Not named for its air but after Santa Maria del Buen Ayre, the sailors' Madonna of [[from:Bonaria]], who brought fair winds."
  }
 ]
}
```

**← submit**

```json
{
 "ok": true,
 "mentions": 40,
 "new_entries": 34,
 "warnings": [
  {
   "code": "duplicate-spelling",
   "message": "algeria and almeria look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "granada and grenada look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "grenada and grenade look like duplicates: their spellings are one or two letters apart."
  }
 ],
 "links_to_existing": [
  {
   "in": "byzas",
   "target": "Poseidon",
   "leads_to": "poseidon",
   "name": "Poseidon",
   "category": "name",
   "first_note": "Competed with [[see:Athena]] for Athens by striking a saltwater spring with his trident, which the citizens couldn't drink."
  },
  {
   "in": "budapest",
   "target": "portmanteau",
   "leads_to": "portmanteau",
   "name": "portmanteau",
   "category": "about-language",
   "first_note": "From French [[from:porter]], to carry, and [[from:manteau]], mantle; once a servant carrying a king's robes, now a bag; [[see:Lewis Carroll]] applied it to blended words."
  },
  {
   "in": "medina",
   "target": "Muhammad",
   "leads_to": "muhammad",
   "name": "Muhammad",
   "category": "name",
   "first_note": "Top boys' name in England and Wales; with spellings Mohamed and Mohammed, transliterations of different ages, it has over twice the next name's total."
  },
  {
   "in": "taybah",
   "target": "Muhammad",
   "leads_to": "muhammad",
   "name": "Muhammad",
   "category": "name",
   "first_note": "Top boys' name in England and Wales; with spellings Mohamed and Mohammed, transliterations of different ages, it has over twice the next name's total."
  }
 ]
}
```

The existing Muhammad entry is the given name, not the Prophet, so I'm unlinking it in two notes. The spelling warnings (Algeria/Almería, Granada/Grenada/grenade) are different things, so they stay.

**→ edit** (call 18)

```json
{
 "slug": "medina",
 "fields": {
  "note": "Saudi city whose name just means the city, also the word for an Arab city's old town; formerly Yathrib, renamed by the Prophet Muhammad."
 }
}
```

**→ edit** (call 19)

```json
{
 "slug": "taybah",
 "fields": {
  "note": "A name the Prophet Muhammad gave to [[see:Medina]], still used today, meaning the kind or the good."
 }
}
```

**← edit**

```json
{
 "ok": true,
 "mentions": 40,
 "new_entries": 34,
 "warnings": [
  {
   "code": "duplicate-spelling",
   "message": "algeria and almeria look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "granada and grenada look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "grenada and grenade look like duplicates: their spellings are one or two letters apart."
  }
 ]
}
```

**← edit**

```json
{
 "ok": true,
 "mentions": 40,
 "new_entries": 34,
 "warnings": [
  {
   "code": "duplicate-spelling",
   "message": "algeria and almeria look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "granada and grenada look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "grenada and grenade look like duplicates: their spellings are one or two letters apart."
  }
 ]
}
```

Now adding the second half: South America, Australia, New Zealand and Canada.

**→ add** (call 20)

```json
{
 "entries": [
  {
   "entry": {
    "term": "Bonaria",
    "original": null,
    "translation": "good air",
    "language": "Italian",
    "category": "name"
   },
   "timestamp": "00:17:46",
   "role": "subject",
   "confidence": "high",
   "note": "Hilltop in Cagliari, Sardinia, with clearer air than below, its name the opposite of [[see:malaria]]; its Madonna, bringer of fair winds, gave [[gave:Buenos Aires]] its name."
  },
  {
   "entry": {
    "term": "malaria",
    "original": null,
    "translation": "bad air",
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:18:02",
   "role": "aside",
   "confidence": "high",
   "note": "Disease whose name means bad air, the opposite of [[see:Bonaria]], good air."
  },
  {
   "entry": {
    "term": "Santiago",
    "gloss": "city",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:19:05",
   "role": "subject",
   "confidence": "high",
   "note": "One of many South American cities named after saints, here St James the Great; compare the given name [[see:Santiago]]."
  },
  {
   "entry": {
    "term": "São Paulo",
    "original": null,
    "translation": "St Paul",
    "language": "Portuguese",
    "category": "name"
   },
   "timestamp": "00:19:14",
   "role": "subject",
   "confidence": "high",
   "note": "Brazil's biggest city, though not its capital, named in Portuguese after St Paul."
  },
  {
   "entry": {
    "term": "Rio de Janeiro",
    "original": null,
    "translation": "River of January",
    "language": "Portuguese",
    "category": "name"
   },
   "timestamp": "00:19:26",
   "role": "subject",
   "confidence": "high",
   "note": "River of January: supposedly the Portuguese landed on 1 January 1502 and mistook [[see:Guanabara Bay]] for a river mouth; locals pronounce it roughly 'Hu-janeiro'."
  },
  {
   "entry": {
    "term": "Guanabara Bay",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:20:03",
   "role": "aside",
   "confidence": "high",
   "note": "Bay supposedly mistaken by Portuguese navigators for the mouth of a river, giving [[gave:Rio de Janeiro]] its name."
  },
  {
   "entry": {
    "term": "Bogotá",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:21:40",
   "role": "subject",
   "confidence": "low",
   "note": "From the Chibcha name Bacatá, usually interpreted as the walling of the farmland; English speakers rarely stress the final A as in Spanish."
  },
  {
   "entry": {
    "term": "Lima",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:22:18",
   "role": "subject",
   "confidence": "low",
   "note": "From Quechua limaq, speaker or talker, referring to an oracle in the Rímac valley; Spanish pronunciation shifted it to Limac and then Lima."
  },
  {
   "entry": {
    "term": "Mexico",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:22:40",
   "role": "subject",
   "confidence": "low",
   "note": "Possibly named after Mexico City; the X, now an H sound in Spanish, was once a sh sound; the Aztec name for the area was [[see:Tenochtitlan]]."
  },
  {
   "entry": {
    "term": "Tenochtitlan",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:22:49",
   "role": "aside",
   "confidence": "low",
   "note": "The Aztec name for the area of [[see:Mexico]] City."
  },
  {
   "entry": {
    "term": "Perth",
    "gloss": "Australia",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:24:48",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[from:Perth (Scotland)]] for [[see:George Murray]], picked by [[see:James Stirling]]; its Noongar name, Boorloo, is widely used."
  },
  {
   "entry": {
    "term": "Perth",
    "gloss": "Scotland",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:26:20",
   "role": "subject",
   "confidence": "high",
   "note": "From a [[see:Pictish]] word meaning wood or copse, related to Welsh [[same-root:perth (Welsh)]], hedge or thicket; it gave its name to [[gave:Perth (Australia)]]."
  },
  {
   "entry": {
    "term": "perth",
    "gloss": "Welsh",
    "original": null,
    "translation": "hedge, thicket",
    "language": "Welsh",
    "category": "word"
   },
   "timestamp": "00:26:33",
   "role": "aside",
   "confidence": "high",
   "note": "Welsh for hedge or thicket, related to the [[see:Pictish]] word behind [[same-root:Perth (Scotland)]]."
  },
  {
   "entry": {
    "term": "George Murray",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:24:56",
   "role": "aside",
   "confidence": "high",
   "note": "British MP and Secretary of State for War and the Colonies from Perthshire, in whose honour [[see:Perth (Australia)]] was named."
  },
  {
   "entry": {
    "term": "James Stirling",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:25:05",
   "role": "aside",
   "confidence": "high",
   "note": "Captain who chose the name [[see:Perth (Australia)]] when establishing the colony."
  },
  {
   "entry": {
    "term": "Pictish",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:22",
   "role": "subject",
   "confidence": "high",
   "note": "Language of the Picts, probably [[see:Brittonic]], unlike the [[see:Goidelic]] [[see:Scottish Gaelic]]; source of the name [[gave:Perth (Scotland)]]."
  },
  {
   "entry": {
    "term": "Brittonic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:42",
   "role": "aside",
   "confidence": "high",
   "note": "Branch of the Celtic languages to which [[see:Pictish]] probably belonged, unlike [[see:Goidelic]]."
  },
  {
   "entry": {
    "term": "Scottish Gaelic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:50",
   "role": "aside",
   "confidence": "high",
   "note": "The Celtic language of Scotland, a [[see:Goidelic]] language, not to be confused with [[see:Pictish]]."
  },
  {
   "entry": {
    "term": "Goidelic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:50",
   "role": "aside",
   "confidence": "high",
   "note": "The branch of Celtic, distinct from [[see:Brittonic]], to which [[see:Scottish Gaelic]] belongs."
  },
  {
   "entry": {
    "term": "Melbourne",
    "gloss": "England",
    "original": null,
    "translation": "mill stream",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:27:14",
   "role": "subject",
   "confidence": "high",
   "note": "Derbyshire village near Rob's home, locally pronounced 'Melbun', meaning mill stream; it gave its title to the Viscount after whom [[see:Melbourne (Australia)]] is named."
  },
  {
   "entry": {
    "term": "Melbourne",
    "gloss": "Australia",
    "original": null,
    "translation": "mill stream",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:27:26",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:William Lamb]], Viscount Melbourne; earlier called [[see:Batmania]], [[see:Bareberp]] and Bearbrass; its Indigenous name is [[see:Naarm]]."
  },
  {
   "entry": {
    "term": "William Lamb",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:27:27",
   "role": "aside",
   "confidence": "high",
   "note": "Second Viscount Melbourne, named after [[see:Melbourne (England)]], and after whom [[see:Melbourne (Australia)]] was named."
  },
  {
   "entry": {
    "term": "Batmania",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:29:44",
   "role": "subject",
   "confidence": "high",
   "note": "Brief name of [[see:Melbourne (Australia)]], after co-founder [[see:John Batman]]; it sounds like a Batman comic."
  },
  {
   "entry": {
    "term": "John Batman",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:29:53",
   "role": "aside",
   "confidence": "high",
   "note": "Co-founder of [[see:Melbourne (Australia)]], briefly called [[see:Batmania]] after him."
  },
  {
   "entry": {
    "term": "Bareberp",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:29:53",
   "role": "subject",
   "confidence": "low",
   "note": "Temporary name of [[see:Melbourne (Australia)]], spelt like 'bear' and 'burp' put together, alongside Bearbrass; an example of Australian humour in naming."
  },
  {
   "entry": {
    "term": "Dutigalla",
    "original": null,
    "translation": "tribe",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:30:27",
   "role": "subject",
   "confidence": "low",
   "note": "Suggested name for [[see:Melbourne (Australia)]], what the local Aboriginal people called themselves, meaning tribe."
  },
  {
   "entry": {
    "term": "bourne",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "word-part"
   },
   "timestamp": "00:30:56",
   "role": "subject",
   "confidence": "high",
   "note": "Place-name element meaning a river or spring, as in [[see:Melbourne (England)]], mill stream; related to German Brunnen in [[same-root:Gesundbrunnen]]."
  },
  {
   "entry": {
    "term": "Gesundbrunnen",
    "original": null,
    "translation": "health spring",
    "language": "German",
    "category": "name"
   },
   "timestamp": "00:31:01",
   "role": "subject",
   "confidence": "high",
   "note": "Area of Berlin where Rob lives, meaning health spring or spa; its Brunnen is related to English [[same-root:bourne]]."
  },
  {
   "entry": {
    "term": "Bruinen",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:21",
   "role": "aside",
   "confidence": "low",
   "note": "River in The Lord of the Rings, surely an Anglo-Saxon reference to springs like [[see:bourne]]."
  },
  {
   "entry": {
    "term": "Naarm",
    "original": null,
    "translation": "the bay",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:36",
   "role": "subject",
   "confidence": "high",
   "note": "Indigenous name for [[see:Melbourne (Australia)]], meaning the bay."
  },
  {
   "entry": {
    "term": "Sydney",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:31:42",
   "role": "subject",
   "confidence": "high",
   "note": "Named in 1788 by [[see:Arthur Phillip]] after Home Secretary [[see:Thomas Townshend]], Viscount Sydney; nearly called [[see:Albion]]; the cove was Warrane, the territory Gadi."
  },
  {
   "entry": {
    "term": "Thomas Townshend",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:50",
   "role": "aside",
   "confidence": "high",
   "note": "First Viscount Sydney, British Home Secretary at the time of colonisation, after whom [[see:Sydney]] was named."
  },
  {
   "entry": {
    "term": "Arthur Phillip",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:50",
   "role": "aside",
   "confidence": "high",
   "note": "Captain and first governor who named [[see:Sydney]] in 1788 and nearly called it [[see:Albion]]."
  },
  {
   "slug": "albion",
   "timestamp": "00:32:21",
   "role": "subject",
   "confidence": "high",
   "note": "Latin name for Britain, thought to come from albus, white, maybe for the white cliffs; nearly the name of [[see:Sydney]]."
  },
  {
   "entry": {
    "term": "Canberra",
    "original": null,
    "translation": "meeting place",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:32:38",
   "role": "subject",
   "confidence": "high",
   "note": "Australia's chosen capital, probably from an Aboriginal name meaning meeting place; rejected names included [[see:Kangaremu]], [[see:Meladneyperbane]] and [[see:Sydmeladperbrisho]]."
  },
  {
   "entry": {
    "term": "King O'Malley",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:33:27",
   "role": "aside",
   "confidence": "low",
   "note": "MP who argued that cold climates produce the greatest geniuses, influencing the chilly site chosen for [[see:Canberra]]."
  },
  {
   "entry": {
    "term": "Kangaremu",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:33:43",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]], a cross of kangaroo and emu."
  },
  {
   "entry": {
    "term": "Meladneyperbane",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:06",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]], blending Melbourne, Adelaide, Sydney, Perth and Brisbane."
  },
  {
   "entry": {
    "term": "Sydmeladperbrisho",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:21",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]] blending Sydney, Melbourne, Adelaide, Perth, Brisbane and Hobart; not even a good [[see:portmanteau]]."
  },
  {
   "entry": {
    "term": "Brisbane",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:58",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:Thomas Brisbane]], governor of New South Wales from 1821 to 1825; also known as [[see:Meanjin]]."
  },
  {
   "entry": {
    "term": "Thomas Brisbane",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:35:08",
   "role": "aside",
   "confidence": "high",
   "note": "Governor of New South Wales from 1821 to 1825, after whom [[see:Brisbane]] is named."
  },
  {
   "entry": {
    "term": "Meanjin",
    "original": null,
    "translation": "spike of land",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:35:16",
   "role": "subject",
   "confidence": "low",
   "note": "Name for [[see:Brisbane]] in a local language, meaning spike of land."
  },
  {
   "entry": {
    "term": "Adelaide",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:35:24",
   "role": "subject",
   "confidence": "high",
   "note": "Named after William IV's wife Queen Adelaide, whose name is from German [[from:Adelheid]], nobleness, the -heid akin to English -hood."
  },
  {
   "entry": {
    "term": "Darwin",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:35:38",
   "role": "subject",
   "confidence": "high",
   "note": "Named after the port named for [[see:Charles Darwin]] by a Beagle crew member; the city was originally Palmerston, after Lord Palmerston."
  },
  {
   "slug": "charles-darwin",
   "timestamp": "00:35:40",
   "role": "aside",
   "confidence": "high",
   "note": "Naturalist after whom the port and city of [[see:Darwin]] are named, as are dozens of species."
  },
  {
   "entry": {
    "term": "Tāmaki Makaurau",
    "original": null,
    "translation": "Tāmaki desired by many",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:36:26",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Auckland]]: Makaurau means desired by many, for its rich soil and two harbours; Tāmaki may refer to the isthmus or a chief's son."
  },
  {
   "entry": {
    "term": "Auckland",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:37:45",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:George Eden]], Earl of Auckland, the local governor's patron; its Māori name is [[see:Tāmaki Makaurau]]."
  },
  {
   "entry": {
    "term": "George Eden",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:37:50",
   "role": "aside",
   "confidence": "high",
   "note": "Earl of Auckland, former governor general of India and patron of the local governor, after whom [[see:Auckland]] is named."
  },
  {
   "entry": {
    "term": "Te Whanganui-a-Tara",
    "original": null,
    "translation": "the great harbour of Tara",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:38:03",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Wellington]], the great harbour of Tara, a chief's son sent south to find fertile land who settled the harbour."
  },
  {
   "entry": {
    "term": "Wellington",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:38:24",
   "role": "subject",
   "confidence": "high",
   "note": "Named after Arthur Wellesley, first Duke of Wellington; its Māori name is [[see:Te Whanganui-a-Tara]]."
  },
  {
   "entry": {
    "term": "Christchurch",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:38:30",
   "role": "subject",
   "confidence": "high",
   "note": "Named after Christ Church, Oxford, where many of the [[see:Canterbury Association]] colonists studied; its Māori name is [[see:Ōtautahi]]."
  },
  {
   "entry": {
    "term": "Canterbury Association",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:38:42",
   "role": "aside",
   "confidence": "high",
   "note": "Organisation set up to colonise part of New Zealand, many of whose members went to Christ Church, Oxford, hence [[see:Christchurch]]."
  },
  {
   "entry": {
    "term": "Ōtautahi",
    "original": null,
    "translation": "place of Tautahi",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:38:59",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Christchurch]], meaning place of Tautahi."
  },
  {
   "slug": "dunedin",
   "timestamp": "00:39:08",
   "role": "subject",
   "confidence": "high",
   "note": "Based on the Scottish Gaelic name for [[from:Edinburgh]], Dùn Èideann, chosen instead of New Edinburgh; its Māori name is [[see:Ōtepoti]]."
  },
  {
   "slug": "edinburgh",
   "timestamp": "00:39:08",
   "role": "aside",
   "confidence": "high",
   "note": "Its Scottish Gaelic name, Dùn Èideann, gave New Zealand's [[gave:Dunedin]] its name; the etymology of Edinburgh was covered in an earlier episode."
  },
  {
   "entry": {
    "term": "Ōtepoti",
    "original": null,
    "translation": "place of Tapoti",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:39:32",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Dunedin]], meaning place of Tapoti."
  }
 ]
}
```

**← add (error)**

```json
{
 "ok": false,
 "errors": [
  {
   "code": "timestamp-not-in-transcript",
   "message": "Darwin: no transcript line starts at 00:35:38; the nearest lines start at 00:35:32 and 00:35:40."
  }
 ]
}
```

Darwin's timestamp was wrong: its discussion starts on the 00:35:32 line. Adelaide and Meanjin also start one line earlier than I gave, so I'm correcting all three and resending.

**→ add** (call 21)

```json
{
 "entries": [
  {
   "entry": {
    "term": "Bonaria",
    "original": null,
    "translation": "good air",
    "language": "Italian",
    "category": "name"
   },
   "timestamp": "00:17:46",
   "role": "subject",
   "confidence": "high",
   "note": "Hilltop in Cagliari, Sardinia, with clearer air than below, its name the opposite of [[see:malaria]]; its Madonna, bringer of fair winds, gave [[gave:Buenos Aires]] its name."
  },
  {
   "entry": {
    "term": "malaria",
    "original": null,
    "translation": "bad air",
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:18:02",
   "role": "aside",
   "confidence": "high",
   "note": "Disease whose name means bad air, the opposite of [[see:Bonaria]], good air."
  },
  {
   "entry": {
    "term": "Santiago",
    "gloss": "city",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:19:05",
   "role": "subject",
   "confidence": "high",
   "note": "One of many South American cities named after saints, here St James the Great; compare the given name [[see:Santiago]]."
  },
  {
   "entry": {
    "term": "São Paulo",
    "original": null,
    "translation": "St Paul",
    "language": "Portuguese",
    "category": "name"
   },
   "timestamp": "00:19:14",
   "role": "subject",
   "confidence": "high",
   "note": "Brazil's biggest city, though not its capital, named in Portuguese after St Paul."
  },
  {
   "entry": {
    "term": "Rio de Janeiro",
    "original": null,
    "translation": "River of January",
    "language": "Portuguese",
    "category": "name"
   },
   "timestamp": "00:19:26",
   "role": "subject",
   "confidence": "high",
   "note": "River of January: supposedly the Portuguese landed on 1 January 1502 and mistook [[see:Guanabara Bay]] for a river mouth; locals pronounce it roughly 'Hu-janeiro'."
  },
  {
   "entry": {
    "term": "Guanabara Bay",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:20:03",
   "role": "aside",
   "confidence": "high",
   "note": "Bay supposedly mistaken by Portuguese navigators for the mouth of a river, giving [[gave:Rio de Janeiro]] its name."
  },
  {
   "entry": {
    "term": "Bogotá",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:21:40",
   "role": "subject",
   "confidence": "low",
   "note": "From the Chibcha name Bacatá, usually interpreted as the walling of the farmland; English speakers rarely stress the final A as in Spanish."
  },
  {
   "entry": {
    "term": "Lima",
    "original": null,
    "translation": null,
    "language": "Spanish",
    "category": "name"
   },
   "timestamp": "00:22:18",
   "role": "subject",
   "confidence": "low",
   "note": "From Quechua limaq, speaker or talker, referring to an oracle in the Rímac valley; Spanish pronunciation shifted it to Limac and then Lima."
  },
  {
   "entry": {
    "term": "Mexico",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:22:40",
   "role": "subject",
   "confidence": "low",
   "note": "Possibly named after Mexico City; the X, now an H sound in Spanish, was once a sh sound; the Aztec name for the area was [[see:Tenochtitlan]]."
  },
  {
   "entry": {
    "term": "Tenochtitlan",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:22:49",
   "role": "aside",
   "confidence": "low",
   "note": "The Aztec name for the area of [[see:Mexico]] City."
  },
  {
   "entry": {
    "term": "Perth",
    "gloss": "Australia",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:24:48",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[from:Perth (Scotland)]] for [[see:George Murray]], picked by [[see:James Stirling]]; its Noongar name, Boorloo, is widely used."
  },
  {
   "entry": {
    "term": "Perth",
    "gloss": "Scotland",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:26:20",
   "role": "subject",
   "confidence": "high",
   "note": "From a [[see:Pictish]] word meaning wood or copse, related to Welsh [[same-root:perth (Welsh)]], hedge or thicket; it gave its name to [[gave:Perth (Australia)]]."
  },
  {
   "entry": {
    "term": "perth",
    "gloss": "Welsh",
    "original": null,
    "translation": "hedge, thicket",
    "language": "Welsh",
    "category": "word"
   },
   "timestamp": "00:26:33",
   "role": "aside",
   "confidence": "high",
   "note": "Welsh for hedge or thicket, related to the [[see:Pictish]] word behind [[same-root:Perth (Scotland)]]."
  },
  {
   "entry": {
    "term": "George Murray",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:24:56",
   "role": "aside",
   "confidence": "high",
   "note": "British MP and Secretary of State for War and the Colonies from Perthshire, in whose honour [[see:Perth (Australia)]] was named."
  },
  {
   "entry": {
    "term": "James Stirling",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:25:05",
   "role": "aside",
   "confidence": "high",
   "note": "Captain who chose the name [[see:Perth (Australia)]] when establishing the colony."
  },
  {
   "entry": {
    "term": "Pictish",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:22",
   "role": "subject",
   "confidence": "high",
   "note": "Language of the Picts, probably [[see:Brittonic]], unlike the [[see:Goidelic]] [[see:Scottish Gaelic]]; source of the name [[gave:Perth (Scotland)]]."
  },
  {
   "entry": {
    "term": "Brittonic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:42",
   "role": "aside",
   "confidence": "high",
   "note": "Branch of the Celtic languages to which [[see:Pictish]] probably belonged, unlike [[see:Goidelic]]."
  },
  {
   "entry": {
    "term": "Scottish Gaelic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:50",
   "role": "aside",
   "confidence": "high",
   "note": "The Celtic language of Scotland, a [[see:Goidelic]] language, not to be confused with [[see:Pictish]]."
  },
  {
   "entry": {
    "term": "Goidelic",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "about-language"
   },
   "timestamp": "00:26:50",
   "role": "aside",
   "confidence": "high",
   "note": "The branch of Celtic, distinct from [[see:Brittonic]], to which [[see:Scottish Gaelic]] belongs."
  },
  {
   "entry": {
    "term": "Melbourne",
    "gloss": "England",
    "original": null,
    "translation": "mill stream",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:27:14",
   "role": "subject",
   "confidence": "high",
   "note": "Derbyshire village near Rob's home, locally pronounced 'Melbun', meaning mill stream; it gave its title to the Viscount after whom [[see:Melbourne (Australia)]] is named."
  },
  {
   "entry": {
    "term": "Melbourne",
    "gloss": "Australia",
    "original": null,
    "translation": "mill stream",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:27:26",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:William Lamb]], Viscount Melbourne; earlier called [[see:Batmania]], [[see:Bareberp]] and Bearbrass; its Indigenous name is [[see:Naarm]]."
  },
  {
   "entry": {
    "term": "William Lamb",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:27:27",
   "role": "aside",
   "confidence": "high",
   "note": "Second Viscount Melbourne, named after [[see:Melbourne (England)]], and after whom [[see:Melbourne (Australia)]] was named."
  },
  {
   "entry": {
    "term": "Batmania",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:29:44",
   "role": "subject",
   "confidence": "high",
   "note": "Brief name of [[see:Melbourne (Australia)]], after co-founder [[see:John Batman]]; it sounds like a Batman comic."
  },
  {
   "entry": {
    "term": "John Batman",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:29:53",
   "role": "aside",
   "confidence": "high",
   "note": "Co-founder of [[see:Melbourne (Australia)]], briefly called [[see:Batmania]] after him."
  },
  {
   "entry": {
    "term": "Bareberp",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:29:53",
   "role": "subject",
   "confidence": "low",
   "note": "Temporary name of [[see:Melbourne (Australia)]], spelt like 'bear' and 'burp' put together, alongside Bearbrass; an example of Australian humour in naming."
  },
  {
   "entry": {
    "term": "Dutigalla",
    "original": null,
    "translation": "tribe",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:30:27",
   "role": "subject",
   "confidence": "low",
   "note": "Suggested name for [[see:Melbourne (Australia)]], what the local Aboriginal people called themselves, meaning tribe."
  },
  {
   "entry": {
    "term": "bourne",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "word-part"
   },
   "timestamp": "00:30:56",
   "role": "subject",
   "confidence": "high",
   "note": "Place-name element meaning a river or spring, as in [[see:Melbourne (England)]], mill stream; related to German Brunnen in [[same-root:Gesundbrunnen]]."
  },
  {
   "entry": {
    "term": "Gesundbrunnen",
    "original": null,
    "translation": "health spring",
    "language": "German",
    "category": "name"
   },
   "timestamp": "00:31:01",
   "role": "subject",
   "confidence": "high",
   "note": "Area of Berlin where Rob lives, meaning health spring or spa; its Brunnen is related to English [[same-root:bourne]]."
  },
  {
   "entry": {
    "term": "Bruinen",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:21",
   "role": "aside",
   "confidence": "low",
   "note": "River in The Lord of the Rings, surely an Anglo-Saxon reference to springs like [[see:bourne]]."
  },
  {
   "entry": {
    "term": "Naarm",
    "original": null,
    "translation": "the bay",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:36",
   "role": "subject",
   "confidence": "high",
   "note": "Indigenous name for [[see:Melbourne (Australia)]], meaning the bay."
  },
  {
   "entry": {
    "term": "Sydney",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:31:42",
   "role": "subject",
   "confidence": "high",
   "note": "Named in 1788 by [[see:Arthur Phillip]] after Home Secretary [[see:Thomas Townshend]], Viscount Sydney; nearly called [[see:Albion]]; the cove was Warrane, the territory Gadi."
  },
  {
   "entry": {
    "term": "Thomas Townshend",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:50",
   "role": "aside",
   "confidence": "high",
   "note": "First Viscount Sydney, British Home Secretary at the time of colonisation, after whom [[see:Sydney]] was named."
  },
  {
   "entry": {
    "term": "Arthur Phillip",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:31:50",
   "role": "aside",
   "confidence": "high",
   "note": "Captain and first governor who named [[see:Sydney]] in 1788 and nearly called it [[see:Albion]]."
  },
  {
   "slug": "albion",
   "timestamp": "00:32:21",
   "role": "subject",
   "confidence": "high",
   "note": "Latin name for Britain, thought to come from albus, white, maybe for the white cliffs; nearly the name of [[see:Sydney]]."
  },
  {
   "entry": {
    "term": "Canberra",
    "original": null,
    "translation": "meeting place",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:32:38",
   "role": "subject",
   "confidence": "high",
   "note": "Australia's chosen capital, probably from an Aboriginal name meaning meeting place; rejected names included [[see:Kangaremu]], [[see:Meladneyperbane]] and [[see:Sydmeladperbrisho]]."
  },
  {
   "entry": {
    "term": "King O'Malley",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:33:27",
   "role": "aside",
   "confidence": "low",
   "note": "MP who argued that cold climates produce the greatest geniuses, influencing the chilly site chosen for [[see:Canberra]]."
  },
  {
   "entry": {
    "term": "Kangaremu",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:33:43",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]], a cross of kangaroo and emu."
  },
  {
   "entry": {
    "term": "Meladneyperbane",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:06",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]], blending Melbourne, Adelaide, Sydney, Perth and Brisbane."
  },
  {
   "entry": {
    "term": "Sydmeladperbrisho",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:21",
   "role": "subject",
   "confidence": "low",
   "note": "Proposed name for [[see:Canberra]] blending Sydney, Melbourne, Adelaide, Perth, Brisbane and Hobart; not even a good [[see:portmanteau]]."
  },
  {
   "entry": {
    "term": "Brisbane",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:34:58",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:Thomas Brisbane]], governor of New South Wales from 1821 to 1825; also known as [[see:Meanjin]]."
  },
  {
   "entry": {
    "term": "Thomas Brisbane",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:34:58",
   "role": "aside",
   "confidence": "high",
   "note": "Governor of New South Wales from 1821 to 1825, after whom [[see:Brisbane]] is named."
  },
  {
   "entry": {
    "term": "Meanjin",
    "original": null,
    "translation": "spike of land",
    "language": null,
    "category": "name"
   },
   "timestamp": "00:35:08",
   "role": "subject",
   "confidence": "low",
   "note": "Name for [[see:Brisbane]] in a local language, meaning spike of land."
  },
  {
   "entry": {
    "term": "Adelaide",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:35:16",
   "role": "subject",
   "confidence": "high",
   "note": "Named after William IV's wife Queen Adelaide, whose name is from German [[from:Adelheid]], nobleness, the -heid akin to English -hood."
  },
  {
   "entry": {
    "term": "Darwin",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:35:32",
   "role": "subject",
   "confidence": "high",
   "note": "Named after the port named for [[see:Charles Darwin]] by a Beagle crew member; the city was originally Palmerston, after Lord Palmerston."
  },
  {
   "slug": "charles-darwin",
   "timestamp": "00:35:40",
   "role": "aside",
   "confidence": "high",
   "note": "Naturalist after whom the port and city of [[see:Darwin]] are named, as are dozens of species."
  },
  {
   "entry": {
    "term": "Tāmaki Makaurau",
    "original": null,
    "translation": "Tāmaki desired by many",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:36:26",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Auckland]]: Makaurau means desired by many, for its rich soil and two harbours; Tāmaki may refer to the isthmus or a chief's son."
  },
  {
   "entry": {
    "term": "Auckland",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:37:45",
   "role": "subject",
   "confidence": "high",
   "note": "Named after [[see:George Eden]], Earl of Auckland, the local governor's patron; its Māori name is [[see:Tāmaki Makaurau]]."
  },
  {
   "entry": {
    "term": "George Eden",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:37:50",
   "role": "aside",
   "confidence": "high",
   "note": "Earl of Auckland, former governor general of India and patron of the local governor, after whom [[see:Auckland]] is named."
  },
  {
   "entry": {
    "term": "Te Whanganui-a-Tara",
    "original": null,
    "translation": "the great harbour of Tara",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:38:03",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Wellington]], the great harbour of Tara, a chief's son sent south to find fertile land who settled the harbour."
  },
  {
   "entry": {
    "term": "Wellington",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:38:24",
   "role": "subject",
   "confidence": "high",
   "note": "Named after Arthur Wellesley, first Duke of Wellington; its Māori name is [[see:Te Whanganui-a-Tara]]."
  },
  {
   "entry": {
    "term": "Christchurch",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:38:30",
   "role": "subject",
   "confidence": "high",
   "note": "Named after Christ Church, Oxford, where many of the [[see:Canterbury Association]] colonists studied; its Māori name is [[see:Ōtautahi]]."
  },
  {
   "entry": {
    "term": "Canterbury Association",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:38:42",
   "role": "aside",
   "confidence": "high",
   "note": "Organisation set up to colonise part of New Zealand, many of whose members went to Christ Church, Oxford, hence [[see:Christchurch]]."
  },
  {
   "entry": {
    "term": "Ōtautahi",
    "original": null,
    "translation": "place of Tautahi",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:38:59",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Christchurch]], meaning place of Tautahi."
  },
  {
   "slug": "dunedin",
   "timestamp": "00:39:08",
   "role": "subject",
   "confidence": "high",
   "note": "Based on the Scottish Gaelic name for [[from:Edinburgh]], Dùn Èideann, chosen instead of New Edinburgh; its Māori name is [[see:Ōtepoti]]."
  },
  {
   "slug": "edinburgh",
   "timestamp": "00:39:08",
   "role": "aside",
   "confidence": "high",
   "note": "Its Scottish Gaelic name, Dùn Èideann, gave New Zealand's [[gave:Dunedin]] its name; the etymology of Edinburgh was covered in an earlier episode."
  },
  {
   "entry": {
    "term": "Ōtepoti",
    "original": null,
    "translation": "place of Tapoti",
    "language": "Māori",
    "category": "name"
   },
   "timestamp": "00:39:32",
   "role": "subject",
   "confidence": "low",
   "note": "Māori name for [[see:Dunedin]], meaning place of Tapoti."
  }
 ]
}
```

**← add**

```json
{
 "ok": true,
 "mentions": 96,
 "new_entries": 86,
 "warnings": [
  {
   "code": "duplicate-spelling",
   "message": "algeria and almeria look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "granada and grenada look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "grenada and grenade look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "homograph-unglossed",
   "message": "Santiago (city) is new, and its homograph Santiago (santiago) has no gloss. If they are different words, give santiago a gloss with set_gloss."
  }
 ],
 "possible_matches": {
  "santiago-city": [
   {
    "slug": "santiago",
    "name": "Santiago",
    "language": "Spanish",
    "category": "name",
    "original": "Santiago",
    "episodes": 1
   }
  ]
 },
 "links_to_existing": [
  {
   "in": "santiago-city",
   "target": "Santiago",
   "leads_to": "santiago",
   "name": "Santiago",
   "category": "name",
   "first_note": "A form of [[same-root:James]]."
  },
  {
   "in": "sydmeladperbrisho",
   "target": "portmanteau",
   "leads_to": "portmanteau",
   "name": "portmanteau",
   "category": "about-language",
   "first_note": "From French [[from:porter]], to carry, and [[from:manteau]], mantle; once a servant carrying a king's robes, now a bag; [[see:Lewis Carroll]] applied it to blended words."
  }
 ]
}
```

Santiago, the given name, is the plain sense and can stay unglossed (this matches the example in the instructions). Now the Canada and Italy entries.

**→ add** (call 22)

```json
{
 "entries": [
  {
   "entry": {
    "term": "Montreal",
    "original": null,
    "translation": "royal mountain",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:40:07",
   "role": "subject",
   "confidence": "high",
   "note": "Royal mountain, its spelling perhaps reaching French via Italian Monte Real, used by a Venetian geographer in 1556; earlier [[see:Ville-Marie]], also [[see:Mooniyang]] and [[see:Tiohtià:ke]]."
  },
  {
   "entry": {
    "term": "Ville-Marie",
    "original": null,
    "translation": "city of Mary",
    "language": "French",
    "category": "name"
   },
   "timestamp": "00:40:31",
   "role": "subject",
   "confidence": "high",
   "note": "Name French colonists gave [[see:Montreal]] in 1642, city of Mary, honouring the Virgin Mary."
  },
  {
   "entry": {
    "term": "Mooniyang",
    "original": null,
    "translation": "the first stopping place",
    "language": "Ojibwe",
    "category": "name"
   },
   "timestamp": "00:40:48",
   "role": "subject",
   "confidence": "low",
   "note": "Ojibwe name for [[see:Montreal]], meaning the first stopping place in the Ojibwe migration story."
  },
  {
   "entry": {
    "term": "Tiohtià:ke",
    "original": null,
    "translation": "where the group divided",
    "language": "Mohawk",
    "category": "name"
   },
   "timestamp": "00:41:06",
   "role": "subject",
   "confidence": "low",
   "note": "Mohawk name for [[see:Montreal]], abbreviating a phrase meaning where the group divided or parted ways, involving a turtle-shaped island where people rested."
  },
  {
   "entry": {
    "term": "Vancouver",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:41:38",
   "role": "subject",
   "confidence": "high",
   "note": "Named in 1886 after [[see:George Vancouver]], a Dutch-origin name, 'from [[from:Coevorden]]'; formerly [[see:Gastown]] and [[see:Granville]]; its Squamish name means place of many maple trees."
  },
  {
   "entry": {
    "term": "George Vancouver",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:41:38",
   "role": "aside",
   "confidence": "high",
   "note": "British naval officer who explored the area named [[see:Vancouver]] after him; his surname is Dutch, meaning from [[from:Coevorden]]."
  },
  {
   "entry": {
    "term": "Coevorden",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:41:55",
   "role": "aside",
   "confidence": "low",
   "note": "City in the Netherlands from which the Dutch surname behind [[gave:Vancouver]] comes."
  },
  {
   "entry": {
    "term": "Gastown",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:42:50",
   "role": "subject",
   "confidence": "high",
   "note": "Long-time name of [[see:Vancouver]], not from gas but after [[see:Gassy Jack]], whose tavern became a workers' gathering place."
  },
  {
   "entry": {
    "term": "Gassy Jack",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:42:58",
   "role": "aside",
   "confidence": "low",
   "note": "Jack Deighton, whose tavern near Hastings Mill in 1867 became a gathering place for workers, giving [[gave:Gastown]] its name."
  },
  {
   "entry": {
    "term": "Granville",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:43:24",
   "role": "subject",
   "confidence": "high",
   "note": "A former name of [[see:Vancouver]], after Lord Granville, Britain's Secretary of State for the Colonies; Rob's neighbour's cat shared the name."
  },
  {
   "entry": {
    "term": "Toronto",
    "gloss": null,
    "original": null,
    "translation": "where there are trees standing in the water",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:43:50",
   "role": "subject",
   "confidence": "high",
   "note": "From Mohawk for where there are trees standing in the water, describing Wendat fish weirs of saplings between Lake Simcoe and Lake Couchiching; [[unrelated:Taranto]]."
  },
  {
   "entry": {
    "term": "Ontario",
    "original": null,
    "translation": "beautiful lake",
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:45:05",
   "role": "subject",
   "confidence": "high",
   "note": "Means beautiful lake in Mohawk; the province is named after the lake, making [[see:Lake Ontario]] a tautology."
  },
  {
   "entry": {
    "term": "Lake Ontario",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "name"
   },
   "timestamp": "00:45:14",
   "role": "aside",
   "confidence": "high",
   "note": "A [[see:tautology]], since [[see:Ontario]] already means beautiful lake in Mohawk."
  },
  {
   "entry": {
    "term": "Taranto",
    "original": null,
    "translation": null,
    "language": "Italian",
    "category": "name"
   },
   "timestamp": "00:45:21",
   "role": "subject",
   "confidence": "high",
   "note": "Italian city named after [[from:Taras]], son of [[see:Poseidon]]; [[unrelated:Toronto]] despite the similar sound; it gave [[gave:tarantula]] and [[gave:tarantella]]."
  },
  {
   "entry": {
    "term": "Taras",
    "original": null,
    "translation": null,
    "language": null,
    "category": "name"
   },
   "timestamp": "00:45:37",
   "role": "aside",
   "confidence": "high",
   "note": "Greek mythological son of [[see:Poseidon]], after whom [[gave:Taranto]] is named."
  },
  {
   "entry": {
    "term": "tarantula",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:45:45",
   "role": "subject",
   "confidence": "high",
   "note": "Named after the Italian city of [[from:Taranto]]."
  },
  {
   "entry": {
    "term": "tarantella",
    "original": null,
    "translation": null,
    "language": "English",
    "category": "word"
   },
   "timestamp": "00:45:45",
   "role": "subject",
   "confidence": "high",
   "note": "A dance associated with the Italian city of [[from:Taranto]], like [[same-root:tarantula]]."
  }
 ]
}
```

**← add**

```json
{
 "ok": true,
 "mentions": 113,
 "new_entries": 103,
 "warnings": [
  {
   "code": "duplicate-spelling",
   "message": "algeria and almeria look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "granada and grenada look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "grenada and grenade look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "duplicate-spelling",
   "message": "tarantella and tarantula look like duplicates: their spellings are one or two letters apart."
  },
  {
   "code": "homograph-unglossed",
   "message": "Santiago (city) is new, and its homograph Santiago (santiago) has no gloss. If they are different words, give santiago a gloss with set_gloss."
  }
 ],
 "links_to_existing": [
  {
   "in": "lake-ontario",
   "target": "tautology",
   "leads_to": "tautology",
   "name": "tautology",
   "category": "about-language",
   "first_note": "Similar to a [[see:pleonasm]] but sometimes considered an error."
  },
  {
   "in": "taranto",
   "target": "Poseidon",
   "leads_to": "poseidon",
   "name": "Poseidon",
   "category": "name",
   "first_note": "Competed with [[see:Athena]] for Athens by striking a saltwater spring with his trident, which the citizens couldn't drink."
  },
  {
   "in": "taras",
   "target": "Poseidon",
   "leads_to": "poseidon",
   "name": "Poseidon",
   "category": "name",
   "first_note": "Competed with [[see:Athena]] for Athens by striking a saltwater spring with his trident, which the citizens couldn't drink."
  }
 ]
}
```

> The remaining warnings are all false positives (distinct words like Algeria/Almería, Granada/grenade, tarantella/tarantula, and Santiago as a given name). One real issue stands out though: the Virgin Mary entry is a cocktail with no gloss, so links to the Virgin Mary herself would mistakenly land on it.

**→ complain** (call 23)

```json
{
 "slug": "virgin-mary",
 "text": "This entry is the cocktail (non-alcoholic Bloody Mary) but has no gloss, so any [[see:Virgin Mary]] link meant for the mother of Jesus (e.g. in place-name episodes: Ville-Marie, Buenos Aires) would land here. Suggest gloss \"cocktail\"."
}
```

**← complain**

```json
{
 "ok": true,
 "complaints": 1
}
```

**→ finish** (call 24)

```json
{
 "retro": "Dense place-name episode, 113 mentions (103 new entries). Hard points:\n- \"Different names of one place get separate entries when the hosts explain each name\" makes episodes like this balloon. Medina got three extra entries (al-Madinah al-Munawwarah, Taybah, Madinat an-Nabi), and each NZ/Canadian city got its Māori or Indigenous name as an entry too. Names given without a meaning (Yathrib, Boorloo, Warrane, Bearbrass, Camerhogne, Palmerston) went in notes only. A rule of thumb for very long lists of alternative names would help.\n- Many Indigenous, Arabic and Māori names were badly garbled in the captions (\"Tamaki Makaru\", \"doag\", \"Kemili\", \"Dutagala\"). I reconstructed them with low confidence and left out the Squamish name for Vancouver because I couldn't recover it.\n- Language for city names is inconsistent: I used English for anglicised names (Naples, Algiers), the local language for names the hosts treat as foreign (Almería, Granada: Spanish; Istanbul: Turkish, because the hosts called it the Turkish form). Guidance for names used in both English and the local language would help.\n- Existing-name traps: Muhammad is the given-name entry (I unlinked it and wrote \"the Prophet Muhammad\"), Santiago is the given name (I created Santiago (city)), and Virgin Mary is a cocktail with no gloss (complained).\n- My first submit failed because of a stray item I left in; the second failed on the existing 'al' entry (the entry-exists error was helpful). The add tool rejecting a whole batch over one wrong timestamp meant resending about 55 items; an option to accept the valid items, or a timestamp check before submitting, would save effort.\n- People who only appear in a name's story (Byzas, George Murray, Thomas Townshend, George Eden...) are asides as the instructions say, but they add a lot of entries; whether names this minor should be entries or just note links is unclear."
}
```

**← finish**

```json
{
 "ok": true,
 "mentions": 113,
 "new_entries": 103
}
```

I've added the episode "How did cities get their names?" to the Wordhoard: 113 mentions, 103 of them new entries and 10 reusing existing ones.

**Coverage**
- **Mediterranean:** names built on Greek *polis* ("city"), from Constantinople, Istanbul and Naples to Sevastopol, Minneapolis and Tripoli. Also Budapest and Medina, plus Arabic place names in Spain:
  - Algiers and Algeciras ("the island");
  - Almería, Alicante and Guadalajara;
  - Gibraltar ("Tariq's mountain");
  - Benidorm and Benicàssim (Arabic *beni*, "descendants of");
  - Granada, tied to pomegranate and grenade.
- **Latin America:** Grenada, Buenos Aires (named after the Madonna of Bonaria in Sardinia), Santiago, São Paulo, Rio de Janeiro, Bogotá, Lima and Mexico.
- **Australia:**
  - Perth, with the Scottish Perth and the Pictish language;
  - Melbourne, with its joke names Batmania and Bareberp, and its Indigenous name Naarm;
  - Sydney and Canberra, with rejected names like Kangaremu and Sydmeladperbrisho;
  - Brisbane, Adelaide and Darwin.
- **New Zealand:** Auckland, Wellington, Christchurch and Dunedin, each with its Māori name as its own entry.
- **Canada and Italy:** Montreal, Vancouver (plus its old name Gastown, after Gassy Jack), Toronto and Ontario. Also Taranto and the two words named after it, tarantula and tarantella.

**Decisions worth checking**
- **Reused entries:** I reused existing entries for Paris, pomegranate, grenade, orange, Orange (town), al, Albion, Charles Darwin, Dunedin and Edinburgh.
- **Santiago:** the existing Santiago entry is the given name, so the city is a separate entry, "Santiago (city)". The given name stays without a gloss.
- **Muhammad:** the existing Muhammad entry is about the given name, so I wrote "the Prophet Muhammad" in the Medina and Taybah notes instead of linking to it.
- **Low confidence:** many names were garbled in the captions, so I reconstructed them and marked them low confidence. These include Tāmaki Makaurau, Tiohtià:ke, Mooniyang, Dutigalla, Bareberp and Meanjin.
- **Squamish name for Vancouver:** I couldn't recover it from the captions, so it is described only in Vancouver's note.
- **Warnings left standing:** the warnings that remain are about similar spellings (Algeria/Almería, Granada/Grenada/grenade, tarantella/tarantula). They are different things, so I kept them apart.

**Flagged for you**
- **Virgin Mary:** I filed a complaint because the existing entry is the cocktail but has no gloss, so links meant for the Virgin Mary herself would land on it.
- **Retrospective:** it covers the long lists of alternative city names this rule creates, how to choose the language for names used both in English and locally, and having to resend a whole batch over one wrong timestamp.

---

## Result

success: 25 turns, 24 tool calls, 6.3 minutes, $2.04.

I've added the episode "How did cities get their names?" to the Wordhoard: 113 mentions, 103 of them new entries and 10 reusing existing ones.

**Coverage**
- **Mediterranean:** names built on Greek *polis* ("city"), from Constantinople, Istanbul and Naples to Sevastopol, Minneapolis and Tripoli. Also Budapest and Medina, plus Arabic place names in Spain:
  - Algiers and Algeciras ("the island");
  - Almería, Alicante and Guadalajara;
  - Gibraltar ("Tariq's mountain");
  - Benidorm and Benicàssim (Arabic *beni*, "descendants of");
  - Granada, tied to pomegranate and grenade.
- **Latin America:** Grenada, Buenos Aires (named after the Madonna of Bonaria in Sardinia), Santiago, São Paulo, Rio de Janeiro, Bogotá, Lima and Mexico.
- **Australia:**
  - Perth, with the Scottish Perth and the Pictish language;
  - Melbourne, with its joke names Batmania and Bareberp, and its Indigenous name Naarm;
  - Sydney and Canberra, with rejected names like Kangaremu and Sydmeladperbrisho;
  - Brisbane, Adelaide and Darwin.
- **New Zealand:** Auckland, Wellington, Christchurch and Dunedin, each with its Māori name as its own entry.
- **Canada and Italy:** Montreal, Vancouver (plus its old name Gastown, after Gassy Jack), Toronto and Ontario. Also Taranto and the two words named after it, tarantula and tarantella.

**Decisions worth checking**
- **Reused entries:** I reused existing entries for Paris, pomegranate, grenade, orange, Orange (town), al, Albion, Charles Darwin, Dunedin and Edinburgh.
- **Santiago:** the existing Santiago entry is the given name, so the city is a separate entry, "Santiago (city)". The given name stays without a gloss.
- **Muhammad:** the existing Muhammad entry is about the given name, so I wrote "the Prophet Muhammad" in the Medina and Taybah notes instead of linking to it.
- **Low confidence:** many names were garbled in the captions, so I reconstructed them and marked them low confidence. These include Tāmaki Makaurau, Tiohtià:ke, Mooniyang, Dutigalla, Bareberp and Meanjin.
- **Squamish name for Vancouver:** I couldn't recover it from the captions, so it is described only in Vancouver's note.
- **Warnings left standing:** the warnings that remain are about similar spellings (Algeria/Almería, Granada/Grenada/grenade, tarantella/tarantula). They are different things, so I kept them apart.

**Flagged for you**
- **Virgin Mary:** I filed a complaint because the existing entry is the cocktail but has no gloss, so links meant for the Virgin Mary herself would land on it.
- **Retrospective:** it covers the long lists of alternative city names this rule creates, how to choose the language for names used both in English and locally, and having to resend a whole batch over one wrong timestamp.

