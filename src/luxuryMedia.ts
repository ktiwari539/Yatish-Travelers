/**
 * Editorial assets for the local visual review. These depict travel inspiration,
 * NOT Mateshwari's actual vehicles, customers, routes or completed bookings.
 * Free Unsplash-license photographs — inspect source pages before public launch.
 * External photos should be replaced with approved, locally-hosted media for production.
 */
const unsplash=(id:string,width=1600)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const luxuryMedia={
  hero:{
    src:unsplash('photo-1764269712999-e32acce1f277',2000),
    source:'https://unsplash.com/photos/white-suv-parked-on-a-dirt-road-at-sunset-7Ubc7YusS70',
    credit:'Fotógrafo Samuel Cruz',
    alt:'White SUV in golden-hour light, illustrating scenic travel'
  },
  mountains:{
    src:unsplash('photo-1761048167322-7db1321b796d',1600),
    source:'https://unsplash.com/photos/white-suv-drives-on-mountain-road-with-scenic-views-Bw_GF24BGyU',
    credit:'Rama Krushna Behera',
    alt:'A distant white SUV travelling a winding Himalayan mountain road'
  },
  airport:{
    src:unsplash('photo-1770466790208-48b1483b7e2b',1500),
    source:'https://unsplash.com/photos/people-walking-through-a-modern-airport-terminal-Wn5ViI6A5nc',
    credit:'Kelvin Zyteng',
    alt:'Architectural view of a bright modern airport terminal'
  },
  landscape:{
    src:unsplash('photo-1493246507139-91e8fad9978e',1600),
    source:'https://unsplash.com/',
    credit:'Unsplash landscape reference',
    alt:'Mountains and a peaceful lake at sunset'
  },
  forest:{
    src:unsplash('photo-1441974231531-c6227db76b6e',1600),
    source:'https://unsplash.com/',
    credit:'Unsplash forest reference',
    alt:'Sunlit forest and natural scenery'
  }
} as const;
