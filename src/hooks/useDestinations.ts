import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Destination, SavedDestination, UserSpin, TravelerType } from '@/types/destination';

export const useDestinations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([]);
  const [userSpins, setUserSpins] = useState<UserSpin[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch saved destinations
  const fetchSavedDestinations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_destinations')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved destinations:', error);
      } else {
        // Transform database records to match SavedDestination interface
        const transformedData: SavedDestination[] = (data || []).map(record => ({
          id: record.id,
          name: record.destination_name,
          country: record.country,
          city: record.city,
          latitude: record.latitude,
          longitude: record.longitude,
          tagline: record.tagline,
          budget_estimate: record.budget_estimate,
          best_time_to_visit: record.best_time_to_visit,
          visa_requirements: record.visa_requirements,
          activities: record.activities,
          user_id: record.user_id,
          saved_at: record.saved_at,
        }));
        setSavedDestinations(transformedData);
      }
    } catch (error) {
      console.error('Saved destinations fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user spins
  const fetchUserSpins = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_spins')
        .select('*')
        .eq('user_id', user.id)
        .order('spun_at', { ascending: false });

      if (error) {
        console.error('Error fetching user spins:', error);
      } else {
        setUserSpins(data || []);
      }
    } catch (error) {
      console.error('User spins fetch error:', error);
    }
  };

  // Save destination
  const saveDestination = async (destination: Destination) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save destinations.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_destinations')
        .insert({
          user_id: user.id,
          destination_name: destination.name,
          country: destination.country,
          city: destination.city,
          latitude: destination.latitude,
          longitude: destination.longitude,
          tagline: destination.tagline,
          budget_estimate: destination.budget_estimate,
          best_time_to_visit: destination.best_time_to_visit,
          visa_requirements: destination.visa_requirements,
          activities: destination.activities,
        });

      if (error) {
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "Destination Saved!",
          description: `${destination.name} has been added to your saved destinations.`,
        });
        fetchSavedDestinations(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Save destination error:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Record user spin
  const recordSpin = async (destinationName: string, travelerType?: TravelerType) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_spins')
        .insert({
          user_id: user.id,
          destination_name: destinationName,
          traveler_type: travelerType,
        });

      if (error) {
        console.error('Error recording spin:', error);
      } else {
        fetchUserSpins(); // Refresh the list
      }
    } catch (error) {
      console.error('Record spin error:', error);
    }
  };

  // Remove saved destination
  const removeSavedDestination = async (destinationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_destinations')
        .delete()
        .eq('id', destinationId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Remove Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "Destination Removed",
          description: "The destination has been removed from your saved list.",
        });
        fetchSavedDestinations(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Remove destination error:', error);
      toast({
        title: "Remove Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if destination is saved
  const isDestinationSaved = (destinationName: string): boolean => {
    return savedDestinations.some(dest => dest.name === destinationName);
  };

  useEffect(() => {
    if (user) {
      fetchSavedDestinations();
      fetchUserSpins();
    }
  }, [user]);

  return {
    savedDestinations,
    userSpins,
    loading,
    saveDestination,
    recordSpin,
    removeSavedDestination,
    isDestinationSaved,
    refetch: () => {
      fetchSavedDestinations();
      fetchUserSpins();
    },
  };
};
