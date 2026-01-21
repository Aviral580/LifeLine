
import { verifySourceAuthority } from './trustValidator.js';

export const calculateEmergencyScore = (result) => {
  const relevance = result.relevanceScore || 0.5; 
  const dynamicTrustScore = verifySourceAuthority(result.url);
  const authority = dynamicTrustScore / 100;

  
  let freshness = 0.1; 
  const pubDateRaw = result.publishedAt || "";
  let hoursOld = 48;

  if (pubDateRaw.includes('hour')) {
    hoursOld = parseInt(pubDateRaw) || 1;
  } else if (pubDateRaw.includes('minute')) {
    hoursOld = 0.5;
  } else if (pubDateRaw.includes('day')) {
    hoursOld = (parseInt(pubDateRaw) || 1) * 24;
  } else {
    const pubDate = new Date(pubDateRaw);
    if (!isNaN(pubDate)) {
      hoursOld = (new Date() - pubDate) / (1000 * 60 * 60);
    }
  }

  if (hoursOld <= 1) freshness = 1.0;     
  else if (hoursOld <= 6) freshness = 0.8; 
  else if (hoursOld <= 24) freshness = 0.5;
  else freshness = 0.1;

  const agreement = result.crossSourceAgreement || 0.5;

  const finalScore = (
    (relevance * 0.40) + 
    (authority * 0.30) + 
    (freshness * 0.20) + 
    (agreement * 0.10)
  );

  return parseFloat((finalScore * 100).toFixed(2));
};