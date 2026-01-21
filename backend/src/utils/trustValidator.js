const OFFICIAL_DOMAINS = ['.gov.in', '.nic.in', '.gov', '.mil', '.edu', 'who.int', 'un.org'];
const SOCIAL_RUMOR_DOMAINS = ['facebook.com', 'instagram.com', 'reddit.com', 'twitter.com', 't.me', 'x.com'];
export const verifySourceAuthority = (url) => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    const isOfficial = OFFICIAL_DOMAINS.some(ext => domain.endsWith(ext));
    if (isOfficial) return 100;
    const isSocial = SOCIAL_RUMOR_DOMAINS.some(d => domain.includes(d));
    if (isSocial) return 20; 
    return 50;
  } catch (error) {
    return 30; 
  }
};