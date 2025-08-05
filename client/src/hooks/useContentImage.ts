
import { useQuery } from "@tanstack/react-query";

export const useContentImage = (imageid: string | null | undefined, fallbackImageLink?: string | null) => {
    return useQuery({
        queryKey: ['image', imageid, fallbackImageLink],
        queryFn: async () => {
            console.log('useContentImage called with imageid:', imageid, 'fallbackImageLink:', fallbackImageLink);
            
            if (!imageid && !fallbackImageLink) {
                console.log('No imageid or fallback provided, returning null');
                return null;
            }
            
            if (imageid) {
                // Check if imageid is already a direct URL
                if (imageid.startsWith('http://') || imageid.startsWith('https://')) {
                    console.log('imageid is a direct URL, using it directly:', imageid);
                    return imageid;
                }
                
                console.log('Looking for image record with id:', imageid);
                
                try {
                    const response = await fetch(`/api/images/${imageid}`);
                    
                    if (!response.ok) {
                        if (response.status === 404) {
                            console.log('Image not found, falling back to content imagelink:', fallbackImageLink);
                            return fallbackImageLink || null;
                        }
                        throw new Error('Failed to fetch image');
                    }
                    
                    const imageRecord = await response.json();
                    console.log('Image record found:', imageRecord);
                    
                    if (imageRecord?.imagelink) {
                        console.log('Using imagelink from image table:', imageRecord.imagelink);
                        return imageRecord.imagelink;
                    }
                    
                    console.log('No imagelink in image record, falling back to content imagelink:', fallbackImageLink);
                    return fallbackImageLink || null;
                } catch (error) {
                    console.error('Error fetching image record:', error);
                    console.log('Falling back to content imagelink:', fallbackImageLink);
                    return fallbackImageLink || null;
                }
            }
            
            // If no imageid but we have fallback, use it
            console.log('No imageid, using fallback imagelink:', fallbackImageLink);
            return fallbackImageLink || null;
        },
        enabled: !!(imageid || fallbackImageLink)
    });
};
