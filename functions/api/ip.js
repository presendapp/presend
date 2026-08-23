export async function onRequestGet(context) {
  const { request } = context;
  
  // Get the visitor's real IP from Cloudflare
  const clientIP = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown';
  
  try {
    // Call ipinfo.io from the server side (no CORS issues)
    const response = await fetch(`https://ipinfo.io/${clientIP}/json`, {
      headers: {
        'User-Agent': 'Presend/1.0 (https://presend.pages.dev)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Enrich with additional data
    const result = {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country,
      country_name: getCountryName(data.country),
      continent: getContinent(data.country),
      latitude: data.loc ? data.loc.split(',')[0] : null,
      longitude: data.loc ? data.loc.split(',')[1] : null,
      postal: data.postal,
      timezone: data.timezone,
      org: data.org,
      currency: getCurrency(data.country),
      language: getLanguage(data.country),
      is_eu: isEU(data.country),
      is_vpn: isVPN(data.org),
    };
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (e) {
    // Fallback: return at least the IP we detected
    return new Response(JSON.stringify({
      ip: clientIP,
      error: e.message,
      note: 'Geolocation service temporarily unavailable'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

function getCountryName(code) {
  const names = {
    US: 'United States', GB: 'United Kingdom', FR: 'France', DE: 'Germany',
    ES: 'Spain', IT: 'Italy', CA: 'Canada', AU: 'Australia', JP: 'Japan',
    BR: 'Brazil', IN: 'India', CN: 'China', RU: 'Russia', MX: 'Mexico',
    NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', SE: 'Sweden',
    NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland', AT: 'Austria',
    PT: 'Portugal', IE: 'Ireland', NZ: 'New Zealand', SG: 'Singapore',
    KR: 'South Korea', TW: 'Taiwan', HK: 'Hong Kong', AE: 'UAE', SA: 'Saudi Arabia',
    TR: 'Turkey', ZA: 'South Africa', EG: 'Egypt', NG: 'Nigeria', KE: 'Kenya',
    AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela',
    ID: 'Indonesia', MY: 'Malaysia', TH: 'Thailand', PH: 'Philippines', VN: 'Vietnam'
  };
  return names[code] || code;
}

function getContinent(code) {
  const continents = {
    AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe',
    NA: 'North America', OC: 'Oceania', SA: 'South America'
  };
  // Simplified mapping
  const mapping = {
    US: 'NA', CA: 'NA', MX: 'NA', BR: 'SA', AR: 'SA', CL: 'SA', CO: 'SA', PE: 'SA', VE: 'SA',
    GB: 'EU', FR: 'EU', DE: 'EU', ES: 'EU', IT: 'EU', NL: 'EU', BE: 'EU', CH: 'EU', SE: 'EU',
    NO: 'EU', DK: 'EU', FI: 'EU', PL: 'EU', AT: 'EU', PT: 'EU', IE: 'EU', RU: 'EU', TR: 'EU',
    CN: 'AS', JP: 'AS', IN: 'AS', KR: 'AS', TW: 'AS', HK: 'AS', SG: 'AS', ID: 'AS', MY: 'AS',
    TH: 'AS', PH: 'AS', VN: 'AS', AE: 'AS', SA: 'AS',
    AU: 'OC', NZ: 'OC',
    ZA: 'AF', EG: 'AF', NG: 'AF', KE: 'AF'
  };
  return continents[mapping[code]] || 'Unknown';
}

function getCurrency(code) {
  const currencies = {
    US: 'USD', GB: 'GBP', FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
    BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', SE: 'SEK', NO: 'NOK',
    DK: 'DKK', CH: 'CHF', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
    HR: 'EUR', SI: 'EUR', SK: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR',
    CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', IN: 'INR',
    BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', VE: 'VES',
    RU: 'RUB', TR: 'TRY', ZA: 'ZAR', EG: 'EGP', NG: 'NGN', KE: 'KES',
    SG: 'SGD', HK: 'HKD', TW: 'TWD', KR: 'KRW', TH: 'THB', MY: 'MYR',
    ID: 'IDR', PH: 'PHP', VN: 'VND', AE: 'AED', SA: 'SAR'
  };
  return currencies[code] || 'Unknown';
}

function getLanguage(code) {
  const languages = {
    US: 'en', GB: 'en', FR: 'fr', DE: 'de', ES: 'es', IT: 'it', PT: 'pt',
    NL: 'nl', BE: 'nl', AT: 'de', CH: 'de', SE: 'sv', NO: 'no', DK: 'da',
    FI: 'fi', PL: 'pl', IE: 'en', CA: 'en', AU: 'en', NZ: 'en',
    JP: 'ja', CN: 'zh', IN: 'hi', RU: 'ru', BR: 'pt', MX: 'es',
    AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es',
    TR: 'tr', ZA: 'en', EG: 'ar', NG: 'en', KE: 'en',
    SG: 'en', HK: 'zh', TW: 'zh', KR: 'ko', TH: 'th', MY: 'ms',
    ID: 'id', PH: 'en', VN: 'vi', AE: 'ar', SA: 'ar'
  };
  return languages[code] || 'en';
}

function isEU(code) {
  return ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(code);
}

function isVPN(org) {
  if (!org) return false;
  const vpnKeywords = ['VPN','Virtual Private Network','Proxy','Tor','Cloudflare','Fastly','Akamai'];
  return vpnKeywords.some(k => org.toLowerCase().includes(k.toLowerCase()));
}
