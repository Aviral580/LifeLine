

const OFFICIAL_DOMAINS = ['.gov.in', '.nic.in', '.gov', '.mil', '.edu'];


export const verifySourceAuthority = (url) => {
  try {
    const domain = new URL(url).hostname;
    
    
    const isOfficial = OFFICIAL_DOMAINS.some(ext => domain.endsWith(ext));
    
   
    return isOfficial ? 100 : 40;
  } catch (error) {
    return 30; 
  }
};