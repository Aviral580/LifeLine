// backend/src/utils/ranker.js

export const calculateEmergencyScore = (result, emergencyIntent) => {
 
  const relevance = result.relevanceScore || 0.5; 

  
  const authority = result.sourceTrustScore / 100;

  
  const publishedDate = new Date(result.publishedAt);
  const hoursOld = (new Date() - publishedDate) / (1000 * 60 * 60);
  let freshness = 0;
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